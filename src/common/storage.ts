/**
 * @description chrome.storageからデータを取得する
 */
export async function getChromeStorage<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get();
    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    return result[key] || null;
  } catch (error) {
    throw new Error(`データの取得中にエラーが発生しました: ${error}`);
  }
}
/**
 * @description chrome.storageにデータを設定する
 */
export async function setChromeStorage<T>(
  key: string,
  value: T
): Promise<boolean> {
  try {
    await chrome.storage.local.set({ [key]: value });
    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    return true;
  } catch (error) {
    throw new Error(`データの設定中にエラーが発生しました: ${error}`);
  }
}

/**
 * @description chrome.storageからデータを削除する
 */
export async function popChromeStorage(key: string): Promise<boolean> {
  try {
    await chrome.storage.local.remove(key);
    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    return true;
  } catch (error) {
    throw new Error(`データの削除中にエラーが発生しました: ${error}`);
  }
}
