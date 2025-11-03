"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const filterSchema = z.object({
  spotType: z.string().optional(),
  city: z
    .string()
    .max(120, { message: "120 文字以内で入力してください" })
    .optional(),
  keyword: z
    .string()
    .max(120, { message: "120 文字以内で入力してください" })
    .optional(),
});

export type PrefectureFilterValues = z.infer<typeof filterSchema>;

export type PrefectureFiltersProps = {
  className?: string;
  initialValues?: PrefectureFilterValues;
};

const SPOT_TYPE_OPTIONS = [
  { value: "", label: "すべて" },
  { value: "shrine", label: "神社" },
  { value: "temple", label: "寺院" },
  { value: "museum", label: "博物館" },
  { value: "other", label: "その他" },
];

export function PrefectureFilters({ className, initialValues }: PrefectureFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const form = useForm<PrefectureFilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      spotType: initialValues?.spotType ?? "",
      city: initialValues?.city ?? "",
      keyword: initialValues?.keyword ?? "",
    },
    mode: "onSubmit",
  });

  const submitFilters = (values: PrefectureFilterValues) => {
    const params = new URLSearchParams(searchParams);

    params.delete("page");

    if (values.spotType) {
      params.set("spotType", values.spotType);
    } else {
      params.delete("spotType");
    }

    if (values.city) {
      params.set("city", values.city.trim());
    } else {
      params.delete("city");
    }

    if (values.keyword) {
      params.set("keyword", values.keyword.trim());
    } else {
      params.delete("keyword");
    }

    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };

  const handleReset = () => {
    form.reset({ spotType: "", city: "", keyword: "" });
    const params = new URLSearchParams(searchParams);
    params.delete("spotType");
    params.delete("city");
    params.delete("keyword");
    params.delete("page");
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <Form {...form}>
      <form
        className={cn(
          "grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-4 lg:items-end",
          className,
        )}
        onSubmit={form.handleSubmit(submitFilters)}
      >
        <FormField
          control={form.control}
          name="spotType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>カテゴリ</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value || "")}
                value={field.value ?? ""}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SPOT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>市区町村</FormLabel>
              <FormControl>
                <Input placeholder="例: 京都市" disabled={isPending} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="keyword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>キーワード</FormLabel>
              <FormControl>
                <Input placeholder="スポット名やメモ" disabled={isPending} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-2">
          <Button type="submit" className="w-full" disabled={isPending}>
            検索
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} disabled={isPending}>
            クリア
          </Button>
        </div>
      </form>
    </Form>
  );
}
