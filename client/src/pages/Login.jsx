import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

export default function Login() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const profile = await login(email, password);
      const home = profile.role === 'admin' ? '/admin' : profile.role === 'coach' ? '/coach' : '/parent';
      const dest = location.state?.from?.pathname;
      navigate(dest && dest !== '/' ? dest : home, { replace: true });
    } catch (err) {
      setError(err.message || t('login.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-ink flex items-center justify-center p-4"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(200,30,58,0.18), transparent 45%), radial-gradient(circle at 80% 80%, rgba(200,30,58,0.12), transparent 40%)',
      }}
    >
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <LanguageSwitcher variant="dark" />
        </div>
        <div className="flex flex-col items-center mb-8">
          <svg width="52" height="52" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <circle cx="20" cy="22" r="12" fill="#C81E3A" />
            <path d="M9 12 L15 22 L11 24Z" fill="#C81E3A" />
            <path d="M31 12 L25 22 L29 24Z" fill="#C81E3A" />
            <path d="M9 12 L14 20 L12 21Z" fill="#241416" />
            <path d="M31 12 L26 20 L28 21Z" fill="#241416" />
            <circle cx="16" cy="21" r="1.4" fill="#241416" />
            <circle cx="24" cy="21" r="1.4" fill="#241416" />
            <path d="M18.5 26 L21.5 26 L20 28Z" fill="#241416" />
          </svg>
          <h1 className="font-display text-2xl text-cream mt-3">{t('login.title')}</h1>
          <p className="text-dune-300 text-sm mt-1">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          {error && (
            <div className="mb-4 rounded-lg bg-absent/10 text-absent text-sm px-3 py-2" role="alert">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="label" htmlFor="email">
              {t('common.email')}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="label" htmlFor="password">
              {t('common.password')}
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
