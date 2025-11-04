/**
 * アプリケーション全体で使用する統一されたエラーハンドリングユーティリティ
 *
 * エラーの種類を分類し、適切なユーザーメッセージを提供します
 */

import { logger } from "./logger";

/**
 * アプリケーションエラーの基底クラス
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 認証エラー（401）
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "認証に失敗しました。ログインし直してください。") {
    super(message, "AUTHENTICATION_ERROR", 401);
  }
}

/**
 * 認可エラー（403）
 */
export class AuthorizationError extends AppError {
  constructor(message: string = "この操作を実行する権限がありません。") {
    super(message, "AUTHORIZATION_ERROR", 403);
  }
}

/**
 * リソース未検出エラー（404）
 */
export class NotFoundError extends AppError {
  constructor(message: string = "指定されたリソースが見つかりませんでした。") {
    super(message, "NOT_FOUND_ERROR", 404);
  }
}

/**
 * バリデーションエラー（400）
 */
export class ValidationError extends AppError {
  constructor(
    message: string = "入力内容に誤りがあります。",
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

/**
 * 外部サービスエラー（502）
 */
export class ExternalServiceError extends AppError {
  constructor(
    message: string = "外部サービスとの通信に失敗しました。",
    public readonly serviceName?: string,
  ) {
    super(message, "EXTERNAL_SERVICE_ERROR", 502);
  }
}

/**
 * 一般的なサーバーエラー（500）
 */
export class InternalServerError extends AppError {
  constructor(message: string = "予期しないエラーが発生しました。しばらくしてからお試しください。") {
    super(message, "INTERNAL_SERVER_ERROR", 500);
  }
}

/**
 * エラーをユーザーフレンドリーなメッセージに変換
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // 開発環境では詳細なエラーメッセージを表示
    if (process.env.NODE_ENV === "development") {
      return error.message;
    }
  }

  return "予期しないエラーが発生しました。しばらくしてからお試しください。";
}

/**
 * エラーをログに記録
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  if (error instanceof AppError) {
    // 運用上のエラー（予期されたエラー）は警告レベル
    if (error.isOperational) {
      logger.warn(error.message, {
        code: error.code,
        statusCode: error.statusCode,
        ...context,
      });
    } else {
      // 予期しないエラーはエラーレベル
      logger.error(error.message, error, {
        code: error.code,
        statusCode: error.statusCode,
        ...context,
      });
    }
  } else if (error instanceof Error) {
    logger.error(error.message, error, context);
  } else {
    logger.error("Unknown error", error, context);
  }
}

/**
 * サーバーアクションでのエラーハンドリングヘルパー
 */
export function handleServerActionError(
  error: unknown,
  context?: Record<string, unknown>,
): { server_error: string } {
  logError(error, context);
  return {
    server_error: getUserFriendlyErrorMessage(error),
  };
}
