"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  cancelActivityProposal,
  getMyActivityProposals,
} from "@/actions/bookings";
import { getCurrentProfile } from "@/actions/profiles";
import { notifyScheduleUpdated } from "@/lib/schedule-sync";
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
  Building2,
  Pencil,
  Ban,
  Package,
  DollarSign,
} from "lucide-react";
import BookingFormModal, { BookingPrefillData } from "./BookingFormModal";

export default function BookingList() {
  const router = useRouter();
  const [proposals, setProposals] = useState<ActivityProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [todayDate, setTodayDate] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<ActivityProposal | null>(null);
  const [prefillData, setPrefillData] = useState<BookingPrefillData | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | ProposalStatus>("all");
  const [inspectProposal, setInspectProposal] = useState<ActivityProposal | null>(null);

  const [cancellingTarget, setCancellingTarget] = useState<ActivityProposal | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Restrict SSE from accessing bookings and load coordinator's own proposals
  useEffect(() => {
    let cancelled = false;
    const role = localStorage.getItem("cfss_current_role");
    if (role === "sse") {
      router.replace("/schedule");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const shouldOpenModal =
      params.get("openModal") === "true" || params.get("new") === "true";

    const parsedPrefill: BookingPrefillData | null = shouldOpenModal
      ? (() => {
          const campus = params.get("campus") || undefined;
          const room_name = params.get("room") || undefined;
          const activity_date = params.get("date") || undefined;
          const rawStart = params.get("start");
          const rawEnd = params.get("end");
          const startNum = rawStart !== null ? Number(rawStart) : NaN;
          const endNum = rawEnd !== null ? Number(rawEnd) : NaN;

          const start_minutes =
            Number.isFinite(startNum) && startNum >= 0 && startNum < 1440
              ? startNum
              : undefined;
          const end_minutes =
            Number.isFinite(endNum) &&
            start_minutes !== undefined &&
            endNum > start_minutes &&
            endNum <= 1440
              ? endNum
              : undefined;

          if (
            !campus &&
            !room_name &&
            !activity_date &&
            start_minutes === undefined
          ) {
            return null;
          }

          return {
            campus,
            room_name,
            activity_date,
            start_minutes,
            end_minutes,
          };
        })()
      : null;

    if (shouldOpenModal) {
      window.history.replaceState({}, "", "/bookings");
    }

    Promise.all([getCurrentProfile(), getMyActivityProposals()]).then(
      ([profileRes, proposalsRes]) => {
        if (cancelled) return;

        setTodayDate(
          new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(
            new Date()
          )
        );
        if (shouldOpenModal) {
          setEditingProposal(null);
          setPrefillData(parsedPrefill);
          setIsModalOpen(true);
        }

        if (profileRes.data?.role === "sse") {
          router.replace("/schedule");
          return;
        }

        if (proposalsRes.data) {
          setProposals(proposalsRes.data);
          setLoadError(null);
        } else {
          setProposals([]);
          if (proposalsRes.error) {
            setLoadError(proposalsRes.error);
          }
        }
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Listen for openBookingModal custom event (e.g. from Navbar + New Booking button)
  useEffect(() => {
    const handleOpen = () => {
      setEditingProposal(null);
      setPrefillData(null);
      setIsModalOpen(true);
    };
    window.addEventListener("openBookingModal", handleOpen);
    return () => window.removeEventListener("openBookingModal", handleOpen);
  }, []);

  const filteredProposals = proposals.filter((p) => {
    if (activeFilter === "all") return true;
    return p.status === activeFilter;
  });

  const handleProposalSaved = (saved: ActivityProposal) => {
    setProposals((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [saved, ...prev];
    });
    setActionMessage({
      type: "success",
      text: editingProposal
        ? `Updated "${saved.title}" successfully.`
        : `Submitted "${saved.title}" for approval.`,
    });
    setEditingProposal(null);
  };

  const canEditProposal = (item: ActivityProposal) => item.status === "pending";

  const canCancelProposal = (item: ActivityProposal) => {
    if (item.status === "pending") return true;
    if (item.status === "approved") {
      return !todayDate || item.activity_date >= todayDate;
    }
    return false;
  };

  const handleConfirmCancel = async () => {
    if (!cancellingTarget) return;
    setCancellingId(cancellingTarget.id);
    setActionMessage(null);

    const res = await cancelActivityProposal(cancellingTarget.id, cancelReason);
    setCancellingId(null);

    if (!res.success || !res.data) {
      setActionMessage({
        type: "error",
        text: res.error || "Failed to cancel proposal.",
      });
      return;
    }

    const updated = res.data;
    notifyScheduleUpdated();
    setProposals((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    if (inspectProposal?.id === updated.id) {
      setInspectProposal(updated);
    }
    setActionMessage({
      type: "success",
      text: `Cancelled "${updated.title}". The room time slot is now released.`,
    });
    setCancellingTarget(null);
    setCancelReason("");
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
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-600 border border-slate-200">
            <Ban className="w-3 h-3" /> Cancelled
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
            Track your submitted activity proposals, edit pending requests, and manage room allocations.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProposal(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#DE0808] hover:bg-[#C20707] text-white font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Reservation</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {(["all", "pending", "approved", "rejected", "cancelled"] as const).map(
          (filter) => {
            const count =
              filter === "all"
                ? proposals.length
                : proposals.filter((p) => p.status === filter).length;
            const isActive = activeFilter === filter;

            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${isActive
                    ? "bg-[#DE0808] text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
              >
                <span>{filter}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] ${isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-700"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          }
        )}
      </div>

      {/* Action Feedback Banner */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${actionMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-current opacity-60 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Load Error Alert */}
      {loadError && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
          {loadError}
        </div>
      )}

      {/* Bookings Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs text-xs font-bold text-slate-400">
          Loading your reservations from Firestore...
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 text-base">
            No booking requests found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            You don&apos;t have any{" "}
            {activeFilter !== "all" ? activeFilter : ""} proposals yet. Click
            below to submit a new request.
          </p>
          <button
            onClick={() => {
              setEditingProposal(null);
              setIsModalOpen(true);
            }}
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
                    <span className="font-semibold text-slate-900">
                      {item.room_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#DE0808] shrink-0" />
                    <span>{item.activity_date}</span>
                    <span className="text-slate-400">•</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {item.start_time} - {item.end_time}
                    </span>
                  </div>
                </div>

                {item.requested_equipment &&
                  item.requested_equipment.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {item.requested_equipment.slice(0, 3).map((eq) => (
                        <span
                          key={eq}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold"
                        >
                          {eq}
                        </span>
                      ))}
                      {item.requested_equipment.length > 3 && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
                          +{item.requested_equipment.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                {(item.status === "rejected" || item.status === "cancelled") &&
                  item.rejection_reason && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                      <span className="font-black">
                        {item.status === "cancelled" ? "Note: " : "Reason: "}
                      </span>
                      <span>{item.rejection_reason}</span>
                    </div>
                  )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-semibold">
                  Attendees: {item.expected_attendees}
                </span>
                <div className="flex items-center gap-2">
                  {canEditProposal(item) && (
                    <button
                      onClick={() => {
                        setEditingProposal(item);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                  {canCancelProposal(item) && (
                    <button
                      onClick={() => {
                        setCancellingTarget(item);
                        setCancelReason("");
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer"
                    >
                      <Ban className="w-3 h-3" />
                      <span>Cancel</span>
                    </button>
                  )}
                  <button
                    onClick={() => setInspectProposal(item)}
                    className="inline-flex items-center gap-1 text-xs font-black text-[#DE0808] hover:text-[#C20707] cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Booking Form Modal */}
      <BookingFormModal
        isOpen={isModalOpen}
        editingProposal={editingProposal}
        prefillData={prefillData}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProposal(null);
          setPrefillData(null);
        }}
        onSubmitSuccess={handleProposalSaved}
      />

      {/* Cancel Confirmation Modal */}
      {cancellingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Cancel Proposal?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Cancelling &ldquo;{cancellingTarget.title}&rdquo; will release{" "}
                  {cancellingTarget.room_name} ({cancellingTarget.activity_date}{" "}
                  {cancellingTarget.start_time} - {cancellingTarget.end_time}).
                </p>
              </div>
              <button
                onClick={() => setCancellingTarget(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cancellation Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Event rescheduled to next month"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-[#DE0808]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Keep Proposal
              </button>
              <button
                type="button"
                disabled={cancellingId === cancellingTarget.id}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black disabled:opacity-50 cursor-pointer"
              >
                {cancellingId === cancellingTarget.id
                  ? "Cancelling..."
                  : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Modal */}
      {inspectProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setInspectProposal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black text-[#DE0808] uppercase tracking-wider">
                  {inspectProposal.club_name}
                </span>
                {getStatusBadge(inspectProposal.status)}
              </div>
              <h2 className="text-lg font-black text-slate-900">
                {inspectProposal.title}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {inspectProposal.description}
              </p>
            </div>

            <div className="space-y-3 text-xs divide-y divide-slate-100">
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-500 font-bold">Campus & Room</span>
                <span className="font-black text-slate-900">
                  {inspectProposal.campus} • {inspectProposal.room_name}
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-500 font-bold">Date & Time</span>
                <span className="font-black text-slate-900">
                  {inspectProposal.activity_date} ({inspectProposal.start_time} -{" "}
                  {inspectProposal.end_time})
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-500 font-bold">Attendees</span>
                <span className="font-black text-slate-900">
                  {inspectProposal.expected_attendees} pax
                </span>
              </div>

              {inspectProposal.organizer_name && (
                <div className="pt-2 space-y-1">
                  <span className="text-slate-500 font-bold block">
                    Organizer Contact
                  </span>
                  <div className="bg-slate-50 p-2.5 rounded-xl space-y-1">
                    <div className="font-black text-slate-900">
                      {inspectProposal.organizer_name} (
                      {inspectProposal.organizer_role})
                    </div>
                    <div className="text-slate-600 flex flex-wrap items-center gap-3">
                      <span>Email: {inspectProposal.organizer_email}</span>
                      <span>Phone: {inspectProposal.organizer_phone}</span>
                    </div>
                  </div>
                </div>
              )}

              {(inspectProposal.expected_budget ||
                inspectProposal.budget_details) && (
                  <div className="pt-2 space-y-1">
                    <span className="text-slate-500 font-bold flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> Budget
                    </span>
                    <div className="bg-slate-50 p-2.5 rounded-xl space-y-1">
                      {inspectProposal.expected_budget && (
                        <div className="font-black text-slate-900">
                          {inspectProposal.expected_budget}
                        </div>
                      )}
                      {inspectProposal.budget_details && (
                        <div className="text-slate-600">
                          {inspectProposal.budget_details}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {inspectProposal.suppliers &&
                inspectProposal.suppliers.length > 0 && (
                  <div className="pt-2 space-y-1">
                    <span className="text-slate-500 font-bold block">
                      Suppliers
                    </span>
                    <div className="space-y-1">
                      {inspectProposal.suppliers.map((s, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 p-2 rounded-lg flex justify-between"
                        >
                          <span className="font-bold text-slate-800">
                            {s.name}
                          </span>
                          <span className="text-slate-600">{s.phone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {inspectProposal.requested_equipment &&
                inspectProposal.requested_equipment.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <span className="text-slate-500 font-bold flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" /> Requested Equipment
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectProposal.requested_equipment.map((eq) => (
                        <span
                          key={eq}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold"
                        >
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {inspectProposal.additional_requests && (
                <div className="pt-2 space-y-1">
                  <span className="text-slate-500 font-bold block">
                    Comments & Requests
                  </span>
                  <p className="bg-slate-50 p-2.5 rounded-xl text-slate-700 italic">
                    &ldquo;{inspectProposal.additional_requests}&rdquo;
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              {canEditProposal(inspectProposal) && (
                <button
                  onClick={() => {
                    const target = inspectProposal;
                    setInspectProposal(null);
                    setEditingProposal(target);
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black cursor-pointer"
                >
                  Edit Proposal
                </button>
              )}
              {canCancelProposal(inspectProposal) && (
                <button
                  onClick={() => {
                    setCancellingTarget(inspectProposal);
                    setCancelReason("");
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black cursor-pointer"
                >
                  Cancel Proposal
                </button>
              )}
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
