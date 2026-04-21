---
name: inventory 2.0
description: Objetivo de aprimorar a aplicação com correções de bugs, melhorias de UX, novas funcionalidades e refinamento de componentes, mantendo a estabilidade e desempenho.
for: Flávio Freires Pomin
tags: Ação necessária
date-mode: DD-MM-YY
created-at: 20-02-26
modificated-at: 07-04-26
---

# Quadro KanBan Inventory 2.0

## Objetivo da Release:

Aprimorar a aplicação com correções de bugs, melhorias de UX, novas funcionalidades e refinamento de componentes, mantendo a estabilidade e desempenho.

## 1. Arquitetura e Componentização (Frontend)

- [x] Junção das páginas index.tsx, inventory-view.tsx, catalog.tsx e actives.tsx em 1 index.tsx.
- [x] Modularização da Página Principal (index.tsx): Transformação em orquestrador de estado e filtros globais.
- [x] Criação do SearchSection: Centralização de busca textual e filtros avançados (Área, Categoria, Status).
- [x] Implementação do ListSection: Visualização de dados em formato de árvore (TreeView) agrupada por Espaços Pai.
- [x] Desenvolvimento do activeForm: Componente unificado para criação, edição e clonagem de registros.
- [x] NOVO Correção da Hierarquia e Contagem (ListSection): Ajuste na renderização da árvore para contar corretamente os ativos diretos, ignorando sub-espaços físicos (isPhysicalSpace).
- [x] ATUALIZADO Sistema de Toast Notifications: Implementação de sistema global de notificações com 4 tipos (success/error/warning/info).

## 2. Lógica de Negócio e Workflow

- [x] Separação de Áreas de Foco: Implementação inicial das 4 áreas de foco (Energética, Redes, Servidor, Manutenção).
- [x] ATUALIZADO Refatoração de Áreas de Foco: Transição da lógica de Enum estático para leitura dinâmica do banco de dados, permitindo a criação de novas áreas pelo usuário (model Category com 18 cores pastel).
- [x] Mecanismo de Clonagem Inteligente: Lógica para clonar ativos limpando automaticamente campos únicos (Número de Série e IDs).
- [x] Gestão de Empty States: Feedback visual técnico para bases vazias ou resultados de busca inexistentes.
- [x] Limpeza Técnica: Remoção de estados obsoletos e otimização de renderização com useMemo.
- [x] ATUALIZADO Controle de Limite de Categorias: Validação no backend para impedir criação além de 18 categorias.
- [x] ATUALIZADO Correção de Termos: Substituição universal de "área" por "categoria" no código, comentários e IDs.

## 3. Interface e UX

- [x] Menu de Contexto Customizado: Ações rápidas (Abrir Detalhes, Editar, Clonar, Mover, Excluir) via botão direito ou clique longo.
- [x] NOVO Menu de Contexto Inteligente: Implementação de cálculo de colisão com o viewport para evitar que o menu saia da tela ou cubra elementos ao ser aberto nas bordas.
- [x] Padronização Visual MegaNuv: Aplicação de tipografia font-black (e italic para títulos), cantos arredondados (2rem) e paleta de cores técnica.
- [x] Sincronização de Filtros: Comunicação em tempo real entre a barra de busca e a listagem hierárquica.
- [x] NOVO Modal de Movimentação Otimizado: Filtro para exibir apenas espaços físicos válidos no momento de mover um ativo, e correção de payload para desvincular itens (Mover para Raiz).
- [x] ATUALIZADO Responsividade e Acessibilidade: Botão sair sempre visível, fechar modais com tecla Esc, contexto limpo em telas menores.
- [x] ATUALIZADO Feedback Visual: Sistema de Toast Notifications substituindo alerts nativos com cores por tipo (success/error/warning/info).
- [x] ATUALIZADO Cores por Tipo: Paleta definida para usuários (emerald), espaços com conteúdo (emerald), espaços vazios (cinza), ativos comuns (amber), e 18 cores pastel para categorias.
- [x] NOVO Footer Sticky no Sidebar: Adicionado mt-auto no footer do sidebar para manter usuário, logout e versão sempre visíveis no bottom-left mesmo com poco conteúdo.
- [x] NOVO Correção Página de Erro no Settings: Removida página de erro "Usuário não encontrado" com InteractiveFace, substituída por tela de "Carregando..." quando user ainda não foi carregado.
- [x] NOVO Campo Localização no Edit Form: Corrigido para exibir o local atual do ativo ao editar (espaço físico se tem parentId, senão espacio pai), agora suporta tanto campos simples quanto objetos aninhados.
- [x] NOVO Erro: Serial Numbers não atualizavam na edição - Corrigido na API para aceitar array serialNumbers e fazer join para salvar no banco.
- [x] NOVO Erro: isPhysicalSpace não atualizava na edição - Corrigido na API para atualizar o campo booleano.
- [x] NOVO Feature: SKU exibido na renderTree (card do ativo) e no modal de visualização para facilitar identificação.

## 4. Back-end e Persistência

- [x] Atualização do schema.prisma: Inclusão do campo area e criação das tabelas Active e FatherSpace.
- [x] ATUALIZADO Atualização do schema.prisma (Novas Tabelas): Exclusão do enum Area e criação do model Category (relacionado aos usuários e ações executadas).
- [x] Integração e Segurança de APIs (create.ts, update.ts, move.ts): Conexão dos métodos com os novos endpoints, implementando validação rigorosa via JWT, tipagem estrita no TypeScript e remoção de mocks de usuário.
- [x] ATUALIZADO Refatoração da API de Listagem (list.ts): Implementação do recurso \\\_count do Prisma com filtros where para otimização de payload e performance na contagem de filhos, com ordenação padrão por preferência do usuário.
- [x] ATUALIZADO Sistema Global de Auditoria (Logs): Interceptação de todas as requisições CRUD, Signups e Logins para registro automático no banco de dados com carimbo de tempo, IP (opcional), Usuário e Ação Executada.
- [x] Otimização Mobile (activeForm.tsx): Ajuste de responsividade para preenchimento de inventário em campo via smartphone.
- [x] ATUALIZADO API de Categorias: Validação de limite de 18 categorias no backend para impedir criação além do limite.

## 5. Backlog / Alterações Finais

- [x] Histórico de movimentação e criação de ativos divididos em 2 cards (dashboard.tsx).
- [x] Painel de ativos registrados em cada área de foco (dashboard.tsx).
- [x] Adicionar a tab Espaços Pai (fatherSpace) para fazer o CRUD de Espaços Pai (settings.tsx).
- [x] Adicionar a tab Logs (log) para mostrar as ações feitas no site, podendo ser vista somente pelos usuários MANAGER e ADMIN, e somente o ADMIN pode apagar/editar os logs (settings.tsx).
- [x] ATUALIZADO Adicionar a tab Categoria (category) para fazer o CRUD completo das Categorias que agora estarão no banco de dados (settings.tsx).
- [x] Juntar as tabs Meu Perfil e Usuários (profile e users) (settings.tsx).
- [x] Modificar view.tsx para ser compatível com a nova estrutura de tabelas e apresentar os novos campos.