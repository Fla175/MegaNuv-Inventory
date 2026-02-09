// types/inventory.ts
export interface ItemDefinition {
  id: string;
  name: string;
  sku: string | null;
  imageUrl?: string | null;
  isNative: boolean;
}

export interface Item {
  id: string;
  definitionId: string;
  definition: ItemDefinition;
  imageUrl?: string | null;
  tag: string; // IN-STOCK, IN-USE, TO-SELL
  locationId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemInstance {
  id: string;
  name: string;
  imageUrl?: string | null;
  fixedValue: number;
  parentId?: string | null;
  parent?: ItemInstance | null;
  children?: ItemInstance[];
  items?: Item[];
  createdAt: string;
  updatedAt: string;
}