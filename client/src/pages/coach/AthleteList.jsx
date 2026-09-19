import { useEffect, useState } from 'react';
import { listAthletes } from '../../api/athletes.js';
import { getMyCategories } from '../../api/coachCategories.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { formatDateDMY } from '../../utils/formatDate.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function AthleteList() {
  const { showToast } = useToast();
  const { t } = useI18n();
  const [athletes, setAthletes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [a, c] = await Promise.all([listAthletes({ isActive: 'true' }), getMyCategories()]);
        setAthletes(a);
        setCategories(c);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = athletes.filter((a) => {
    const matchesSearch = `${a.first_name} ${a.last_name}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || a.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <LoadingSpinner label={t('common.loading')} />;

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">{t('athletesList.title')}</h1>
      <p className="text-dune-600 mb-6">{t('athletesList.subtitle')}</p>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className="input max-w-xs"
          placeholder={t('athletes.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {categories.length > 1 && (
          <select className="input max-w-xs" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">{t('athletesList.allMyCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('athletesList.noneFound')} />
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-dune-600 border-b border-dune-100">
                <th className="p-3">{t('athletes.colName')}</th>
                <th className="p-3">{t('athletes.colCategory')}</th>
                <th className="p-3">{t('athletes.colDob')}</th>
                <th className="p-3">{t('athletes.colGuardian')}</th>
                <th className="p-3">{t('athletes.colGuardianPhone')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-dune-100 last:border-0">
                  <td className="p-3 font-medium">
                    {a.first_name} {a.last_name}
                  </td>
                  <td className="p-3 text-dune-600">{a.category?.name}</td>
                  <td className="p-3 text-dune-600">{formatDateDMY(a.date_of_birth)}</td>
                  <td className="p-3 text-dune-600">{a.guardian_name}</td>
                  <td className="p-3 text-dune-600">{a.guardian_phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
