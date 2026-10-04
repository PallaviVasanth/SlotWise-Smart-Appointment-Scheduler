export default function SlotsPanel({ slots, form, setForm, loading, onRefresh, formatTime }) {
  return (
    <section className="panel slots-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">DAILY AVAILABILITY</span>
          <h2>Available time slots</h2>
        </div>
        <button className="refresh-button" type="button" onClick={onRefresh} disabled={loading} title="Refresh availability" aria-label="Refresh availability">↻</button>
      </div>
      <p className="panel-description">Business hours: 9:00 AM – 5:00 PM</p>

      {loading ? <p className="empty-state" aria-live="polite">Loading availability...</p> : slots.length === 0 ? <p className="empty-state">No slots available for this date.</p> : (
        <div className="slots-list">
          {slots.map((slot) => {
            const remaining = Math.max(0, slot.capacity - slot.bookings);
            const full = remaining === 0;
            return (
              <button key={slot.id} type="button" className={`slot-card ${String(slot.id) === form.slotId ? 'selected' : ''} ${full ? 'full' : ''}`} disabled={full} aria-pressed={String(slot.id) === form.slotId} onClick={() => setForm((previous) => ({ ...previous, slotId: String(slot.id) }))}>
                <div className="slot-clock" aria-hidden="true">◷</div>
                <div className="slot-info">
                  <strong>{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</strong>
                  <span>{full ? 'Fully booked' : `${remaining} spaces left`}</span>
                </div>
                <div className="slot-capacity"><strong>{slot.bookings}/{slot.capacity}</strong><span>booked</span></div>
              </button>
            );
          })}
        </div>
      )}
      <div className="legend"><span><i className="legend-dot available-dot" /> Available</span><span><i className="legend-dot full-dot" /> Full</span></div>
    </section>
  );
}

