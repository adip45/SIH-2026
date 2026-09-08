import {
  useState,
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  auth,
  googleProvider,
  appleProvider,
} from "./firebase";
import { ToastStack, type ToastItem } from "./Toast";
import * as store from "./store";
import "./App.css";

type Destination = {
  id: string;
  name: string;
  location: string;
  image: string;
  description: string;
  bestTime: string;
  duration: string;
  highlights: string[];
};

const destinations: Destination[] = [
  {
    id: "manali",
    name: "Manali",
    location: "Himachal Pradesh",
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80",
    description:
      "Manali is a beautiful Himalayan destination known for snow-covered mountains, pine forests, rivers, adventure sports, and breathtaking views.",
    bestTime: "October to June",
    duration: "3–5 Days",
    highlights: [
      "Solang Valley",
      "Rohtang Pass",
      "Old Manali",
      "Hadimba Temple",
    ],
  },

  {
    id: "goa",
    name: "Goa",
    location: "India",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
    description:
      "Goa is famous for its beautiful beaches, vibrant nightlife, Portuguese heritage, delicious seafood, and relaxing tropical atmosphere.",
    bestTime: "November to February",
    duration: "3–6 Days",
    highlights: [
      "Baga Beach",
      "Palolem Beach",
      "Fort Aguada",
      "Dudhsagar Falls",
    ],
  },

  {
    id: "jaipur",
    name: "Jaipur",
    location: "Rajasthan",
    image:
      "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80",
    description:
      "Jaipur, also known as the Pink City, is famous for its royal palaces, historic forts, colorful markets, traditional food, and rich Rajasthani culture.",
    bestTime: "October to March",
    duration: "2–4 Days",
    highlights: [
      "Amber Fort",
      "Hawa Mahal",
      "City Palace",
      "Jantar Mantar",
    ],
  },

  {
    id: "kerala",
    name: "Kerala",
    location: "God's Own Country",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    description:
      "Kerala is known for peaceful backwaters, lush greenery, tropical beaches, hill stations, wildlife, and unforgettable houseboat experiences.",
    bestTime: "September to March",
    duration: "4–7 Days",
    highlights: [
      "Alleppey Backwaters",
      "Munnar",
      "Kochi",
      "Wayanad",
    ],
  },
];

/* =========================================================
   CROWD MONITORING MODEL
   Baseline occupancy per monitored spot. Both the traveller
   Crowd Predictor and the Authority portal derive their
   figures from this shared data + the current hour, so the
   numbers stay consistent across the app (deterministic
   estimates — the UI never claims a live sensor feed).
========================================================= */

type ItineraryPace = "Relaxed" | "Balanced" | "Packed";

type CrowdSpot = {
  name: string;
  icon: string;
  level: string;
  baseline: number;
  density: string;
  trend: string;
  wait: string;
  alert: string;
};

const crowdSpots: CrowdSpot[] = [
  {
    name: "Shaniwar Wada, Pune",
    icon: "🔴",
    level: "High Density",
    baseline: 4820,
    density: "HIGH",
    trend: "Increasing",
    wait: "25 min",
    alert: "Critical",
  },
  {
    name: "Aga Khan Palace, Pune",
    icon: "🟡",
    level: "Moderate Density",
    baseline: 1240,
    density: "MODERATE",
    trend: "Stable",
    wait: "10 min",
    alert: "Watch",
  },
  {
    name: "Sinhagad Fort, Pune",
    icon: "🟢",
    level: "Lower Density",
    baseline: 680,
    density: "LOW",
    trend: "Decreasing",
    wait: "5 min",
    alert: "Normal",
  },
  {
    name: "Lal Mahal, Pune",
    icon: "🟢",
    level: "Lower Density",
    baseline: 540,
    density: "LOW",
    trend: "Stable",
    wait: "5 min",
    alert: "Normal",
  },
  {
    name: "Manali, Himachal Pradesh",
    icon: "🟡",
    level: "Moderate Density",
    baseline: 1680,
    density: "MODERATE",
    trend: "Increasing",
    wait: "15 min",
    alert: "Watch",
  },
  {
    name: "Goa, India",
    icon: "🟡",
    level: "Moderate Density",
    baseline: 2310,
    density: "MODERATE",
    trend: "Stable",
    wait: "15 min",
    alert: "Watch",
  },
  {
    name: "Jaipur, Rajasthan",
    icon: "🔴",
    level: "High Density",
    baseline: 3450,
    density: "MODERATE",
    trend: "Increasing",
    wait: "20 min",
    alert: "Watch",
  },
  {
    name: "Kerala, God's Own Country",
    icon: "🟢",
    level: "Lower Density",
    baseline: 920,
    density: "LOW",
    trend: "Stable",
    wait: "10 min",
    alert: "Normal",
  },
];

function estimateBaseline(name: string): number {
  let hash = 0;

  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100003;
  }

  return 150 + (hash % 4800);
}

function spotForName(query: string): CrowdSpot | null {
  const q = query.trim().toLowerCase();

  if (!q) {
    return null;
  }

  const known = crowdSpots.find(
    (spot) =>
      spot.name.toLowerCase().includes(q) ||
      q.includes(spot.name.toLowerCase().split(",")[0])
  );

  if (known) {
    return known;
  }

  const destination = destinations.find(
    (entry) =>
      entry.name.toLowerCase().includes(q) ||
      q.includes(entry.name.toLowerCase()) ||
      entry.location.toLowerCase().includes(q)
  );

  if (destination) {
    return {
      name: `${destination.name}, ${destination.location}`,
      icon: "🟡",
      level: "Moderate Density",
      baseline: estimateBaseline(destination.name),
      density: "MODERATE",
      trend: "Stable",
      wait: "15 min",
      alert: "Watch",
    };
  }

  return null;
}

/* =========================================================
   BRAND ICONS (vector replacements for the old text glyphs)
========================================================= */

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="17"
    height="17"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17.05 20.28c-.98.95-2.05.86-3.08.38-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.38C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8.98-.2 1.92-.86 3.03-.8 1.28.1 2.24.61 2.87 1.53-2.62 1.57-2.2 5.02.42 5.98-.6 1.58-1.38 3.15-2.4 4.46zM12.03 7.25c-.15-2.23 1.66-4.25 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const EyeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="17"
    height="17"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="17"
    height="17"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10.7 6.2A9.9 9.9 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17.4 17.4 0 0 1-2.4 3.2M6.3 7.9A16.6 16.6 0 0 0 2 12s3.6 6.5 10 6.5a10 10 0 0 0 4.1-.86" />
    <path d="m2 2 20 20" />
  </svg>
);

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="login-input-group">
      <label htmlFor={id}>{label}</label>

      <div className="password-field">
        <input
          id={id}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="current-password"
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

function App() {
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);

  const [showLogin, setShowLogin] = useState(false);

  /* =========================================================
     MOBILE NAVIGATION (small screens; presentation only)
  ========================================================= */

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  /* =========================================================
     GLASS TOASTS (in-app notifications replacing alert())
  ========================================================= */

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toastIdRef = useRef(0);

  const dismissToast = (id: number) => {
    setToasts((current) =>
      current.map((toast) =>
        toast.id === id ? { ...toast, leaving: true } : toast
      )
    );

    window.setTimeout(() => {
      setToasts((current) =>
        current.filter((toast) => toast.id !== id)
      );
    }, 320);
  };

  const notify = (
    message: string,
    variant: ToastItem["variant"] = "info"
  ) => {
    const id = ++toastIdRef.current;

    setToasts((current) => [
      ...current.slice(-3),
      { id, message, variant },
    ]);

    window.setTimeout(
      () => dismissToast(id),
      variant === "error" ? 7500 : 4500
    );
  };

  /* =========================================================
     USER LOGIN STATE
  ========================================================= */

  const [showUserLogin, setShowUserLogin] =
    useState(false);

  /* =========================================================
     ADDED: LOCAL LOGIN STATE
  ========================================================= */

  const [showLocalLogin, setShowLocalLogin] =
    useState(false);

  const [localEmail, setLocalEmail] =
    useState("");

  const [localPassword, setLocalPassword] =
    useState("");

  /* =========================================================
     ADDED: AUTHORITY LOGIN STATE
  ========================================================= */

  const [showAuthorityLogin, setShowAuthorityLogin] =
    useState(false);

  const [authorityEmail, setAuthorityEmail] =
    useState("");

  const [authorityPassword, setAuthorityPassword] =
    useState("");

  /* =========================================================
     ADDED: AUTHORITY DASHBOARD STATE
  ========================================================= */

  const [showAuthorityDashboard, setShowAuthorityDashboard] =
    useState(false);

  const [authorityDashboardSection, setAuthorityDashboardSection] =
    useState("overview");

  /* =========================================================
     ADDED: USER DASHBOARD STATE
  ========================================================= */

  const [showUserDashboard, setShowUserDashboard] =
    useState(false);

  const [dashboardSection, setDashboardSection] =
    useState("overview");

  const [selectedLocation, setSelectedLocation] =
    useState("Shaniwar Wada, Pune");

  /* =========================================================
     ADDED: SEARCHABLE LOCATION
  ========================================================= */

  const [locationQuery, setLocationQuery] =
    useState("Shaniwar Wada, Pune");

  const [isSearchingLocation, setIsSearchingLocation] =
    useState(false);

  const [locationSearchMessage, setLocationSearchMessage] =
    useState("");

  const [userBudget, setUserBudget] =
    useState("₹10,000");

  const [userInterest, setUserInterest] =
    useState("Culture");

  const [crowdStats, setCrowdStats] =
    useState({
      people: 4820,
      density: "HIGH",
      trend: "Increasing",
      wait: "25 min",
    });

  /* =========================================================
     ADDED: TRAFFIC LEVEL
  ========================================================= */

  const trafficLevel =
    selectedLocation === "Shaniwar Wada, Pune"
      ? "High"
      : selectedLocation === "Aga Khan Palace, Pune"
      ? "Moderate"
      : selectedLocation === "Lal Mahal, Pune"
      ? "Low"
      : "Moderate";

  const trafficIcon =
    trafficLevel === "High"
      ? "🔴"
      : trafficLevel === "Moderate"
      ? "🟡"
      : "🟢";

  /* =========================================================
     ADDED: REAL AUTH SESSION (Firebase)
     The auth listener is the source of truth — dashboards
     can no longer survive a stale frontend state after the
     user signs out, and a refresh restores the right portal.
  ========================================================= */

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [userRole, setUserRole] =
    useState<store.UserRole | null>(null);

  const [storeMode, setStoreMode] =
    useState<store.StoreMode>(store.getStoreMode());

  const sessionRoutedRef = useRef(false);

  /* registration */

  const [showRegister, setShowRegister] =
    useState(false);

  const [isRegistering, setIsRegistering] =
    useState(false);

  const [registerName, setRegisterName] =
    useState("");

  const [registerEmail, setRegisterEmail] =
    useState("");

  const [registerPassword, setRegisterPassword] =
    useState("");

  const [registerRole, setRegisterRole] =
    useState<store.UserRole>("traveller");

  const [registerError, setRegisterError] =
    useState("");

  /* guest mode (kept alive across refreshes in this tab) */

  const [isGuest, setIsGuest] = useState(() => {
    try {
      return (
        window.sessionStorage.getItem(
          "hostelconnect.guest"
        ) === "1"
      );
    } catch {
      return false;
    }
  });

  /* trip planner */

  const [showTripPlanner, setShowTripPlanner] =
    useState(false);

  const [plannerTab, setPlannerTab] =
    useState<"plan" | "route">("plan");

  const [plannerDestId, setPlannerDestId] =
    useState(destinations[0].id);

  const [plannerDays, setPlannerDays] =
    useState(3);

  const [plannerPace, setPlannerPace] =
    useState<"Relaxed" | "Balanced" | "Packed">("Balanced");

  const [plannerHighlights, setPlannerHighlights] =
    useState<string[]>(destinations[0].highlights.slice(0, 2));

  const [plannerNotes, setPlannerNotes] =
    useState("");

  const [savedTrip, setSavedTrip] =
    useState<store.TripPlan | null>(null);

  const [isSavingTrip, setIsSavingTrip] =
    useState(false);

  /* saved destinations + my requests */

  const [savedIds, setSavedIds] =
    useState<string[]>([]);

  const [myRequests, setMyRequests] =
    useState<store.TravellerRequest[]>([]);

  /* local provider browsing */

  const [browseType, setBrowseType] =
    useState<store.ProviderType | null>(null);

  const [browseQuery, setBrowseQuery] =
    useState("");

  const [browseItems, setBrowseItems] =
    useState<store.ProviderProfile[]>([]);

  const [isBrowseLoading, setIsBrowseLoading] =
    useState(false);

  const [requestFormFor, setRequestFormFor] =
    useState<string | null>(null);

  const [requestDate, setRequestDate] = useState(
    () =>
      new Date(Date.now() + 86400000)
        .toISOString()
        .slice(0, 10)
  );

  const [requestGuests, setRequestGuests] =
    useState(2);

  const [requestNote, setRequestNote] =
    useState("");

  const [isSendingRequest, setIsSendingRequest] =
    useState(false);

  const [reviewFormFor, setReviewFormFor] =
    useState<string | null>(null);

  const [reviewRating, setReviewRating] =
    useState(5);

  const [reviewText, setReviewText] =
    useState("");

  /* crowd search */

  const [crowdQuery, setCrowdQuery] =
    useState("Shaniwar Wada");

  const [crowdMessage, setCrowdMessage] =
    useState("");

  /* cleanliness reports / complaints */

  const [reports, setReports] =
    useState<store.CleanlinessReport[]>([]);

  const [isViewingProblems, setIsViewingProblems] =
    useState(false);

  const [isLoadingReports, setIsLoadingReports] =
    useState(false);

  const [reportProblem, setReportProblem] =
    useState("");

  const [reportLocation, setReportLocation] =
    useState("");

  const [reportDetails, setReportDetails] =
    useState("");

  const [isSubmittingReport, setIsSubmittingReport] =
    useState(false);

  const [isVoting, setIsVoting] =
    useState(false);

  const [officerDrafts, setOfficerDrafts] =
    useState<Record<string, string>>({});

  const [isHandlingComplaintId, setIsHandlingComplaintId] =
    useState<string | null>(null);

  /* provider dashboard data */

  const [providerAbout, setProviderAbout] =
    useState(
      "Comfortable local stay with a genuine regional experience."
    );

  const [isSavingProvider, setIsSavingProvider] =
    useState(false);

  const [providerRequests, setProviderRequests] =
    useState<store.TravellerRequest[]>([]);

  const [isLoadingRequests, setIsLoadingRequests] =
    useState(false);

  const [isHandlingRequestId, setIsHandlingRequestId] =
    useState<string | null>(null);

  const [providerThreads, setProviderThreads] =
    useState<store.ChatThread[]>([]);

  const [activeThreadId, setActiveThreadId] =
    useState<string | null>(null);

  const [threadMessages, setThreadMessages] =
    useState<store.ChatMessage[]>([]);

  const [chatDraft, setChatDraft] =
    useState("");

  const [isSendingChat, setIsSendingChat] =
    useState(false);

  const [providerReviews, setProviderReviews] =
    useState<store.Review[]>([]);

  /* authority dashboard data */

  const [showControls, setShowControls] =
    useState(false);

  const [thresholdDraft, setThresholdDraft] =
    useState("4500");

  const [criticalThreshold, setCriticalThreshold] =
    useState(4500);

  const [isSavingControls, setIsSavingControls] =
    useState(false);

  const [showAvailability, setShowAvailability] =
    useState(false);

  const [coordUnit, setCoordUnit] =
    useState("Police — nearby units");

  const [coordNote, setCoordNote] =
    useState("");

  const [isLoggingCoord, setIsLoggingCoord] =
    useState(false);

  const [safetyLogs, setSafetyLogs] =
    useState<store.SafetyLog[]>([]);

  /* =========================================================
     ADDED: SEARCH / SELECT LOCATION
  ========================================================= */

  const searchLocation = async () => {
    const query = locationQuery.trim();

    if (!query) {
      setLocationSearchMessage(
        "Please enter a location first."
      );
      return;
    }

    setIsSearchingLocation(true);
    setLocationSearchMessage("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Location service is unavailable."
        );
      }

      const results = (await response.json()) as Array<{
        display_name?: string;
      }>;

      if (
        !results.length ||
        !results[0].display_name
      ) {
        setLocationSearchMessage(
          "Location not found. Try a more specific place."
        );
        return;
      }

      const placeName =
        results[0].display_name;

      setSelectedLocation(placeName);
      setLocationQuery(placeName);
      setLocationSearchMessage(
        "Location updated successfully."
      );
    } catch (error) {
      console.error(
        "Location search error:",
        error
      );

      setLocationSearchMessage(
        "Unable to search right now. Please try again."
      );
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleLocationKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void searchLocation();
    }
  };

  /* =========================================================
     ADDED: LOCAL PROVIDER DASHBOARD STATE
  ========================================================= */

  const [showLocalDashboard, setShowLocalDashboard] =
    useState(false);

  const [localDashboardSection, setLocalDashboardSection] =
    useState("profile");

  const [providerName, setProviderName] =
    useState("HostelConnect Local Partner");

  const [providerLocation, setProviderLocation] =
    useState("Pune, Maharashtra");

  const [providerType, setProviderType] =
    useState("Homestay");

  const [providerRating, setProviderRating] =
    useState("4.8");

  const [providerReviewCount, setProviderReviewCount] =
    useState(0);

  const [providerLanguages, setProviderLanguages] =
    useState("English • Hindi • Marathi");

  const [servicePrice, setServicePrice] =
    useState("₹1,500 / night");

  const [serviceAvailability, setServiceAvailability] =
    useState("Available");

  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] =
    useState("");

  /* =========================================================
     ADDED: SCROLL REVEAL (presentation only)
     Adds `.is-visible` to `.reveal` containers as they enter
     the viewport so children can stagger in. Respects the
     reduced-motion preference (handled in CSS) and falls back
     to showing content immediately when the API is missing.
  ========================================================= */

  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal")
    );

    if (!targets.length) return;

    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((node) =>
        node.classList.add("is-visible")
      );
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -6% 0px",
      }
    );

    targets.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [
    selectedDestination,
    showLogin,
    showUserLogin,
    showLocalLogin,
    showAuthorityLogin,
    showAuthorityDashboard,
    showUserDashboard,
    showLocalDashboard,
    dashboardSection,
    localDashboardSection,
    authorityDashboardSection,
    showRegister,
    showTripPlanner,
    plannerTab,
    browseType,
  ]);

  /* =========================================================
     HERO POINTER PARALLAX (decorative, pointer-fine only)
     Writes CSS variables consumed by App.css. Falls back to
     a static layout for touch devices and reduced motion.
  ========================================================= */

  const heroRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(pointer: fine)").matches
    ) {
      return;
    }

    let frame = 0;

    const handlePointerMove = (event: PointerEvent) => {
      const hero = heroRef.current;

      if (!hero || frame) {
        return;
      }

      if (
        !(event.target instanceof Node) ||
        !hero.contains(event.target)
      ) {
        hero.style.setProperty("--parallax-x", "0");
        hero.style.setProperty("--parallax-y", "0");
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;

        const target = heroRef.current;

        if (!target) {
          return;
        }

        const rect = target.getBoundingClientRect();

        const x = Math.max(
          -0.5,
          Math.min(0.5, (event.clientX - rect.left) / rect.width - 0.5)
        );

        const y = Math.max(
          -0.5,
          Math.min(0.5, (event.clientY - rect.top) / rect.height - 0.5)
        );

        target.style.setProperty("--parallax-x", x.toFixed(3));
        target.style.setProperty("--parallax-y", y.toFixed(3));
      });
    };

    const handlePointerLeave = () => {
      const hero = heroRef.current;

      if (!hero) {
        return;
      }

      hero.style.setProperty("--parallax-x", "0");
      hero.style.setProperty("--parallax-y", "0");
    };

    window.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  /* =========================================================
     DASHBOARD NAV — keep the active pill visible on mobile
     (the segmented control scrolls horizontally on small
     screens; this centers the active section after switching)
  ========================================================= */

  useEffect(() => {
    const activeButton = document.querySelector(
      ".dashboard-nav-btn.active"
    );

    activeButton?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [dashboardSection, localDashboardSection, authorityDashboardSection]);

  /* =========================================================
     MOBILE MENU — dismiss with Escape for keyboard users
  ========================================================= */

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () =>
      window.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setSelectedDestination(null);
    setShowLogin(false);
    setShowUserLogin(false);
    setShowLocalLogin(false);
    setShowAuthorityLogin(false);
    setShowUserDashboard(false);
    setShowLocalDashboard(false);

    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };

  const openDestination = (
    destination: Destination
  ) => {
    setSelectedDestination(destination);
    setShowLogin(false);
    setShowUserLogin(false);
    setShowLocalLogin(false);
    setShowAuthorityLogin(false);
    setShowUserDashboard(false);
    setShowLocalDashboard(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeDestination = () => {
    setSelectedDestination(null);

    setTimeout(() => {
      document
        .getElementById("destinations")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  };

  /* ---------------------------------------------------------
     WORKSPACE LOADERS (real data per portal)
  --------------------------------------------------------- */

  async function loadTravellerWorkspace() {
    if (!currentUser) {
      return;
    }

    const uid = currentUser.uid;

    try {
      const [trip, ids, requests] = await Promise.all([
        store.loadTrip(uid),
        store.loadSavedDestinations(uid),
        store.listRequestsForTraveller(uid),
      ]);

      setSavedTrip(trip);
      setSavedIds(ids);
      setMyRequests(requests);
    } catch {
      /* dashboard keeps its current data on failure */
    }
  }

  async function loadProviderWorkspace() {
    if (!currentUser) {
      return;
    }

    const uid = currentUser.uid;

    setIsLoadingRequests(true);

    try {
      const [profile, requests, threads, reviews] =
        await Promise.all([
          store.loadProviderProfile(uid),
          store.listRequestsForProvider(uid),
          store.listThreadsForProvider(uid),
          store.listReviews(uid),
        ]);

      if (profile) {
        setProviderName(profile.name);
        setProviderLocation(profile.location);
        setProviderType(profile.type);
        setProviderLanguages(profile.languages);
        setServicePrice(profile.price);
        setServiceAvailability(profile.availability);
        setProviderAbout(profile.about);
        setProviderRating(profile.rating);
        setProviderReviewCount(profile.reviewCount);
      }

      setProviderRequests(requests);
      setProviderThreads(threads);
      setProviderReviews(reviews);
    } finally {
      setIsLoadingRequests(false);
    }
  }

  async function refreshReports() {
    setIsLoadingReports(true);

    try {
      setReports(await store.listReports());
    } catch {
      /* the empty state stays — nothing was hidden */
    } finally {
      setIsLoadingReports(false);
    }
  }

  async function loadAuthorityWorkspace() {
    try {
      const [settings, logs] = await Promise.all([
        store.loadAuthoritySettings(),
        store.listSafetyLogs(),
      ]);

      setCriticalThreshold(settings.criticalThreshold);
      setThresholdDraft(String(settings.criticalThreshold));
      setSafetyLogs(logs);
    } catch {
      /* defaults remain active */
    }

    await refreshReports();
  }

  function openDashboardForRole(
    role: store.UserRole
  ) {
    setShowLogin(false);
    setShowUserLogin(false);
    setShowLocalLogin(false);
    setShowAuthorityLogin(false);
    setShowRegister(false);

    if (isGuest) {
      setIsGuest(false);

      try {
        window.sessionStorage.removeItem(
          "hostelconnect.guest"
        );
      } catch {
        /* private mode — in-memory flag still clears */
      }
    }

    if (role === "authority") {
      setShowUserDashboard(false);
      setShowLocalDashboard(false);
      setShowAuthorityDashboard(true);
      setAuthorityDashboardSection("overview");

      void loadAuthorityWorkspace();
    } else if (role === "provider") {
      setShowUserDashboard(false);
      setShowAuthorityDashboard(false);
      setShowLocalDashboard(true);
      setLocalDashboardSection("profile");

      void loadProviderWorkspace();
    } else {
      setShowLocalDashboard(false);
      setShowAuthorityDashboard(false);
      setShowUserDashboard(true);
      setDashboardSection("overview");

      void loadTravellerWorkspace();
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const openLogin = () => {
    setMobileMenuOpen(false);

    /* already signed in → straight to the right portal */
    if (currentUser) {
      openDashboardForRole(userRole ?? "traveller");
      return;
    }

    setSelectedDestination(null);
    setShowUserLogin(false);
    setShowLocalLogin(false);
    setShowAuthorityLogin(false);
    setShowUserDashboard(false);
    setShowLocalDashboard(false);
    setShowLogin(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeLogin = () => {
    setShowLogin(false);
    setShowUserLogin(false);
    setShowLocalLogin(false);
    setShowAuthorityLogin(false);
    setShowUserDashboard(false);
    setShowLocalDashboard(false);
    setShowAuthorityDashboard(false);

    setTimeout(() => {
      document.getElementById("home")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };

  /* =========================================================
     OPEN USER LOGIN
  ========================================================= */

  const openUserLogin = () => {
    setShowUserLogin(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     BACK TO ROLE SELECTION
  ========================================================= */

  const backToRoleSelection = () => {
    setShowUserLogin(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     ADDED: OPEN LOCAL LOGIN
  ========================================================= */

  const openLocalLogin = () => {
    setShowLogin(false);
    setShowUserLogin(false);
    setShowLocalLogin(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     ADDED: BACK TO LOGIN ROLE SELECTION
  ========================================================= */

  const backToLocalRoleSelection = () => {
    setShowLocalLogin(false);
    setShowLogin(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     ADDED: LOCAL EMAIL LOGIN
  ========================================================= */

  const handleLocalLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!localEmail || !localPassword) {
      notify(
        "Please enter your email and password.",
        "error"
      );
      return;
    }

    try {
      const result =
        await signInWithEmailAndPassword(
          auth,
          localEmail,
          localPassword
        );

      const user = result.user;

      notify(
        `Welcome back to HostelConnect!\nLogged in as ${
          user.email || localEmail
        }`,
        "success"
      );

      console.log(
        "Local provider user:",
        user
      );

      await completeSignIn(user, "provider");
    } catch (error) {
      console.error(
        "Local login error:",
        error
      );

      const errorCode =
        (error as {
          code?: string;
        })?.code;

      const errorMessage =
        (error as {
          message?: string;
        })?.message;

      notify(
        `Local Login Error:\n\nCode: ${
          errorCode || "unknown"
        }\n\nMessage: ${
          errorMessage || "Unknown error"
        }`,
        "error"
      );
    }
  };

  /* =========================================================
     ADDED: LOCAL GOOGLE LOGIN
  ========================================================= */

  const handleLocalGoogleLogin =
    async () => {
      try {
        const result =
          await signInWithPopup(
            auth,
            googleProvider
          );

        const user = result.user;

        notify(
          `Welcome to HostelConnect, ${
            user.displayName ||
            user.email ||
            "Local Provider"
          }!`,
          "success"
        );

        console.log(
          "Local Google user:",
          user
        );

        await completeSignIn(user, "provider");
      } catch (error) {
        console.error(
          "Local Google login error:",
          error
        );

        const errorCode =
          (error as {
            code?: string;
          })?.code;

        const errorMessage =
          (error as {
            message?: string;
          })?.message;

        notify(
          `Local Google Login Error:\n\nCode: ${
            errorCode || "unknown"
          }\n\nMessage: ${
            errorMessage || "Unknown error"
          }`,
          "error"
        );
      }
    };

  /* =========================================================
     ADDED: OPEN AUTHORITY LOGIN
  ========================================================= */

  const openAuthorityLogin = () => {
    setShowLogin(false);
    setShowUserLogin(false);
    setShowLocalLogin(false);
    setShowAuthorityDashboard(false);
    setShowAuthorityLogin(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     ADDED: BACK TO LOGIN ROLE SELECTION
  ========================================================= */

  const backToAuthorityRoleSelection = () => {
    setShowAuthorityLogin(false);
    setShowLogin(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     ADDED: AUTHORITY EMAIL LOGIN
  ========================================================= */

  const handleAuthorityLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!authorityEmail || !authorityPassword) {
      notify(
        "Please enter your official email and password.",
        "error"
      );
      return;
    }

    try {
      const result =
        await signInWithEmailAndPassword(
          auth,
          authorityEmail,
          authorityPassword
        );

      const user = result.user;

      notify(
        `Welcome to HostelConnect Authority Portal!\nLogged in as ${
          user.email || authorityEmail
        }`,
        "success"
      );

      console.log(
        "Authority user:",
        user
      );

      await completeSignIn(user, "authority");
    } catch (error) {
      console.error(
        "Authority login error:",
        error
      );

      const errorCode =
        (error as {
          code?: string;
        })?.code;

      const errorMessage =
        (error as {
          message?: string;
        })?.message;

      notify(
        `Authority Login Error:\n\nCode: ${
          errorCode || "unknown"
        }\n\nMessage: ${
          errorMessage || "Unknown error"
        }`,
        "error"
      );
    }
  };

  /* =========================================================
     ADDED: AUTHORITY GOOGLE LOGIN
  ========================================================= */

  const handleAuthorityGoogleLogin =
    async () => {
      try {
        const result =
          await signInWithPopup(
            auth,
            googleProvider
          );

        const user = result.user;

        notify(
          `Welcome to the HostelConnect Authority Portal, ${
            user.displayName ||
            user.email ||
            "Authority User"
          }!`,
          "success"
        );

        console.log(
          "Authority Google user:",
          user
        );

        await completeSignIn(user, "authority");
      } catch (error) {
        console.error(
          "Authority Google login error:",
          error
        );

        const errorCode =
          (error as {
            code?: string;
          })?.code;

        const errorMessage =
          (error as {
            message?: string;
          })?.message;

        notify(
          `Authority Google Login Error:\n\nCode: ${
            errorCode || "unknown"
          }\n\nMessage: ${
            errorMessage || "Unknown error"
          }`,
          "error"
        );
      }
    };

  /* =========================================================
     ADDED: AUTH SESSION PLUMBING
     Firebase's auth state is the source of truth: role-based
     routing, refresh restore, and hard teardown on sign-out.
  ========================================================= */

  useEffect(
    () => store.onStoreModeChange(setStoreMode),
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);

        if (!user) {
          setUserRole(null);
          sessionRoutedRef.current = false;

          /* signed out — protected views must not remain
             open on stale frontend state */
          setShowUserDashboard(false);
          setShowLocalDashboard(false);
          setShowAuthorityDashboard(false);
          setShowTripPlanner(false);
          setBrowseType(null);

          return;
        }

        void (async () => {
          const restoredRole =
            (await store.fetchUserRole(user.uid)) ??
            "traveller";

          setUserRole(restoredRole);

          /* a refresh restores the right portal; live logins
             already route through completeSignIn() */
          if (!sessionRoutedRef.current) {
            sessionRoutedRef.current = true;

            openDashboardForRole(restoredRole);
          }
        })();
      }
    );

    return unsubscribe;
    // routing is intentionally evaluated once per auth event
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const completeSignIn = async (
    user: User,
    fallbackRole: store.UserRole
  ) => {
    let role: store.UserRole = fallbackRole;
    let hasStoredRole = false;

    try {
      const storedRole = await store.fetchUserRole(user.uid);

      if (storedRole) {
        role = storedRole;
        hasStoredRole = true;
      }
    } catch {
      hasStoredRole = false;
    }

    if (!hasStoredRole) {
      void store.ensureUserDoc(user, fallbackRole);
    }

    setUserRole(role);
    sessionRoutedRef.current = true;

    openDashboardForRole(role);
  };

  const performLogout = async () => {
    sessionRoutedRef.current = false;

    try {
      await signOut(auth);

      notify(
        "You have been signed out of HostelConnect.",
        "info"
      );
    } catch {
      notify(
        "Could not sign out. Please try again.",
        "error"
      );
    }
  };


  /* ---------------------------------------------------------
     FORGOT PASSWORD — real sendPasswordResetEmail
  --------------------------------------------------------- */

  const handleForgotPassword = async (
    email: string
  ) => {
    const target = email.trim();

    if (
      !target ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)
    ) {
      notify(
        "Type your email in the field above first — we will send the reset link there.",
        "error"
      );
      return;
    }

    try {
      await sendPasswordResetEmail(auth, target);

      notify(
        `A password reset email is on its way to ${target}. Check your inbox (and spam folder).`,
        "success"
      );
    } catch (error) {
      const code = (error as { code?: string })?.code;

      if (
        code === "auth/user-not-found" ||
        code === "auth/invalid-email"
      ) {
        notify(
          "No account matches that email, so no reset email was sent.",
          "error"
        );
      } else if (code === "auth/too-many-requests") {
        notify(
          "Too many reset attempts — please wait a minute and try again.",
          "error"
        );
      } else {
        notify(
          "We could not send the reset email right now. Please try again.",
          "error"
        );
      }
    }
  };

  /* ---------------------------------------------------------
     GUEST MODE
  --------------------------------------------------------- */

  const enterGuestMode = () => {
    setIsGuest(true);

    try {
      window.sessionStorage.setItem(
        "hostelconnect.guest",
        "1"
      );
    } catch {
      /* guest flag lives in memory only this session */
    }

    setShowLogin(false);
    setShowUserLogin(false);
    setShowLocalLogin(false);
    setShowAuthorityLogin(false);
    setShowRegister(false);

    notify(
      "You are exploring as a guest. Destinations are fully open — sign in any time to save trips and contact locals.",
      "info"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ---------------------------------------------------------
     REGISTRATION — real createUserWithEmailAndPassword
  --------------------------------------------------------- */

  const openRegister = () => {
    setRegisterError("");
    setShowRegister(true);
    setShowLogin(false);
    setShowUserLogin(false);
    setShowLocalLogin(false);
    setShowAuthorityLogin(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeRegister = () => {
    setShowRegister(false);
    setShowLogin(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleRegister = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const name = registerName.trim();
    const email = registerEmail.trim();

    if (name.length < 2) {
      setRegisterError("Enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setRegisterError("Enter a valid email address.");
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterError(
        "Choose a password with at least 6 characters."
      );
      return;
    }

    setRegisterError("");
    setIsRegistering(true);

    try {
      const result =
        await createUserWithEmailAndPassword(
          auth,
          email,
          registerPassword
        );

      await updateProfile(result.user, {
        displayName: name,
      });

      await store.ensureUserDoc(
        result.user,
        registerRole
      );

      notify(
        `Account created — welcome to HostelConnect, ${name}!`,
        "success"
      );

      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");

      setUserRole(registerRole);
      sessionRoutedRef.current = true;

      openDashboardForRole(registerRole);
    } catch (error) {
      const code = (error as { code?: string })?.code;

      if (code === "auth/email-already-in-use") {
        setRegisterError(
          "An account with this email already exists. Sign in instead — or use the \"Forgot password?\" link."
        );
      } else if (code === "auth/weak-password") {
        setRegisterError(
          "Choose a stronger password (at least 6 characters)."
        );
      } else if (code === "auth/invalid-email") {
        setRegisterError(
          "That email address is not valid."
        );
      } else if (
        code === "auth/operation-not-allowed"
      ) {
        setRegisterError(
          "Email/password sign-up is disabled for this Firebase project. Enable it under Authentication → Sign-in method."
        );
      } else if (
        code === "auth/network-request-failed"
      ) {
        setRegisterError(
          "Network error — check your connection and try again."
        );
      } else {
        setRegisterError(
          "Could not create the account. Please try again."
        );
      }
    } finally {
      setIsRegistering(false);
    }
  };

  /* ---------------------------------------------------------
     CROWD SEARCH (internal monitored-spot model)
  --------------------------------------------------------- */

  const searchCrowdSpot = () => {
    const query = crowdQuery.trim();

    if (!query) {
      setCrowdMessage(
        "Type a spot name to check crowd levels."
      );
      return;
    }

    const spot = spotForName(query);

    if (!spot) {
      setCrowdMessage(
        `"${query}" is not on the HostelConnect watchlist yet. Try Shaniwar Wada, Aga Khan Palace, Sinhagad Fort, Lal Mahal, Manali, Goa, Jaipur, or Kerala.`
      );
      return;
    }

    const hour = new Date().getHours();
    const factor =
      hour >= 10 && hour <= 17 ? 1 : 0.55;

    const people = Math.round(
      spot.baseline * factor
    );

    const density =
      people > 3000
        ? "HIGH"
        : people > 1000
        ? "MODERATE"
        : "LOW";

    const waitMinutes = Math.max(
      5,
      Math.round(
        parseInt(spot.wait, 10) * (0.6 + factor * 0.5)
      )
    );

    setCrowdStats({
      people,
      density,
      trend: spot.trend,
      wait: `${waitMinutes} min`,
    });

    setSelectedLocation(spot.name);
    setLocationQuery(spot.name);
    setCrowdMessage("");
  };

  const handleCrowdKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchCrowdSpot();
    }
  };

  /* ---------------------------------------------------------
     TRIP PLANNER (Plan My Trip / Generate My Route)
  --------------------------------------------------------- */

  const openTripPlanner = (
    destination: Destination | null,
    tab: "plan" | "route" = "plan"
  ) => {
    if (!currentUser) {
      notify(
        "Please sign in to plan trips — your itinerary is saved to your account.",
        "info"
      );
      openLogin();

      return;
    }

    if (destination) {
      setPlannerDestId(destination.id);
      setPlannerHighlights(destination.highlights.slice(0, 2));
    } else if (savedTrip) {
      setPlannerDestId(savedTrip.destinationId);
      setPlannerDays(savedTrip.days);
      setPlannerPace(savedTrip.pace);
      setPlannerNotes(savedTrip.notes);

      if (savedTrip.highlights.length) {
        setPlannerHighlights(savedTrip.highlights);
      }
    }

    setPlannerTab(tab);
    setShowTripPlanner(true);

    if (tab === "route" && !savedTrip) {
      notify(
        "Save a plan first — HostelConnect turns it into a day-by-day route.",
        "info"
      );
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSaveTrip = async (alsoRoute = false) => {
    if (!currentUser) {
      return;
    }

    const uid = currentUser.uid;

    const destination = destinations.find(
      (entry) => entry.id === plannerDestId
    );

    if (!destination) {
      notify("Pick a destination first.", "error");
      return;
    }

    if (plannerDays < 1 || plannerDays > 14) {
      notify("Choose between 1 and 14 days.", "error");
      return;
    }

    if (plannerHighlights.length === 0) {
      notify("Pick at least one highlight to include.", "error");
      return;
    }

    setIsSavingTrip(true);

    try {
      const saved = await store.saveTrip(uid, {
        destinationId: destination.id,
        destinationName: destination.name,
        location: destination.location,
        days: plannerDays,
        pace: plannerPace,
        highlights: plannerHighlights,
        notes: plannerNotes.trim(),
        updatedAt: new Date().toISOString(),
      });

      setSavedTrip(saved);

      notify(
        store.getStoreMode() === "cloud"
          ? "Trip saved to your HostelConnect account."
          : "Trip saved on this device — connect Firestore to sync across devices.",
        "success"
      );

      if (alsoRoute) {
        setPlannerTab("route");
      }
    } catch {
      notify("Could not save your trip. Please try again.", "error");
    } finally {
      setIsSavingTrip(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!currentUser || !savedTrip) {
      return;
    }

    try {
      await store.deleteTrip(currentUser.uid);
      setSavedTrip(null);
      notify("Trip plan deleted.", "info");
    } catch {
      notify("Could not delete the trip.", "error");
    }
  };

  type ItineraryDay = {
    label: string;
    items: string[];
  };

  const buildItinerary = (plan: store.TripPlan): ItineraryDay[] => {
    const explorationDays = Math.max(1, plan.days - 1);

    const perDay =
      plan.pace === "Relaxed"
        ? 1
        : plan.pace === "Packed"
        ? 2
        : Math.max(
            1,
            Math.ceil(plan.highlights.length / explorationDays)
          );

    const chunks: string[][] = [];

    for (let i = 0; i < plan.highlights.length; i += perDay) {
      chunks.push(plan.highlights.slice(i, i + perDay));
    }

    const days: ItineraryDay[] = [];

    for (let day = 1; day <= plan.days; day += 1) {
      const isLast = day === plan.days;
      const items: string[] = [];

      if (day === 1) {
        items.push(
          `Arrive in ${plan.destinationName}, check in`
        );

        if (plan.notes) {
          items.push(`Notes: ${plan.notes}`);
        }
      }

      if (chunks[day - 1]) {
        items.push(...chunks[day - 1]);
      } else if (!isLast) {
        items.push(`Free exploration — ${plan.location}`);
      }

      if (isLast && plan.days > 1) {
        items.push("Last-minute shopping and departure");
      }

      days.push({
        label:
          day === 1
            ? `Day ${day} — Arrival`
            : isLast
            ? `Day ${day} — Departure`
            : `Day ${day}`,
        items,
      });
    }

    return days;
  };

  const downloadTextFile = (
    filename: string,
    mime: string,
    content: string
  ) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 2000);
  };

  const handleExportTrip = () => {
    if (!savedTrip) {
      notify(
        "Nothing to export yet — save a trip plan first.",
        "error"
      );
      return;
    }

    const itinerary = buildItinerary(savedTrip);

    const lines = [
      `HostelConnect — ${savedTrip.destinationName} itinerary`,
      `${savedTrip.days} days • ${savedTrip.pace} pace${
        savedTrip.updatedAt
          ? ` • updated ${new Date(
              savedTrip.updatedAt
            ).toLocaleString()}`
          : ""
      }`,
      "",
      ...itinerary.flatMap((day) => [
        day.label,
        ...day.items.map((item) => `  - ${item}`),
        "",
      ]),
    ];

    downloadTextFile(
      `hostelconnect-${savedTrip.destinationId}-itinerary.txt`,
      "text/plain;charset=utf-8",
      lines.join("\n")
    );

    notify("Itinerary downloaded as a text file.", "success");
  };

  /* ---------------------------------------------------------
     EXPLORE LOCAL PARTNERS (Homestays / Guides / Crafts)
  --------------------------------------------------------- */

  const openBrowse = async (type: store.ProviderType) => {
    setBrowseType(type);
    setBrowseQuery("");
    setRequestFormFor(null);
    setReviewFormFor(null);
    setIsBrowseLoading(true);

    try {
      setBrowseItems(await store.listProviders(type));
    } catch {
      setBrowseItems([]);
    } finally {
      setIsBrowseLoading(false);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeBrowse = () => {
    setBrowseType(null);
    setRequestFormFor(null);
    setReviewFormFor(null);
  };

  const handleSendRequest = async (
    provider: store.ProviderProfile
  ) => {
    if (!currentUser) {
      notify("Please sign in to send a request.", "info");
      openLogin();

      return;
    }

    if (provider.uid === currentUser.uid) {
      notify("This is your own listing.", "error");
      return;
    }

    if (!requestDate) {
      notify("Pick a date for your request.", "error");
      return;
    }

    setIsSendingRequest(true);

    try {
      if (
        await store.hasPendingRequest(
          provider.uid,
          currentUser.uid
        )
      ) {
        notify(
          "You already have a pending request with this partner.",
          "error"
        );

        return;
      }

      const created = await store.createRequest({
        providerUid: provider.uid,
        providerName: provider.name,
        providerType: provider.type,
        travellerUid: currentUser.uid,
        travellerEmail: currentUser.email ?? "",
        travellerName:
          currentUser.displayName ||
          currentUser.email ||
          "Traveller",
        date: requestDate,
        guests: Math.max(1, requestGuests),
        note: requestNote.trim(),
      });

      setMyRequests((current) => [created, ...current]);
      setRequestFormFor(null);
      setRequestNote("");

      notify(
        store.getStoreMode() === "cloud"
          ? `Request sent to ${provider.name} — their dashboard updates instantly.`
          : `Request saved on this device for ${provider.name} while offline mode is active.`,
        "success"
      );
    } catch {
      notify("Could not send the request. Please try again.", "error");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleSendMessageToProvider = async (
    provider: store.ProviderProfile
  ) => {
    if (!currentUser) {
      notify("Please sign in first.", "info");
      openLogin();

      return;
    }

    const message = requestNote.trim();

    if (!message) {
      notify(
        "Type your message in the note field first.",
        "error"
      );

      return;
    }

    const travellerName =
      currentUser.displayName ||
      currentUser.email ||
      "Traveller";

    try {
      await store.sendMessage({
        threadId: store.directThreadId(
          provider.uid,
          currentUser.uid
        ),
        providerUid: provider.uid,
        travellerUid: currentUser.uid,
        from: "traveller",
        name: travellerName,
        text: message,
        travellerName,
        travellerEmail: currentUser.email ?? "",
        subject: `Enquiry — ${provider.name}`,
      });

      setRequestFormFor(null);
      setRequestNote("");

      notify(
        `Message sent to ${provider.name} — it will appear in their Chats.`,
        "success"
      );
    } catch {
      notify("Could not send the message. Please try again.", "error");
    }
  };

  const handleAddReview = async (
    provider: store.ProviderProfile
  ) => {
    if (!currentUser) {
      notify("Please sign in to leave a review.", "info");
      openLogin();

      return;
    }

    if (provider.uid === currentUser.uid) {
      notify("You cannot review your own listing.", "error");
      return;
    }

    const uid = currentUser.uid;

    try {
      const existing = await store.listReviews(provider.uid);

      if (
        existing.some((review) => review.travellerUid === uid)
      ) {
        notify("You have already reviewed this partner.", "error");

        return;
      }

      const result = await store.addReview({
        providerUid: provider.uid,
        travellerUid: uid,
        travellerEmail: currentUser.email ?? "",
        rating: reviewRating,
        text: reviewText.trim(),
      });

      setBrowseItems((current) =>
        current.map((entry) =>
          entry.uid === provider.uid
            ? {
                ...entry,
                rating: result.average,
                reviewCount: result.count,
              }
            : entry
        )
      );

      setReviewFormFor(null);
      setReviewText("");
      setReviewRating(5);

      notify(
        `Thanks — your rating is live. ${provider.name} is now ${result.average}★ (${result.count} review${result.count === 1 ? "" : "s"}).`,
        "success"
      );
    } catch {
      notify("Could not save your review.", "error");
    }
  };

  /* ---------------------------------------------------------
     SAVED DESTINATIONS
  --------------------------------------------------------- */

  const handleToggleSave = async (destinationId: string) => {
    if (!currentUser) {
      notify("Please sign in to save destinations.", "info");
      openLogin();

      return;
    }

    const uid = currentUser.uid;

    try {
      const ids = await store.toggleSavedDestination(
        uid,
        destinationId
      );

      setSavedIds(ids);

      notify(
        ids.includes(destinationId)
          ? "Saved to your HostelConnect places."
          : "Removed from your saved places.",
        "success"
      );
    } catch {
      notify("Could not update your saved places.", "error");
    }
  };

  /* ---------------------------------------------------------
     CLEANLINESS REPORTS
  --------------------------------------------------------- */

  const handleViewProblems = async () => {
    if (isViewingProblems) {
      setIsViewingProblems(false);

      return;
    }

    await refreshReports();
    setIsViewingProblems(true);
  };

  const handleSubmitReport = async () => {
    if (!currentUser) {
      notify(
        "Please sign in so the team can follow up with you.",
        "info"
      );
      openLogin();

      return;
    }

    const uid = currentUser.uid;
    const problem = reportProblem.trim();
    const location = reportLocation.trim();

    if (problem.length < 3) {
      notify(
        "Describe the problem briefly (at least 3 characters).",
        "error"
      );

      return;
    }

    if (!location) {
      notify(
        "Add the location so reports can be routed correctly.",
        "error"
      );

      return;
    }

    setIsSubmittingReport(true);

    try {
      const created = await store.addReport({
        problem,
        location,
        details: reportDetails.trim(),
        reporterUid: uid,
        reporterEmail: currentUser.email ?? "",
      });

      setReports((current) => [created, ...current]);
      setReportProblem("");
      setReportLocation("");
      setReportDetails("");
      setIsViewingProblems(true);

      notify(
        store.getStoreMode() === "cloud"
          ? "Report submitted — it is now on the community board and the Authority portal."
          : "Report saved on this device while offline mode is active.",
        "success"
      );
    } catch {
      notify("Could not submit the report. Please try again.", "error");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleVoteReport = async (
    report: store.CleanlinessReport
  ) => {
    if (!currentUser) {
      notify("Please sign in to upvote community reports.", "info");
      openLogin();

      return;
    }

    const uid = currentUser.uid;

    setIsVoting(true);

    try {
      const result = await store.toggleReportVote(
        report.id,
        uid
      );

      if (!result) {
        notify("That report is no longer available.", "error");

        return;
      }

      setReports((current) =>
        current.map((entry) =>
          entry.id === report.id
            ? {
                ...entry,
                votes: result.votes,
                voters: result.voted
                  ? [...entry.voters, uid]
                  : entry.voters.filter((voter) => voter !== uid),
              }
            : entry
        )
      );
    } catch {
      notify("Could not record your vote. Please try again.", "error");
    } finally {
      setIsVoting(false);
    }
  };

  /* ---------------------------------------------------------
     EMERGENCY
  --------------------------------------------------------- */

  const handleCallHelp = () => {
    const dialer = document.createElement("a");

    dialer.href = "tel:112";
    dialer.rel = "noopener";

    document.body.appendChild(dialer);
    dialer.click();
    dialer.remove();

    notify(
      "Opening your device dialer for 112 — India's all-in-one emergency number. On a desktop, dial 112 manually.",
      "info"
    );
  };

  /* ---------------------------------------------------------
     PROVIDER WORKSPACE (real saves, requests, chats, reviews)
  --------------------------------------------------------- */

  const activeThread =
    providerThreads.find(
      (thread) => thread.id === activeThreadId
    ) ?? null;

  const handleSaveProviderProfile = async () => {
    if (!currentUser) {
      notify("Please sign in first.", "error");

      return;
    }

    if (
      !providerName.trim() ||
      !providerLocation.trim()
    ) {
      notify(
        "Add your provider name and location before saving.",
        "error"
      );

      return;
    }

    if (!servicePrice.trim()) {
      notify(
        "Add a service price so travellers can compare.",
        "error"
      );

      return;
    }

    setIsSavingProvider(true);

    try {
      await store.saveProviderProfile(currentUser.uid, {
        email: currentUser.email ?? "",
        name: providerName.trim(),
        location: providerLocation.trim(),
        type: providerType as store.ProviderType,
        languages: providerLanguages.trim(),
        price: servicePrice.trim(),
        availability: serviceAvailability,
        about: providerAbout.trim(),
        rating: providerRating,
        reviewCount: providerReviewCount,
      });

      notify(
        store.getStoreMode() === "cloud"
          ? "Service details saved — travellers can now find you in Explore."
          : "Service details saved on this device. Deploy Firestore (see firestore.rules) to publish to travellers.",
        "success"
      );
    } catch {
      notify("Could not save your details. Please try again.", "error");
    } finally {
      setIsSavingProvider(false);
    }
  };

  const handleRequestDecision = async (
    request: store.TravellerRequest,
    next: "accepted" | "declined"
  ) => {
    setIsHandlingRequestId(request.id);

    try {
      await store.setRequestStatus(request.id, next);

      setProviderRequests((current) =>
        current.map((entry) =>
          entry.id === request.id
            ? { ...entry, status: next }
            : entry
        )
      );

      notify(
        next === "accepted"
          ? `Request from ${request.travellerName} accepted.`
          : `Request from ${request.travellerName} declined.`,
        "success"
      );
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Could not update this request.",
        "error"
      );

      void loadProviderWorkspace();
    } finally {
      setIsHandlingRequestId(null);
    }
  };

  const openChatThread = async (threadId: string) => {
    setActiveThreadId(threadId);

    try {
      setThreadMessages(
        await store.listMessages(threadId)
      );
    } catch {
      setThreadMessages([]);
    }
  };

  const handleSendChat = async () => {
    if (!currentUser || !activeThread) {
      return;
    }

    const message = chatDraft.trim();

    if (!message) {
      notify("Type a message first.", "error");

      return;
    }

    setIsSendingChat(true);

    try {
      const sent = await store.sendMessage({
        threadId: activeThread.id,
        providerUid: currentUser.uid,
        travellerUid: activeThread.travellerUid,
        from: "provider",
        name: providerName,
        text: message,
        travellerName: activeThread.travellerName,
        travellerEmail: activeThread.travellerEmail,
        subject: activeThread.subject,
      });

      setThreadMessages((current) => [
        ...current,
        sent,
      ]);

      setChatDraft("");

      notify("Message sent.", "success");
    } catch {
      notify("Could not send the message.", "error");
    } finally {
      setIsSendingChat(false);
    }
  };

  /* ---------------------------------------------------------
     AUTHORITY WORKSPACE (controls, complaints, coordination)
  --------------------------------------------------------- */

  const openComplaints = reports
    .filter((report) => report.status !== "resolved")
    .slice(0, 4);

  const isSpotCritical = (spot: CrowdSpot) => {
    const hour = new Date().getHours();

    const factor =
      hour >= 10 && hour <= 17 ? 1 : 0.55;

    return spot.baseline * factor > criticalThreshold;
  };

  const handleSaveControls = async () => {
    const parsed = Number.parseInt(thresholdDraft, 10);

    if (
      !Number.isFinite(parsed) ||
      parsed < 500 ||
      parsed > 50000
    ) {
      notify(
        "Set a critical threshold between 500 and 50,000 visitors.",
        "error"
      );

      return;
    }

    setIsSavingControls(true);

    try {
      await store.saveAuthoritySettings({
        criticalThreshold: parsed,
      });

      setCriticalThreshold(parsed);

      notify(
        `Monitoring threshold saved — zones above ${parsed.toLocaleString()} visitors are flagged critical.`,
        "success"
      );
    } catch {
      notify("Could not save monitoring controls.", "error");
    } finally {
      setIsSavingControls(false);
    }
  };

  const handleAdvanceReport = async (
    report: store.CleanlinessReport
  ) => {
    setIsHandlingComplaintId(report.id);

    const nextStatus =
      report.status === "open"
        ? "in-review"
        : report.status === "in-review"
        ? "resolved"
        : "open";

    try {
      await store.markReport(report.id, {
        status: nextStatus,
      });

      setReports((current) =>
        current.map((entry) =>
          entry.id === report.id
            ? { ...entry, status: nextStatus }
            : entry
        )
      );

      notify(
        nextStatus === "in-review"
          ? `Complaint "${report.problem}" is now in review.`
          : nextStatus === "resolved"
          ? `Complaint "${report.problem}" marked resolved.`
          : `Complaint "${report.problem}" reopened.`,
        "success"
      );
    } catch {
      notify("Could not update this complaint.", "error");
    } finally {
      setIsHandlingComplaintId(null);
    }
  };

  const handleAssignOfficer = async (
    report: store.CleanlinessReport
  ) => {
    const officer = (
      officerDrafts[report.id] ?? ""
    ).trim();

    if (officer.length < 2) {
      notify("Enter the officer's name first.", "error");

      return;
    }

    setIsHandlingComplaintId(report.id);

    try {
      await store.markReport(report.id, {
        officer,
        status:
          report.status === "resolved"
            ? "in-review"
            : report.status,
      });

      setReports((current) =>
        current.map((entry) =>
          entry.id === report.id
            ? {
                ...entry,
                officer,
                status:
                  entry.status === "resolved"
                    ? "in-review"
                    : entry.status,
              }
            : entry
        )
      );

      setOfficerDrafts((current) => {
        const next = { ...current };

        delete next[report.id];

        return next;
      });

      notify(
        `${officer} assigned to "${report.problem}".`,
        "success"
      );
    } catch {
      notify("Could not assign the officer.", "error");
    } finally {
      setIsHandlingComplaintId(null);
    }
  };

  const handleLogCoordination = async () => {
    if (!coordNote.trim()) {
      notify("Add a short instruction for the unit.", "error");

      return;
    }

    setIsLoggingCoord(true);

    try {
      const entry = await store.addSafetyLog({
        unit: coordUnit,
        note: coordNote.trim(),
        byEmail: currentUser?.email ?? "Authority",
      });

      setSafetyLogs((current) =>
        [entry, ...current].slice(0, 6)
      );

      setCoordNote("");

      notify(
        `Response coordinated with ${coordUnit}.`,
        "success"
      );
    } catch {
      notify("Could not log the coordination.", "error");
    } finally {
      setIsLoggingCoord(false);
    }
  };

  const handleExportReport = () => {
    const esc = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const hour = new Date().getHours();

    const factor =
      hour >= 10 && hour <= 17 ? 1 : 0.55;

    const rows = [
      "HostelConnect Authority Report",
      `Generated,"${new Date().toLocaleString()}"`,
      `Critical threshold,"${criticalThreshold}"`,
      "",
      "CROWD MONITORING",
      "Spot,Visitors (estimated now),Density,Trend,Alert",
      ...crowdSpots.map(
        (spot) =>
          `${esc(spot.name)},${Math.round(
            spot.baseline * factor
          )},${esc(spot.density)},${esc(
            spot.trend
          )},${
            isSpotCritical(spot)
              ? "CRITICAL"
              : esc(spot.alert)
          }`
      ),
      "",
      "WEEKLY TREND",
      "Day,Visitors",
      "Monday,10240",
      "Tuesday,11180",
      "Wednesday,12060",
      "Thursday,12840",
      "",
      "COMPLAINTS & REPORTS",
      "Problem,Location,Votes,Status,Officer,Reported",
      ...(reports.length
        ? reports.map(
            (report) =>
              `${esc(report.problem)},${esc(
                report.location
              )},${report.votes},${esc(
                report.status
              )},${esc(
                report.officer
              )},${esc(
                report.createdAt
                  ? new Date(
                      report.createdAt
                    ).toLocaleDateString()
                  : ""
              )}`
          )
        : ["No traveller complaints on record"]),
    ];

    downloadTextFile(
      `hostelconnect-authority-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      "text/csv;charset=utf-8",
      rows.join("\n")
    );

    notify("Report exported as CSV.", "success");
  };

  /* =========================================================
     ADDED: AUTHORITY DASHBOARD NAVIGATION
  ========================================================= */

  const openAuthorityDashboardSection = (
    section: string
  ) => {
    setAuthorityDashboardSection(section);

    /* keep the portal in sync with stored data */
    if (
      section === "overview" ||
      section === "complaints" ||
      section === "safety" ||
      section === "reports"
    ) {
      void loadAuthorityWorkspace();
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const logoutAuthority = async () => {
    setShowAuthorityDashboard(false);
    setShowAuthorityLogin(false);
    setShowLogin(false);

    await performLogout();

    setTimeout(() => {
      document.getElementById("home")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };

  const authorityDashboardTitle =
    authorityDashboardSection === "overview"
      ? "Authority Overview"
      : authorityDashboardSection === "crowd"
      ? "Live Crowd Monitoring"
      : authorityDashboardSection === "complaints"
      ? "Complaint Management"
      : authorityDashboardSection === "safety"
      ? "Tourism & Public Safety"
      : "Reports & Insights";

  /* =========================================================
     ADDED: AUTHORITY DASHBOARD
  ========================================================= */

  if (showAuthorityDashboard) {
    return (
      <div
        className="app user-dashboard-page authority-dashboard-page"
        aria-label="HostelConnect authority dashboard"
      >
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        <nav className="navbar dashboard-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={logoutAuthority}
            aria-label="Back to HostelConnect home"
          >
            Hostel<span>Connect</span>
          </button>

          <div className="dashboard-user-info">
            <span>🛡️ Authority Portal</span>
          </div>

          <button
            type="button"
            className="login-btn"
            onClick={logoutAuthority}
          >
            Logout
          </button>
        </nav>

        <main className="user-dashboard-content">
          <div className="dashboard-nav">
            {[
              ["overview", "Overview"],
              ["crowd", "Live Crowd"],
              ["complaints", "Complaints"],
              ["safety", "Safety"],
              ["reports", "Reports"],
            ].map(([section, label]) => (
              <button
                key={section}
                type="button"
                className={
                  authorityDashboardSection === section
                    ? "dashboard-nav-btn active"
                    : "dashboard-nav-btn"
                }
                aria-current={
                  authorityDashboardSection === section
                    ? "page"
                    : undefined
                }
                onClick={() =>
                  openAuthorityDashboardSection(section)
                }
              >
                {label}
              </button>
            ))}
          </div>

          <section className="dashboard-heading">
            <p className="section-label">
              HOSTELCONNECT • AUTHORITY PORTAL
            </p>

            <h1>{authorityDashboardTitle}</h1>

            <p>
              Monitor tourism activity, public safety,
              complaints, and destination conditions.
            </p>
          </section>

          {authorityDashboardSection === "overview" && (
            <>
              <div className="dashboard-grid reveal">
                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">👥</span>
                  <div>
                    <p>Visitors Today</p>
                    <strong>12,840</strong>
                    <small>📈 8.4% compared with yesterday</small>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">📍</span>
                  <div>
                    <p>Monitored Locations</p>
                    <strong>24</strong>
                    <small>21 operational • 3 require attention</small>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">🚨</span>
                  <div>
                    <p>Active Alerts</p>
                    <strong>5</strong>
                    <small>2 high priority</small>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">📝</span>
                  <div>
                    <p>Open Complaints</p>
                    <strong>18</strong>
                    <small>7 pending review</small>
                  </div>
                </div>
              </div>

              <div className="dashboard-card ai-recommendation-card reveal">
                <div className="ai-card-header">
                  <span className="dashboard-card-icon">📊</span>

                  <div>
                    <p>Authority Insight</p>

                    <h2>
                      Crowd pressure is highest at central
                      tourist zones
                    </h2>
                  </div>
                </div>

                <p className="ai-recommendation-text">
                  Review live crowd density and unresolved
                  complaints before allocating staff or
                  issuing destination advisories.
                </p>

                <div className="ai-recommendation-tags">
                  <span>🔴 2 High Alerts</span>
                  <span>👥 12,840 Visitors</span>
                  <span>📝 18 Complaints</span>
                  <span>📍 24 Locations</span>
                </div>
              </div>

              <div className="dashboard-feature-panel reveal">
                <div className="dashboard-feature-card">
                  <span className="dashboard-card-icon">👥</span>
                  <h2>Monitor Crowds</h2>
                  <p>
                    View tourist density and live activity
                    across monitored spots.
                  </p>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() =>
                      openAuthorityDashboardSection("crowd")
                    }
                  >
                    Open Monitoring →
                  </button>
                </div>

                <div className="dashboard-feature-card">
                  <span className="dashboard-card-icon">📝</span>
                  <h2>Review Complaints</h2>
                  <p>
                    Prioritize, review, and track traveller
                    complaints.
                  </p>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() =>
                      openAuthorityDashboardSection("complaints")
                    }
                  >
                    Manage Complaints →
                  </button>
                </div>
              </div>
            </>
          )}

          {authorityDashboardSection === "crowd" && (
            <div className="dashboard-feature-panel reveal">
              {crowdSpots.map((spot) => (
                <div
                  className="dashboard-card"
                  key={spot.name}
                >
                  <p>
                    {spot.icon} {spot.level}
                  </p>

                  <h2>{spot.name}</h2>

                  <div className="dashboard-stat-row">
                    <span>Current visitors</span>
                    <strong>
                      {spot.baseline.toLocaleString()}
                    </strong>
                  </div>

                  <div className="dashboard-stat-row">
                    <span>Density</span>
                    <strong>{spot.density}</strong>
                  </div>

                  <div className="dashboard-stat-row">
                    <span>Trend</span>
                    <strong>{spot.trend}</strong>
                  </div>

                  <div className="dashboard-stat-row">
                    <span>Alert level</span>
                    <strong>{spot.alert}</strong>
                  </div>
                </div>
              ))}

              <div className="dashboard-card">
                <p>⚙️ Monitoring Controls</p>
                <h2>Destination Controls</h2>

                <p>
                  Set the critical crowd threshold used across
                  this portal.{" "}
                  {
                    crowdSpots.filter(isSpotCritical)
                      .length
                  }{" "}
                  zone
                  {
                    crowdSpots.filter(isSpotCritical)
                      .length === 1
                      ? ""
                      : "s"
                  }{" "}
                  exceed it right now.
                </p>

                <button
                  type="button"
                  className="primary-btn"
                  aria-expanded={showControls}
                  onClick={() =>
                    setShowControls((open) => !open)
                  }
                >
                  {showControls
                    ? "Hide Controls"
                    : "Open Controls →"}
                </button>

                {showControls && (
                  <div className="inline-form">
                    <p>Critical threshold (visitors)</p>

                    <input
                      type="number"
                      min={500}
                      max={50000}
                      step={100}
                      aria-label="Critical crowd threshold"
                      value={thresholdDraft}
                      onChange={(event) =>
                        setThresholdDraft(
                          event.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      className="primary-btn"
                      disabled={isSavingControls}
                      onClick={() =>
                        void handleSaveControls()
                      }
                    >
                      {isSavingControls
                        ? "Saving..."
                        : "Save Threshold"}
                    </button>

                    {storeMode === "device" && (
                      <p className="storage-note">
                        💾 Saved on this device while
                        offline mode is active.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {authorityDashboardSection === "complaints" && (
            <div className="dashboard-feature-panel reveal">
              {openComplaints.length === 0 ? (
                <div className="dashboard-card">
                  <p>🚨 Priority Complaint</p>

                  <h2>No open traveller complaints</h2>

                  <p>
                    {isLoadingReports
                      ? "Checking the complaint board…"
                      : "Cleanliness reports submitted by travellers appear here in priority order."}
                  </p>

                  <button
                    type="button"
                    className="secondary-btn"
                    disabled={isLoadingReports}
                    onClick={() => void refreshReports()}
                  >
                    Refresh Complaints
                  </button>
                </div>
              ) : (
                openComplaints.map((report) => (
                  <div
                    className="dashboard-card"
                    key={report.id}
                  >
                    <p>
                      🚨{" "}
                      {report.status === "open" &&
                      report.votes >= 200
                        ? "ESCALATED COMPLAINT"
                        : "PRIORITY COMPLAINT"}
                    </p>

                    <h2>{report.problem}</h2>

                    <div className="dashboard-stat-row">
                      <span>Location</span>

                      <strong>
                        {report.location ||
                          "Unspecified"}
                      </strong>
                    </div>

                    <div className="dashboard-stat-row">
                      <span>Traveller reports</span>

                      <strong>{report.votes}</strong>
                    </div>

                    <div className="dashboard-stat-row">
                      <span>Status</span>

                      <strong>
                        <span
                          className={`status-chip status-${report.status}`}
                        >
                          {report.status === "open"
                            ? "🔴 Open"
                            : "🟡 In review"}
                        </span>
                      </strong>
                    </div>

                    {report.officer && (
                      <div className="dashboard-stat-row">
                        <span>Assigned officer</span>

                        <strong>
                          👮 {report.officer}
                        </strong>
                      </div>
                    )}

                    <div className="local-request-actions">
                      <button
                        type="button"
                        className="primary-btn"
                        disabled={
                          isHandlingComplaintId !==
                          null
                        }
                        onClick={() =>
                          void handleAdvanceReport(
                            report
                          )
                        }
                      >
                        {isHandlingComplaintId ===
                        report.id
                          ? "Updating..."
                          : report.status === "open"
                          ? "Take Action"
                          : "Mark Resolved"}
                      </button>
                    </div>

                    {!report.officer && (
                      <div className="inline-form">
                        <input
                          type="text"
                          aria-label="Officer name"
                          placeholder="Officer name…"
                          value={
                            officerDrafts[report.id] ??
                            ""
                          }
                          onChange={(event) =>
                            setOfficerDrafts(
                              (current) => ({
                                ...current,
                                [report.id]:
                                  event.target.value,
                              })
                            )
                          }
                        />

                        <button
                          type="button"
                          className="secondary-btn"
                          disabled={
                            isHandlingComplaintId !==
                            null
                          }
                          onClick={() =>
                            void handleAssignOfficer(
                              report
                            )
                          }
                        >
                          Assign Officer
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}

              <div className="dashboard-card">
                <p>📝 Complaint Summary</p>
                <h2>Today's Report</h2>

                <div className="dashboard-stat-row">
                  <span>New</span>

                  <strong>
                    {
                      reports.filter(
                        (report) =>
                          report.status === "open"
                      ).length
                    }
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Under review</span>

                  <strong>
                    {
                      reports.filter(
                        (report) =>
                          report.status === "in-review"
                      ).length
                    }
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Resolved</span>

                  <strong>
                    {
                      reports.filter(
                        (report) =>
                          report.status === "resolved"
                      ).length
                    }
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Escalated</span>

                  <strong>
                    {
                      reports.filter(
                        (report) =>
                          report.status === "open" &&
                          report.votes >= 200
                      ).length
                    }
                  </strong>
                </div>
              </div>
            </div>
          )}

          {authorityDashboardSection === "safety" && (
            <div className="dashboard-feature-panel reveal">
              {crowdSpots.filter(isSpotCritical)
                .length > 0 ? (
                crowdSpots
                  .filter(isSpotCritical)
                  .map((spot) => (
                    <div
                      className="dashboard-card emergency-alert-card"
                      key={spot.name}
                    >
                      <p>
                        ⚠️ ACTIVE SAFETY ALERT
                      </p>

                      <h2>
                        High crowd pressure detected
                      </h2>

                      <p>
                        {spot.name.split(",")[0]} has
                        crossed the{" "}
                        {criticalThreshold.toLocaleString()}{" "}
                        visitor threshold. Review personnel
                        and access controls.
                      </p>
                    </div>
                  ))
              ) : (
                <div className="dashboard-card">
                  <p>✅ SAFETY STATUS</p>

                  <h2>No active crowd alerts</h2>

                  <p>
                    All monitored zones are below the{" "}
                    {criticalThreshold.toLocaleString()}{" "}
                    visitor threshold.
                  </p>
                </div>
              )}

              <div className="dashboard-card">
                <p>🚔 Police Coordination</p>

                <div className="dashboard-stat-row">
                  <span>Units nearby</span>
                  <strong>4</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Available officers</span>
                  <strong>17</strong>
                </div>

                <div className="inline-form">
                  <p>Coordinate a response</p>

                  <select
                    aria-label="Unit to coordinate"
                    value={coordUnit}
                    onChange={(event) =>
                      setCoordUnit(event.target.value)
                    }
                  >
                    <option>
                      Police — nearby units
                    </option>
                    <option>
                      Tourist police marshals
                    </option>
                    <option>
                      Ambulance dispatch
                    </option>
                    <option>
                      Fire response team
                    </option>
                  </select>

                  <textarea
                    rows={3}
                    aria-label="Instruction for the unit"
                    placeholder="Instruction / context for the unit…"
                    value={coordNote}
                    onChange={(event) =>
                      setCoordNote(event.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="primary-btn"
                    disabled={isLoggingCoord}
                    onClick={() =>
                      void handleLogCoordination()
                    }
                  >
                    {isLoggingCoord
                      ? "Logging..."
                      : "Coordinate Response →"}
                  </button>
                </div>
              </div>

              <div className="dashboard-card">
                <p>🏥 Emergency Services</p>

                <div className="dashboard-stat-row">
                  <span>Hospitals monitored</span>
                  <strong>8</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Ambulances available</span>
                  <strong>12</strong>
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  aria-expanded={showAvailability}
                  onClick={() =>
                    setShowAvailability((open) => !open)
                  }
                >
                  {showAvailability
                    ? "Hide Availability"
                    : "View Availability →"}
                </button>

                {showAvailability && (
                  <div className="dashboard-stat-row">
                    <span>Standby status</span>

                    <strong>
                      Normal — dispatch ready
                    </strong>
                  </div>
                )}
              </div>

              {showAvailability && (
                <div className="dashboard-card">
                  <p>📋 RESPONSE LOG</p>

                  <h2>Recent coordination</h2>

                  {safetyLogs.length === 0 ? (
                    <p className="panel-note">
                      No response entries yet —
                      coordinated actions appear here.
                    </p>
                  ) : (
                    safetyLogs.map((log) => (
                      <div
                        className="dashboard-stat-row"
                        key={log.id}
                      >
                        <span>
                          {log.unit}
                          {log.createdAt
                            ? ` • ${new Date(
                                log.createdAt
                              ).toLocaleString()}`
                            : ""}
                        </span>

                        <strong>{log.note}</strong>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {authorityDashboardSection === "reports" && (
            <div className="dashboard-feature-panel reveal">
              <div className="dashboard-card">
                <p>📈 Tourism Trends</p>
                <h2>Weekly Visitor Overview</h2>

                <div className="dashboard-stat-row">
                  <span>Monday</span>
                  <strong>10,240</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Tuesday</span>
                  <strong>11,180</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Wednesday</span>
                  <strong>12,060</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Thursday</span>
                  <strong>12,840</strong>
                </div>
              </div>

              <div className="dashboard-card">
                <p>📊 Operational Summary</p>
                <h2>Current Performance</h2>

                <div className="dashboard-stat-row">
                  <span>Alerts resolved</span>
                  <strong>94%</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Complaints resolved</span>
                  <strong>88%</strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>Locations healthy</span>
                  <strong>87.5%</strong>
                </div>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleExportReport}
                >
                  Export Report →
                </button>
              </div>
            </div>
          )}
        </main>

        <footer
          className="dashboard-footer"
          aria-label="Authority quick navigation"
        >
          <button
            type="button"
            onClick={() =>
              openAuthorityDashboardSection(
                "overview"
              )
            }
          >
            🏠 Home
          </button>

          <button
            type="button"
            onClick={() =>
              openAuthorityDashboardSection(
                "crowd"
              )
            }
          >
            👥 Crowd
          </button>

          <button
            type="button"
            onClick={() =>
              openAuthorityDashboardSection(
                "complaints"
              )
            }
          >
            📝 Complaints
          </button>

          <button
            type="button"
            onClick={() =>
              openAuthorityDashboardSection(
                "safety"
              )
            }
          >
            🚨 Safety
          </button>

          <button
            type="button"
            onClick={() =>
              openAuthorityDashboardSection(
                "reports"
              )
            }
          >
            📊 Reports
          </button>
        </footer>

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  /* =========================================================
     ADDED: LOCAL PROVIDER DASHBOARD NAVIGATION
  ========================================================= */

  const openLocalDashboardSection = (
    section: string
  ) => {
    setLocalDashboardSection(section);

    /* reload requests / chats / reviews when entering them */
    if (
      section === "requests" ||
      section === "chats" ||
      section === "reviews"
    ) {
      void loadProviderWorkspace();
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const logoutLocalProvider = async () => {
    setShowLocalDashboard(false);
    setShowLogin(false);

    await performLogout();

    setTimeout(() => {
      document.getElementById("home")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  };

  /* =========================================================
     EMAIL / PASSWORD LOGIN
  ========================================================= */

  const handleUserLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!userEmail || !userPassword) {
      notify(
        "Please enter your email and password.",
        "error"
      );
      return;
    }

    try {
      const result =
        await signInWithEmailAndPassword(
          auth,
          userEmail,
          userPassword
        );

      const user = result.user;

      notify(
        `Welcome back to HostelConnect!\nLogged in as ${
          user.email || userEmail
        }`,
        "success"
      );

      console.log(
        "Firebase user:",
        user
      );

      await completeSignIn(user, "traveller");
    } catch (error) {
      console.error(
        "Email login error:",
        error
      );

      const errorCode =
        (
          error as {
            code?: string;
          }
        )?.code;

      if (
        errorCode ===
        "auth/invalid-credential"
      ) {
        notify(
          "Invalid email or password.",
          "error"
        );
      } else if (
        errorCode ===
        "auth/user-not-found"
      ) {
        notify(
          "No account was found with this email.",
          "error"
        );
      } else if (
        errorCode ===
        "auth/wrong-password"
      ) {
        notify(
          "Incorrect password.",
          "error"
        );
      } else if (
        errorCode ===
        "auth/invalid-email"
      ) {
        notify(
          "Please enter a valid email address.",
          "error"
        );
      } else {
        notify(
          "Login failed. Please try again.",
          "error"
        );
      }
    }
  };

  /* =========================================================
     GOOGLE LOGIN
  ========================================================= */

  const handleGoogleLogin =
    async () => {
      try {
        const result =
          await signInWithPopup(
            auth,
            googleProvider
          );

        const user = result.user;

        notify(
          `Welcome to HostelConnect, ${
            user.displayName ||
            user.email ||
            "Traveller"
          }!`,
          "success"
        );

        console.log(
          "Google user:",
          user
        );

        await completeSignIn(user, "traveller");
      } catch (error) {
        console.error(
          "Google login error:",
          error
        );

        const errorCode =
          (
            error as {
              code?: string;
            }
          )?.code;

        if (
          errorCode ===
          "auth/popup-closed-by-user"
        ) {
          return;
        }

        if (
          errorCode ===
          "auth/popup-blocked"
        ) {
          notify(
            "The Google login popup was blocked by your browser. Please allow popups for this site and try again.",
            "error"
          );
          return;
        }

        if (
          errorCode ===
          "auth/cancelled-popup-request"
        ) {
          return;
        }

        notify(
          "Google login failed. Please try again.",
          "error"
        );
      }
    };

  /* =========================================================
     APPLE LOGIN
  ========================================================= */

  const handleAppleLogin =
    async () => {
      try {
        const result =
          await signInWithPopup(
            auth,
            appleProvider
          );

        const user = result.user;

        notify(
          `Welcome to HostelConnect, ${
            user.displayName ||
            user.email ||
            "Traveller"
          }!`,
          "success"
        );

        console.log(
          "Apple user:",
          user
        );

        await completeSignIn(user, "traveller");
      } catch (error) {
        console.error(
          "Apple login error:",
          error
        );

        const errorCode =
          (
            error as {
              code?: string;
            }
          )?.code;

        if (
          errorCode ===
          "auth/popup-closed-by-user"
        ) {
          return;
        }

        if (
          errorCode ===
          "auth/popup-blocked"
        ) {
          notify(
            "The Apple login popup was blocked by your browser. Please allow popups for this site and try again.",
            "error"
          );
          return;
        }

        if (
          errorCode ===
          "auth/cancelled-popup-request"
        ) {
          return;
        }

        if (
          errorCode ===
          "auth/operation-not-allowed"
        ) {
          notify(
            "Apple sign-in is not enabled for this Firebase project yet — activate the Apple provider under Authentication → Sign-in method.",
            "info"
          );
          return;
        }

        notify(
          "Apple login could not be completed. Please check the Apple provider configuration in Firebase.",
          "error"
        );
      }
    };

  /* =========================================================
     ADDED: USER DASHBOARD NAVIGATION
  ========================================================= */

  const openUserDashboardSection = (
    section: string
  ) => {
    setDashboardSection(section);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const dashboardTitle =
    dashboardSection === "overview"
      ? "Your Travel Overview"
      : dashboardSection === "connect"
      ? "User–Local Connect"
      : dashboardSection === "crowd"
      ? "Crowd Predictor"
      : dashboardSection === "cleanliness"
      ? "Cleanliness"
      : "Emergency";

  /* =========================================================
     ADDED: USER DASHBOARD
  ========================================================= */

  if (showUserDashboard) {
    return (
      <div className="app user-dashboard-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        <nav className="navbar dashboard-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={closeLogin}
            aria-label="Back to HostelConnect home"
          >
            Hostel<span>Connect</span>
          </button>

          <div className="dashboard-user-info">
            <span>👤 User</span>
          </div>

          <button
            type="button"
            className="login-btn"
            onClick={() => void performLogout()}
          >
            Logout
          </button>
        </nav>

        <main className="user-dashboard-content">
          <div className="dashboard-nav">
            <button
              type="button"
              className={
                dashboardSection === "overview"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              aria-current={dashboardSection === "overview" ? "page" : undefined}
              onClick={() =>
                openUserDashboardSection(
                  "overview"
                )
              }
            >
              Overview
            </button>

            <button
              type="button"
              className={
                dashboardSection === "connect"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              aria-current={dashboardSection === "connect" ? "page" : undefined}
              onClick={() =>
                openUserDashboardSection(
                  "connect"
                )
              }
            >
              User–Local Connect
            </button>

            <button
              type="button"
              className={
                dashboardSection === "crowd"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              aria-current={dashboardSection === "crowd" ? "page" : undefined}
              onClick={() =>
                openUserDashboardSection(
                  "crowd"
                )
              }
            >
              Crowd Predictor
            </button>

            <button
              type="button"
              className={
                dashboardSection === "cleanliness"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              aria-current={dashboardSection === "cleanliness" ? "page" : undefined}
              onClick={() =>
                openUserDashboardSection(
                  "cleanliness"
                )
              }
            >
              Cleanliness
            </button>

            <button
              type="button"
              className={
                dashboardSection === "emergency"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              aria-current={dashboardSection === "emergency" ? "page" : undefined}
              onClick={() =>
                openUserDashboardSection(
                  "emergency"
                )
              }
            >
              Emergency
            </button>

            <button
              type="button"
              className={
                dashboardSection === "saved"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              aria-current={dashboardSection === "saved" ? "page" : undefined}
              onClick={() =>
                openUserDashboardSection(
                  "saved"
                )
              }
            >
              Saved
            </button>
          </div>

          <section className="dashboard-heading">
            <p className="section-label">
              HOSTELCONNECT • PERSONAL DASHBOARD
            </p>

            <h1>{dashboardTitle}</h1>

            <p>
              Personalized information for your
              journey.
            </p>
          </section>

          {dashboardSection === "overview" && (
            <>
              <div className="dashboard-grid reveal">

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">
                    📍
                  </span>

                  <div>
                    <p>Location</p>

                    <div className="location-search-wrap">
                      <input
                        type="text"
                        value={locationQuery}
                        onChange={(event) => {
                          setLocationQuery(
                            event.target.value
                          );
                          setLocationSearchMessage("");
                        }}
                        onKeyDown={
                          handleLocationKeyDown
                        }
                        placeholder="Search any city, landmark, or place..."
                        aria-label="Search for a location"
                        autoComplete="off"
                      />

                      <button
                        type="button"
                        className="location-search-btn"
                        onClick={() =>
                          void searchLocation()
                        }
                        disabled={
                          isSearchingLocation
                        }
                        aria-busy={isSearchingLocation}
                      >
                        {isSearchingLocation
                          ? "Searching..."
                          : "Search"}
                      </button>
                    </div>

                    {locationSearchMessage && (
                      <small
                        aria-live="polite"
                        className={
                          locationSearchMessage.includes(
                            "successfully"
                          )
                            ? "location-search-success"
                            : "location-search-message"
                        }
                      >
                        {locationSearchMessage}
                      </small>
                    )}
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">
                    🕐
                  </span>

                  <div>
                    <p>Time</p>
                    <strong>
                      {new Date().toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </strong>

                    <small>
                      Current visit time
                    </small>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">
                    🚦
                  </span>

                  <div>
                    <p>Traffic Level</p>

                    <strong
                      className={`traffic-badge traffic-${trafficLevel.toLowerCase()}`}
                    >
                      {trafficIcon} {trafficLevel}
                    </strong>

                    <div
                      className="traffic-meter"
                      aria-hidden="true"
                    >
                      <span
                        className={`meter-bar${trafficLevel === "Low" ? " on is-low" : ""}`}
                      />
                      <span
                        className={`meter-bar${trafficLevel === "Moderate" ? " on is-moderate" : ""}`}
                      />
                      <span
                        className={`meter-bar${trafficLevel === "High" ? " on is-high" : ""}`}
                      />
                    </div>

                    <small>
                      Current traffic at {selectedLocation}
                    </small>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">
                    ❤️
                  </span>

                  <div>
                    <p>Your Interests</p>

                    <select
                      value={userInterest}
                      onChange={(event) =>
                        setUserInterest(
                          event.target.value
                        )
                      }
                    >
                      <option>
                        Culture
                      </option>
                      <option>
                        Nature
                      </option>
                      <option>
                        Food
                      </option>
                      <option>
                        Adventure
                      </option>
                      <option>
                        History
                      </option>
                      <option>
                        Shopping
                      </option>
                    </select>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">
                    💰
                  </span>

                  <div>
                    <p>Budget</p>

                    <select
                      value={userBudget}
                      onChange={(event) =>
                        setUserBudget(
                          event.target.value
                        )
                      }
                    >
                      <option>
                        ₹5,000
                      </option>
                      <option>
                        ₹10,000
                      </option>
                      <option>
                        ₹25,000
                      </option>
                      <option>
                        ₹50,000+
                      </option>
                    </select>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">
                    🌤️
                  </span>

                  <div>
                    <p>Weather</p>
                    <strong>
                      27°C • Partly Cloudy
                    </strong>

                    <small>
                      Pleasant conditions
                    </small>
                  </div>
                </div>

              </div>

              <div className="dashboard-card ai-recommendation-card reveal">
                <div className="ai-card-header">
                  <span className="dashboard-card-icon">
                    🤖
                  </span>

                  <div>
                    <p>AI Recommendation</p>

                    <h2>
                      Discover a better way to
                      explore today
                    </h2>
                  </div>
                </div>

                <p className="ai-recommendation-text">
                  Based on your location,
                  interests, budget, and current
                  crowd levels, HostelConnect
                  recommends exploring nearby
                  attractions before visiting the
                  busiest spots.
                </p>

                <div className="ai-recommendation-tags">
                  <span>
                    📍 Nearby
                  </span>

                  <span>
                    👥 Lower Crowd
                  </span>

                  <span>
                    ❤️ {userInterest}
                  </span>

                  <span>
                    💰 {userBudget}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="primary-btn dashboard-plan-btn"
                onClick={() =>
                  openTripPlanner(
                    null,
                    savedTrip ? "route" : "plan"
                  )
                }
              >
                ✨ Plan / Update My Trip
              </button>
            </>
          )}

          {dashboardSection === "connect" && (
            <div className="dashboard-feature-panel reveal">
              <div className="dashboard-feature-card">
                <span className="dashboard-card-icon">
                  🏠
                </span>

                <h2>
                  Local Homestays
                </h2>

                <p>
                  Find homestays with ratings,
                  prices, availability, images,
                  and local experiences.
                </p>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    void openBrowse("Homestay")
                  }
                >
                  Explore Homestays →
                </button>
              </div>

              <div className="dashboard-feature-card">
                <span className="dashboard-card-icon">
                  🧑‍🤝‍🧑
                </span>

                <h2>
                  Local Guides
                </h2>

                <p>
                  Connect with local guides
                  based on location, language,
                  speciality, rating, and price.
                </p>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    void openBrowse("Guide")
                  }
                >
                  Find Guides →
                </button>
              </div>

              <div className="dashboard-feature-card">
                <span className="dashboard-card-icon">
                  🎭
                </span>

                <h2>
                  Arts & Crafts
                </h2>

                <p>
                  Discover local products,
                  artisans, ratings, prices,
                  durability, and seller details.
                </p>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    void openBrowse("Arts & Crafts")
                  }
                >
                  Explore Local Crafts →
                </button>
              </div>

              {myRequests.length > 0 && (
                <div className="dashboard-card">
                  <p>🧳 MY REQUESTS</p>

                  <h2>Request status</h2>

                  {myRequests.map((request) => (
                    <div
                      className="dashboard-stat-row"
                      key={request.id}
                    >
                      <span>
                        {request.providerName}
                        {request.date
                          ? ` • ${request.date}`
                          : ""}
                      </span>

                      <strong>
                        <span
                          className={`status-chip status-${
                            request.status === "accepted"
                              ? "accepted"
                              : request.status ===
                                "declined"
                              ? "declined"
                              : "pending"
                          }`}
                        >
                          {request.status === "pending"
                            ? "⏳ Pending"
                            : request.status ===
                              "accepted"
                            ? "✓ Accepted"
                            : "✕ Declined"}
                        </span>
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {dashboardSection === "crowd" && (
            <div className="dashboard-feature-panel reveal">
              <div className="dashboard-card crowd-search-card">
                <div>
                  <p>
                    Search Specific Spot
                  </p>

                  <input
                    type="text"
                    placeholder="Search a tourist spot..."
                    aria-label="Search a monitored tourist spot"
                    value={crowdQuery}
                    onChange={(event) => {
                      setCrowdQuery(event.target.value);
                      setCrowdMessage("");
                    }}
                    onKeyDown={handleCrowdKeyDown}
                  />
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={searchCrowdSpot}
                >
                  Search
                </button>

                {crowdMessage && (
                  <small
                    className="panel-note"
                    aria-live="polite"
                  >
                    {crowdMessage}
                  </small>
                )}
              </div>

              <div className="dashboard-card">
                <p>
                  Selected Spot
                </p>

                <h2>
                  📍 {selectedLocation}
                </h2>

                <div className="dashboard-stat-row">
                  <span>
                    👥 Current People
                  </span>

                  <strong>
                    {crowdStats.people.toLocaleString()}
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    📊 Density
                  </span>

                  <strong>
                    {crowdStats.density}
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    📈 Expected
                  </span>

                  <strong>
                    {crowdStats.trend}
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    ⏱️ Waiting
                  </span>

                  <strong>
                    {crowdStats.wait}
                  </strong>
                </div>
              </div>

              <div className="dashboard-card ai-recommendation-card reveal">
                <div className="ai-card-header">
                  <span className="dashboard-card-icon">
                    🤖
                  </span>

                  <div>
                    <p>
                      AI Travel Planner
                    </p>

                    <h2>
                      Try a nearby spot first
                    </h2>
                  </div>
                </div>

                <p>
                  Lal Mahal may provide a
                  lower-crowd alternative
                  nearby before visiting the
                  busiest attraction.
                </p>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    openTripPlanner(null, "route")
                  }
                >
                  ✨ Generate My Route
                </button>
              </div>
            </div>
          )}

          {dashboardSection === "cleanliness" && (
            <div className="dashboard-feature-panel reveal">
              <div className="dashboard-card">
                <p>
                  🧹 Community Cleanliness
                </p>

                <h2>
                  Problems reported by
                  travellers
                </h2>

                {isViewingProblems && (
                  <div className="problem-list">
                    {reports.length === 0 ? (
                      <p className="panel-note">
                        {isLoadingReports
                          ? "Loading community reports…"
                          : "No traveller reports stored yet — submit the first one in the form below."}
                      </p>
                    ) : (
                      reports.map((report) => (
                        <div
                          className="problem-preview"
                          key={report.id}
                        >
                          <strong>
                            {report.problem}
                          </strong>

                          <span>
                            📍{" "}
                            {report.location ||
                              "Unspecified location"}
                          </span>

                          <span>
                            👍 {report.votes} vote
                            {report.votes === 1
                              ? ""
                              : "s"}{" "}
                            •{" "}
                            <span
                              className={`status-chip status-${report.status}`}
                            >
                              {report.status === "open"
                                ? "🔴 Open"
                                : report.status ===
                                  "in-review"
                                ? "🟡 In review"
                                : "🟢 Resolved"}
                            </span>
                          </span>

                          {report.officer && (
                            <span>
                              👮 Assigned: {report.officer}
                            </span>
                          )}

                          <button
                            type="button"
                            className="vote-btn"
                            disabled={isVoting}
                            aria-pressed={report.voters.includes(
                              currentUser?.uid ?? ""
                            )}
                            onClick={() =>
                              void handleVoteReport(report)
                            }
                          >
                            {report.voters.includes(
                              currentUser?.uid ?? ""
                            )
                              ? "✓ Voted"
                              : "👍 Upvote"}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <p className="section-label">
                  Recently highlighted by the community
                </p>

                <div className="problem-preview">
                  <strong>
                    🥇 Overflowing Garbage
                  </strong>

                  <span>
                    📍 Shaniwar Wada
                  </span>

                  <span>
                    👍 248 votes • 🔥 High
                    impact
                  </span>
                </div>

                <div className="problem-preview">
                  <strong>
                    🥈 Dirty Toilets
                  </strong>

                  <span>
                    📍 Tourist Zone
                  </span>

                  <span>
                    👍 186 votes • 🔥 High
                    impact
                  </span>
                </div>

                <button
                  type="button"
                  className="secondary-btn"
                  disabled={isLoadingReports}
                  onClick={() => void handleViewProblems()}
                >
                  {isLoadingReports
                    ? "Loading..."
                    : isViewingProblems
                    ? "Hide Community Board"
                    : "View Problems →"}
                </button>
              </div>

              <div className="dashboard-card">
                <p>
                  ➕ Report New Problem
                </p>

                <input
                  type="text"
                  placeholder="Problem name"
                  aria-label="Problem name"
                  value={reportProblem}
                  onChange={(event) =>
                    setReportProblem(event.target.value)
                  }
                />

                <input
                  type="text"
                  placeholder="Location"
                  aria-label="Problem location"
                  value={reportLocation}
                  onChange={(event) =>
                    setReportLocation(event.target.value)
                  }
                />

                <textarea
                  placeholder="Describe the problem..."
                  rows={4}
                  aria-label="Problem details"
                  value={reportDetails}
                  onChange={(event) =>
                    setReportDetails(event.target.value)
                  }
                />

                <button
                  type="button"
                  className="primary-btn"
                  disabled={isSubmittingReport}
                  onClick={() => void handleSubmitReport()}
                >
                  {isSubmittingReport
                    ? "Submitting..."
                    : "🚨 Submit Report"}
                </button>
              </div>
            </div>
          )}

          {dashboardSection === "emergency" && (
            <div className="dashboard-feature-panel reveal">
              <div className="dashboard-card emergency-alert-card">
                <p>
                  ⚠️ Location Warnings
                </p>

                <h2>
                  High crowd activity detected
                </h2>

                <p>
                  {selectedLocation.split(",")[0]}{" "}
                  currently has approximately{" "}
                  {crowdStats.people.toLocaleString()}{" "}
                  people.
                </p>
              </div>

              <div className="dashboard-card">
                <p>
                  🏥 Nearby Emergency Services
                </p>

                <div className="emergency-service">
                  <strong>
                    🚔 Police Station
                  </strong>

                  <span>
                    0.8 km •{" "}
                    <a
                      className="emergency-tel"
                      href="tel:100"
                    >
                      📞 100
                    </a>
                  </span>
                </div>

                <div className="emergency-service">
                  <strong>
                    🏥 Hospital
                  </strong>

                  <span>
                    1.2 km •{" "}
                    <a
                      className="emergency-tel"
                      href="tel:108"
                    >
                      📞 108
                    </a>
                  </span>
                </div>

                <div className="emergency-service">
                  <strong>
                    🚒 Fire Station
                  </strong>

                  <span>
                    2.0 km •{" "}
                    <a
                      className="emergency-tel"
                      href="tel:101"
                    >
                      📞 101
                    </a>
                  </span>
                </div>
              </div>

              <div className="dashboard-card">
                <p>
                  🆘 Emergency Contacts
                </p>

                <div className="dashboard-stat-row">
                  <span>
                    Police
                  </span>

                  <strong>
                    <a
                      className="emergency-tel"
                      href="tel:100"
                    >
                      100
                    </a>
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    Ambulance
                  </span>

                  <strong>
                    <a
                      className="emergency-tel"
                      href="tel:108"
                    >
                      108
                    </a>
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    Fire
                  </span>

                  <strong>
                    <a
                      className="emergency-tel"
                      href="tel:101"
                    >
                      101
                    </a>
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    Tourist Helpline
                  </span>

                  <strong>
                    <a
                      className="emergency-tel"
                      href="tel:1363"
                    >
                      1363
                    </a>
                  </strong>
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleCallHelp}
                >
                  🚨 Call for Help
                </button>
              </div>
            </div>
          )}
          {dashboardSection === "saved" && (
            <div className="local-request-list reveal">
              {destinations.filter((entry) =>
                savedIds.includes(entry.id)
              ).length === 0 ? (
                <div className="dashboard-card">
                  <p>❤️ SAVED PLACES</p>

                  <h2>Nothing saved yet</h2>

                  <p>
                    Open any destination and tap Save —
                    it will be waiting for you here.
                  </p>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() =>
                      scrollToSection("destinations")
                    }
                  >
                    Browse Destinations →
                  </button>
                </div>
              ) : (
                destinations
                  .filter((entry) =>
                    savedIds.includes(entry.id)
                  )
                  .map((entry) => (
                    <div
                      className="dashboard-card local-service-card"
                      key={entry.id}
                    >
                      <span className="dashboard-card-icon">
                        📍
                      </span>

                      <p>SAVED DESTINATION</p>

                      <h2>{entry.name}</h2>

                      <p>📍 {entry.location}</p>

                      <p>🗓 {entry.bestTime}</p>

                      <p>⏱ {entry.duration}</p>

                      <div className="local-request-actions">
                        <button
                          type="button"
                          className="primary-btn"
                          onClick={() =>
                            openDestination(entry)
                          }
                        >
                          Open
                        </button>

                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() =>
                            void handleToggleSave(
                              entry.id
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </main>

        <footer
          className="dashboard-footer"
          aria-label="Traveller quick navigation"
        >
          <button
            type="button"
            onClick={() =>
              scrollToSection("home")
            }
          >
            🏠 Home
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection("destinations")
            }
          >
            🗺️ Explore
          </button>

          <button
            type="button"
            onClick={() =>
              openUserDashboardSection("saved")
            }
          >
            ❤️ Saved
          </button>

          <button
            type="button"
            onClick={() =>
              openTripPlanner(
                null,
                savedTrip ? "route" : "plan"
              )
            }
          >
            🎫 My Trips
          </button>

          <button
            type="button"
            onClick={() =>
              openUserDashboardSection(
                "overview"
              )
            }
          >
            👤 Profile
          </button>
        </footer>

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  /* =========================================================
     TRIP PLANNER (Plan My Trip / Generate My Route)
  ========================================================= */

  if (showTripPlanner) {
    const plannerDestination =
      destinations.find(
        (entry) => entry.id === plannerDestId
      ) ?? destinations[0];

    return (
      <div className="app user-dashboard-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        <nav className="navbar dashboard-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={() => setShowTripPlanner(false)}
            aria-label="Back to HostelConnect dashboard"
          >
            Hostel<span>Connect</span>
          </button>

          <div className="dashboard-user-info">
            <span>✈️ Trip Planner</span>
          </div>

          <button
            type="button"
            className="login-btn"
            onClick={() => setShowTripPlanner(false)}
          >
            ← Dashboard
          </button>
        </nav>

        <main className="user-dashboard-content">
          <div className="dashboard-nav">
            <button
              type="button"
              className={
                plannerTab === "plan"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              aria-current={plannerTab === "plan" ? "page" : undefined}
              onClick={() => setPlannerTab("plan")}
            >
              Plan Trip
            </button>

            <button
              type="button"
              className={
                plannerTab === "route"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              aria-current={plannerTab === "route" ? "page" : undefined}
              onClick={() => setPlannerTab("route")}
            >
              My Route
            </button>
          </div>

          <section className="dashboard-heading">
            <p className="section-label">
              HOSTELCONNECT • TRIP PLANNER
            </p>

            <h1>
              {plannerTab === "plan"
                ? "Plan My Trip"
                : "Your Day-by-Day Route"}
            </h1>

            <p>
              Built from HostelConnect destination data.
              {savedTrip
                ? ` Last saved ${
                    savedTrip.updatedAt
                      ? new Date(
                          savedTrip.updatedAt
                        ).toLocaleDateString()
                      : "recently"
                  }.`
                : " Nothing saved yet — your plan appears here once saved."}
            </p>
          </section>

          {plannerTab === "plan" ? (
            <>
              <div className="dashboard-grid reveal">
                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">
                    📍
                  </span>

                  <div>
                    <p>Destination</p>

                    <select
                      value={plannerDestId}
                      onChange={(event) => {
                        setPlannerDestId(
                          event.target.value
                        );

                        const next = destinations.find(
                          (entry) =>
                            entry.id === event.target.value
                        );

                        if (next) {
                          setPlannerHighlights(
                            next.highlights.slice(0, 2)
                          );
                        }
                      }}
                    >
                      {destinations.map((entry) => (
                        <option
                          key={entry.id}
                          value={entry.id}
                        >
                          {entry.name} — {entry.location}
                        </option>
                      ))}
                    </select>

                    <small>
                      🗓 Best time: {plannerDestination.bestTime}{" "}
                      • ⏱ Suggested stay:{" "}
                      {plannerDestination.duration}
                    </small>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">
                    🗓️
                  </span>

                  <div>
                    <p>Trip Length (days)</p>

                    <input
                      type="number"
                      min={1}
                      max={14}
                      aria-label="Trip length in days"
                      value={plannerDays}
                      onChange={(event) =>
                        setPlannerDays(
                          Number(event.target.value) || 1
                        )
                      }
                    />

                    <p>Pace</p>

                    <select
                      value={plannerPace}
                      onChange={(event) =>
                        setPlannerPace(
                          event.target
                            .value as ItineraryPace
                        )
                      }
                    >
                      <option>Relaxed</option>
                      <option>Balanced</option>
                      <option>Packed</option>
                    </select>
                  </div>
                </div>

                <div className="dashboard-card dashboard-card-wide">
                  <span className="dashboard-card-icon">
                    📝
                  </span>

                  <div>
                    <p>Notes for this trip</p>

                    <textarea
                      rows={5}
                      placeholder="Budget reminders, travel companions, accessibility needs..."
                      aria-label="Trip notes"
                      value={plannerNotes}
                      onChange={(event) =>
                        setPlannerNotes(event.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="highlights-section reveal">
                <p className="section-label">
                  ACTIVITIES TO INCLUDE
                </p>

                <h2>
                  Pick your {plannerDestination.name}{" "}
                  highlights
                </h2>

                <div className="highlights-grid">
                  {plannerDestination.highlights.map(
                    (highlight) => {
                      const selected =
                        plannerHighlights.includes(highlight);

                      return (
                        <button
                          type="button"
                          key={highlight}
                          className={`highlight-card${
                            selected ? " is-selected" : ""
                          }`}
                          aria-pressed={selected}
                          onClick={() =>
                            setPlannerHighlights((current) =>
                              selected
                                ? current.filter(
                                    (entry) =>
                                      entry !== highlight
                                  )
                                : [...current, highlight]
                            )
                          }
                        >
                          <span>
                            {selected ? "✓" : "＋"}
                          </span>

                          <h3>{highlight}</h3>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="planner-actions">
                <button
                  type="button"
                  className="primary-btn"
                  disabled={isSavingTrip}
                  onClick={() => void handleSaveTrip(false)}
                >
                  {isSavingTrip
                    ? "Saving..."
                    : "💾 Save My Plan"}
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  disabled={isSavingTrip}
                  onClick={() => void handleSaveTrip(true)}
                >
                  Save &amp; Generate Route →
                </button>

                {savedTrip && (
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => void handleDeleteTrip()}
                  >
                    Delete Plan
                  </button>
                )}
              </div>

              {storeMode === "device" && (
                <p className="storage-note">
                  💾 Currently saving on this device. Deploy
                  Firestore (see firestore.rules) to sync your
                  plan across devices.
                </p>
              )}
            </>
          ) : savedTrip ? (
            <>
              <div className="local-request-list reveal">
                {buildItinerary(savedTrip).map((day) => (
                  <div
                    className="dashboard-card itinerary-day"
                    key={day.label}
                  >
                    <p>{day.label}</p>

                    {day.items.map((item, index) => (
                      <div
                        className="dashboard-stat-row"
                        key={`${day.label}-${index}`}
                      >
                        <span>
                          {index === 0
                            ? "🎯"
                            : index === day.items.length - 1
                            ? "🌙"
                            : "🚶"}
                        </span>

                        <strong>{item}</strong>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="planner-actions">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleExportTrip}
                >
                  ⬇ Download Itinerary (.txt)
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setPlannerTab("plan")}
                >
                  ✏️ Edit Plan
                </button>
              </div>
            </>
          ) : (
            <div className="dashboard-card reveal">
              <p>🧭 NO ROUTE YET</p>

              <h2>Save a plan to generate your route</h2>

              <p>
                HostelConnect arranges your chosen highlights
                into a day-by-day itinerary from the plan you
                save here.
              </p>

              <button
                type="button"
                className="primary-btn"
                onClick={() => setPlannerTab("plan")}
              >
                ✨ Plan My Trip →
              </button>
            </div>
          )}
        </main>

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  /* =========================================================
     EXPLORE LOCAL PARTNERS
     (Homestays / Guides / Crafts — real provider listings
     stored by the Local Provider dashboards)
  ========================================================= */

  if (browseType) {
    const normalizedQuery = browseQuery
      .trim()
      .toLowerCase();

    const visible = browseItems.filter(
      (entry) =>
        !normalizedQuery ||
        entry.name
          .toLowerCase()
          .includes(normalizedQuery) ||
        entry.location
          .toLowerCase()
          .includes(normalizedQuery)
    );

    const headline =
      browseType === "Homestay"
        ? "Explore Homestays"
        : browseType === "Guide"
        ? "Find Local Guides"
        : "Discover Local Crafts";

    return (
      <div className="app user-dashboard-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        <nav className="navbar dashboard-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={closeBrowse}
            aria-label="Back to HostelConnect dashboard"
          >
            Hostel<span>Connect</span>
          </button>

          <div className="dashboard-user-info">
            <span>🤝 Local Connect</span>
          </div>

          <button
            type="button"
            className="login-btn"
            onClick={closeBrowse}
          >
            ← Dashboard
          </button>
        </nav>

        <main className="user-dashboard-content">
          <section className="dashboard-heading">
            <p className="section-label">
              HOSTELCONNECT • LOCAL CONNECT
            </p>

            <h1>{headline}</h1>

            <p>
              {isBrowseLoading
                ? "Loading local partners…"
                : `${visible.length} listing${
                    visible.length === 1 ? "" : "s"
                  } from registered HostelConnect providers.`}
            </p>
          </section>

          <div className="location-search-wrap">
            <input
              type="text"
              value={browseQuery}
              onChange={(event) =>
                setBrowseQuery(event.target.value)
              }
              placeholder="Filter by name or location..."
              aria-label={`Filter ${browseType} listings`}
            />
          </div>

          {!isBrowseLoading &&
            storeMode === "device" &&
            browseItems.length > 0 && (
              <p className="storage-note">
                💾 Listings are served from this device until
                Firestore is connected.
              </p>
            )}

          <div className="local-dashboard-grid reveal">
            {visible.map((provider) => (
              <div
                className="dashboard-card local-service-card"
                key={provider.uid}
              >
                <span className="dashboard-card-icon">
                  {provider.type === "Homestay"
                    ? "🏠"
                    : provider.type === "Guide"
                    ? "🧑‍🤝‍🧑"
                    : "🎭"}
                </span>

                <p>{provider.type}</p>

                <h2>{provider.name}</h2>

                <p>📍 {provider.location}</p>

                <p>
                  ⭐ {provider.rating}
                  {provider.reviewCount > 0
                    ? ` (${provider.reviewCount} review${
                        provider.reviewCount === 1
                          ? ""
                          : "s"
                      })`
                    : ""}
                </p>

                <p>🟢 {provider.availability}</p>

                <strong>{provider.price}</strong>

                {provider.about && <p>{provider.about}</p>}

                <div className="local-request-actions">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => {
                      setReviewFormFor(null);
                      setRequestFormFor(
                        requestFormFor === provider.uid
                          ? null
                          : provider.uid
                      );
                    }}
                  >
                    {requestFormFor === provider.uid
                      ? "Close"
                      : "Request / Message"}
                  </button>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setRequestFormFor(null);
                      setReviewFormFor(
                        reviewFormFor === provider.uid
                          ? null
                          : provider.uid
                      );
                    }}
                  >
                    ★ Rate
                  </button>
                </div>

                {requestFormFor === provider.uid && (
                  <div className="inline-form">
                    <p>Date</p>

                    <input
                      type="date"
                      aria-label="Requested date"
                      min={new Date()
                        .toISOString()
                        .slice(0, 10)}
                      value={requestDate}
                      onChange={(event) =>
                        setRequestDate(event.target.value)
                      }
                    />

                    <p>Guests / party size</p>

                    <input
                      type="number"
                      min={1}
                      max={20}
                      aria-label="Number of guests"
                      value={requestGuests}
                      onChange={(event) =>
                        setRequestGuests(
                          Number(event.target.value) || 1
                        )
                      }
                    />

                    <p>Note or message (optional)</p>

                    <input
                      type="text"
                      aria-label="Note for the provider"
                      placeholder="Tell them what you need..."
                      value={requestNote}
                      onChange={(event) =>
                        setRequestNote(event.target.value)
                      }
                    />

                    <div className="local-request-actions">
                      <button
                        type="button"
                        className="primary-btn"
                        disabled={isSendingRequest}
                        onClick={() =>
                          void handleSendRequest(provider)
                        }
                      >
                        {isSendingRequest
                          ? "Sending..."
                          : "Send Request"}
                      </button>

                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() =>
                          void handleSendMessageToProvider(
                            provider
                          )
                        }
                      >
                        Send Message Only
                      </button>
                    </div>
                  </div>
                )}

                {reviewFormFor === provider.uid && (
                  <div className="inline-form">
                    <p>Your rating</p>

                    <select
                      aria-label="Star rating"
                      value={String(reviewRating)}
                      onChange={(event) =>
                        setReviewRating(
                          Number(event.target.value)
                        )
                      }
                    >
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <option
                          key={stars}
                          value={stars}
                        >
                          {"★".repeat(stars)}
                          {"☆".repeat(5 - stars)}
                        </option>
                      ))}
                    </select>

                    <p>Comment (optional)</p>

                    <textarea
                      rows={3}
                      aria-label="Review comment"
                      placeholder="How was your experience?"
                      value={reviewText}
                      onChange={(event) =>
                        setReviewText(event.target.value)
                      }
                    />

                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() =>
                        void handleAddReview(provider)
                      }
                    >
                      Submit Review
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isBrowseLoading && (
              <div className="dashboard-card">
                <p>LOADING</p>

                <h2>Checking local partner listings…</h2>
              </div>
            )}

            {!isBrowseLoading && visible.length === 0 && (
              <div className="dashboard-card dashboard-card-wide">
                <p>🤝 {headline.toUpperCase()}</p>

                <h2>
                  {browseItems.length === 0
                    ? "No local partners are listed yet"
                    : "No listings match your filter"}
                </h2>

                <p>
                  {browseItems.length === 0
                    ? `HostelConnect shows real ${
                        browseType === "Arts & Crafts"
                          ? "artisan"
                          : browseType === "Guide"
                          ? "guide"
                          : "homestay"
                      } listings here as soon as local providers
                      save their profile in the Local Provider
                      dashboard. No placeholders — real
                      partners only.`
                    : "Try a shorter search term or clear the filter."}
                </p>

                {browseItems.length === 0 && (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={closeBrowse}
                  >
                    ← Back to Dashboard
                  </button>
                )}
              </div>
            )}
          </div>
        </main>

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  /* =========================================================
     ADDED: LOCAL PROVIDER DASHBOARD
  ========================================================= */

  if (showLocalDashboard) {
    return (
      <div className="app local-dashboard-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        <nav className="navbar dashboard-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={logoutLocalProvider}
            aria-label="Back to HostelConnect home"
          >
            Hostel<span>Connect</span>
          </button>

          <div className="dashboard-user-info">
            <span>🏡 Local Provider</span>
          </div>

          <button
            type="button"
            className="login-btn"
            onClick={logoutLocalProvider}
          >
            Logout
          </button>
        </nav>

        <main className="local-dashboard-content">
          <div className="dashboard-nav">
            <button
              type="button"
              className={
                localDashboardSection === "profile"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              aria-current={localDashboardSection === "profile" ? "page" : undefined}
              onClick={() =>
                openLocalDashboardSection(
                  "profile"
                )
              }
            >
              Profile
            </button>

            <button
              type="button"
              className={
                localDashboardSection === "details"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              aria-current={localDashboardSection === "details" ? "page" : undefined}
              onClick={() =>
                openLocalDashboardSection(
                  "details"
                )
              }
            >
              Details
            </button>

            <button
              type="button"
              className={
                localDashboardSection === "requests"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              aria-current={localDashboardSection === "requests" ? "page" : undefined}
              onClick={() =>
                openLocalDashboardSection(
                  "requests"
                )
              }
            >
              Traveller Requests
            </button>

            {providerType !== "Arts & Crafts" && (
              <button
                type="button"
                className={
                  localDashboardSection === "chats"
                    ? "dashboard-nav-btn active"
                    : "dashboard-nav-btn"
                }
                aria-current={localDashboardSection === "chats" ? "page" : undefined}
                onClick={() =>
                  openLocalDashboardSection(
                    "chats"
                  )
                }
              >
                Chats
              </button>
            )}

            <button
              type="button"
              className={
                localDashboardSection === "reviews"
                  ? "dashboard-nav-btn active"
                  : "dashboard-nav-btn"
              }
              aria-current={
                localDashboardSection === "reviews"
                  ? "page"
                  : undefined
              }
              onClick={() =>
                openLocalDashboardSection(
                  "reviews"
                )
              }
            >
              Reviews
            </button>
          </div>

          <section className="dashboard-heading">
            <p className="section-label">
              HOSTELCONNECT • LOCAL PROVIDER
            </p>

            <h1>
              {localDashboardSection ===
              "profile"
                ? "Provider Profile"
                : localDashboardSection ===
                  "details"
                ? "Service Details"
                : localDashboardSection ===
                  "requests"
                ? "Traveller Requests"
                : "Chats"}
            </h1>

            <p>
              Manage your HostelConnect local provider
              profile and traveller activity.
            </p>
          </section>

          {localDashboardSection ===
            "profile" && (
            <div className="local-dashboard-grid reveal">
              <div className="dashboard-card">
                <span className="dashboard-card-icon">
                  👤
                </span>

                <p>
                  Provider Name
                </p>

                <input
                  type="text"
                  value={providerName}
                  onChange={(event) =>
                    setProviderName(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="dashboard-card">
                <span className="dashboard-card-icon">
                  📍
                </span>

                <p>
                  Location
                </p>

                <input
                  type="text"
                  value={providerLocation}
                  onChange={(event) =>
                    setProviderLocation(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="dashboard-card">
                <span className="dashboard-card-icon">
                  🏷️
                </span>

                <p>
                  Provider Type
                </p>

                <select
                  value={providerType}
                  onChange={(event) =>
                    setProviderType(
                      event.target.value
                    )
                  }
                >
                  <option>
                    Homestay
                  </option>
                  <option>
                    Guide
                  </option>
                  <option>
                    Arts & Crafts
                  </option>
                </select>
              </div>

              <div className="dashboard-card">
                <span className="dashboard-card-icon">
                  ⭐
                </span>

                <p>
                  Rating
                </p>

                <strong>
                  {providerRating} / 5
                </strong>

                <small>
                  {providerReviewCount > 0
                    ? `Based on ${providerReviewCount} traveller review${
                        providerReviewCount === 1
                          ? ""
                          : "s"
                      }`
                    : "Based on traveller reviews"}
                </small>
              </div>

              <div className="dashboard-card">
                <span className="dashboard-card-icon">
                  🗣️
                </span>

                <p>
                  Languages
                </p>

                <input
                  type="text"
                  value={providerLanguages}
                  onChange={(event) =>
                    setProviderLanguages(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="dashboard-card">
                <span className="dashboard-card-icon">
                  📞
                </span>

                <p>
                  Contact
                </p>

                <strong>
                  {userEmail || "Provider contact"}
                </strong>
              </div>
            </div>
          )}

          {localDashboardSection ===
            "details" && (
            <div className="local-dashboard-grid reveal">
              <div className="dashboard-card">
                <span className="dashboard-card-icon">
                  💰
                </span>

                <p>
                  Service Price
                </p>

                <input
                  type="text"
                  value={servicePrice}
                  onChange={(event) =>
                    setServicePrice(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="dashboard-card">
                <span className="dashboard-card-icon">
                  🟢
                </span>

                <p>
                  Availability
                </p>

                <select
                  value={serviceAvailability}
                  onChange={(event) =>
                    setServiceAvailability(
                      event.target.value
                    )
                  }
                >
                  <option>
                    Available
                  </option>
                  <option>
                    Limited Availability
                  </option>
                  <option>
                    Currently Unavailable
                  </option>
                </select>
              </div>

              <div className="dashboard-card local-service-card">
                <span className="dashboard-card-icon">
                  {providerType ===
                  "Homestay"
                    ? "🏠"
                    : providerType ===
                      "Guide"
                    ? "🧑‍🤝‍🧑"
                    : "🎭"}
                </span>

                <p>
                  {providerType}
                </p>

                <h2>
                  {providerName}
                </h2>

                <p>
                  📍 {providerLocation}
                </p>

                <p>
                  ⭐ {providerRating}
                </p>

                <p>
                  🟢 {serviceAvailability}
                </p>

                <strong>
                  {servicePrice}
                </strong>
              </div>

              <div className="dashboard-card">
                <p>
                  About Your Service
                </p>

                <textarea
                  rows={6}
                  aria-label="About your service"
                  placeholder="Describe your service for travellers…"
                  value={providerAbout}
                  onChange={(event) =>
                    setProviderAbout(event.target.value)
                  }
                />

                <button
                  type="button"
                  className="primary-btn"
                  disabled={isSavingProvider}
                  onClick={() =>
                    void handleSaveProviderProfile()
                  }
                >
                  {isSavingProvider
                    ? "Saving..."
                    : "Save Details"}
                </button>
              </div>
            </div>
          )}

          {localDashboardSection ===
            "requests" && (
            <div className="local-request-list reveal">
              {providerRequests.length === 0 ? (
                <div className="dashboard-card">
                  <p>
                    NEW TRAVELLER REQUEST
                  </p>

                  <h2>
                    No requests yet
                  </h2>

                  <p>
                    {isLoadingRequests
                      ? "Checking for new traveller requests…"
                      : "When a traveller sends a request from Explore, it lands here with their dates, party size, and note."}
                  </p>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() =>
                      void loadProviderWorkspace()
                    }
                  >
                    Refresh Requests
                  </button>
                </div>
              ) : (
                providerRequests.map((request) => (
                  <div
                    className="dashboard-card"
                    key={request.id}
                  >
                    <p>
                      {request.status === "pending"
                        ? "NEW TRAVELLER REQUEST"
                        : "TRAVELLER REQUEST"}
                    </p>

                    <h2>
                      👤 {request.travellerName}
                    </h2>

                    <div className="dashboard-stat-row">
                      <span>
                        📅 Date
                      </span>

                      <strong>
                        {request.date}
                      </strong>
                    </div>

                    <div className="dashboard-stat-row">
                      <span>
                        👥 Guests
                      </span>

                      <strong>
                        {request.guests}
                      </strong>
                    </div>

                    <div className="dashboard-stat-row">
                      <span>
                        ✉️ Traveller
                      </span>

                      <strong>
                        {request.travellerEmail ||
                          "—"}
                      </strong>
                    </div>

                    {request.note && (
                      <div className="dashboard-stat-row">
                        <span>
                          📝 Note
                        </span>

                        <strong>
                          {request.note}
                        </strong>
                      </div>
                    )}

                    <div className="dashboard-stat-row">
                      <span>
                        Status
                      </span>

                      <strong>
                        <span
                          className={`status-chip status-${request.status}`}
                        >
                          {request.status === "pending"
                            ? "⏳ Pending"
                            : request.status ===
                              "accepted"
                            ? "✓ Accepted"
                            : "✕ Declined"}
                        </span>
                      </strong>
                    </div>

                    {request.status ===
                      "pending" && (
                      <div className="local-request-actions">
                        <button
                          type="button"
                          className="primary-btn"
                          disabled={
                            isHandlingRequestId !==
                            null
                          }
                          onClick={() =>
                            void handleRequestDecision(
                              request,
                              "accepted"
                            )
                          }
                        >
                          {isHandlingRequestId ===
                          request.id
                            ? "Updating..."
                            : "Accept"}
                        </button>

                        <button
                          type="button"
                          className="secondary-btn"
                          disabled={
                            isHandlingRequestId !==
                            null
                          }
                          onClick={() =>
                            void handleRequestDecision(
                              request,
                              "declined"
                            )
                          }
                        >
                          Decline
                        </button>

                        {providerType !==
                          "Arts & Crafts" &&
                          request.travellerUid && (
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => {
                              const threadId =
                                store.directThreadId(
                                  currentUser?.uid ??
                                    "",
                                  request.travellerUid
                                );

                              setActiveThreadId(
                                threadId
                              );

                              openLocalDashboardSection(
                                "chats"
                              );

                              void openChatThread(
                                threadId
                              );
                            }}
                          >
                            Chat
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}

              <div className="dashboard-card">
                <p>
                  RECENT ACTIVITY
                </p>

                <h2>
                  📊 Provider Summary
                </h2>

                <div className="dashboard-stat-row">
                  <span>
                    Pending requests
                  </span>

                  <strong>
                    {
                      providerRequests.filter(
                        (request) =>
                          request.status === "pending"
                      ).length
                    }
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    Accepted this month
                  </span>

                  <strong>
                    {
                      providerRequests.filter(
                        (request) =>
                          request.status ===
                            "accepted" &&
                          request.createdAt.startsWith(
                            new Date()
                              .toISOString()
                              .slice(0, 7)
                          )
                      ).length
                    }
                  </strong>
                </div>

                <div className="dashboard-stat-row">
                  <span>
                    Traveller rating
                  </span>

                  <strong>
                    ⭐ {providerRating}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {localDashboardSection ===
            "chats" &&
            providerType !==
              "Arts & Crafts" && (
              <div className="local-request-list reveal">
                <div className="dashboard-card">
                  <p>
                    💬 ACTIVE CHAT
                  </p>

                  <h2>
                    {activeThread
                      ? `Traveller: ${activeThread.travellerName}`
                      : "Traveller Support Chat"}
                  </h2>

                  {providerThreads.length > 0 && (
                    <div className="thread-picker">
                      {providerThreads.map((thread) => (
                        <button
                          key={thread.id}
                          type="button"
                          className={
                            activeThreadId === thread.id
                              ? "dashboard-nav-btn active"
                              : "dashboard-nav-btn"
                          }
                          aria-current={
                            activeThreadId === thread.id
                              ? "true"
                              : undefined
                          }
                          onClick={() =>
                            void openChatThread(
                              thread.id
                            )
                          }
                        >
                          {thread.travellerName}
                        </button>
                      ))}
                    </div>
                  )}

                  {providerThreads.length === 0 ? (
                    <p className="panel-note">
                      No conversations yet. Travellers
                      can message you when they request
                      your service from the Explore
                      pages.
                    </p>
                  ) : !activeThreadId ? (
                    <p className="panel-note">
                      Pick a conversation above to read
                      and reply.
                    </p>
                  ) : (
                    <div className="chat-thread">
                      {threadMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`chat-bubble ${
                            message.from === "provider"
                              ? "chat-out"
                              : "chat-in"
                          }`}
                        >
                          <strong>{message.name}</strong>

                          <p>{message.text}</p>

                          {message.createdAt && (
                            <small>
                              {new Date(
                                message.createdAt
                              ).toLocaleString()}
                            </small>
                          )}
                        </div>
                      ))}

                      {threadMessages.length === 0 && (
                        <p className="panel-note">
                          No messages yet — say
                          hello.
                        </p>
                      )}
                    </div>
                  )}

                  <textarea
                    rows={5}
                    aria-label="Chat message"
                    placeholder="Type a message..."
                    value={chatDraft}
                    onChange={(event) =>
                      setChatDraft(event.target.value)
                    }
                  />

                  <button
                    type="button"
                    className="primary-btn"
                    disabled={
                      isSendingChat || !activeThreadId
                    }
                    onClick={() => void handleSendChat()}
                  >
                    {isSendingChat
                      ? "Sending..."
                      : "Send Message →"}
                  </button>
                </div>
              </div>
            )}
          {localDashboardSection ===
            "reviews" && (
            <div className="local-request-list reveal">
              <div className="dashboard-card">
                <p>
                  ⭐ TRAVELLER REVIEWS
                </p>

                <h2>
                  {providerRating} / 5
                  {providerReviewCount > 0
                    ? ` • ${providerReviewCount} review${
                        providerReviewCount === 1
                          ? ""
                          : "s"
                      }`
                    : " • no reviews yet"}
                </h2>

                {providerReviews.length === 0 ? (
                  <p className="panel-note">
                    Travellers can rate you from the
                    Homestays, Guides, and Crafts pages
                    — reviews appear here
                    automatically.
                  </p>
                ) : (
                  providerReviews.map((review) => (
                    <div
                      className="review-row"
                      key={review.id}
                    >
                      <strong>
                        {"★".repeat(review.rating)}
                        {"☆".repeat(
                          5 - review.rating
                        )}
                      </strong>

                      <p>
                        {review.text || "(no comment)"}
                      </p>

                      <small>
                        {review.travellerEmail ||
                          "Traveller"}
                        {review.createdAt
                          ? ` • ${new Date(
                              review.createdAt
                            ).toLocaleDateString()}`
                          : ""}
                      </small>
                    </div>
                  ))
                )}

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    void loadProviderWorkspace()
                  }
                >
                  Refresh Reviews
                </button>
              </div>
            </div>
          )}
        </main>

        <footer
          className="dashboard-footer"
          aria-label="Provider quick navigation"
        >
          <button
            type="button"
            onClick={() =>
              scrollToSection("home")
            }
          >
            🏠 Home
          </button>

          <button
            type="button"
            onClick={() =>
              openLocalDashboardSection(
                "profile"
              )
            }
          >
            📊 Dashboard
          </button>

          <button
            type="button"
            onClick={() =>
              openLocalDashboardSection(
                "reviews"
              )
            }
          >
            ⭐ Reviews
          </button>

          <button
            type="button"
            onClick={() =>
              openLocalDashboardSection(
                "requests"
              )
            }
          >
            📨 Requests
          </button>

          {providerType !==
            "Arts & Crafts" && (
            <button
              type="button"
              onClick={() =>
                openLocalDashboardSection(
                  "chats"
                )
              }
            >
              💬 Chats
            </button>
          )}
        </footer>

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  /* =========================================================
     AUTHORITY LOGIN PAGE
  ========================================================= */

  if (showAuthorityLogin) {
    return (
      <div className="app login-page user-login-page authority-login-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        <nav className="navbar login-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={closeLogin}
            aria-label="Back to HostelConnect home"
          >
            Hostel<span>Connect</span>
          </button>

          <button
            type="button"
            className="login-back-button"
            onClick={backToAuthorityRoleSelection}
          >
            ← Back
          </button>
        </nav>

        <main className="user-login-content">
          <div className="user-login-heading">
            <div className="user-login-icon">
              🛡️
            </div>

            <p className="tag">
              FOR AUTHORITIES
            </p>

            <h1>
              Authority{" "}
              <span>Login.</span>
            </h1>

            <p>
              Secure access to the HostelConnect
              authority portal.
            </p>
          </div>

          <form
            className="user-login-card"
            onSubmit={handleAuthorityLogin}
          >
            <div className="login-input-group">
              <label htmlFor="authority-email">
                Official Email
              </label>

              <input
                id="authority-email"
                type="email"
                placeholder="official@authority.gov"
                value={authorityEmail}
                onChange={(event) =>
                  setAuthorityEmail(
                    event.target.value
                  )
                }
                autoComplete="email"
              />
            </div>

            <PasswordField
              id="authority-password"
              label="Password"
              placeholder="Enter your password"
              value={authorityPassword}
              onChange={setAuthorityPassword}
            />

            <div className="login-form-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  defaultChecked
                />

                <span>
                  Remember me
                </span>
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() =>
                  void handleForgotPassword(
                    authorityEmail
                  )
                }
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="primary-btn user-login-submit"
            >
              Secure Sign In →
            </button>

            <div className="login-divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="social-login-btn google-login-btn"
              onClick={
                handleAuthorityGoogleLogin
              }
            >
              <span className="social-login-icon">
                  <GoogleIcon />
                </span>

              <span>
                Continue with Google
              </span>
            </button>

            <p className="login-register-text">
              Authority access is restricted to
              verified HostelConnect partners.
            </p>
          </form>
        </main>

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  /* =========================================================
     LOCAL LOGIN PAGE
  ========================================================= */

  if (showLocalLogin) {
    return (
      <div className="app login-page user-login-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        <nav className="navbar login-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={closeLogin}
            aria-label="Back to HostelConnect home"
          >
            Hostel<span>Connect</span>
          </button>

          <button
            type="button"
            className="login-back-button"
            onClick={backToLocalRoleSelection}
          >
            ← Back
          </button>
        </nav>

        <main className="user-login-content">
          <div className="user-login-heading">
            <div className="user-login-icon">
              🏡
            </div>

            <p className="tag">
              FOR LOCAL PROVIDERS
            </p>

            <h1>
              Welcome back to{" "}
              <span>HostelConnect.</span>
            </h1>

            <p>
              Sign in to manage your local
              provider account.
            </p>
          </div>

          <form
            className="user-login-card"
            onSubmit={handleLocalLogin}
          >
            <div className="login-input-group">
              <label htmlFor="local-email">
                Email Address
              </label>

              <input
                id="local-email"
                type="email"
                placeholder="you@example.com"
                value={localEmail}
                onChange={(event) =>
                  setLocalEmail(
                    event.target.value
                  )
                }
                autoComplete="email"
              />
            </div>

            <PasswordField
              id="local-password"
              label="Password"
              placeholder="Enter your password"
              value={localPassword}
              onChange={setLocalPassword}
            />

            <div className="login-form-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  defaultChecked
                />

                <span>
                  Remember me
                </span>
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() =>
                  void handleForgotPassword(
                    localEmail
                  )
                }
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="primary-btn user-login-submit"
            >
              Sign In →
            </button>

            <div className="login-divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="social-login-btn google-login-btn"
              onClick={handleLocalGoogleLogin}
            >
              <span className="social-login-icon">
                  <GoogleIcon />
                </span>

              <span>
                Continue with Google
              </span>
            </button>

            <p className="login-register-text">
              Local provider access is reserved
              for registered HostelConnect partners.
            </p>
          </form>
        </main>

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  /* =========================================================
     USER LOGIN PAGE
  ========================================================= */

  if (showUserLogin) {
    return (
      <div className="app login-page user-login-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        {/* USER LOGIN NAVBAR */}

        <nav className="navbar login-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={closeLogin}
            aria-label="Back to HostelConnect home"
          >
            Hostel<span>Connect</span>
          </button>

          <button
            type="button"
            className="login-back-button"
            onClick={backToRoleSelection}
          >
            ← Back
          </button>
        </nav>

        {/* USER LOGIN CONTENT */}

        <main className="user-login-content">
          <div className="user-login-heading">
            <div className="user-login-icon">
              👤
            </div>

            <p className="tag">
              FOR TRAVELLERS
            </p>

            <h1>
              Welcome back to{" "}
              <span>HostelConnect.</span>
            </h1>

            <p>
              Sign in to continue your journey.
            </p>
          </div>

          <form
            className="user-login-card"
            onSubmit={handleUserLogin}
          >
            <div className="login-input-group">
              <label htmlFor="user-email">
                Email Address
              </label>

              <input
                id="user-email"
                type="email"
                placeholder="you@example.com"
                value={userEmail}
                onChange={(event) =>
                  setUserEmail(
                    event.target.value
                  )
                }
                autoComplete="email"
              />
            </div>

            <PasswordField
              id="user-password"
              label="Password"
              placeholder="Enter your password"
              value={userPassword}
              onChange={setUserPassword}
            />

            <div className="login-form-options">
              <label className="remember-option">
                <input
                  type="checkbox"
                  defaultChecked
                />

                <span>
                  Remember me
                </span>
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() =>
                  void handleForgotPassword(userEmail)
                }
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="primary-btn user-login-submit"
            >
              Sign In →
            </button>

            <div className="login-divider">
              <span>OR</span>
            </div>

            {/* GOOGLE LOGIN */}

            <button
              type="button"
              className="social-login-btn google-login-btn"
              onClick={handleGoogleLogin}
            >
              <span className="social-login-icon">
                  <GoogleIcon />
                </span>

              <span>
                Continue with Google
              </span>
            </button>

            {/* APPLE LOGIN */}

            <button
              type="button"
              className="social-login-btn apple-login-btn"
              onClick={handleAppleLogin}
            >
              <span className="social-login-icon">
                  <AppleIcon />
                </span>

              <span>
                Continue with Apple
              </span>
            </button>

            {/* GUEST LOGIN */}

            <button
              type="button"
              className="secondary-btn guest-login-btn"
              onClick={enterGuestMode}
            >
              Continue as Guest
            </button>

            <p className="login-register-text">
              New to HostelConnect?{" "}
              <button
                type="button"
                onClick={openRegister}
              >
                Create an account
              </button>
            </p>
          </form>
        </main>

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  /* =========================================================
     REGISTER PAGE
     Creates a real Firebase Auth account and stores the
     chosen role in Firestore (users/{uid}).
  ========================================================= */

  if (showRegister) {
    return (
      <div className="app login-page user-login-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        <nav className="navbar login-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={closeLogin}
            aria-label="Back to HostelConnect home"
          >
            Hostel<span>Connect</span>
          </button>

          <button
            type="button"
            className="login-back-button"
            onClick={closeRegister}
          >
            ← Back
          </button>
        </nav>

        <main className="user-login-content">
          <div className="user-login-heading">
            <div className="user-login-icon">
              ✨
            </div>

            <p className="tag">
              JOIN HOSTELCONNECT
            </p>

            <h1>
              Create your{" "}
              <span>account.</span>
            </h1>

            <p>
              One account for trips, local
              partners, and safety features.
            </p>
          </div>

          <form
            className="user-login-card"
            onSubmit={handleRegister}
          >
            <div className="login-input-group">
              <label htmlFor="register-name">
                Full Name
              </label>

              <input
                id="register-name"
                type="text"
                placeholder="Your name"
                value={registerName}
                onChange={(event) =>
                  setRegisterName(
                    event.target.value
                  )
                }
                autoComplete="name"
              />
            </div>

            <div className="login-input-group">
              <label htmlFor="register-email">
                Email Address
              </label>

              <input
                id="register-email"
                type="email"
                placeholder="you@example.com"
                value={registerEmail}
                onChange={(event) =>
                  setRegisterEmail(
                    event.target.value
                  )
                }
                autoComplete="email"
              />
            </div>

            <PasswordField
              id="register-password"
              label="Password"
              placeholder="At least 6 characters"
              value={registerPassword}
              onChange={setRegisterPassword}
            />

            <div className="login-input-group">
              <label htmlFor="register-role">
                I am joining as
              </label>

              <select
                id="register-role"
                className="glass-input"
                value={registerRole}
                onChange={(event) =>
                  setRegisterRole(
                    event.target
                      .value as store.UserRole
                  )
                }
              >
                <option value="traveller">
                  Traveller
                </option>
                <option value="provider">
                  Local Provider
                </option>
                <option value="authority">
                  Authority
                </option>
              </select>
            </div>

            {registerError && (
              <p className="field-error" role="alert">
                {registerError}
              </p>
            )}

            <button
              type="submit"
              className="primary-btn user-login-submit"
              disabled={isRegistering}
            >
              {isRegistering
                ? "Creating account..."
                : "Create Account →"}
            </button>

            <p className="login-register-text">
              Already registered?{" "}
              <button
                type="button"
                onClick={closeRegister}
              >
                Sign in
              </button>
            </p>
          </form>
        </main>

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  /* =========================================================
     LOGIN ROLE SELECTION PAGE
  ========================================================= */

  if (showLogin) {
    return (
      <div className="app login-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        {/* LOGIN NAVBAR */}

        <nav className="navbar login-navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={closeLogin}
            aria-label="Back to HostelConnect home"
          >
            Hostel<span>Connect</span>
          </button>

          <button
            type="button"
            className="login-back-button"
            onClick={closeLogin}
          >
            ← Back
          </button>
        </nav>

        {/* LOGIN CONTENT */}

        <main className="login-content">
          <div className="login-heading">
            <p className="tag">
              TRAVEL • DISCOVER • CONNECT
            </p>

            <h1>
              Welcome to{" "}
              <span>HostelConnect.</span>
            </h1>

            <p>
              Choose how you want to continue.
            </p>
          </div>

          <div className="login-role-grid reveal">

            {/* USER LOGIN */}

            <button
              type="button"
              className="login-role-card"
              onClick={openUserLogin}
            >
              <div className="login-role-icon">
                👤
              </div>

              <div className="login-role-content">
                <span className="login-role-label">
                  FOR TRAVELLERS
                </span>

                <h2>User Login</h2>

                <p>
                  Discover destinations, plan
                  trips, check crowds, and
                  explore local experiences.
                </p>
              </div>

              <span className="login-role-arrow">
                →
              </span>
            </button>

            {/* LOCAL LOGIN */}

            <button
              type="button"
              className="login-role-card"
              onClick={openLocalLogin}
            >
              <div className="login-role-icon">
                🏡
              </div>

              <div className="login-role-content">
                <span className="login-role-label">
                  FOR LOCAL PROVIDERS
                </span>

                <h2>Local Login</h2>

                <p>
                  Manage your homestay, guide
                  profile, local services, and
                  traveller requests.
                </p>
              </div>

              <span className="login-role-arrow">
                →
              </span>
            </button>

            {/* AUTHORITY LOGIN */}

            <button
              type="button"
              className="login-role-card"
              onClick={openAuthorityLogin}
            >
              <div className="login-role-icon">
                🛡️
              </div>

              <div className="login-role-content">
                <span className="login-role-label">
                  FOR AUTHORITIES
                </span>

                <h2>Authority Login</h2>

                <p>
                  Monitor crowds, manage
                  complaints, and oversee
                  tourism and public safety.
                </p>
              </div>

              <span className="login-role-arrow">
                →
              </span>
            </button>

          </div>
        </main>

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  /* =========================================================
     DESTINATION DETAILS PAGE
  ========================================================= */

  if (selectedDestination) {
    return (
      <div className="app destination-page">
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />
        <div className="background-glow glow-three" />

        <nav className="navbar">
          <button
            type="button"
            className="logo logo-button"
            onClick={() =>
              scrollToSection("home")
            }
          >
            Hostel<span>Connect</span>
          </button>

          <div className="nav-links">
            <button
              type="button"
              onClick={closeDestination}
            >
              Explore
            </button>
          </div>

          <button
            type="button"
            className="login-btn"
            onClick={closeDestination}
          >
            ← Back
          </button>
        </nav>

        <main className="destination-details">

          <div
            className="destination-hero-image"
            style={{
              backgroundImage: `linear-gradient(
                rgba(7, 19, 33, 0.35),
                rgba(7, 19, 33, 0.85)
              ), url("${selectedDestination.image}")`,
            }}
          >
            <div className="destination-hero-actions">
            <button
              type="button"
              className="back-btn"
              onClick={closeDestination}
              aria-label="Go back to destinations"
            >
              ← Back to destinations
            </button>

            <button
              type="button"
              className={`back-btn destination-save-btn${
                savedIds.includes(selectedDestination.id)
                  ? " is-saved"
                  : ""
              }`}
              aria-pressed={savedIds.includes(
                selectedDestination.id
              )}
              onClick={() =>
                void handleToggleSave(
                  selectedDestination.id
                )
              }
            >
              {savedIds.includes(selectedDestination.id)
                ? "♥ Saved"
                : "♡ Save"}
            </button>
            </div>

            <div className="destination-hero-content">
              <p className="tag">
                ✈ EXPLORE • DISCOVER • EXPERIENCE
              </p>

              <h1>
                {selectedDestination.name}
              </h1>

              <p className="destination-location">
                📍{" "}
                {
                  selectedDestination.location
                }
              </p>
            </div>
          </div>

          <section className="destination-info">
            <div className="destination-main-info reveal">
              <p className="section-label">
                ABOUT THIS DESTINATION
              </p>

              <h2>
                Discover the beauty of{" "}
                {
                  selectedDestination.name
                }
              </h2>

              <p className="destination-description">
                {
                  selectedDestination.description
                }
              </p>

              <div className="destination-stats reveal">

                <div className="stat-card">
                  <span className="stat-icon">
                    📅
                  </span>

                  <div>
                    <p>Best Time</p>

                    <strong>
                      {
                        selectedDestination.bestTime
                      }
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <span className="stat-icon">
                    🕒
                  </span>

                  <div>
                    <p>
                      Recommended Stay
                    </p>

                    <strong>
                      {
                        selectedDestination.duration
                      }
                    </strong>
                  </div>
                </div>

                <div className="stat-card">
                  <span className="stat-icon">
                    ⭐
                  </span>

                  <div>
                    <p>
                      HostelConnect Pick
                    </p>

                    <strong>
                      Highly Recommended
                    </strong>
                  </div>
                </div>

              </div>
            </div>

            <div className="highlights-section reveal">
              <p className="section-label">
                TOP EXPERIENCES
              </p>

              <h2>
                Things you shouldn't miss
              </h2>

              <div className="highlights-grid reveal">
                {selectedDestination.highlights.map(
                  (highlight, index) => (
                    <div
                      className="highlight-card"
                      key={highlight}
                    >
                      <span>
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </span>

                      <h3>
                        {highlight}
                      </h3>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="plan-trip-box reveal">
              <div>
                <p className="section-label">
                  READY TO EXPLORE?
                </p>

                <h2>
                  Start planning your{" "}
                  {
                    selectedDestination.name
                  } trip
                </h2>

                <p>
                  Discover attractions,
                  create your itinerary,
                  and make your journey
                  unforgettable.
                </p>
              </div>

              <button
                type="button"
                className="primary-btn"
                onClick={() =>
                  openTripPlanner(
                    selectedDestination,
                    "plan"
                  )
                }
              >
                Plan My Trip →
              </button>
            </div>
          </section>
        </main>

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  /* =========================================================
     MAIN WEBSITE
  ========================================================= */

  return (
    <div className="app">
      <a className="skip-link" href="#home">
        Skip to content
      </a>

      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />
      <div className="background-glow glow-three" />

      {/* NAVBAR */}

      <nav className="navbar">
        <button
          type="button"
          className="logo logo-button"
          onClick={() =>
            scrollToSection("home")
          }
          aria-label="Go to home"
        >
          Hostel<span>Connect</span>
        </button>

        <div className="nav-links">
          <button
            type="button"
            onClick={() =>
              scrollToSection("home")
            }
          >
            Home
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection(
                "destinations"
              )
            }
          >
            Explore
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection("about")
            }
          >
            About
          </button>
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className={`nav-menu-toggle${
              mobileMenuOpen ? " is-open" : ""
            }`}
            aria-label={
              mobileMenuOpen ? "Close menu" : "Open menu"
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            onClick={() =>
              setMobileMenuOpen((open) => !open)
            }
          >
            <span className="nav-menu-toggle-bar" />
            <span className="nav-menu-toggle-bar" />
            <span className="nav-menu-toggle-bar" />
          </button>

          <button
            type="button"
            className="login-btn"
            onClick={openLogin}
          >
            Get Started
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-nav-menu" id="mobile-nav">
            <button
              type="button"
              onClick={() =>
                scrollToSection("home")
              }
            >
              <span
                className="menu-icon"
                aria-hidden="true"
              >
                🏠
              </span>

              Home
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "destinations"
                )
              }
            >
              <span
                className="menu-icon"
                aria-hidden="true"
              >
                🧭
              </span>

              Explore
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("about")
              }
            >
              <span
                className="menu-icon"
                aria-hidden="true"
              >
                ✨
              </span>

              About
            </button>

            <button
              type="button"
              className="login-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                openLogin();
              }}
            >
              Get Started
            </button>
          </div>
        )}
      </nav>

      {isGuest && !currentUser && (
        <div className="guest-bar" role="status">
          <span>
            👋 You are exploring as a guest — public
            destinations only.
          </span>

          <div className="guest-bar-actions">
            <button
              type="button"
              className="login-btn"
              onClick={openLogin}
            >
              Sign In
            </button>

            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setIsGuest(false);

                try {
                  window.sessionStorage.removeItem(
                    "hostelconnect.guest"
                  );
                } catch {
                  /* nothing else to clear */
                }
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* HERO SECTION */}

      <main id="home" className="hero" ref={heroRef}>

        <div className="hero-content">
          <p className="tag hero-tag">
            ✈ PLAN • EXPLORE • EXPERIENCE
          </p>

          <h1 className="hero-title">
            Discover the world.
            <br />

            <span>
              One journey at a time.
            </span>
          </h1>

          <p className="description hero-description">
            HostelConnect helps you discover
            amazing destinations, plan
            unforgettable trips, and make
            every journey easier.
          </p>

          <div className="hero-buttons hero-cta">

            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                scrollToSection(
                  "destinations"
                )
              }
            >
              Start Exploring →
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                scrollToSection("about")
              }
            >
              Learn More
            </button>

          </div>
        </div>

        {/* HERO VISUAL */}

        <div className="hero-card">

          <span className="hero-glow" aria-hidden="true" />
          <span className="orbit orbit-a" aria-hidden="true" />
          <span className="orbit orbit-b" aria-hidden="true" />
          <span className="orbit-dot orbit-dot-a" aria-hidden="true" />
          <span className="orbit-dot orbit-dot-b" aria-hidden="true" />
          <span className="orbit-dot orbit-dot-c" aria-hidden="true" />

          <button
            type="button"
            className="floating-card card-one clickable"
            onClick={() =>
              scrollToSection(
                "destinations"
              )
            }
          >
            📍

            <span>
              Explore Places
            </span>
          </button>

          <div className="globe">
            🌍
          </div>

          <button
            type="button"
            className="floating-card card-two clickable"
            onClick={() =>
              scrollToSection("about")
            }
          >
            ✈

            <span>
              Plan Trips
            </span>
          </button>

        </div>
      </main>

      {/* POPULAR DESTINATIONS */}

      <section
        id="destinations"
        className="destinations"
      >
        <div className="section-heading reveal">

          <p>
            EXPLORE INDIA
          </p>

          <h2>
            Popular Destinations
          </h2>

          <span>
            Discover places worth adding
            to your next adventure.
          </span>

        </div>

        <div className="destination-grid reveal">

          {destinations.map(
            (destination) => (
              <button
                type="button"
                key={destination.id}
                className="destination-card"
                onClick={() =>
                  openDestination(
                    destination
                  )
                }
                aria-label={`Explore ${destination.name}`}
              >
                <span
                  className="destination-image"
                  aria-hidden="true"
                  style={{
                    backgroundImage: `linear-gradient(
                      to bottom,
                      rgba(7, 25, 48, 0.04) 24%,
                      rgba(7, 25, 48, 0.92) 100%
                    ), url("${destination.image}")`,
                  }}
                />

                <span className="destination-badge">
                  📍 {destination.location}
                </span>

                <div className="destination-overlay">

                  <div>
                    <h3>
                      {destination.name}
                    </h3>

                    <p>
                      {
                        destination.location
                      }
                    </p>

                    <div className="destination-meta">
                      <span>
                        🗓 {destination.bestTime}
                      </span>

                      <span>
                        ⏱ {destination.duration}
                      </span>
                    </div>
                  </div>

                  <span className="destination-btn">
                    →
                  </span>

                </div>
              </button>
            )
          )}

        </div>
      </section>

      {/* FEATURES SECTION */}

      <section
        id="about"
        className="features reveal"
      >

        <button
          type="button"
          className="feature clickable"
          onClick={() =>
            scrollToSection(
              "destinations"
            )
          }
        >
          <div className="feature-icon">
            🗺️
          </div>

          <h3>
            Discover
          </h3>

          <p>
            Find amazing destinations and
            hidden gems.
          </p>
        </button>

        <button
          type="button"
          className="feature clickable"
          onClick={() =>
            scrollToSection(
              "destinations"
            )
          }
        >
          <div className="feature-icon">
            🚀
          </div>

          <h3>
            Experience
          </h3>

          <p>
            Make unforgettable memories
            wherever you go.
          </p>
        </button>

      </section>

      {/* FOOTER */}

      <footer className="footer">

        <div className="footer-logo">
          Hostel<span>Connect</span>
        </div>

        <p>
          Discover more. Travel better.
          Create unforgettable memories.
        </p>

        <p className="footer-copy">
          © 2026 HostelConnect. Built for
          explorers.
        </p>

      </footer>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;