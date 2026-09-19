import { useEffect, useState } from 'react';
import * as adminsApi from '../../api/admins.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Badge from '../../components/Badge.jsx';

export default function Admins() {
  const { showToast } = useToast();
  const { t } = useI18n();
  const { profile: currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [passwordTarget, setPasswordTarget] = useState(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setAdmins(await adminsApi.listAdmins());
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
        await adminsApi.updateAdmin(editing.id, payload);
        showToast(t('toast.updated'));
      } else {
        await adminsApi.createAdmin(payload);
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

  const toggleActive = async (admin) => {
    try {
      if (admin.profile.is_active) {
        await adminsApi.deactivateAdmin(admin.id);
        showToast(t('toast.deactivated'));
      } else {
        await adminsApi.activateAdmin(admin.id);
        showToast(t('toast.activated'));
      }
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const savePassword = async (password) => {
    setPasswordSaving(true);
    try {
      await adminsApi.updateAdminPassword(passwordTarget.id, password);
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
      await adminsApi.deleteAdmin(confirmTarget.id);
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
          <h1 className="font-display text-3xl mb-1">{t('admins.title')}</h1>
          <p className="text-dune-600">{t('admins.subtitle')}</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          + {t('admins.new')}
        </button>
      </div>

      {admins.length === 0 ? (
        <EmptyState title={t('admins.noneFound')} />
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-dune-600 border-b border-dune-100">
                <th className="p-3">{t('admins.colName')}</th>
                <th className="p-3">{t('admins.colEmail')}</th>
                <th className="p-3">{t('common.status')}</th>
                <th className="p-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-dune-100 last:border-0">
                  <td className="p-3 font-medium">
                    {a.profile.full_name} {a.id === currentUser.id && <span className="text-xs text-dune-300">{t('common.you')}</span>}
                  </td>
                  <td className="p-3 text-dune-600">{a.profile.email}</td>
                  <td className="p-3">
                    <Badge variant={a.profile.is_active ? 'active' : 'inactive'}>
                      {a.profile.is_active ? t('common.active') : t('common.inactive')}
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
                      <button className="btn-ghost !px-2 !py-1" onClick={() => setPasswordTarget(a)}>
                        {t('common.resetPassword')}
                      </button>
                      <button className="btn-ghost !px-2 !py-1" onClick={() => toggleActive(a)}>
                        {a.profile.is_active ? t('common.deactivate') : t('common.activate')}
                      </button>
                      {a.id !== currentUser.id && (
                        <button
                          className="btn-ghost !px-2 !py-1 text-absent"
                          onClick={() => setConfirmTarget(a)}
                        >
                          {t('common.delete')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? t('admins.edit') : t('admins.new')}>
        <AdminForm initial={editing} saving={saving} onSubmit={handleSave} t={t} />
      </Modal>

      <Modal open={!!passwordTarget} onClose={() => setPasswordTarget(null)} title={t('common.resetPassword')}>
        <PasswordForm
          description={t('admins.resetPasswordDesc', { name: passwordTarget?.profile?.full_name })}
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
        title={t('admins.deleteTitle')}
        message={t('admins.deleteMsg', { name: confirmTarget?.profile?.full_name })}
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}

function AdminForm({ initial, saving, onSubmit, t }) {
  const [fullName, setFullName] = useState(initial?.profile?.full_name || '');
  const [email, setEmail] = useState(initial?.profile?.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = t('common.required');
    if (!initial) {
      if (!email.trim()) errs.email = t('common.required');
      if (password.length < 8) errs.password = t('common.required');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = initial ? { fullName, phone } : { fullName, email, password, phone };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="label">{t('common.fullName')}</label>
        <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        {errors.fullName && <p className="text-xs text-absent mt-1">{errors.fullName}</p>}
      </div>
      {!initial && (
        <>
          <div className="mb-4">
            <label className="label">{t('common.email')}</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {errors.email && <p className="text-xs text-absent mt-1">{errors.email}</p>}
          </div>
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
        </>
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
