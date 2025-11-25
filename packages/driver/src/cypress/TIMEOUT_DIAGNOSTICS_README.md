# Timeout Diagnostics - Smart Error Messages

## 🎯 Objetivo

Melhorar dramaticamente a experiência do desenvolvedor ao lidar com erros de timeout no Cypress, fornecendo **sugestões contextuais e acionáveis** baseadas na análise do contexto do erro.

## 🚀 Motivação

Erros de timeout são extremamente comuns em testes Cypress, mas as mensagens tradicionais são genéricas:

```
cy.get() timed out waiting 4000ms
```

Com este sistema, os desenvolvedores recebem diagnósticos inteligentes:

```
cy.get() timed out waiting 4000ms

🔍 Diagnostic Suggestions:

1. The selector appears to target dynamic/loading content
   a) Wait for the loading state to complete: cy.get('.loading-spinner').should('not.exist')
   b) Consider using data-cy attributes instead of class names that indicate loading states
   c) Use cy.intercept() to wait for the API request that populates this content
   📚 Learn more: https://on.cypress.io/best-practices#Selecting-Elements

2. 8 network requests are still pending
   a) Wait for specific API calls to complete using cy.intercept()
   b) Consider increasing the timeout if the requests are expected to be slow
   c) Check if some requests are failing or hanging in the Network tab
   d) Example: cy.intercept("GET", "/api/data").as("getData"); cy.wait("@getData")
   📚 Learn more: https://on.cypress.io/intercept
```

## ✨ Funcionalidades

### 1. **Detecção de Seletores Problemáticos**
- Identifica seletores que apontam para conteúdo dinâmico (loading, spinner, skeleton)
- Detecta seletores complexos e frágeis
- Alerta sobre IDs dinâmicos (ex: `#user-12345`)

### 2. **Análise de Problemas de Rede**
- Detecta múltiplas requisições pendentes
- Identifica timeouts longos que sugerem operações assíncronas
- Sugere uso de `cy.intercept()` para melhor controle

### 3. **Diagnóstico de Animações**
- Identifica quando animações estão causando delays
- Sugere configurações para desabilitar animações em testes

### 4. **Detecção de Mutações Excessivas do DOM**
- Identifica quando o DOM está mudando rapidamente
- Sugere esperar por estabilização antes de interagir

### 5. **Sugestões Específicas por Comando**
- Sugestões customizadas para cada tipo de comando (`get`, `click`, `type`, etc.)
- Links para documentação relevante

## 📦 Estrutura

```
packages/driver/src/cypress/
└── timeout_diagnostics.ts       # Lógica principal

packages/driver/test/unit/cypress/
└── timeout_diagnostics.spec.ts  # Testes unitários
```

## 🔧 API

```typescript
import { TimeoutDiagnostics } from './timeout_diagnostics'

// Analisar contexto e obter sugestões
const suggestions = TimeoutDiagnostics.analyze({
  command: 'get',
  selector: '.loading-spinner',
  timeout: 4000,
  networkRequests: 5,
  animationsRunning: true,
})

// Formatar sugestões para exibição
const formatted = TimeoutDiagnostics.formatSuggestions(suggestions)

// Enriquecer mensagem de erro existente
const enhanced = TimeoutDiagnostics.enhanceTimeoutError(
  'cy.get() timed out',
  context
)
```

## 🎨 Exemplos de Uso

### Exemplo 1: Conteúdo Dinâmico
```typescript
// Teste que falha
cy.get('.loading-spinner').click()

// Erro melhorado sugere:
// "Wait for the loading state to complete: 
//  cy.get('.loading-spinner').should('not.exist')"
```

### Exemplo 2: Problemas de Rede
```typescript
// Teste aguardando resposta API
cy.get('.user-data').should('be.visible')

// Erro melhorado sugere:
// "Use cy.intercept() to wait for the specific request:
//  cy.intercept('GET', '/api/users').as('getUsers')
//  cy.wait('@getUsers')"
```

### Exemplo 3: Animações
```typescript
// Elemento animando quando clica
cy.get('.modal-button').click()

// Erro melhorado sugere:
// "Disable animations: .click({ waitForAnimations: false })
//  Or globally: Cypress.config('animationDistanceThreshold', 0)"
```

## 🔮 Integração Futura

Para integrar completamente no Cypress, seria necessário:

1. **Modificar `error_utils.ts`** para capturar contexto adicional durante timeouts
2. **Coletar métricas** de rede, DOM e animações durante execução do comando
3. **Integrar na pipeline de erro** existente do Cypress
4. **Adicionar configuração** para habilitar/desabilitar diagnósticos

```typescript
// Exemplo de integração em error_utils.ts
import TimeoutDiagnostics from './timeout_diagnostics'

const createTimeoutError = (cmd, ms) => {
  const context = {
    command: cmd.get('name'),
    selector: cmd.get('selector'),
    timeout: ms,
    networkRequests: getNetworkMonitor().pendingCount(),
    animationsRunning: hasRunningAnimations(),
    domMutations: getDOMMutationCount(),
  }
  
  const baseMessage = `cy.${cmd.get('name')}() timed out waiting ${ms}ms`
  return TimeoutDiagnostics.enhanceTimeoutError(baseMessage, context)
}
```

## 📊 Benefícios

1. **Reduz tempo de debugging**: Desenvolvedores identificam problemas mais rapidamente
2. **Educação inline**: Ensina melhores práticas durante o desenvolvimento
3. **Menos frustração**: Erros mais claros = desenvolvedores mais felizes
4. **Reduz issues no GitHub**: Menos perguntas sobre "por que meu teste timeout?"
5. **Melhora adoção**: Desenvolvedores iniciantes aprendem mais rápido

## 🧪 Testes

Execute os testes unitários:

```bash
cd packages/driver
yarn test timeout_diagnostics.spec.ts
```

Cobertura inclui:
- ✅ Detecção de todos os tipos de problemas
- ✅ Formatação de mensagens
- ✅ Casos extremos e edge cases
- ✅ Combinação de múltiplos diagnósticos

## 🚀 Próximos Passos

1. ✅ Criar módulo de diagnósticos com testes
2. ⏳ Integrar com sistema de erros existente
3. ⏳ Adicionar coleta de métricas de contexto
4. ⏳ Criar configuração para habilitar/desabilitar
5. ⏳ Adicionar mais padrões e sugestões baseado em feedback
6. ⏳ Documentação para usuários finais

## 🤝 Contribuindo

Este é um sistema extensível. Para adicionar novos diagnósticos:

1. Adicione padrão em `COMMON_PATTERNS`
2. Crie método `analyze*Issues()`
3. Adicione testes correspondentes
4. Documente o novo diagnóstico

## 📝 Licença

MIT - Consistente com o projeto Cypress
