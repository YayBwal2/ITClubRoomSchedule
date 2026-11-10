"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowRight,
  Send,
} from "lucide-react";
import {
  CAMPUSES_DATA,
  checkRoomConflict,
  timeStringToMinutes,
  minutesToDisplayTime,
} from "@/lib/constants";
import { ActivityProposal } from "@/types/database";

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: (proposal: ActivityProposal) => void;
}

export default function BookingFormModal({ isOpen, onClose, onSubmitSuccess }: BookingFormModalProps) {
  const [submitting, setSubmitting] = useState(false);

  // Optional Section Toggles
  const [enableRoomBooking, setEnableRoomBooking] = useState(true);
  const [enableBudget, setEnableBudget] = useState(false);
  const [enableComments, setEnableComments] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    club_name: "IT Club",
    description: "",
    expected_attendees: 30,

    campus: "U Wisara",
    room_name: "Room 1",
    activity_date: "2026-10-31",
    start_hour: "09",
    start_minute: "00",
    start_period: "AM",
    end_hour: "11",
    end_minute: "00",
    end_period: "AM",

    expected_budget: "",
    budget_details: "",
    suppliers: [{ name: "", phone: "" }],

    organizer_name: "",
    organizer_role: "Club Coordinator",
    organizer_email: "",
    organizer_phone: "",

    additional_requests: "",
  });

  // Calculate time strings
  const formattedStartTime = `${formData.start_hour}:${formData.start_minute} ${formData.start_period}`;
  const formattedEndTime = `${formData.end_hour}:${formData.end_minute} ${formData.end_period}`;

  const startMinutes = useMemo(() => timeStringToMinutes(formattedStartTime), [formattedStartTime]);
  const endMinutes = useMemo(() => timeStringToMinutes(formattedEndTime), [formattedEndTime]);

  // Real-time Room Collision Checking
  const conflictResult = useMemo(() => {
    if (!enableRoomBooking || !formData.room_name) return { hasConflict: false };

    if (endMinutes <= startMinutes) {
      return {
        hasConflict: true,
        message: "End time must be later than start time.",
      };
    }

    const check = checkRoomConflict(formData.campus, formData.room_name, startMinutes, endMinutes);
    if (check.hasConflict && check.conflictingSession) {
      return {
        hasConflict: true,
        message: `Collision: "${check.conflictingSession.category}" (${check.conflictingSession.type}) is already scheduled from ${check.conflictingSession.time} in ${formData.room_name}.`,
      };
    }

    return { hasConflict: false };
  }, [formData.campus, formData.room_name, startMinutes, endMinutes, enableRoomBooking]);

  const activeCampusObj = CAMPUSES_DATA.find((c) => c.name === formData.campus) || CAMPUSES_DATA[0];
  const availableRooms = activeCampusObj.rooms;

  // Supplier list handlers
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

  const handleSupplierChange = (index: number, field: "name" | "phone", value: string) => {
    const updated = [...formData.suppliers];
    updated[index][field] = value;
    setFormData({ ...formData, suppliers: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (enableRoomBooking && conflictResult.hasConflict) {
      alert("Please resolve the room scheduling conflict before submitting.");
      return;
    }

    setSubmitting(true);

    const newProposal: ActivityProposal = {
      id: `prop-${Date.now()}`,
      coordinator_id: "user-coord-1",
      coordinator_name: formData.organizer_name || "Club Coordinator",
      club_name: formData.club_name,
      title: formData.title,
      description: formData.description,
      expected_attendees: Number(formData.expected_attendees),
      campus: formData.campus,
      room_id: `room-${formData.room_name.toLowerCase().replace(/\s+/g, "-")}`,
      room_name: formData.room_name,
      activity_date: formData.activity_date,
      start_time: formattedStartTime,
      end_time: formattedEndTime,
      expected_budget: enableBudget ? formData.expected_budget : undefined,
      budget_details: enableBudget ? formData.budget_details : undefined,
      suppliers: enableBudget ? formData.suppliers.filter((s) => s.name || s.phone) : undefined,
      organizer_name: formData.organizer_name,
      organizer_role: formData.organizer_role,
      organizer_email: formData.organizer_email,
      organizer_phone: formData.organizer_phone,
      additional_requests: enableComments ? formData.additional_requests : undefined,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTimeout(() => {
      setSubmitting(false);
      if (onSubmitSuccess) {
        onSubmitSuccess(newProposal);
      }
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-auto shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 sticky top-0 z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#DE0808] text-xs font-bold mb-1 border border-red-200">
              <CalendarIcon className="w-3.5 h-3.5" /> Event Request Form
            </div>
            <h2 className="font-black text-slate-900 text-lg sm:text-xl">Request Room & Activity Proposal</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {/* SECTION 1: Event Overview (Required) */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#DE0808] text-white flex items-center justify-center text-[11px]">1</span>
              <span>Event Overview</span>
              <span className="text-[#DE0808] text-xs">*</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IT Club Coding Workshop"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-[#DE0808]/20 focus:border-[#DE0808] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Club or Society *</label>
                <input
                  type="text"
                  required
                  value={formData.club_name}
                  onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-[#DE0808]/20 focus:border-[#DE0808] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Event Description *</label>
                <input
                  type="text"
                  required
                  placeholder="Briefly describe the purpose of the activity..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-[#DE0808]/20 focus:border-[#DE0808] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expected Attendees *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.expected_attendees}
                  onChange={(e) => setFormData({ ...formData, expected_attendees: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-[#DE0808]/20 focus:border-[#DE0808] outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Booking Slot Selection (Optional Switch) */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#DE0808] text-white flex items-center justify-center text-[11px]">2</span>
                <span>Booking Slot Selection (Campus, Room, Date & Time)</span>
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[11px] font-bold text-slate-500">
                  {enableRoomBooking ? "Enabled" : "Off"}
                </span>
                <input
                  type="checkbox"
                  checked={enableRoomBooking}
                  onChange={(e) => setEnableRoomBooking(e.target.checked)}
                  className="w-4 h-4 accent-[#DE0808] cursor-pointer"
                />
              </label>
            </div>

            {enableRoomBooking && (
              <div className="space-y-4 pt-1">
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
                              const firstRoom = campus.rooms[0]?.name || "";
                              setFormData({ ...formData, campus: campus.name, room_name: firstRoom });
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
                            <Building2 className={`w-3.5 h-3.5 ${isSelected ? "text-[#DE0808]" : "text-slate-400"}`} />
                            <span className="truncate">{campus.name}</span>
                          </div>
                          {isComingSoon && (
                            <span className="text-[10px] text-amber-600 font-bold block mt-0.5">Coming Soon</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Room Choice (No seat count!) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Select Room ({formData.campus})
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {availableRooms.map((room) => {
                      const isRoomSelected = formData.room_name === room.name;
                      return (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, room_name: room.name })}
                          className={`px-3 py-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                            isRoomSelected
                              ? "bg-[#DE0808] text-white border-[#DE0808] shadow-xs"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {room.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Event Date & Time Window with Strategy First Red Theme */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
                  {/* Date Picker */}
                  <div className="md:col-span-5">
                    <label className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase mb-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#DE0808]" />
                      <span>Event Date</span>
                      <span className="text-[#DE0808]">*</span>
                    </label>
                    <input
                      type="date"
                      required={enableRoomBooking}
                      value={formData.activity_date}
                      onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-red-200 bg-white text-slate-900 font-black text-xs focus:ring-2 focus:ring-[#DE0808]/20 focus:border-[#DE0808] outline-none cursor-pointer [color-scheme:light]"
                    />
                  </div>

                  {/* Time Selector */}
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
                          onChange={(e) => setFormData({ ...formData, start_hour: e.target.value })}
                          className="px-1.5 py-1 rounded border-2 border-red-200 bg-white text-slate-900 font-black text-xs outline-none"
                        >
                          {["00","01","02","03","04","05","06","07","08","09","10","11","12"].map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className="font-black text-[#DE0808]">:</span>
                        <select
                          value={formData.start_minute}
                          onChange={(e) => setFormData({ ...formData, start_minute: e.target.value })}
                          className="px-1.5 py-1 rounded border-2 border-red-200 bg-white text-slate-900 font-black text-xs outline-none"
                        >
                          {["00","15","30","45"].map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={formData.start_period}
                          onChange={(e) => setFormData({ ...formData, start_period: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, end_hour: e.target.value })}
                          className="px-1.5 py-1 rounded border-2 border-red-200 bg-white text-slate-900 font-black text-xs outline-none"
                        >
                          {["00","01","02","03","04","05","06","07","08","09","10","11","12"].map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className="font-black text-[#DE0808]">:</span>
                        <select
                          value={formData.end_minute}
                          onChange={(e) => setFormData({ ...formData, end_minute: e.target.value })}
                          className="px-1.5 py-1 rounded border-2 border-red-200 bg-white text-slate-900 font-black text-xs outline-none"
                        >
                          {["00","15","30","45"].map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={formData.end_period}
                          onChange={(e) => setFormData({ ...formData, end_period: e.target.value })}
                          className="px-1.5 py-1 rounded border-2 border-[#DE0808] bg-[#DE0808] text-white font-black text-xs uppercase outline-none"
                        >
                          <option value="AM" className="bg-white text-slate-900">AM</option>
                          <option value="PM" className="bg-white text-slate-900">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conflict Status Alert */}
                {conflictResult.hasConflict ? (
                  <div className="p-3.5 rounded-xl bg-red-50 border-2 border-red-300 text-red-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-black text-red-700">Room Occupied or Invalid Time</div>
                      <div className="text-[11px] mt-0.5">{conflictResult.message}</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{formData.room_name} is available for this slot!</span>
                    </div>
                    <span className="text-[11px] font-black text-emerald-700">{formattedStartTime} - {formattedEndTime}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: Budget & Supplier Info (Optional Switch) */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#DE0808] text-white flex items-center justify-center text-[11px]">3</span>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Expected Budget (MMK)</label>
                    <input
                      type="text"
                      placeholder="e.g. 150,000 MMK"
                      value={formData.expected_budget}
                      onChange={(e) => setFormData({ ...formData, expected_budget: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-[#DE0808]/20 focus:border-[#DE0808] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Budget Details</label>
                    <input
                      type="text"
                      placeholder="e.g. Snacks, certificates, printed banners"
                      value={formData.budget_details}
                      onChange={(e) => setFormData({ ...formData, budget_details: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-2 focus:ring-[#DE0808]/20 focus:border-[#DE0808] outline-none"
                    />
                  </div>
                </div>

                {/* Multiple Suppliers with + Button */}
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
                        onChange={(e) => handleSupplierChange(idx, "name", e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#DE0808]"
                      />
                      <input
                        type="text"
                        placeholder="Supplier Phone Number"
                        value={supplier.phone}
                        onChange={(e) => handleSupplierChange(idx, "phone", e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#DE0808]"
                      />
                      {formData.suppliers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSupplier(idx)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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

          {/* SECTION 4: Event Organizer's Contact Information (REQUIRED) */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-[#DE0808] text-white flex items-center justify-center text-[11px]">4</span>
              <span>Event Organizer Contact Information</span>
              <span className="text-[#DE0808] text-xs">* Required</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={formData.organizer_name}
                  onChange={(e) => setFormData({ ...formData, organizer_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#DE0808]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Club Role *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Club Leader"
                  value={formData.organizer_role}
                  onChange={(e) => setFormData({ ...formData, organizer_role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#DE0808]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="coordinator@sfic.edu.mm"
                  value={formData.organizer_email}
                  onChange={(e) => setFormData({ ...formData, organizer_email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#DE0808]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="09 123 456 789"
                  value={formData.organizer_phone}
                  onChange={(e) => setFormData({ ...formData, organizer_phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#DE0808]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: Additional Comments (Optional Switch) */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#DE0808] text-white flex items-center justify-center text-[11px]">5</span>
                <span>Additional Comments or Equipment Requests</span>
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[11px] font-bold text-slate-500">
                  {enableComments ? "Enabled" : "Off"}
                </span>
                <input
                  type="checkbox"
                  checked={enableComments}
                  onChange={(e) => setEnableComments(e.target.checked)}
                  className="w-4 h-4 accent-[#DE0808] cursor-pointer"
                />
              </label>
            </div>

            {enableComments && (
              <textarea
                rows={3}
                placeholder="Mention any audio equipment, microphone, HDMI converters, or special arrangements needed..."
                value={formData.additional_requests}
                onChange={(e) => setFormData({ ...formData, additional_requests: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-[#DE0808]"
              />
            )}
          </div>

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
              disabled={submitting || (enableRoomBooking && conflictResult.hasConflict)}
              className="px-6 py-2.5 rounded-xl bg-[#DE0808] hover:bg-[#C20707] text-white text-xs font-black shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? "Submitting..." : "Submit Proposal"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
