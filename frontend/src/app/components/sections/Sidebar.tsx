"use client";

import Link from "next/link";
import type { IconType } from "react-icons";
import {
  IoIosCash,
  IoIosHome,
  IoIosList,
  IoIosLogIn,
  IoIosNavigate,
  IoIosPerson,
  IoIosSettings,
} from "react-icons/io";

type NavLink = { title: string; href: string; icon: IconType };

// Climbs, Account and Settings do not have pages yet, so these links show a 404 for now
const NAV_LINKS: NavLink[] = [
  { title: "Home", href: "/home", icon: IoIosHome },
  { title: "Bills & Budget", href: "/bills_budget", icon: IoIosCash },
  { title: "Tasks", href: "/tasks", icon: IoIosList },
  { title: "Climbs", href: "/climbs", icon: IoIosNavigate },
  { title: "Account", href: "/account", icon: IoIosPerson },
  { title: "Settings", href: "/settings", icon: IoIosSettings },
];

const ITEM_CLASS = "flex items-center gap-2 hover:text-gray-500";

type SidebarProps = {
  onLogin: () => void;
};

export const Sidebar = ({ onLogin }: SidebarProps) => (
  <nav className="bg-gray-900 text-white flex w-64 h-screen p-4">
    <div className="container mx-auto flex flex-col items-center gap-6">
      <div className="text-xl font-bold text-center">LIFE DASHBOARD</div>
      <ul className="flex flex-col space-y-4 items-center justify-start w-full">
        {NAV_LINKS.map(({ title, href, icon: Icon }) => (
          <li key={title}>
            <Link href={href} className={ITEM_CLASS}>
              <Icon className="text-lg" />
              <span>{title}</span>
            </Link>
          </li>
        ))}
        {/* Login is a button, not a page: it shows the login form in place of the current page */}
        <li>
          <button type="button" onClick={onLogin} className={ITEM_CLASS}>
            <IoIosLogIn className="text-lg" />
            <span>Login</span>
          </button>
        </li>
      </ul>
    </div>
  </nav>
);
