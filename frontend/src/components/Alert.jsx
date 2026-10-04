export default function Alert({ type = 'error', children, onDismiss }) {
  return (
    <div className={`alert ${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span aria-hidden="true">{type === 'error' ? '⚠' : '✓'}</span>
      <span>{children}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss message">×</button>
    </div>
  );
}

