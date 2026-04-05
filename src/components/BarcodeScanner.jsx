import { useRef, useState, useEffect } from 'react';
import { lookupBarcode } from '../lib/openfoodfacts';
import { getCachedBarcode } from '../lib/barcodeCache';

// Native BarcodeDetector (Chrome on Android/desktop) — fast and reliable
const NATIVE_FORMATS = ['ean_13', 'upc_a', 'ean_8', 'upc_e', 'code_128', 'code_39'];
const hasNativeDetector = typeof BarcodeDetector !== 'undefined';

// ZXing fallback (iOS Safari, Firefox)
let zxingReader = null;
async function getZxingReader() {
  if (zxingReader) return zxingReader;
  const [{ BrowserMultiFormatReader }, { DecodeHintType, BarcodeFormat }] = await Promise.all([
    import('@zxing/browser'),
    import('@zxing/library'),
  ]);
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13, BarcodeFormat.UPC_A,
    BarcodeFormat.EAN_8, BarcodeFormat.UPC_E,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  zxingReader = new BrowserMultiFormatReader(hints);
  return zxingReader;
}

export default function BarcodeScanner({ onResult, onClose }) {
  const videoRef = useRef(null);
  const stopRef = useRef(null); // cleanup function for active scan
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  // Cleanup on unmount
  useEffect(() => () => stopRef.current?.(), []);

  async function startScanning() {
    setStarted(true);
    setStatus('Starting camera…');
    setError('');

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      });
    } catch (e) {
      setError(
        e.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access.'
          : `Could not start camera: ${e.message}`
      );
      return;
    }

    const video = videoRef.current;
    video.srcObject = stream;
    await video.play();
    setStatus('Point at a barcode');

    function cleanup() {
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
    stopRef.current = cleanup;

    if (hasNativeDetector) {
      await scanWithNativeDetector(video, cleanup);
    } else {
      await scanWithZxing(video, stream, cleanup);
    }
  }

  async function scanWithNativeDetector(video, cleanup) {
    const detector = new BarcodeDetector({ formats: NATIVE_FORMATS });
    let animId;

    async function loop() {
      if (!video.srcObject) return; // already stopped
      try {
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0) {
          cleanup();
          await handleCode(barcodes[0].rawValue);
          return;
        }
      } catch {}
      animId = requestAnimationFrame(loop);
    }

    const prevStop = stopRef.current;
    stopRef.current = () => {
      cancelAnimationFrame(animId);
      prevStop?.();
    };

    animId = requestAnimationFrame(loop);
  }

  async function scanWithZxing(video, stream, cleanup) {
    try {
      const reader = await getZxingReader();
      const controls = await reader.decodeFromStream(stream, video, async (result) => {
        if (!result) return;
        controls.stop();
        await handleCode(result.getText());
      });
      const prevStop = stopRef.current;
      stopRef.current = () => { controls.stop(); prevStop?.(); };
    } catch (e) {
      setError(`Scanner error: ${e.message}`);
      cleanup();
    }
  }

  async function handleCode(code) {
    setStatus('Looking up product…');
    // 1. Check household cache first (fastest, works offline)
    const cached = await getCachedBarcode(code);
    if (cached?.name) {
      onResult({ barcode: code, ...cached });
      return;
    }
    // 2. Try Open Food Facts
    const product = await lookupBarcode(code);
    if (product?.name) {
      onResult({ barcode: code, ...product });
    } else {
      setStatus('Not in database — type the name below');
      setTimeout(() => onResult({ barcode: code }), 1200);
    }
  }

  function handleClose() {
    stopRef.current?.();
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

          <button className="btn btn--secondary scanner-manual" onClick={() => { handleClose(); onResult({}); }}>
            Enter name manually
          </button>
        </div>
      </div>
    </div>
  );
}
