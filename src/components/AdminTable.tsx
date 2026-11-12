"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ActivityProposal, ProposalStatus } from "@/types/database";
import {
  Check,
  X,
  Shield,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  MapPin,
  Building2,
  Users,
  Search,
  Lock,
} from "lucide-react";

// Mock proposals for Admin Review
const INITIAL_ADMIN_PROPOSALS: ActivityProposal[] = [
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
    suppliers: [{ name: "City Cafe Snacks", phone: "09 987 654 321" }],
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
    id: "prop-4",
    coordinator_id: "user-coord-2",
    coordinator_name: "Min Thura",
    club_name: "Music & Performing Arts Club",
    title: "Annual Acoustic Night Rehearsal",
    description: "Sound check and rehearsal for upcoming talent show.",
    expected_attendees: 45,
    campus: "Panchan Tower",
    room_id: "pt-activity",
    room_name: "Activity Room",
    activity_date: "2026-11-18",
    start_time: "02:00 PM",
    end_time: "05:00 PM",
    organizer_name: "Min Thura",
    organizer_role: "Vice President",
    organizer_email: "minthura@sfic.edu.mm",
    organizer_phone: "09 555 444 333",
    status: "pending",
    created_at: "2026-10-26T11:00:00Z",
    updated_at: "2026-10-26T11:00:00Z",
  },
  {
    id: "prop-2",
    coordinator_id: "user-coord-3",
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
    coordinator_id: "user-coord-4",
    coordinator_name: "Kyaw Zin",
    club_name: "Gaming & VR Club",
    title: "VR Simulation Showcase",
    description: "Demo of Oculus headsets and interactive simulations.",
    expected_attendees: 20,
    campus: "Panchan Tower",
    room_id: "pt-r7",
    room_name: "Room 7",
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

export default function AdminTable() {
  const router = useRouter();
  const [proposals, setProposals] = useState<ActivityProposal[]>(INITIAL_ADMIN_PROPOSALS);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectItem, setInspectItem] = useState<ActivityProposal | null>(null);
  const [rejectItem, setRejectItem] = useState<ActivityProposal | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentRole, setCurrentRole] = useState<string>("admin");

  useEffect(() => {
    const saved = localStorage.getItem("cfss_current_role");
    if (saved === "sse") {
      router.replace("/schedule");
    } else if (saved) {
      setCurrentRole(saved);
    }
  }, [router]);

  const isAdmin = currentRole === "admin";

  // Counts
  const pendingCount = proposals.filter((p) => p.status === "pending").length;
  const approvedCount = proposals.filter((p) => p.status === "approved").length;
  const rejectedCount = proposals.filter((p) => p.status === "rejected").length;

  const handleApprove = (id: string) => {
    if (!isAdmin) return;
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "approved" as ProposalStatus, rejection_reason: null } : p))
    );
  };

  const handleRejectConfirm = () => {
    if (!isAdmin || !rejectItem) return;
    setProposals((prev) =>
      prev.map((p) =>
        p.id === rejectItem.id
          ? {
              ...p,
              status: "rejected" as ProposalStatus,
              rejection_reason: rejectionReason || "Declined by School Operations Administration.",
            }
          : p
      )
    );
    setRejectItem(null);
    setRejectionReason("");
  };

  const filteredProposals = proposals.filter((p) => {
    const matchesFilter = filter === "all" ? true : p.status === filter;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.club_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.campus.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Coordinator Warning Banner if Coordinator opens Admin URL */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-black text-amber-800">Restricted Admin Portal: </span>
              <span>
                Proposal Approvals and Rejections are strictly restricted to School Administrators. Please log in with an Admin account.
              </span>
            </div>
          </div>
          <a
            href="/login"
            className="px-3.5 py-1.5 rounded-xl bg-[#DE0808] hover:bg-[#C20707] text-white font-black text-xs shrink-0 cursor-pointer transition-colors"
          >
            Login as Admin
          </a>
        </div>
      )}

      {/* Top Banner & Stats */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#DE0808] text-xs font-bold mb-1 border border-red-200">
              <Shield className="w-3.5 h-3.5" /> School Operations Admin Portal
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Proposal Review & Approval Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Review room reservation requests from club coordinators and decide approval or rejection.
            </p>
          </div>
        </div>

        {/* Quick Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Requests</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">{proposals.length}</span>
          </div>
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/60">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Pending Review</span>
            <span className="text-xl font-black text-amber-900 mt-1 block">{pendingCount}</span>
          </div>
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/60">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Approved</span>
            <span className="text-xl font-black text-emerald-900 mt-1 block">{approvedCount}</span>
          </div>
          <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200/60">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Rejected</span>
            <span className="text-xl font-black text-rose-900 mt-1 block">{rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((s) => {
            const count =
              s === "all" ? proposals.length : proposals.filter((p) => p.status === s).length;
            const isActive = filter === s;

            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#DE0808] text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>{s}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search proposals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:border-[#DE0808] outline-none"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Event & Club</th>
                <th className="py-3.5 px-4">Campus & Room</th>
                <th className="py-3.5 px-4">Requested Time Window</th>
                <th className="py-3.5 px-4">Attendees</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold">No proposals found matching this filter.</p>
                  </td>
                </tr>
              ) : (
                filteredProposals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Event & Club */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900 text-sm">{item.title}</div>
                      <div className="text-[11px] font-bold text-[#DE0808] mt-0.5">{item.club_name}</div>
                    </td>

                    {/* Room & Campus */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#DE0808]" />
                        <span>{item.room_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.campus}</div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-bold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.activity_date}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{item.start_time} - {item.end_time}</span>
                      </div>
                    </td>

                    {/* Attendees */}
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.expected_attendees} pax</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {item.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      ) : item.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>

                    {/* Actions: Approve & Reject are ONLY available to Admin, NEVER Coordinator */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectItem(item)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Proposal Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Approve and Reject Buttons: strictly for Admin */}
                        {isAdmin && item.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setRejectItem(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Proposal Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setInspectItem(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-xs font-black text-[#DE0808] uppercase tracking-wider">{inspectItem.club_name}</span>
              <h2 className="text-lg font-black text-slate-900 mt-1">{inspectItem.title}</h2>
              <p className="text-xs text-slate-500 mt-1">{inspectItem.description}</p>
            </div>

            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-500 font-bold">Campus & Room</span>
                <span className="font-black text-slate-900">{inspectItem.campus} • {inspectItem.room_name}</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-500 font-bold">Activity Date & Time</span>
                <span className="font-black text-slate-900">{inspectItem.activity_date} ({inspectItem.start_time} - {inspectItem.end_time})</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-500 font-bold">Expected Attendees</span>
                <span className="font-black text-slate-900">{inspectItem.expected_attendees} attendees</span>
              </div>

              {inspectItem.organizer_name && (
                <div className="pt-2 space-y-1">
                  <span className="text-slate-500 font-bold block">Organizer Information</span>
                  <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                    <div className="font-black text-slate-900">{inspectItem.organizer_name} ({inspectItem.organizer_role})</div>
                    <div className="text-slate-600 flex items-center gap-3">
                      <span>Email: {inspectItem.organizer_email}</span>
                      <span>Phone: {inspectItem.organizer_phone}</span>
                    </div>
                  </div>
                </div>
              )}

              {inspectItem.suppliers && inspectItem.suppliers.length > 0 && (
                <div className="pt-2 space-y-1">
                  <span className="text-slate-500 font-bold block">External Suppliers</span>
                  <div className="space-y-1">
                    {inspectItem.suppliers.map((s, idx) => (
                      <div key={idx} className="bg-slate-50 p-2 rounded-lg flex justify-between">
                        <span className="font-bold text-slate-800">{s.name}</span>
                        <span className="text-slate-600">{s.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {inspectItem.additional_requests && (
                <div className="pt-2 space-y-1">
                  <span className="text-slate-500 font-bold block">Special Requests</span>
                  <p className="bg-slate-50 p-2.5 rounded-xl text-slate-700 italic">
                    "{inspectItem.additional_requests}"
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              {isAdmin && inspectItem.status === "pending" && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(inspectItem.id);
                      setInspectItem(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer"
                  >
                    Approve Request
                  </button>
                  <button
                    onClick={() => {
                      setRejectItem(inspectItem);
                      setInspectItem(null);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer"
                  >
                    Reject...
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal (Admin Only) */}
      {isAdmin && rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-1">Reject Proposal</h3>
            <p className="text-xs text-slate-500 mb-4">
              Please state the reason for rejecting "{rejectItem.title}". The coordinator will see this message.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Facility is already reserved for semester exams."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold focus:border-[#DE0808] outline-none"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectItem(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
