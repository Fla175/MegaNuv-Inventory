# .planning/stages/03-list-section-space-detail/SPEC.md

## Requisitos (falsificáveis)

R1. Clicar no nome ou no corpo do card de um espaço-pai em `ListSection` abre um **modal de visualização** dos dados desse espaço (nome, endereço, responsável, telefone e foto), idêntico em comportamento ao `ItemDetailModal` dos ativos (abre/fecha com `Esc` e com o botão X).

R2. Um elemento com ícone ao lado do nome do espaço-pai **expande ou colapsa** os ativos contidos naquele espaço (toggle de `expandedNodes[space.id]`), sem navegar e sem abrir o modal.

R3. O modal exibe: foto do espaço, nome, endereço, nome do responsável e número de telefone. Campos vazios mostram texto descritivo ("Não informado" ou similar), nunca quebram o layout.

R4. O modal é **somente leitura**. Um botão de **edição** aparece apenas para `DIRECTOR` e `ADMIN`; ao clicar, dispara o handler de edição de espaço (prop `onEditSpace`) sem fechar o modal automaticamente (decisão da página chamada).

R5. `VIEWER` pode abrir o modal (readonly) e não vê o botão de edição.

R6. Não quebra a listagem de ativos existente: `ItemDetailModal`, `PrintLabelModal`, `MoveModal`, `CloneBatchModal`, `SelectionToolbar`, `ConfirmDialog`, filtro hierárquico, seleção e longo pressionar continuam funcionando.

R7. Os dados do espaço-vistado vêm de um novo endpoint `GET /api/father-spaces/[id]` que retorna os campos completos do banco (incluindo `address`, `responsible`, `phone`, `imageUrl`). Retorna `404` quando o espaço não existe.

## Condição de saída da etapa

- `yarn lint` → 0 erros / 0 avisos
- `npx tsc --noEmit` → 0 erros
- `yarn test` → suíte verde (incluindo teste do novo endpoint)
- `yarn build:opt` → build standalone bem-sucedido
- Teste manual: clicar no espaço-pai abre o modal com foto/endereço/responsável/telefone; ícone ao lado expande/colapsa; VIEWER não vê botão de edição.
