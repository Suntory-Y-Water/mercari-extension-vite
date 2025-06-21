import { getChromeStorage } from './common/storage';
import { getSearchTab, sendContentScriptMessage, waitForNewTab, waitForTabClose } from './common/utils';
import { logger } from './logger';
import type { MessageActionsId, MessageResponse, ReListingItem } from './types';

chrome.runtime.onMessage.addListener(
  async (request: MessageActionsId, _sender, sendResponse: (response?: MessageResponse) => void) => {
    if (request.action === 'OPTIONS_PAGE_LOADED') {
      logger.log('background', 'バックグラウンドでOPTIONS_PAGE_LOADEDメッセージを受信しました。');
      logger.log('background', 'content_scriptに商品取得メッセージを送信します。');
      const tabId = await getSearchTab('https://jp.mercari.com/mypage/listings*');
      if (tabId === undefined) {
        throw new Error('タブIDが取得できませんでした');
      }
      sendContentScriptMessage(tabId, { action: 'OPTIONS_PAGE_LOADED' });
      logger.log('background', 'content_scriptに商品取得メッセージを送信終了');
      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'RELISTING_START') {
      logger.log('background', 'バックグラウンドでRELISTING_STARTメッセージを受信しました。');
      logger.log('background', '再出品処理を開始します');

      // chrome.storageから再出品対象商品を取得する
      logger.log('background', '再出品対象商品をchrome.storageから取得を開始します');
      const result = await getChromeStorage<ReListingItem[]>('selectedItems');
      if (!result) {
        throw new Error('再出品対象商品の取得に失敗しました');
      }
      logger.log('background', '再出品対象商品をchrome.storageから取得を終了します');

      const listingsUrl = 'https://jp.mercari.com/mypage/listings*';

      const tabId = await getSearchTab(listingsUrl);
      if (tabId === undefined) {
        throw new Error('タブIDが取得できませんでした');
      }

      await chrome.tabs.update(tabId, { active: true });

      // 再出品処理を開始する
      for (const item of result) {
        logger.log('background', `商品の処理を開始: ${item.id} (${result.indexOf(item) + 1}/${result.length})`);

        // 各ループでタブをアクティブ化
        await chrome.tabs.update(tabId, { active: true });
        logger.log('background', `タブをアクティブ化しました: ${tabId}`);

        // 新しいタブが開かれるのを待つリスナーを先に設定
        const newTabPromise = waitForNewTab(tabId);
        logger.log('background', '新しいタブの監視を開始しました');

        // 再出品ボタンをクリックする
        logger.log('background', `再出品ボタンをクリックします: ${item.cloneItemSelector}`);
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: (selector) => {
            const cloneItemButton = document.querySelector<HTMLElement>(selector);
            if (!cloneItemButton) {
              throw new Error('再出品ボタンが見つかりませんでした');
            }
            cloneItemButton.click();
          },
          args: [item.cloneItemSelector],
        });
        logger.log('background', '再出品ボタンのクリックが完了しました');

        // 新しいタブが開かれるのを待つ
        logger.log('background', '新しいタブが開かれるのを待機中...');
        const newTab = await newTabPromise;
        if (!newTab) {
          throw new Error('新しいタブが開かれませんでした');
        }
        logger.log('background', `新しいタブが開かれました。Tab ID: ${newTab.id}`);
        if (!newTab.id) {
          throw new Error('新しいタブのIDが取得できませんでした');
        }

        logger.log('background', `新しいタブ(${newTab.id})が閉じられるのを待機中...`);
        await waitForTabClose(newTab.id);
        logger.log('background', `新しいタブ(${newTab.id})が閉じられました`);

        logger.log('background', '商品の削除を開始します。');

        // 新しいタブで削除対象ページのURLを開き、タブ情報を取得
        logger.log('background', `削除用タブを作成します: https://jp.mercari.com/sell/edit/${item.id}?faaid=1`);
        const deleteTab = await chrome.tabs.create({
          url: `https://jp.mercari.com/sell/edit/${item.id}?faaid=1`,
          active: true,
          openerTabId: tabId,
        });

        if (!deleteTab) {
          throw new Error('削除用の新しいタブが開かれませんでした');
        }

        logger.log('background', `削除用の新しいタブが開かれました。Tab ID: ${deleteTab.id}`);

        if (!deleteTab.id) {
          throw new Error('削除用の新しいタブのIDが取得できませんでした');
        }

        // 新しく開いたタブを閉じる
        logger.log('background', '5秒待機してから削除用タブを閉じます');
        await new Promise((resolve) => setTimeout(resolve, 5000));
        logger.log('background', `削除用タブ(${deleteTab.id})を閉じます`);

        try {
          await chrome.tabs.remove(deleteTab.id);
          logger.log('background', `削除用タブ(${deleteTab.id})を手動で閉じました`);
        } catch (error) {
          logger.log('background', `削除用タブ(${deleteTab.id})は既に閉じられています: ${error}`);
        }

        // 削除用タブは別の拡張機能で自動的に閉じられるため、待機処理は不要
        logger.log('background', '削除用タブの処理が完了しました');

        logger.log('background', '商品の削除を終了します。');

        // 最後の商品じゃない場合は、1秒待ってから次の商品を出品する
        if (item !== result[result.length - 1]) {
          logger.log('background', '1秒待ってから次の商品を処理します');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          logger.log('background', '1秒の待機が完了しました');
        }

        logger.log('background', `商品の処理を完了: ${item.id} (${result.indexOf(item) + 1}/${result.length})`);
      }

      logger.log('background', '再出品処理を終了します');
      // content_scriptに再出品処理が完了したことを通知する
      await sendContentScriptMessage(tabId, { action: 'RELISTING_COMPLETE' });

      sendResponse({ success: true });
      return true;
    }
    return true;
  },
);
