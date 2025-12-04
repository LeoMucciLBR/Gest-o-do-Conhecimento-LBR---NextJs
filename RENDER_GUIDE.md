# Guia de Deploy no Render

Este guia mostra como fazer deploy da aplicação no Render com PostgreSQL + PostGIS.

## Pré-requisitos

- Conta no [Render](https://render.com) (gratuita)
- Repositório no GitHub
- Código commitado e pushado

## Passo 1: Criar Banco de Dados PostgreSQL

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `gestao-conhecimento-db` (ou qualquer nome)
   - **Database**: `gestao_conhecimento`
   - **User**: `gestao_user` (ou qualquer nome)
   - **Region**: escolha a região mais próxima (ex: Oregon, Ohio)
   - **PostgreSQL Version**: 16 (mais recente)
   - **Plan**: **Free** (ou o plano de sua preferência)
4. Clique em **"Create Database"**
5. Aguarde alguns segundos até o banco ficar disponível

### Habilitar PostGIS

1. No banco criado, vá na aba **"Info"**
2. Copie a **"Internal Database URL"**
3. Clique em **"Connect"** → **"PSQL Command"**
4. Copie o comando (parecido com: `PGPASSWORD=xxx psql -h xxx ...`)
5. Abra o terminal do seu computador e cole o comando para conectar
6. Uma vez conectado ao banco, rode:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS citext;
   \q
   ```
7. Ou, se preferir, vá na aba **"Shell"** no dashboard do Render e rode os comandos diretamente:
   ```bash
   psql $DATABASE_URL
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS citext;
   \q
   ```

## Passo 2: Criar Web Service (Aplicação Next.js)

1. No dashboard do Render, clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub:
   - Se for a primeira vez, clique em **"Connect GitHub"** e autorize
   - Selecione o repositório `Gestão do Conhecimento LBR - NextJs`
3. Configure o serviço:
   - **Name**: `gestao-conhecimento` (ou qualquer nome)
   - **Region**: **mesma região do banco de dados**
   - **Branch**: `main` (ou `master`)
   - **Root Directory**: deixe em branco
   - **Runtime**: **Node**
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free** (ou o plano de sua preferência)

## Passo 3: Configurar Variáveis de Ambiente

1. Ainda na configuração do Web Service, role até **"Environment Variables"**
2. Clique em **"Add Environment Variable"**
3. Adicione as seguintes variáveis:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Copie da aba "Info" do banco (Internal Database URL) |
   | `NEXTAUTH_SECRET` | Gere um novo: `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `https://SEU-SERVICE-NAME.onrender.com` |
   | `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Sua chave do Google Places API |
   | `NODE_ENV` | `production` |

   > ⚠️ **IMPORTANTE**: Use a **Internal Database URL** do banco, não a External!

4. Clique em **"Create Web Service"**

## Passo 4: Rodar Migrações do Prisma

Após o primeiro deploy (pode demorar alguns minutos), você precisa rodar as migrações do banco:

1. No dashboard do Web Service, vá na aba **"Shell"**
2. Espere o shell conectar
3. Rode:
   ```bash
   npx prisma migrate deploy
   ```
4. Aguarde a conclusão

**Ou localmente** (mais rápido):

No seu computador, rode:
```powershell
$env:DATABASE_URL='<INTERNAL_DATABASE_URL_DO_RENDER>'; npx prisma migrate deploy
```

## Passo 5: Verificar Deploy

1. Aguarde o build e deploy terminarem (5-10 minutos no free tier)
2. Acesse a URL do serviço (ex: `https://gestao-conhecimento.onrender.com`)
3. Tente fazer login

## Troubleshooting

### Build falha com erro de TypeScript
- Verifique os logs de build
- Teste localmente: `npm run build`

### Erro 500 no login
- Verifique se as migrações foram aplicadas (`npx prisma migrate deploy`)
- Verifique se as extensões PostGIS e citext foram criadas
- Veja os logs na aba "Logs" do Web Service

### Aplicação lenta
- É normal no free tier do Render
- Após 15 minutos de inatividade, o serviço "hiberna" e demora ~30s para acordar
- Considere upgrade para plano pago se precisar de performance

### Erro de conexão com banco
- Certifique-se que está usando a **Internal Database URL**
- Verifique se o banco e a aplicação estão na **mesma região**

## Notas Importantes

- ✅ O free tier do Render **hiberna** após 15 minutos de inatividade
- ✅ O banco PostgreSQL free tem limite de 1GB
- ✅ Builds são limitados a 90 segundos no free tier (mas geralmente é suficiente)
- ✅ Deploy automático acontece a cada push no GitHub

## Próximos Passos

1. Configure um domínio customizado (opcional)
2. Configure variáveis de ambiente de produção
3. Monitore uso de recursos no dashboard

---

**Pronto!** Sua aplicação está no ar! 🚀
