/**
 * lib/revert/types.ts
 *
 * Vocabulário de reversão — fonte única para backend (`GET/POST
 * /api/database/revert`) e frontend (Histórico em `pages/settings.tsx`).
 *
 * Não acrescentar/remover valores sem alinhar `ACTION_LABELS` e os testes de
 * `__tests__/lib/revert/batch.test.ts`.
 */

/** As cinco ações existentes no projeto. */
export const REVERT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'CLONE',
  'MOVE',
] as const;

export type RevertAction = (typeof REVERT_ACTIONS)[number];

export type AllowedTable = 'Active' | 'FatherSpace' | 'Category';

/** Sub-item de um lote — o que o `POST /api/database/revert` consome. */
export interface RevertSubItem {
  table: AllowedTable;
  id: string;
  timestamp: string;
}

/**
 * Item do Histórico como devolvido pelo `GET /api/database/revert`.
 *
 * Duas formas, compartilhando o mesmo corpo:
 *  - individual: `table`/`id` presentes, `groupId`/`items` ausentes;
 *  - lote:       `groupId`/`items` presentes, `table`/`id` ausentes.
 */
export interface RevertItem extends Partial<RevertSubItem> {
  groupId?: string;
  name: string;
  timestamp: string;
  action: RevertAction;
  items?: RevertSubItem[];
}

/** Rótulo exibido ao usuário — único lugar onde a ação vira texto. */
export const ACTION_LABELS: Record<RevertAction, { single: string; batch: string }> = {
  CREATE: { single: 'Criação', batch: 'Criação' },
  UPDATE: { single: 'Edição', batch: 'Edição em grupo' },
  DELETE: { single: 'Deleção', batch: 'Deleção em grupo' },
  CLONE: { single: 'Clonagem', batch: 'Clonagem em grupo' },
  MOVE: { single: 'Movimentação', batch: 'Movimentação em grupo' },
};

export function isRevertAction(value: unknown): value is RevertAction {
  return REVERT_ACTIONS.includes(value as RevertAction);
}
