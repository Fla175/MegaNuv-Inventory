# Change Log - 10 Novas Tasks Implementadas

## Task 1: Nomenclatura "Enviar Documento"
- **Arquivo**: `components/actives/activeForm.tsx`
- **Mudança**: Alterado label do componente FileUpload de "Documento" para "Enviar Documento"

## Task 2: Auto-carregar usuário no login
- **Arquivos**: 
  - `pages/login.tsx` - Adiciona flag no localStorage após login
  - `lib/context/UserContext.tsx` - Força refresh do contexto quando detecta flag
- **Mudança**: Usuário é automaticamente recarregado após fazer login

## Task 3: Campos opcionais no Espaço Pai
- **Arquivos**:
  - `prisma/schema.prisma` - Adicionados campos imageUrl, address, responsible, phone
  - `pages/api/father-spaces/create.ts` - Tratamento dos novos campos
  - `pages/api/father-spaces/update.ts` - Tratamento dos novos campos
  - `pages/settings.tsx` - Interface e modal atualizados com ImageUpload e novos campos

## Task 4: Esconder botão de categorias (limite 18)
- **Arquivos**:
  - `pages/settings.tsx` - Botão de criar categoria oculto quando count >= 18
  - `components/actives/activeForm.tsx` - Já existia lógica similar (mantida)

## Task 5: Layout.tsx - Botão logout e versão visíveis
- **Arquivo**: `components/Layout.tsx`
- **Status**: Apenas verificação - já estava implementado corretamente com flexbox e shrink-0

## Task 6: Alerta de confirmação de ações
- **Arquivo**: `pages/settings.tsx`
- **Mudança**: Mensagens de confirmação mais descritivas para cada tipo de exclusão (usuário, espaço, categoria, logs)

## Task 7: Campo SKU no formulário de ativos
- **Arquivos**:
  - `components/actives/activeForm.tsx` - Campo SKU adicionado no formulário
  - `pages/api/actives/create.ts` - Tratamento do campo sku na criação

## Task 8: Ações de ativos mantendo caminho
- **Verificação**: O código já estava correto, a API de move utiliza fatherSpaceId e parentId corretamente

## Task 9: Clonagem de ativos para caminho correto
- **Arquivo**: `components/ListSection.tsx`
- **Mudança**: handleCloneClick agora preserva fatherSpaceId e parentId do item original

## Task 10: Usar ImageUpload no formulário de espaços
- **Arquivo**: `pages/settings.tsx`
- **Mudança**: Substituído input de texto por componente ImageUpload para o campo imageUrl

---

**Data**: 2026-04-19  
**Versão**: 2.0.0  
**Total de tasks**: 10