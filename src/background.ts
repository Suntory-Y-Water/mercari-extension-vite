import { logger } from "./logger";
import type { MessageActionsId, MessageResponse } from "./types";
import { getSearchTab, sendContentScriptMessage } from "./common/utils";

chrome.runtime.onMessage.addListener(
  async (
    request: MessageActionsId,
    _sender,
    sendResponse: (response?: MessageResponse) => void
  ) => {
    if (request.action === "OPTIONS_PAGE_LOADED") {
      logger.log(
        "バックグラウンドでOPTIONS_PAGE_LOADEDメッセージを受信しました。"
      );
      logger.log("content_scriptに商品取得メッセージを送信します。");
      const tabId = await getSearchTab(
        "https://jp.mercari.com/mypage/listings*"
      );
      if (tabId === undefined) {
        throw new Error("タブIDが取得できませんでした");
      }
      sendContentScriptMessage(tabId, { action: "OPTIONS_PAGE_LOADED" });
      logger.log("content_scriptに商品取得メッセージを送信終了");
      sendResponse({ success: true });
      return true;
    }

    if (request.action === "RELISTING_START") {
      logger.log("バックグラウンドでRELISTING_STARTメッセージを受信しました。");
      logger.log("content_scriptに再出品開始メッセージを送信します。");
      const tabId = await getSearchTab(
        "https://jp.mercari.com/mypage/listings*"
      );
      if (tabId === undefined) {
        throw new Error("タブIDが取得できませんでした");
      }
      sendContentScriptMessage(tabId, { action: "RELISTING_START" });
      logger.log("content_scriptに再出品開始メッセージを送信終了");
      sendResponse({ success: true });
      return true;
    }
    return true;
  }
);
