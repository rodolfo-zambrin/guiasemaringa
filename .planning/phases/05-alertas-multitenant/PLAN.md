# Phase 05 — Alertas + Multi-tenant: PLAN

## Goal
Engine de alertas automática + dashboard consolidado do cliente com Health Score + configurações completas.

## Tasks (a detalhar quando chegar a vez)

### Task 1: Engine de alertas no n8n
Nó de alertas executado ao final do sync diário. Insere/atualiza registros em `alerts`.

Regras (ver PROJECT.md para thresholds completos):
- CPM Meta, CTR Meta, Frequência, Zero leads, QS Google, Search IS, Hook Rate, ROAS, Budget pace

### Task 2: /alertas — painel completo
Filtros: plataforma, severidade, cliente, data, resolvido/pendente.
Marcar como resolvido manualmente.

### Task 3: /clientes/[clientId] — dashboard do cliente
Visão consolidada para client_view + time da agência.
Seções: Health Score, resumo Meta vs Google, evolução 30d, campanhas ativas, top criativos/keywords.

### Task 4: /admin/clientes/[id] — edição de cliente
Formulário: nome, segmento, budget mensal, cor, status ativo/inativo.

### Task 5: /configuracoes/usuarios
CRUD de usuários: criar, editar role, ativar/desativar.

### Task 6: /configuracoes/contas
CRUD de ad accounts por cliente: adicionar/remover contas Meta e Google.
