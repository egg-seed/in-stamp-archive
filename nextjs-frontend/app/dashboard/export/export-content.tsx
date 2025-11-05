"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
  filename: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: "json",
    title: "完全バックアップ (JSON)",
    description:
      "すべてのスポット、御朱印記録、画像URLを含む完全なデータエクスポート。復元に使用できます。",
    icon: <FileJson className="h-8 w-8" />,
    endpoint: "/api/export/json",
    filename: "goshuin-backup.json",
  },
  {
    id: "csv",
    title: "御朱印記録 (CSV)",
    description:
      "御朱印記録をCSV形式でエクスポート。スプレッドシートで分析できます。",
    icon: <FileSpreadsheet className="h-8 w-8" />,
    endpoint: "/api/export/csv",
    filename: "goshuin-records.csv",
  },
];

export function ExportContent() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExport = async (option: ExportOption) => {
    setLoadingId(option.id);

    try {
      const response = await fetch(option.endpoint, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`エクスポートに失敗しました: ${response.statusText}`);
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Use filename from Content-Disposition header if available
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = option.filename;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "エクスポート完了",
        description: `${option.title}のダウンロードが完了しました。`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "エクスポート失敗",
        description:
          error instanceof Error ? error.message : "エクスポート中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {EXPORT_OPTIONS.map((option) => (
        <Card key={option.id} className="flex flex-col">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle>{option.title}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </div>
              <div className="text-primary">{option.icon}</div>
            </div>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button
              onClick={() => handleExport(option)}
              disabled={loadingId !== null}
              className="w-full"
            >
              {loadingId === option.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  エクスポート中...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  ダウンロード
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>エクスポートに関する注意事項</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>JSONバックアップ:</strong>{" "}
              完全なデータ復元が可能です。定期的にバックアップを取ることをお勧めします。
            </p>
            <p>
              <strong>CSV形式:</strong>{" "}
              Excel、Google
              Sheetsなどのスプレッドシートアプリケーションで開くことができます。
            </p>
            <p>
              <strong>画像データ:</strong>{" "}
              エクスポートには画像のURLが含まれますが、画像ファイル自体は含まれません。
            </p>
            <p>
              <strong>プライバシー:</strong>{" "}
              エクスポートしたファイルには個人情報が含まれています。取り扱いには注意してください。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
