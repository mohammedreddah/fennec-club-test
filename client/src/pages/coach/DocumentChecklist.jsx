import { useEffect, useState } from 'react';
import { listAthletes } from '../../api/athletes.js';
import * as documentStatusApi from '../../api/documentStatus.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Badge from '../../components/Badge.jsx';

export default function DocumentChecklist() {
  const { showToast } = useToast();
  const { t } = useI18n();
  const [athletes, setAthletes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [loadingAthletes, setLoadingAthletes] = useState(true);
  const [loadingChecklist, setLoadingChecklist] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingAthletes(true);
      try {
        setAthletes(await listAthletes({ isActive: 'true' }));
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoadingAthletes(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectAthlete = async (athlete) => {
    setSelectedAthlete(athlete);
    setLoadingChecklist(true);
    try {
      setChecklist(await documentStatusApi.getChecklistForAthlete(athlete.id));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingChecklist(false);
    }
  };

  const toggleDoc = async (requirementId, currentlyReceived) => {
    try {
      await documentStatusApi.markDocumentStatus({
        athlete_id: selectedAthlete.id,
        document_requirement_id: requirementId,
        is_received: !currentlyReceived,
      });
      setChecklist(await documentStatusApi.getChecklistForAthlete(selectedAthlete.id));
      showToast(t('documents.statusUpdated'));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filtered = athletes.filter((a) => `${a.first_name} ${a.last_name}`.toLowerCase().includes(search.toLowerCase()));

  if (loadingAthletes) return <LoadingSpinner label={t('common.loading')} />;

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">{t('documents.checklistTitle')}</h1>
      <p className="text-dune-600 mb-6">{t('documents.checklistSubtitle')}</p>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card !p-0 md:col-span-1 overflow-hidden">
          <div className="p-3 border-b border-dune-100">
            <input
              className="input"
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ul className="max-h-[32rem] overflow-y-auto divide-y divide-dune-100">
            {filtered.map((a) => (
              <li key={a.id}>
                <button
                  className={`w-full text-start px-3 py-2 text-sm hover:bg-dune-50 ${
                    selectedAthlete?.id === a.id ? 'bg-fennec-50' : ''
                  }`}
                  onClick={() => selectAthlete(a)}
                >
                  <p className="font-medium">
                    {a.first_name} {a.last_name}
                  </p>
                  <p className="text-xs text-dune-600">{a.category?.name}</p>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="p-3 text-sm text-dune-600">{t('documents.noAthletesFound')}</li>}
          </ul>
        </div>

        <div className="md:col-span-2">
          {!selectedAthlete ? (
            <EmptyState title={t('documents.selectAthlete')} description={t('documents.selectAthleteDesc')} />
          ) : loadingChecklist ? (
            <LoadingSpinner label={t('common.loading')} />
          ) : checklist.length === 0 ? (
            <EmptyState title={t('documents.noFoldersYet')} description={t('documents.noFoldersYetDescCoach')} />
          ) : (
            <div className="space-y-4">
              <h2 className="font-display text-xl">
                {selectedAthlete.first_name} {selectedAthlete.last_name}
              </h2>
              {checklist.map((folder) => (
                <div key={folder.id} className="card">
                  <p className="font-display text-lg mb-3">{folder.name}</p>
                  <ul className="divide-y divide-dune-100">
                    {folder.documents.map(({ requirement, status }) => (
                      <li key={requirement.id} className="py-2 flex items-center justify-between">
                        <span className="text-sm">{requirement.name}</span>
                        <button
                          onClick={() => toggleDoc(requirement.id, status.is_received)}
                          className="flex items-center gap-2"
                        >
                          <input type="checkbox" readOnly checked={status.is_received} className="pointer-events-none" />
                          <Badge variant={status.is_received ? 'received' : 'missing'}>
                            {status.is_received ? t('documents.received') : t('documents.notReceived')}
                          </Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
