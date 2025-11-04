import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Landmark,
  LayoutDashboard,
  Map,
  Settings2,
  Stamp,
} from "lucide-react";

import { currentUser } from "@/src/lib/api/generated/sdk.gen";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarNav } from "./_components/sidebar-nav";
import { DashboardBreadcrumbs } from "./_components/dashboard-breadcrumbs";
import { UserMenu } from "./_components/user-menu";

const NAVIGATION_ITEMS = [
  {
    href: "/dashboard",
    label: "ダッシュボード",
    icon: LayoutDashboard,
    description: "記録の概要",
  },
  {
    href: "/dashboard/prefectures",
    label: "都道府県ナビ",
    icon: Map,
    description: "地図とリストで巡る",
  },
  {
    href: "/dashboard/spots",
    label: "スポット管理",
    icon: Landmark,
    description: "寺社・城郭の管理",
  },
  {
    href: "/dashboard/goshuin",
    label: "御朱印記録",
    icon: Stamp,
    description: "参拝記録とアルバム",
  },
  {
    href: "/dashboard/settings",
    label: "設定",
    icon: Settings2,
    description: "プロフィールと表示設定",
  },
] as const;

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    redirect("/login");
  }

  const { data: user, error } = await currentUser({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error) {
    redirect("/login");
  }

  const email = user?.email;
  const userInitial = email?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden border-r bg-background/80 backdrop-blur lg:flex lg:w-72">
        <div className="flex h-full w-full flex-col gap-8 p-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold text-foreground"
          >
            <Stamp className="h-5 w-5" aria-hidden />
            <span>御朱印めぐり帳</span>
          </Link>
          <SidebarNav items={[...NAVIGATION_ITEMS]} />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b bg-background/70 px-4 py-4 backdrop-blur lg:px-8">
          <DashboardBreadcrumbs />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu email={email} initial={userInitial} />
          </div>
        </header>
        <div className="flex flex-1 flex-col lg:flex-row">
          <aside className="border-b bg-background/80 p-4 shadow-sm lg:hidden">
            <SidebarNav items={[...NAVIGATION_ITEMS]} />
          </aside>
          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-6xl space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
