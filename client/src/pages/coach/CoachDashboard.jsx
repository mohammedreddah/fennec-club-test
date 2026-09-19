import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tags, UserRound } from 'lucide-react';
import { getMyCategories } from '../../api/coachCategories.js';
import { listAthletes } from '../../api/athletes.js';
import { listSessions } from '../../api/attendance.js';
import { getAthletesWithMissingDocuments } from '../../api/documentStatus.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function CoachDashboard() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [categories, athletes, sessions, missingDocs] = await Promise.all([
          getMyCategories(),
          listAthletes({ isActive: 'true' }),
          listSessions(),
          getAthletesWithMissingDocuments(),
        ]);
        if (!mounted) return;
        setStats({
          categories,
          athleteCount: athletes.length,
          recentSessions: sessions.slice(0, 5),
          missingDocs: missingDocs.slice(0, 6),
        });
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingSpinner label={t('common.loading')} />;
  if (error) return <p className="text-absent text-sm">{error}</p>;

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">{t('dashboard.coach.title')}</h1>
      <p className="text-dune-600 mb-6">{t('dashboard.coach.subtitle')}</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card card-hover flex items-start justify-between">
          <div>
            <p className="text-3xl font-display text-fennec-600">{stats.categories.length}</p>
            <p className="text-sm text-dune-600 mt-1">{t('dashboard.assignedCategories')}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fennec-50 text-fennec-500">
            <Tags size={20} />
          </div>
        </div>
        <div className="card card-hover flex items-start justify-between">
          <div>
            <p className="text-3xl font-display text-fennec-600">{stats.athleteCount}</p>
            <p className="text-sm text-dune-600 mt-1">{t('dashboard.athletesCount')}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fennec-50 text-fennec-500">
            <UserRound size={20} />
          </div>
        </div>
      </div>

      {stats.categories.length === 0 && (
        <div className="mb-6">
          <EmptyState title={t('dashboard.noCategoriesAssigned')} description={t('dashboard.noCategoriesAssignedDesc')} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg">{t('dashboard.recentSessions')}</h2>
            <Link to="/coach/attendance/history" className="text-sm text-fennec-600 hover:underline">
              {t('dashboard.viewAll')}
            </Link>
          </div>
          {stats.recentSessions.length === 0 ? (
            <EmptyState title={t('dashboard.noSessions')} description={t('dashboard.startFirstSession')} />
          ) : (
            <ul className="divide-y divide-dune-100">
              {stats.recentSessions.map((s) => (
                <li key={s.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{s.category?.name}</p>
                    <p className="text-dune-600">{s.session_date}</p>
                  </div>
                  <span className="text-dune-600">{s.records?.length || 0} {t('dashboard.athletesLabel')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg">{t('dashboard.missingDocs')}</h2>
            <Link to="/coach/documents" className="text-sm text-fennec-600 hover:underline">
              {t('dashboard.viewAll')}
            </Link>
          </div>
          {stats.missingDocs.length === 0 ? (
            <EmptyState title={t('dashboard.allCaughtUp')} description={t('dashboard.allCaughtUpDesc')} />
          ) : (
            <ul className="divide-y divide-dune-100">
              {stats.missingDocs.map((a) => (
                <li key={a.id} className="py-3 text-sm">
                  {a.first_name} {a.last_name}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
