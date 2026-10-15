import type { RevertAction, RevertSubItem } from './types';
import { ACTION_LABELS } from './types';

/**
 * lib/revert/batch.ts
 *
 * Apresentação: agrupa planos de reversão em "atividades" que o usuário
 * reconhece ("Movimentação em grupo (4 ativos)"), e infere `CLONE`.
 * Módulo **puro** — coberto por `__tests__/lib/revert/batch.test.ts`.
 */

/** Item já classificado pelo `history.ts`, pronto para agrupamento. */
export interface PlannedItem extends RevertSubItem {
  name: string;
  action: RevertAction;
}

/** Uma atividade: um registro sozinho ou um lote de mesma ação. */
export interface Activity {
  groupId: string;
  name: string;
  timestamp: string;
  action: RevertAction;
  items: PlannedItem[];
}

export const BATCH_WINDOW_MS = 2000;

/**
 * Agrupa itens por ação dentro de uma **janela deslizante** de `windowMs`.
 *
 * A janela desliza sobre o item mais antigo já aceito do lote: o próximo item
 * só entra se estiver a menos de `windowMs` dele. Com a âncora fixa no item
 * mais recente (como era), um lote de criações espaçadas se fragmentava em
 * vários grupos mesmo sendo uma só atividade.
 *
 * `CLONE` é inferido aqui, e não no histórico: `clone-batch.ts` grava os
 * clones via `createMany`, e o banco não marca a origem. Um lote de mais de
 * uma criação simultânea é tratado como clonagem — é o único caminho do app
 * que cria vários registros de uma vez.
 *
 * Entrada é ordenada do mais recente ao mais antigo; a saída preserva essa
 * ordem. `groupId` é determinístico, para que a seleção do usuário não se
 * perca a cada 5 s em que `settings.tsx` refaz a consulta.
 */
export function batchActivities(
  items: readonly PlannedItem[],
  windowMs: number = BATCH_WINDOW_MS
): Activity[] {
  const ordered = [...items].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  interface OpenGroup extends Activity {
    /** `timestamp` do item mais antigo já aceito — a âncora da janela. */
    lastTime: number;
  }

  const groups: OpenGroup[] = [];

  for (const item of ordered) {
    const time = new Date(item.timestamp).getTime();

    const existing = groups.find(
      (group) => group.action === item.action && group.lastTime - time <= windowMs
    );

    if (existing) {
      existing.items.push(item);
      existing.lastTime = time;
    } else {
      groups.push({
        groupId: `batch-${item.action.toLowerCase()}-${time}`,
        name: item.name,
        timestamp: item.timestamp,
        action: item.action,
        items: [item],
        lastTime: time,
      });
    }
  }

  return groups.map((group) => {
    const action: RevertAction =
      group.action === 'CREATE' && group.items.length > 1 ? 'CLONE' : group.action;

    const labels = ACTION_LABELS[action];
    const name =
      group.items.length === 1 ? group.items[0].name : `${labels.batch} (${group.items.length} ativos)`;

    return {
      groupId: group.groupId,
      name,
      timestamp: group.timestamp,
      action,
      items: group.items.map((item) => ({ ...item })),
    };
  });
}

/** Sub-itens de um lote, no formato que o `POST` consome. */
export function toSubItems(activity: Activity): RevertSubItem[] {
  return activity.items.map((item) => ({
    table: item.table,
    id: item.id,
    timestamp: item.timestamp,
  }));
}
