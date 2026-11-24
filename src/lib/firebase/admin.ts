import { cookies, headers } from "next/headers";
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  ServiceAccount,
  App,
} from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { Profile, UserRole } from "@/types/database";
import { COLLECTIONS } from "@/lib/firebase/collections";

function getServiceAccount(): ServiceAccount | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawJson && !rawJson.startsWith("your-")) {
    return JSON.parse(rawJson) as ServiceAccount;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (
    projectId &&
    clientEmail &&
    privateKey &&
    !projectId.startsWith("your-") &&
    !clientEmail.startsWith("your-")
  ) {
    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  return null;
}

export function isFirebaseAdminConfigured(): boolean {
  return getServiceAccount() !== null;
}

function getOrInitAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY (or FIREBASE_SERVICE_ACCOUNT_KEY) in .env.local."
    );
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export function getFirebaseAdmin(): {
  app: App;
  auth: Auth;
  db: Firestore;
} {
  const app = getOrInitAdminApp();
  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
}

export interface AuthenticatedActor {
  uid: string;
  email: string;
  role: UserRole;
  profile: Profile;
}

/**
 * Verify the caller's Firebase ID token (from Authorization header or `cfss_token` cookie)
 * or Firebase session cookie (`cfss_session`), then load their Firestore profile & role.
 */
export async function getAuthenticatedActor(): Promise<AuthenticatedActor | null> {
  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  const { auth, db } = getFirebaseAdmin();
  const headerStore = await headers();
  const cookieStore = await cookies();

  const authHeader = headerStore.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const idTokenCookie = cookieStore.get("cfss_token")?.value || null;
  const sessionCookie = cookieStore.get("cfss_session")?.value || null;

  let uid: string | null = null;
  let email = "";

  try {
    if (bearerToken || idTokenCookie) {
      const decoded = await auth.verifyIdToken((bearerToken || idTokenCookie)!);
      uid = decoded.uid;
      email = decoded.email || "";
    } else if (sessionCookie) {
      const decoded = await auth.verifySessionCookie(sessionCookie, true);
      uid = decoded.uid;
      email = decoded.email || "";
    }
  } catch {
    return null;
  }

  if (!uid) {
    return null;
  }

  const profileSnap = await db.collection(COLLECTIONS.PROFILES).doc(uid).get();
  if (!profileSnap.exists) {
    return null;
  }

  const profile = { id: profileSnap.id, ...profileSnap.data() } as Profile;
  if (profile.is_active === false) {
    return null;
  }

  return {
    uid,
    email: profile.email || email,
    role: profile.role,
    profile,
  };
}
