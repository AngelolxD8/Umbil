"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  isDarkMode: boolean; // <-- Added
  toggleDarkMode: () => void; // <-- Added
};

export default function MobileNav({ isOpen, onClose, userEmail, isDarkMode, toggleDarkMode }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNewChat = () => {
    onClose();
    // Use a unique key to force a state reset on the home page
    router.push(`/?new-chat=${Date.now()}`);
  };

  const menuItems = [
    { href: "/about", label: "About Umbil" },
    { href: "/cpd", label: "My CPD", requiresAuth: true },
    { href: "/pdp", label: "My PDP", requiresAuth: true },
    { href: "/profile", label: "My Profile", requiresAuth: true },
    { href: "/settings", label: "Settings" },
    { href: "/settings/feedback", label: "Send Feedback" },
  ];

  const filteredMenuItems = menuItems.filter(item => !item.requiresAuth || userEmail);

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
        
        {/* --- Dark Mode Toggle --- */}
        <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '1px solid var(--umbil-divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>
              {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </span>
            <label className="switch">
              <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
              <span className="slider round"></span>
            </label>
        </div>
        {/* --- End Dark Mode Toggle --- */}
      </div>
      
      {/* --- Add CSS for the Toggle Switch (Embedded for simplicity) --- */}
      <style jsx global>{`
        /* The switch - the box around the slider */
        .switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 24px;
        }

        /* Hide default HTML checkbox */
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        /* The slider */
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--umbil-card-border);
          transition: 0.4s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: var(--umbil-surface);
          transition: 0.4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: var(--umbil-brand-teal);
        }

        input:checked + .slider:before {
          transform: translateX(16px);
        }
        
        /* Dark mode specific slider color */
        .dark .slider {
             background-color: var(--umbil-divider);
        }

        .dark .slider:before {
             background-color: var(--umbil-hover-bg);
        }
      `}</style>
    </>
  );
}