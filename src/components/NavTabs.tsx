"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavTabs() {
  const pathname = usePathname();

  const tab = (href: string, label: string) => {
    const isActive = pathname === href;
    return (
      <Link href={href} className={`tab-btn${isActive ? " active" : ""}`}>
        {label}
      </Link>
    );
  };

  return (
    <nav className="nav-tabs">
      <div className="container tab-buttons">
        {tab("/", "Ask Umbil")}
        {tab("/cpd", "My CPD")}
        {tab("/pdp", "PDP")}
        {tab("/settings", "Settings")}
      </div>
    </nav>
  );
}
