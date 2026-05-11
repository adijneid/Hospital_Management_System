import Modal from './Modal.jsx';
import Button from './Button.jsx';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm', message, loading = false }) {
    return (
        <Modal open={open} onClose={onClose} title={title} size="sm">
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                <Button variant="danger" onClick={onConfirm} loading={loading}>Delete</Button>
            </div>
        </Modal>
    );
}
