import CalendarGrid from "@/components/CalendarGrid";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Campus Schedule & Vacancy</h1>
        <p className="text-slate-500 text-sm mt-1">
          Inspect real-time room availability across Strategy First campus and find open slots for your club events.
        </p>
      </div>

      <CalendarGrid />
    </div>
  );
}
