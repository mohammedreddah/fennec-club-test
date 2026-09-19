import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import * as parentAthletesApi from '../../api/parentAthletes.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function ParentDashboard() {
  const { showToast } = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setAthletes(await parentAthletesApi.getMyAthletes());
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingSpinner label={t('common.loading')} />;

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">{t('parentPortal.dashboardTitle')}</h1>
      <p className="text-dune-600 mb-6">{t('parentPortal.dashboardSubtitle')}</p>

      {athletes.length === 0 ? (
        <EmptyState title={t('parentPortal.noChildren')} description={t('parentPortal.noChildrenDesc')} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {athletes.map((a) => (
            <button
              key={a.id}
              onClick={() => navigate(`/parent/athletes/${a.id}`)}
              className="card card-hover text-start"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-fennec-50 text-fennec-500">
                  <UserRound size={20} />
                </div>
                <div>
                  <p className="font-display text-lg">
                    {a.first_name} {a.last_name}
                  </p>
                  <p className="text-xs text-dune-600">{a.category?.name || t('athletes.noCategory')}</p>
                </div>
              </div>
              <p className="text-sm text-fennec-600">{t('parentPortal.viewDetails')} →</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
