// types/inventory.ts

// --- ENUMS ---
export type UserRole = 'ADMIN' | 'MANAGER' | 'VIEWER';
export type Theme = 'DARK' | 'LIGHT' | 'SISTEM';
export type Area = 'ENERGETICA' | 'REDES' | 'SERVIDOR' | 'MANUTENCAO';

// --- INTERFACES PRINCIPAIS ---

export interface FatherSpace {
  id: string;
  name: string;
  area?: Area | null;
  notes?: string | null;
  createdById?: string | null;
  parentId?: string | null;
  
  // Relacionamentos Opcionais (Recursive)
  parent?: FatherSpace | null;
  children?: FatherSpace[];
  actives?: Active[];
  
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Active {
  id: string;
  name: string;
  area: Area;

  // Dados de Fabricação/Técnicos
  sku?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  fixedValue: number;

  // Hierarquia de Ativos (Ativo dentro de Ativo)
  parentId?: string | null;
  parent?: Active | null;
  children?: Active[];

  // Diferenciador
  isPhysicalSpace: boolean;

  // Controle de Estoque/Status
  tag: string; // Ex: IN-STOCK, IN-USE, etc.
  quantity: number;
  notes?: string | null;

  // Localização (Vínculo com o FatherSpace)
  fatherSpaceId?: string | null;
  fatherSpace?: FatherSpace | null;

  // Auditoria e Mídia
  createdById?: string | null;
  imageUrl?: string | null;
  fileUrl?: string | null;

  createdAt: string | Date;
  updatedAt: string | Date;
}

// Interface auxiliar para o User (Útil para o Contexto de Usuário)
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
}