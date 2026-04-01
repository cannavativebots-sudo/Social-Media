"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LayoutDashboard, Bot, InboxIcon, ScrollText, Radio, Wifi, WifiOff, Loader2 } from "lucide-react";
import type { WsStatus } from "@/hooks/useWebSocket";

const NAV = [
  { href: "/",          label: "Overview",  Icon: LayoutDashboard },
  { href: "/bots",      label: "Bots",      Icon: Bot },
  { href: "/queue",     label: "Queue",     Icon: InboxIcon },
  { href: "/logs",      label: "Logs",      Icon: ScrollText },
  { href: "/platforms", label: "Platforms", Icon: Radio },
];

function WsIndicator({ status }: { status: WsStatus }) {
  if (status === "connected")
    return <span className="flex items-center gap-1 text-green-400"><Wifi className="w-3 h-3" /> live</span>;
  if (status === "connecting")
    return <span className="flex items-center gap-1 text-yellow-400"><Loader2 className="w-3 h-3 animate-spin" /> connecting</span>;
  return <span className="flex items-center gap-1 text-red-400"><WifiOff className="w-3 h-3" /> offline</span>;
}

export function Sidebar({ wsStatus }: { wsStatus: WsStatus }) {
  const path = usePathname();

  return (
    <aside className="w-52 shrink-0 flex flex-col border-r border-surface-border bg-surface-card min-h-screen">
      <div className="px-4 py-5 border-b border-surface-border">
        <p className="text-sm font-bold text-white tracking-tight">Digital Office</p>
        <div className="mt-1 text-xs">
          <WsIndicator status={wsStatus} />
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-surface"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
