import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import type { ItemRead, Page_ItemRead_ } from "@/src/lib/api/generated/types.gen";
import { fetchItems } from "@/components/actions/items-action";
import { PagePagination } from "@/components/page-pagination";
import { PageSizeSelector } from "@/components/page-size-selector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DeleteButton } from "./_components/delete-button";

interface DashboardPageProps {
  searchParams: Promise<{
    page?: string;
    size?: string;
  }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const size = Number(params.size) || 10;

  const items = (await fetchItems(page, size)) as Page_ItemRead_;
  const totalPages = Math.ceil((items.total || 0) / size);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">ようこそ</h1>
        <p className="text-muted-foreground">
          御朱印記録やスポット管理の最新状況を確認できます。
        </p>
        <div>
          <Button asChild>
            <Link href="/dashboard/add-item">新しいアイテムを追加</Link>
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>登録済みアイテム</CardTitle>
            <CardDescription>
              API から取得したアイテム一覧です。ページサイズを切り替えて詳細を確認できます。
            </CardDescription>
          </div>
          <PageSizeSelector currentSize={size} />
        </CardHeader>
        <CardContent className="space-y-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">名称</TableHead>
                <TableHead>説明</TableHead>
                <TableHead className="text-center">数量</TableHead>
                <TableHead className="w-[80px] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!items.items?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    表示できるデータがありません。
                  </TableCell>
                </TableRow>
              ) : (
                items.items.map((item: ItemRead) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <span className="sr-only">操作</span>
                            <MoreHorizontal className="h-4 w-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled>編集</DropdownMenuItem>
                          <DeleteButton itemId={item.id} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <PagePagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={size}
            totalItems={items.total || 0}
            basePath="/dashboard"
          />
        </CardContent>
      </Card>
    </div>
  );
}
