/* =========================================================
   DATA LAYER — FIRESTORE (with graceful device fallback)

   This is the project's database layer. It talks to Firestore,
   which lives in the same `firebase` package the app already
   uses for authentication — no new dependencies.

   Every helper:
     1. tries Firestore first (cloud mode),
     2. mirrors successful reads/writes into a local device
        store so the app keeps working if Firestore is not yet
        provisioned or security rules block the request,
     3. falls back to that device store (device mode) and flips
        `getStoreMode()` to "device" so the UI can label where
        data currently lives. The UI never claims a cloud save
        that did not happen.

   Deploying Firestore + the rules in /firestore.rules keeps
   everything in cloud mode across users and devices.
========================================================= */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import type { User } from "firebase/auth";

/* ---------------------------------------------------------
   TYPES
--------------------------------------------------------- */

export type UserRole = "traveller" | "provider" | "authority";

export type ProviderType = "Homestay" | "Guide" | "Arts & Crafts";

export type ProviderProfile = {
  uid: string;
  email: string;
  name: string;
  location: string;
  type: ProviderType;
  languages: string;
  price: string;
  availability: string;
  about: string;
  rating: string;
  reviewCount: number;
};

export type TripPlan = {
  destinationId: string;
  destinationName: string;
  location: string;
  days: number;
  pace: "Relaxed" | "Balanced" | "Packed";
  highlights: string[];
  notes: string;
  updatedAt: string;
};

export type ReportStatus = "open" | "in-review" | "resolved";

export type CleanlinessReport = {
  id: string;
  problem: string;
  location: string;
  details: string;
  status: ReportStatus;
  votes: number;
  voters: string[];
  reporterEmail: string;
  officer: string;
  createdAt: string;
};

export type RequestStatus = "pending" | "accepted" | "declined";

export type TravellerRequest = {
  id: string;
  providerUid: string;
  providerName: string;
  providerType: ProviderType | "";
  travellerUid: string;
  travellerEmail: string;
  travellerName: string;
  date: string;
  guests: number;
  note: string;
  status: RequestStatus;
  createdAt: string;
};

export type ChatThread = {
  id: string;
  providerUid: string;
  travellerUid: string;
  travellerName: string;
  travellerEmail: string;
  subject: string;
};

export type ChatMessage = {
  id: string;
  from: "provider" | "traveller";
  name: string;
  text: string;
  createdAt: string;
};

export type Review = {
  id: string;
  providerUid: string;
  travellerUid: string;
  travellerEmail: string;
  rating: number;
  text: string;
  createdAt: string;
};

export type SafetyLog = {
  id: string;
  unit: string;
  note: string;
  byEmail: string;
  createdAt: string;
};

export type AuthoritySettings = {
  criticalThreshold: number;
};

/* ---------------------------------------------------------
   FIREBASE HANDLE (lazy so firebase.ts initialises first)
--------------------------------------------------------- */

let dbHandle: ReturnType<typeof getFirestore> | null = null;

function db() {
  if (!dbHandle) {
    dbHandle = getFirestore();
  }

  return dbHandle;
}

/* ---------------------------------------------------------
   MODE + DEVICE MIRROR
--------------------------------------------------------- */

export type StoreMode = "cloud" | "device";

let mode: StoreMode = "cloud";

const modeListeners = new Set<(next: StoreMode) => void>();

export function getStoreMode(): StoreMode {
  return mode;
}

export function onStoreModeChange(
  listener: (next: StoreMode) => void
): () => void {
  modeListeners.add(listener);

  return () => modeListeners.delete(listener);
}

function setMode(next: StoreMode) {
  if (mode === next) {
    return;
  }

  mode = next;

  modeListeners.forEach((listener) => listener(next));
}

type Table = Record<string, Record<string, unknown>>;

const LS_KEY = "travelboost.deviceStore.v1";

function readTables(): Table {
  try {
    const raw = window.localStorage.getItem(LS_KEY);

    return raw ? (JSON.parse(raw) as Table) : {};
  } catch {
    return {};
  }
}

function writeTables(tables: Table) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(tables));
  } catch {
    /* storage full or blocked — nothing further to do */
  }
}

function deviceGet<T>(table: string, id: string): T | null {
  const value = readTables()[table]?.[id];

  return value ? (value as T) : null;
}

function deviceSet(table: string, id: string, data: Record<string, unknown>) {
  const tables = readTables();

  tables[table] = {
    ...tables[table],
    [id]: { ...(tables[table]?.[id] ?? {}), ...data },
  };

  writeTables(tables);
}

function deviceList<T>(table: string): T[] {
  const rows = readTables()[table];

  return rows ? Object.values(rows) as T[] : [];
}

function deviceEntries<T>(table: string): Array<T & { _key: string }> {
  const rows = readTables()[table];

  return rows
    ? Object.entries(rows).map(
        ([key, value]) => ({ ...(value as T), _key: key })
      )
    : [];
}

function deviceRows<T extends { id?: string }>(
  table: string
): T[] {
  return deviceEntries<T>(table).map((row) => ({
    ...row,
    id: row.id ?? row._key,
  }));
}

function deviceId(): string {
  return `device-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/* mirror cloud docs into the device table so a later fallback
   still has fresh data */
function deviceMirror(
  table: string,
  rows: Array<{ id: string } & Record<string, unknown>>
) {
  const tables = readTables();

  tables[table] = {
    ...tables[table],
    ...Object.fromEntries(
      rows.map((row) => {
        const { id, ...rest } = row;

        return [id, rest];
      })
    ),
  };

  writeTables(tables);
}

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function iso(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (isRecord(value) && typeof value.toDate === "function") {
    try {
      return (value as unknown as Timestamp).toDate().toISOString();
    } catch {
      return "";
    }
  }

  return typeof value === "string" ? value : "";
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

export function storeErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;

  if (code === "permission-denied") {
    return "Firestore security rules blocked this operation. Deploy the rules from firestore.rules.";
  }

  return "The database is unreachable right now.";
}

/* ---------------------------------------------------------
   USERS / ROLES
--------------------------------------------------------- */

type UserDoc = {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
};

export async function ensureUserDoc(
  user: User,
  role: UserRole
): Promise<void> {
  const payload: UserDoc = {
    uid: user.uid,
    email: user.email ?? "",
    name: user.displayName ?? user.email ?? "Traveller",
    role,
  };

  deviceSet("users", user.uid, payload);

  try {
    await setDoc(doc(db(), "users", user.uid), payload, {
      merge: true,
    });
    setMode("cloud");
  } catch (error) {
    setMode("device");
    void storeErrorMessage(error);
  }
}

export async function fetchUserRole(uid: string): Promise<UserRole | null> {
  try {
    const snap = await getDoc(doc(db(), "users", uid));
    setMode("cloud");

    if (snap.exists()) {
      const data = snap.data() as Partial<UserDoc>;
      deviceSet("users", uid, data as Record<string, unknown>);

      if (data.role === "traveller" || data.role === "provider" || data.role === "authority") {
        return data.role;
      }
    }

    return null;
  } catch {
    setMode("device");

    const local = deviceGet<Partial<UserDoc>>("users", uid);

    if (local?.role === "traveller" || local?.role === "provider" || local?.role === "authority") {
      return local.role;
    }

    return null;
  }
}

/* ---------------------------------------------------------
   PROVIDER PROFILES  (also powers Homestay / Guide / Craft
   browsing — one honest collection, filtered by type)
--------------------------------------------------------- */

function normalizeProvider(id: string, raw: unknown): ProviderProfile {
  const data = isRecord(raw) ? raw : {};

  return {
    uid: text(data.uid, id),
    email: text(data.email),
    name: text(data.name, "Local Partner"),
    location: text(data.location),
    type: (text(data.type, "Homestay") as ProviderType),
    languages: text(data.languages),
    price: text(data.price),
    availability: text(data.availability, "Available"),
    about: text(data.about),
    rating: text(data.rating, "4.8"),
    reviewCount: num(data.reviewCount),
  };
}

export async function saveProviderProfile(
  uid: string,
  profile: Omit<ProviderProfile, "uid">
): Promise<ProviderProfile> {
  const payload = { ...profile, uid };

  deviceSet("providers", uid, payload);

  try {
    await setDoc(doc(db(), "providers", uid), payload, {
      merge: true,
    });
    setMode("cloud");
  } catch {
    /* the device mirror above already persisted — the
       store mode surfaces where the data lives */
    setMode("device");
  }

  return normalizeProvider(uid, payload);
}

export async function loadProviderProfile(
  uid: string
): Promise<ProviderProfile | null> {
  try {
    const snap = await getDoc(doc(db(), "providers", uid));
    setMode("cloud");

    if (!snap.exists()) {
      return deviceGet<ProviderProfile>("providers", uid);
    }

    deviceSet("providers", uid, snap.data());

    return normalizeProvider(uid, snap.data());
  } catch {
    setMode("device");

    return deviceGet<ProviderProfile>("providers", uid);
  }
}

export async function listProviders(
  type: ProviderType
): Promise<ProviderProfile[]> {
  let rows: ProviderProfile[];

  try {
    const snap = await getDocs(collection(db(), "providers"));
    setMode("cloud");

    rows = snap.docs.map((entry) =>
      normalizeProvider(entry.id, entry.data())
    );

    deviceMirror(
      "providers",
      rows.map((row) => ({ ...row, id: row.uid }))
    );
  } catch {
    setMode("device");
    rows = deviceList<ProviderProfile>("providers");
  }

  return rows
    .filter((provider) => provider.type === type && provider.uid)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/* ---------------------------------------------------------
   TRAVELLER REQUESTS  (booking / service requests)
--------------------------------------------------------- */

function normalizeRequest(id: string, raw: unknown): TravellerRequest {
  const data = isRecord(raw) ? raw : {};

  return {
    id,
    providerUid: text(data.providerUid),
    providerName: text(data.providerName),
    providerType: text(data.providerType) as ProviderProfile["type"] | "",
    travellerUid: text(data.travellerUid),
    travellerEmail: text(data.travellerEmail),
    travellerName: text(data.travellerName, "Traveller"),
    date: text(data.date),
    guests: num(data.guests, 1),
    note: text(data.note),
    status: text(data.status, "pending") as RequestStatus,
    createdAt: iso(data.createdAt),
  };
}

export async function hasPendingRequest(
  providerUid: string,
  travellerUid: string
): Promise<boolean> {
  const mine = deviceList<TravellerRequest>("requests").filter(
    (request) =>
      request.providerUid === providerUid &&
      request.travellerUid === travellerUid &&
      request.status === "pending"
  );

  if (mine.length > 0) {
    return true;
  }

  try {
    const snap = await getDocs(collection(db(), "requests"));

    return snap.docs
      .map((entry) => normalizeRequest(entry.id, entry.data()))
      .some(
        (request) =>
          request.providerUid === providerUid &&
          request.travellerUid === travellerUid &&
          request.status === "pending"
      );
  } catch {
    return false;
  }
}

export type NewRequestInput = {
  providerUid: string;
  providerName: string;
  providerType: ProviderType | "";
  travellerUid: string;
  travellerEmail: string;
  travellerName: string;
  date: string;
  guests: number;
  note: string;
};

export async function createRequest(
  input: NewRequestInput
): Promise<TravellerRequest> {
  const id = deviceId();

  const payload = {
    ...input,
    status: "pending" as RequestStatus,
    createdAt: new Date().toISOString(),
  };

  deviceSet("requests", id, payload);

  try {
    const ref = await addDoc(collection(db(), "requests"), {
      ...payload,
      createdAt: serverTimestamp(),
    });

    deviceSet("requests", ref.id, payload);
    setMode("cloud");

    return normalizeRequest(ref.id, payload);
  } catch (error) {
    setMode("device");
    void storeErrorMessage(error);

    return normalizeRequest(id, payload);
  }
}

export async function listRequestsForProvider(
  providerUid: string
): Promise<TravellerRequest[]> {
  let rows: TravellerRequest[];

  try {
    const snap = await getDocs(collection(db(), "requests"));
    setMode("cloud");

    rows = snap.docs.map((entry) =>
      normalizeRequest(entry.id, entry.data())
    );

    deviceMirror(
      "requests",
      rows.map((row) => ({ ...row }))
    );
  } catch {
    setMode("device");
    rows = deviceRows<TravellerRequest>("requests");
  }

  return rows
    .filter((request) => request.providerUid === providerUid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* Accept / Decline — verified inside the document update so a
   request cannot be handled twice (cloud uses a transaction). */
export async function listRequestsForTraveller(
  travellerUid: string
): Promise<TravellerRequest[]> {
  let rows: TravellerRequest[];

  try {
    const snap = await getDocs(collection(db(), "requests"));

    rows = snap.docs.map((entry) =>
      normalizeRequest(entry.id, entry.data())
    );
  } catch {
    rows = deviceRows<TravellerRequest>("requests");
  }

  return rows
    .filter((request) => request.travellerUid === travellerUid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function setRequestStatus(
  requestId: string,
  next: Exclude<RequestStatus, "pending">
): Promise<void> {
  const local = deviceGet<TravellerRequest>(
    "requests",
    requestId
  );

  const deviceOnly =
    getStoreMode() === "device" ||
    requestId.startsWith("device-");

  if (deviceOnly) {
    if (local && local.status !== "pending") {
      throw new Error(
        "This request has already been accepted or declined."
      );
    }

    deviceSet("requests", requestId, { status: next });

    return;
  }

  try {
    await runTransaction(db(), async (tx) => {
      const ref = doc(db(), "requests", requestId);
      const snap = await tx.get(ref);

      if (!snap.exists()) {
        throw new Error("This request no longer exists.");
      }

      if (snap.data()?.status !== "pending") {
        throw new Error(
          "This request has already been accepted or declined."
        );
      }

      tx.update(ref, {
        status: next,
        handledAt: serverTimestamp(),
      });
    });

    setMode("cloud");
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("accepted or declined") ||
        error.message.includes("no longer exists"))
    ) {
      throw error;
    }

    setMode("device");

    const current = deviceGet<TravellerRequest>(
      "requests",
      requestId
    );

    if (current && current.status !== "pending") {
      throw new Error(
        "This request has already been accepted or declined.",
        { cause: error }
      );
    }
  }

  deviceSet("requests", requestId, { status: next });
}

/* ---------------------------------------------------------
   REPORTS  (cleanliness problems ⇄ authority complaints)
--------------------------------------------------------- */

function normalizeReport(id: string, raw: unknown): CleanlinessReport {
  const data = isRecord(raw) ? raw : {};
  const voters = Array.isArray(data.voters)
    ? data.voters.filter((entry): entry is string => typeof entry === "string")
    : [];

  return {
    id,
    problem: text(data.problem, "Unspecified problem"),
    location: text(data.location),
    details: text(data.details),
    status: text(data.status, "open") as ReportStatus,
    votes: num(data.votes, voters.length),
    voters,
    reporterEmail: text(data.reporterEmail),
    officer: text(data.officer),
    createdAt: iso(data.createdAt),
  };
}

export type NewReportInput = {
  problem: string;
  location: string;
  details: string;
  reporterUid: string;
  reporterEmail: string;
};

export async function addReport(
  input: NewReportInput
): Promise<CleanlinessReport> {
  const id = deviceId();

  const payload = {
    problem: input.problem.trim(),
    location: input.location.trim(),
    details: input.details.trim(),
    reporterUid: input.reporterUid,
    reporterEmail: input.reporterEmail,
    status: "open" as ReportStatus,
    votes: 0,
    voters: [] as string[],
    officer: "",
    createdAt: new Date().toISOString(),
  };

  deviceSet("reports", id, payload);

  try {
    const ref = await addDoc(collection(db(), "reports"), {
      ...payload,
      createdAt: serverTimestamp(),
    });

    deviceSet("reports", ref.id, payload);
    setMode("cloud");

    return normalizeReport(ref.id, payload);
  } catch (error) {
    setMode("device");
    void storeErrorMessage(error);

    return normalizeReport(id, payload);
  }
}

export async function listReports(): Promise<CleanlinessReport[]> {
  let rows: CleanlinessReport[];

  try {
    const snap = await getDocs(collection(db(), "reports"));
    setMode("cloud");

    rows = snap.docs.map((entry) =>
      normalizeReport(entry.id, entry.data())
    );

    deviceMirror(
      "reports",
      rows.map((row) => ({ ...row }))
    );
  } catch {
    setMode("device");
    rows = deviceRows<CleanlinessReport>("reports");
  }

  return rows.sort((a, b) => {
    if (a.status !== b.status) {
      const order = { open: 0, "in-review": 1, resolved: 2 };

      return order[a.status] - order[b.status];
    }

    if (b.votes !== a.votes) {
      return b.votes - a.votes;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function toggleReportVote(
  reportId: string,
  uid: string
): Promise<{ voted: boolean; votes: number } | null> {
  const current =
    deviceGet<CleanlinessReport>("reports", reportId) ??
    (await listReports()).find((report) => report.id === reportId);

  if (!current) {
    return null;
  }

  const voted = !current.voters.includes(uid);
  const voters = voted
    ? [...current.voters, uid]
    : current.voters.filter((entry) => entry !== uid);
  const votes = Math.max(0, current.votes + (voted ? 1 : -1));

  try {
    await updateDoc(doc(db(), "reports", reportId), {
      voters,
      votes,
    });
    setMode("cloud");
  } catch {
    setMode("device");
  }

  deviceSet("reports", reportId, { voters, votes });

  return { voted, votes };
}

export async function markReport(
  reportId: string,
  patch: { status?: ReportStatus; officer?: string }
): Promise<void> {
  const current = deviceGet<CleanlinessReport>("reports", reportId) ?? {};

  try {
    await updateDoc(doc(db(), "reports", reportId), patch);
    setMode("cloud");
  } catch {
    setMode("device");
  }

  deviceSet("reports", reportId, { ...current, ...patch });
}

/* ---------------------------------------------------------
   TRIP PLANS  (Plan My Trip / Generate My Route)
--------------------------------------------------------- */

function normalizeTrip(raw: unknown): TripPlan | null {
  if (
    !isRecord(raw) ||
    typeof raw.destinationId !== "string" ||
    raw.destinationId.length === 0
  ) {
    return null;
  }

  return {
    destinationId: text(raw.destinationId),
    destinationName: text(raw.destinationName),
    location: text(raw.location),
    days: num(raw.days, 3),
    pace: text(raw.pace, "Balanced") as TripPlan["pace"],
    highlights: Array.isArray(raw.highlights)
      ? raw.highlights.filter(
          (entry): entry is string => typeof entry === "string"
        )
      : [],
    notes: text(raw.notes),
    updatedAt: iso(raw.updatedAt),
  };
}

export async function saveTrip(
  uid: string,
  plan: TripPlan
): Promise<TripPlan> {
  const payload: TripPlan = {
    ...plan,
    updatedAt: new Date().toISOString(),
  };

  deviceSet("trips", uid, payload);

  try {
    await setDoc(doc(db(), "trips", uid), payload, {
      merge: true,
    });
    setMode("cloud");
  } catch {
    setMode("device");
  }

  return payload;
}

export async function loadTrip(uid: string): Promise<TripPlan | null> {
  try {
    const snap = await getDoc(doc(db(), "trips", uid));
    setMode("cloud");

    if (snap.exists()) {
      deviceSet("trips", uid, snap.data());

      return normalizeTrip(snap.data());
    }

    const local = deviceGet<TripPlan>("trips", uid);

    return local ? normalizeTrip(local) : null;
  } catch {
    setMode("device");

    const local = deviceGet<TripPlan>("trips", uid);

    return local ? normalizeTrip(local) : null;
  }
}

export async function deleteTrip(uid: string): Promise<void> {
  try {
    const ref = doc(db(), "trips", uid);

    if ((await getDoc(ref)).exists()) {
      await updateDoc(ref, { destinationId: "" });
    }
  } catch {
    /* document may not exist yet — the local delete still runs */
  }

  const tables = readTables();

  if (tables.trips) {
    delete tables.trips[uid];
    writeTables(tables);
  }
}

/* ---------------------------------------------------------
   SAVED DESTINATIONS
--------------------------------------------------------- */

export async function loadSavedDestinations(
  uid: string
): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db(), "saves", uid));
    setMode("cloud");

    const raw = snap.exists()
      ? snap.data()
      : deviceGet("saves", uid);

    const ids = isRecord(raw) && Array.isArray(raw.ids)
      ? raw.ids.filter((entry): entry is string => typeof entry === "string")
      : [];

    return ids;
  } catch {
    setMode("device");

    const raw = deviceGet<{ ids?: unknown }>("saves", uid);

    return Array.isArray(raw?.ids)
      ? raw.ids.filter((entry): entry is string => typeof entry === "string")
      : [];
  }
}

export async function toggleSavedDestination(
  uid: string,
  destinationId: string
): Promise<string[]> {
  const current = new Set(await loadSavedDestinations(uid));

  if (current.has(destinationId)) {
    current.delete(destinationId);
  } else {
    current.add(destinationId);
  }

  const ids = Array.from(current);

  deviceSet("saves", uid, { ids });

  try {
    await setDoc(doc(db(), "saves", uid), { ids });
    setMode("cloud");
  } catch {
    setMode("device");
  }

  return ids;
}

/* ---------------------------------------------------------
   REVIEWS  (ratings feed the provider's average)
--------------------------------------------------------- */

function normalizeReview(id: string, raw: unknown): Review {
  const data = isRecord(raw) ? raw : {};

  return {
    id,
    providerUid: text(data.providerUid),
    travellerUid: text(data.travellerUid),
    travellerEmail: text(data.travellerEmail),
    rating: num(data.rating, 5),
    text: text(data.text),
    createdAt: iso(data.createdAt),
  };
}

export async function listReviews(
  providerUid: string
): Promise<Review[]> {
  let rows: Review[];

  try {
    const snap = await getDocs(collection(db(), "reviews"));
    setMode("cloud");

    rows = snap.docs.map((entry) =>
      normalizeReview(entry.id, entry.data())
    );

    deviceMirror(
      "reviews",
      rows.map((row) => ({ ...row }))
    );
  } catch {
    setMode("device");
    rows = deviceRows<Review>("reviews");
  }

  return rows
    .filter((review) => review.providerUid === providerUid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type NewReviewInput = {
  providerUid: string;
  travellerUid: string;
  travellerEmail: string;
  rating: number;
  text: string;
};

export async function addReview(
  input: NewReviewInput
): Promise<{ average: string; count: number }> {
  const id = deviceId();

  const payload = {
    ...input,
    createdAt: new Date().toISOString(),
  };

  deviceSet("reviews", id, payload);

  try {
    const ref = await addDoc(collection(db(), "reviews"), {
      ...payload,
      createdAt: serverTimestamp(),
    });

    deviceSet("reviews", ref.id, payload);
    setMode("cloud");
  } catch (error) {
    setMode("device");
    void storeErrorMessage(error);
  }

  const all = await listReviews(input.providerUid);

  const average =
    all.length > 0
      ? (
          all.reduce((sum, review) => sum + review.rating, 0) /
          all.length
        ).toFixed(1)
      : String(input.rating);

  try {
    await setDoc(
      doc(db(), "providers", input.providerUid),
      {
        rating: average,
        reviewCount: all.length,
      },
      { merge: true }
    );
    setMode("cloud");
  } catch {
    setMode("device");
  }

  const localProvider = deviceGet<Record<string, unknown>>(
    "providers",
    input.providerUid
  );

  deviceSet("providers", input.providerUid, {
    ...localProvider,
    rating: average,
    reviewCount: all.length,
  });

  return { average, count: all.length };
}

/* ---------------------------------------------------------
   CHAT  (provider ⇄ traveller, keyed by thread id)
--------------------------------------------------------- */

export type NewMessageInput = {
  threadId: string;
  providerUid: string;
  travellerUid: string;
  from: ChatMessage["from"];
  name: string;
  text: string;
  travellerName?: string;
  travellerEmail?: string;
  subject?: string;
};

function normalizeMessage(id: string, raw: unknown): ChatMessage {
  const data = isRecord(raw) ? raw : {};

  return {
    id,
    from: text(data.from, "traveller") as ChatMessage["from"],
    name: text(data.name, "Guest"),
    text: text(data.text),
    createdAt: iso(data.createdAt),
  };
}

function threadIdFor(providerUid: string, travellerUid: string): string {
  return [providerUid, travellerUid].sort().join("__");
}

export function directThreadId(
  providerUid: string,
  travellerUid: string
): string {
  return threadIdFor(providerUid, travellerUid);
}

export async function sendMessage(
  input: NewMessageInput
): Promise<ChatMessage> {
  const id = deviceId();

  const message = {
    from: input.from,
    name: input.name,
    text: input.text.trim(),
    createdAt: new Date().toISOString(),
  };

  deviceSet("chatMessages", `${input.threadId}::${id}`, {
    ...message,
    threadId: input.threadId,
  });

  const threadMeta = {
    threadId: input.threadId,
    providerUid: input.providerUid,
    travellerUid: input.travellerUid,
    travellerName: input.travellerName ?? "Traveller",
    travellerEmail: input.travellerEmail ?? "",
    subject: input.subject ?? "Traveller enquiry",
  };

  deviceSet("chats", input.threadId, threadMeta);

  try {
    await setDoc(doc(db(), "chats", input.threadId), threadMeta, {
      merge: true,
    });

    const ref = await addDoc(
      collection(db(), "chats", input.threadId, "messages"),
      {
        ...message,
        createdAt: serverTimestamp(),
      }
    );

    deviceSet("chatMessages", `${input.threadId}::${ref.id}`, {
      ...message,
      threadId: input.threadId,
    });
    setMode("cloud");
  } catch (error) {
    setMode("device");
    void storeErrorMessage(error);
  }

  return { id, ...message };
}

export async function listThreadsForProvider(
  providerUid: string
): Promise<ChatThread[]> {
  let rows: ChatThread[];

  try {
    const snap = await getDocs(collection(db(), "chats"));
    setMode("cloud");

    rows = snap.docs
      .filter((entry) => isRecord(entry.data()) &&
        (entry.data() as Record<string, unknown>).providerUid === providerUid)
      .map((entry) =>
        normalizeThread(entry.id, entry.data())
      );

    deviceMirror(
      "chats",
      rows.map((row) => ({ ...row }))
    );
  } catch {
    setMode("device");
    rows = deviceList<Record<string, unknown>>("chats")
      .map((raw) =>
        normalizeThread(text(raw.threadId, "thread"), raw)
      )
      .filter(
        (thread) => thread.providerUid === providerUid
      );
  }

  return rows;
}

function normalizeThread(id: string, raw: unknown): ChatThread {
  const data = isRecord(raw) ? raw : {};

  return {
    id: text(data.threadId, id).replace(/^chats::/, "") || id,
    providerUid: text(data.providerUid),
    travellerUid: text(data.travellerUid),
    travellerName: text(data.travellerName, "Traveller"),
    travellerEmail: text(data.travellerEmail),
    subject: text(data.subject, "Traveller enquiry"),
  };
}

export async function listMessages(
  threadId: string
): Promise<ChatMessage[]> {
  let rows: ChatMessage[];

  try {
    const snap = await getDocs(
      collection(db(), "chats", threadId, "messages")
    );
    setMode("cloud");

    rows = snap.docs
      .map((entry) => normalizeMessage(entry.id, entry.data()))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return rows;
  } catch {
    setMode("device");

    return deviceEntries<
      ChatMessage & { threadId?: string }
    >("chatMessages")
      .filter((message) => message.threadId === threadId)
      .map((message) => ({
        ...message,
        id: message._key.split("::").pop() ?? message.id,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
}

/* ---------------------------------------------------------
   AUTHORITY SETTINGS + SAFETY LOG
--------------------------------------------------------- */

export async function loadAuthoritySettings(): Promise<AuthoritySettings> {
  const fallback: AuthoritySettings = { criticalThreshold: 4500 };

  try {
    const snap = await getDoc(doc(db(), "settings", "authority"));
    setMode("cloud");

    if (!snap.exists()) {
      return fallback;
    }

    return {
      criticalThreshold: num(
        (snap.data() as Partial<AuthoritySettings>).criticalThreshold,
        fallback.criticalThreshold
      ),
    };
  } catch {
    setMode("device");

    const local = deviceGet<Partial<AuthoritySettings>>(
      "settings",
      "authority"
    );

    return {
      criticalThreshold: num(
        local?.criticalThreshold,
        fallback.criticalThreshold
      ),
    };
  }
}

export async function saveAuthoritySettings(
  settings: AuthoritySettings
): Promise<void> {
  deviceSet("settings", "authority", settings);

  try {
    await setDoc(doc(db(), "settings", "authority"), settings, {
      merge: true,
    });
    setMode("cloud");
  } catch {
    setMode("device");
  }
}

function normalizeSafetyLog(id: string, raw: unknown): SafetyLog {
  const data = isRecord(raw) ? raw : {};

  return {
    id,
    unit: text(data.unit, "Field unit"),
    note: text(data.note),
    byEmail: text(data.byEmail),
    createdAt: iso(data.createdAt),
  };
}

export async function addSafetyLog(entry: {
  unit: string;
  note: string;
  byEmail: string;
}): Promise<SafetyLog> {
  const id = deviceId();

  const payload = {
    ...entry,
    createdAt: new Date().toISOString(),
  };

  deviceSet("safetyLogs", id, payload);

  try {
    const ref = await addDoc(collection(db(), "safetyLogs"), {
      ...payload,
      createdAt: serverTimestamp(),
    });

    deviceSet("safetyLogs", ref.id, payload);
    setMode("cloud");

    return normalizeSafetyLog(ref.id, payload);
  } catch (error) {
    setMode("device");
    void storeErrorMessage(error);

    return normalizeSafetyLog(id, payload);
  }
}

export async function listSafetyLogs(): Promise<SafetyLog[]> {
  let rows: SafetyLog[];

  try {
    const snap = await getDocs(collection(db(), "safetyLogs"));
    setMode("cloud");

    rows = snap.docs.map((entry) =>
      normalizeSafetyLog(entry.id, entry.data())
    );

    deviceMirror(
      "safetyLogs",
      rows.map((row) => ({ ...row }))
    );
  } catch {
    setMode("device");
    rows = deviceRows<SafetyLog>("safetyLogs");
  }

  return rows
    .filter((log) => isRecord(log as unknown))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);
}