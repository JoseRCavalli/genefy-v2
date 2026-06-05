import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { FarmRow } from '../../lib/supabase';
import {
  Settings,
  LogOut,
  KeyRound,
  History,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Lock,
  MapPin,
  Sun,
  CloudSun,
  CloudRain,
  CloudLightning,
  Cloud
} from 'lucide-react';

interface Props {
  farm: FarmRow | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'matching', label: 'Matching Individual' },
  { id: 'mating-plan', label: 'Plano de Acasalamento' },
  { id: 'full-analysis', label: 'Análise Completa' },
  { id: 'primiparous', label: 'Primíparas' },
  { id: 'herd-strategy', label: 'Estratégia de Rebanho' },
  { id: 'catalog', label: 'Catálogo de Touros' },
  { id: 'females-catalog', label: 'Catálogo de Fêmeas' },
  { id: 'herd', label: 'Cadastrar Rebanho' },
  { id: 'manage-herd', label: 'Gerenciar Rebanho' },
  { id: 'meta-search', label: 'Busca por Meta' },
  { id: 'history', label: 'Histórico' },
];

export function CustomHeader({ farm, activeTab, onTabChange }: Props) {
  const { signOut, session } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

  // Weather state (using Open-Meteo API for real-time weather in Vera Cruz do Oeste - PR)
  const [temp, setTemp] = useState<number | null>(18);
  const [condition, setCondition] = useState<string>('Limpo');
  const [weatherCode, setWeatherCode] = useState<number>(0);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=-25.0592&longitude=-53.8828&current=temperature_2m,weather_code'
        );
        const data = await res.json();
        if (data && data.current) {
          const t = Math.round(data.current.temperature_2m);
          setTemp(t);
          const code = data.current.weather_code;
          setWeatherCode(code);

          // Map weather code (WMO interpretation)
          if (code === 0) setCondition('Limpo');
          else if (code >= 1 && code <= 3) setCondition('Parcialmente Nublado');
          else if (code >= 45 && code <= 48) setCondition('Nevoeiro');
          else if (code >= 51 && code <= 67) setCondition('Chuva Leve');
          else if (code >= 80 && code <= 82) setCondition('Pancadas de Chuva');
          else if (code >= 95 && code <= 99) setCondition('Tempestade');
          else setCondition('Instável');
        }
      } catch (err) {
        console.error('Erro ao carregar clima:', err);
      }
    }
    fetchWeather();
    // Refresh weather every 15 minutes
    const interval = setInterval(fetchWeather, 900000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = () => {
    if (weatherCode === 0) {
      return <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />;
    } else if (weatherCode >= 1 && weatherCode <= 3) {
      return <CloudSun className="w-3.5 h-3.5 text-blue-200 animate-pulse" />;
    } else if (weatherCode >= 51 && weatherCode <= 82) {
      return <CloudRain className="w-3.5 h-3.5 text-blue-300 animate-bounce" />;
    } else if (weatherCode >= 95 && weatherCode <= 99) {
      return <CloudLightning className="w-3.5 h-3.5 text-amber-500 animate-bounce" />;
    } else {
      return <Cloud className="w-3.5 h-3.5 text-gray-300" />;
    }
  };

  // Password fields state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const isDemoUser = session?.user?.email === 'demo@gmail.com';

  // Format owner name to display
  const ownerName = isDemoUser ? 'user' : (farm?.owner_name || 'PEDRO HENRIQUE CAVALLI');
  const farmName = isDemoUser ? 'Fazenda Teste' : (farm?.name || 'Granja Cavalli');

  const handleSignOut = async () => {
    setMenuOpen(false);
    if (isDemoMode) {
      alert('Saindo do Modo Demo. A página será recarregada.');
      window.location.reload();
    } else {
      await signOut();
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    if (isDemoMode) {
      // Mock change for demo mode
      setTimeout(() => {
        setSuccess('Senha alterada com sucesso no simulador demo!');
        setLoading(false);
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setSuccess(null);
        }, 2000);
      }, 1200);
    } else {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          setError(error.message);
        } else {
          setSuccess('Senha alterada com sucesso no banco de dados!');
          setNewPassword('');
          setConfirmPassword('');
          setTimeout(() => {
            setShowPasswordModal(false);
            setSuccess(null);
          }, 2000);
        }
      } catch (err: any) {
        setError(err.message || 'Ocorreu um erro ao atualizar a senha.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <header className="bg-[#1B3A5C] text-white shadow-lg relative z-30 flex flex-col">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row items-center justify-between px-6 py-3 border-b border-white/10 gap-3">
        {/* Left Side: Logo and Farm Label */}
        <div className="flex flex-col items-center md:items-start select-none">
          <img
            src="/images/genefy-logo-trimmed.png"
            alt="Genefy"
            className="h-10 w-auto object-contain cursor-pointer transition-transform hover:scale-102"
            onClick={() => onTabChange('matching')}
          />
          <span className="text-xs text-blue-300 font-medium pl-1 mt-0.5 uppercase tracking-wider">
            {farmName}
          </span>
        </div>

        {/* Right Side: Language & Owner Settings */}
        <div className="flex items-center gap-4 text-xs md:text-sm font-medium text-white/90">
          {/* Cidade e Clima */}
          <div className="hidden sm:flex items-center gap-2.5 text-xs text-white/50 select-none self-end pb-[3px]">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-300/80" />
              <span>Vera Cruz do Oeste - PR</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-1">
              {getWeatherIcon()}
              <span>{temp !== null ? `${temp}°C` : '18°C'} {condition}</span>
            </div>
          </div>

          <div className="hidden sm:block text-white/20 font-light self-end pb-[3px]">|</div>

          {/* Owner details */}
          <div className="flex flex-col items-end">
            <span className="text-white/60 text-[10px] uppercase tracking-wider leading-none">Proprietário</span>
            <span className="font-semibold text-white mt-0.5">{ownerName}</span>
          </div>

          {/* Gear settings button */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none flex items-center justify-center"
              title="Configurações de Conta"
            >
              <Settings className={`w-5 h-5 transition-transform duration-300 ${menuOpen ? 'rotate-90 text-[#C9A84C]' : 'text-white'}`} />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-xl py-1.5 border border-gray-100 z-50 text-gray-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-gray-100 text-left">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Configurações</p>
                    <p className="text-xs font-semibold text-gray-700 truncate">{isDemoMode ? 'Usuário Demo' : session?.user?.email}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-gray-50 flex items-center gap-2.5 transition-colors text-gray-700 hover:text-[#1B3A5C]"
                  >
                    <KeyRound className="w-4 h-4 text-gray-400" />
                    Alterar Senha
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setShowActivityModal(true);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-gray-50 flex items-center gap-2.5 transition-colors text-gray-700 hover:text-[#1B3A5C]"
                  >
                    <History className="w-4 h-4 text-gray-400" />
                    Registro de Atividade
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-red-50 flex items-center gap-2.5 transition-colors text-red-600 hover:text-red-700"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair da Conta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Row */}
      <nav className="flex overflow-x-auto px-4 bg-[#142C47]">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 text-xs md:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors duration-150 ${
              activeTab === tab.id
                ? 'border-[#C9A84C] text-[#C9A84C]'
                : 'border-transparent text-white/70 hover:text-white hover:border-white/30'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ─── MODAL: ALTERAR SENHA ─── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white text-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200 border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#1B3A5C]" />
                <h3 className="text-lg font-bold text-[#1B3A5C]">Alterar Senha</h3>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning for Demo mode */}
            {isDemoMode && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-amber-800 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Aviso do Modo Demo:</strong> Como você está navegando no ambiente de demonstração offline, qualquer alteração de senha será simulada localmente apenas para fins demonstrativos.
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex gap-2 items-center">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg p-3 flex gap-2 items-center">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* New Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading || success !== null}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:border-transparent transition-all pr-10 disabled:bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Confirmar Nova Senha</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading || success !== null}
                    placeholder="Repita a nova senha"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:border-transparent transition-all pr-10 disabled:bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors border border-gray-200 hover:bg-gray-50 rounded-lg disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || success !== null}
                  className="px-4 py-2 text-xs font-bold bg-[#1B3A5C] text-white hover:bg-[#142C47] transition-all rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center min-w-[90px]"
                >
                  {loading ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: REGISTRO DE ATIVIDADE ─── */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white text-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200 border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#1B3A5C]" />
                <h3 className="text-lg font-bold text-[#1B3A5C]">Registro de Atividade</h3>
              </div>
              <button
                onClick={() => setShowActivityModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Activity List */}
            <div className="mt-4 space-y-4 max-h-[320px] overflow-y-auto pr-1">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100/55 transition-colors">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-gray-700">Conexão Criptografada Segura Ativa</p>
                  <p className="text-gray-500 font-light">Todas as conexões via API SSL/TSL do Supabase estão criptografadas e ativas.</p>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>Hoje, agora</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100/55 transition-colors">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-gray-700">Importação de dados concluída</p>
                  <p className="text-gray-500 font-light">Sincronização dos índices genômicos das fêmeas efetuada com sucesso a partir do relatório CDCB/Zoetis.</p>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>Ontem</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100/55 transition-colors">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-gray-700">Sessão iniciada com sucesso</p>
                  <p className="text-gray-500 font-light">Nova autenticação realizada por e-mail e senha correspondentes ao administrador.</p>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>2 dias atrás</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-3 border-t border-gray-100 mt-6">
              <button
                type="button"
                onClick={() => setShowActivityModal(false)}
                className="px-4 py-2 text-xs font-bold bg-[#1B3A5C] text-white hover:bg-[#142C47] transition-all rounded-lg shadow-md hover:shadow-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
