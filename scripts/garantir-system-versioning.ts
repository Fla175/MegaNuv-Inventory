#!/usr/bin/env node
/**
 * scripts/garantir-system-versioning.ts
 *
 * Verifica (e, com `--aplicar`, habilita) o `WITH SYSTEM VERSIONING` nas
 * tabelas que o Revert exige. Existe porque o Prisma **não modela** system
 * versioning: `prisma/schema.prisma` e as migrations não têm como declarar
 * essa opção de tabela, e o MariaDB responde 4124 (`Table `X` is not
 * system-versioned`) quando o Revert tenta ler o histórico de uma tabela sem
 * ele.
 *
 * Consequência importante: o `ALTER TABLE ... ADD SYSTEM VERSIONING` é
 * aplicado **fora** do sistema de migrations do Prisma, e por isso **não deve
 * ser registrado como migration**. Uma migration não sobrevive ao
 * `prisma migrate diff` nem ao `migrate reset`; e o Prisma geraria DDL de
 * tabela sem a opção de system versioning, que o MariaDB rejeitaria. O estado
 * do system versioning é, portanto, responsabilidade **operacional** — e é
 * exatamente por isso que este script existe.
 *
 * Uso (sem build, sem runner — Node 22 executa `.ts` por type-stripping):
 *
 *   node scripts/garantir-system-versioning.ts            # somente leitura (padrão)
 *   node scripts/garantir-system-versioning.ts --aplicar  # habilita o que falta
 *   node scripts/garantir-system-versioning.ts --tabela Active
 *
 * Sem argumentos nada é alterado. O script é idempotente: rodar `--aplicar`
 * duas vezes não executa DDL na segunda vez, porque só entra no `ALTER` o que
 * voltou como `SYSTEM_VERSIONING = 'NO'` (ver `readStatus`).
 *
 * Serve também como **check de CI**: sai com código 1 se, ao final, alguma
 * tabela esperada continuar sem system versioning.
 *
 * Privacidade: o script usa o singleton de `lib/prisma.ts` e imprime somente
 * o **nome do schema** selecionado. Nenhuma credencial e nenhum host de banco
 * são lidos, derivados ou exibidos.
 */
import db from '../lib/prisma.ts';
import { REVERTABLE_TABLES } from '../lib/revert/history.ts';

// O import acima é relativo, e não `@/lib/prisma`, por uma razão concreta:
// o type-stripping nativo do Node resolve especificadores ESM e **não** lê os
// `paths` do `tsconfig.json` — o alias `@/` não existe em runtime puro. O
// módulo importado continua sendo o singleton sancionado (SPECS.md §1.2); o
// que muda é só a forma de escrever o caminho para fora do bundle do Next.

type Situation = 'OK' | 'AUSENTE' | 'PENDENTE';

interface TableStatus {
  table: string;
  /** 'YES' quando a tabela é system-versioned, 'NO' quando não é. */
  systemVersioning: string | null;
  situation: Situation;
}

interface Options {
  apply: boolean;
  /** Quando presente, restringe a operação a uma única tabela do Revert. */
  onlyTable: string | null;
}

/** Nomes das tabelas que o Revert lê o histórico — fonte única: REVERTABLE_TABLES. */
function expectedTables(): string[] {
  return Object.keys(REVERTABLE_TABLES);
}

/**
 * Erro de uso — mensagem controlada por nós, sem nada do driver dentro.
 *
 * Existe para poder ser impresso: o `catch` do fim redacta tudo que não é
 * `UsageError`, porque mensagens do Prisma podem carregar fragmento do DSN. Um
 * erro de digitação do operador precisa de texto útil.
 */
class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

function parseArgs(argv: readonly string[]): Options {
  const options: Options = { apply: false, onlyTable: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--aplicar') {
      options.apply = true;
      continue;
    }

    if (arg === '--tabela') {
      const value = argv[index + 1];

      if (!value) {
        throw new UsageError('--tabela exige o nome de uma tabela.');
      }

      options.onlyTable = value;
      index += 1;
      continue;
    }

    throw new UsageError(
      `Opção desconhecida: ${arg}. Use --aplicar e/ou --tabela <nome>.`
    );
  }

  return options;
}

function quoteIdentifier(name: string): string {
  // Nomes de tabela não podem ser interpolados como literais. A lista vem de
  // REVERTABLE_TABLES e de um argumento de CLI: recusamos identificador fora do
  // formato estrito em vez de confiar no chamador.
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new UsageError(`Nome de tabela inválido: ${JSON.stringify(name)}`);
  }

  return `\`${name}\``;
}

/**
 * Lê se cada tabela do schema corrente é system-versioned.
 *
 * **Como o estado é lido:** por `information_schema.tables.TABLE_TYPE`, que vale
 * `'SYSTEM VERSIONED'` para uma tabela com `WITH SYSTEM VERSIONING` e
 * `'BASE TABLE'` para as demais. Cross-checkado com `SHOW CREATE TABLE` no
 * MariaDB 10.11.14: as duas fontes concordam.
 *
 * Existe uma pegadinha real aqui: a coluna `SYSTEM_VERSIONING` de
 * `information_schema.tables` **não existe** no MariaDB 10.11 — ela vem do
 * MySQL 8, cujas tabelas de sistema têm outro desenho. Consultá-la devolve
 * `ERROR 1054 (42S22): Unknown column 'SYSTEM_VERSIONING' in 'SELECT'`.
 * Por isso a consulta abaixo é feita por `TABLE_TYPE`.
 *
 * O filtro `TABLE_SCHEMA = DATABASE()` é o que mantém o script multi-banco:
 * ele pergunta ao schema que o `DATABASE_URL` já selecionou, sem que o nome
 * do schema precise ser repetido (ou exposto) no código.
 */
async function readStatus(tables: readonly string[]): Promise<Map<string, string | null>> {
  const placeholders = tables.map(() => '?').join(', ');

  const rows = await db.$queryRawUnsafe<Array<{ TABLE_NAME: string; TABLE_TYPE: string }>>(
    `SELECT TABLE_NAME, TABLE_TYPE
       FROM information_schema.tables
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN (${placeholders})`,
    ...tables
  );

  const found = new Map<string, string | null>();

  for (const row of rows) {
    found.set(row.TABLE_NAME, row.TABLE_TYPE === 'SYSTEM VERSIONED' ? 'YES' : 'NO');
  }

  return found;
}

function toStatus(table: string, systemVersioning: string | null): TableStatus {
  if (systemVersioning === null) {
    return { table, systemVersioning: null, situation: 'AUSENTE' };
  }

  return {
    table,
    systemVersioning,
    situation: systemVersioning === 'YES' ? 'OK' : 'PENDENTE',
  };
}

/**
 * Habilita o system versioning nas tabelas pendentes.
 *
 * Só entra aqui o que a leitura acima marcou como `PENDENTE` — daí a
 * idempotência. Tabela `AUSENTE` é ignorada de propósito: `ALTER TABLE` em
 * tabela inexistente só produziria um erro que mascara o problema real.
 */
async function applyPending(pending: readonly TableStatus[]): Promise<void> {
  for (const { table } of pending) {
    console.log(`  aplicando: ALTER TABLE ${quoteIdentifier(table)} ADD SYSTEM VERSIONING`);
    await db.$executeRawUnsafe(
      `ALTER TABLE ${quoteIdentifier(table)} ADD SYSTEM VERSIONING`
    );
  }
}

function printTable(statuses: readonly TableStatus[]): void {
  const header = ['TABELA', 'SYSTEM VERSIONING', 'SITUAÇÃO'];
  const rows = statuses.map((status) => [
    status.table,
    status.systemVersioning ?? '(ausente)',
    status.situation,
  ]);
  const widths = header.map((cell, column) =>
    Math.max(cell.length, ...rows.map((row) => row[column].length))
  );

  const line = (cells: readonly string[]) =>
    cells.map((cell, column) => cell.padEnd(widths[column])).join('  ');

  console.log(line(header));
  console.log(widths.map((width) => '-'.repeat(width)).join('  '));

  for (const row of rows) {
    console.log(line(row));
  }
}

function isResolved(status: TableStatus): boolean {
  return status.systemVersioning === 'YES';
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const all = expectedTables();

  if (options.onlyTable !== null && !all.includes(options.onlyTable)) {
    throw new UsageError(
      `Tabela '${options.onlyTable}' não é uma tabela do Revert. ` +
        `Esperadas: ${all.join(', ')}.`
    );
  }

  const tables = options.onlyTable === null ? all : [options.onlyTable];

  const schemaRows = await db.$queryRawUnsafe<Array<{ DATABASE_NAME: string | null }>>(
    'SELECT DATABASE() AS DATABASE_NAME'
  );
  const schema = schemaRows[0]?.DATABASE_NAME ?? null;

  console.log(
    `Schema inspecionado: ${schema ?? '(desconhecido)'} · ` +
      `modo: ${options.apply ? 'aplicar' : 'somente leitura'}`
  );

  const before = await readStatus(tables);
  const statuses = tables.map((table) => toStatus(table, before.get(table) ?? null));

  console.log('');
  printTable(statuses);
  console.log('');

  if (options.apply) {
    const pending = statuses.filter((status) => status.situation === 'PENDENTE');

    if (pending.length === 0) {
      console.log('Nada a aplicar.');
    } else {
      console.log(`Habilitando system versioning em ${pending.length} tabela(s):`);
      await applyPending(pending);
    }

    // Releitura: o estado final é sempre medido, nunca presumido.
    const after = await readStatus(tables);
    const final = tables.map((table) => toStatus(table, after.get(table) ?? null));

    console.log('');
    printTable(final);
    console.log('');
    check(final);
    return;
  }

  check(statuses);
}

/** Resumo final e código de saída — o que faz do script um check de CI. */
function check(statuses: readonly TableStatus[]): void {
  const unresolved = statuses.filter((status) => !isResolved(status));

  if (unresolved.length === 0) {
    const scope =
      statuses.length === 1
        ? `A tabela '${statuses[0].table}' está`
        : 'Todas as tabelas do Revert estão';

    console.log(`${scope} com system versioning habilitado.`);
    return;
  }

  const missing = unresolved.filter((status) => status.situation === 'AUSENTE');

  console.error(
    `FALHA: ${unresolved.length} tabela(s) do Revert sem system versioning: ` +
      unresolved.map((status) => status.table).join(', ') +
      '.'
  );

  if (missing.length > 0) {
    console.error(
      `As tabelas ausentes precisam existir antes: ${missing
        .map((status) => status.table)
        .join(', ')} (rode as migrations do Prisma).`
    );
  }

  console.error('Para corrigir: node scripts/garantir-system-versioning.ts --aplicar');
  process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    // Mensagem do driver pode carregar fragmento do DSN: só o que é nosso é
    // impresso por extenso, o resto fica no tipo.
    if (error instanceof UsageError) {
      console.error(`Erro de uso: ${error.message}`);
    } else {
      console.error(
        'Erro ao executar o script (verifique DATABASE_URL e a conectividade):',
        error instanceof Error ? error.name : 'desconhecido'
      );
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    // sempre fecha o pool, inclusive no caminho de erro — sem isto o processo
    // fica pendurado esperando o socket do MySQL.
    await db.$disconnect();
  });