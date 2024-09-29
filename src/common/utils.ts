import { logger } from "../logger";
import type { MessageActionsId, MessageResponse } from "../types";

async function tabsSendMessage(tabId: number, message: MessageActionsId) {
  try {
    logger.log(
      `tabにメッセージを送信します。 tabId: ${tabId}, message:`,
      message
    );
    await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`メッセージの送信に失敗しました : ${error.message}`);
      throw new Error(error.message);
    }
  }
}

async function runtimeSendMessage(
  message: MessageActionsId
): Promise<MessageResponse> {
  try {
    logger.log("runtimeメッセージを送信します。 message:", message);
    await chrome.runtime.sendMessage(message);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`メッセージの送信に失敗しました : ${error.message}`);
      throw new Error(error.message);
    }
    return { success: false };
  }
}

export async function sendContentScriptMessage(
  tabId: number,
  message: MessageActionsId
): Promise<void> {
  return await tabsSendMessage(tabId, {
    action: message.action,
  });
}

export async function sendBackgroundMessage(
  message: MessageActionsId
): Promise<MessageResponse> {
  return await runtimeSendMessage({
    action: message.action,
  });
}

export async function getActiveTab(): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || tabs[0].id === undefined) {
        reject(new Error("タブが見つかりません。"));
      } else {
        logger.log(`タブが見つかりました ID: ${tabs[0].id}`);
        resolve(tabs[0].id);
      }
    });
  });
}

export async function getSearchTab(
  searchUrl: string
): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ url: searchUrl }, (tabs) => {
      if (tabs.length === 0 || tabs[0].id === undefined) {
        reject(new Error(`指定したページURLはありません : ${searchUrl}`));
      } else {
        logger.log(`指定したURLのタブが見つかりました : ${tabs[0].id}`);
        resolve(tabs[0].id);
      }
    });
  });
}

/**
 * @description タブが閉じられるまで待機する。正常終了した場合はresolveする。エラー時はrejectする。
 */
export async function waitForTabClose(tabId: number): Promise<void> {
  return new Promise<void>((resolve) => {
    const listener = (removedTabId: number) => {
      if (removedTabId === tabId) {
        chrome.tabs.onRemoved.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onRemoved.addListener(listener);
  });
}
