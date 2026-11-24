import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { getFirebaseClient, isFirebaseClientConfigured } from "@/lib/firebase/client";
import { Profile } from "@/types/database";

const ROLE_EMAIL_ALIASES: Record<string, string> = {
  admin: "admin@sfic.edu.mm",
  sse: "sse@sfic.edu.mm",
  coordinator: "coordinator@sfic.edu.mm",
};

export function resolveLoginEmail(usernameOrEmail: string): string {
  const cleaned = usernameOrEmail.trim().toLowerCase();
  if (cleaned.includes("@")) {
    return cleaned;
  }
  return ROLE_EMAIL_ALIASES[cleaned] || `${cleaned}@sfic.edu.mm`;
}

export async function signInAndCreateSession(
  usernameOrEmail: string,
  password: string
): Promise<Profile> {
  const { auth } = getFirebaseClient();
  const email = resolveLoginEmail(usernameOrEmail);

  const credential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken();

  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  const payload = (await res.json()) as { profile?: Profile; error?: string };
  if (!res.ok || !payload.profile) {
    throw new Error(payload.error || "Failed to initialize server session.");
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("cfss_current_role", payload.profile.role);
    localStorage.setItem("cfss_user_name", payload.profile.full_name);
    localStorage.setItem("cfss_user_email", payload.profile.email);
  }

  return payload.profile;
}

export async function signOutAndClearSession(): Promise<void> {
  if (isFirebaseClientConfigured()) {
    const { auth } = getFirebaseClient();
    await signOut(auth).catch(() => undefined);
  }

  await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);

  if (typeof window !== "undefined") {
    localStorage.removeItem("cfss_current_role");
    localStorage.removeItem("cfss_user_avatar");
    localStorage.removeItem("cfss_user_name");
    localStorage.removeItem("cfss_user_email");
  }
}

export async function changeFirebasePassword(
  oldPassword: string,
  newPassword: string
): Promise<void> {
  const { auth } = getFirebaseClient();
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("Please log in again before changing your password.");
  }

  const cred = EmailAuthProvider.credential(user.email, oldPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
}
