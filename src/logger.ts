enum LogLevel {
  INFO = "INFO",
  ERROR = "ERROR",
}

export class LoggingService {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  log(...messages: any[]): void {
    this.printLog(LogLevel.INFO, this.stringifyMessages(messages));
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  error(...messages: any[]): void {
    this.printLog(LogLevel.ERROR, this.stringifyMessages(messages));
  }

  private printLog(level: LogLevel, message: string): void {
    const timestamp = new Date().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
    });
    const formattedMessage = this.formatLog(level, timestamp, message);
    console.log(formattedMessage);
  }

  private formatLog(
    level: LogLevel,
    timestamp: string,

    message: string
  ): string {
    return `${timestamp} ${level} ${message}`;
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private stringifyMessages(messages: any[]): string {
    return messages
      .map((message) => {
        if (typeof message === "object" && message !== null) {
          return JSON.stringify(message, null, 2);
        }
        return String(message);
      })
      .join(" ");
  }
}

export const logger = new LoggingService();
