import sgMail from '@sendgrid/mail'

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set')
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@lbreng.com.br'
export const FROM_NAME = 'LBR Engenharia'

export { sgMail }
