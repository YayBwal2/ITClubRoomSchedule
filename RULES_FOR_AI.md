# 🤖 AI Prompting Guidelines & Project Rules (For CFSS Team)

Welcome to the **Classroom & Facility Scheduling System (CFSS)** project!
Since you will be using AI tools (ChatGPT, Claude, Cursor, v0, etc.) to help write your code, **you MUST include these rules in your AI prompts** to ensure everything works smoothly together without breaking the build or server.

---

## 📌 Golden Rule: Copy-Paste this into your AI Prompt
Whenever you ask an AI to write a component or page, start your prompt with:

> *"We are building CFSS with Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide React, and Supabase. Follow these project rules strictly:"*

---

## 1. Component & Client Rules
* **Always add `"use client";`** at the very top of files that have interactive elements (`useState`, `useEffect`, `onClick`, modals, dropdowns).
* **Import types only from `@/types/database`**:
  ```typescript
  import { Room, Booking, Profile, BookingStatus } from "@/types/database";
  ```
* **Do NOT install new npm packages**:
  * We already have `lucide-react`, `tailwind-merge`, and `clsx`.
  * If your AI suggests `npm install fullcalendar` or `npm install moment`, **DO NOT install it**. Tell the AI: *"Do not install extra packages. Build it using native React and Tailwind CSS."*

---

## 2. Styling Rules (Tailwind CSS)
* **Design Aesthetic**: Clean, modern, college/university portal (slate/indigo/sky palette).
* **No Inline Styles**: Never use `style={{ ... }}`. Always use Tailwind utility classes.
* **Icons**: Use `lucide-react`:
  ```tsx
  import { Calendar, Clock, MapPin, CheckCircle, XCircle } from "lucide-react";
  ```

---

## 3. Data & API Rules
* **Double Booking Check**:
  * The database handles double-booking automatically via PostgreSQL constraints.
  * Your UI should cleanly handle any Supabase error and display a user-friendly toast or alert: *"This room is already reserved for this time slot."*
* **Date Formats**:
  * Store all dates in UTC ISO string format (`2026-10-16T14:00:00Z`).
  * Display dates locally using standard JS `toLocaleDateString()` or `toLocaleTimeString()`.

---

## 4. Git Rules for Members
1. **Never push directly to `main`**.
2. Create a branch for your task:
   * Calendar view: `git checkout -b feat/calendar-view`
   * Booking form: `git checkout -b feat/booking-modal`
   * Admin portal: `git checkout -b feat/admin-approvals`
3. Always test your code locally (`npm run dev` and `npm run build`) before opening a Pull Request (PR) for the Lead to review.
