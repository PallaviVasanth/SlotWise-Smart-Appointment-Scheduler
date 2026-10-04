export default function BookingForm({ date, setDate, form, updateField, slots, appointments, editingId, saving, loading, onSubmit, onReset, formatTime, today }) {
  return (
    <section className="panel booking-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">{editingId ? 'UPDATE DETAILS' : 'NEW RESERVATION'}</span>
          <h2>{editingId ? 'Edit appointment' : 'Book an appointment'}</h2>
        </div>
        <span className="heading-icon" aria-hidden="true">＋</span>
      </div>

      <form onSubmit={onSubmit}>
        <label htmlFor="date">Appointment date</label>
        <input id="date" type="date" min={today()} value={date} onChange={(event) => setDate(event.target.value)} required />

        <div className="field-row">
          <div>
            <label htmlFor="name">Customer name *</label>
            <input id="name" name="name" autoComplete="name" placeholder="Enter customer name" value={form.name} onChange={updateField} minLength={2} maxLength={100} required />
          </div>
          <div>
            <label htmlFor="phone">Phone number *</label>
            <input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="9876501234" value={form.phone} onChange={updateField} pattern="[6-9][0-9]{9}" title="Enter a valid 10-digit Indian mobile number." required />
          </div>
        </div>

        <label htmlFor="email">Email address *</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={updateField} maxLength={254} required />

        <div className="slot-heading">
          <label htmlFor="slotId">Choose a time slot *</label>
          <span>30 min · Max 3 bookings</span>
        </div>
        <select id="slotId" name="slotId" value={form.slotId} onChange={updateField} required>
          <option value="">Select an available slot</option>
          {slots.map((slot) => {
            const full = slot.bookings >= slot.capacity;
            const currentAppointment = appointments.find((item) => item.id === editingId);
            const ownSlot = Boolean(editingId && currentAppointment?.slotId === slot.id);
            return (
              <option key={slot.id} value={slot.id} disabled={full && !ownSlot}>
                {formatTime(slot.startTime)} – {formatTime(slot.endTime)} · {slot.bookings}/{slot.capacity} booked{full && !ownSlot ? ' · FULL' : ''}
              </option>
            );
          })}
        </select>

        <label htmlFor="notes">Additional notes (optional)</label>
        <textarea id="notes" name="notes" placeholder="Any information relevant to this appointment..." rows={3} maxLength={500} value={form.notes} onChange={updateField} />

        <button className="primary-button" type="submit" disabled={saving || loading}>
          {saving ? 'Saving...' : editingId ? 'Save changes →' : 'Confirm appointment →'}
        </button>
        {editingId && <button className="secondary-button" type="button" onClick={onReset}>Discard changes</button>}
        <p className="form-footnote">* Required fields. Your booking is saved to the SQL database.</p>
      </form>
    </section>
  );
}

