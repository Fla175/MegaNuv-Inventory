// types/inventory.ts

// --- ENUMS ---
// Kept in sync with Prisma
export type UserRole = 'DIRECTOR' | 'ADMIN' | 'MANAGER' | 'VIEWER';
export type Theme = 'DARK' | 'LIGHT' | 'SYSTEM';

// --- MODEL INTERFACES (mirroring Prisma) ---
export interface Category {
  id: string;
  name: string;
  color?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  
  // Reverse relation
  actives?: Active[];
}

// Backwards-compatible alias
export type Area = Category;

export interface Log {
  id: string;
  action: string;
  details: string;
  ip?: string | null;
  userAgent?: string | null;
  userId?: string | null;
  user?: User | null;
  createdAt: string | Date;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  theme: Theme;
  isCreator: boolean;
  lastLogin?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  
  // Relations
  activesCreated?: Active[];
  spacesCreated?: FatherSpace[];
  logs?: Log[];
}

export interface FatherSpace {
  id: string;
  name: string;
  notes?: string | null;
  
  createdById?: string | null;
  createdBy?: User | null;

  parentId?: string | null;
  parent?: FatherSpace | null;
  children?: FatherSpace[];
  
  actives?: Active[];
  
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Payload of `GET /api/father-spaces/[id]` (ADR-004).
 *
 * Separate from `FatherSpace` on purpose: the list only needs identity and
 * counts, while the detail modal needs the location metadata. Widening the list
 * type would make every consumer carry fields it never reads.
 */
export interface SpaceDetail {
  id: string;
  name: string;
  notes?: string | null;
  address?: string | null;
  imageUrl?: string | null;
  phone?: string | null;
  responsible?: string | null;

  createdById?: string | null;
  createdBy?: Pick<User, "id" | "name" | "role"> | null;

  parentId?: string | null;
  parent?: Pick<FatherSpace, "id" | "name"> | null;

  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Active {
  id: string;
  name: string;

  categoryId?: string | null;
  category?: Area | null;

  sku?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  fixedValue: number;

  parentId?: string | null;
  parent?: Active | null;
  children?: Active[];

  isPhysicalSpace: boolean;
  tag: string; // Ex: IN-STOCK, IN-USE
  notes?: string | null;

  fatherSpaceId?: string | null;
  fatherSpace?: FatherSpace | null;

  createdById?: string | null;
  createdBy?: User | null;

  imageUrl?: string | null;
  fileUrl?: string | null;

  createdAt: string | Date;
  updatedAt: string | Date;
}

// --- HELPER TYPES (for forms and APIs) ---
export type CreateActiveInput = Omit<Active, 'id' | 'createdAt' | 'updatedAt' | 'category' | 'parent' | 'children' | 'fatherSpace' | 'createdBy'>;
export type UpdateActiveInput = Partial<CreateActiveInput> & { id: string };

/**
 * Item rendered by the asset listing.
 *
 * The UI tree handles `Active` and `FatherSpace` with the same code (context
 * menu, preview and form), and the API enriches both with derived fields that
 * do not exist in Prisma (`childCount`, `subSpaceCount`, `hasSubItems`,
 * `quantity` from clone). So the interface is structural and tolerant: only
 * `id` and `name` are guaranteed; everything else is optional because it
 * depends on whether the item is a space, a plain asset or a physical-space
 * asset.
 *
 * Replaces the `any` that existed in `ListSection.tsx`, `activeForm.tsx` and
 * `pages/index.tsx` (ADR-001, stage 3.4).
 */
export interface InventoryItem {
  id: string;
  name: string;

  categoryId?: string | null;
  category?: Category | null;

  sku?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  fixedValue?: number;

  parentId?: string | null;
  parent?: InventoryItem | null;
  children?: InventoryItem[];

  isPhysicalSpace?: boolean;
  tag?: string;
  notes?: string | null;

  fatherSpaceId?: string | null;
  fatherSpace?: FatherSpace | null;

  createdById?: string | null;
  imageUrl?: string | null;
  fileUrl?: string | null;

  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Derived fields computed by the API/UI.
  childCount?: number;
  subSpaceCount?: number;
  hasSubItems?: boolean;
  /** Used only in the clone payload (number of copies). */
  quantity?: number;
  /** Marks a `movingItem` that represents the multi-selection, not an asset. */
  isBatch?: boolean;
}