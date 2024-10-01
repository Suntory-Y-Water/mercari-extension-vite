import { setChromeStorage } from "./common/storage";
import { Constants } from "./constants";
import { logger } from "./logger";
import type { Item, MessageActionsId, MessageResponse } from "./types";

/**
 * @description リストに表示されている商品のIDを取得する
 */
function getId(href: string): string {
  return href.split("/").pop() || "";
}

/**
 * @description 指定したセレクタの要素からhref属性を取得する
 */
function getHref(element: Element, selector: string): string {
  const targetElement = element.querySelector(selector);
  if (!targetElement) {
    return "";
  }
  return targetElement.getAttribute("href") || "";
}

/**
 * @description 商品名から不要な文字列を削除する
 */
function getRelistItemName(name: string): string {
  return name.trim().replace(/\s+/g, "");
}

/**
 * @description 指定したセレクタの要素からテキストを取得する
 */
function getTextContent(element: Element, selector: string): string {
  const targetElement = element.querySelector(selector);
  if (!targetElement) {
    return "";
  }
  return targetElement.textContent || "";
}

/**
 * @description 指定したセレクタの要素からサムネイル画像のURLを取得する
 */
function getThumbnail(element: Element, selector: string): string {
  const targetElement = element.querySelector(selector);
  if (!targetElement) {
    return "./box.png";
  }
  const thumbnail = targetElement.querySelector("img")?.getAttribute("src");
  return thumbnail ? thumbnail : "./box.png";
}

/**
 * @description 指定したセレクタの要素から商品の公開状態を取得する。公開停止中: true, 公開中: false
 */
function notShowItemCheck(element: Element, selector: string): boolean {
  const targetElement = element.querySelector(selector);
  if (!targetElement) {
    return false;
  }
  return true;
}

/**
 * @description リストに表示されている商品の情報を取得する
 */
function getListingsItem(element: Element, cloneItemSelector: string): Item {
  return {
    id: getId(
      getHref(element, Constants.SELECTOR_CONSTANTS.LISTINGS_CONSTANTS.HREF)
    ),
    name: getRelistItemName(
      getTextContent(
        element,
        Constants.SELECTOR_CONSTANTS.LISTINGS_CONSTANTS.NAME
      )
    ),
    thumbnail: getThumbnail(
      element,
      Constants.SELECTOR_CONSTANTS.LISTINGS_CONSTANTS.THUMBNAIL
    ),
    notShowItme: notShowItemCheck(
      element,
      Constants.SELECTOR_CONSTANTS.LISTINGS_CONSTANTS.NOT_SHOW_ITEM
    ),
    cloneItemSelector: cloneItemSelector,
  };
}

export function getAllItemsFromListings(
  baseSelector: string,
  itemSelector: string
): Item[] {
  const itemList: Item[] = [];
  let count = 1;
  let element: Element | null;
  while (
    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    (element = document.querySelector(
      `${baseSelector} > div:nth-child(${count}) > ${itemSelector}`
    )) !== null
  ) {
    try {
      if (element) {
        const cloneItemSelector = `${baseSelector} > div:nth-child(${count}) > div.content__884ec505 > a > div > div > #clone-item`;
        const productData = getListingsItem(element, cloneItemSelector);
        itemList.push(productData);
        count++;
      } else {
        break;
      }
    } catch (error) {
      logger.error(
        "getAllItemsFromListings",
        "商品の取得中にエラーが発生しました"
      );
      logger.error(
        "getAllItemsFromListings",
        `エラー内容 : ${(error as Error).message}`
      );
      break;
    }
  }

  return itemList;
}

chrome.runtime.onMessage.addListener(
  async (
    request: MessageActionsId,
    _sender,
    sendResponse: (response?: MessageResponse) => void
  ) => {
    if (request.action === "OPTIONS_PAGE_LOADED") {
      logger.log("content_script", "商品情報の取得を開始します");
      const items = getAllItemsFromListings(
        "#currentListing > div",
        "div.content__884ec505"
      );
      logger.log("content_script", "商品情報の取得を終了します");
      // 取得した情報をchrome.storageに保存する
      logger.log("content_script", "商品情報の保存を開始します");
      const result = await setChromeStorage("itemList", items);

      if (!result) {
        throw new Error("商品情報の保存に失敗しました");
      }
      logger.log("content_script", "商品情報の保存を終了します");

      sendResponse({ success: true });
    }
    return true;
  }
);
