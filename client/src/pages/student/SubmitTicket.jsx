import { useState } from 'react';
import { ClipboardPlus, CheckCircle, Send, Ticket } from 'lucide-react';
import { borrowAPI } from '../../services/api.js';
import toast from 'react-hot-toast';

const initialForm = {
  student_id: '', student_name: '', student_email: '', department: '',
  requester_type: 'student', priority: 'medium', ticket_category: 'borrow',
  purpose: ''
};

export default function SubmitTicket() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await borrowAPI.create(form);
      setSubmittedTicket(data);
      setForm(initialForm);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedTicket) return <div className="ticket-page"><div className="ticket-success"><CheckCircle size={48} /><span className="ticket-kicker">Ticket created</span><h1>{submittedTicket.ticket_number}</h1><p>Your request is now in the support queue. Keep this number for follow-up.</p><button className="btn btn-primary" onClick={() => setSubmittedTicket(null)}><Send size={16} /> Submit another ticket</button></div></div>;

  return (
    <div className="ticket-page">
      <div className="ticket-page-heading"><div className="ticket-heading-icon"><Ticket size={24} /></div><div><span className="ticket-kicker">SchoolVault support</span><h1>Submit a request ticket</h1><p>Tell us what you need. You do not need to log in.</p></div></div>
      <form className="ticket-form" onSubmit={submit}>
        <section className="ticket-section"><h2>About you</h2><div className="form-row"><div className="form-group"><label>Department *</label><select value={form.department} onChange={(e) => update('department', e.target.value)} required><option value="">Select department</option><option>COT</option><option>COED</option><option>COHTM</option><option>Admin</option></select></div><div className="form-group"><label>I am a *</label><select value={form.requester_type} onChange={(e) => update('requester_type', e.target.value)} required><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></select></div></div><div className="form-row"><div className="form-group"><label>Name *</label><input value={form.student_name} onChange={(e) => update('student_name', e.target.value)} placeholder="Your full name" required /></div><div className="form-group"><label>ID number *</label><input value={form.student_id} onChange={(e) => update('student_id', e.target.value)} placeholder="Student or employee ID" required /></div></div><div className="form-group"><label>Email *</label><input type="email" value={form.student_email} onChange={(e) => update('student_email', e.target.value)} placeholder="name@school.edu" required /></div></section>
        <section className="ticket-section"><h2>Request details</h2><div className="form-row"><div className="form-group"><label>Ticket category *</label><select value={form.ticket_category} onChange={(e) => update('ticket_category', e.target.value)} required><option value="borrow">Borrow request</option><option value="tech_support">Tech support</option><option value="tool_borrow">Tool borrow</option><option value="manpower">Manpower request</option><option value="other">Other</option></select></div><div className="form-group"><label>Priority *</label><select value={form.priority} onChange={(e) => update('priority', e.target.value)} required><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div></div><div className="form-group"><label>Elaborate your request *</label><textarea value={form.purpose} onChange={(e) => update('purpose', e.target.value)} placeholder="Describe what you need, when you need it, and any useful context..." rows={9} required /></div></section>
        <div className="ticket-submit"><span><ClipboardPlus size={17} /> Your ticket will be reviewed by an administrator.</span><button type="submit" className="btn btn-primary btn-lg" disabled={submitting}><Send size={17} /> {submitting ? 'Submitting ticket...' : 'Create ticket'}</button></div>
      </form>
    </div>
  );
}
