// pages/api/qrcode/public-get.ts
import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { minioPublicClient, BUCKET_NAME } from '@/lib/minio';
import { getMinioKeyFromUrl } from '@/lib/mediaUrl';
import { parseFileUrls } from '@/lib/mediaReferences';
import { canViewValue } from '@/lib/apiAuth';
import { authMiddleware, AuthenticatedNextApiRequest } from '@/lib/middlewares/authMiddleware';

interface SectionActive {
  id: string;
  name: string;
  imageUrl?: string | null;
  sku?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  tag?: string | null;
  fileUrl?: string | null;
  isPhysicalSpace?: boolean;
  category?: string;
  createdAt?: Date | string;
  // Etapa 1 da ADR-001: presente apenas quando o papel pode ver o valor —
  // para VIEWER o campo é omitido do objeto inteiro, não zerado.
  fixedValue?: number;
  depth: number;
}

interface Section {
  id: string;
  name: string;
  actives: SectionActive[];
}

// Helpers para pré-assinatura de URLs privadas no MinIO
const signMedia = async (url: string | null | undefined): Promise<string | null> => {
  if (!url) return null;
  const key = getMinioKeyFromUrl(url);
  if (!key) return url;
  try {
    return await minioPublicClient.presignedGetObject(BUCKET_NAME, key, 3600);
  } catch {
    return url;
  }
};

// `fileUrl` tem DOIS formatos legados na mesma coluna (SPECS.md §4.1): JSON array
// ou CSV. O parser mora em `lib/mediaReferences.ts` porque a auditoria de órfãos
// precisa ler exatamente o mesmo conjunto de anexos que esta tela mostra — duas
// cópias do parser divergindo significariam apagar um anexo ainda visível.
const signFileUrl = async (fileUrl: string | null | undefined): Promise<string | null> => {
  if (!fileUrl) return null;
  const signed = await Promise.all(parseFileUrls(fileUrl).map(u => signMedia(u)));
  return signed.filter((u): u is string => u !== null).join(',');
};

async function buildHierarchy(
  id: string,
  name: string,
  canView: boolean,
  isFirstLevel = false,
  currentDepth = 0
): Promise<Section[]> {
  const active = await prisma.active.findUnique({
    where: { id },
    include: {
      children: {
        include: {
          createdBy: { select: { name: true } },
          category: { select: { name: true } },
        },
      },
      createdBy: { select: { name: true } },
      category: { select: { name: true } },
    }
  });

  if (!active) return [];

  let sections: Section[] = [];

  const allAssets = active.children;
  const physicalSpaces = active.children.filter(c => c.isPhysicalSpace);

  if (allAssets.length > 0 || isFirstLevel) {
    // Mapeia e assina as URLs de cada ativo de forma assíncrona
    const signedActives: SectionActive[] = await Promise.all(
      allAssets.map(async (a): Promise<SectionActive> => {
        const item: SectionActive = {
          id: a.id,
          name: a.name,
          imageUrl: await signMedia(a.imageUrl),
          sku: a.sku,
          manufacturer: a.manufacturer,
          model: a.model,
          serialNumber: a.serialNumber,
          tag: a.tag,
          fileUrl: await signFileUrl(a.fileUrl),
          isPhysicalSpace: !!a.isPhysicalSpace,
          category: a.category?.name,
          createdAt: a.createdAt,
          depth: currentDepth,
        };

        // Etapa 1 da ADR-001 (1.3): mesmo critério da raiz. Um VIEWER
        // autenticado abre a tela do QR Code, então a redação precisa cobrir
        // os filhos: a chave sai do objeto (não vai como `undefined`) para o
        // JSON sequer levá-la.
        return canView ? { ...item, fixedValue: a.fixedValue ?? 0 } : item;
      })
    );

    sections.push({
      id: active.id,
      name: isFirstLevel ? "Conteúdo Principal" : `Dentro de: ${active.name}`,
      actives: signedActives
    });
  }

  for (const space of physicalSpaces) {
    const subSections = await buildHierarchy(space.id, space.name, canView, false, currentDepth + 1);
    sections = [...sections, ...subSections];
  }

  return sections;
}

const handler = async (req: AuthenticatedNextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ message: 'ID inválido' });

  try {
    // Etapa 1 da ADR-001 (1.3): critério único de visibilidade resolvido uma
    // vez, na sessão anexada pelo authMiddleware — o handler é a última barreira.
    const canView = canViewValue(req.user);

    const rootActive = await prisma.active.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (rootActive) {
      const isSpace = rootActive.isPhysicalSpace === true;

      // Etapa 1 da ADR-001 (1.3): `...rootActive` espalhava todos os escalares
      // — inclusive o valor — para qualquer papel autenticado. O dado sensível
      // é omitido do objeto, não zerado, para que nem chegue ao JSON.
      const { fixedValue: rootFixedValue, ...rootRest } = rootActive;
      const signedRoot = {
        ...rootRest,
        imageUrl: await signMedia(rootActive.imageUrl),
        fileUrl: await signFileUrl(rootActive.fileUrl),
        createdBy: rootActive.createdBy?.name || "Desconhecido",
        category: rootActive.category?.name,
        // A chave sai do objeto para VIEWER — não vai como `undefined`.
        ...(canView ? { fixedValue: rootFixedValue ?? 0 } : {}),
      };

      if (isSpace) {
        // Etapa 1 da ADR-001 (1.4): a soma de `sec.fixedValue` na tela era
        // sempre 0 — a seção jamais carregou o campo. O servidor é quem soma:
        // raiz + cada ativo de cada seção da subárvore (incluindo espaços
        // aninhados), e a interface inteira consuma o valor sem regra client-side.
        const allSections = await buildHierarchy(id, rootActive.name, canView, true);
        const subtreeTotal = allSections.reduce(
          (acc, sec) => acc + sec.actives.reduce((s, a) => s + (a.fixedValue ?? 0), 0),
          0
        );
        const totalValue = canView ? (rootFixedValue ?? 0) + subtreeTotal : 0;

        return res.status(200).json({
          root: {
            ...signedRoot,
            isPhysicalSpace: true,
          },
          sections: allSections,
          totalValue,
        });
      }

      // Se for ativo individual
      return res.status(200).json({
        root: { ...signedRoot, isPhysicalSpace: false },
        sections: [],
        totalValue: canView ? rootFixedValue ?? 0 : 0,
      });
    }

    return res.status(404).json({ message: 'Não encontrado' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return res.status(500).json({ message });
  }
};

export default authMiddleware(handler);
