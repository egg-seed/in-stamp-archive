import { Suspense } from "react";

import { ExportContent } from "./export-content";

export default function ExportPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">データエクスポート</h1>
        <p className="text-muted-foreground">
          御朱印記録とスポット情報をバックアップまたは分析用にエクスポートします。
        </p>
      </div>

      <Suspense fallback={<div>読み込み中...</div>}>
        <ExportContent />
      </Suspense>
    </div>
  );
}
