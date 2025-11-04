/**
 * アプリケーション全体で使用する統一されたロガーユーティリティ
 *
 * 本番環境では外部ロギングサービス（Sentry等）への統合が可能
 * 開発環境ではconsoleへの出力を行う
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  /**
   * 情報レベルのログを記録
   */
  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  /**
   * 警告レベルのログを記録
   */
  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  /**
   * エラーレベルのログを記録
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };

    this.log("error", message, errorContext);

    // 本番環境では外部サービスへの送信を実装
    // if (!this.isDevelopment && typeof window !== "undefined") {
    //   // Sentry.captureException(error, { extra: errorContext });
    // }
  }

  /**
   * デバッグレベルのログを記録（開発環境のみ）
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log("debug", message, context);
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.isDevelopment && level === "debug") {
      return;
    }

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (this.isDevelopment) {
      // 開発環境ではconsoleに出力
      switch (level) {
        case "error":
          // eslint-disable-next-line no-console
          console.error(logMessage, context);
          break;
        case "warn":
          // eslint-disable-next-line no-console
          console.warn(logMessage, context);
          break;
        case "info":
          // eslint-disable-next-line no-console
          console.info(logMessage, context);
          break;
        case "debug":
          // eslint-disable-next-line no-console
          console.debug(logMessage, context);
          break;
      }
    } else {
      // 本番環境では構造化ログを出力（将来的な外部サービス統合用）
      const structuredLog = {
        timestamp,
        level,
        message,
        context,
      };

      // eslint-disable-next-line no-console
      console.log(JSON.stringify(structuredLog));
    }
  }
}

export const logger = new Logger();
