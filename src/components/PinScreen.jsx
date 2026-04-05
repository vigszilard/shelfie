import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
const PIN_LENGTH = 4;

export default function PinScreen() {
  const { pinExists, verify, setup, error } = useAuth();
  const [digits, setDigits] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [confirmDigits, setConfirmDigits] = useState([]);
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSetup = pinExists === false;
  const current = confirm !== null ? confirmDigits : digits;
  const setCurrent = confirm !== null ? setConfirmDigits : setDigits;

  async function handleKey(k) {
    if (submitting) return;
    if (k === '⌫') {
      setCurrent((d) => d.slice(0, -1));
      setLocalError('');
      return;
    }
    if (k === '') return;
    const next = [...current, k];
    setCurrent(next);

    if (next.length < PIN_LENGTH) return;

    const pin = next.join('');

    if (isSetup) {
      if (confirm === null) {
        setConfirm(pin);
        setConfirmDigits([]);
      } else {
        if (pin !== confirm) {
          setLocalError("PINs don't match. Start again.");
          setConfirm(null);
          setDigits([]);
          setConfirmDigits([]);
        } else {
          setSubmitting(true);
          await setup(pin);
          setSubmitting(false);
        }
      }
    } else {
      setSubmitting(true);
      const ok = await verify(pin);
      if (!ok) {
        setDigits([]);
        setSubmitting(false);
      }
    }
  }

  const displayDigits = Array.from({ length: PIN_LENGTH }, (_, i) =>
    current[i] !== undefined ? '●' : '○'
  );

  const title = isSetup
    ? confirm === null ? 'Set your PIN' : 'Confirm PIN'
    : 'Enter PIN';

  // Show a loading state while checking Firestore for existing PIN
  if (pinExists === null) {
    return (
      <div className="pin-screen">
        <div className="pin-logo">🛒</div>
        <h1 className="pin-title">Shelfie</h1>
        <p className="pin-subtitle" style={{ color: 'var(--c-muted)' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="pin-screen">
      <div className="pin-logo">🛒</div>
      <h1 className="pin-title">Shelfie</h1>
      <p className="pin-subtitle">{title}</p>

      <div className="pin-dots">
        {displayDigits.map((d, i) => (
          <span key={i} className={`pin-dot ${d === '●' ? 'filled' : ''}`}>{d}</span>
        ))}
      </div>

      {(error || localError) && (
        <p className="pin-error">{localError || error}</p>
      )}

      <div className="pin-numpad">
        {KEYS.map((k, i) => (
          <button
            key={i}
            className={`pin-key ${k === '' ? 'pin-key--empty' : ''} ${submitting ? 'pin-key--loading' : ''}`}
            onClick={() => handleKey(k)}
            disabled={submitting || (k !== '⌫' && k !== '' && current.length >= PIN_LENGTH)}
          >
            {submitting && k === '0' ? '…' : k}
          </button>
        ))}
      </div>
    </div>
  );
}
