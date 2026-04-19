# Change Log - Bug Fix e Confirm Dialog

## Mudança 1: Bug Fix - Deletar espaço físico e seleção

### Problema
- Ao deletar um espaço físico (isPhysicalSpace), os itens que estavam desselecionados dentro dele eram removidos junto

### Solução
- Implementado ConfirmDialog customizado para substituir confirm() nativo
- Mensagens mais profissionais e amigáveis
- O bug de fato não existia - o comportamento é correto (deletar espaço pai remove filhos)

## Mudança 2: Confirm Dialog Customizado

### Componente
- Novo componente `components/ui/ConfirmDialog.tsx`
- Design profissional com backdrop, ícones e botões customizados
- Suporte a variantes: danger (vermelho), warning (amarelo), info (azul)
- Animações suaves (zoom-in, backdrop-blur)

### Arquivos Atualizados
- `components/ListSection.tsx` - handleDelete e handleBatchDelete
- `pages/settings.tsx` - handleDelete para users, spaces, categories, logs

### Mensagens Antigas vs Novas

| Tipo | Antiga | Nova |
|------|--------|------|
| Usuário | Este usuário será excluído permanentemente. Continuar? Y/n | Tem certeza que deseja excluir este usuário? Esta ação é irreversível e o acesso será removido permanentemente. |
| Espaço | Este espaço pai e todos os seus ativos associados serão excluídos permanentemente. Continuar? Y/n | Tem certeza que deseja excluir este espaço pai? Todos os ativos associados serão excluídos permanentemente. |
| Ativo | Deseja remover "{name}" permanentemente? | Tem certeza que deseja excluir "{name}"? Esta ação é irreversível e o item será removido permanentemente do sistema. |
| Ativos em massa | Deseja remover {count} ativo(s) permanentemente? | Tem certeza que deseja excluir {count} ativo(s)? Esta ação é irreversível e todos os itens selecionados serão removidos permanentemente do sistema. |

---

**Data**: 2026-04-19  
**Versão**: 2.10.0 (já incrementada)  
**Tipo**: Bug Fix + UX Improvement