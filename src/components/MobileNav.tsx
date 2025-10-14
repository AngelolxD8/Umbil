"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserEmail } from "@/hooks/useUser";

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { email } = useUserEmail();

  const tab = (href: string, label: string) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`block px-4 py-2 rounded-lg transition-colors duration-200 ${
          isActive ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:bg-gray-100"
        }`}
        onClick={onClose}
      >
        {label}
      </Link>
    );
  };

  const menuItems = [
    { href: "/", label: "Ask Umbil" },
    { href: "/cpd", label: "My CPD", requiresAuth: true },
    { href: "/pdp", label: "PDP", requiresAuth: true },
    { href: "/settings", label: "Settings" },
  ];

  const filteredMenuItems = menuItems.filter(item => !item.requiresAuth || email);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="fixed top-0 left-0 w-64 h-full bg-white shadow-lg p-4 transform transition-transform duration-200 ease-in-out"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <div className="flex items-center justify-between mb-4">
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

        <nav className="flex flex-col space-y-2">
          {filteredMenuItems.map((item) => tab(item.href, item.label))}
        </nav>
      </div>
    </div>
  );
}