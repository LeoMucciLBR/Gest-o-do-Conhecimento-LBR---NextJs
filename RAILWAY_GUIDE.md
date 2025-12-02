# Guia de Deploy na Railway (Opção Mais Fácil)

A Railway é excelente porque configura o banco de dados e o deploy quase automaticamente.

## Passo a Passo

1. **Crie uma conta**: Acesse [railway.app](https://railway.app/) e faça login com seu GitHub.

2. **Novo Projeto**:
   - Clique em **+ New Project**.
   - Escolha **Deploy from GitHub repo**.
   - Selecione o repositório do seu projeto (`Gestão do Conhecimento LBR - NextJs`).

3. **Adicionar Banco de Dados**:
   - No painel do projeto na Railway, clique em **+ New** (ou botão direito na área vazia).
   - Escolha **Database** > **PostgreSQL**.
   - A Railway vai criar o banco e adicionar automaticamente a variável `DATABASE_URL` ao seu projeto. Você não precisa configurar isso manualmente!

4. **Configurar Variáveis (Environment Variables)**:
   - Clique no card do seu projeto (o do GitHub, não o do banco).
   - Vá na aba **Variables**.
   - Adicione as variáveis que faltam (copie do seu `.env.local`):
     - `NEXTAUTH_SECRET`: (Gere um hash seguro)
     - `NEXTAUTH_URL`: `https://${{RAILWAY_PUBLIC_DOMAIN}}` (Copie exatamente assim, a Railway substitui pelo domínio correto).
     - `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`: Sua chave do Google.

5. **Deploy**:
   - A Railway deve iniciar o deploy automaticamente.
   - Se precisar rodar as migrations do banco, vá na aba **Settings** > **Build** e no campo **Build Command**, coloque:
     ```bash
     npm run build && npx prisma migrate deploy
     ```
     (Isso garante que o banco seja atualizado a cada deploy).

6. **Gerar Domínio**:
   - Na aba **Settings** > **Networking**, clique em **Generate Domain** para criar uma URL pública para seu site.

Pronto! Seu site deve estar no ar em alguns minutos.
