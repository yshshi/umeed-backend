const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn('SMTP not configured. Emails will be logged only.');
    return null;
  }
  transporter = nodemailer.createTransport(emailConfig);
  return transporter;
};

const sendMail = async (options) => {
  const transport = getTransporter();
  const mailOptions = {
    from: emailConfig.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };
  if (transport) {
    try {
      await transport.sendMail(mailOptions);
    } catch (err) {
      console.error('Email send error:', err.message);
    }
  } else {
    console.log('[Email (no SMTP)]', options.subject, '->', options.to, options.text || options.html?.substring(0, 100));
  }
};

const sendWelcomeEmail = async (user) => {
  await sendMail({
    to: user.email,
    subject: 'Welcome to Ummed',
    html: `
      <h2>Welcome, ${user.name}!</h2>
      <p>Your Member ID: <strong>${user.memberId}</strong></p>
      <p>Your Referral Code: <strong>${user.referralCode}</strong></p>
      <p>Use this link to refer others: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?ref=${user.referralCode}</p>
      <p>Thank you for joining.</p>
    `,
    text: `Welcome ${user.name}. Member ID: ${user.memberId}. Referral: ${user.referralCode}`,
  });
};

const sendReferralRegistrationAlert = async (parentUser, newMember) => {
  await sendMail({
    to: parentUser.email,
    subject: 'New member registered under your referral',
    html: `
      <h2>New Referral Registration</h2>
      <p>${newMember.name} (${newMember.memberId}) has registered using your referral code.</p>
      <p>Commission will be credited as per plan.</p>
    `,
    text: `New referral: ${newMember.name} (${newMember.memberId})`,
  });
};

const sendCommissionCreditedEmail = async (user, amount, fromMemberId, level) => {
  await sendMail({
    to: user.email,
    subject: `Commission Credited - ₹${amount}`,
    html: `
      <h2>Commission Credited</h2>
      <p>Amount: <strong>₹${amount}</strong></p>
      <p>From: ${fromMemberId} (Level ${level})</p>
      <p>Your wallet has been updated.</p>
    `,
    text: `Commission ₹${amount} from ${fromMemberId} level ${level}`,
  });
};

module.exports = {
  sendMail,
  sendWelcomeEmail,
  sendReferralRegistrationAlert,
  sendCommissionCreditedEmail,
};
