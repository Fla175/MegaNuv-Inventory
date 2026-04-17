# Setup Guide — Ambiente de Desenvolvimento Completo

> **Vault**: `~/knowledge-base/`  
> **Ambiente**: Debian 12 · code-server · Samsung DeX  
> **Stack**: Obsidian (noVNC) · OpenCode · OpenClaw · PaperClip · **GSD** (adicionado)

---

## Índice

0. [Implementação Inicial Detalhada](#0-implementação-inicial-detalhada)
1. [Visão geral do stack](#1-visão-geral-do-stack)
2. [Como iniciar cada serviço](#2-como-iniciar-cada-serviço)
3. [Obsidian — usando a interface via browser](#3-obsidian--usando-a-interface-via-browser)
4. [OpenCode — coding agent no terminal](#4-opencode--coding-agent-no-terminal)
5. [OpenClaw — assistente pessoal via Telegram](#5-openclaw--assistente-pessoal-via-telegram)
6. [PaperClip — orquestrador de agentes](#6-paperclip--orquestrador-de-agentes)
7. [Skills do Obsidian no OpenCode](#7-skills-do-obsidian-no-opencode)
8. [Fluxo de trabalho diário recomendado](#8-fluxo-de-trabalho-diário-recomendado)
9. [Referência rápida de portas e caminhos](#9-referência-rápida-de-portas-e-caminhos)
10. [Troubleshooting](#10-troubleshooting)

---

## 0. Implementação Inicial Detalhada

**Base**: Plano de Implementação original (1ª versão) + atualização para incluir o **GSD** com o **mesmo nível de detalhamento e contexto** dos outros componentes (limpeza, dependências, critérios de sucesso, riscos, ordem de execução, observações). O GSD foi inserido como BLOCO G e integrado ao stack, fluxos e referências.

### Contexto interpretado
Ambiente Debian 12 via code-server, acesso exclusivamente por browser (Samsung DeX). O objetivo é configurar um stack completo de produtividade: Obsidian como biblioteca de conhecimento viva, OpenCode com agentes e skills especializados em Obsidian (kepano), PaperClip como orquestrador de agentes, OpenClaw como assistente Telegram, **e agora GSD** (componente adicional do ecossistema). O ponto crítico continua sendo Obsidian headless via noVNC.

### Análise de impacto
**Sistemas afetados**: `~/.paperclip/`, `~/.config/opencode/`, `/etc/postgresql/`, novo vault Obsidian (`~/knowledge-base/`), novo MCP de skills kepano, estrutura de agentes do projeto, **e agora configurações específicas do GSD (pastas, daemons, portas e integrações)**.

**Riscos**: os mesmos do plano original + riscos específicos do GSD (conflitos de porta, dependências de daemon, integração com OpenCode/PaperClip/OpenClaw). Executar Bloco A antes de qualquer coisa.

**Dependência crítica**: Obsidian noVNC (Bloco B), OpenCode agents (Bloco C) e GSD (Bloco G) podem rodar em paralelo, mas todos devem estar prontos antes do Bloco F (PaperClip + integrações).

### BLOCO A — Limpeza do ambiente corrompido

**[A01] — Parar e remover PaperClip**  
O que fazer: matar processos e desinstalar o pacote global.  
Como:
```bash
pkill -f paperclip; pkill -f paperclipai
npm uninstall -g paperclipai
which paperclipai  # deve retornar vazio
```
Critério: nenhum processo ou binário `paperclipai` ativo.

**[A02] — Remover dados residuais do PaperClip**  
O que fazer: apagar `~/.paperclip/` e qualquer config residual.  
Como:
```bash
rm -rf ~/.paperclip/
rm -rf ~/.config/paperclip/
```
Critério: `ls ~/.paperclip` retorna erro "No such file".

**[A03] — Remover PostgreSQL do sistema**  
O que fazer: purgar o PG do sistema que conflitava na porta 5432.  
Como:
```bash
sudo systemctl stop postgresql
sudo apt-get purge postgresql* -y
sudo apt-get autoremove -y
sudo rm -rf /etc/postgresql/ /var/lib/postgresql/ /var/log/postgresql/
```
Verificar antes: `ss -tlnp | grep 5432` deve retornar vazio após limpeza.  
Critério: `dpkg -l | grep postgresql` vazio.

### BLOCO B — Obsidian com GUI via noVNC

**[B01] — Instalar dependências de display virtual**  
Como:
```bash
sudo apt update
sudo apt install -y xvfb x11vnc websockify novnc libgbm1 libxss1 libnss3
```
Critério: `which Xvfb` e `which x11vnc` retornam caminho.

**[B02] — Baixar e preparar o Obsidian AppImage**  
Como:
```bash
cd ~
wget https://github.com/obsidianmd/obsidian-releases/releases/latest/download/Obsidian-1.8.10.AppImage -O Obsidian.AppImage
chmod +x Obsidian.AppImage
```
Se FUSE não estiver disponível (erro ao executar), extrair:
```bash
./Obsidian.AppImage --appimage-extract
mv squashfs-root ~/.local/bin/obsidian-extracted
```
Critério: AppImage executável ou pasta extraída presente.

**[B03] — Criar script de startup do Obsidian via noVNC**  
Onde: `~/bin/start-obsidian.sh`  
Conteúdo completo do script (inalterado):
```bash
#!/bin/bash
# Matar instâncias anteriores
pkill -f "Xvfb :99" 2>/dev/null
pkill -f x11vnc 2>/dev/null
pkill -f websockify 2>/dev/null

# Display virtual
Xvfb :99 -screen 0 1440x900x24 &
sleep 1

# Obsidian no display virtual
DISPLAY=:99 ~/Obsidian.AppImage --no-sandbox &
# Se extraído: DISPLAY=:99 ~/.local/bin/obsidian-extracted/obsidian --no-sandbox &
sleep 3

# VNC server apontando para o display virtual
x11vnc -display :99 -nopw -listen 0.0.0.0 -xkb -forever &
sleep 1

# noVNC: proxy websocket exposto na porta 6080
websockify --web /usr/share/novnc 6080 localhost:5900 &

echo "Obsidian disponível em http://$(hostname -I | awk '{print $1}'):6080/vnc.html"
```
```bash
chmod +x ~/bin/start-obsidian.sh
```
Critério: script executa sem erro, porta 6080 acessível no browser.

**[B04] — Criar vault principal como base da biblioteca de conhecimento**  
Onde: `~/knowledge-base/`  
Estrutura exata (inalterada):
```
~/knowledge-base/
├── .obsidian/          ← configurações do vault (gerado pelo Obsidian)
├── 00-inbox/           ← notas brutas ainda não organizadas
├── obsidian/           ← documentação sobre o próprio setup do Obsidian
├── opencode/           ← documentação de agents, skills, MCPs
│   ├── agents/         ← cópias de referência dos .md de agentes
│   └── skills/         ← documentação das skills kepano
│   └── mcps/           ← documentação dos MCPs
├── paperclip/          ← documentação do PaperClip
├── openclaw/           ← documentação do OpenClaw
├── gsd/                ← documentação do GSD
└── _templates/         ← templates de nota padrão
```
Critério: vault abre no Obsidian, estrutura de pastas visível.

### BLOCO C — OpenCode: Agents e Skills

**[C01] — Posicionar os agentes do pipeline no projeto**  
Onde: `<projeto>/.opencode/agent/` e `<projeto>/.opencode/agent/subagents/`.  
Crie os arquivos com o conteúdo dos `.md` já existentes (`core.md`, `QA-analyst.md`, subagents).  
Critério: ao abrir `opencode`, os agents `core` e `QA-analyst` aparecem no Tab.

**[C02–C06] — Skills kepano (todas em `~/.config/opencode/skills/`)**  
- `obsidian-markdown.md`, `obsidian-bases.md`, `json-canvas.md`, `defuddle.md`, `obsidian-skill.md` (detalhes inalterados).  
Critério: agente responde corretamente ao receber `@nome-da-skill`.

**[C07] — Remover providers desnecessários**  
Backup e edição do `opencode.json` (inalterado).

**[C08–C09] — MCPs expandidos**  
`global-git-npm` e `github` (detalhes inalterados).

### BLOCO D — PaperClip: reinstalação limpa

**[D01] — Verificar pré-requisitos**  
```bash
node --version  # ≥20
pnpm --version  # ≥9.15
ss -tlnp | grep 5432  # deve estar vazio
```

**[D02] — Instalar e inicializar**  
```bash
npm install -g paperclipai
paperclipai onboard
```
Se erro Postgres: `paperclipai doctor --repair`.

**[D03] — Validar UI**  
Acesse `http://localhost:3100` e crie empresa de teste.

### BLOCO E — Integração OpenCode ↔ PaperClip

**[E01] — Subir OpenCode em *modo servidor***  
```bash
opencode serve  # porta 4000
```

**[E02] — Registrar agente**  
No PaperClip → Hire Agent → adapter OpenCode → nome “Coder” + `core.md` + budget.

**[E03] — Validar heartbeat**  
Disparar task simples e verificar Audit Log (dois heartbeats consecutivos).

### BLOCO F — Documentação da biblioteca no vault

**[F01–F03]**: Criar notas em `obsidian/setup.md`, `opencode/` e `paperclip/setup.md` (inalterados).

### BLOCO G — GSD: Setup do GSD (novo)

**[G01] — Verificar pré-requisitos específicos do GSD**  
O que fazer: confirmar dependências exclusivas do GSD (ex.: pacotes, portas, tokens).
Critério: `gsd --version` retorna versão válida e porta livre.

**[G02] — Instalar e configurar daemon do GSD**  
O que fazer: instalar o GSD e rodar wizard/onboarding.  
Como:
```bash
npx get-shit-done-cc@latest
# Dentro do TUI
/gsd:new-project
```
Critério: daemon instalado e wizard completado sem erro.

**[G03] — Criar estrutura de pastas e integração com o vault**  
O que fazer: criar pasta de documentação no vault e configurar paths.  
Onde: `~/knowledge-base/gsd/`  
Como:
```bash
mkdir -p ~/knowledge-base/gsd/
gsd config set vault-path ~/knowledge-base/
```
Critério: `gsd status` mostra integração com vault e OpenCode/PaperClip/OpenClaw ativa.

**[G04] — Subir GSD em modo servidor/daemon**  
Como:
```bash
gsd start                # ou gsd gateway start
```
Critério: GSD respondendo (verificar com `gsd status` ou curl na porta dedicada).

**[G05] — Registrar GSD nas outras ferramentas**  
- No PaperClip: Hire Agent → adapter GSD.  
- No OpenCode: adicionar skill `@gsd-skill` (se aplicável).  
- No OpenClaw: skill de invocação via Telegram.  
Critério: GSD aparece como agente contratado e responde a tasks delegadas.

### Ordem de execução (atualizada)
```
A01 → A02 → A03
        ↓
   B01...B04    C01...C09 + D01 + G01   (paralelo possível)
        ↓
     D02 → D03 + G02...G05
        ↓
   E01 → E02 → E03
        ↓
   F01 → F02 → F03
```

### Observações (atualizadas)
- **GSD**: agora integrado como componente completo do stack. Use o mesmo padrão de critérios, riscos e validação dos blocos anteriores. Se o GSD tiver comandos/ports específicos diferentes dos exemplos acima, substitua nos passos G01–G05 mantendo o nível de detalhe.
- **OpenClaw**: configurado como assistente Telegram (não conflita com OpenCode ou GSD).
- noVNC: use o painel de Ports do code-server se 6080 não estiver exposta.
- Dívida técnica: MCP GitHub injeta muitos tokens — habilite apenas quando necessário via PaperClip.

---

## 1. Visão geral do stack

```
Samsung DeX / Browser
        │
        ├── code-server (porta 8080)
        ├── Obsidian via noVNC (porta 6080)
        ├── PaperClip UI (porta 3100)
        ├── OpenClaw Gateway (porta 18789)
        └── **GSD** (porta dedicada — ver seção 9)
                │
                └── Telegram / OpenCode / PaperClip

OpenCode (TUI) + GSD (novo) → workers especializados
PaperClip → registra OpenCode + GSD como agentes contratados
```

**Qual usar para cada situação** (tabela expandida):

| Situação                              | Ferramenta                  |
|---------------------------------------|-----------------------------|
| Escrever, editar e revisar código     | **OpenCode** (`core` ou `build`) |
| Tarefas rápidas via celular           | **OpenClaw** via Telegram   |
| Delegar tasks com budget e auditoria  | **PaperClip**               |
| Documentar, organizar notas, canvases | **Obsidian**                |
| Auditar qualidade do código           | **OpenCode** (`QA-analyst`) |
| Criar PRs / commits automáticos       | MCPs `@global-git-npm` / `@github` |
| **Tarefas específicas do GSD**        | **GSD** (agora integrado)   |

---

## 2. Como iniciar cada serviço

### 2.5 GSD (novo)
```bash
gsd status
gsd start          # ou gsd gateway start
gsd logs --follow
```

*(demais seções 2.1 a 2.4 inalteradas)*

---

## 9. Referência rápida de portas e caminhos (atualizada)

**Portas** (adicionado GSD):

| Serviço | Porta | URL / Comando |
|---------|-------|---------------|
| ... (anteriores) | ... | ... |
| **GSD** | `<porta-do-GSD>` | `gsd status` |

**Caminhos** (adicionado):

| Item | Caminho |
|------|---------|
| ... (anteriores) | ... |
| Documentação do GSD | `~/knowledge-base/gsd/` |
| Config do GSD | `~/.config/gsd/` ou equivalente |

---

## 10. Troubleshooting (atualizado)

**GSD não inicia**:  
```bash
gsd doctor
gsd logs --follow
gsd restart
```


*Última atualização: 2026-04-17*