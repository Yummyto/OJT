const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const supabase = require('../config/supabase');

let polling = false;

function getTicketNumber(subject = '') {
  const match = subject.match(/\bBR-[A-Z0-9-]+\b/i);
  return match ? match[0].toUpperCase() : null;
}

async function importMessage(message) {
  const parsed = await simpleParser(message.source);
  const ticketNumber = getTicketNumber(parsed.subject);
  if (!ticketNumber || !parsed.text?.trim()) return;

  const { data: ticket, error: findError } = await supabase
    .from('borrow_requests')
    .select('id, admin_notes')
    .eq('ticket_number', ticketNumber)
    .single();

  if (findError || !ticket) return;

  const sender = parsed.from?.text || 'Requester';
  const receivedAt = parsed.date ? new Date(parsed.date).toISOString() : new Date().toISOString();
  const reply = `[Requester reply | ${sender} | ${receivedAt}]\n${parsed.text.trim()}`;
  const adminNotes = ticket.admin_notes ? `${ticket.admin_notes}\n\n${reply}` : reply;

  const { error: updateError } = await supabase
    .from('borrow_requests')
    .update({ admin_notes: adminNotes, status: 'open' })
    .eq('id', ticket.id);

  if (updateError) throw updateError;
  console.log(`Imported requester reply for ${ticketNumber}`);
}

async function pollInbox() {
  if (polling) return;
  polling = true;

  const client = new ImapFlow({
    host: process.env.IMAP_HOST || (process.env.SMTP_HOST === 'smtp.gmail.com' ? 'imap.gmail.com' : ''),
    port: Number(process.env.IMAP_PORT || 993),
    secure: process.env.IMAP_SECURE !== 'false',
    auth: { user: process.env.IMAP_USER || process.env.SMTP_USER, pass: process.env.IMAP_PASS || process.env.SMTP_PASS },
    logger: false
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock(process.env.IMAP_MAILBOX || 'INBOX');
    try {
      const unseen = await client.search({ seen: false }, { uid: true });
      for (const uid of unseen) {
        const message = await client.fetchOne(uid, { source: true, flags: true }, { uid: true });
        try {
          await importMessage(message);
        } finally {
          await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
        }
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (error) {
    console.error('Inbox polling error:', error.message);
    try { await client.logout(); } catch (_error) { /* already disconnected */ }
  } finally {
    polling = false;
  }
}

function startInboxPolling() {
  const configured = (process.env.IMAP_HOST || process.env.SMTP_HOST === 'smtp.gmail.com')
    && (process.env.IMAP_USER || process.env.SMTP_USER)
    && (process.env.IMAP_PASS || process.env.SMTP_PASS);
  if (!configured) {
    console.warn('Inbound ticket replies disabled: configure IMAP_HOST, IMAP_USER, and IMAP_PASS in server/.env');
    return;
  }

  const interval = Number(process.env.IMAP_POLL_INTERVAL || 30000);
  pollInbox();
  setInterval(pollInbox, interval);
  console.log(`Inbound ticket reply polling enabled every ${interval / 1000}s`);
}

module.exports = { startInboxPolling };
