import CalendarGrid from "@/components/CalendarGrid";
import { CalendarDays, Sparkles } from "lucide-react";

export const metadata = {
  title: "Room Schedule - Strategy First College",
  description: "Real-time classroom occupancy and daily campus timetable",
};

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#DE0808] text-xs font-bold mb-1 border border-red-200">
            <CalendarDays className="w-3.5 h-3.5" /> Campus Operations Timetable
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Master Classroom & Facility Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Check real-time classroom occupancy, course lectures, and scheduled club activities across all campuses.
          </p>
        </div>
      </div>

      {/* Real-time Schedule Calendar Grid */}
      <CalendarGrid />
    </div>
  );
}

