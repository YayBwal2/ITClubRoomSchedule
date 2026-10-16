import { BookingList } from "@/components/bookings/booking-list";

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Coordinator Booking Portal</h1>
        <p className="text-slate-500 text-sm mt-1">
          Track the lifecycle of your room reservations and submit new allocations.
        </p>
      </div>

      <BookingList />
    </div>
  );
}
