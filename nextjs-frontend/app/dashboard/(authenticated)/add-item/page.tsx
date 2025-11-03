"use client";

import { useActionState } from "react";

import { addItem } from "@/components/actions/items-action";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submitButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState = { message: "" };

export default function CreateItemPage() {
  const [state, dispatch] = useActionState(addItem, initialState);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">アイテムを登録</h1>
        <p className="text-muted-foreground">
          御朱印やスポット管理に利用するアイテム情報を入力してください。
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
          <CardDescription>
            名称・説明・数量を入力し、送信するとダッシュボードへリダイレクトします。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="例：御朱印帳"
                required
              />
              {state.errors?.name && (
                <p className="text-sm text-destructive">{state.errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Input
                id="description"
                name="description"
                type="text"
                placeholder="使い方や特徴を入力"
                required
              />
              {state.errors?.description && (
                <p className="text-sm text-destructive">
                  {state.errors.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">数量</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                placeholder="1"
                min={0}
                required
              />
              {state.errors?.quantity && (
                <p className="text-sm text-destructive">{state.errors.quantity}</p>
              )}
            </div>

            <SubmitButton text="登録する" />

            {state?.message && (
              <div className="text-sm text-destructive">{state.message}</div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
