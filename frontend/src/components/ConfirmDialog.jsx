import { useState } from 'react';
import Modal from './Modal.jsx';
import { ButtonLoader } from './Loader.jsx';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary" disabled={confirming}>
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={confirming || loading}
          className={danger ? 'btn-danger' : 'btn-primary'}
        >
          {confirming ? <ButtonLoader>Working…</ButtonLoader> : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}