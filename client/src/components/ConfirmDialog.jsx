import Modal from './Modal.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  danger = true,
  loading = false,
}) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={title || t('common.confirm')} width="max-w-sm">
      <p className="text-sm text-dune-600 mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={loading}>
          {loading ? t('common.deleting') : confirmLabel || t('common.confirm')}
        </button>
      </div>
    </Modal>
  );
}
