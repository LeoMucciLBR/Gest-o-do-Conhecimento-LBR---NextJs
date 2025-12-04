import { sgMail, FROM_EMAIL, FROM_NAME } from './sendgrid'

interface SendVerificationCodeParams {
  to: string
  name: string
  code: string
}

interface SendPasswordResetParams {
  to: string
  name: string
  resetLink: string
}

export async function sendVerificationCode({
  to,
  name,
  code,
}: SendVerificationCodeParams) {
  try {
    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: 'Código de Verificação - LBR Engenharia',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2f4982 0%, #1e3a6b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .code-box { background: white; border: 2px solid #2f4982; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
              .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2f4982; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">LBR Engenharia</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Sistema de Gestão do Conhecimento</p>
              </div>
              <div class="content">
                <h2 style="color: #2f4982; margin-top: 0;">Olá, ${name}!</h2>
                <p>Você solicitou um código de verificação para acessar o sistema.</p>
                <p>Use o código abaixo para concluir seu primeiro acesso:</p>
                
                <div class="code-box">
                  <div class="code">${code}</div>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  <strong>Este código expira em 15 minutos.</strong>
                </p>
                
                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
                  Se você não solicitou este código, ignore este email.
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} LBR Engenharia e Consultoria</p>
                <p>Este é um email automático, não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    }

    await sgMail.send(msg)
    console.log(`Verification code sent to ${to}`)
    return { success: true }
  } catch (error: any) {
    console.error('SendGrid error:', error.response?.body || error)
    throw new Error(`Failed to send verification code: ${error.message}`)
  }
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetLink,
}: SendPasswordResetParams) {
  try {
    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: 'Recuperação de Senha - LBR Engenharia',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2f4982 0%, #1e3a6b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #2f4982; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
              .button:hover { background: #1e3a6b; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">LBR Engenharia</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Sistema de Gestão do Conhecimento</p>
              </div>
              <div class="content">
                <h2 style="color: #2f4982; margin-top: 0;">Olá, ${name}!</h2>
                <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
                <p>Clique no botão abaixo para criar uma nova senha:</p>
                
                <div style="text-align: center;">
                  <a href="${resetLink}" class="button">Redefinir Senha</a>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  <strong>Este link expira em 1 hora.</strong>
                </p>
                
                <p style="color: #666; font-size: 14px;">
                  Se o botão não funcionar, copie e cole este link no seu navegador:
                </p>
                <p style="background: #fff; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px; color: #2f4982;">
                  ${resetLink}
                </p>
                
                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
                  Se você não solicitou a recuperação de senha, ignore este email. Sua senha permanecerá inalterada.
                </p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} LBR Engenharia e Consultoria</p>
                <p>Este é um email automático, não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    }

    await sgMail.send(msg)
    console.log(`Password reset email sent to ${to}`)
    return { success: true }
  } catch (error: any) {
    console.error('SendGrid error:', error.response?.body || error)
    throw new Error(`Failed to send password reset email: ${error.message}`)
  }
}
