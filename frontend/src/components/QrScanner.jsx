import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, RotateCcw, X } from 'lucide-react';

const scannerId = 'borrowbox-qr-scanner';

export default function QrScanner({ onScan, onError }) {
  const scannerRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');

  const stop = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        /* noop */
      }
      scannerRef.current = null;
    }
    setActive(false);
  };

  const start = async () => {
    setError('');
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerId, { verbose: false });
      }
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          onScan(decodedText);
          stop();
        },
        () => {}
      );
      setActive(true);
    } catch (err) {
      setError('Camera is not available. Use the code entry below instead.');
      if (onError) onError(err);
    }
  };

  useEffect(() => {
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {!active && (
        <div className="flex flex-col items-center gap-3">
          <button onClick={start} className="btn-secondary w-full">
            <Camera className="h-4 w-4" /> Start camera scanner
          </button>
          {error && <p className="text-sm text-amber-600">{error}</p>}
        </div>
      )}
      {active && (
        <div>
          <div id={scannerId} className="overflow-hidden rounded-xl" />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-400">Point the camera at the owner's QR code.</p>
            <button onClick={stop} className="btn-ghost !py-1 text-xs">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ScannerHint({ onRestart }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
      Having trouble scanning?{' '}
      <button onClick={onRestart} className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:text-primary-700">
        <RotateCcw className="h-3 w-3" /> Restart
      </button>{' '}
      or use the handover code from the owner.
    </div>
  );
}