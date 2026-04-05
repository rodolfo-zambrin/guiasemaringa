# Phase 06 — Polish + Deploy: PLAN

## Goal
Plataforma em produção em agperform.com.br com build limpo e sem erros TypeScript.

## Tasks (a detalhar quando chegar a vez)

### Task 1: Build limpo
- Resolver todos os erros TypeScript
- Remover `any` types onde possível
- Garantir `npm run build` sem warnings críticos

### Task 2: Responsivo (mobile)
- Layout da sidebar: drawer no mobile
- Tabelas: scroll horizontal + colunas essenciais em telas pequenas
- Cards: stack vertical no mobile

### Task 3: Vercel deploy
- vercel.json com região gru1
- Variáveis de ambiente configuradas no Vercel Dashboard
- `vercel --prod`

### Task 4: Domínio + Supabase
- agperform.com.br → CNAME → cname.vercel-dns.com
- Supabase: Authentication → URL Configuration → Site URL = https://agperform.com.br

### Task 5: Logins de teste
- 1 super_admin (time Guia-se)
- 1 analyst
- 1 client_view (ex: UniBF)

### Task 6: Documentação
- README.md com setup completo
- .env.example documentado
- README_N8N.md com instruções de importação dos workflows
