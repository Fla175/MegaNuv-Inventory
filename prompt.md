# Prompt de correção de erro
Você deve fazer a correção do arquivo `pages/settings.tsx`, que está mostrando um problema de não haver definido a função `isUserModalOpen()` no arquivo, que é chamada na configuração da função `useEscapeKey()`.

### Erro:
```
 ⨯ ReferenceError: isUserModalOpen is not defined
    at SettingsPage (pages/settings.tsx:73:48)
  71 |
  72 |   // Fechar modais com Esc
> 73 |   useEscapeKey(() => setIsUserModalOpen(false), isUserModalOpen);
     |                                                ^
  74 |   useEscapeKey(() => setIsSpaceModalOpen(false), isSpaceModalOpen);
  75 |   useEscapeKey(() => setIsCategoryModalOpen(false), isCategoryModalOpen);
  76 | {
  page: '/settings'
}
 GET /settings 500 in 431ms
```

### Resolução:
Você deve definir esta função no arquivo, ou se houver um outro tipo de problema, resolvê-lo.
