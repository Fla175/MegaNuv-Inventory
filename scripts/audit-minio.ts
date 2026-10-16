#!/usr/bin/env node
/**
 * scripts/audit-minio.ts
 *
 * Encontra objetos do bucket MinIO que **nenhuma linha do MariaDB referencia**
 * e, com confirmação explícita, os apaga. O bucket `inventory` acumula órfãos
 * (uploads de teste, exclusões que só removeram o registro do banco, anexos de
 * ativos removidos) e o bucket **não tem versioning** — apagar é irreversível e
 * um objeto perdido não volta por nenhum caminho do código.
 *
 * O que é referência viva, e por que são TRÊS colunas:
 *   `Active.fileUrl`      anexos, em DOIS formatos legados (JSON array OU CSV)
 *   `Active.imageUrl`     foto do ativo
 *   `FatherSpace.imageUrl` foto do local
 * Auditar só `fileUrl` apagaria fotos. A ordem de comparação também importa:
 * o **banco guarda a URL completa** e o **bucket guarda a chave nua**, então a
 * comparação passa obrigatoriamente por `getMinioKeyFromUrl()`.
 *
 * Uso (sem build, sem runner — Node 22 executa `.ts` por type-stripping):
 *
 *   node scripts/audit-minio.ts                          # só leitura (padrão)
 *   node scripts/audit-minio.ts --minutos 4320           # graça de 3 dias
 *   node scripts/audit-minio.ts --saida relatorio.json   # grava o relatório
 *   node scripts/audit-minio.ts --apagar --confirmar     # APAGA (ver abaixo)
 *
 * Opções: `--apagar`, `--confirmar`, `--minutos <n>` (padrão 1440 = 24 h),
 * `--bucket <nome>` (padrão `BUCKET_NAME` de `lib/minio.ts`), `--saida <arquivo>`.
 *
 * ⚠️ `--apagar` **exige** `--confirmar` junto. Os dois são necessários para que
 * nenhum comando de uma linha apague acidentalmente: o primeiro declara a
 * intenção, o segundo confirma que ela é séria. O relatório JSON é gravado
 * **antes** de qualquer remoção, para que a lista exista mesmo depois do
 * primeiro erro no meio de um lote.
 *
 * ⚠️ O período de graça (padrão 24 h) cobre uma corrida real: o upload termina
 * antes de o registro no banco commitar. Sem ele, um arquivo recém-enviado seria
 * classificado como órfão e apagado.
 *
 * Credencial: o auditor precisa de `ListBucket` para **enumerar** o bucket, e a
 * credencial da aplicação **não tem** — `inventory-policy.json` concede apenas
 * `GetObject`/`PutObject`/`DeleteObject`. Por isso este script prefere
 * `MINIO_AUDIT_ACCESS_KEY`/`MINIO_AUDIT_SECRET_KEY` (policy
 * `inventory-policy-auditor.json`, credencial separada, aplicada por ação
 * humana) e só cai para `MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY` com um aviso
 * explícito, porque esse fallback provavelmente falha com `AccessDenied` na
 * listagem. Ele não é um atalho seguro — é um diagnóstico.
 *
 * Os imports são relativos, e não `@/lib/...`: o type-stripping nativo do Node
 * resolve especificadores ESM e **não** lê os `paths` do `tsconfig.json`. O
 * módulo importado continua sendo o singleton sancionado (`SPECS.md` §1.2).
 *
 * Privacidade: o script não imprime credencial, endpoint nem DSN — apenas nomes
 * de objeto, que são dados de inventário e não segredo (`AGENTS.md` §3.1).
 */
import { writeFileSync } from "node:fs";
import * as Minio from "minio";
import db from "../lib/prisma.ts";
import { BUCKET_NAME } from "../lib/minio.ts";
import { collectReferencedKeys, findOrphans } from "../lib/mediaReferences.ts";

/** Objetos removidos por requisição ao MinIO. Lote único deixaria o processo pendurado em bucket grande. */
const DELETE_BATCH_SIZE = 100;

/** Janela de graça padrão: 24 h, o que cobre com folga upload-em-curso → commit. */
const DEFAULT_GRACE_MINUTES = 1440;

interface Options {
  delete: boolean;
  confirm: boolean;
  graceMinutes: number;
  bucket: string;
  reportPath: string | null;
}

class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

/**
 * Constrói o cliente com a credencial de auditoria.
 *
 * `lib/minio.ts` é importado só pelo `BUCKET_NAME`; o cliente é montado aqui
 * porque a chave pode ser a **de auditoria**. O `BUCKET_NAME` continua sendo a
 * fonte única do nome do bucket em vez de um literal repetido.
 */
function buildAuditClient(): Minio.Client {
  const accessKey = process.env.MINIO_AUDIT_ACCESS_KEY;
  const secretKey = process.env.MINIO_AUDIT_SECRET_KEY;

  if (accessKey && secretKey) {
    return buildClient(accessKey, secretKey);
  }

  const appAccessKey = process.env.MINIO_ACCESS_KEY;
  const appSecretKey = process.env.MINIO_SECRET_KEY;

  if (appAccessKey && appSecretKey) {
    console.warn(
      "AVISO: usando MINIO_ACCESS_KEY/MINIO_SECRET_KEY (credencial da aplicação).\n" +
        "       A policy da aplicação não tem ListBucket, então a listagem deve falhar\n" +
        "       com AccessDenied. Defina MINIO_AUDIT_ACCESS_KEY e\n" +
        "       MINIO_AUDIT_SECRET_KEY (policy: inventory-policy-auditor.json)."
    );
    return buildClient(appAccessKey, appSecretKey);
  }

  throw new UsageError(
    "Nenhuma credencial de auditoria encontrada. Defina MINIO_AUDIT_ACCESS_KEY e\n" +
      "MINIO_AUDIT_SECRET_KEY (recomendado) ou MINIO_ACCESS_KEY e MINIO_SECRET_KEY."
  );
}

function buildClient(accessKey: string, secretKey: string): Minio.Client {
  const endPoint = process.env.MINIO_ENDPOINT;

  if (!endPoint) {
    throw new UsageError("MINIO_ENDPOINT não está definida. Verifique o .env.");
  }

  return new Minio.Client({
    endPoint,
    port: Number(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey,
    secretKey,
  });
}

function parseArgs(argv: readonly string[]): Options {
  const options: Options = {
    delete: false,
    confirm: false,
    graceMinutes: DEFAULT_GRACE_MINUTES,
    bucket: BUCKET_NAME,
    reportPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--apagar") {
      options.delete = true;
      continue;
    }

    if (arg === "--confirmar") {
      options.confirm = true;
      continue;
    }

    if (arg === "--minutos") {
      const value = Number(argv[index + 1]);

      if (!Number.isInteger(value) || value < 0) {
        throw new UsageError("--minutos exige um inteiro >= 0.");
      }

      options.graceMinutes = value;
      index += 1;
      continue;
    }

    if (arg === "--bucket") {
      const value = argv[index + 1];

      if (!value) {
        throw new UsageError("--bucket exige um nome de bucket.");
      }

      options.bucket = value;
      index += 1;
      continue;
    }

    if (arg === "--saida") {
      const value = argv[index + 1];

      if (!value) {
        throw new UsageError("--saida exige um caminho de arquivo.");
      }

      options.reportPath = value;
      index += 1;
      continue;
    }

    throw new UsageError(
      `Opção desconhecida: ${arg}. Use --apagar --confirmar, --minutos <n>, ` +
        "--bucket <nome> e/ou --saida <arquivo>."
    );
  }

  if (options.delete && !options.confirm) {
    throw new UsageError(
      "--apagar exige --confirmar junto. Nenhum comando de uma linha apaga objeto\n" +
        "no bucket sem as duas flags."
    );
  }

  return options;
}

/**
 * Enumera o bucket recursivamente, capturando nome e `LastModified`.
 *
 * Recursivo (`recursive = true`) para que uma subpasta futura — `fotos/`,
 * `documentos/` — seja auditada sem mudança no script. `listObjects` emite um
 * objeto por entrada e, ao contrário de `listObjectsV2`, não devolve
 * "common prefixes" como se fossem objetos, o que evita um nome de diretório
 * na lista de órfãos.
 */
async function listObjectsWithAges(
  client: Minio.Client,
  bucket: string
): Promise<{ keys: string[]; ages: Map<string, Date | undefined> }> {
  const keys: string[] = [];
  const ages = new Map<string, Date | undefined>();

  await new Promise<void>((resolve, reject) => {
    const stream = client.listObjects(bucket, "", true);

    stream.on("data", (item: Minio.BucketItem) => {
      // `BucketItem` tipa `name` como opcional porque também descreve o prefixo
      // de uma listagem não recursiva; nesse stream toda entrada é objeto.
      if (!item.name) return;

      keys.push(item.name);
      ages.set(
        item.name,
        item.lastModified instanceof Date ? item.lastModified : undefined
      );
    });
    stream.on("end", resolve);
    stream.on("error", reject);
  });

  return { keys, ages };
}

interface Report {
  bucket: string;
  generatedAt: string;
  graceMinutes: number;
  graceCutoff: string;
  mode: "leitura" | "apagar";
  counts: {
    referencedKeys: number;
    objectsInBucket: number;
    orphans: number;
    protectedByGrace: number;
  };
  orphans: string[];
  protectedByGrace: string[];
}

/** Grava o relatório. Chamado ANTES de qualquer remoção, sempre que há `--saida`. */
function writeReport(options: Options, report: Report): void {
  if (!options.reportPath) return;

  writeFileSync(
    options.reportPath,
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8"
  );
  console.log(`Relatório gravado em ${options.reportPath}`);
}

function buildReport(
  options: Options,
  graceCutoff: Date,
  referencedKeys: number,
  objectsInBucket: number,
  orphans: string[],
  protectedByGrace: string[]
): Report {
  return {
    bucket: options.bucket,
    generatedAt: new Date().toISOString(),
    graceMinutes: options.graceMinutes,
    graceCutoff: graceCutoff.toISOString(),
    mode: options.delete ? "apagar" : "leitura",
    counts: {
      referencedKeys,
      objectsInBucket,
      orphans: orphans.length,
      protectedByGrace: protectedByGrace.length,
    },
    orphans,
    protectedByGrace,
  };
}

/**
 * Remove as chaves em lotes.
 *
 * Um `removeObjects` com hundreds de objetos numa requisição só deixa o processo
 * pendurado quando o bucket é grande, e a falha parcial fica difícil de
 * atribuir a um lote. Lotes de 100 dão um ponto de falha identificável.
 *
 * A API resolve com um resultado por objeto: entrada preenchida é **erro** de
 * remoção. Silenciar isso faria o script reportar sucesso depois de perder
 * metade dos órfãos, então a primeira falha interrompe o lote.
 */
async function deleteInBatches(
  client: Minio.Client,
  bucket: string,
  keys: string[]
): Promise<void> {
  for (let offset = 0; offset < keys.length; offset += DELETE_BATCH_SIZE) {
    const batch = keys.slice(offset, offset + DELETE_BATCH_SIZE);
    const results = await client.removeObjects(bucket, batch);

    const failure = results.find((result) => result?.Error);

    if (failure?.Error) {
      throw new Error(
        `Falha ao remover ${JSON.stringify(failure.Error.Key)}: ` +
          `${failure.Error.Code ?? "erro desconhecido"}`
      );
    }
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const graceCutoff = new Date(Date.now() - options.graceMinutes * 60_000);

  console.log(
    `Bucket: ${options.bucket} · modo: ${
      options.delete ? "APAGAR" : "somente leitura"
    } · ` +
      `graça: ${
        options.graceMinutes
      } min (preserva o que é mais novo que ${graceCutoff.toISOString()})`
  );

  // As três colunas que guardam referência — ver o cabeçalho.
  const [activeRows, fatherSpaceRows] = await Promise.all([
    db.active.findMany({ select: { fileUrl: true, imageUrl: true } }),
    db.fatherSpace.findMany({ select: { imageUrl: true } }),
  ]);

  const referencedKeys = collectReferencedKeys(activeRows, fatherSpaceRows);

  const client = buildAuditClient();
  const { keys, ages } = await listObjectsWithAges(client, options.bucket);

  const { orphans, protectedByGrace } = findOrphans({
    minioKeys: keys,
    referencedKeys,
    graceCutoff,
    objectAges: ages,
  });

  const report = buildReport(
    options,
    graceCutoff,
    referencedKeys.size,
    keys.length,
    orphans,
    protectedByGrace
  );

  console.log("");
  console.log(`Chaves referenciadas no banco : ${referencedKeys.size}`);
  console.log(`Objetos no bucket             : ${keys.length}`);
  console.log(`Órfãos                       : ${orphans.length}`);
  console.log(`Protegidos pelo período de graça: ${protectedByGrace.length}`);
  console.log("");

  // Relatório antes de remover: se o processo morrer no meio de um lote, a
  // lista do que foi pedido a remoção já está no disco.
  writeReport(options, report);

  if (!options.delete) {
    if (orphans.length > 0) {
      console.log(
        "Primeiros órfãos (use --saida relatorio.json para a lista completa):"
      );
      for (const key of orphans.slice(0, 20)) {
        console.log(`  ${key}`);
      }
      if (orphans.length > 20) {
        console.log(`  ... e mais ${orphans.length - 20}`);
      }
      console.log("");
      console.log("Nada foi removido. Para aplicar: --apagar --confirmar");
    } else {
      console.log("Nenhum órfão. Nada a fazer.");
    }

    return;
  }

  console.log(
    "⚠️  APAGANDO. O bucket não tem versioning: esta operação é IRREVERSÍVEL."
  );

  for (const key of orphans) {
    console.log(`  ${key}`);
  }

  console.log("");
  await deleteInBatches(client, options.bucket, orphans);
  console.log(`${orphans.length} objeto(s) removido(s).`);
}

main()
  .catch((error: unknown) => {
    if (error instanceof UsageError) {
      console.error(`Erro de uso: ${error.message}`);
    } else {
      // A mensagem do driver pode carregar endpoint ou DSN: só o tipo é
      // impresso por extenso.
      console.error(
        "Erro ao executar o script (verifique DATABASE_URL, MINIO_ENDPOINT e as",
        "credenciais de auditoria):",
        error instanceof Error ? error.name : "desconhecido"
      );
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
