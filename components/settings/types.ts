// components/settings/types.ts
import type { UserRole } from "@/types/inventory";

export interface SettingsUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  isCreator?: boolean;
  createdAt: string | Date;
  lastLogin?: string | Date | null;
  theme?: string;
}

export interface SettingsSpace {
  id: string;
  name: string;
  notes?: string | null;
  imageUrl?: string | null;
  address?: string | null;
  responsible?: string | null;
  phone?: string | null;
}

export interface SettingsCategory {
  id: string;
  name: string;
  color?: string | null;
}

export interface SettingsLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user?: { name?: string | null; email: string } | null;
}

export type SettingsTab = "users" | "spaces" | "categories" | "logs" | "theme";

export interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  variant: "danger" | "warning" | "info";
  onConfirm: () => void;
}
