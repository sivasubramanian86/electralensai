/**
 * ElectraLensAI — Firebase / GCP Storage service.
 *
 * Provides:
 *  - Firebase App initialization (singleton)
 *  - Firestore for gamification persistence (cloud sync fallback)
 *  - Firebase Storage for Nano Banana Imagen image retrieval
 *
 * GCS bucket: electralensai.firebasestorage.app
 * Images are stored under: /images/<concept-slug>/<filename>.png
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// ─── Config (injected via Vite env) ──────────────────────────────────────────

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             as string,
};

// ─── Singleton initialisation ─────────────────────────────────────────────────
// Guards against double-init in Vite HMR cycles

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ─── Service exports ──────────────────────────────────────────────────────────

/** Firestore — used for cloud-synced gamification state (optional, falls back to localStorage). */
export const db = getFirestore(app);

/** Firebase Auth — used for session management. */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Firebase Storage — GCS bucket for Nano Banana Imagen-generated infographics.
 * Bucket: electralensai.firebasestorage.app
 */
export const storage = getStorage(app);

export default app;
