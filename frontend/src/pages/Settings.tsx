import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { APP_CONFIG } from '../config/app.config';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: '',
  });
  
  // Password form
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await authAPI.updateProfile(profileData);
      updateUser(response.data);
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
    } catch {
      setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch {
      setMessage({ type: 'error', text: 'Error al cambiar la contraseña' });
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: '👤' },
    { id: 'company', label: t('settings.company'), icon: '🏢' },
    { id: 'password', label: t('settings.changePassword'), icon: '🔐' },
    { id: 'language', label: t('settings.language'), icon: '🌐' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-4 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMessage(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-3xl font-bold">
                {user?.first_name?.[0] || user?.username?.[0] || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{user?.username}</h3>
                <p className="text-slate-500">{user?.role_display}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre</label>
                <input
                  type="text"
                  value={profileData.first_name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, first_name: e.target.value })
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="label">Apellido</label>
                <input
                  type="text"
                  value={profileData.last_name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, last_name: e.target.value })
                  }
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">{t('common.email')}</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
                className="input"
              />
            </div>

            <button type="submit" disabled={isLoading} className="btn btn-primary">
              {isLoading ? t('common.loading') : t('common.save')}
            </button>
          </form>
        )}

        {/* Company Tab */}
        {activeTab === 'company' && (
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Información de la Empresa</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">Nombre</span>
                  <span className="font-medium">{APP_CONFIG.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">Versión</span>
                  <span className="font-medium">{APP_CONFIG.version}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">Moneda</span>
                  <span className="font-medium">
                    {APP_CONFIG.business.currency} ({APP_CONFIG.business.currencySymbol})
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Tasa IGV</span>
                  <span className="font-medium">{APP_CONFIG.business.igvRate * 100}%</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Para modificar la configuración de la empresa, edita el archivo{' '}
              <code className="bg-slate-100 px-1 rounded">config/app.config.ts</code> en el frontend
              y <code className="bg-slate-100 px-1 rounded">store_backend/config.py</code> en el backend.
            </p>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="label">{t('settings.currentPassword')}</label>
              <input
                type="password"
                value={passwordData.old_password}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, old_password: e.target.value })
                }
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">{t('settings.newPassword')}</label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, new_password: e.target.value })
                }
                className="input"
                required
                minLength={4}
              />
            </div>

            <div>
              <label className="label">{t('settings.confirmPassword')}</label>
              <input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirm_password: e.target.value })
                }
                className="input"
                required
              />
            </div>

            <button type="submit" disabled={isLoading} className="btn btn-primary">
              {isLoading ? t('common.loading') : t('settings.changePassword')}
            </button>
          </form>
        )}

        {/* Language Tab */}
        {activeTab === 'language' && (
          <div className="space-y-4">
            <p className="text-slate-600 mb-4">Selecciona el idioma de la interfaz:</p>
            <div className="flex gap-4">
              <button
                onClick={() => changeLanguage('es')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                  i18n.language === 'es'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-3xl">🇪🇸</span>
                <div className="text-left">
                  <p className="font-medium">Español</p>
                  <p className="text-sm text-slate-500">Spanish</p>
                </div>
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                  i18n.language === 'en'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-3xl">🇺🇸</span>
                <div className="text-left">
                  <p className="font-medium">English</p>
                  <p className="text-sm text-slate-500">Inglés</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;


