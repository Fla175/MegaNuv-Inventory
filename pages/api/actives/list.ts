// pages/api/actives/list.ts
import { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/prisma";
import { getSessionUser, canViewValue } from "@/lib/apiAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    // Autenticação JWT
    const session = await getSessionUser(req);
    if (!session) return res.status(401).json({ error: "Sessão expirada." });

    const actives = await db.active.findMany({
      include: {
        category: true,
        createdBy: { select: { name: true, email: true } },
        fatherSpace: { select: { id: true, name: true } },
        parent: { select: { id: true, name: true } },
        _count: {
          select: { children: true }
        }
      },
      orderBy: { name: 'desc', },
    });

    // Etapa 1 da ADR-001: `fixedValue` não sai no payload para quem não pode
    // vê-lo — o gate de coluna da UI (ListSection.tsx) esconderia o valor, mas
    // o JSON continuaria entregando o patrimônio a qualquer cookie de VIEWER.
    // O mecanismo é redigir após o fetch em vez de `select` explícito: o
    // `findMany` sem `select` carrega todos os escalares que a UI consome
    // (notes, imageUrl, fileUrl, createdAt, ...), e enumerá-los à mão arriscaria
    // derrubar campos em silêncio. A intenção da ADR — campo ausente do JSON —
    // é a mesma. O `update` preserva o campo ausente (update.ts), então a
    // redação aqui não zera o valor num salvamento subsequente.
    const canView = canViewValue(session);

    const formatted = actives.map(({ fixedValue, ...rest }) => ({
      ...rest,
      ...(canView ? { fixedValue } : {}),
      childrenCount: rest._count?.children || 0,
      _count: undefined
    }));

    return res.status(200).json(formatted);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao listar ativos';
    return res.status(500).json({ error: message });
  }
}