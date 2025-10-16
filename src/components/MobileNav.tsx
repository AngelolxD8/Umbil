"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUserEmail } from "@/hooks/useUser";

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { email } = useUserEmail();

  const handleNewChat = () => {
    onClose();
    router.push("/?new-chat=true"); // Use router.push to navigate without reloading
  };

  const menuItems = [
    { href: "/cpd", label: "My CPD", requiresAuth: true },
    { href: "/pdp", label: "My PDP", requiresAuth: true },
    { href: "/profile", label: "My Profile", requiresAuth: true },
    { href: "/settings", label: "Settings" },
  ];

  const filteredMenuItems = menuItems.filter(item => !item.requiresAuth || email);

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <div className={`sidebar ${isOpen ? "is-open" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="sidebar-header">
          <h3 className="text-lg font-semibold">Navigation</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <button className="new-chat-button" onClick={handleNewChat}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
          New Chat
        </button>

        <nav className="sidebar-nav">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "active" : ""}
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}