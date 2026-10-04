export default function AppointmentsTable({ appointments, dateLabel, onEdit, onCancel, formatTime }) {
  return (
    <section className="panel appointments-panel">
      <div className="panel-heading appointments-heading">
        <div><span className="section-kicker">BOOKING OVERVIEW</span><h2>Appointments for {dateLabel}</h2></div>
        <span className="count-badge">{appointments.length} records</span>
      </div>

      {appointments.length === 0 ? (
        <div className="empty-state"><div className="empty-icon" aria-hidden="true">▤</div><strong>No appointments for this date yet</strong><p>Choose a time slot and fill in the form to create your first booking.</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th scope="col">Customer</th><th scope="col">Time</th><th scope="col">Contact</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
            <tbody>{appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td><strong>{appointment.name}</strong>{appointment.notes && <small className="table-notes">{appointment.notes}</small>}</td>
                <td>{formatTime(appointment.startTime)}<small>– {formatTime(appointment.endTime)}</small></td>
                <td><span>{appointment.email}</span><small>{appointment.phone}</small></td>
                <td><span className={`booking-status ${appointment.status}`}>{appointment.status === 'booked' ? 'Confirmed' : 'Cancelled'}</span></td>
                <td>{appointment.status === 'booked' ? <div className="row-actions"><button type="button" className="edit-action" onClick={() => onEdit(appointment)}>Edit</button><button type="button" className="cancel-action" onClick={() => onCancel(appointment.id)}>Cancel</button></div> : <span className="muted">No actions</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

