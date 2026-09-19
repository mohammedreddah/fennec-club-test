import { useEffect, useState } from 'react';
import * as sessionTypesApi from '../../api/sessionTypes.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';

export default function SessionTypes() {
  const { showToast } = useToast();
  const { t } = useI18n();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setTypes(await sessionTypesApi.listSessionTypes());
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        await sessionTypesApi.updateSessionType(editing.id, payload);
        showToast(t('toast.updated'));
      } else {
        await sessionTypesApi.createSessionType({ ...payload, display_order: types.length });
        showToast(t('toast.created'));
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirmLoading(true);
    try {
      await sessionTypesApi.deleteSessionType(confirmTarget.id);
      showToast(t('toast.deleted'));
      setConfirmTarget(null);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  if (loading) return <LoadingSpinner label={t('common.loading')} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl mb-1">{t('sessionTypes.title')}</h1>
          <p className="text-dune-600">{t('sessionTypes.subtitle')}</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + {t('sessionTypes.new')}
        </button>
      </div>

      {types.length === 0 ? (
        <EmptyState title={t('sessionTypes.noneFound')} description={t('sessionTypes.noneFoundDesc')} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((type) => (
            <div key={type.id} className="card card-hover">
              <p className="font-display text-lg">{type.name}</p>
              <p className="text-sm text-dune-600 mt-1 min-h-[1.25rem]">{type.description}</p>
              <div className="flex gap-2 mt-4">
                <button
                  className="btn-secondary !px-3 !py-1 text-xs"
                  onClick={() => {
                    setEditing(type);
                    setFormOpen(true);
                  }}
                >
                  {t('common.edit')}
                </button>
                <button
                  className="btn-ghost !px-3 !py-1 text-xs text-absent"
                  onClick={() => setConfirmTarget(type)}
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? t('sessionTypes.edit') : t('sessionTypes.new')}>
        <SessionTypeForm initial={editing} saving={saving} onSubmit={handleSave} t={t} />
      </Modal>

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        loading={confirmLoading}
        title={t('sessionTypes.deleteTitle')}
        message={t('sessionTypes.deleteMsg', { name: confirmTarget?.name })}
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}

function SessionTypeForm({ initial, saving, onSubmit, t }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('common.required'));
      return;
    }
    onSubmit({ name, description });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="label">{t('common.name')}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('sessionTypes.namePlaceholder')} />
        {error && <p className="text-xs text-absent mt-1">{error}</p>}
      </div>
      <div className="mb-6">
        <label className="label">{t('common.descriptionOptional')}</label>
        <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={saving}>
        {saving ? t('common.saving') : t('common.save')}
      </button>
    </form>
  );
}
