# Undo — conversão temporal e pendências operacionais

## Estado desta alteração

O loop de `handleGet` em `pages/api/database/revert.ts` foi substituído pelo algoritmo solicitado. `handlePost` e o agrupamento de 2 segundos permanecem intactos.

Nenhum banco de produção foi acessado ou convertido nesta sessão. O sandbox não dispõe do checkout `/root/MegaNuv-Inventory`, `.env` de produção ou cliente MariaDB. Backup, conversão, validação SQL, deploy, smoke tests autenticados e testes no navegador continuam pendentes.

`yarn build:opt` foi tentado, mas falhou na instalação das dependências (falhas TLS em registry.yarnpkg.com e arquivo de cache ausente), antes do build Next.js/TypeScript. Não considerar esta alteração validada para release. Os testes isolados podem ser executados com `node --test scripts/test-revert-classification.cjs`; não substituem build ou integração MariaDB.

## Antes da conversão em produção

1. Confirmar host, banco, versão MariaDB e schema real, sem imprimir credenciais.
2. Pausar escritas durante backup/conversão, proteger o dump com permissões restritas (`umask 077`), verificar saída bem-sucedida e arquivo não vazio. Fazer dump de `Active`, `FatherSpace` e `Category` antes de qualquer ALTER. Usar arquivo de opções protegido para autenticação; evitar senha na linha de comando/logs. Guardar uma cópia segura fora do servidor.
3. Executar individualmente, parando imediatamente se qualquer comando falhar:

```sql
ALTER TABLE Category ADD SYSTEM VERSIONING;
ALTER TABLE FatherSpace ADD SYSTEM VERSIONING;
ALTER TABLE Active ADD SYSTEM VERSIONING;
```

DDL não é uma transação única: se houver falha parcial, registrar quais tabelas já foram convertidas antes de tentar novamente. Não remover versionamento automaticamente como rollback, pois isso descarta histórico.

4. Conferir `SHOW CREATE TABLE` para as três tabelas: deve conter `WITH SYSTEM VERSIONING`.
5. Executar `SELECT COUNT(*) FROM Active FOR SYSTEM_TIME ALL;`, `SELECT COUNT(*) FROM Active FOR SYSTEM_TIME AS OF NOW();` e `SELECT id, name, ROW_START, ROW_END FROM Active FOR SYSTEM_TIME ALL LIMIT 5;`. Repetir consultas temporais nas outras duas tabelas. Não usar `FORCE` isolado.
6. Testar INSERT/UPDATE/consulta histórica/DELETE de um ativo descartável com ID exclusivo. **O schema versionado no repositório exige `categoryId` e `fatherSpaceId` não nulos**, além de `id`, `name`, `isPhysicalSpace` e `updatedAt`. Usar IDs válidos existentes para as FKs após conferir o schema real; não executar o INSERT do plano com NULL. Usar autocommit/transações separadas, verificar duas versões após UPDATE e ausência do registro em 2023. Remover somente o registro de teste ao terminar; o histórico de teste permanece.

O histórico começa na conversão; alterações anteriores não podem ser recuperadas.

## Limitações do algoritmo solicitado

- A primeira edição sem mudança de localização continua `CREATE` (`liveIndex === 1`), inclusive para uma linha preexistente convertida. Não satisfaz o critério geral de primeira edição como `UPDATE`.
- Uma única versão já excluída continua `CREATE`, não `DELETE`.
- Uma linha recém-criada com apenas uma versão viva é omitida.
- O coalescimento de `fatherSpaceId` e `parentId` não compara as duas referências: se `fatherSpaceId` está preenchido e não muda, uma mudança somente em `parentId` não vira `MOVE`.

Esses comportamentos foram preservados conforme o loop fornecido e estão explicitados nos testes. Precisam de decisão adicional antes de declarar todos os critérios funcionais atendidos.

## Release e validação ainda necessárias

- Reexecutar `yarn build:opt` em ambiente com dependências disponíveis antes de publicar `v2.22.7`.
- Esta sessão trabalha exclusivamente em `arena/01a0b6ab-meganuv-inventory`; não trocar de branch/tag neste checkout. A publicação de tag e o checkout de produção ficam para o fluxo de release autorizado fora desta sessão.
- No servidor de produção, preservar alterações locais, inclusive `scripts/prune-platform.js` e seu hook `postinstall`. Não descartar stash até confirmar recuperação dos artefatos locais e funcionamento do aplicativo.
- Após build e restart do PM2, conferir login autenticado, logo e página de login. Não registrar senha, cookie ou token nos logs.
- Conferir GET autenticado `/api/database/revert` com HTTP 200 e `items`; testar desfazer edição e movimento pelo popup, movimento de ativo recém-criado, restauração após exclusão e classificação em `/settings`.
- Conferir `pm2 logs inventory --lines 50 --nostream`, sem erros P2010/4124. Manter evidências sem dados sensíveis. Nenhum desses resultados foi verificado nesta sessão.

## Operação após conversão

- Antes de futuros ALTERs nessas tabelas, na mesma sessão: `SET SESSION system_versioning_alter_history = KEEP;`. Revisar efeitos da mudança sobre o histórico.
- `TRUNCATE TABLE` é proibido em tabelas versionadas (erro 4137).
- Na MariaDB 10.5, dumps lógicos usuais não incluem histórico. `--dump-history` está disponível a partir da 10.11; planejar backup físico compatível e testar restauração para preservar o histórico na 10.5.
- Revisar manualmente migrações Prisma: colunas temporais ocultas podem causar drift. Não executar reset automático para resolver drift em produção.
