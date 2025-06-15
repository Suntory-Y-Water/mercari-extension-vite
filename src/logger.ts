enum LogLevel {
  INFO = 'INFO',
  ERROR = 'ERROR',
}

export class LoggingService {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  log(functionName: string, ...messages: any[]): void {
    this.printLog(LogLevel.INFO, functionName, this.stringifyMessages(messages));
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  error(functionName: string, ...messages: any[]): void {
    this.printLog(LogLevel.ERROR, functionName, this.stringifyMessages(messages));
  }

  private printLog(level: LogLevel, functionName: string, message: string): void {
    const timestamp = new Date().toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
    });
    const formattedMessage = this.formatLog(level, timestamp, functionName, message);
    console.log(formattedMessage);
  }

  private formatLog(level: LogLevel, timestamp: string, functionName: string, message: string): string {
    return `${timestamp}, ${level}, ${functionName}, ${message}`;
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private stringifyMessages(messages: any[]): string {
    return messages
      .map((message) => {
        if (typeof message === 'object' && message !== null) {
          return JSON.stringify(message, null, 2);
        }
        return String(message);
      })
      .join(' ');
  }
}

export const logger = new LoggingService();
