"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Calendar, BookOpen, ShieldCheck, User } from "lucide-react";
import { UserRole } from "@/types/database";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>("coordinator");
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Sync role and avatar from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cfss_current_role") as UserRole;
    if (saved === "coordinator" || saved === "admin" || saved === "sse") {
      setCurrentRole(saved);
    }
    const savedAvatar = localStorage.getItem("cfss_user_avatar");
    if (savedAvatar) {
      setAvatarPreview(savedAvatar);
    }
  }, [pathname]);

  // Hide navbar on login page
  if (pathname === "/login") {
    return null;
  }

  // Home link based on logged-in role
  const homeHref =
    currentRole === "admin"
      ? "/admin"
      : currentRole === "sse"
      ? "/schedule"
      : "/bookings";

  // Navigation Links based on logged-in portal role:
  // - Coordinator: Bookings, Room Schedule
  // - Admin: Admin Portal, Bookings, Room Schedule
  // - SSE: Room Schedule
  const navItems: NavItem[] =
    currentRole === "admin"
      ? [
          { label: "Admin Portal", href: "/admin", icon: ShieldCheck },
          { label: "Bookings", href: "/bookings", icon: BookOpen },
          { label: "Room Schedule", href: "/schedule", icon: Calendar },
        ]
      : currentRole === "sse"
      ? [
          { label: "Room Schedule", href: "/schedule", icon: Calendar },
        ]
      : [
          { label: "Bookings", href: "/bookings", icon: BookOpen },
          { label: "Room Schedule", href: "/schedule", icon: Calendar },
        ];

  const roleDisplay =
    currentRole === "admin"
      ? "Admin"
      : currentRole === "sse"
      ? "SSE"
      : "Coordinator";

  const isCurrentActive = (href: string) => pathname === href;

  const handleNewBookingClick = (e: React.MouseEvent) => {
    if (pathname === "/bookings") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("openBookingModal"));
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-20 items-center justify-between">
        {/* Left: Strategy First Horizontal Brand Logo (links to user's home portal) */}
        <Link href={homeHref} className="flex items-center shrink-0">
          <Image
            src="/sfic-horizontal-logo.png"
            alt="Strategy First International College"
            width={240}
            height={54}
            priority
            className="h-9 sm:h-11 w-auto object-contain select-none"
          />
        </Link>

        {/* Center: Dynamic Navigation Links based on logged-in portal role */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = isCurrentActive(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`px-5 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${
                  isActive
                    ? "bg-[#DE0808] text-white shadow-sm hover:bg-[#C20707]"
                    : "text-slate-700 hover:text-[#DE0808] hover:bg-slate-50"
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: + New Booking Button & Profile Avatar Link */}
        <div className="hidden md:flex items-center gap-3">
          {currentRole !== "sse" && (
            <Link
              href="/bookings?openModal=true"
              onClick={handleNewBookingClick}
              className="px-4 py-2 text-xs font-black text-white bg-[#DE0808] hover:bg-[#C20707] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>+ New Booking</span>
            </Link>
          )}

          {/* User Profile Avatar Link */}
          <Link
            href="/profile"
            className={`flex items-center gap-2 p-1.5 rounded-2xl border transition-all hover:bg-slate-50 ${
              pathname === "/profile"
                ? "border-[#DE0808] ring-2 ring-[#DE0808]/20 bg-red-50/30"
                : "border-slate-200"
            }`}
            title="My Profile & Settings"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-sky-50 border border-slate-200 flex items-center justify-center shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-[#DE0808]" />
              )}
            </div>
            <div className="pr-2 text-left">
              <div className="text-[11px] font-black text-slate-900 leading-tight">
                {roleDisplay}
              </div>
              <div className="text-[9px] font-bold text-slate-400 leading-tight">Profile</div>
            </div>
          </Link>
        </div>

        {/* Mobile Hamburger Button & Avatar */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full overflow-hidden bg-sky-50 border border-slate-200 flex items-center justify-center"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-[#DE0808]" />
            )}
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-slate-700 hover:text-black hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-[#DE0808]" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-150 shadow-md">
          {navItems.map((item) => {
            const isActive = isCurrentActive(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-black transition-all ${
                  isActive
                    ? "bg-[#DE0808] text-white"
                    : "text-slate-800 hover:bg-slate-50 hover:text-[#DE0808]"
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-2.5 px-4 text-center text-xs font-black text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl block"
            >
              My Profile & Settings
            </Link>
            {currentRole !== "sse" && (
              <Link
                href="/bookings?openModal=true"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  handleNewBookingClick(e);
                }}
                className="w-full py-2.5 px-4 text-center text-xs font-black text-white bg-[#DE0808] hover:bg-[#C20707] rounded-xl shadow-xs block cursor-pointer"
              >
                + New Booking
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
