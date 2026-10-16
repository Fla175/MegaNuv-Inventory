// lib/mediaReferences.ts
//
// Módulo PURO de reconhecimento de referência de mídia. Sem I/O, sem Prisma,
// sem Next e sem MinIO: tudo aqui é função determinística sobre strings e
// `Date`, para poder ser testado sem tocar em banco nem em bucket.
//
// Existe por dois motivos concretos:
//
// 1. `Active.fileUrl` guarda **dois formatos legados** na mesma coluna TEXT
//    (`SPECS.md` §4.1): JSON array (`["http://.../a.pdf","http://.../b.pdf"]`,
//    gravado por dados antigos) ou CSV (`http://.../a.pdf,http://.../b.pdf`,
//    gravado por `pages/api/actives/update.ts`). A lógica de leitura estava
//    duplicada e este módulo é a cópia única — a leitura do QR Code e a
//    auditoria de órfãos precisam concordar, senão a auditoria apaga anexo que
//    a tela ainda mostra.
//
// 2. O banco guarda a **URL completa**, e o bucket guarda a **CHAVE NUA**:
//    banco `http://host/inventory/1792...-D_NQ_NP_2X.pdf` vs bucket
//    `1792...-D_NQ_NP_2X.pdf`. Comparar os dois sem normalizar produziria
//    "órfão" para todo objeto do bucket. A normalização é
//    `getMinioKeyFromUrl()` de `lib/mediaUrl.ts` — reutilizada, não reescrita.
// A extensão `.ts` no import é necessária, e não descuido: o type-stripping
// nativo do Node resolve especificadores ESM e **não** faz a resolução de
// bundler que o Next faz, então `'./mediaUrl'` só acha o arquivo dentro do
// bundle. `scripts/auditar-orfãos.ts` importa este módulo direto pelo Node
// (`allowImportingTsExtensions` em `tsconfig.json` autoriza a forma).
import { getMinioKeyFromUrl } from './mediaUrl.ts';

/**
 * Lê `Active.fileUrl` nos dois formatos legados e devolve a lista de URLs.
 *
 * Ordem de tentativa: JSON array → CSV. A distinção é necessária porque uma
 * URL é uma string sem vírgula, o que a torna indistinguível de um CSV de um
 * elemento só; e um JSON array é inconfundível pelo `[`.
 *
 * **Nunca lança.** Um único registro com `fileUrl` corrompido não pode derrubar
 * uma auditoria que varre a tabela inteira — o pior resultado possível seria
 * abortar antes de listar o bucket e devolver um relatório incompleto sem o
 * dizer. `JSON.parse` é a única operação capaz de lançar aqui e ela é sempre
 * capturada; entradas não são validadas como URL porque quem valida é
 * `getMinioKeyFromUrl`, mais abaixo.
 */
export function parseFileUrls(fileUrl: string | null | undefined): string[] {
  if (!fileUrl) return [];

  const urls = readAsJsonArray(fileUrl) ?? readAsCsv(fileUrl);

  // Dedup preservando a ordem: o mesmo anexo pode ter sido gravado duas vezes
  // no CSV, e duplicata aqui viraria duas linhas iguais no relatório.
  return Array.from(new Set(urls));
}

/** `null` quando não é JSON array — o chamador cai para o CSV. */
function readAsJsonArray(fileUrl: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(fileUrl);

    // JSON válido que não é array (`"a"`, `123`, `null`, `{...}`) é valor
    // legado inesperado: cai no CSV, que é a interpretação mais permissiva e a
    // que preserva a string em vez de perdê-la.
    return Array.isArray(parsed) ? parsed.map(String) : null;
  } catch {
    return null;
  }
}

function readAsCsv(fileUrl: string): string[] {
  return fileUrl
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Linha de `Active` com as duas colunas que guardam mídia. */
export interface ActiveMediaRow {
  fileUrl?: string | null;
  imageUrl?: string | null;
}

/** Linha de `FatherSpace` — só `imageUrl` guarda mídia. */
export interface FatherSpaceMediaRow {
  imageUrl?: string | null;
}

/**
 * Junta as TRÊS colunas que guardam referência viva de mídia e devolve o
 * conjunto de chaves do MinIO citadas pelo banco.
 *
 * São três, não uma, e auditar só `fileUrl` apagaria fotos:
 * `Active.fileUrl` (anexos), `Active.imageUrl` (foto do ativo) e
 * `FatherSpace.imageUrl` (foto do local).
 *
 * URL que não pertence ao bucket — link externo do Google Drive, por exemplo —
 * produz `null` em `getMinioKeyFromUrl` e é ignorada: não há objeto no MinIO
 * correspondente, então ela não protege nem condena nada.
 */
export function collectReferencedKeys(
  activeRows: readonly ActiveMediaRow[],
  fatherSpaceRows: readonly FatherSpaceMediaRow[]
): Set<string> {
  const keys = new Set<string>();

  for (const row of activeRows) {
    for (const url of [row.imageUrl, ...parseFileUrls(row.fileUrl)]) {
      addKey(keys, url);
    }
  }

  for (const row of fatherSpaceRows) {
    addKey(keys, row.imageUrl);
  }

  return keys;
}

function addKey(keys: Set<string>, url: string | null | undefined): void {
  const key = url ? getMinioKeyFromUrl(url) : null;

  if (key) {
    keys.add(key);
  }
}

/** LastModified de cada objeto, ou `undefined` quando o bucket não o informou. */
export type ObjectAges = ReadonlyMap<string, Date | undefined>;

export interface FindOrphansArgs {
  /** Todas as chaves do bucket, enumeradas recursivamente. */
  minioKeys: readonly string[];
  /** Chaves citadas pelo banco — saída de `collectReferencedKeys`. */
  referencedKeys: ReadonlySet<string>;
  /** Objetos **mais novos** que isto são preservados. */
  graceCutoff: Date;
  /** LastModified de cada objeto do bucket. */
  objectAges: ObjectAges;
}

export interface FindOrphansResult {
  /** Órfãos verdadeiros: sem referência no banco e mais velhos que a graça. */
  orphans: string[];
  /** Preservados pelo período de graça — podem não ser órfãos ainda. */
  protectedByGrace: string[];
}

/**
 * Decide o que é órfão.
 *
 * Um objeto é órfão quando **as duas** condições valem: não está em
 * `referencedKeys` **e** é mais velho que `graceCutoff`.
 *
 * O período de graça existe por causa de uma corrida real, não por vaidade:
 * o upload termina antes de o registro no banco commitar, e uma auditoria sem
 * janela classificaria esse arquivo recém-enviado como órfão e o apagaria.
 * Por isso o padrão é 24 h (`--minutos 1440`).
 *
 * LastModified ausente ou inválido é tratado como **protegido**: sem data não
 * há como provar que o objeto é antigo, e "não apagar o que não dá para
 * datar" é a escolha que faz deste script seguro de rodar em produção.
 */
export function findOrphans({
  minioKeys,
  referencedKeys,
  graceCutoff,
  objectAges,
}: FindOrphansArgs): FindOrphansResult {
  const orphans: string[] = [];
  const protectedByGrace: string[] = [];

  for (const key of minioKeys) {
    if (referencedKeys.has(key)) continue;

    const lastModified = objectAges.get(key);
    const age = lastModified instanceof Date ? lastModified.getTime() : Number.NaN;

    if (Number.isNaN(age) || age >= graceCutoff.getTime()) {
      protectedByGrace.push(key);
      continue;
    }

    orphans.push(key);
  }

  return { orphans, protectedByGrace };
}
