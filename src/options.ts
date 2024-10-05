import { getChromeStorage, setChromeStorage } from './common/storage';
import { sendBackgroundMessage } from './common/utils';
import { logger } from './logger';
import type { Item, ReListingItem } from './types';

function renderItems(items: Item[]) {
  const container = document.getElementById('item-list');
  if (!container) {
    logger.error('商品リストを表示する要素が見つかりませんでした');
    return;
  }

  for (const item of items) {
    // 行要素の作成
    const itemRow = document.createElement('li');
    itemRow.classList.add('item-row');

    // サムネイル (img) 要素を含むセルの作成
    const thumbnailElement = document.createElement('img');
    thumbnailElement.src = item.thumbnail;
    thumbnailElement.alt = item.name;
    thumbnailElement.classList.add('item-image');
    itemRow.appendChild(thumbnailElement);

    const detailCell = document.createElement('div');
    detailCell.classList.add('item-details');

    // チェックボックスのIDを作成
    const checkboxId = item.id;

    // ラベル (label) 要素の作成
    const titleElement = document.createElement('label');
    titleElement.classList.add('item-title');
    titleElement.textContent = item.name;
    titleElement.htmlFor = checkboxId;
    detailCell.appendChild(titleElement);
    itemRow.appendChild(detailCell);

    // 出品日時を含むセルの作成
    const timeElement = document.createElement('div');
    timeElement.classList.add('item-time');
    timeElement.textContent = item.time;
    detailCell.appendChild(timeElement);

    // チェックボックスを含むセルの作成
    const checkboxCell = document.createElement('div');
    checkboxCell.classList.add('checkbox-cell');
    const checkboxElement = document.createElement('input');
    checkboxElement.type = 'checkbox';
    checkboxElement.id = checkboxId;
    checkboxElement.dataset.cloneItemSelector = item.cloneItemSelector;
    checkboxElement.tabIndex = 0;
    checkboxCell.appendChild(checkboxElement);
    itemRow.appendChild(checkboxCell);

    container.appendChild(itemRow);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  logger.log('options', '初期処理を開始します');
  const result = await sendBackgroundMessage({ action: 'OPTIONS_PAGE_LOADED' });
  if (!result) {
    throw new Error('バックグラウンドへのメッセージ送信に失敗しました');
  }
  logger.log('options', 'chrome.storageから商品リストの取得を開始します');
  const itemList = await getChromeStorage<Item[]>('itemList');

  if (!itemList) {
    logger.error('商品リストが取得できませんでした。');
    return;
  }
  logger.log('options', 'chrome.storageから商品リストの取得を終了します');
  renderItems(itemList);
  logger.log('options', '初期処理を終了します');
});

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('item-relisting');
  if (!button) {
    throw new Error('ボタンがありませんでした');
  }

  button.addEventListener('click', async () => {
    // confilmメッセージを表示する
    const startCheck = window.confirm('再出品を開始しますか？');
    if (!startCheck) {
      return;
    }

    logger.log('options', '再出品する押下時の処理を開始します');

    const selectedInputs = document.querySelectorAll('input[type="checkbox"]:checked');

    // オブジェクト配列としてidとdata-clone-item-selectorをまとめる
    const selectedItems: ReListingItem[] = Array.from(selectedInputs).map((input) => {
      const id = input.getAttribute('id') || ''; // id属性を取得
      const cloneItemSelector = input.getAttribute('data-clone-item-selector') || ''; // data-clone-item-selector属性を取得
      return {
        id,
        cloneItemSelector,
      };
    });

    if (selectedItems.length === 0) {
      alert('再出品対象商品を選択してください');
      return;
    }

    // 再出品対象商品をchrome.storageに保存する
    logger.log('options', '再出品対象商品をchrome.storageに保存するを開始します');
    const result = await setChromeStorage('selectedItems', selectedItems);
    if (!result) {
      throw new Error('再出品対象商品の保存に失敗しました');
    }
    logger.log('options', '再出品対象商品をchrome.storageに保存するを終了します');

    // 再出品処理を開始するメッセージをバックグラウンドに送信する
    const response = await sendBackgroundMessage({
      action: 'RELISTING_START',
    });
    if (!response) {
      throw new Error('バックグラウンドへのメッセージ送信に失敗しました');
    }
    logger.log('options', '再出品する押下時の処理を終了します');
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('back-to-top');
  if (!button) {
    throw new Error('上に戻るボタンが見つかりませんでした');
  }

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });
});
