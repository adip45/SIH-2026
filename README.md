# SIH-2026
This is a repository for SIH 2026 in which all the files for frontend, backend and integration will be added for the project.

## Backend configuration (Firebase)

Authentication uses Firebase Auth (`client/src/firebase.ts`). All dashboard data
(trips, saved places, provider listings, requests, chats, reviews, reports,
authority settings) is written to **Firestore** through `client/src/store.ts`,
which falls back to per-device storage whenever Firestore is unreachable or
locked — the UI labels which mode is active, so nothing is silently faked.

To enable cloud sync for the whole team:

1. Firebase Console → this project (`travelboost-19a1f`) →
   **Authentication → Sign-in method**: enable *Email/Password*, *Google*, and
   *(optional)* *Apple* (Apple needs a Services ID + key; the app degrades
   gracefully with a clear toast when it is not configured).
2. **Firestore Database → Create database** (production mode).
3. Deploy the role-aware security rules in [`firestore.rules`](./firestore.rules):
   `firebase deploy --only firestore:rules`.

Roles are stored per account in `users/{uid}.role` and set at registration
(traveller / local provider / authority). Every privileged Firestore write is
verified against the authenticated `uid` (and role) by the security rules —
client-side role checks are UX only.
