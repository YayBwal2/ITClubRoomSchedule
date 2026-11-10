"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Camera,
  History,
  Bell,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Smartphone,
  RefreshCw,
  LogIn,
  Key,
  BadgeCheck,
} from "lucide-react";
import { UserRole } from "@/types/database";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User state
  const [user, setUser] = useState({
    name: "Doraemon",
    id: "A112",
    role: "Club Coordinator" as string,
    roleCode: "coordinator" as UserRole,
    email: "doraemon@gmail.com",
    phone: "+95 9 729 765 234",
    joinedDate: "15 Jan 2026",
    avatar: "/sfic-horizontal-logo.png", // will default to cute avatar or uploaded
  });

  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Change Password state (EDITABLE)
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Notification toggles
  const [emailNotification, setEmailNotification] = useState(true);
  const [inAppNotification, setInAppNotification] = useState(true);

  // Save profile state message
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem("cfss_current_role") as UserRole;
    const savedAvatar = localStorage.getItem("cfss_user_avatar");
    if (savedAvatar) {
      setAvatarPreview(savedAvatar);
    }

    if (savedRole === "admin") {
      setUser((prev) => ({
        ...prev,
        role: "School Operations Admin",
        roleCode: "admin",
        id: "ADM-001",
        email: "admin@sfic.edu.mm",
      }));
    } else if (savedRole === "sse") {
      setUser((prev) => ({
        ...prev,
        role: "Student Services Executive",
        roleCode: "sse",
        id: "SSE-204",
        email: "sse@sfic.edu.mm",
      }));
    } else {
      setUser((prev) => ({
        ...prev,
        role: "Club Coordinator",
        roleCode: "coordinator",
        id: "A112",
        email: "doraemon@gmail.com",
      }));
    }
  }, []);

  // Avatar upload handler (EDITABLE)
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatarPreview(base64);
        localStorage.setItem("cfss_user_avatar", base64);
        setProfileMessage("Profile picture updated successfully!");
        setTimeout(() => setProfileMessage(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  // Password change handler (EDITABLE)
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: "error", text: "Please fill in all password fields." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match!" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }

    setPasswordMessage({ type: "success", text: "Password changed successfully!" });
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordMessage(null), 3500);
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("cfss_current_role");
    localStorage.removeItem("cfss_user_avatar");
    router.push("/login");
  };

  // Role display badge label
  const roleBadgeLabel =
    user.roleCode === "admin"
      ? "ADMIN"
      : user.roleCode === "sse"
      ? "SSE"
      : "COORDINATOR";

  return (
    <div className="space-y-5 pb-10">
      {/* Top Breadcrumb Pill Tag */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DE0808] text-white text-xs font-black shadow-xs">
          <User className="w-3.5 h-3.5" />
          <span>Profile & Settings</span>
        </div>
      </div>

      {/* Main 3-Column Profile Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================
            COLUMN 1 (Left): Personal Information & Change Password
           ======================================================== */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1.1 Personal Information Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-slate-800" />
              <div>
                <h2 className="text-base font-black text-slate-900 leading-tight">Personal Information</h2>
                <p className="text-[11px] text-slate-400">User's personal details</p>
              </div>
            </div>
            {/* Red Accent Horizontal Divider Line */}
            <div className="w-full h-0.5 bg-[#DE0808] mb-5" />

            {/* Avatar & Details */}
            <div className="flex flex-col items-center text-center space-y-3">
              {/* Circular Avatar */}
              <div className="relative w-28 h-28 rounded-full border-4 border-slate-100 shadow-md overflow-hidden bg-sky-50 flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // Default Doraemon avatar graphic SVG
                  <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="44" fill="#00A0E9" />
                    <circle cx="50" cy="56" r="34" fill="white" />
                    <ellipse cx="43" cy="38" rx="8" ry="12" fill="white" stroke="#333" strokeWidth="1.5" />
                    <ellipse cx="57" cy="38" rx="8" ry="12" fill="white" stroke="#333" strokeWidth="1.5" />
                    <circle cx="45" cy="40" r="3" fill="#333" />
                    <circle cx="55" cy="40" r="3" fill="#333" />
                    <circle cx="50" cy="48" r="6" fill="#E60012" stroke="#333" strokeWidth="1" />
                    <line x1="50" y1="54" x2="50" y2="76" stroke="#333" strokeWidth="1.5" />
                    <path d="M 32 66 Q 50 82 68 66" fill="none" stroke="#333" strokeWidth="1.5" />
                    <line x1="24" y1="50" x2="42" y2="52" stroke="#333" strokeWidth="1" />
                    <line x1="22" y1="58" x2="42" y2="58" stroke="#333" strokeWidth="1" />
                    <line x1="24" y1="66" x2="42" y2="64" stroke="#333" strokeWidth="1" />
                    <line x1="76" y1="50" x2="58" y2="52" stroke="#333" strokeWidth="1" />
                    <line x1="78" y1="58" x2="58" y2="58" stroke="#333" strokeWidth="1" />
                    <line x1="76" y1="66" x2="58" y2="64" stroke="#333" strokeWidth="1" />
                    <rect x="30" y="86" width="40" height="6" rx="3" fill="#E60012" />
                    <circle cx="50" cy="91" r="4" fill="#FFD700" stroke="#333" strokeWidth="0.8" />
                  </svg>
                )}
              </div>

              {/* Name & Role Badge */}
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{user.name}</h3>
                <span className="inline-block px-3 py-0.5 rounded-md bg-[#DE0808] text-white text-[11px] font-black uppercase tracking-wider">
                  {roleBadgeLabel}
                </span>
              </div>

              {/* Personal Details List */}
              <div className="w-full pt-3 space-y-2 text-xs text-left">
                <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Mail className="w-4 h-4 text-[#DE0808] shrink-0" />
                  <span className="font-semibold truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Phone className="w-4 h-4 text-[#DE0808] shrink-0" />
                  <span className="font-semibold">{user.phone}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-bold flex items-center gap-1.5 text-slate-500">
                    <BadgeCheck className="w-3.5 h-3.5 text-[#DE0808]" /> User ID
                  </span>
                  <span className="font-black text-slate-900">{user.id}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-bold flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-[#DE0808]" /> Joined Date
                  </span>
                  <span className="font-black text-slate-900">{user.joinedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 1.2 Change Password Card (EDITABLE!) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-5 h-5 text-slate-800" />
              <div>
                <h2 className="text-base font-black text-slate-900 leading-tight">Change Password</h2>
                <p className="text-[11px] text-slate-400">Keep your account secured</p>
              </div>
            </div>
            {/* Red Accent Horizontal Divider Line */}
            <div className="w-full h-0.5 bg-[#DE0808] mb-5" />

            {/* Notification alert */}
            {passwordMessage && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 ${
                  passwordMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {passwordMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs">
              {/* Old Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Old Password</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    placeholder="Enter your current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold focus:border-[#DE0808] outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold focus:border-[#DE0808] outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold focus:border-[#DE0808] outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Save Changes Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#DE0808] hover:bg-[#C20707] text-white text-xs font-black shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ========================================================
            COLUMN 2 (Center): Edit Profile (Only Avatar is Editable, rest NOT editable)
           ======================================================== */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-slate-800" />
                <div>
                  <h2 className="text-base font-black text-slate-900 leading-tight">Edit Profile</h2>
                  <p className="text-[11px] text-slate-400">Update Your personal details</p>
                </div>
              </div>
              {/* Red Accent Horizontal Divider Line */}
              <div className="w-full h-0.5 bg-[#DE0808]" />
            </div>

            {/* Profile update feedback */}
            {profileMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{profileMessage}</span>
              </div>
            )}

            {/* Avatar with Camera badge (EDITABLE) */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-slate-100 shadow-lg overflow-hidden bg-sky-50 flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="User Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // Default Doraemon avatar graphic SVG
                    <svg className="w-28 h-28" viewBox="0 0 100 100" fill="none">
                      <circle cx="50" cy="50" r="44" fill="#00A0E9" />
                      <circle cx="50" cy="56" r="34" fill="white" />
                      <ellipse cx="43" cy="38" rx="8" ry="12" fill="white" stroke="#333" strokeWidth="1.5" />
                      <ellipse cx="57" cy="38" rx="8" ry="12" fill="white" stroke="#333" strokeWidth="1.5" />
                      <circle cx="45" cy="40" r="3" fill="#333" />
                      <circle cx="55" cy="40" r="3" fill="#333" />
                      <circle cx="50" cy="48" r="6" fill="#E60012" stroke="#333" strokeWidth="1" />
                      <line x1="50" y1="54" x2="50" y2="76" stroke="#333" strokeWidth="1.5" />
                      <path d="M 32 66 Q 50 82 68 66" fill="none" stroke="#333" strokeWidth="1.5" />
                      <rect x="30" y="86" width="40" height="6" rx="3" fill="#E60012" />
                      <circle cx="50" cy="91" r="4" fill="#FFD700" stroke="#333" strokeWidth="0.8" />
                    </svg>
                  )}
                </div>

                {/* Camera Click Icon Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-slate-900 hover:bg-[#DE0808] text-white flex items-center justify-center shadow-md transition-colors cursor-pointer border-2 border-white"
                  title="Change Profile Picture"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Hidden File Input for Avatar Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              {/* Update Profile Picture Button (EDITABLE) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5 text-[#DE0808]" />
                <span>Update Profile Picture</span>
              </button>
            </div>

            {/* Fields: ALL NOT EDITABLE (except Profile Picture & Password) as instructed */}
            <div className="space-y-4 pt-2">
              {/* Full Name (Not Editable) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3 text-slate-400" /> Locked
                  </span>
                </div>
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-800 text-xs font-bold cursor-not-allowed select-none">
                  {user.name}
                </div>
              </div>

              {/* User ID (Not Editable) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-slate-400" /> User ID
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3 text-slate-400" /> Locked
                  </span>
                </div>
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-800 text-xs font-bold cursor-not-allowed select-none">
                  {user.id}
                </div>
              </div>

              {/* Role (Not Editable) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-400" /> Role
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3 text-slate-400" /> Locked
                  </span>
                </div>
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-800 text-xs font-bold cursor-not-allowed select-none">
                  {user.role}
                </div>
              </div>

              {/* Phone Number (Not Editable) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3 text-slate-400" /> Locked
                  </span>
                </div>
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-800 text-xs font-bold cursor-not-allowed select-none">
                  {user.phone}
                </div>
              </div>

              {/* Email Address (Not Editable) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3 text-slate-400" /> Locked
                  </span>
                </div>
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-800 text-xs font-bold cursor-not-allowed select-none">
                  {user.email}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileMessage("Profile picture and settings saved!");
                  setTimeout(() => setProfileMessage(null), 3000);
                }}
                className="px-5 py-2 rounded-xl bg-[#DE0808] hover:bg-[#C20707] text-white text-xs font-black shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================
            COLUMN 3 (Right): Recent Activity, Notifications, Logout
           ======================================================== */}
        <div className="lg:col-span-3 space-y-5">
          {/* 3.1 Recent Activity Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-800" />
                <h3 className="text-sm font-black text-slate-900">Recent Activity</h3>
              </div>
              <span className="text-[11px] font-black text-[#DE0808] cursor-pointer hover:underline">
                View All &gt;
              </span>
            </div>

            {/* List of Recent Log Items */}
            <div className="space-y-3 pt-1 text-xs">
              {/* Item 1 */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <LogIn className="w-3.5 h-3.5 text-slate-700" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Logged in to the system</div>
                  <div className="text-[10px] text-slate-400">20 Sept 2025 , 09:15 A.M</div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-700" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Update information</div>
                  <div className="text-[10px] text-slate-400">9 Dec 2025 , 08:20 A.M</div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-3.5 h-3.5 text-slate-700" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Changed password</div>
                  <div className="text-[10px] text-slate-400">12 Feb 2026 , 10:35 P.M</div>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-700" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">System updated</div>
                  <div className="text-[10px] text-slate-400">20 Feb 2026 , 10:05 A.M</div>
                </div>
              </div>

              {/* Item 5 */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-700" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Logged in from new devices</div>
                  <div className="text-[10px] text-slate-400">29 Oct 2026 , 03:12 P.M</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3.2 Notification Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-800" />
              <h3 className="text-sm font-black text-slate-900">Notification</h3>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              {/* Email Notification Switch */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Email Notification</div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Receive notification to your registered email.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                  <input
                    type="checkbox"
                    checked={emailNotification}
                    onChange={(e) => setEmailNotification(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#DE0808]"></div>
                </label>
              </div>

              {/* In-App Notification Switch */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <div className="font-bold text-slate-900">In-App Notification</div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Receive notification within the website.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                  <input
                    type="checkbox"
                    checked={inAppNotification}
                    onChange={(e) => setInAppNotification(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#DE0808]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 3.3 Log Out Button (Prominent Red Button) */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#DE0808] hover:bg-[#C20707] active:scale-[0.98] text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer tracking-wider"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

