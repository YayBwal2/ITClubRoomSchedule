import { NextResponse } from "next/server";
import { getFirebaseAdmin, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { COLLECTIONS, buildAuditCreateFields } from "@/lib/firebase/collections";
import { Profile } from "@/types/database";

const SESSION_COOKIE_NAME = "cfss_session";
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured on the server." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as { idToken?: string };
    if (!body?.idToken) {
      return NextResponse.json({ error: "Missing idToken." }, { status: 400 });
    }

    const { auth, db } = getFirebaseAdmin();
    const decoded = await auth.verifyIdToken(body.idToken);
    const sessionCookie = await auth.createSessionCookie(body.idToken, {
      expiresIn: FIVE_DAYS_MS,
    });

    const profileRef = db.collection(COLLECTIONS.PROFILES).doc(decoded.uid);
    const profileSnap = await profileRef.get();

    let profile: Profile;
    if (!profileSnap.exists) {
      profile = {
        id: decoded.uid,
        email: decoded.email || "",
        full_name:
          decoded.name ||
          (decoded.email ? decoded.email.split("@")[0] : "Club Coordinator"),
        role: "coordinator",
        club_name: null,
        phone_number: null,
        is_active: true,
        ...buildAuditCreateFields(decoded.uid),
      };
      await profileRef.set(profile);
    } else {
      profile = { id: profileSnap.id, ...profileSnap.data() } as Profile;
    }

    if (profile.is_active === false) {
      return NextResponse.json(
        { error: "This account has been deactivated. Please contact Admin." },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ profile });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(FIVE_DAYS_MS / 1000),
    });

    return response;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create session";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
