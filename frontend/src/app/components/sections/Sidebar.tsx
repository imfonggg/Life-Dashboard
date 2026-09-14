
"use client";

import {
  IoIosHome,
  IoIosCash,
  IoIosList,
  IoIosNavigate,
  IoIosPerson,
  IoIosSettings,
} from "react-icons/io";

export const Sidebar = () => {
    const menuItems = [
        { title: "Home", href: "/", icon: IoIosHome },
        { title: "Bills & Budget", href: "/bills_budget", icon: IoIosCash },
        { title: "Tasks", href: "/tasks", icon: IoIosList },
        { title: "Climbs", href: "/climbs", icon: IoIosNavigate },
        { title: "Account", href: "/account", icon: IoIosPerson },
        { title: "Settings", href: "/settings", icon: IoIosSettings },
    ];
    return (
      <nav className="bg-gray-900 text-white flex w-64 h-screen p-4">
        <div className="container mx-auto flex flex-col items-center gap-6">
          <div className="text-xl font-bold text-center">LIFE DASHBOARD</div>
          <ul className="flex flex-col space-y-4 items-center justify-start w-full">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title}>
                  <a href={item.href} className="flex items-center gap-2 hover:text-gray-500">
                    <Icon className="text-lg" />
                    <span>{item.title}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    );
};