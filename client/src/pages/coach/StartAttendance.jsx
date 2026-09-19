import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCategories, getCoachesForCategory } from '../../api/coachCategories.js';
import { listAthletes } from '../../api/athletes.js';
import { createSession } from '../../api/attendance.js';
import { listSessionTypes } from '../../api/sessionTypes.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function StartAttendance() {
  const { showToast } = useToast();
  const { t } = useI18n();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [sessionTypes, setSessionTypes] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [sessionTypeId, setSessionTypeId] = useState('');

  const [sessionStarted, setSessionStarted] = useState(false);
  const [athletes, setAthletes] = useState([]);
  const [otherCoaches, setOtherCoaches] = useState([]);
  const [selectedCoachIds, setSelectedCoachIds] = useState([]);
  const [loadingAthletes, setLoadingAthletes] = useState(false);
  const [statuses, setStatuses] = useState({});
  const [note, setNote] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingCategories(true);
      try {
        const [cats, types] = await Promise.all([getMyCategories(), listSessionTypes()]);
        setCategories(cats);
        setSessionTypes(types);
        if (cats.length === 1) setCategoryId(cats[0].id);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoadingCategories(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = async () => {
    if (!categoryId) return;
    setLoadingAthletes(true);
    try {
      const [list, coaches] = await Promise.all([
        listAthletes({ categoryId, isActive: 'true' }),
        getCoachesForCategory(categoryId),
      ]);
      setAthletes(list);
      setOtherCoaches(coaches.filter((c) => c.id !== profile.id));
      setSelectedCoachIds([]);
      const initial = {};
      list.forEach((a) => {
        initial[a.id] = 'present';
      });
      setStatuses(initial);
      setSessionStarted(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingAthletes(false);
    }
  };

  const setStatus = (athleteId, status) => {
    setStatuses((prev) => ({ ...prev, [athleteId]: status }));
  };

  const markAll = (status) => {
    const next = {};
    athletes.forEach((a) => {
      next[a.id] = status;
    });
    setStatuses(next);
  };

  const toggleCoach = (coachId) => {
    setSelectedCoachIds((prev) =>
      prev.includes(coachId) ? prev.filter((id) => id !== coachId) : [...prev, coachId]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createSession({
        category_id: categoryId,
        session_date: sessionDate,
        session_type_id: sessionTypeId || undefined,
        note,
        records: athletes.map((a) => ({ athlete_id: a.id, status: statuses[a.id] })),
        additional_coach_ids: selectedCoachIds,
      });
      showToast(t('toast.created'));
      navigate('/coach/attendance/history');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCategories) return <LoadingSpinner label={t('common.loading')} />;

  if (categories.length === 0) {
    return (
      <EmptyState
        title={t('startAttendance.noCategoriesAssigned')}
        description={t('startAttendance.noCategoriesAssignedDesc')}
      />
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">{t('startAttendance.title')}</h1>
      <p className="text-dune-600 mb-6">{t('startAttendance.subtitle')}</p>

      {!sessionStarted ? (
        <div className="card max-w-md">
          <div className="mb-4">
            <label className="label">{t('startAttendance.category')}</label>
            <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">{t('startAttendance.selectCategory')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
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
          <div className="mb-6">
            <label className="label">{t('startAttendance.sessionDate')}</label>
            <input type="date" className="input" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
          </div>
          <button className="btn-primary w-full" onClick={startSession} disabled={!categoryId || loadingAthletes}>
            {loadingAthletes ? t('startAttendance.loadingAthletes') : t('startAttendance.startSession')}
          </button>
        </div>
      ) : athletes.length === 0 ? (
        <EmptyState title={t('startAttendance.noActiveAthletes')} />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-sm text-dune-600">
              {athletes.length} {t('startAttendance.athletesLabel')} · {sessionDate}
            </p>
            <div className="flex gap-2">
              <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => markAll('present')}>
                {t('startAttendance.markAllPresent')}
              </button>
              <button className="btn-secondary !px-3 !py-1 text-xs" onClick={() => markAll('absent')}>
                {t('startAttendance.markAllAbsent')}
              </button>
            </div>
          </div>

          <div className="card !p-0 overflow-hidden mb-4">
            <ul className="divide-y divide-dune-100">
              {athletes.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium">
                    {a.first_name} {a.last_name}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className={`badge ${
                        statuses[a.id] === 'present' ? 'bg-present text-white' : 'bg-dune-100 text-dune-600'
                      }`}
                      onClick={() => setStatus(a.id, 'present')}
                    >
                      {t('startAttendance.present')}
                    </button>
                    <button
                      className={`badge ${
                        statuses[a.id] === 'absent' ? 'bg-absent text-white' : 'bg-dune-100 text-dune-600'
                      }`}
                      onClick={() => setStatus(a.id, 'absent')}
                    >
                      {t('startAttendance.absent')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card mb-4">
            <label className="label">{t('startAttendance.additionalCoaches')}</label>
            {otherCoaches.length === 0 ? (
              <p className="text-sm text-dune-300">{t('startAttendance.noOtherCoaches')}</p>
            ) : (
              <div className="space-y-2">
                {otherCoaches.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedCoachIds.includes(c.id)}
                      onChange={() => toggleCoach(c.id)}
                    />
                    {c.profile.full_name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="card mb-4">
            <label className="label">{t('startAttendance.noteOptional')}</label>
            <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={() => setSessionStarted(false)} disabled={submitting}>
              {t('common.back')}
            </button>
            <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? t('startAttendance.submitting') : t('startAttendance.submit')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
