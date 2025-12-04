import nodemailer from 'nodemailer'

// Configuração do transporter
// Suporta Mailtrap (desenvolvimento) ou Gmail (produção)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"Sistema GC" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

// Gerar código de verificação de 6 dígitos
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Template de email para código de verificação
export function getVerificationEmailTemplate(code: string, userName?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Código de Verificação</h1>
          </div>
          <div class="content">
            ${userName ? `<p>Olá, <strong>${userName}</strong>!</p>` : '<p>Olá!</p>'}
            
            <p>Você está realizando seu <strong>primeiro acesso</strong> ao sistema de Gestão de Conhecimento.</p>
            
            <p>Para prosseguir com a criação da sua senha, utilize o código abaixo:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
              <p style="margin: 10px 0 0; color: #666;">Código de verificação</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Este código expira em <strong>10 minutos</strong></li>
                <li>Não compartilhe este código com ninguém</li>
                <li>Se você não solicitou este código, ignore este email</li>
              </ul>
            </div>
            
            <p>Após validar o código, você poderá criar sua senha pessoal de acesso.</p>
          </div>
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>&copy; ${new Date().getFullYear()} Sistema de Gestão de Conhecimento</p>
          </div>
        </div>
      </body>
    </html>
  `
}

// Enviar código de verificação
export async function sendVerificationCode(
  email: string,
  code: string,
  userName?: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: '🔐 Código de Verificação - Primeiro Acesso',
    html: getVerificationEmailTemplate(code, userName),
    text: `Seu código de verificação é: ${code}. Este código expira em 10 minutos.`,
  })
}
