# Guia de Referência Rápida: Code Smells (Martin Fowler)

Este guia serve como material de consulta rápida para revisões de código, refatorações e design de software. Um *code smell* (mau cheiro no código) não é um bug, mas sim um sintoma estrutural de que o código precisa ser melhorado para evitar o acúmulo de dívida técnica.

---

## 1. Os Inchados (The Bloaters)
Componentes que cresceram excessivamente e se tornaram difíceis de ler e manter.

*   **Método Longo (Long Method)**
    *   *O que é:* Funções com linhas de código demais (geralmente acima de 20 linhas).
    *   *Problema:* Difícil de entender, testar e reaproveitar.

*   **Classe Grande (Large Class)**
    *   *O que é:* Uma única classe que acumula muitas responsabilidades, atributos e métodos.
    *   *Problema:* Viola o Princípio da Responsabilidade Única (SRP) e cria alto acoplamento.

*   **Obsessão por Primitivos (Primitive Obsession)**
    *   *O que é:* Usar tipos básicos (como `string` ou `int`) para representar conceitos de negócio complexos (ex: e-mail, telefone, CPF).
    *   *Problema:* Espalha validações repetidas pelo código em vez de centralizá-las em um objeto específico.

*   **Lista Longa de Parâmetros (Long Parameter List)**
    *   *O que é:* Métodos que exigem muitos argumentos para funcionar (geralmente 4 ou mais).
    *   *Problema:* Torna a assinatura do método frágil e propensa a erros na ordem dos dados passados.

*   **Grupos de Dados (Data Clumps)**
    *   *O que é:* Variáveis que sempre aparecem juntas em diferentes partes do sistema (ex: `rua`, `numero` e `cep` como parâmetros soltos em várias funções).
    *   *Problema:* Indica que falta criar uma classe de suporte (ex: `Endereco`) para unificar esses dados.

---

## 2. Os Abusadores de Orientação a Objetos (The OO Abusers)
Casos onde os recursos da Programação Orientada a Objetos são aplicados de forma incorreta.

*   **Classes Alternativas com Interfaces Diferentes (Alternative Classes with Different Interfaces)**
    *   *O que é:* Duas ou mais classes que realizam tarefas idênticas, mas usam métodos com nomes diferentes.
    *   *Problema:* Gera confusão e impede o uso de polimorfismo ou interfaces compartilhadas.

*   **Herança Recusada (Refused Bequest)**
    *   *O que é:* Uma subclasse que herda de uma classe mãe, mas não utiliza a maioria dos métodos ou comportamentos herdados.
    *   *Problema:* Quebra a lógica de herança. Quase sempre indica que a composição deveria ter sido usada em vez da herança.

*   **Comandos Condicionais Complexos (Switch Statements)**
    *   *O que é:* Uso excessivo de blocos `switch` ou sequências longas de `if-else` baseadas no tipo de um objeto.
    *   *Problema:* Viola o princípio Aberto/Fechado. Toda vez que um novo tipo surgir, você será obrigado a caçar e alterar todos os `switch` do sistema.

*   **Campo Temporário (Temporary Field)**
    *   *O que é:* Atributos de classe que só têm utilidade em cenários muito específicos e ficam vazios ou nulos na maior parte do tempo.
    *   *Problema:* Torna o estado interno da classe confuso e difícil de rastrear.

---

## 3. Os Disruptores de Mudança (The Change Preventers)
Estruturas que transformam pequenas alterações em pesadelos de manutenção.

*   **Mudança Divergente (Divergent Change)**
    *   *O que é:* Quando você precisa modificar uma única classe por vários motivos de negócio diferentes.
    *   *Problema:* Indica falta de coesão (a classe está fazendo coisas que não pertencem a ela).

*   **Cirurgia com Espingarda (Shotgun Surgery)**
    *   *O que é:* Quando uma única alteração em uma regra de negócio obriga você a fazer dezenas de pequenas modificações espalhadas por várias classes diferentes.
    *   *Problema:* Alto risco de esquecer de atualizar algum arquivo, gerando bugs ocultos.

*   **Hierarquias de Herança Paralelas (Parallel Inheritance Hierarchies)**
    *   *O que é:* Quando a criação de uma nova subclasse em uma determinada árvore exige que você crie outra subclasse correspondente em uma árvore diferente.
    *   *Problema:* Duplica o trabalho de arquitetura e engessa a evolução do código.

---

## 4. Os Dispensáveis (The Dispensables)
Elementos desnecessários que poluem o código e aumentam a carga cognitiva.

*   **Comentários Excessivos (Comments)**
    *   *O que é:* Uso de explicações em texto para tentar justificar um código confuso.
    *   *Problema:* Comentários devem explicar o *porquê*, nunca o *como*. O código deve ser autoexplicativo.

*   **Código Duplicado (Duplicate Code)**
    *   *O que é:* Trechos de código idênticos ou muito similares repetidos em múltiplos lugares.
    *   *Problema:* Se a lógica mudar, você precisará atualizar manualmente todas as cópias.

*   **Código Morto (Dead Code)**
    *   *O que é:* Variáveis, funções ou classes que não são mais chamadas ou utilizadas no sistema.
    *   *Problema:* Gera poluição visual e confunde os desenvolvedores sobre o que ainda está ativo.

*   **Classe Preguiçosa (Lazy Class)**
    *   *O que é:* Classes que fazem tão pouco que não justificam o custo de manutenção e testes.
    *   *Problema:* Infla a complexidade do projeto sem entregar valor real.

*   **Classe de Dados (Data Class)**
    *   *O que é:* Classes que servem apenas como caixas de dados (`getters` e `setters`), sem comportamento ou lógica de negócio associados.
    *   *Problema:* Favorece o design anêmico e faz com que outras classes fiquem "inveja" dos seus dados.

*   **Generalidade Especulativa (Speculative Generality)**
    *   *O que é:* Criar interfaces, classes abstratas e códigos genéricos pensando no famoso *"vai que a gente precisa disso no futuro"*.
    *   *Problema:* Adiciona complexidade para problemas que ainda não existem.

---

## 5. Os Acopladores (The Couplers)
Padrões que causam dependência excessiva ou inapropriada entre diferentes componentes do software.

*   **Inveja de Funcionalidade (Feature Envy)**
    *   *O que é:* Um método de uma classe que consome muito mais dados e métodos de *outra* classe do que da sua própria.
    *   *Problema:* Indica que esse método foi escrito no lugar errado e deveria pertencer à outra classe.

*   **Intimidade Inapropriada (Inappropriate Intimacy)**
    *   *O que é:* Duas classes que conhecem excessivamente os detalhes internos e privados uma da outra.
    *   *Problema:* Quebra o encapsulamento, fazendo com que qualquer alteração em uma quebre a outra.

*   **Correntes de Mensagens (Message Chains)**
    *   *O que é:* Quando o código precisa navegar por uma longa linha de objetos para obter um dado (ex: `pedido.getCliente().getEndereco().getCidade().getNome()`).
    *   *Problema:* Viola a Lei de Deméter. Se qualquer objeto intermediário mudar, a linha inteira quebra.

*   **Intermediário (Middle Man)**
    *   *O que é:* Uma classe cuja única função real é repassar o trabalho para outra, sem adicionar nenhuma lógica ou valor próprio.
    *   *Problema:* Cria uma camada de redirecionamento inútil que dificulta a leitura do fluxo.

*   **Negociação de Informações Privilegiadas (Insider Trading)**
    *   *O que é:* Módulos ou classes que trocam dados baseados em implementações ocultas de outros escopos.
    *   *Problema:* Reduz o isolamento de fronteiras arquiteturais do projeto.
