import { describe, it, expect } from 'vitest';
import { parseSystemVersioningError } from '@/lib/revert/errors';

/**
 * Detecção do erro MariaDB 4124 (`Table `X` is not system-versioned`), que é o
 * que quebrava `/api/database/revert` em produção.
 *
 * O bloco de sentinels no fim é a **garantia crítica** deste arquivo: o mesmo
 * `catch` do handler traduz `"UNAUTHORIZED"`, `"USER_NOT_FOUND"` e
 * `"STALE_REVERT_LIST"` em 401/401/409. Se `parseSystemVersioningError`
 * engolisse qualquer um deles, o usuário veria um 503 sobre system versioning
 * num problema de sessão ou de lista defasada.
 */

/** Reproduz o `PrismaClientKnownRequestError` do driver real. */
function prismaP2010(message: string, metaCode?: string | number) {
  const error = new Error(
    `Raw query failed. Code: \`4124\`. Message: \`${message}\``
  );
  Object.assign(error, { code: 'P2010', name: 'PrismaClientKnownRequestError' });

  if (metaCode !== undefined) {
    Object.assign(error, { meta: { code: metaCode, message } });
  }

  return error;
}

describe('parseSystemVersioningError — erro 4124 do MariaDB', () => {
  it('detecta o 4124 e extrai o nome da tabela', () => {
    const error = prismaP2010('Table `Active` is not system-versioned');

    expect(parseSystemVersioningError(error)).toEqual({ table: 'Active' });
  });

  it('extrai o nome entre aspas simples também', () => {
    const error = new Error(
      "Raw query failed. Code: `4124`. Message: `Table 'FatherSpace' is not system-versioned`"
    );

    expect(parseSystemVersioningError(error)).toEqual({ table: 'FatherSpace' });
  });

  it('4124 sem nome de tabela devolve { table: "" } para o chamador decidir a redação', () => {
    const error = new Error('Raw query failed. Code: `4124`. Message: `algo saiu errado`');

    expect(parseSystemVersioningError(error)).toEqual({ table: '' });
  });

  it('detecta pelo meta.code do Prisma quando a mensagem não traz o rótulo Code:', () => {
    const error = Object.assign(new Error('falha na raw query'), {
      code: 'P2010',
      meta: { code: '4124', message: 'Table `Category` is not system-versioned' },
    });

    expect(parseSystemVersioningError(error)).toEqual({ table: 'Category' });
  });

  it('aceita meta.code numérico (o driver pode entregar number)', () => {
    const error = Object.assign(new Error('falha na raw query'), {
      meta: { code: 4124 },
    });

    expect(parseSystemVersioningError(error)).toEqual({ table: '' });
  });

  it('detecta a partir de meta.code quando a mensagem traz o nome da tabela', () => {
    const error = Object.assign(new Error('Table `Active` is not system-versioned'), {
      meta: { code: '4124' },
    });

    expect(parseSystemVersioningError(error)).toEqual({ table: 'Active' });
  });
});

describe('parseSystemVersioningError — sentinels do handler (garantia crítica)', () => {
  it.each(['UNAUTHORIZED', 'USER_NOT_FOUND', 'STALE_REVERT_LIST'])(
    'não captura o sentinel %s (senão viraria 503 em vez de 401/401/409)',
    (message) => {
      expect(parseSystemVersioningError(new Error(message))).toBeNull();
    }
  );

  it('não captura sentinel mesmo com code/meta que não é 4124', () => {
    const error = Object.assign(new Error('STALE_REVERT_LIST'), {
      meta: { code: 'P2025' },
    });

    expect(parseSystemVersioningError(error)).toBeNull();
  });
});

describe('parseSystemVersioningError — qualquer outro erro é null', () => {
  it('outro erro do Prisma', () => {
    const error = Object.assign(new Error('Record to update not found.'), {
      code: 'P2025',
      meta: { code: 'P2025' },
    });

    expect(parseSystemVersioningError(error)).toBeNull();
  });

  it('erro genérico de aplicação', () => {
    expect(parseSystemVersioningError(new Error('Erro interno ao processar a reversão.'))).toBeNull();
  });

  it('mensagem que contém 4124 fora do rótulo Code: não dispara (evita falso positivo)', () => {
    const error = new Error('registro 4124 do lote foi descartado');

    expect(parseSystemVersioningError(error)).toBeNull();
  });

  it('mensagem com Code: de outro código do MariaDB', () => {
    const error = new Error('Raw query failed. Code: `1064`. Message: `erro de sintaxe`');

    expect(parseSystemVersioningError(error)).toBeNull();
  });

  it('mensagem "is not system-versioned" sem o código 4124 não dispara', () => {
    const error = new Error('Table `Active` is not system-versioned');

    expect(parseSystemVersioningError(error)).toBeNull();
  });
});

describe('parseSystemVersioningError — entradas degeneradas não lançam', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['string solta', 'Table `Active` is not system-versioned'],
    ['string com 4124 solta', 'Raw query failed. Code: `4124`'],
    ['número', 4124],
    ['booleano', true],
    ['array', ['Table `Active` is not system-versioned']],
    ['objeto vazio', {}],
    ['meta vazio', { meta: null }],
    ['meta sem code', { meta: { message: 'Table `Active` is not system-versioned' } }],
    ['message não-string', { message: 4124 }],
  ])('%s → null', (_label, input) => {
    expect(parseSystemVersioningError(input)).toBeNull();
  });

  it('meta com code não-string (ex.: objeto) não dispara', () => {
    expect(parseSystemVersioningError({ meta: { code: { number: 4124 } } })).toBeNull();
  });
});