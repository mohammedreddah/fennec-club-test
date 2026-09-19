import { useEffect, useState } from 'react';
import { formatDateDMY } from '../../utils/formatDate.js';
import * as attendanceApi from '../../api/attendance.js';
import { listSessionTypes } from '../../api/sessionTypes.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';

export default function AttendanceHistory() {
  const { showToast } = useToast();
  const { t } = useI18n();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailSession, setDetailSession] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setSessions(await attendanceApi.listSessions());
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

  if (loading) return <LoadingSpinner label={t('common.loading')} />;

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">{t('attendance.historyTitle')}</h1>
      <p className="text-dune-600 mb-6">{t('attendance.mySubtitle')}</p>

      {sessions.length === 0 ? (
        <EmptyState title={t('attendance.noneFoundMy')} description={t('attendance.noneFoundMyDesc')} />
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-dune-600 border-b border-dune-100">
                <th className="p-3">{t('attendance.colDate')}</th>
                <th className="p-3">{t('attendance.colCategory')}</th>
                <th className="p-3">{t('attendance.colType')}</th>
                <th className="p-3">{t('attendance.colPresentTotal')}</th>
                <th className="p-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const present = s.records?.filter((r) => r.status === 'present').length || 0;
                return (
                  <tr key={s.id} className="border-b border-dune-100 last:border-0">
                    <td className="p-3">{formatDateDMY(s.session_date)}</td>
                    <td className="p-3">{s.category?.name}</td>
                    <td className="p-3 text-dune-600">{s.session_type?.name || '—'}</td>
                    <td className="p-3">
                      {present} / {s.records?.length || 0}
                    </td>
                    <td className="p-3">
                      <button className="btn-ghost !px-2 !py-1" onClick={() => setDetailSession(s)}>
                        {t('common.viewEdit')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <SessionDetailModal
        session={detailSession}
        onClose={() => setDetailSession(null)}
        onSaved={() => {
          setDetailSession(null);
          load();
        }}
        t={t}
      />
    </div>
  );
}

function SessionDetailModal({ session, onClose, onSaved, t }) {
  const { showToast } = useToast();
  const [note, setNote] = useState('');
  const [sessionTypeId, setSessionTypeId] = useState('');
  const [sessionTypes, setSessionTypes] = useState([]);
  const [records, setRecords] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session) {
      setNote(session.note || '');
      setSessionTypeId(session.session_type?.id || '');
      setRecords(session.records || []);
      listSessionTypes().then(setSessionTypes);
    }
  }, [session]);

  if (!session) return null;

  const toggleStatus = (athleteId) => {
    setRecords((prev) =>
      prev.map((r) => (r.athlete_id === athleteId ? { ...r, status: r.status === 'present' ? 'absent' : 'present' } : r))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await attendanceApi.updateSession(session.id, {
        note,
        session_type_id: sessionTypeId || '',
        records: records.map((r) => ({ athlete_id: r.athlete_id, status: r.status, note: r.note })),
      });
      showToast(t('toast.updated'));
      onSaved();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const coachNames = [session.coach?.profile?.full_name, ...(session.additional_coaches || []).map((c) => c.full_name)]
    .filter(Boolean)
    .join(', ');

  return (
    <Modal open={!!session} onClose={onClose} title={`${t('attendance.session')} · ${formatDateDMY(session.session_date)}`} width="max-w-xl">
      <p className="text-sm text-dune-600 mb-4">
        {session.category?.name} · {coachNames}
      </p>

      <div className="mb-4">
        <label className="label">{t('sessionTypes.selectType')}</label>
        <select className="input" value={sessionTypeId} onChange={(e) => setSessionTypeId(e.target.value)}>
          <option value="">—</option>
          {sessionTypes.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="label">{t('attendance.note')}</label>
        <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto mb-6">
        {records.map((r) => (
          <div key={r.athlete_id} className="flex items-center justify-between rounded-lg border border-dune-100 px-3 py-2">
            <span className="text-sm">
              {r.athlete?.first_name} {r.athlete?.last_name}
            </span>
            <button
              className={`badge ${r.status === 'present' ? 'bg-present/10 text-present' : 'bg-absent/10 text-absent'}`}
              onClick={() => toggleStatus(r.athlete_id)}
            >
              {r.status === 'present' ? t('startAttendance.present') : t('startAttendance.absent')}
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? t('common.saving') : t('attendance.saveChanges')}
        </button>
      </div>
    </Modal>
  );
}
