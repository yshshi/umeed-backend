/**
 * Email configuration for Nodemailer (SMTP)
 * Configure in .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 */
module.exports = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@mlm.com',
};
