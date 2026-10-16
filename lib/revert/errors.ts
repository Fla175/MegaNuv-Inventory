/**
 * lib/revert/errors.ts
 *
 * Reconhece o erro do MariaDB que quebra o Revert em produção: código **4124**
 * — `Table `X` is not system-versioned`.
 *
 * Contexto do incidente: as tabelas reversíveis foram criadas sem
 * `WITH SYSTEM VERSIONING`, então o `FOR SYSTEM_TIME AS OF` que o Revert exige
 * não tem o que ler. O Prisma embrulha a falha do driver em
 * `PrismaClientKnownRequestError` com `code: 'P2010'` e a mensagem crua do
 * banco — `Raw query failed. Code: `4124`. Message: `Table `Active` is not
 * system-versioned``. Sem tratamento, isso virava 500 genérico com stack no
 * corpo da resposta.
 *
 * Módulo **puro**: nenhum I/O, nenhum Prisma, nenhum Next. É por ser puro que
 * a detecção é testável sem banco (`__tests__/lib/revert-errors.test.ts`).
 *
 * **Contrato com o chamador:** devolve `null` para qualquer erro que não seja
 * o 4124, e nunca lança. O `catch` de `pages/api/database/revert.ts` convive
 * com erros *deliberados* de sentinel — `"UNAUTHORIZED"`, `"USER_NOT_FOUND"`,
 * `"STALE_REVERT_LIST"` — que produzem 401/401/409. Nenhum deles carrega o
 * código 4124, então nenhum pode ser capturado aqui.
 */

/** Código de erro do MariaDB para "a tabela não tem WITH SYSTEM VERSIONING". */
export const MARIADB_NOT_SYSTEM_VERSIONED_CODE = '4124';

/** Tabela sem nome utilizável — o chamador decide a redação. */
export interface SystemVersioningError {
  table: string;
}

/**
 * `Code: `4124`` — o Prisma embrulha o código do banco entre crases.
 * Aceita aspas simples/double porque o formato não é estável entre drivers.
 */
const CODE_IN_MESSAGE = /Code:\s*[`'"]?4124\b/;

/** ``Table `Active` is not system-versioned``; idem para aspas simples. */
const TABLE_IN_MESSAGE = /Table [`'`]([^`']+)[`'] is not system-versioned/;

/**
 * O `meta` do `PrismaClientKnownRequestError` carrega o código do banco
 * (`{ code: '4124', message: '...' }`). O driver pode entregá-lo como string
 * **ou** como número, dependendo do driver — ambos são aceitos.
 */
function metaCarriesCode(meta: unknown): boolean {
  if (typeof meta !== 'object' || meta === null) {
    return false;
  }

  const { code } = meta as { code?: unknown };

  return code === MARIADB_NOT_SYSTEM_VERSIONED_CODE || code === 4124;
}

/**
 * A mensagem só. Primitivos (`null`, `undefined`, string solta) não têm
 * `.message` e por isso nunca são tratados como erro do Revert — é o que
 * mantém esta função inócua para os sentinels de auth, que são sempre
 * `Error` com mensagem curta e sem código.
 */
function readMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return '';
  }

  const { message } = error as { message?: unknown };

  return typeof message === 'string' ? message : '';
}

/**
 * Extrai a informação de system versioning do erro, se for o 4124.
 *
 * O código é procurado em **duas** fontes independentes — o campo `Code:` da
 * mensagem e o `meta.code` do Prisma — e basta uma delas confirmar. A regex
 * é ancorada no rótulo `Code:` (não é uma busca solta por "4124"), então um
 * número qualquer dentro de outra mensagem não dispara o falso positivo.
 *
 * @returns `{ table }` com o nome da tabela quando o erro o traz (em `message`
 *          ou em `meta.message`), `{ table: '' }` quando o 4124 veio sem nome,
 *          ou `null` se o erro não for o 4124.
 */
export function parseSystemVersioningError(
  error: unknown
): SystemVersioningError | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const message = readMessage(error);
  const meta = (error as { meta?: unknown }).meta;

  const isSystemVersioningFailure =
    CODE_IN_MESSAGE.test(message) || metaCarriesCode(meta);

  if (!isSystemVersioningFailure) {
    return null;
  }

  // O Prisma repete o texto do banco em `message` e em `meta.message`. A
  // mesma regex ancorada é aplicada nos dois: só o texto real do driver passa.
  const metaMessage =
    typeof meta === 'object' && meta !== null
      ? (meta as { message?: unknown }).message
      : undefined;

  const table =
    TABLE_IN_MESSAGE.exec(message) ??
    (typeof metaMessage === 'string' ? TABLE_IN_MESSAGE.exec(metaMessage) : null);

  return { table: table ? table[1] : '' };
}