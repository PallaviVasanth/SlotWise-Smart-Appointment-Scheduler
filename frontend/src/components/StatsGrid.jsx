const cards = [
  { key: 'total', icon: '▦', color: 'purple', label: 'Total time slots', note: '30-minute intervals' },
  { key: 'available', icon: '✓', color: 'green', label: 'Available slots', note: 'With remaining capacity' },
  { key: 'active', icon: '◷', color: 'orange', label: 'Active appointments', note: 'On the selected date' },
  { key: 'booked', icon: '▤', color: 'blue', label: 'Slots with bookings', note: 'Slots with at least one booking' },
];

export default function StatsGrid({ slots, appointments }) {
  const values = {
    total: slots.length,
    available: slots.filter((slot) => slot.bookings < slot.capacity).length,
    active: appointments.filter((item) => item.status === 'booked').length,
    booked: slots.filter((slot) => slot.bookings > 0).length,
  };

  return (
    <section className="stats-grid" aria-label="Appointment statistics">
      {cards.map((card) => (
        <article className="stat-card" key={card.key}>
          <div className={`stat-icon ${card.color}`} aria-hidden="true">{card.icon}</div>
          <div>
            <span>{card.label}</span>
            <strong>{values[card.key]}</strong>
            <small>{card.key === 'booked' ? `Out of ${slots.length} slots` : card.note}</small>
          </div>
        </article>
      ))}
    </section>
  );
}

