"use client";

import React, { useState } from "react";
import { Booking, BookingStatus } from "@/types/database";
import { Calendar, Clock, MapPin, Plus } from "lucide-react";
import BookingFormModal from "./BookingFormModal";

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
    cancelled: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
        styles[status] || "bg-slate-100 text-slate-800"
      }`}
    >
      {status}
    </span>
  );
}

interface BookingListProps {
  initialBookings?: Booking[];
}

export default function BookingList({ initialBookings = [] }: BookingListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900">Your Booking Requests</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Reservation
        </button>
      </div>

      {initialBookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-medium text-slate-900">No booking requests yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Click "New Reservation" to request classroom or facility allocations for your club activities.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {initialBookings.map((b) => (
            <div key={b.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-slate-900">{b.title}</h4>
                <StatusBadge status={b.status} />
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{b.room?.name || "Room"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {new Date(b.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {new Date(b.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && <BookingFormModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
