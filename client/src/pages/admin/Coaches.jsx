import { useEffect, useRef, useState } from 'react';
import * as coachesApi from '../../api/coaches.js';
import * as categoriesApi from '../../api/categories.js';
import * as coachCategoriesApi from '../../api/coachCategories.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { exportToXlsx, parseXlsxFile, generateRandomPassword } from '../../utils/xlsx.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Badge from '../../components/Badge.jsx';
import ImportResultModal from '../../components/ImportResultModal.jsx';

export default function Coaches() {
  const { showToast } = useToast();
  const { t } = useI18n();
  const [coaches, setCoaches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignCoach, setAssignCoach] = useState(null);
  const [assignSelection, setAssignSelection] = useState([]);
  const [assignSaving, setAssignSaving] = useState(false);

  const [passwordTarget, setPasswordTarget] = useState(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const [c, cat] = await Promise.all([coachesApi.listCoaches(), categoriesApi.listCategories()]);
      setCoaches(c);
      setCategories(cat);
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

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (coach) => {
    setEditing(coach);
    setFormOpen(true);
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        await coachesApi.updateCoach(editing.id, payload);
        showToast(t('toast.updated'));
      } else {
        await coachesApi.createCoach(payload);
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

  const toggleActive = async (coach) => {
    try {
      if (coach.profile.is_active) {
        await coachesApi.deactivateCoach(coach.id);
        showToast(t('toast.deactivated'));
      } else {
        await coachesApi.activateCoach(coach.id);
        showToast(t('toast.activated'));
      }
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openAssign = async (coach) => {
    setAssignCoach(coach);
    setAssignOpen(true);
    try {
      const assigned = await coachCategoriesApi.getCategoriesForCoach(coach.id);
      setAssignSelection(assigned.map((c) => c.id));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const saveAssign = async () => {
    setAssignSaving(true);
    try {
      await coachCategoriesApi.setCoachCategories(assignCoach.id, assignSelection);
      showToast(t('toast.updated'));
      setAssignOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAssignSaving(false);
    }
  };

  const savePassword = async (password) => {
    setPasswordSaving(true);
    try {
      await coachesApi.updateCoachPassword(passwordTarget.id, password);
      showToast(t('toast.passwordUpdated'));
      setPasswordTarget(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirmLoading(true);
    try {
      await coachesApi.deleteCoach(confirmTarget.id);
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
    const rows = coaches.map((c) => ({
      full_name: c.profile.full_name,
      email: c.profile.email,
      phone: c.phone || '',
      specialty: c.specialty || '',
      status: c.profile.is_active ? 'active' : 'inactive',
    }));
    exportToXlsx(rows, 'coaches.xlsx', 'Coaches');
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImporting(true);
    const errors = [];
    const generatedPasswords = [];
    let successCount = 0;

    try {
      const rows = await parseXlsxFile(file);
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // header is row 1
        try {
          if (!row.full_name || !row.email) {
            throw new Error('full_name and email are required');
          }
          const password = row.password && String(row.password).length >= 8 ? String(row.password) : generateRandomPassword();
          await coachesApi.createCoach({
            fullName: row.full_name,
            email: row.email,
            password,
            phone: row.phone || '',
            specialty: row.specialty || '',
          });
          if (!row.password) generatedPasswords.push({ email: row.email, password });
          successCount++;
        } catch (err) {
          errors.push({ row: rowNumber, message: err.message || 'Import failed' });
        }
      }
      setImportResult({ successCount, errors, generatedPasswords });
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  const filtered = coaches.filter((c) =>
    c.profile.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.profile.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner label={t('common.loading')} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl mb-1">{t('coaches.title')}</h1>
          <p className="text-dune-600">{t('coaches.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={handleExport}>
            {t('common.export')}
          </button>
          <button className="btn-secondary" onClick={handleImportClick} disabled={importing}>
            {importing ? t('import.processing') : t('common.import')}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleImportFile} />
          <button className="btn-primary" onClick={openCreate}>
            + {t('coaches.new')}
          </button>
        </div>
      </div>

      <input
        className="input max-w-xs mb-4"
        placeholder={t('coaches.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <EmptyState title={t('coaches.noneFound')} description={t('coaches.noneFoundDesc')} />
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-dune-600 border-b border-dune-100">
                <th className="p-3">{t('coaches.colName')}</th>
                <th className="p-3">{t('coaches.colEmail')}</th>
                <th className="p-3">{t('coaches.colSpecialty')}</th>
                <th className="p-3">{t('common.status')}</th>
                <th className="p-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-dune-100 last:border-0">
                  <td className="p-3 font-medium">{c.profile.full_name}</td>
                  <td className="p-3 text-dune-600">{c.profile.email}</td>
                  <td className="p-3 text-dune-600">{c.specialty || '—'}</td>
                  <td className="p-3">
                    <Badge variant={c.profile.is_active ? 'active' : 'inactive'}>
                      {c.profile.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button className="btn-ghost !px-2 !py-1" onClick={() => openEdit(c)}>
                        {t('common.edit')}
                      </button>
                      <button className="btn-ghost !px-2 !py-1" onClick={() => openAssign(c)}>
                        {t('coaches.categoriesBtn')}
                      </button>
                      <button className="btn-ghost !px-2 !py-1" onClick={() => setPasswordTarget(c)}>
                        {t('common.resetPassword')}
                      </button>
                      <button className="btn-ghost !px-2 !py-1" onClick={() => toggleActive(c)}>
                        {c.profile.is_active ? t('common.deactivate') : t('common.activate')}
                      </button>
                      <button
                        className="btn-ghost !px-2 !py-1 text-absent"
                        onClick={() => setConfirmTarget(c)}
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? t('coaches.edit') : t('coaches.new')}>
        <CoachForm initial={editing} saving={saving} onSubmit={handleSave} t={t} />
      </Modal>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title={t('coaches.assignCategoriesTitle')}>
        <div className="space-y-2 mb-6 max-h-72 overflow-y-auto">
          {categories.length === 0 && <p className="text-sm text-dune-600">{t('coaches.noCategoriesYet')}</p>}
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={assignSelection.includes(cat.id)}
                onChange={(e) =>
                  setAssignSelection((prev) =>
                    e.target.checked ? [...prev, cat.id] : prev.filter((id) => id !== cat.id)
                  )
                }
              />
              {cat.name}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setAssignOpen(false)}>
            {t('common.cancel')}
          </button>
          <button className="btn-primary" onClick={saveAssign} disabled={assignSaving}>
            {assignSaving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </Modal>

      <Modal open={!!passwordTarget} onClose={() => setPasswordTarget(null)} title={t('common.resetPassword')}>
        <PasswordForm
          description={t('coaches.resetPasswordDesc', { name: passwordTarget?.profile?.full_name })}
          saving={passwordSaving}
          onSubmit={savePassword}
          t={t}
        />
      </Modal>

      <ImportResultModal open={!!importResult} onClose={() => setImportResult(null)} result={importResult} />

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        loading={confirmLoading}
        title={t('coaches.deleteTitle')}
        message={t('coaches.deleteMsg', { name: confirmTarget?.profile?.full_name })}
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}

function CoachForm({ initial, saving, onSubmit, t }) {
  const [fullName, setFullName] = useState(initial?.profile?.full_name || '');
  const [email, setEmail] = useState(initial?.profile?.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [specialty, setSpecialty] = useState(initial?.specialty || '');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = t('common.required');
    if (!email.trim()) errs.email = t('common.required');
    if (!initial && password.length < 8) errs.password = t('common.required');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = initial
      ? { fullName, email, phone, specialty }
      : { fullName, email, password, phone, specialty };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="label">{t('common.fullName')}</label>
        <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        {errors.fullName && <p className="text-xs text-absent mt-1">{errors.fullName}</p>}
      </div>
      <div className="mb-4">
        <label className="label">{t('common.email')}</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {errors.email && <p className="text-xs text-absent mt-1">{errors.email}</p>}
      </div>
      {!initial && (
        <div className="mb-4">
          <label className="label">{t('common.password')}</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <p className="text-xs text-absent mt-1">{errors.password}</p>}
        </div>
      )}
      <div className="mb-4">
        <label className="label">{t('common.phoneOptional')}</label>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="mb-6">
        <label className="label">{t('coaches.specialtyOptional')}</label>
        <input className="input" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={saving}>
        {saving ? t('common.saving') : t('common.save')}
      </button>
    </form>
  );
}

function PasswordForm({ description, saving, onSubmit, t }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError(t('common.required'));
      return;
    }
    onSubmit(password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-sm text-dune-600 mb-4">{description}</p>
      <div className="mb-6">
        <label className="label">{t('common.newPassword')}</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-xs text-absent mt-1">{error}</p>}
      </div>
      <button type="submit" className="btn-primary w-full" disabled={saving}>
        {saving ? t('common.saving') : t('common.save')}
      </button>
    </form>
  );
}
