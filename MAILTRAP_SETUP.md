# Configuração de Email - Mailtrap

## 🎯 O que é o Mailtrap?

Mailtrap é um serviço de email para **desenvolvimento** que captura todos os emails enviados em uma caixa de entrada falsa. Perfeito para testar sem enviar emails reais!

---

## ⚙️ Passo a Passo - Configuração Mailtrap

### 1️⃣ Criar Conta Gratuita

1. Acesse: https://mailtrap.io/register/signup
2. Crie sua conta (grátis)
3. Confirme seu email

### 2️⃣ Obter Credenciais SMTP

1. Após fazer login, vá em **"Email Testing"** → **"Inboxes"**
2. Clique na sua inbox (ou crie uma nova)
3. Vá na aba **"SMTP Settings"**
4. Copie as credenciais mostradas:
   - **Host**: `sandbox.smtp.mailtrap.io`
   - **Port**: `2525` ou `587`
   - **Username**: (algo como `a1b2c3d4e5f6g7`)
   - **Password**: (sua senha)

### 3️⃣ Configurar no Projeto

Adicione no arquivo **`.env.local`** na raiz do projeto:

```env
# Mailtrap Configuration (Development)
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=seu_username_mailtrap
EMAIL_PASS=sua_senha_mailtrap
```

**Exemplo real:**
```env
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=a1b2c3d4e5f6g7
EMAIL_PASS=abc123xyz789
```

---

## ✅ Testar

1. Reinicie o servidor Next.js:
   ```bash
   # Parar o servidor (Ctrl+C)
   # Iniciar novamente
   npm run dev
   ```

2. Quando o sistema enviar um email, você verá na inbox do Mailtrap!

3. Acesse: https://mailtrap.io/inboxes
   - Você verá todos os emails enviados
   - Pode visualizar HTML, ver o código-fonte, etc.

---

## 🔄 Migrar para Produção (Gmail)

Quando quiser usar email real em produção, basta trocar no `.env.local`:

```env
# Gmail Configuration (Production)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app_gmail  
```

Ver instruções completas de Gmail no `EMAIL_SETUP.md`

---

## 📧 Visualizar Emails no Mailtrap

1. Acesse: https://mailtrap.io/inboxes
2. Click na sua inbox
3. Você verá todos os emails com:
   - ✅ Preview HTML (como ficaria no email real)
   - ✅ Código HTML
   - ✅ Headers do email
   - ✅ Análise de spam score
   - ✅ Validação HTML

---

## 🎨 Recursos Úteis do Mailtrap

- **Compartilhar Inbox**: Adicione membros do time
- **Forwarding**: Encaminhe emails para email real (para testar recebimento)
- **API**: Automação de testes
- **Spam Analysis**: Veja se seu email cairia no spam
- **HTML Check**: Valida compatibilidade com clientes de email

---

## 🐛 Problemas Comuns

### Erro: "Connection timeout"
- Verifique se copiou as credenciais corretamente
- Tente trocar a porta de `2525` para `587`

### Emails não aparecem
- Verifique os logs do servidor (console)
- Confirme que o `.env.local` está na raiz do projeto
- Reinicie o servidor após alterar `.env.local`

### Versão Gratuita - Limites
- 500 emails/mês (suficiente para desenvolvimento)
- 100 emails/inbox
- Emails expiram após 1 mês

---

## 🚀 Pronto!

Agora você pode testar o sistema de emails sem enviar emails reais. Todos os códigos de verificação aparecerão na sua inbox do Mailtrap!
