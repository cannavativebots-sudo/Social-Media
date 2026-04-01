"use client";

import clsx from "clsx";
import { Instagram, Facebook, Twitter, Globe, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { PlatformConnection } from "digital-office-shared";

const ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-5 h-5" />,
  facebook:  <Facebook className="w-5 h-5" />,
  x:         <Twitter className="w-5 h-5" />,
  website:   <Globe className="w-5 h-5" />,
};

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  facebook:  "Facebook",
  x:         "X / Twitter",
  website:   "Website",
};

export function PlatformStatus({ platform }: { platform: PlatformConnection }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={clsx("p-1.5 rounded", platform.is_connected ? "text-white bg-indigo-600" : "text-gray-600 bg-gray-800")}>
            {ICONS[platform.platform]}
          </span>
          <div>
            <p className="text-sm font-semibold text-white">{PLATFORM_LABEL[platform.platform]}</p>
            {platform.account_name && (
              <p className="text-xs text-gray-500">{platform.account_name}</p>
            )}
          </div>
        </div>

        {platform.is_connected ? (
          <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Connected
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <XCircle className="w-4 h-4" /> Not connected
          </span>
        )}
      </div>

      {platform.error_message && (
        <p className="text-xs text-yellow-400 bg-yellow-500/10 rounded p-2">{platform.error_message}</p>
      )}

      {platform.last_checked && (
        <p className="flex items-center gap-1 text-xs text-gray-600">
          <Clock className="w-3 h-3" />
          Checked {new Date(platform.last_checked).toLocaleString()}
        </p>
      )}
    </div>
  );
}
