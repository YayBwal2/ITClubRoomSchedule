import BookingList from "@/components/BookingList";

export const metadata = {
  title: "Bookings - Strategy First Room Scheduling",
  description: "Club Coordinator Booking Portal & Event Request Form",
};

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <BookingList />
    </div>
  );
}
