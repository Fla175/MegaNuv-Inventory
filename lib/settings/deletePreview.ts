// lib/settings/deletePreview.ts
/**
 * Text shown before deleting a father space.
 *
 * `spaces` counts the root itself, so `spaces > 1` means there are children.
 */
export function buildSpaceDeleteMessage(actives: number, spaces: number): string {
  const assetsLabel =
    actives === 0
      ? "Nenhum ativo será excluído."
      : actives === 1
        ? "1 ativo será excluído permanentemente."
        : `${actives} ativos serão excluídos permanentemente.`;

  return spaces > 1
    ? `Tem certeza que deseja excluir este espaço pai e mais ${spaces - 1} espaço(s) filho(s)? ${assetsLabel}`
    : `Tem certeza que deseja excluir este espaço pai? ${assetsLabel}`;
}
