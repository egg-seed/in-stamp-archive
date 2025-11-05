"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Download,
  Landmark,
  LayoutDashboard,
  Map,
  Settings2,
  Stamp,
  Upload,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping to avoid passing functions from Server to Client Components
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Map,
  Landmark,
  Stamp,
  Download,
  Upload,
  Settings2,
};

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: string; // Changed from LucideIcon to string
  description?: string;
};

interface SidebarNavProps {
  items: SidebarNavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((item) => {
        const Icon = ICON_MAP[item.icon];
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {Icon && <Icon className="h-4 w-4" aria-hidden />}
            <div className="flex flex-1 flex-col">
              <span className="font-medium">{item.label}</span>
              {item.description ? (
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
              ) : null}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
