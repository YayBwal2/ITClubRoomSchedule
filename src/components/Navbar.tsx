"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, BookmarkCheck, Shield, Building2 } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Schedule Calendar", icon: Calendar },
    { href: "/bookings", label: "My Bookings", icon: BookmarkCheck },
    { href: "/admin", label: "Admin Portal", icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">CFSS</span>
            <span className="text-xs text-slate-500 block leading-none">Strategy First</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Button */}
        <div>
          <Link
            href="/bookings"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
          >
            + Request Room
          </Link>
        </div>
      </div>
    </header>
  );
}
