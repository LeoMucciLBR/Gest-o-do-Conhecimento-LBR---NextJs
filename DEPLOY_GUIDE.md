# Guia de Deploy na Vercel

Como você já tentou usar a Vercel e teve erros, siga este guia para garantir que tudo esteja configurado corretamente.

## 1. Pré-requisitos
- **Projeto no GitHub**: Seu código deve estar em um repositório no GitHub.
- **Banco de Dados na Nuvem**: A Vercel não hospeda o banco de dados PostgreSQL localmente. Você precisa de um banco acessível via internet (ex: Vercel Postgres, Neon, Supabase, Railway).

## 2. Configurando o Banco de Dados (Recomendado: Vercel Postgres)
Se você ainda não tem um banco online:
1. No painel da Vercel, vá em **Storage** e crie um novo **Postgres** database.
2. Conecte-o ao seu projeto Vercel.
3. A Vercel irá gerar automaticamente as variáveis de ambiente (`POSTGRES_URL`, etc.).
4. **Importante**: Você precisará rodar as migrations no banco de produção. No seu terminal local, conecte-se ao banco da Vercel (copiando a string de conexão) e rode:
   ```bash
   npx prisma migrate deploy
   ```

## 3. Variáveis de Ambiente
No painel do seu projeto na Vercel, vá em **Settings > Environment Variables** e adicione as seguintes variáveis (copie do seu `.env.local`, mas ajuste para produção):

- `DATABASE_URL`: (Preenchido automaticamente se usar Vercel Postgres, ou cole a URL do seu banco externo)
- `NEXTAUTH_SECRET`: Gere um novo hash seguro (pode usar `openssl rand -base64 32` no terminal ou um gerador online).
- `NEXTAUTH_URL`: A URL do seu site na Vercel (ex: `https://seu-projeto.vercel.app`).
- `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`: Sua chave da API do Google.
- Outras variáveis que seu projeto use (ex: credenciais de email, etc.).

## 4. Deploy
1. Faça o push das últimas alterações para o GitHub.
2. A Vercel deve detectar o commit e iniciar um novo deploy automaticamente.
3. Acompanhe os logs na aba **Deployments**.

## Solução de Problemas Comuns
- **Erro de Build**: Verifique se `npm run build` roda sem erros na sua máquina (já corrigimos um erro hoje).
- **Erro de Banco de Dados**: Certifique-se de que o IP da Vercel tem permissão para acessar seu banco (se usar Vercel Postgres ou Neon, isso é automático).
- **Prisma Client**: Adicione `postinstall": "prisma generate"` nos scripts do `package.json` se a Vercel reclamar que não achou o client, embora ela geralmente detecte automaticamente.
