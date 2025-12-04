-- Atualizar seu usuário para ADMIN
-- Substitua 'seu_email@exemplo.com' pelo seu email real

UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'seu_email@exemplo.com';

-- Ou se quiser atualizar pelo ID:
-- UPDATE users SET role = 'ADMIN' WHERE id = 'seu_user_id';

-- Para ver todos os usuários e suas roles:
SELECT id, name, email, role FROM users;
