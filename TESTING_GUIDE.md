# Guia de Teste - Sistema de Autenticação Avançado

## 🧪 Como Testar as APIs

### Ferramentas Necessárias

Você pode usar:
- **Postman** (https://www.postman.com/downloads/)
- **Thunder Client** (extensão do VS Code)
- **cURL** (linha de comando)
- **Insomnia** (https://insomnia.rest/)

---

## 📝 Pré-requisitos

1. **Servidor rodando**: `npm run dev`
2. **Mailtrap configurado**: Variáveis no `.env.local`
3. **Usuário de teste criado** com `is_first_login = true`

### Criar Usuário de Teste no Banco

Execute este SQL no seu banco:

```sql
-- Criar usuário
INSERT INTO users (id, email, name, is_active, role)
VALUES (gen_random_uuid(), 'teste@example.com', 'Usuário Teste', true, 'user')
RETURNING id;

-- Criar senha temporária (senha: "123456")
-- Copie o ID retornado acima e use aqui
INSERT INTO user_passwords (user_id, password_hash, is_first_login)
VALUES 
  ('COLE_O_ID_AQUI', '$argon2id$v=19$m=65536,t=3,p=4$YourHashHere', true);
```

**Ou use o Prisma Studio:**
```bash
npx prisma studio
```

---

## 🔄 Fluxo Completo de Teste

### PASSO 1: Login Inicial (Detectar Primeiro Acesso)

**Endpoint:** `POST http://localhost:3000/api/auth/login`

**Body (JSON):**
```json
{
  "email": "teste@example.com",
  "password": "123456"
}
```

**Resposta Esperada:**
```json
{
  "isFirstLogin": true,
  "user": {
    "id": "uuid-do-usuario",
    "email": "teste@example.com",
    "name": "Usuário Teste"
  },
  "message": "Primeiro acesso detectado. Um código será enviado para seu email."
}
```

✅ **O que verificar:**
- Status: 200
- `isFirstLogin` deve ser `true`
- Nenhum cookie `sid` criado

---

### PASSO 2: Solicitar Código de Verificação

**Endpoint:** `POST http://localhost:3000/api/auth/send-verification-code`

**Body (JSON):**
```json
{
  "email": "teste@example.com"
}
```

**Resposta Esperada:**
```json
{
  "message": "Código enviado para seu email",
  "expiresIn": 600
}
```

✅ **O que verificar:**
- Status: 200
- Ir no **Mailtrap** (https://mailtrap.io/inboxes)
- Verificar se o email chegou
- **Copiar o código de 6 dígitos** do email

---

### PASSO 3: Validar Código

**Endpoint:** `POST http://localhost:3000/api/auth/verify-code`

**Body (JSON):**
```json
{
  "email": "teste@example.com",
  "code": "123456"
}
```
*(Substitua `123456` pelo código real recebido no email)*

**Resposta Esperada:**
```json
{
  "message": "Código verificado com sucesso",
  "verificationToken": "token-longo-aqui..."
}
```

✅ **O que verificar:**
- Status: 200
- **Guardar o `verificationToken`** - você vai precisar dele no próximo passo!

---

### PASSO 4: Criar Nova Senha

**Endpoint:** `POST http://localhost:3000/api/auth/change-password`

**Body (JSON):**
```json
{
  "email": "teste@example.com",
  "verificationToken": "COLE_O_TOKEN_DO_PASSO_3",
  "newPassword": "MinhaSenh@Forte123"
}
```

**Resposta Esperada:**
```json
{
  "message": "Senha alterada com sucesso",
  "sessionToken": "token-de-sessao...",
  "user": {
    "id": "uuid",
    "email": "teste@example.com",
    "name": "Usuário Teste"
  }
}
```

✅ **O que verificar:**
- Status: 200
- Sessão criada automaticamente
- No banco: `is_first_login` agora é `false`

---

### PASSO 5: Login Normal (Após Criar Senha)

**Endpoint:** `POST http://localhost:3000/api/auth/login`

**Body (JSON):**
```json
{
  "email": "teste@example.com",
  "password": "MinhaSenh@Forte123"
}
```

**Resposta Esperada:**
```json
{
  "isFirstLogin": false,
  "user": {
    "id": "uuid",
    "email": "teste@example.com",
    "name": "Usuário Teste",
    "photoUrl": null
  }
}
```

✅ **O que verificar:**
- Status: 200
- `isFirstLogin` agora é `false`
- Cookie `sid` foi criado

---

## ❌ Testes de Erro

### Código Inválido
```json
POST /api/auth/verify-code
{
  "email": "teste@example.com",
  "code": "000000"
}
```
**Esperado:** Status 401, erro "Código inválido ou expirado"

### Senha Fraca
```json
POST /api/auth/change-password
{
  "email": "teste@example.com",
  "verificationToken": "...",
  "newPassword": "123"
}
```
**Esperado:** Status 400, lista de erros de validação

### Código Expirado
Aguarde 10 minutos após receber código, depois tente validar.
**Esperado:** Status 401, "Código inválido ou expirado"

---

## 🔍 Verificar Logs no Banco

Após os testes, verifique se os logs foram criados:

```sql
-- Ver logs de acesso
SELECT * FROM login_audit 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver sessões
SELECT * FROM sessions 
WHERE is_active = true;

-- Ver códigos de verificação
SELECT * FROM email_verifications 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 📊 Checklist de Validação

- [ ] Email com código chegou no Mailtrap
- [ ] Código validado com sucesso
- [ ] Senha alterada e hash Argon2 salvo
- [ ] `is_first_login` mudou para `false`
- [ ] Sessão criada automaticamente
- [ ] Login subsequente funciona normalmente
- [ ] Logs registrados em `login_audit`
- [ ] Localização do IP registrada
- [ ] Senhas fracas são rejeitadas
- [ ] Códigos expirados são rejeitados

---

## 🐛 Troubleshooting

### Email não chega
- Verifique `.env.local` - credenciais do Mailtrap corretas?
- Veja os logs do servidor: procure por erros de email
- Teste a conexão SMTP manualmente

### Erro "is_first_login does not exist"
- Execute: `npx prisma generate`
- Reinicie o servidor

### Erro "Property 'ip' does not exist"
- Este é um warning do TypeScript, não afeta funcionalidade
- IP será `undefined` em desenvolvimento local

---

## 🎯 Próximo Passo

Após validar as APIs, podemos criar:
1. **Frontend**: Páginas de verificação e troca de senha
2. **Admin Panel**: Gerenciar logs e sessões

Tudo funcionando? 🚀
