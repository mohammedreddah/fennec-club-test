import { useEffect, useRef, useState } from 'react';
import * as categoriesApi from '../../api/categories.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { parseXlsxFile } from '../../utils/xlsx.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import ImportResultModal from '../../components/ImportResultModal.jsx';

export default function Categories() {
  const { showToast } = useToast();
  const { t } = useI18n();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      setCategories(await categoriesApi.listCategories());
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
        await categoriesApi.updateCategory(editing.id, payload);
        showToast(t('toast.updated'));
      } else {
        await categoriesApi.createCategory(payload);
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
      await categoriesApi.deleteCategory(confirmTarget.id);
      showToast(t('toast.deleted'));
      setConfirmTarget(null);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImporting(true);
    const errors = [];
    let successCount = 0;

    try {
      const rows = await parseXlsxFile(file);
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;
        try {
          if (!row.name) throw new Error('name is required');
          await categoriesApi.createCategory({ name: row.name, description: row.description || '' });
          successCount++;
        } catch (err) {
          errors.push({ row: rowNumber, message: err.message || 'Import failed' });
        }
      }
      setImportResult({ successCount, errors, generatedPasswords: [] });
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <LoadingSpinner label={t('common.loading')} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl mb-1">{t('categories.title')}</h1>
          <p className="text-dune-600">{t('categories.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={handleImportClick} disabled={importing}>
            {importing ? t('import.processing') : t('common.import')}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleImportFile} />
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            + {t('categories.new')}
          </button>
        </div>
      </div>

      <p className="text-xs text-dune-300 mb-4">{t('categories.importTemplate')}</p>

      {categories.length === 0 ? (
        <EmptyState title={t('categories.noneFound')} description={t('categories.noneFoundDesc')} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="card card-hover">
              <p className="font-display text-lg">{cat.name}</p>
              <p className="text-sm text-dune-600 mt-1 min-h-[1.25rem]">{cat.description}</p>
              <div className="flex gap-2 mt-4">
                <button
                  className="btn-secondary !px-3 !py-1 text-xs"
                  onClick={() => {
                    setEditing(cat);
                    setFormOpen(true);
                  }}
                >
                  {t('common.edit')}
                </button>
                <button
                  className="btn-ghost !px-3 !py-1 text-xs text-absent"
                  onClick={() => setConfirmTarget(cat)}
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? t('categories.edit') : t('categories.new')}>
        <CategoryForm initial={editing} saving={saving} onSubmit={handleSave} t={t} />
      </Modal>

      <ImportResultModal open={!!importResult} onClose={() => setImportResult(null)} result={importResult} />

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        loading={confirmLoading}
        title={t('categories.deleteTitle')}
        message={t('categories.deleteMsg', { name: confirmTarget?.name })}
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}

function CategoryForm({ initial, saving, onSubmit, t }) {
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
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('categories.namePlaceholder')} />
        {error && <p className="text-xs text-absent mt-1">{error}</p>}
      </div>
      <div className="mb-6">
        <label className="label">{t('common.descriptionOptional')}</label>
        <textarea
          className="input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={saving}>
        {saving ? t('common.saving') : t('common.save')}
      </button>
    </form>
  );
}
