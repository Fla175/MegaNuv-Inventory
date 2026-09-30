# MegaNuv Inventory - Próximos Estágios de Desenvolvimento

> **MegaNuv Inventory** é um projeto de gestão de inventário de um micro-datacenter no norte do Pará chamado MegaNuv.

# _Estágio 1: (Feat)_ [x] **Concluído** — Criar função de acesso do criador do software para acessar contas existentes com um botão.

Será feito um botão nos cartões de usuários do software (está em [setings.tsx](settings.tsx)) com acesso exclusivo e especificamente para o criador principal do projeto (BugSlayer - Eu). A função, em resumo, usará os sistemas internos de encriptamento de senhas com bycrypt e fará o acesso automaticamente por meio desse botão. Deve ser criado uma nova api feita exclusivamente para essa funcionalidade, chamada de `creator-access.ts`.

# _Estágio 2: (Patch)_ Corrigir o erro na função de reversão. (arquivo responsável pelo back-end: revert.ts; arquivo responsável pelo front-end da função: settings.tsx)

Será feito uma correção da função de revert de ações e uma melhoria da UI.

- _**1ª Correção:**_ Adição da hierarquização de usuários presente no projeto. Deve ser aplicada da seguinte forma:
  - `Diretor` e `Admin Criador`: Acesso total às reversões e seu histórico. (Pode ver de todo mundo)
  - `Admin Comum`: Também acesso total exceto do Diretor e do Admin Criador.
  - `Managers`: Acesso somente às suas reversões.
  - `Viewers`: Completo desaparecimento da ferramenta. (como o nome da classe condiz, ele só pode ver)
- _**2ª Correção:**_ Melhoria na interface de selecionamento das ações a serem revertidas. (mostra quem fez a ação, qual ação e quando, além da adição do nome do ativo no qual está sendo representado ali)

# _Estágio 3: (Talvez Patch)_ Fazer uma revisão no projeto com o agente primário `Review`.

Deve ser feito uma varredura no projeto para achar qualquer mínimo problema. Dividiremos esse estágio em 3 etapas:

- **Etapa I: Verificação do Front-End**
  Será verificado o Front-End, e somente ele. Foque nos arquivos `.tsx` e seus conteúdos na área `return` e funções com o próprio código _html_.

- **Etapa II: Verificação do Back-End**
  Será verificado o Back-End do projeto. Foque nos arquivos `.ts`, tendo principal estadia no diretório `pages/api`.

- **Etapa III: Verificação da hierarquização de usuários**
  Será verificado tanto no back-end quanto no front-end. Deverá ser revisado todo e qualquer arquivo que tenha qualquer funcionalidade CRUD, as classes hierárquicas são: `Diretor` (Acesso total exceto a função de entrar em outras contas automaticamente), `Admin Criador` (Acesso total exceto o patrimônio total), `Admin Comum` (Acesso total exceto a dados do Diretor, do Admin Criador, o patrimônio total, e não poder criar o Diretor), `Manager` (Acesso à seus dados e do viewer, sem acesso ao patrimônio total) e `Viewer` (nenhum tipo de acesso à ferramentas CRUD ou qualquer coisa do tipo e nem ao patrimônio total).

- **Etapa IV: Verificação final**
  Nessa etapa, será feita uma última verificação, agora em todo o projeto.
