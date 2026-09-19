import Modal from './Modal.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';

// result: { successCount, errors: [{ row, message }], generatedPasswords: [{ email, password }] }
export default function ImportResultModal({ open, onClose, result }) {
  const { t } = useI18n();
  if (!result) return null;

  return (
    <Modal open={open} onClose={onClose} title={t('import.summaryTitle')} width="max-w-lg">
      <div className="mb-4 flex gap-3">
        <span className="badge bg-present/10 text-present">
          {t('import.successCount', { count: result.successCount })}
        </span>
        {result.errors.length > 0 && (
          <span className="badge bg-absent/10 text-absent">
            {t('import.errorCount', { count: result.errors.length })}
          </span>
        )}
      </div>

      {result.generatedPasswords?.length > 0 && (
        <div className="mb-4 max-h-40 overflow-y-auto rounded-lg border border-dune-100 p-3">
          <ul className="space-y-1 text-xs text-dune-600">
            {result.generatedPasswords.map((p) => (
              <li key={p.email}>{t('import.generatedPassword', { email: p.email, password: p.password })}</li>
            ))}
          </ul>
        </div>
      )}

      {result.errors.length > 0 && (
        <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-absent/20 bg-absent/5 p-3">
          <ul className="space-y-1 text-xs text-absent">
            {result.errors.map((e, i) => (
              <li key={i}>{t('import.rowError', { row: e.row, message: e.message })}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <button className="btn-primary" onClick={onClose}>
          {t('import.done')}
        </button>
      </div>
    </Modal>
  );
}
