import { useRef, useState } from 'react';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { lookupBarcode } from '../lib/openfoodfacts';

const GROCERY_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.UPC_A,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_E,
];

export default function BarcodeScanner({ onResult, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function startScanning() {
    setStarted(true);
    setScanning(true);
    setStatus('Starting camera…');
    setError('');

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, GROCERY_FORMATS);

    const reader = new BrowserMultiFormatReader(hints);
    readerRef.current = reader;

    try {
      await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        videoRef.current,
        async (result, err, controls) => {
          if (result) {
            controls.stop();
            setScanning(false);
            const code = result.getText();
            setStatus(`Found: ${code}. Looking up product…`);
            const product = await lookupBarcode(code);
            onResult({ barcode: code, ...product });
          }
        }
      );
      setStatus('Point at a barcode');
    } catch (e) {
      setError(
        e.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and try again.'
          : 'Could not start camera. Please try again.'
      );
      setScanning(false);
    }
  }

  function handleClose() {
    if (readerRef.current) readerRef.current.reset();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal modal--scanner" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Scan barcode</h2>
          <button className="modal-close" onClick={handleClose}>✕</button>
        </div>

        <div className="scanner-body">
          <div className="scanner-viewport">
            {/* playsInline + muted required for iOS autoplay */}
            <video ref={videoRef} autoPlay playsInline muted className="scanner-video" />
            {started && <div className="scanner-target" />}
          </div>

          {!started && !error && (
            <button className="btn btn--primary scanner-start" onClick={startScanning}>
              Tap to start camera
            </button>
          )}

          {status && !error && <p className="scanner-status">{status}</p>}
          {error && <p className="scanner-error">{error}</p>}

          <button className="btn btn--secondary scanner-manual" onClick={() => onResult({})}>
            Enter name manually
          </button>
        </div>
      </div>
    </div>
  );
}
