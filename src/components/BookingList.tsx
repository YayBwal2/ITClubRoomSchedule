"use client";

import React, { useState } from "react";
import { ActivityProposal, ProposalStatus } from "@/types/database";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  User,
  Phone,
  Mail,
  Building2,
  DollarSign,
  Package,
} from "lucide-react";
import BookingFormModal from "./BookingFormModal";

// Initial mock proposals for demonstration
const INITIAL_PROPOSALS: ActivityProposal[] = [
  {
    id: "prop-1",
    coordinator_id: "user-coord-1",
    coordinator_name: "Aung Kaung Myat",
    club_name: "IT Club",
    title: "Web Development Bootcamp & Hands-on Lab",
    description: "Hands-on Next.js and Tailwind CSS introductory workshop for freshmen.",
    expected_attendees: 35,
    campus: "U Wisara",
    room_id: "uw-r1",
    room_name: "Room 1",
    activity_date: "2026-11-15",
    start_time: "09:00 AM",
    end_time: "12:00 PM",
    expected_budget: "100,000 MMK",
    budget_details: "Refreshments & certificates for attendees",
    suppliers: [
      { name: "City Cafe Snacks", phone: "09 987 654 321" },
    ],
    organizer_name: "Aung Kaung Myat",
    organizer_role: "Lead Club Coordinator",
    organizer_email: "aungkaung@sfic.edu.mm",
    organizer_phone: "09 450 112 233",
    additional_requests: "Need 2 wireless microphones and extra power sockets.",
    status: "pending",
    created_at: "2026-10-25T10:00:00Z",
    updated_at: "2026-10-25T10:00:00Z",
  },
  {
    id: "prop-2",
    coordinator_id: "user-coord-1",
    coordinator_name: "Htet Htet",
    club_name: "English Literature & Debate Club",
    title: "Inter-College Debate Championship 2026",
    description: "Annual debate competition between faculties.",
    expected_attendees: 80,
    campus: "Panchan Tower",
    room_id: "pt-theater",
    room_name: "Theater Room",
    activity_date: "2026-11-20",
    start_time: "01:00 PM",
    end_time: "04:30 PM",
    organizer_name: "Htet Htet",
    organizer_role: "Debate Society President",
    organizer_email: "htethtet@sfic.edu.mm",
    organizer_phone: "09 778 899 001",
    status: "approved",
    created_at: "2026-10-22T08:30:00Z",
    updated_at: "2026-10-23T14:15:00Z",
  },
  {
    id: "prop-3",
    coordinator_id: "user-coord-1",
    coordinator_name: "Kyaw Zin",
    club_name: "Gaming & VR Club",
    title: "VR Simulation Showcase",
    description: "Demo of Oculus headsets and interactive simulations.",
    expected_attendees: 20,
    campus: "Panchan Tower",
    room_id: "pt-vr",
    room_name: "VR Room",
    activity_date: "2026-10-24",
    start_time: "10:00 AM",
    end_time: "01:00 PM",
    organizer_name: "Kyaw Zin",
    organizer_role: "Tech Lead",
    organizer_email: "kyawzin@sfic.edu.mm",
    organizer_phone: "09 234 567 890",
    status: "rejected",
    rejection_reason: "Room undergoing hardware scheduled maintenance on requested date.",
    created_at: "2026-10-20T09:00:00Z",
    updated_at: "2026-10-21T11:00:00Z",
  },
];

export default function BookingList() {
  const [proposals, setProposals] = useState<ActivityProposal[]>(INITIAL_PROPOSALS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | ProposalStatus>("all");
  const [inspectProposal, setInspectProposal] = useState<ActivityProposal | null>(null);

  const filteredProposals = proposals.filter((p) => {
    if (activeFilter === "all") return true;
    return p.status === activeFilter;
  });

  const handleNewProposal = (newP: ActivityProposal) => {
    setProposals([newP, ...proposals]);
  };

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#DE0808] text-xs font-bold mb-1 border border-red-200">
            <Building2 className="w-3.5 h-3.5" /> Coordinator Booking Portal
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Club Room Reservations & Proposals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your submitted activity proposals, review approval statuses, and request new campus facilities.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#DE0808] hover:bg-[#C20707] text-white font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Reservation</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {(["all", "pending", "approved", "rejected"] as const).map((filter) => {
          const count = filter === "all" ? proposals.length : proposals.filter((p) => p.status === filter).length;
          const isActive = activeFilter === filter;

          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#DE0808] text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{filter}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bookings Grid */}
      {filteredProposals.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 text-base">No booking requests found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            You don't have any {activeFilter !== "all" ? activeFilter : ""} proposals yet. Click below to submit a new request.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#DE0808] text-white rounded-xl text-xs font-black cursor-pointer"
          >
            + Create Reservation
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProposals.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-black text-[#DE0808] uppercase tracking-wider">
                    {item.club_name}
                  </span>
                  {getStatusBadge(item.status)}
                </div>

                <h3 className="font-black text-slate-900 text-base line-clamp-1 mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                  {item.description}
                </p>

                <div className="space-y-2 bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#DE0808] shrink-0" />
                    <span className="font-bold">{item.campus}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-900">{item.room_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#DE0808] shrink-0" />
                    <span>{item.activity_date}</span>
                    <span className="text-slate-400">•</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{item.start_time} - {item.end_time}</span>
                  </div>
                </div>

                {item.status === "rejected" && item.rejection_reason && (
                  <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                    <span className="font-black">Reason: </span>
                    <span>{item.rejection_reason}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">
                  Attendees: {item.expected_attendees}
                </span>
                <button
                  onClick={() => setInspectProposal(item)}
                  className="inline-flex items-center gap-1 text-xs font-black text-[#DE0808] hover:text-[#C20707] cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Form Modal */}
      <BookingFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleNewProposal}
      />

      {/* Inspect Modal */}
      {inspectProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setInspectProposal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black text-[#DE0808] uppercase tracking-wider">{inspectProposal.club_name}</span>
                {getStatusBadge(inspectProposal.status)}
              </div>
              <h2 className="text-lg font-black text-slate-900">{inspectProposal.title}</h2>
              <p className="text-xs text-slate-500 mt-1">{inspectProposal.description}</p>
            </div>

            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-500 font-bold">Campus & Room</span>
                <span className="font-black text-slate-900">{inspectProposal.campus} • {inspectProposal.room_name}</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-500 font-bold">Date & Time</span>
                <span className="font-black text-slate-900">{inspectProposal.activity_date} ({inspectProposal.start_time} - {inspectProposal.end_time})</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-500 font-bold">Attendees</span>
                <span className="font-black text-slate-900">{inspectProposal.expected_attendees} pax</span>
              </div>

              {inspectProposal.organizer_name && (
                <div className="pt-2 space-y-1">
                  <span className="text-slate-500 font-bold block">Organizer Contact</span>
                  <div className="bg-slate-50 p-2.5 rounded-xl space-y-1">
                    <div className="font-black text-slate-900">{inspectProposal.organizer_name} ({inspectProposal.organizer_role})</div>
                    <div className="text-slate-600 flex items-center gap-3">
                      <span>Email: {inspectProposal.organizer_email}</span>
                      <span>Phone: {inspectProposal.organizer_phone}</span>
                    </div>
                  </div>
                </div>
              )}

              {inspectProposal.suppliers && inspectProposal.suppliers.length > 0 && (
                <div className="pt-2 space-y-1">
                  <span className="text-slate-500 font-bold block">Suppliers</span>
                  <div className="space-y-1">
                    {inspectProposal.suppliers.map((s, idx) => (
                      <div key={idx} className="bg-slate-50 p-2 rounded-lg flex justify-between">
                        <span className="font-bold text-slate-800">{s.name}</span>
                        <span className="text-slate-600">{s.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {inspectProposal.additional_requests && (
                <div className="pt-2 space-y-1">
                  <span className="text-slate-500 font-bold block">Comments & Requests</span>
                  <p className="bg-slate-50 p-2.5 rounded-xl text-slate-700 italic">
                    "{inspectProposal.additional_requests}"
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInspectProposal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
