import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import Alert from './components/Alert.jsx';
import StatsGrid from './components/StatsGrid.jsx';
import BookingForm from './components/BookingForm.jsx';
import SlotsPanel from './components/SlotsPanel.jsx';
import AppointmentsTable from './components/AppointmentsTable.jsx';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const emptyForm = { name: '', email: '', phone: '', notes: '', slotId: '' };

export function formatTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function App() {
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [slotResponse, appointmentResponse] = await Promise.all([
        axios.get(`${API}/slots`, { params: { date } }),
        axios.get(`${API}/appointments`, { params: { date } }),
      ]);
      setSlots(slotResponse.data);
      setAppointments(appointmentResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to connect to the server. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setMessage('');
  };

  const handleDateChange = (nextDate) => {
    setDate(nextDate);
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!form.slotId) {
      setError('Please select an available appointment slot.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
        notes: form.notes.trim(), slotId: Number(form.slotId),
      };
      if (editingId) {
        await axios.put(`${API}/appointments/${editingId}`, payload);
        setMessage('Appointment updated successfully!');
      } else {
        await axios.post(`${API}/appointments`, payload);
        setMessage('Appointment booked successfully!');
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not save the appointment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (appointment) => {
    setEditingId(appointment.id);
    setForm({
      name: appointment.name, email: appointment.email, phone: appointment.phone,
      notes: appointment.notes || '', slotId: String(appointment.slotId),
    });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setError('');
    setMessage('');
    try {
      await axios.patch(`${API}/appointments/${id}/cancel`);
      setMessage('Appointment cancelled. The slot is available again.');
      if (editingId === id) resetForm();
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not cancel the appointment.');
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="SlotWise home"><span className="brand-icon" aria-hidden="true">◷</span>SlotWise</a>
        <span className="topbar-label">APPOINTMENT MANAGEMENT</span>
        <span className="status-pill"><span className="status-dot" /> Appointment workspace</span>
      </header>

      <main className="container" id="top">
        <section className="hero">
          <div><div className="eyebrow">YOUR TIME, WELL MANAGED</div><h1>Smart Appointment Scheduler</h1><p>Book, manage, and keep track of your appointments in one place.</p></div>
          <div className="hero-date"><span>SELECTED DATE</span><strong>{formatDate(date)}</strong></div>
        </section>

        {error && <Alert type="error" onDismiss={() => setError('')}>{error}</Alert>}
        {message && <Alert type="success" onDismiss={() => setMessage('')}>{message}</Alert>}

        <StatsGrid slots={slots} appointments={appointments} />
        <div className="main-grid">
          <BookingForm date={date} setDate={handleDateChange} form={form} updateField={updateField} slots={slots} appointments={appointments} editingId={editingId} saving={saving} loading={loading} onSubmit={handleSubmit} onReset={resetForm} formatTime={formatTime} today={today} />
          <SlotsPanel slots={slots} form={form} setForm={setForm} loading={loading} onRefresh={loadData} formatTime={formatTime} />
        </div>
        <AppointmentsTable appointments={appointments} dateLabel={formatDate(date)} onEdit={handleEdit} onCancel={handleCancel} formatTime={formatTime} />
        <footer><span>SlotWise · Smart Appointment Scheduler</span><span>React · Express · SQLite</span></footer>
      </main>
    </div>
  );
}

export default App;
