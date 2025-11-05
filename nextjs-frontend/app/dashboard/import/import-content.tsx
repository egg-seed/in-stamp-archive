"use client";

import { useState, useRef } from "react";
import { Upload, FileJson, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  spots: number;
  goshuin_records: number;
  spot_images: number;
  goshuin_images: number;
}

export function ImportContent() {
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".json")) {
      setError("JSONファイルのみインポートできます。");
      return;
    }

    setIsUploading(true);
    setError(null);
    setImportResult(null);

    try {
      // Read file content
      const fileContent = await file.text();
      const jsonData = JSON.parse(fileContent);

      // Send to import API
      const response = await fetch("/api/export/json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(jsonData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `インポートに失敗しました: ${response.statusText}`);
      }

      const result: ImportResult = await response.json();
      setImportResult(result);

      toast({
        title: "インポート完了",
        description: "データのインポートが正常に完了しました。",
      });
    } catch (error) {
      console.error("Import error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "インポート中にエラーが発生しました。";
      setError(errorMessage);
      toast({
        title: "インポート失敗",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle>JSONバックアップをインポート</CardTitle>
              <CardDescription>
                以前にエクスポートしたJSONファイルを選択してデータを復元します
              </CardDescription>
            </div>
            <FileJson className="h-8 w-8 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button onClick={handleButtonClick} disabled={isUploading} className="w-full" size="lg">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                インポート中...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                ファイルを選択
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {importResult && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>インポート成功</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1 text-sm">
                  <p>スポット: {importResult.spots}件</p>
                  <p>御朱印記録: {importResult.goshuin_records}件</p>
                  <p>スポット画像: {importResult.spot_images}件</p>
                  <p>御朱印画像: {importResult.goshuin_images}件</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>インポートに関する注意事項</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>重要な警告</AlertTitle>
            <AlertDescription>
              インポートは既存のデータを上書きまたは統合します。誤ったファイルをインポートすると、データが失われる可能性があります。
            </AlertDescription>
          </Alert>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>対応形式:</strong>{" "}
              このアプリでエクスポートしたJSONバックアップファイルのみサポートしています。
            </p>
            <p>
              <strong>データの統合:</strong>{" "}
              同じIDのデータが存在する場合、インポートされたデータで上書きされます。
            </p>
            <p>
              <strong>画像について:</strong>{" "}
              画像URLがインポートされますが、画像ファイル自体は含まれません。元のストレージに画像が存在する必要があります。
            </p>
            <p>
              <strong>バックアップ推奨:</strong>{" "}
              インポート前に現在のデータをエクスポートしてバックアップを取ることを強くお勧めします。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
