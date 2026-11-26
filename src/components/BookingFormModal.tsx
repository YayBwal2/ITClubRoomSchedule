"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowRight,
  Send,
  Package,
  Users,
  Info,
  Sparkles,
} from "lucide-react";
import {
  ALL_ROOMS,
  CAMPUSES_DATA,
  checkRoomConflict,
} from "@/lib/constants";
import {
  getDayOfWeekFromDate,
  hasTimeOverlap,
  parseTimeToMinutes,
} from "@/lib/firebase/collections";
import { notifyScheduleUpdated } from "@/lib/schedule-sync";
import {
  checkRoomAvailability,
  createActivityProposal,
  getActivityProposals,
  updateActivityProposal,
} from "@/actions/bookings";
import { getCurrentProfile } from "@/actions/profiles";
import { getRooms } from "@/actions/rooms";
import { getClassSchedules } from "@/actions/schedules";
import {
  ActivityProposal,
  ClassSchedule,
  Room,
  RoomAvailabilityResult,
} from "@/types/database";

const EQUIPMENT_PRESETS = [
  "Projector",
  "Wireless Microphone",
  "HDMI Adapter",
  "Extension Cord",
  "Audio Speakers",
  "Whiteboard Markers",
  "Extra Chairs",
  "Registration Table",
];

export interface BookingPrefillData {
  campus?: string;
  room_name?: string;
  activity_date?: string;
  start_minutes?: number;
  end_minutes?: number;
}

interface TimeParts {
  hour: string;
  minute: string;
  period: "AM" | "PM";
}

function minutesToTimeParts(mins: number, fallback: TimeParts): TimeParts {
  if (!Number.isFinite(mins) || mins < 0 || mins > 1440) return fallback;

  const totalHours = Math.floor(mins / 60);
  const minuteNum = mins % 60;
  const period: "AM" | "PM" = totalHours >= 12 && totalHours < 24 ? "PM" : "AM";
  let hour12 = totalHours % 12;
  if (hour12 === 0) hour12 = 12;

  const snappedMin = [0, 15, 30, 45].reduce((prev, curr) =>
    Math.abs(curr - minuteNum) < Math.abs(prev - minuteNum) ? curr : prev
  );

  return {
    hour: String(hour12).padStart(2, "0"),
    minute: String(snappedMin).padStart(2, "0"),
    period,
  };
}

function parseTimeToParts(timeStr: string, fallback: TimeParts): TimeParts {
  const mins = parseTimeToMinutes(timeStr);
  return minutesToTimeParts(mins, fallback);
}

function buildInitialFormState(
  editingProposal: ActivityProposal | null,
  prefillData: BookingPrefillData | null
) {
  if (!editingProposal) {
    const targetCampus =
      CAMPUSES_DATA.find(
        (c) => c.name === prefillData?.campus && c.status === "active"
      )?.name || "U Wisara";
    const campusRooms =
      CAMPUSES_DATA.find((c) => c.name === targetCampus)?.rooms || [];
    const targetRoom =
      campusRooms.find((r) => r.name === prefillData?.room_name)?.name ||
      campusRooms[0]?.name ||
      "Room 1";

    const startParts =
      prefillData?.start_minutes !== undefined
        ? minutesToTimeParts(prefillData.start_minutes, {
            hour: "09",
            minute: "00",
            period: "AM",
          })
        : { hour: "09", minute: "00", period: "AM" as const };
    const endParts =
      prefillData?.end_minutes !== undefined
        ? minutesToTimeParts(prefillData.end_minutes, {
            hour: "11",
            minute: "00",
            period: "AM",
          })
        : { hour: "11", minute: "00", period: "AM" as const };

    return {
      enableBudget: false,
      enableEquipmentNotes: false,
      selectedEquipment: [] as string[],
      formData: {
        title: "",
        club_name: "IT Club",
        description: "",
        expected_attendees: 30,
        campus: targetCampus,
        room_name: targetRoom,
        activity_date: prefillData?.activity_date || "",
        start_hour: startParts.hour,
        start_minute: startParts.minute,
        start_period: startParts.period,
        end_hour: endParts.hour,
        end_minute: endParts.minute,
        end_period: endParts.period,
        expected_budget: "",
        budget_details: "",
        suppliers: [{ name: "", phone: "" }],
        organizer_name: "",
        organizer_role: "Club Coordinator",
        organizer_email: "",
        organizer_phone: "",
        additional_requests: "",
      },
    };
  }

  const startParts = parseTimeToParts(editingProposal.start_time, {
    hour: "09",
    minute: "00",
    period: "AM",
  });
  const endParts = parseTimeToParts(editingProposal.end_time, {
    hour: "11",
    minute: "00",
    period: "AM",
  });

  return {
    enableBudget: Boolean(
      editingProposal.expected_budget ||
        editingProposal.budget_details ||
        (editingProposal.suppliers && editingProposal.suppliers.length > 0)
    ),
    enableEquipmentNotes: Boolean(
      editingProposal.additional_requests ||
        (editingProposal.requested_equipment &&
          editingProposal.requested_equipment.length > 0)
    ),
    selectedEquipment: editingProposal.requested_equipment || [],
    formData: {
      title: editingProposal.title,
      club_name: editingProposal.club_name,
      description: editingProposal.description,
      expected_attendees: editingProposal.expected_attendees,
      campus: editingProposal.campus,
      room_name: editingProposal.room_name,
      activity_date: editingProposal.activity_date,
      start_hour: startParts.hour,
      start_minute: startParts.minute,
      start_period: startParts.period,
      end_hour: endParts.hour,
      end_minute: endParts.minute,
      end_period: endParts.period,
      expected_budget: editingProposal.expected_budget || "",
      budget_details: editingProposal.budget_details || "",
      suppliers:
        editingProposal.suppliers && editingProposal.suppliers.length > 0
          ? editingProposal.suppliers.map((s) => ({ ...s }))
          : [{ name: "", phone: "" }],
      organizer_name:
        editingProposal.organizer_name || editingProposal.coordinator_name || "",
      organizer_role: editingProposal.organizer_role || "Club Coordinator",
      organizer_email: editingProposal.organizer_email || "",
      organizer_phone: editingProposal.organizer_phone || "",
      additional_requests: editingProposal.additional_requests || "",
    },
  };
}

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: (proposal: ActivityProposal) => void;
  editingProposal?: ActivityProposal | null;
  prefillData?: BookingPrefillData | null;
}

export default function BookingFormModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  editingProposal = null,
  prefillData = null,
}: BookingFormModalProps) {
  if (!isOpen) return null;
  const modalKey =
    editingProposal?.id ??
    (prefillData
      ? `prefill-${prefillData.campus ?? ""}-${prefillData.room_name ?? ""}-${prefillData.activity_date ?? ""}-${prefillData.start_minutes ?? ""}-${prefillData.end_minutes ?? ""}`
      : "new");

  return (
    <BookingFormModalContent
      key={modalKey}
      onClose={onClose}
      onSubmitSuccess={onSubmitSuccess}
      editingProposal={editingProposal}
      prefillData={prefillData}
    />
  );
}

function BookingFormModalContent({
  onClose,
  onSubmitSuccess,
  editingProposal = null,
  prefillData = null,
}: Omit<BookingFormModalProps, "isOpen">) {
  const isEditing = Boolean(editingProposal);
  const initialState = useMemo(
    () => buildInitialFormState(editingProposal, prefillData),
    [editingProposal, prefillData]
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [liveRooms, setLiveRooms] = useState<Room[]>(ALL_ROOMS);
  const [liveProposals, setLiveProposals] = useState<ActivityProposal[]>([]);
  const [liveSchedules, setLiveSchedules] = useState<ClassSchedule[]>([]);
  const [availabilityState, setAvailabilityState] = useState<{
    key: string;
    data: RoomAvailabilityResult;
  } | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const [enableBudget, setEnableBudget] = useState(initialState.enableBudget);
  const [enableEquipmentNotes, setEnableEquipmentNotes] = useState(
    initialState.enableEquipmentNotes
  );
  const [customEquipmentInput, setCustomEquipmentInput] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(
    initialState.selectedEquipment
  );
  const [formData, setFormData] = useState(initialState.formData);

  // Load live rooms, schedules, proposals, and profile defaults asynchronously
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getRooms(),
      getClassSchedules(),
      getActivityProposals(),
      getCurrentProfile(),
    ]).then(([roomsRes, schedulesRes, proposalsRes, profileRes]) => {
      if (cancelled) return;
      if (roomsRes.data && roomsRes.data.length > 0) {
        setLiveRooms(roomsRes.data);
      }
      if (schedulesRes.data) {
        setLiveSchedules(schedulesRes.data);
      }
      if (proposalsRes.data) {
        setLiveProposals(proposalsRes.data);
      }
      if (!editingProposal) {
        const today = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Yangon",
        }).format(new Date());
        const p = profileRes.data;
        setFormData((prev) => ({
          ...prev,
          activity_date: prev.activity_date || today,
          club_name: p?.club_name || prev.club_name,
          organizer_name: prev.organizer_name || p?.full_name || "",
          organizer_email: prev.organizer_email || p?.email || "",
          organizer_phone: prev.organizer_phone || p?.phone_number || "",
        }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [editingProposal]);

  const formattedStartTime = `${formData.start_hour}:${formData.start_minute} ${formData.start_period}`;
  const formattedEndTime = `${formData.end_hour}:${formData.end_minute} ${formData.end_period}`;

  const startMinutes = useMemo(
    () => parseTimeToMinutes(formattedStartTime),
    [formattedStartTime]
  );
  const endMinutes = useMemo(
    () => parseTimeToMinutes(formattedEndTime),
    [formattedEndTime]
  );

  const availableRooms = useMemo(() => {
    const filtered = liveRooms.filter((r) => r.campus === formData.campus);
    if (filtered.length > 0) return filtered;
    return (
      CAMPUSES_DATA.find((c) => c.name === formData.campus) || CAMPUSES_DATA[0]
    ).rooms;
  }, [liveRooms, formData.campus]);

  const selectedRoom = useMemo(
    () =>
      availableRooms.find((r) => r.name === formData.room_name) ||
      availableRooms[0],
    [availableRooms, formData.room_name]
  );

  const availabilityKey = `${selectedRoom?.id ?? ""}|${formData.activity_date}|${formattedStartTime}|${formattedEndTime}|${formData.expected_attendees}`;
  const canCheckAvailability = Boolean(
    selectedRoom?.id && formData.activity_date && endMinutes > startMinutes
  );
  const availability =
    canCheckAvailability && availabilityState?.key === availabilityKey
      ? availabilityState.data
      : null;

  // Live server-side room availability check (busy slots, pending warnings, alternatives)
  useEffect(() => {
    if (!canCheckAvailability || !selectedRoom?.id) {
      return;
    }

    let cancelled = false;
    const targetRoomId = selectedRoom.id;

    const timer = setTimeout(() => {
      setCheckingAvailability(true);
      checkRoomAvailability({
        room_id: targetRoomId,
        activity_date: formData.activity_date,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        exclude_proposal_id: editingProposal?.id,
        expected_attendees: Number(formData.expected_attendees) || 1,
      }).then((res) => {
        if (cancelled) return;
        setCheckingAvailability(false);
        if (res.data) {
          setAvailabilityState({ key: availabilityKey, data: res.data });
        }
      });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    canCheckAvailability,
    availabilityKey,
    selectedRoom?.id,
    formData.activity_date,
    formattedStartTime,
    formattedEndTime,
    formData.expected_attendees,
    editingProposal?.id,
  ]);

  // Immediate client-side + server-synced conflict status
  const conflictResult = useMemo(() => {
    if (!formData.room_name) return { hasConflict: false as const };

    if (endMinutes <= startMinutes) {
      return {
        hasConflict: true as const,
        message: "End time must be later than start time.",
      };
    }

    if (selectedRoom && selectedRoom.status !== "active") {
      return {
        hasConflict: true as const,
        message: `Room "${selectedRoom.name}" is currently under maintenance.`,
      };
    }

    if (
      selectedRoom &&
      Number(formData.expected_attendees) > selectedRoom.capacity
    ) {
      return {
        hasConflict: true as const,
        message: `Room "${selectedRoom.name}" seats up to ${selectedRoom.capacity} people, which cannot fit ${formData.expected_attendees} attendees.`,
      };
    }

    if (availability && !availability.is_available && availability.conflict_reason) {
      return {
        hasConflict: true as const,
        message: availability.conflict_reason,
      };
    }

    const roomId = selectedRoom?.id;
    const isSameRoom = (
      itemRoomId: string,
      itemCampus: string,
      itemRoomName: string
    ) =>
      roomId
        ? itemRoomId === roomId
        : itemRoomName === formData.room_name && itemCampus === formData.campus;

    const matchedProposal = liveProposals.find((p) => {
      if (p.id === editingProposal?.id) return false;
      if (p.status !== "approved" || p.activity_date !== formData.activity_date)
        return false;
      if (!isSameRoom(p.room_id, p.campus, p.room_name)) return false;
      const pStart = p.start_minutes ?? parseTimeToMinutes(p.start_time);
      const pEnd = p.end_minutes ?? parseTimeToMinutes(p.end_time);
      return hasTimeOverlap(startMinutes, endMinutes, pStart, pEnd);
    });

    if (matchedProposal) {
      return {
        hasConflict: true as const,
        message: `Room "${formData.room_name}" is already booked for "${matchedProposal.title}" (${matchedProposal.club_name}) from ${matchedProposal.start_time} - ${matchedProposal.end_time}.`,
      };
    }

    const dayName = getDayOfWeekFromDate(formData.activity_date);
    const matchedSchedule = liveSchedules.find((s) => {
      if (s.status === "cancelled") return false;
      if (!isSameRoom(s.room_id, s.campus, s.room_name)) return false;
      const matchesDay = s.date
        ? s.date === formData.activity_date
        : dayName === s.day_of_week;
      if (!matchesDay) return false;
      const sStart = s.start_minutes ?? parseTimeToMinutes(s.start_time);
      const sEnd = s.end_minutes ?? parseTimeToMinutes(s.end_time);
      return hasTimeOverlap(startMinutes, endMinutes, sStart, sEnd);
    });

    if (matchedSchedule) {
      return {
        hasConflict: true as const,
        message: `Room "${formData.room_name}" has a scheduled class "${matchedSchedule.course_title}" (${matchedSchedule.batch}) from ${matchedSchedule.start_time} - ${matchedSchedule.end_time}.`,
      };
    }

    if (liveProposals.length === 0 && liveSchedules.length === 0 && !availability) {
      const check = checkRoomConflict(
        formData.campus,
        formData.room_name,
        startMinutes,
        endMinutes
      );
      if (check.hasConflict && check.conflictingSession) {
        return {
          hasConflict: true as const,
          message: `Collision: "${check.conflictingSession.category}" (${check.conflictingSession.type}) is already scheduled from ${check.conflictingSession.time} in ${formData.room_name}.`,
        };
      }
    }

    return { hasConflict: false as const };
  }, [
    formData.campus,
    formData.room_name,
    formData.activity_date,
    formData.expected_attendees,
    startMinutes,
    endMinutes,
    selectedRoom,
    availability,
    liveProposals,
    liveSchedules,
    editingProposal?.id,
  ]);

  const handleToggleEquipment = (item: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleAddCustomEquipment = () => {
    const trimmed = customEquipmentInput.trim();
    if (!trimmed) return;
    if (!selectedEquipment.includes(trimmed)) {
      setSelectedEquipment((prev) => [...prev, trimmed]);
    }
    setCustomEquipmentInput("");
  };

  const handleAddSupplier = () => {
    setFormData({
      ...formData,
      suppliers: [...formData.suppliers, { name: "", phone: "" }],
    });
  };

  const handleRemoveSupplier = (index: number) => {
    setFormData({
      ...formData,
      suppliers: formData.suppliers.filter((_, i) => i !== index),
    });
  };

  const handleSupplierChange = (
    index: number,
    field: "name" | "phone",
    value: string
  ) => {
    const updated = [...formData.suppliers];
    updated[index][field] = value;
    setFormData({ ...formData, suppliers: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (conflictResult.hasConflict) {
      setSubmitError(conflictResult.message);
      return;
    }

    const targetRoomId =
      selectedRoom?.id ||
      `room-${formData.room_name.toLowerCase().replace(/\s+/g, "-")}`;
    setSubmitting(true);

    const payload = {
      coordinator_name: formData.organizer_name || "Club Coordinator",
      club_name: formData.club_name,
      title: formData.title,
      description: formData.description,
      expected_attendees: Number(formData.expected_attendees),
      campus: formData.campus,
      room_id: targetRoomId,
      room_name: selectedRoom?.name || formData.room_name,
      activity_date: formData.activity_date,
      start_time: formattedStartTime,
      end_time: formattedEndTime,
      start_minutes: startMinutes,
      end_minutes: endMinutes,
      expected_budget: enableBudget ? formData.expected_budget : undefined,
      budget_details: enableBudget ? formData.budget_details : undefined,
      suppliers: enableBudget
        ? formData.suppliers.filter((s) => s.name.trim() || s.phone.trim())
        : undefined,
      organizer_name: formData.organizer_name,
      organizer_role: formData.organizer_role,
      organizer_email: formData.organizer_email,
      organizer_phone: formData.organizer_phone,
      requested_equipment: enableEquipmentNotes ? selectedEquipment : undefined,
      additional_requests: enableEquipmentNotes
        ? formData.additional_requests
        : undefined,
    };

    try {
      const res = editingProposal
        ? await updateActivityProposal(editingProposal.id, payload)
        : await createActivityProposal(payload);

      if (!res.success || !res.data) {
        setSubmitError(
          res.error ||
            (editingProposal
              ? "Failed to update proposal."
              : "Failed to submit proposal.")
        );
        // Refresh availability in case another booking was approved concurrently
        if (selectedRoom?.id && formData.activity_date) {
          checkRoomAvailability({
            room_id: selectedRoom.id,
            activity_date: formData.activity_date,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            exclude_proposal_id: editingProposal?.id,
            expected_attendees: Number(formData.expected_attendees) || 1,
          }).then((avRes) => {
            if (avRes.data) {
              setAvailabilityState({ key: availabilityKey, data: avRes.data });
            }
          });
        }
        return;
      }

      notifyScheduleUpdated();
      if (onSubmitSuccess) {
        onSubmitSuccess(res.data);
      }
      onClose();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit proposal."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const customEquipmentItems = selectedEquipment.filter(
    (item) => !EQUIPMENT_PRESETS.includes(item)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-auto shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 sticky top-0 z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#DE0808] text-xs font-bold mb-1 border border-red-200">
              <CalendarIcon className="w-3.5 h-3.5" />
              {isEditing ? "Edit Pending Proposal" : "Event Request Form"}
            </div>
            <h2 className="font-black text-slate-900 text-lg sm:text-xl">
              {isEditing
                ? "Update Room & Activity Proposal"
                : "Request Room & Activity Proposal"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1"
        >
          {/* SECTION 1: Event Overview */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#DE0808] text-white flex items-center justify-center text-[11px]">
                1
              </span>
              <span>Event Overview</span>
              <span className="text-[#DE0808] text-xs">*</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  placeholder="e.g. IT Club Coding Workshop"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-[#DE0808]/20 focus:border-[#DE0808] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Club or Society *
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={formData.club_name}
                  onChange={(e) =>
                    setFormData({ ...formData, club_name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-[#DE0808]/20 focus:border-[#DE0808] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Description *
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  placeholder="Briefly describe the purpose of the activity..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-[#DE0808]/20 focus:border-[#DE0808] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expected Attendees *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.expected_attendees}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expected_attendees: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-[#DE0808]/20 focus:border-[#DE0808] outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Booking Slot Selection */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#DE0808] text-white flex items-center justify-center text-[11px]">
                2
              </span>
              <span>Booking Slot & Room Availability</span>
              <span className="text-[#DE0808] text-xs">*</span>
            </h3>

            {/* Campus Choice */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Select Campus
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CAMPUSES_DATA.map((campus) => {
                  const isSelected = formData.campus === campus.name;
                  const isComingSoon = campus.status === "coming_soon";

                  return (
                    <button
                      key={campus.id}
                      type="button"
                      disabled={isComingSoon}
                      onClick={() => {
                        if (!isComingSoon) {
                          const campusLiveRooms = liveRooms.filter(
                            (r) => r.campus === campus.name
                          );
                          const firstRoom =
                            campusLiveRooms[0]?.name ||
                            campus.rooms[0]?.name ||
                            "";
                          setFormData({
                            ...formData,
                            campus: campus.name,
                            room_name: firstRoom,
                          });
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isComingSoon
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                          : isSelected
                          ? "bg-white border-[#DE0808] ring-2 ring-[#DE0808]/20 cursor-pointer"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Building2
                          className={`w-3.5 h-3.5 ${
                            isSelected ? "text-[#DE0808]" : "text-slate-400"
                          }`}
                        />
                        <span className="truncate">{campus.name}</span>
                      </div>
                      {isComingSoon && (
                        <span className="text-[10px] text-amber-600 font-bold block mt-0.5">
                          Coming Soon
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Room Choice with Capacity & Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                Select Room ({formData.campus})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableRooms.map((room) => {
                  const isRoomSelected = formData.room_name === room.name;
                  const isMaintenance = room.status === "maintenance";
                  const tooSmall =
                    Number(formData.expected_attendees) > room.capacity;

                  return (
                    <button
                      key={room.id}
                      type="button"
                      disabled={isMaintenance}
                      onClick={() =>
                        setFormData({ ...formData, room_name: room.name })
                      }
                      className={`px-3 py-2 rounded-xl border text-left text-xs transition-all ${
                        isMaintenance
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                          : isRoomSelected
                          ? "bg-[#DE0808] text-white border-[#DE0808] shadow-xs cursor-pointer"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      <div className="font-bold truncate">{room.name}</div>
                      <div
                        className={`text-[10px] flex items-center gap-1 mt-0.5 ${
                          isRoomSelected
                            ? "text-white/85"
                            : tooSmall
                            ? "text-amber-600 font-bold"
                            : "text-slate-500"
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        <span>
                          {isMaintenance
                            ? "Maintenance"
                            : `Max ${room.capacity}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedRoom && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                  <span className="font-bold text-slate-700">Facilities:</span>
                  {selectedRoom.has_projector && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">
                      Projector
                    </span>
                  )}
                  {selectedRoom.has_ac && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">
                      Air-Con
                    </span>
                  )}
                  {selectedRoom.has_whiteboard && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200">
                      Whiteboard
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Event Date & Time Window */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
              <div className="md:col-span-5">
                <label className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase mb-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#DE0808]" />
                  <span>Event Date</span>
                  <span className="text-[#DE0808]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.activity_date}
                  onChange={(e) =>
                    setFormData({ ...formData, activity_date: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-red-200 bg-white text-slate-900 font-black text-xs focus:ring-2 focus:ring-[#DE0808]/20 focus:border-[#DE0808] outline-none cursor-pointer [color-scheme:light]"
                />
              </div>

              <div className="md:col-span-7">
                <label className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#DE0808]" />
                  <span>Time Window</span>
                  <span className="text-[#DE0808]">*</span>
                </label>
                <div className="p-2.5 bg-red-50/50 rounded-xl border-2 border-red-200 flex flex-wrap items-center justify-between gap-2">
                  {/* From */}
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded bg-[#DE0808] text-white text-[10px] font-black uppercase">
                      From
                    </span>
                    <select
                      value={formData.start_hour}
                      onChange={(e) =>
                        setFormData({ ...formData, start_hour: e.target.value })
                      }
                      className="px-1.5 py-1 rounded border-2 border-red-200 bg-white text-slate-900 font-black text-xs outline-none"
                    >
                      {["01","02","03","04","05","06","07","08","09","10","11","12"].map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span className="font-black text-[#DE0808]">:</span>
                    <select
                      value={formData.start_minute}
                      onChange={(e) =>
                        setFormData({ ...formData, start_minute: e.target.value })
                      }
                      className="px-1.5 py-1 rounded border-2 border-red-200 bg-white text-slate-900 font-black text-xs outline-none"
                    >
                      {["00","15","30","45"].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={formData.start_period}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          start_period: e.target.value as "AM" | "PM",
                        })
                      }
                      className="px-1.5 py-1 rounded border-2 border-[#DE0808] bg-[#DE0808] text-white font-black text-xs uppercase outline-none"
                    >
                      <option value="AM" className="bg-white text-slate-900">AM</option>
                      <option value="PM" className="bg-white text-slate-900">PM</option>
                    </select>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-[#DE0808] hidden sm:block" />

                  {/* To */}
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded bg-[#DE0808] text-white text-[10px] font-black uppercase">
                      To
                    </span>
                    <select
                      value={formData.end_hour}
                      onChange={(e) =>
                        setFormData({ ...formData, end_hour: e.target.value })
                      }
                      className="px-1.5 py-1 rounded border-2 border-red-200 bg-white text-slate-900 font-black text-xs outline-none"
                    >
                      {["01","02","03","04","05","06","07","08","09","10","11","12"].map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span className="font-black text-[#DE0808]">:</span>
                    <select
                      value={formData.end_minute}
                      onChange={(e) =>
                        setFormData({ ...formData, end_minute: e.target.value })
                      }
                      className="px-1.5 py-1 rounded border-2 border-red-200 bg-white text-slate-900 font-black text-xs outline-none"
                    >
                      {["00","15","30","45"].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={formData.end_period}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          end_period: e.target.value as "AM" | "PM",
                        })
                      }
                      className="px-1.5 py-1 rounded border-2 border-[#DE0808] bg-[#DE0808] text-white font-black text-xs uppercase outline-none"
                    >
                      <option value="AM" className="bg-white text-slate-900">AM</option>
                      <option value="PM" className="bg-white text-slate-900">PM</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Conflict / Availability Banner + Alternative Suggestions */}
            {conflictResult.hasConflict ? (
              <div className="p-3.5 rounded-xl bg-red-50 border-2 border-red-300 text-red-800 text-xs space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <div className="font-black text-red-700">
                      Room Occupied or Invalid Selection
                    </div>
                    <div className="text-[11px] mt-0.5">
                      {conflictResult.message}
                    </div>
                  </div>
                </div>

                {availability && availability.alternative_rooms.length > 0 && (
                  <div className="pt-2 border-t border-red-200/80">
                    <div className="text-[11px] font-black text-red-800 flex items-center gap-1 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Available Alternative Rooms in {formData.campus}:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {availability.alternative_rooms.map((alt) => (
                        <button
                          key={alt.id}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, room_name: alt.name })
                          }
                          className="px-2.5 py-1 rounded-lg bg-white border border-red-200 hover:border-[#DE0808] text-slate-800 font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Switch to {alt.name} (Max {alt.capacity})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {checkingAvailability
                      ? `Checking ${formData.room_name} availability...`
                      : `${formData.room_name} is available for this slot!`}
                  </span>
                </div>
                <span className="text-[11px] font-black text-emerald-700">
                  {formattedStartTime} - {formattedEndTime}
                </span>
              </div>
            )}

            {/* Day Busy Slots & Pending Requests Info */}
            {availability &&
              (availability.busy_slots.length > 0 ||
                availability.pending_slots.length > 0) && (
                <div className="bg-white rounded-xl p-3 border border-slate-200 text-[11px] space-y-2">
                  {availability.busy_slots.length > 0 && (
                    <div>
                      <div className="font-black text-slate-700 mb-1">
                        Occupied Slots in {formData.room_name} on{" "}
                        {formData.activity_date}:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {availability.busy_slots.map((slot) => (
                          <span
                            key={slot.id}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold"
                          >
                            {slot.start_time} - {slot.end_time} ({slot.title})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {availability.pending_slots.length > 0 && (
                    <div className="flex items-start gap-1.5 text-amber-700 bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        Heads up: {availability.pending_slots.length} pending
                        request(s) already queued for this room on{" "}
                        {formData.activity_date} (
                        {availability.pending_slots
                          .map((s) => `${s.start_time}-${s.end_time}`)
                          .join(", ")}
                        ).
                      </span>
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* SECTION 3: Budget & Supplier Info */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#DE0808] text-white flex items-center justify-center text-[11px]">
                  3
                </span>
                <span>Budget & Supplier Information</span>
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[11px] font-bold text-slate-500">
                  {enableBudget ? "Enabled" : "Off"}
                </span>
                <input
                  type="checkbox"
                  checked={enableBudget}
                  onChange={(e) => setEnableBudget(e.target.checked)}
                  className="w-4 h-4 accent-[#DE0808] cursor-pointer"
                />
              </label>
            </div>

            {enableBudget && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Expected Budget (MMK)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 150,000 MMK"
                      value={formData.expected_budget}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expected_budget: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-[#DE0808]/20 focus:border-[#DE0808] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Budget Details
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Snacks, certificates, printed banners"
                      value={formData.budget_details}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          budget_details: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-[#DE0808]/20 focus:border-[#DE0808] outline-none"
                    />
                  </div>
                </div>

                {/* Multiple Suppliers */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      External Suppliers (Catering, Printing, etc.)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSupplier}
                      className="px-2.5 py-1 rounded-lg bg-red-50 text-[#DE0808] hover:bg-red-100 text-xs font-black transition-colors flex items-center gap-1 border border-red-200 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Supplier</span>
                    </button>
                  </div>

                  {formData.suppliers.map((supplier, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Supplier Name"
                        value={supplier.name}
                        onChange={(e) =>
                          handleSupplierChange(idx, "name", e.target.value)
                        }
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#DE0808]"
                      />
                      <input
                        type="text"
                        placeholder="Supplier Phone Number"
                        value={supplier.phone}
                        onChange={(e) =>
                          handleSupplierChange(idx, "phone", e.target.value)
                        }
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#DE0808]"
                      />
                      {formData.suppliers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSupplier(idx)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: Event Organizer Contact Information */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#DE0808] text-white flex items-center justify-center text-[11px]">
                4
              </span>
              <span>Event Organizer Contact Information</span>
              <span className="text-[#DE0808] text-xs">* Required</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={formData.organizer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, organizer_name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#DE0808]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Club Role *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Club Leader"
                  value={formData.organizer_role}
                  onChange={(e) =>
                    setFormData({ ...formData, organizer_role: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#DE0808]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="coordinator@sfic.edu.mm"
                  value={formData.organizer_email}
                  onChange={(e) =>
                    setFormData({ ...formData, organizer_email: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#DE0808]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="09 123 456 789"
                  value={formData.organizer_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, organizer_phone: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#DE0808]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: Equipment Requests & Additional Comments */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#DE0808] text-white flex items-center justify-center text-[11px]">
                  5
                </span>
                <span>Equipment Requests & Additional Comments</span>
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[11px] font-bold text-slate-500">
                  {enableEquipmentNotes ? "Enabled" : "Off"}
                </span>
                <input
                  type="checkbox"
                  checked={enableEquipmentNotes}
                  onChange={(e) => setEnableEquipmentNotes(e.target.checked)}
                  className="w-4 h-4 accent-[#DE0808] cursor-pointer"
                />
              </label>
            </div>

            {enableEquipmentNotes && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                    <Package className="w-3.5 h-3.5 text-[#DE0808]" />
                    <span>Select Required Equipment</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EQUIPMENT_PRESETS.map((item) => {
                      const active = selectedEquipment.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleToggleEquipment(item)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            active
                              ? "bg-[#DE0808] text-white border-[#DE0808]"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                    {customEquipmentItems.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleToggleEquipment(item)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-[#DE0808] text-white border-[#DE0808] cursor-pointer flex items-center gap-1"
                      >
                        <span>{item}</span>
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-2.5">
                    <input
                      type="text"
                      placeholder="Add other equipment (e.g. Tripod, Flipchart)..."
                      value={customEquipmentInput}
                      onChange={(e) => setCustomEquipmentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomEquipment();
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#DE0808]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomEquipment}
                      className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-black text-slate-700 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={3}
                  placeholder="Mention any special room layout, setup timing, or additional notes..."
                  value={formData.additional_requests}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additional_requests: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#DE0808]"
                />
              </div>
            )}
          </div>

          {/* Submit Error Alert */}
          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || conflictResult.hasConflict}
              className="px-6 py-2.5 rounded-xl bg-[#DE0808] hover:bg-[#C20707] text-white text-xs font-black shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {submitting
                  ? isEditing
                    ? "Saving..."
                    : "Submitting..."
                  : isEditing
                  ? "Save Changes"
                  : "Submit Proposal"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
