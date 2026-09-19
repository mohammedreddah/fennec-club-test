import { useEffect, useState } from 'react';
import * as parentsApi from '../../api/parents.js';
import * as athletesApi from '../../api/athletes.js';
import * as parentAthletesApi from '../../api/parentAthletes.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Badge from '../../components/Badge.jsx';

export default function Parents() {
  const { showToast } = useToast();
  const { t } = useI18n();
  const [parents, setParents] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignParent, setAssignParent] = useState(null);
  const [assignSelection, setAssignSelection] = useState([]);
  const [assignSaving, setAssignSaving] = useState(false);

  const [passwordTarget, setPasswordTarget] = useState(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([parentsApi.listParents(), athletesApi.listAthletes({ isActive: 'true' })]);
      setParents(p);
      setAthletes(a);
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
        await parentsApi.updateParent(editing.id, payload);
        showToast(t('toast.updated'));
      } else {
        await parentsApi.createParent(payload);
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

  const toggleActive = async (parent) => {
    try {
      if (parent.profile.is_active) {
        await parentsApi.deactivateParent(parent.id);
        showToast(t('toast.deactivated'));
      } else {
        await parentsApi.activateParent(parent.id);
        showToast(t('toast.activated'));
      }
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openAssign = async (parent) => {
    setAssignParent(parent);
    setAssignOpen(true);
    try {
      const linked = await parentAthletesApi.getAthletesForParent(parent.id);
      setAssignSelection(linked.map((a) => a.id));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const saveAssign = async () => {
    setAssignSaving(true);
    try {
      await parentAthletesApi.setParentAthletes(assignParent.id, assignSelection);
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
      await parentsApi.updateParentPassword(passwordTarget.id, password);
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
      await parentsApi.deleteParent(confirmTarget.id);
      showToast(t('toast.deleted'));
      setConfirmTarget(null);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  const filtered = parents.filter((p) =>
    p.profile.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.profile.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner label={t('common.loading')} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl mb-1">{t('parents.title')}</h1>
          <p className="text-dune-600">{t('parents.subtitle')}</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + {t('parents.new')}
        </button>
      </div>

      <input
        className="input max-w-xs mb-4"
        placeholder={t('parents.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <EmptyState title={t('parents.noneFound')} description={t('parents.noneFoundDesc')} />
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-dune-600 border-b border-dune-100">
                <th className="p-3">{t('parents.colName')}</th>
                <th className="p-3">{t('parents.colEmail')}</th>
                <th className="p-3">{t('common.status')}</th>
                <th className="p-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-dune-100 last:border-0">
                  <td className="p-3 font-medium">{p.profile.full_name}</td>
                  <td className="p-3 text-dune-600">{p.profile.email}</td>
                  <td className="p-3">
                    <Badge variant={p.profile.is_active ? 'active' : 'inactive'}>
                      {p.profile.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn-ghost !px-2 !py-1"
                        onClick={() => {
                          setEditing(p);
                          setFormOpen(true);
                        }}
                      >
                        {t('common.edit')}
                      </button>
                      <button className="btn-ghost !px-2 !py-1" onClick={() => openAssign(p)}>
                        {t('parents.athletesBtn')}
                      </button>
                      <button className="btn-ghost !px-2 !py-1" onClick={() => setPasswordTarget(p)}>
                        {t('common.resetPassword')}
                      </button>
                      <button className="btn-ghost !px-2 !py-1" onClick={() => toggleActive(p)}>
                        {p.profile.is_active ? t('common.deactivate') : t('common.activate')}
                      </button>
                      <button
                        className="btn-ghost !px-2 !py-1 text-absent"
                        onClick={() => setConfirmTarget(p)}
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? t('parents.edit') : t('parents.new')}>
        <ParentForm initial={editing} saving={saving} onSubmit={handleSave} t={t} />
      </Modal>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title={t('parents.assignAthletesTitle')}>
        <div className="space-y-2 mb-6 max-h-72 overflow-y-auto">
          {athletes.length === 0 && <p className="text-sm text-dune-600">{t('parents.noAthletesYet')}</p>}
          {athletes.map((a) => (
            <label key={a.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={assignSelection.includes(a.id)}
                onChange={(e) =>
                  setAssignSelection((prev) =>
                    e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id)
                  )
                }
              />
              {a.first_name} {a.last_name}
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
          description={t('parents.resetPasswordDesc', { name: passwordTarget?.profile?.full_name })}
          saving={passwordSaving}
          onSubmit={savePassword}
          t={t}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        loading={confirmLoading}
        title={t('parents.deleteTitle')}
        message={t('parents.deleteMsg', { name: confirmTarget?.profile?.full_name })}
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}

function ParentForm({ initial, saving, onSubmit, t }) {
  const [fullName, setFullName] = useState(initial?.profile?.full_name || '');
  const [email, setEmail] = useState(initial?.profile?.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(initial?.phone || '');
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
    const payload = initial ? { fullName, email, phone } : { fullName, email, password, phone };
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
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {errors.password && <p className="text-xs text-absent mt-1">{errors.password}</p>}
        </div>
      )}
      <div className="mb-6">
        <label className="label">{t('common.phoneOptional')}</label>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
