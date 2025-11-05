import { Suspense } from "react";

import { ImportContent } from "./import-content";

export default function ImportPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">データインポート</h1>
        <p className="text-muted-foreground">
          以前にエクスポートしたJSONバックアップからデータを復元します。
        </p>
      </div>

      <Suspense fallback={<div>読み込み中...</div>}>
        <ImportContent />
      </Suspense>
    </div>
  );
}
