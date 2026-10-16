"use client";

import React, { useState } from "react";
import { Booking } from "@/types/database";
import { Check, X, ShieldAlert } from "lucide-react";

interface PendingApprovalsTableProps {
  initialBookings?: Booking[];
}

export function PendingApprovalsTable({ initialBookings = [] }: PendingApprovalsTableProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    // Person 7: Hook up approve / reject actions here
    console.log(`Action: ${action} for booking ${id}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Pending Booking Approvals</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and approve club room allocation requests with one-click conflict checks.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <tr>
              <th className="py-3 px-4">Event Title</th>
              <th className="py-3 px-4">Coordinator / Club</th>
              <th className="py-3 px-4">Room</th>
              <th className="py-3 px-4">Requested Time</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>No pending booking requests right now.</p>
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-medium text-slate-900">{b.title}</td>
                  <td className="py-3 px-4 text-slate-600">{b.profile?.full_name || "Coordinator"}</td>
                  <td className="py-3 px-4 text-slate-600">{b.room?.name || "Room"}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    {new Date(b.start_time).toLocaleString()} - {new Date(b.end_time).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleAction(b.id, "approve")}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(b.id, "reject")}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
