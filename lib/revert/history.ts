import type { AllowedTable, RevertAction } from './types';

/**
 * lib/revert/history.ts
 *
 * Semântica de reversão sobre system-versioning do MariaDB. Módulo **puro**:
 * nenhum I/O, nenhum Prisma, nenhum Next — recebe linhas de versão e devolve
 * o plano de reversão. É por ser puro que a classificação de ação é testável
 * sem banco (`__tests__/lib/revert/history.test.ts`).
 *
 * A regra central:
 *   `revertAt` é o último instante em que o estado desejado esteve vigente.
 *   Passar `revertAt` para `FOR SYSTEM_TIME AS OF` restaura aquele estado.
 */

/**
 * `ROW_END` que o MariaDB grava para a versão corrente.
 *
 * Mantido idêntico ao valor que o handler usava antes da extração, para não
 * alterar o comportamento de detecção de "versão vigente" (o `.999999` é a
 * precisão do banco; o JavaScript trunca para milissegundos).
 */
export const TIMESTAMP_MAX = new Date('2038-01-19 03:14:07.999999');

/** Uma linha de `SELECT * ... FOR SYSTEM_TIME ALL`. Colunas de negócio são opacas. */
export interface VersionRow {
  ROW_START: string | Date;
  ROW_END: string | Date;
  [column: string]: unknown;
}

export interface RevertPlan {
  /**
   * `CLONE` **não** é derivado aqui: o banco não distingue um clone de um
   * cadastro manual. Ele é inferido em `batch.ts` pela contagem do lote.
   */
  action: Exclude<RevertAction, 'CLONE'>;
  /** Instante a passar em `FOR SYSTEM_TIME AS OF` para desfazer a ação. */
  revertAt: Date;
  name: string;
}

/**
 * O que torna uma tabela reversível.
 *
 * `locatorColumn` é a coluna que significa "localização" no nome de um
 * movimento. Para `Active` é `fatherSpaceId` — **nunca** `parentId`, que é o
 * pai hierárquico da árvore de ativos e tem significado diferente.
 */
export const REVERTABLE_TABLES: Record<
  AllowedTable,
  { idColumn: string; nameColumn: string; locatorColumn: string | null }
> = {
  Active: { idColumn: 'id', nameColumn: 'name', locatorColumn: 'fatherSpaceId' },
  FatherSpace: { idColumn: 'id', nameColumn: 'name', locatorColumn: 'parentId' },
  // Category não tem hierarquia: toda mudança é uma edição.
  Category: { idColumn: 'id', nameColumn: 'name', locatorColumn: null },
};

export function isAllowedTable(value: string): value is AllowedTable {
  return Object.prototype.hasOwnProperty.call(REVERTABLE_TABLES, value);
}

function toTime(value: string | Date): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

export function isCurrentVersion(row: VersionRow): boolean {
  return toTime(row.ROW_END) >= TIMESTAMP_MAX.getTime();
}

/** Ordena da versão mais recente para a mais antiga. Entrada é copiada. */
export function sortVersionsDesc(versions: readonly VersionRow[]): VersionRow[] {
  return [...versions].sort((a, b) => toTime(b.ROW_START) - toTime(a.ROW_START));
}

function minusOneMillis(time: number): Date {
  return new Date(time - 1);
}

/**
 * Deriva o plano de reversão do histórico de um único registro.
 *
 * Invariantes da interface:
 *  - `versions` pode vir em qualquer ordem e com cardinalidade >= 1.
 *  - `null` = nada a reverter (histórico vazio).
 *  - Ação e `revertAt` são uma só pergunta: qual versão desse registro
 *    representa a última mudança, e em que instante ela passou a valer.
 *
 * Casos:
 *  - só a versão corrente          -> CREATE (desfazer = excluir)
 *  - versão anterior com locator
 *    diferente                      -> MOVE
 *  - versão anterior com locator
 *    igual                          -> UPDATE
 *  - nenhuma versão corrente        -> DELETE (registro já removido)
 */
export function planRevert(
  table: AllowedTable,
  versions: readonly VersionRow[]
): RevertPlan | null {
  if (versions.length === 0) return null;

  const config = REVERTABLE_TABLES[table];
  const ordered = sortVersionsDesc(versions);

  const nameOf = (row: VersionRow) =>
    String(row[config.nameColumn] ?? row[config.idColumn] ?? '');

  const current = ordered.find(isCurrentVersion);

  if (current) {
    // A versão imediatamente anterior à corrente: a mais recente já fechada.
    const previous = ordered.find((row) => !isCurrentVersion(row));

    if (!previous) {
      // Única versão, ainda corrente: criado e nunca alterado.
      return {
        action: 'CREATE',
        revertAt: minusOneMillis(toTime(current.ROW_START)),
        name: nameOf(current),
      };
    }

    const moved =
      config.locatorColumn !== null &&
      current[config.locatorColumn] !== previous[config.locatorColumn];

    return {
      action: moved ? 'MOVE' : 'UPDATE',
      revertAt: minusOneMillis(toTime(previous.ROW_END)),
      name: nameOf(current),
    };
  }

  // Sem versão corrente: a última ação foi a remoção.
  const last = ordered[0];
  return {
    action: 'DELETE',
    revertAt: minusOneMillis(toTime(last.ROW_END)),
    name: nameOf(last),
  };
}
