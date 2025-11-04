// types/inventory.ts

export interface Item {
    name: string;
    sku: string;
    contaAzulId?: string;
    status: string;
    price: number;
    cost: number | null;
  }
  
  export interface ItemInstance {
    id: string;
    itemId: string;
    serialNumber: string;
    location: string | null;
    qrCodePath: string | null;
    isInUse: boolean;
    notes: string | null;
    parentId: string | null;
    item: Item;
    children?: ItemInstance[]; // A presença desta chave (mesmo como []) indica um "espaço"
  }