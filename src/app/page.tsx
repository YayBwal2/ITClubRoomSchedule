import Link from "next/link";
import CalendarGrid from "@/components/CalendarGrid";
import { BookOpen, Calendar, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-red-900 via-[#DE0808] to-red-800 rounded-3xl p-6 sm:p-9 text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative background shapes */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 -bottom-20 w-60 h-60 bg-black/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-black uppercase tracking-wider text-white">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Strategy First International College</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Classroom & Facility Scheduling System
          </h1>

          <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
            Welcome to Strategy First's automated room booking portal. View real-time campus timetables and reserve classrooms for club events.
          </p>

          {/* Quick Action Navigation Buttons for Club Coordinator / Students */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/bookings"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-[#DE0808] text-xs sm:text-sm font-black shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#DE0808]" />
              <span>Book A Room</span>
            </Link>

            <a
              href="#timetable"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-black/20 hover:bg-black/30 border border-white/25 text-white text-xs sm:text-sm font-black transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-white" />
              <span>View Timetable</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Real-time Timetable & Room Availability */}
      <div id="timetable">
        <CalendarGrid />
      </div>
    </div>
  );
}
