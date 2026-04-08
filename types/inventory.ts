// types/inventory.ts

// --- ENUMS ---
// Mantidos conforme o Prisma
export type UserRole = 'ADMIN' | 'MANAGER' | 'VIEWER';
export type Theme = 'DARK' | 'LIGHT' | 'SISTEM';

// --- INTERFACES DE MODELO (Refletindo o Prisma) ---
export interface Category {
  id: string;
  name: string;
  color?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  
  // Relacionamento inverso
  actives?: Active[];
}

// Alias para retrocompatibilidade
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
  defaultSort: string;
  lastLogin?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  
  // Relacionamentos
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

// --- TIPOS AUXILIARES (Para formulários e APIs) ---
export type CreateActiveInput = Omit<Active, 'id' | 'createdAt' | 'updatedAt' | 'category' | 'parent' | 'children' | 'fatherSpace' | 'createdBy'>;
export type UpdateActiveInput = Partial<CreateActiveInput> & { id: string };