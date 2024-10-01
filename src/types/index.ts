export type MessageActionsId = {
  action: "OPTIONS_PAGE_LOADED" | "RELISTING_START" | "RELISTING_COMPLETE";
};

export type MessageResponse = {
  success: boolean;
};

/**
 * @description 各商品の個別情報
 */
export type Item = {
  id: string;
  name: string;
  thumbnail: string;
  notShowItme: boolean;
  cloneItemSelector: string;
};

export type ReListingItem = {
  id: string;
  cloneItemSelector: string;
};
