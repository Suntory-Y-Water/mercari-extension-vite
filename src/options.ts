import { logger } from "./logger";
import { sendBackgroundMessage } from "./common/utils";
import type { ReListingItem, Item } from "./types";
import { getChromeStorage, setChromeStorage } from "./common/storage";

function renderItems(items: Item[]) {
  const container = document.getElementById("item-table");
  if (!container) {
    return;
  }

  for (const item of items) {
    // 行 (tr) 要素の作成
    const itemRow = document.createElement("tr");
    itemRow.classList.add("item-row");

    // サムネイル (img) 要素を含むセル (td) の作成
    const thumbnailCell = document.createElement("td");
    const thumbnailElement = document.createElement("img");
    thumbnailElement.src = item.thumbnail;
    thumbnailElement.alt = item.name;
    thumbnailElement.classList.add("item-image");
    thumbnailCell.appendChild(thumbnailElement);
    itemRow.appendChild(thumbnailCell);

    // アイテム情報を含むセル (td) の作成
    const infoCell = document.createElement("td");
    infoCell.classList.add("item-info");
    const titleElement = document.createElement("p");
    titleElement.classList.add("item-title");
    titleElement.textContent = item.name;
    infoCell.appendChild(titleElement);
    itemRow.appendChild(infoCell);

    // チェックボックスを含むセル (td) の作成
    const checkboxCell = document.createElement("td");
    checkboxCell.classList.add("checkbox-cell");
    const checkboxElement = document.createElement("input");
    checkboxElement.type = "checkbox";

    // 商品IDを設定
    checkboxElement.id = item.id;
    checkboxElement.dataset.cloneItemSelector = item.cloneItemSelector;
    checkboxElement.tabIndex = 0;
    checkboxCell.appendChild(checkboxElement);
    itemRow.appendChild(checkboxCell);

    // 完成した行 (tr) をテーブルに追加
    container.appendChild(itemRow);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  logger.log("options", "初期処理を開始します");
  const result = await sendBackgroundMessage({ action: "OPTIONS_PAGE_LOADED" });
  if (!result) {
    throw new Error("バックグラウンドへのメッセージ送信に失敗しました");
  }
  logger.log("options", "chrome.storageから商品リストの取得を開始します");
  const itemList = await getChromeStorage<Item[]>("itemList");

  if (!itemList) {
    logger.error("商品リストが取得できませんでした。");
    return;
  }
  logger.log("options", "chrome.storageから商品リストの取得を終了します");
  renderItems(itemList);
  logger.log("options", "初期処理を終了します");
});

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("item-relisting");
  if (!button) {
    throw new Error("ボタンがありませんでした");
  }

  button.addEventListener("click", async () => {
    logger.log("options", "再出品する押下時の処理を開始します");
    const selectedInputs = document.querySelectorAll(
      'input[type="checkbox"]:checked'
    );

    // オブジェクト配列としてidとdata-clone-item-selectorをまとめる
    const selectedItems: ReListingItem[] = Array.from(selectedInputs).map(
      (input) => {
        const id = input.getAttribute("id") || ""; // id属性を取得
        const cloneItemSelector =
          input.getAttribute("data-clone-item-selector") || ""; // data-clone-item-selector属性を取得
        return {
          id,
          cloneItemSelector,
        };
      }
    );
    // 再出品対象商品をchrome.storageに保存する
    logger.log(
      "options",
      "再出品対象商品をchrome.storageに保存するを開始します"
    );
    const result = await setChromeStorage("selectedItems", selectedItems);
    if (!result) {
      throw new Error("再出品対象商品の保存に失敗しました");
    }
    logger.log(
      "options",
      "再出品対象商品をchrome.storageに保存するを終了します"
    );

    // 再出品処理を開始するメッセージをバックグラウンドに送信する
    const response = await sendBackgroundMessage({
      action: "RELISTING_START",
    });
    if (!response) {
      throw new Error("バックグラウンドへのメッセージ送信に失敗しました");
    }
    logger.log("options", "再出品する押下時の処理を終了します");
  });
});
