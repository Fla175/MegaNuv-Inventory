// __tests__/lib/minio-delete.test.ts
//
// Regressão dos dois defeitos de `deleteFileFromMinio` (`lib/minio.ts`):
//
// 1. Subpasta apagava o arquivo errado: o banco guarda a URL completa, o bucket
//    guarda a chave. `split('/').pop()` devolvia só o nome do arquivo e o erro
//    sumia no `catch` mudo.
// 2. Link externo virava chave de deleção: `.../drive.google.com/file/d/x/view`
//    produzia `removeObject('inventory', 'view')` — remoção no bucket que o
//    usuário nunca pediu.
//
// O pacote `minio` é mockado para que `removeObject` seja um spy: nenhuma
// chamada real de rede acontece aqui. Os valores de `MINIO_*` semeados por
// `vitest.config.ts` (`test.env`) são fictícios e existem só porque
// `lib/minio.ts` chama `requireEnv()` no import.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const removeObject = vi.fn();

vi.mock('minio', () => ({
  Client: class {
    removeObject = removeObject;
  },
}));

const HOST = 'http://minio.example.com';

type DeleteFn = (url: string | null | undefined) => Promise<void>;

let deleteFileFromMinio: DeleteFn;

beforeEach(async () => {
  removeObject.mockReset();
  removeObject.mockResolvedValue(undefined);
  const mod = await import('@/lib/minio');
  deleteFileFromMinio = mod.deleteFileFromMinio;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('deleteFileFromMinio — extração da chave', () => {
  it('remove pelo nome do arquivo quando a URL não tem subpasta', async () => {
    await deleteFileFromMinio(`${HOST}/inventory/1792-foto.jpg`);

    expect(removeObject).toHaveBeenCalledTimes(1);
    expect(removeObject).toHaveBeenCalledWith('inventory', '1792-foto.jpg');
  });

  it('preserva a subpasta inteira na chave (regressão do defeito 1)', async () => {
    await deleteFileFromMinio(`${HOST}/inventory/subpasta/1792-foto.jpg`);

    expect(removeObject).toHaveBeenCalledWith('inventory', 'subpasta/1792-foto.jpg');
    expect(removeObject).not.toHaveBeenCalledWith('inventory', '1792-foto.jpg');
  });

  it('preserva subpasta profunda', async () => {
    await deleteFileFromMinio(`${HOST}/inventory/a/b/c/prod.pdf`);

    expect(removeObject).toHaveBeenCalledWith('inventory', 'a/b/c/prod.pdf');
  });

  it('funciona com https e com porta explícita no host', async () => {
    await deleteFileFromMinio('https://minio.test.local:9000/inventory/sub/foto.jpg');

    expect(removeObject).toHaveBeenCalledWith('inventory', 'sub/foto.jpg');
  });
});

describe('deleteFileFromMinio — link externo', () => {
  it('não remove nada para link do Google Drive (regressão do defeito 2)', async () => {
    await deleteFileFromMinio('https://drive.google.com/file/d/abc123/view');

    expect(removeObject).not.toHaveBeenCalled();
  });

  it('não remove nada para URL de outro bucket', async () => {
    await deleteFileFromMinio(`${HOST}/outros-bucket/sub/foto.jpg`);

    expect(removeObject).not.toHaveBeenCalled();
  });
});

describe('deleteFileFromMinio — entradas ausentes', () => {
  it('aceita null sem lançar e sem remover', async () => {
    await expect(deleteFileFromMinio(null)).resolves.toBeUndefined();
    expect(removeObject).not.toHaveBeenCalled();
  });

  it('aceita undefined sem lançar e sem remover', async () => {
    await expect(deleteFileFromMinio(undefined)).resolves.toBeUndefined();
    expect(removeObject).not.toHaveBeenCalled();
  });

  it('aceita string vazia sem lançar e sem remover', async () => {
    await expect(deleteFileFromMinio('')).resolves.toBeUndefined();
    expect(removeObject).not.toHaveBeenCalled();
  });
});

describe('deleteFileFromMinio — tolerância a falha', () => {
  it('não propaga o erro de removeObject e registra o motivo', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    removeObject.mockRejectedValue(new Error('NoSuchKey'));

    const url = `${HOST}/inventory/subpasta/1792-foto.jpg`;
    await expect(deleteFileFromMinio(url)).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledTimes(1);
    // A URL e o motivo entram no log; o erro do MinIO também.
    expect(warn.mock.calls[0][0]).toContain(url);
    expect(warn.mock.calls[0][0]).toContain('NoSuchKey');
  });

  it('não engole o erro de uma URL não-bucket: também não há o que apagar', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(deleteFileFromMinio('https://drive.google.com/file/d/x/view')).resolves.toBeUndefined();

    expect(warn).not.toHaveBeenCalled();
  });
});
