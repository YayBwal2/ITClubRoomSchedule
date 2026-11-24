/**
 * Idempotent Firestore & Firebase Auth Seed Script for CFSS
 *
 * Usage:
 *   1. Fill in FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *      (or FIREBASE_SERVICE_ACCOUNT_KEY) in `.env.local`
 *   2. Run: `npm run seed`
 */

import fs from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function initAdminServices() {
  loadEnvLocal();

  if (getApps().length === 0) {
    const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (rawJson && !rawJson.startsWith("your-")) {
      initializeApp({ credential: cert(JSON.parse(rawJson)) });
    } else {
      const projectId =
        process.env.FIREBASE_PROJECT_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

      if (
        !projectId ||
        !clientEmail ||
        !privateKey ||
        projectId.startsWith("your-") ||
        clientEmail.startsWith("your-")
      ) {
        throw new Error(
          "Missing Firebase Admin credentials. Fill in .env.local before running `npm run seed`."
        );
      }

      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    }
  }

  return {
    auth: getAuth(),
    db: getFirestore(),
  };
}

const now = new Date().toISOString();
const SEED_ACTOR = "seed-script";
const audit = {
  created_at: now,
  updated_at: now,
  created_by: SEED_ACTOR,
  updated_by: SEED_ACTOR,
};

const DEFAULT_TEST_PASSWORD = "Password123!";

const SEED_USERS = [
  {
    email: "admin@sfic.edu.mm",
    password: DEFAULT_TEST_PASSWORD,
    full_name: "School Operations Admin",
    role: "admin",
    club_name: null,
    phone_number: "09 111 222 333",
  },
  {
    email: "sse@sfic.edu.mm",
    password: DEFAULT_TEST_PASSWORD,
    full_name: "Student Services Executive",
    role: "sse",
    club_name: null,
    phone_number: "09 222 333 444",
  },
  {
    email: "coordinator@sfic.edu.mm",
    password: DEFAULT_TEST_PASSWORD,
    full_name: "Aung Kaung Myat",
    role: "coordinator",
    club_name: "IT Club",
    phone_number: "09 450 112 233",
  },
];

const makeRoom = (id, name, campus, building, floor, capacity) => ({
  id,
  name,
  campus,
  building,
  floor,
  capacity,
  has_ac: true,
  has_projector: true,
  has_whiteboard: true,
  status: "active",
  ...audit,
});

const SEED_ROOMS = [
  makeRoom("uw-r1", "Room 1", "U Wisara", "Main Wing", 1, 40),
  makeRoom("uw-r2", "Room 2", "U Wisara", "Main Wing", 1, 45),
  makeRoom("uw-r3", "Room 3", "U Wisara", "Main Wing", 2, 35),
  makeRoom("uw-r4", "Room 4", "U Wisara", "Main Wing", 2, 50),
  makeRoom("uw-r5", "Room 5", "U Wisara", "East Wing", 3, 30),
  makeRoom("uw-r6", "Room 6", "U Wisara", "East Wing", 3, 40),
  makeRoom("pt-theater", "Theater Room", "Panchan Tower", "Tower A", 5, 120),
  makeRoom("pt-activity", "Activity Room", "Panchan Tower", "Tower A", 4, 60),
  makeRoom("pt-r3", "Room 3", "Panchan Tower", "Tower A", 3, 35),
  makeRoom("pt-r4", "Room 4", "Panchan Tower", "Tower A", 3, 40),
  makeRoom("pt-r5", "Room 5", "Panchan Tower", "Tower B", 4, 40),
  makeRoom("pt-r6", "Room 6", "Panchan Tower", "Tower B", 4, 45),
  makeRoom("pt-r7", "Room 7", "Panchan Tower", "Tower B", 5, 50),
  makeRoom("py-theater", "Pyay Theater Room", "Pyay Campus", "Auditorium", 3, 100),
  makeRoom("py-r1", "Room 1", "Pyay Campus", "Main Hall", 1, 35),
  makeRoom("py-r2", "Room 2", "Pyay Campus", "Main Hall", 2, 40),
  makeRoom("py-r3", "Room 3", "Pyay Campus", "Main Hall", 2, 45),
];

const SEED_CLASS_SCHEDULES = [
  {
    id: "cls-uw-ddoocp",
    campus: "U Wisara",
    room_id: "uw-r4",
    room_name: "Room 4",
    course_code: "DC-201",
    course_title: "DDOOCP",
    lecturer_name: "Daw Aye Aye",
    day_of_week: "Monday",
    start_time: "11:30",
    end_time: "13:30",
    start_minutes: 690,
    end_minutes: 810,
    batch: "Batch 24",
    status: "active",
    ...audit,
  },
  {
    id: "cls-uw-se",
    campus: "U Wisara",
    room_id: "uw-r3",
    room_name: "Room 3",
    course_code: "DC-305",
    course_title: "Software Engineering",
    lecturer_name: "U Kyaw Zin",
    day_of_week: "Tuesday",
    start_time: "11:30",
    end_time: "16:00",
    start_minutes: 690,
    end_minutes: 960,
    batch: "Batch 23",
    status: "active",
    ...audit,
  },
  {
    id: "cls-py-ebiz",
    campus: "Pyay Campus",
    room_id: "py-r1",
    room_name: "Room 1",
    course_code: "DCBM-102",
    course_title: "E-Business",
    lecturer_name: "U Min Htet",
    day_of_week: "Wednesday",
    start_time: "14:00",
    end_time: "16:00",
    start_minutes: 840,
    end_minutes: 960,
    batch: "Batch 25",
    status: "active",
    ...audit,
  },
  {
    id: "cls-py-oosad",
    campus: "Pyay Campus",
    room_id: "py-r2",
    room_name: "Room 2",
    course_code: "DC-204",
    course_title: "OOSAD",
    lecturer_name: "Daw Su Su",
    day_of_week: "Thursday",
    start_time: "09:00",
    end_time: "11:00",
    start_minutes: 540,
    end_minutes: 660,
    batch: "Batch 24",
    status: "active",
    ...audit,
  },
];

async function ensureAuthUsersAndProfiles(auth, db) {
  const uidByRole = {};
  const profiles = [];

  for (const user of SEED_USERS) {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(user.email);
    } catch {
      userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.full_name,
      });
    }

    uidByRole[user.role] = userRecord.uid;
    profiles.push({
      id: userRecord.uid,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      club_name: user.club_name,
      phone_number: user.phone_number,
      is_active: true,
      ...audit,
    });
  }

  // Remove legacy placeholder seed profile IDs if present
  const batch = db.batch();
  for (const legacyId of ["seed-admin-1", "seed-sse-1", "seed-coord-1"]) {
    batch.delete(db.collection("profiles").doc(legacyId));
  }
  for (const profile of profiles) {
    batch.set(db.collection("profiles").doc(profile.id), profile, { merge: true });
  }
  await batch.commit();
  console.log(`Synced ${profiles.length} Firebase Auth users & Firestore profiles.`);

  return uidByRole;
}

async function seedCollection(db, collectionName, items) {
  const batch = db.batch();
  for (const item of items) {
    const ref = db.collection(collectionName).doc(item.id);
    batch.set(ref, item, { merge: true });
  }
  await batch.commit();
  console.log(`Seeded ${items.length} documents into "${collectionName}".`);
}

async function main() {
  const { auth, db } = initAdminServices();
  const uidByRole = await ensureAuthUsersAndProfiles(auth, db);

  const seedProposals = [
    {
      id: "prop-seed-1",
      coordinator_id: uidByRole.coordinator,
      coordinator_name: "Aung Kaung Myat",
      club_name: "IT Club",
      title: "Web Development Bootcamp & Hands-on Lab",
      description: "Hands-on Next.js and Tailwind CSS introductory workshop for freshmen.",
      expected_attendees: 35,
      campus: "U Wisara",
      room_id: "uw-r1",
      room_name: "Room 1",
      activity_date: "2026-12-05",
      start_time: "09:00 AM",
      end_time: "12:00 PM",
      start_minutes: 540,
      end_minutes: 720,
      expected_budget: "100,000 MMK",
      budget_details: "Refreshments & certificates for attendees",
      suppliers: [{ name: "City Cafe Snacks", phone: "09 987 654 321" }],
      organizer_name: "Aung Kaung Myat",
      organizer_role: "Lead Club Coordinator",
      organizer_email: "coordinator@sfic.edu.mm",
      organizer_phone: "09 450 112 233",
      additional_requests: "Need 2 wireless microphones and extra power sockets.",
      status: "pending",
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: null,
      ...audit,
    },
    {
      id: "prop-seed-2",
      coordinator_id: uidByRole.coordinator,
      coordinator_name: "Aung Kaung Myat",
      club_name: "IT Club",
      title: "IT Project Meeting",
      description: "Weekly sprint sync for the CFSS student engineering team.",
      expected_attendees: 18,
      campus: "Panchan Tower",
      room_id: "pt-r6",
      room_name: "Room 6",
      activity_date: "2026-12-06",
      start_time: "11:00 AM",
      end_time: "04:00 PM",
      start_minutes: 660,
      end_minutes: 960,
      organizer_name: "Aung Kaung Myat",
      organizer_role: "Lead Club Coordinator",
      organizer_email: "coordinator@sfic.edu.mm",
      organizer_phone: "09 450 112 233",
      status: "approved",
      reviewed_by: uidByRole.admin,
      reviewed_at: now,
      rejection_reason: null,
      ...audit,
    },
  ];

  await seedCollection(db, "rooms", SEED_ROOMS);
  await seedCollection(db, "class_schedules", SEED_CLASS_SCHEDULES);
  await seedCollection(db, "activity_proposals", seedProposals);
  console.log("Firestore & Auth seeding completed successfully.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
