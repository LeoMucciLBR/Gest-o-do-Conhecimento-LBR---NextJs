# Configuração de Email para Sistema de Autenticação

## ⚙️ Configuração Necessária

Para o sistema de verificação de email funcionar, você precisa configurar as seguintes variáveis de ambiente:

### Arquivo: `.env.local`

Adicione as seguintes linhas no arquivo `.env.local` na raiz do projeto:

```env
# Email Configuration (Gmail)
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app_do_gmail
```

---

## 🔐 Como Obter a Senha de App do Gmail

O Gmail não permite usar sua senha normal em aplicações. Você precisa gerar uma "Senha de App":

### Passo 1: Ativar Verificação em Duas Etapas

1. Acesse: https://myaccount.google.com/security
2. Na seção "Como fazer login no Google", clique em **"Verificação em duas etapas"**
3. Siga as instruções para ativar (se ainda não estiver ativo)

### Passo 2: Gerar Senha de App

1. Acesse: https://myaccount.google.com/apppasswords
2. Se solicitado, faça login novamente
3. Em "Selecionar app", escolha **"Outro (nome personalizado)"**
4. Digite: `Sistema GC` (ou qualquer nome que queira)
5. Clique em **"Gerar"**
6. O Google mostrará uma senha de 16 caracteres (exemplo: `xxxx xxxx xxxx xxxx`)
7. **COPIE ESTA SENHA** (ela só será mostrada uma vez!)

### Passo 3: Adicionar no .env.local

Adicione as informações no arquivo `.env.local`:

```env
EMAIL_USER=seuemail@gmail.com
EMAIL_PASS=xxxxxxxxxxxxxxxx  # Cole a senha de app aqui (sem espaços)
```

---

## ✅ Testar Configuração

Após configurar, você pode testar enviando um email de teste. O sistema enviará emails automaticamente quando:

1. **Primeiro Login**: Código de verificação de 6 dígitos
2. **Redefinição de Senha**: Link para redefinir senha (futuramente)
3. **Login de Novo Dispositivo**: Alerta de segurança (futuramente)

---

## 🔒 Segurança

- ⚠️ **NUNCA** compartilhe sua senha de app
- ⚠️ **NUNCA** commit o arquivo `.env.local` no Git (já está no .gitignore)
- ✅ Use apenas para este projeto
- ✅ Se comprometida, você pode revogar e gerar uma nova em: https://myaccount.google.com/apppasswords

---

## 📧 Alternativas ao Gmail

Se preferir usar outro serviço de email, você pode modificar o arquivo `lib/services/emailService.ts`:

### SendGrid
```typescript
const transporter = nodemailer.createTransporter({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
})
```

### Outlook/Hotmail
```typescript
const transporter = nodemailer.createTransporter({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})
```

### AWS SES
```typescript
const transporter = nodemailer.createTransporter({
  host: 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  auth: {
    user: process.env.AWS_SES_USER,
    pass: process.env.AWS_SES_PASS
  }
})
```

---

## 🐛 Problemas Comuns

### Erro: "Invalid login"
- Verifique se a verificação em duas etapas está ativada
- Certifique-se de usar a senha de app, não sua senha normal
- Remova espaços da senha de app

### Erro: "Timeout"
- Verifique sua conexão com a internet
- Alguns firewalls corporativos bloqueiam porta 587

### Emails não chegam
- Verifique a pasta de spam
- Confirme se o email destinatário está correto
- Veja os logs do servidor para erros

---

## 📝 Logs

Os emails enviados são logados automaticamente. Para debug, verifique:
```bash
# Ver logs do servidor Next.js
npm run dev
```

Procure por mensagens como:
- ✅ `Email sent to: usuario@example.com`
- ❌ `Error sending email: [erro]`
