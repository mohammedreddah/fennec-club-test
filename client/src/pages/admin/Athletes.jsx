import { useEffect, useRef, useState } from 'react';
import * as athletesApi from '../../api/athletes.js';
import * as categoriesApi from '../../api/categories.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { exportToXlsx, parseXlsxFile } from '../../utils/xlsx.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Badge from '../../components/Badge.jsx';
import ImportResultModal from '../../components/ImportResultModal.jsx';

export default function Athletes() {
  const { showToast } = useToast();
  const { t } = useI18n();
  const [athletes, setAthletes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

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
      const [a, c] = await Promise.all([athletesApi.listAthletes(), categoriesApi.listCategories()]);
      setAthletes(a);
      setCategories(c);
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
        await athletesApi.updateAthlete(editing.id, payload);
        showToast(t('toast.updated'));
      } else {
        await athletesApi.createAthlete(payload);
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
      await athletesApi.deleteAthlete(confirmTarget.id);
      showToast(t('toast.deleted'));
      setConfirmTarget(null);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleExport = () => {
    const rows = athletes.map((a) => ({
      first_name: a.first_name,
      last_name: a.last_name,
      date_of_birth: a.date_of_birth,
      gender: a.gender,
      phone_number: a.phone_number || '',
      guardian_name: a.guardian_name,
      guardian_phone: a.guardian_phone,
      address: a.address || '',
      category: a.category?.name || '',
      status: a.is_active ? 'active' : 'inactive',
    }));
    exportToXlsx(rows, 'athletes.xlsx', 'Athletes');
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
          if (!row.first_name || !row.last_name) throw new Error('first_name and last_name are required');
          if (!row.date_of_birth) throw new Error('date_of_birth is required');
          if (!row.guardian_name || !row.guardian_phone) throw new Error('guardian_name and guardian_phone are required');

          const categoryName = String(row.category || '').trim();
          let categoryId = '';
          if (categoryName) {
            const category = categories.find((c) => c.name.trim().toLowerCase() === categoryName.toLowerCase());
            if (!category) throw new Error(`category "${row.category}" not found`);
            categoryId = category.id;
          }

          await athletesApi.createAthlete({
            first_name: row.first_name,
            last_name: row.last_name,
            date_of_birth: row.date_of_birth,
            gender: (row.gender || 'male').toLowerCase() === 'female' ? 'female' : 'male',
            phone_number: row.phone_number || '',
            guardian_name: row.guardian_name,
            guardian_phone: row.guardian_phone,
            address: row.address || '',
            category_id: categoryId,
          });
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

  const filtered = athletes.filter((a) => {
    const matchesSearch = `${a.first_name} ${a.last_name}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || a.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <LoadingSpinner label={t('common.loading')} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl mb-1">{t('athletes.title')}</h1>
          <p className="text-dune-600">{t('athletes.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={handleExport}>
            {t('common.export')}
          </button>
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
            + {t('athletes.new')}
          </button>
        </div>
      </div>

      <p className="text-xs text-dune-300 mb-4">{t('athletes.importTemplate')}</p>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className="input max-w-xs"
          placeholder={t('athletes.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input max-w-xs" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">{t('common.allCategories')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('athletes.noneFound')} description={t('athletes.noneFoundDesc')} />
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-dune-600 border-b border-dune-100">
                <th className="p-3">{t('athletes.colName')}</th>
                <th className="p-3">{t('athletes.colCategory')}</th>
                <th className="p-3">{t('athletes.colGuardian')}</th>
                <th className="p-3">{t('common.status')}</th>
                <th className="p-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-dune-100 last:border-0">
                  <td className="p-3 font-medium">
                    {a.first_name} {a.last_name}
                  </td>
                  <td className="p-3 text-dune-600">{a.category?.name || t('athletes.noCategory')}</td>
                  <td className="p-3 text-dune-600">{a.guardian_name}</td>
                  <td className="p-3">
                    <Badge variant={a.is_active ? 'active' : 'inactive'}>
                      {a.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn-ghost !px-2 !py-1"
                        onClick={() => {
                          setEditing(a);
                          setFormOpen(true);
                        }}
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        className="btn-ghost !px-2 !py-1 text-absent"
                        onClick={() => setConfirmTarget(a)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? t('athletes.edit') : t('athletes.new')}
        width="max-w-2xl"
      >
        <AthleteForm initial={editing} categories={categories} saving={saving} onSubmit={handleSave} t={t} />
      </Modal>

      <ImportResultModal open={!!importResult} onClose={() => setImportResult(null)} result={importResult} />

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        loading={confirmLoading}
        title={t('athletes.deleteTitle')}
        message={t('athletes.deleteMsg', { name: `${confirmTarget?.first_name || ''} ${confirmTarget?.last_name || ''}` })}
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}

function AthleteForm({ initial, categories, saving, onSubmit, t }) {
  const [form, setForm] = useState({
    first_name: initial?.first_name || '',
    last_name: initial?.last_name || '',
    date_of_birth: initial?.date_of_birth || '',
    gender: initial?.gender || 'male',
    phone_number: initial?.phone_number || '',
    guardian_name: initial?.guardian_name || '',
    guardian_phone: initial?.guardian_phone || '',
    address: initial?.address || '',
    category_id: initial?.category_id || '',
    is_active: initial ? initial.is_active : true,
  });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setDigitsOnly = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value.replace(/\D/g, '').slice(0, 10) }));

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = t('common.required');
    if (!form.last_name.trim()) errs.last_name = t('common.required');
    if (!form.date_of_birth) errs.date_of_birth = t('common.required');
    if (!form.guardian_name.trim()) errs.guardian_name = t('common.required');
    if (!/^[0-9]{10}$/.test(form.guardian_phone)) errs.guardian_phone = t('athletes.phoneDigitsError');
    if (form.phone_number && !/^[0-9]{10}$/.test(form.phone_number)) errs.phone_number = t('athletes.phoneDigitsError');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label">{t('athletes.firstName')}</label>
          <input className="input" value={form.first_name} onChange={set('first_name')} />
          {errors.first_name && <p className="text-xs text-absent mt-1">{errors.first_name}</p>}
        </div>
        <div>
          <label className="label">{t('athletes.lastName')}</label>
          <input className="input" value={form.last_name} onChange={set('last_name')} />
          {errors.last_name && <p className="text-xs text-absent mt-1">{errors.last_name}</p>}
        </div>
        <div>
          <label className="label">{t('athletes.dob')}</label>
          <input type="date" className="input" value={form.date_of_birth} onChange={set('date_of_birth')} />
          {errors.date_of_birth && <p className="text-xs text-absent mt-1">{errors.date_of_birth}</p>}
        </div>
        <div>
          <label className="label">{t('athletes.gender')}</label>
          <select className="input" value={form.gender} onChange={set('gender')}>
            <option value="male">{t('athletes.male')}</option>
            <option value="female">{t('athletes.female')}</option>
          </select>
        </div>
        <div>
          <label className="label">{t('athletes.phoneOptional')}</label>
          <input
            className="input"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.phone_number}
            onChange={setDigitsOnly('phone_number')}
          />
          {errors.phone_number && <p className="text-xs text-absent mt-1">{errors.phone_number}</p>}
        </div>
        <div>
          <label className="label">{t('common.category')}</label>
          <select className="input" value={form.category_id} onChange={set('category_id')}>
            <option value="">{t('athletes.noCategory')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t('athletes.guardianName')}</label>
          <input className="input" value={form.guardian_name} onChange={set('guardian_name')} />
          {errors.guardian_name && <p className="text-xs text-absent mt-1">{errors.guardian_name}</p>}
        </div>
        <div>
          <label className="label">{t('athletes.guardianPhone')}</label>
          <input
            className="input"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.guardian_phone}
            onChange={setDigitsOnly('guardian_phone')}
          />
          {errors.guardian_phone && <p className="text-xs text-absent mt-1">{errors.guardian_phone}</p>}
        </div>
      </div>
      <div className="mb-4">
        <label className="label">{t('athletes.addressOptional')}</label>
        <input className="input" value={form.address} onChange={set('address')} />
      </div>
      {initial && (
        <label className="flex items-center gap-2 text-sm mb-6">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
          />
          {t('athletes.activeAthlete')}
        </label>
      )}
      <button type="submit" className="btn-primary w-full" disabled={saving}>
        {saving ? t('common.saving') : t('common.save')}
      </button>
    </form>
  );
}
