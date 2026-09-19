import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import * as parentAthletesApi from '../../api/parentAthletes.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { formatDateDMY } from '../../utils/formatDate.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Badge from '../../components/Badge.jsx';

export default function ChildDetail() {
  const { athleteId } = useParams();
  const { showToast } = useToast();
  const { t } = useI18n();

  const [athlete, setAthlete] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [a, att, docs] = await Promise.all([
          parentAthletesApi.getMyAthleteDetail(athleteId),
          parentAthletesApi.getMyAthleteAttendance(athleteId),
          parentAthletesApi.getMyAthleteDocuments(athleteId),
        ]);
        setAthlete(a);
        setAttendance(att);
        setDocuments(docs);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId]);

  if (loading) return <LoadingSpinner label={t('common.loading')} />;
  if (!athlete) return null;

  return (
    <div>
      <Link to="/parent" className="inline-flex items-center gap-1 text-sm text-fennec-600 hover:underline mb-4">
        <ChevronLeft size={16} />
        {t('parentPortal.backToDashboard')}
      </Link>

      <h1 className="font-display text-3xl mb-1">
        {athlete.first_name} {athlete.last_name}
      </h1>
      <p className="text-dune-600 mb-6">{athlete.category?.name || t('athletes.noCategory')}</p>

      <div className="grid gap-6">
        <section className="card">
          <h2 className="font-display text-lg mb-4">{t('parentPortal.attendanceHistory')}</h2>
          {attendance.length === 0 ? (
            <EmptyState title={t('attendance.noneFoundMy')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-dune-600 border-b border-dune-100">
                    <th className="p-2">{t('attendance.colDate')}</th>
                    <th className="p-2">{t('attendance.colType')}</th>
                    <th className="p-2">{t('attendance.colCoach')}</th>
                    <th className="p-2">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((r) => {
                    const coachNames = [r.coach_name, ...(r.additional_coach_names || [])].filter(Boolean).join(', ');
                    return (
                      <tr key={r.id} className="border-b border-dune-100 last:border-0">
                        <td className="p-2">{formatDateDMY(r.session_date)}</td>
                        <td className="p-2 text-dune-600">{r.session_type?.name || '—'}</td>
                        <td className="p-2 text-dune-600">{coachNames}</td>
                        <td className="p-2">
                          <Badge variant={r.status === 'present' ? 'present' : 'absent'}>
                            {r.status === 'present' ? t('startAttendance.present') : t('startAttendance.absent')}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="font-display text-lg mb-4">{t('parentPortal.documentsTitle')}</h2>
          {documents.length === 0 ? (
            <EmptyState title={t('documents.noFoldersYet')} />
          ) : (
            <div className="space-y-4">
              {documents.map((folder) => (
                <div key={folder.id}>
                  <p className="font-display text-base mb-2">{folder.name}</p>
                  <ul className="divide-y divide-dune-100">
                    {folder.documents.map(({ requirement, status }) => (
                      <li key={requirement.id} className="py-2 flex items-center justify-between flex-wrap gap-1">
                        <span className="text-sm">{requirement.name}</span>
                        <div className="flex items-center gap-3">
                          {status.is_received && (
                            <span className="text-xs text-dune-600">
                              {formatDateDMY(status.marked_at)}
                              {status.marked_by_coach?.full_name ? ` · ${status.marked_by_coach.full_name}` : ''}
                            </span>
                          )}
                          <Badge variant={status.is_received ? 'received' : 'missing'}>
                            {status.is_received ? t('documents.received') : t('documents.missing')}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
