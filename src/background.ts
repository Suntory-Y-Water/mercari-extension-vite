import { logger } from "./logger";
import type { MessageActionsId, MessageResponse, ReListingItem } from "./types";
import {
  getSearchTab,
  sendContentScriptMessage,
  waitForNewTab,
  waitForTabClose,
} from "./common/utils";
import { getChromeStorage } from "./common/storage";

chrome.runtime.onMessage.addListener(
  async (
    request: MessageActionsId,
    _sender,
    sendResponse: (response?: MessageResponse) => void
  ) => {
    if (request.action === "OPTIONS_PAGE_LOADED") {
      logger.log(
        "background",
        "バックグラウンドでOPTIONS_PAGE_LOADEDメッセージを受信しました。"
      );
      logger.log(
        "background",
        "content_scriptに商品取得メッセージを送信します。"
      );
      const tabId = await getSearchTab(
        "https://jp.mercari.com/mypage/listings*"
      );
      if (tabId === undefined) {
        throw new Error("タブIDが取得できませんでした");
      }
      sendContentScriptMessage(tabId, { action: "OPTIONS_PAGE_LOADED" });
      logger.log("background", "content_scriptに商品取得メッセージを送信終了");
      sendResponse({ success: true });
      return true;
    }

    if (request.action === "RELISTING_START") {
      logger.log(
        "background",
        "バックグラウンドでRELISTING_STARTメッセージを受信しました。"
      );
      logger.log("background", "再出品処理を開始します");

      // chrome.storageから再出品対象商品を取得する
      logger.log(
        "background",
        "再出品対象商品をchrome.storageから取得を開始します"
      );
      const result = await getChromeStorage<ReListingItem[]>("selectedItems");
      if (!result) {
        throw new Error("再出品対象商品の取得に失敗しました");
      }
      logger.log(
        "background",
        "再出品対象商品をchrome.storageから取得を終了します"
      );

      const listingsUrl = "https://jp.mercari.com/mypage/listings*";

      const tabId = await getSearchTab(listingsUrl);
      if (tabId === undefined) {
        throw new Error("タブIDが取得できませんでした");
      }

      await chrome.tabs.update(tabId, { active: true });

      // 再出品処理を開始する
      for (const item of result) {
        // 各ループでタブをアクティブ化
        await chrome.tabs.update(tabId, { active: true });

        // 新しいタブが開かれるのを待つリスナーを先に設定
        const newTabPromise = waitForNewTab(tabId);

        // 再出品ボタンをクリックする
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: (selector) => {
            const cloneItemButton =
              document.querySelector<HTMLElement>(selector);
            if (!cloneItemButton) {
              throw new Error("再出品ボタンが見つかりませんでした");
            }
            cloneItemButton.click();
          },
          args: [item.cloneItemSelector],
        });

        // 新しいタブが開かれるのを待つ
        const newTab = await newTabPromise;
        if (!newTab) {
          throw new Error("新しいタブが開かれませんでした");
        }
        logger.log(
          "background",
          `新しいタブが開かれました。Tab ID: ${newTab.id}`
        );
        if (!newTab.id) {
          throw new Error("新しいタブのIDが取得できませんでした");
        }

        await waitForTabClose(newTab.id);

        logger.log("background", "商品の削除を開始します。");

        // 新しいタブで削除対象ページのURLを開き、タブ情報を取得
        const deleteTab = await chrome.tabs.create({
          url: `https://jp.mercari.com/sell/edit/${item.id}?faaid=1`,
          active: true,
          openerTabId: tabId,
        });

        if (!deleteTab) {
          throw new Error("削除用の新しいタブが開かれませんでした");
        }

        logger.log(
          "background",
          `削除用の新しいタブが開かれました。Tab ID: ${deleteTab.id}`
        );

        if (!deleteTab.id) {
          throw new Error("削除用の新しいタブのIDが取得できませんでした");
        }

        // 新しく開いたタブを閉じる
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await chrome.tabs.remove(deleteTab.id);

        // 新しいタブが閉じられるのを待つ
        await waitForTabClose(deleteTab.id);

        logger.log("background", "商品の削除を終了します。");

        // 最後の商品じゃない場合は、1秒待ってから次の商品を出品する
        if (item !== result[result.length - 1]) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          logger.log("background", "1秒待ってから次の商品を出品します");
        }
      }

      logger.log("background", "再出品処理を終了します");
      // content_scriptに再出品処理が完了したことを通知する
      await sendContentScriptMessage(tabId, { action: "RELISTING_COMPLETE" });

      sendResponse({ success: true });
      return true;
    }
    return true;
  }
);
