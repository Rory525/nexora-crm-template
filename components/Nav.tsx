"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_LINKS = [
  { href: "/", label: "Leads" },
  { href: "/contacts", label: "Contacts" },
  { href: "/projects", label: "Projects" },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Nav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-slate-900">Nexora CRM</span>
          <div className="flex gap-4">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/" || pathname.startsWith("/leads")
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium ${
                    isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}