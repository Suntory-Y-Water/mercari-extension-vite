import { setChromeStorage } from './common/storage';
import { logger } from './logger';
import type { Item, MessageActionsId, MessageResponse } from './types';

/**
 * @description 指定したセレクタの要素からテキストを取得する
 */
function getTextContent(element: Element, selector: string): string {
  const targetElement = element.querySelector(selector);
  if (!targetElement) {
    return '';
  }
  return targetElement.textContent || '';
}

/**
 * @description 指定したセレクタの要素からサムネイル画像のURLを取得する
 */
function getThumbnail(element: Element, selector: string): string {
  const targetElement = element.querySelector(selector);
  if (!targetElement) {
    return './box.png';
  }
  const thumbnail = targetElement.getAttribute('src');
  return thumbnail ? thumbnail : './box.png';
}

export function getAllItemsFromListings(): Item[] {
  const itemList: Item[] = [];
  // li要素を全て取得
  const itemElements = document.querySelectorAll('#my-page-main-content > div > div > div > div > ul > li > a');

  // 各商品の商品情報を取得
  for (let index = 0; index < itemElements.length; index++) {
    const itemElement = itemElements[index];
    // 商品IDを取得（親のa要素のhrefから抽出）
    const href = itemElement.getAttribute('href') || '';
    const id = href.split('/').pop() || '';

    // 商品名を取得
    const name = getTextContent(itemElement, 'p[data-testid="item-label"]');

    // サムネイル画像を取得
    const thumbnail = getThumbnail(itemElement, 'picture img');

    // 公開停止中かどうかを判定
    const statusElements = itemElement.querySelectorAll('span');
    let notShowItme = false;
    for (const statusElement of statusElements) {
      if (statusElement.textContent?.includes('公開停止中')) {
        notShowItme = true;
        break;
      }
    }

    const cloneItemSelector = `#my-page-main-content > div > div > div > div > ul > li:nth-child(${index + 1}) #clone-item`;

    logger.log(
      'getAllItemsFromListings',
      `id: ${id}, name: ${name}, thumbnail: ${thumbnail}, notShowItme: ${notShowItme}, cloneItemSelector: ${cloneItemSelector}`,
    );

    itemList.push({
      id,
      name,
      thumbnail,
      notShowItme,
      cloneItemSelector,
    });
  }
  return itemList;
}

chrome.runtime.onMessage.addListener(
  async (request: MessageActionsId, _sender, sendResponse: (response?: MessageResponse) => void) => {
    if (request.action === 'OPTIONS_PAGE_LOADED') {
      logger.log('content_script', '商品情報の取得を開始します');
      const items = getAllItemsFromListings();
      logger.log('content_script', '商品情報の取得を終了します');
      // 取得した情報をchrome.storageに保存する
      logger.log('content_script', '商品情報の保存を開始します');
      const result = await setChromeStorage('itemList', items);

      if (!result) {
        throw new Error('商品情報の保存に失敗しました');
      }
      logger.log('content_script', '商品情報の保存を終了します');

      sendResponse({ success: true });
      return true;
    }

    if (request.action === 'RELISTING_COMPLETE') {
      window.alert('再出品処理が完了しました。');
      sendResponse({ success: true });
      return true;
    }
    return true;
  },
);
