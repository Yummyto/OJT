const nodemailer = require('nodemailer');

const hasMailConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
const transporter = hasMailConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  : null;

async function sendTicketEmail({ to, ticketNumber, subject, message, agentName }) {
  if (!transporter || !to) {
    console.warn('Ticket email skipped: configure SMTP_HOST, SMTP_USER, and SMTP_PASS in server/.env');
    return false;
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    replyTo: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: `[${ticketNumber}]${agentName ? ` [${agentName}]` : ''} ${subject}`,
    text: `${message}\n\nTicket: ${ticketNumber}${agentName ? `\nReply from: ${agentName}` : ''}`
  });
  return true;
}

module.exports = { sendTicketEmail };