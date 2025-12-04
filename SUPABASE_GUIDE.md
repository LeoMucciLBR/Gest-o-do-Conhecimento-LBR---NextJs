# Guia de Deploy com Supabase + Vercel

Este guia mostra como usar o **Supabase** (banco de dados PostgreSQL com PostGIS) e a **Vercel** (aplicação Next.js).

## Por que Supabase?

- ✅ PostgreSQL com **PostGIS já habilitado** (não precisa instalar!)
- ✅ Totalmente gratuito (500MB de banco + 2GB de transferência)
- ✅ Dashboard visual para gerenciar dados
- ✅ Funciona perfeitamente com Vercel

---

## Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"Start your project"** e faça login (GitHub, Google, etc.)
3. Clique em **"New project"**
4. Configure:
   - **Name**: `gestao-conhecimento` (ou qualquer nome)
   - **Database Password**: crie uma senha forte (anote ela!)
   - **Region**: escolha a mais próxima do Brasil (ex: South America - São Paulo)
   - **Pricing Plan**: **Free**
5. Clique em **"Create new project"**
6. Aguarde ~2 minutos enquanto o projeto é criado

---

## Passo 2: Obter Connection String do Banco

1. No dashboard do Supabase, vá em **"Project Settings"** (ícone de engrenagem no menu lateral)
2. Clique em **"Database"** no menu lateral
3. Role até **"Connection string"**
4. Selecione a aba **"URI"**
5. Copie a connection string (vai estar assim):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
6. **Substitua `[YOUR-PASSWORD]`** pela senha que você criou no Passo 1

**Exemplo:**
```
postgresql://postgres:minhasenha123@db.abcdefgh.supabase.co:5432/postgres
```

---

## Passo 3: Rodar Migrações do Banco (No Seu PC)

Agora vamos criar as tabelas no banco do Supabase:

1. Abra o **PowerShell** no seu computador
2. Navegue até a pasta do projeto:
   ```powershell
   cd "C:\Users\leonardo.mucci\Desktop\Gestão do Conhecimento LBR - NextJs"
   ```
3. Rode o comando de migração (substitua pela sua connection string):
   ```powershell
   $env:DATABASE_URL='postgresql://postgres:SUASENHA@db.xxx.supabase.co:5432/postgres'; npx prisma migrate deploy
   ```

Se der tudo certo, você verá:
```
✔ All migrations have been successfully applied
```

---

## Passo 4: Configurar Vercel

Agora vamos configurar a Vercel para usar o banco do Supabase:

### 4.1 Adicionar Variáveis de Ambiente

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **"Settings"** → **"Environment Variables"**
4. Adicione as seguintes variáveis:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://postgres:SUASENHA@db.xxx.supabase.co:5432/postgres` |
| `NEXTAUTH_SECRET` | O mesmo que você usou antes (ou gere: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://SEU-PROJETO.vercel.app` |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Sua chave do Google Places API |

5. Para cada variável, selecione **Production**, **Preview**, e **Development**
6. Clique em **"Save"** após adicionar cada uma

### 4.2 Fazer Redeploy

1. Vá na aba **"Deployments"**
2. Clique nos **3 pontinhos** do último deploy
3. Clique em **"Redeploy"**
4. Confirme clicando em **"Redeploy"** novamente

---

## Passo 5: Testar a Aplicação

1. Aguarde o deploy terminar (1-3 minutos)
2. Clique em **"Visit"** para abrir a aplicação
3. Teste o login

Se tudo estiver correto, o login deve funcionar! 🎉

---

## Verificar PostGIS (Opcional)

Para confirmar que PostGIS está habilitado no Supabase:

1. No Supabase, vá em **"SQL Editor"** (menu lateral)
2. Clique em **"New query"**
3. Cole e execute:
   ```sql
   SELECT PostGIS_version();
   ```
4. Se retornar a versão do PostGIS, está tudo certo!

---

## Troubleshooting

### Erro 500 no login

**Verifique:**
- As migrações foram aplicadas? Rode `npx prisma migrate deploy` novamente
- A `DATABASE_URL` está correta na Vercel?
- Você fez redeploy depois de adicionar as variáveis?

**Como verificar:**
1. Na Vercel, vá em **"Deployments"** → clique no último deploy
2. Vá na aba **"Functions"** → clique em `/api/auth/login`
3. Veja os logs para identificar o erro

### Connection timeout

- Verifique se a connection string está correta
- Certifique-se que não há espaços extras
- Use a connection string do tipo **URI**, não a Pooling

### Tabelas não foram criadas

Rode as migrações novamente:
```powershell
$env:DATABASE_URL='postgresql://postgres:SUASENHA@db.xxx.supabase.co:5432/postgres'; npx prisma migrate deploy
```

---

## Vantagens do Supabase + Vercel

- ✅ **PostGIS funciona perfeitamente** (não como no Vercel Postgres)
- ✅ **Dashboard visual** para ver e editar dados
- ✅ **Backups automáticos** (no plano free)
- ✅ **API REST automática** (caso precise no futuro)
- ✅ **Totalmente gratuito** para projetos pequenos

---

## Próximos Passos

1. Configure um domínio customizado na Vercel (opcional)
2. Explore o dashboard do Supabase para gerenciar dados
3. Configure backups automáticos (já vem habilitado no free tier)

---

**Pronto!** Sua aplicação está rodando com Supabase + Vercel! 🚀

**Limites do Free Tier:**
- Banco: 500MB
- Transferência: 2GB/mês
- API Requests: 50.000/mês

Para a maioria dos projetos, isso é mais que suficiente!
