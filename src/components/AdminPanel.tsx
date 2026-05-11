import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getFechaLocal } from '../utils/date';
import toast from 'react-hot-toast';
import { UserSession } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { updatePatientWeights } from '../utils/pesoUpdater';

import { Scale, LineChart as LineChartIcon, Utensils, Dumbbell, LogOut, Home, Eye, EyeOff, Users } from 'lucide-react';

interface PatientPanelProps {
  currentView: string;
  session: UserSession;
  onNavigate?: (view: string) => void;
}

export default function PatientPanel({ currentView, session, onNavigate }: PatientPanelProps) {
  const isHome = currentView === 'HOME';

  const viewTitles: Record<string, string> = {
    'PESO': 'REGISTRAR PESO',
    'EVOLUCION': 'MI EVOLUCIÓN',
    'EXERCISE': 'EJERCICIO',
    'TALLERES': 'TALLERES Y ENCUENTROS',
  };

  return (
    <div className="flex flex-col">
      <div className={`flex justify-between items-center ${isHome ? 'mb-[22px]' : 'mb-[16px] pb-3 border-b border-gris-bor'}`}>
        <div className="text-left">
          {isHome ? (
            <>
              <div className="text-[0.75rem] text-suave uppercase tracking-[1px]">Hola,</div>
              <div className="text-[1.15rem] font-semibold text-azul mt-[2px]">{session.name}</div>
              <div className="text-[0.78rem] text-verde mt-[3px]">Bienvenido a tu panel de paciente</div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-verde"></div>
              <span className="text-[0.85rem] font-semibold text-azul uppercase tracking-wider">
                {viewTitles[currentView] || currentView.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
        {!isHome && onNavigate && (
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gris-bg rounded-lg text-azul hover:bg-gray-200 transition-colors text-[0.75rem] font-semibold"
            onClick={() => onNavigate('HOME')}
          >
            <Home size={14} />
            <span>INICIO</span>
          </button>
        )}
      </div>

      <div className="w-full">
        {currentView === 'HOME' && <PatientHome onNavigate={onNavigate} />}
        {currentView === 'PESO' && <RegistrarPeso session={session} />}
        {currentView === 'EVOLUCION' && <Evolucion session={session} />}
        {currentView === 'EXERCISE' && <Construccion title="Ejercicio" />}
        {currentView === 'TALLERES' && <Construccion title="Talleres y Encuentros" />}
        {currentView === 'PROFILE' && <PatientProfile session={session} onNavigate={onNavigate} />}
      </div>
    </div>
  );
}

function PatientHome({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col mt-4 gap-3">
      <button 
        onClick={() => onNavigate && onNavigate('PESO')}
        className="flex justify-center items-center gap-3 py-[14px] bg-verde text-white rounded-[10px] hover:opacity-90 transition-opacity w-full"
      >
        <Scale size={18} />
        <span className="text-[0.9rem] font-medium">Registrar Peso</span>
      </button>

      <button 
        onClick={() => onNavigate && onNavigate('EVOLUCION')}
        className="flex justify-center items-center gap-3 py-[14px] bg-verde text-white rounded-[10px] hover:opacity-90 transition-opacity w-full"
      >
        <LineChartIcon size={18} />
        <span className="text-[0.9rem] font-medium">Mi Evolución</span>
      </button>

      <button 
        onClick={() => onNavigate && onNavigate('NUTRITION')}
        className="flex justify-center items-center gap-3 py-[14px] bg-verde text-white rounded-[10px] hover:opacity-90 transition-opacity w-full"
      >
        <Utensils size={18} />
        <span className="text-[0.9rem] font-medium">Nutrición</span>
      </button>

      <button 
        onClick={() => onNavigate && onNavigate('EXERCISE')}
        className="flex justify-center items-center gap-3 py-[14px] bg-verde text-white rounded-[10px] hover:opacity-90 transition-opacity w-full"
      >
        <Dumbbell size={18} />
        <span className="text-[0.9rem] font-medium">Ejercicio</span>
      </button>

      <button 
        onClick={() => onNavigate && onNavigate('TALLERES')}
        className="flex justify-center items-center gap-3 py-[14px] bg-verde text-white rounded-[10px] hover:opacity-90 transition-opacity w-full"
      >
        <Users size={18} />
        <span className="text-[0.9rem] font-medium">Talleres y Encuentros</span>
      </button>

      <button 
        onClick={handleSignOut}
        className="flex justify-center items-center gap-3 py-[14px] bg-white border border-gray-300 text-rojo rounded-[10px] hover:bg-red-50 mt-4 transition-colors w-full"
      >
        <LogOut size={18} />
        <span className="text-[0.9rem] font-medium">Cerrar Sesión</span>
      </button>
    </div>
  );
}

function Construccion({ title }: { title: string }) {
  return (
    <div className="text-center p-[40px_20px]">
      <div className="text-[3rem] mb-4">🚧</div>
      <div className="text-[1.2rem] font-semibold text-azul">{title}</div>
      <div className="text-[0.85rem] text-suave mt-1">Espacio en construcción</div>
    </div>
  );
}


function RegistrarPeso({ session }: { session: UserSession }) {
  const [peso, setPeso] = useState('');
  const [loading, setLoading] = useState(false);
  const [pesoAnterior, setPesoAnterior] = useState<{ id: number, peso_kg: number } | null>(null);

  const handleRegistrar = async () => {
    const p = parseFloat(peso.replace(',', '.'));
    if (!peso || isNaN(p) || p <= 0) return toast.error('Ingresá un peso válido (ejemplo: 75.3)');
    
    setLoading(true);
    const hoy = getFechaLocal();
    
    const { data: existente } = await supabase
      .from('registro_peso')
      .select('id, peso_kg')
      .eq('paciente_email', session.email)
      .eq('fecha_registro', hoy)
      .maybeSingle();

    if (existente && !pesoAnterior) {
      setPesoAnterior(existente);
      setLoading(false);
    } else {
      await grabar(p, !!pesoAnterior, pesoAnterior?.id);
    }
  };

  const grabar = async (p: number, reemplazar: boolean, id?: number) => {
    try {
      const hoy = getFechaLocal();
      if (reemplazar && id) {
        await supabase.from('registro_peso').update({ peso_kg: p }).eq('id', id);
        toast.success('¡Peso actualizado! 💪');
      } else {
        await supabase.from('registro_peso').insert({ paciente_email: session.email, peso_kg: p, fecha_registro: hoy });
        toast.success('¡Peso registrado! 💪');
      }
      await updatePatientWeights(session.email);
      setPeso('');
      setPesoAnterior(null);
    } catch {
      toast.error('Error al guardar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-[0.82rem] text-suave text-center mb-[16px]">Ingresá tu peso de hoy en kilos</p>
      
      <div className="campo">
        <input type="number" step="0.1" min="20" max="400" placeholder="Ej: 75.3" value={peso} onChange={e => setPeso(e.target.value)} />
      </div>

      {pesoAnterior && (
        <div className="bg-amarillo-bg border-[1.5px] border-amarillo-bor rounded-[10px] p-[14px_16px] mb-[14px]">
          <p className="text-[0.86rem] text-[#7a5c00] mb-[10px] leading-[1.45]">Ya registraste <strong>{pesoAnterior.peso_kg}</strong> kg hoy.<br/>¿Querés reemplazarlo?</p>
          <div className="flex gap-[10px]">
            <button className="btn btn-primario !mt-0" onClick={() => grabar(parseFloat(peso.replace(',', '.')), true, pesoAnterior.id)}>SÍ, REEMPLAZAR</button>
            <button className="btn btn-secundario !mt-0" onClick={() => { setPesoAnterior(null); setPeso(''); }}>CANCELAR</button>
          </div>
        </div>
      )}

      {!pesoAnterior && (
        <button className="btn btn-primario" onClick={handleRegistrar} disabled={loading}>{loading ? 'VERIFICANDO...' : 'REGISTRAR MI PESO'}</button>
      )}
    </div>
  );
}

function Evolucion({ session }: { session: UserSession }) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // defaults to last 7 days
    const hoy = new Date();
    const d = new Date();
    d.setDate(hoy.getDate() - 7);
    setHasta(getFechaLocal());
    setDesde(d.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (desde && hasta) {
      handleCargar();
    }
  }, [desde, hasta]);

  const handleCargar = async () => {
    if (!desde || !hasta) return;
    setLoading(true);
    const { data: records, error } = await supabase
      .from('registro_peso')
      .select('fecha_registro, peso_kg')
      .eq('paciente_email', session.email)
      .gte('fecha_registro', desde)
      .lte('fecha_registro', hasta)
      .order('fecha_registro', { ascending: true });
    
    if (error) {
      toast.error('Error al cargar datos');
    } else {
      setData(records || []);
    }
    setLoading(false);
  };

  const filledData = useMemo(() => {
    if (!desde || !hasta) return [];
    const startDate = new Date(desde + 'T12:00:00');
    const endDate = new Date(hasta + 'T12:00:00');
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return [];

    const result = [];
    const dataMap = new Map();
    for(const d of data) {
       dataMap.set(d.fecha_registro, d.peso_kg);
    }

    let currentDate = new Date(startDate);
    let totalDays = 0;
    while(currentDate <= endDate && totalDays < 366) { // max 1 año seguro
       const ds = currentDate.toISOString().split('T')[0];
       result.push({
          fecha_registro: ds,
          peso_kg: dataMap.has(ds) ? dataMap.get(ds) : null,
       });
       currentDate.setDate(currentDate.getDate() + 1);
       totalDays++;
    }
    return result;
  }, [data, desde, hasta]);

  // Stats calculation
  const pesos = data.map(r => parseFloat(r.peso_kg));
  const min = pesos.length ? Math.min(...pesos) : 0;
  const max = pesos.length ? Math.max(...pesos) : 0;
  const domainMin = pesos.length > 0 ? Math.max(0, Math.floor(min) - 1) : 0;
  const domainMax = pesos.length > 0 ? Math.ceil(max) + 1 : 100;
  const primerPeso = pesos.length ? pesos[0] : 0;
  const ultimoPeso = pesos.length ? pesos[pesos.length-1] : 0;
  const evolucion = ultimoPeso - primerPeso;
  const evolucionColor = evolucion < 0 ? 'text-verde' : evolucion > 0 ? 'text-rojo' : 'text-[#eab308]';
  const registrosNoEfectuados = filledData.length - data.length;

  return (
    <div>
      <div className="text-[1.5rem] font-semibold text-azul mb-2 text-center">{session.name}</div>
      <p className="seccion-label text-center">Mi evolución de peso</p>

      <div className="flex gap-[10px] mb-[16px]">
        <div className="campo flex-1 !mb-0"><label>Desde</label><input type="date" value={desde} onChange={e => setDesde(e.target.value)} max={getFechaLocal()} /></div>
        <div className="campo flex-1 !mb-0"><label>Hasta</label><input type="date" value={hasta} onChange={e => setHasta(e.target.value)} max={getFechaLocal()} /></div>
      </div>

      {loading && <div className="text-center text-[0.85rem] text-suave mb-4 uppercase tracking-[1px]">Cargando...</div>}

      {data.length > 0 && (
        <div className="mt-[18px]">
          {/* Estadísticas de Resumen */}
          <div className="flex flex-wrap gap-[10px] mb-[15px]">
            <div className="flex-1 min-w-[45%] sm:min-w-0 bg-gris-bg rounded-[10px] p-[12px_6px] text-center flex flex-col justify-center">
              <div className="text-[1.2rem] font-bold text-azul leading-none mb-1">{data.length}</div>
              <div className="text-[10px] text-suave font-bold uppercase tracking-tighter">Efectuados</div>
            </div>
            <div className="flex-1 min-w-[45%] sm:min-w-0 bg-gris-bg rounded-[10px] p-[12px_6px] text-center flex flex-col justify-center">
              <div className="text-[1.2rem] font-bold text-rojo leading-none mb-1">{registrosNoEfectuados}</div>
              <div className="text-[10px] text-suave font-bold uppercase tracking-tighter">No efectuados</div>
            </div>
            <div className="flex-1 min-w-[45%] sm:min-w-0 bg-gris-bg rounded-[10px] p-[12px_6px] text-center flex flex-col justify-center">
              <div className="text-[1.2rem] font-bold text-verde leading-none mb-1">{min.toFixed(2)}</div>
              <div className="text-[10px] text-suave font-bold uppercase tracking-tighter">Mínimo kg</div>
            </div>
            <div className="flex-1 min-w-[45%] sm:min-w-0 bg-gris-bg rounded-[10px] p-[12px_6px] text-center flex flex-col justify-center">
              <div className="text-[1.2rem] font-bold text-azul leading-none mb-1">{max.toFixed(2)}</div>
              <div className="text-[10px] text-suave font-bold uppercase tracking-tighter">Máximo kg</div>
            </div>
          </div>

          {/* Nueva Cabecera de Evolución */}
          <div className="flex flex-wrap gap-[10px] mb-[20px]">
            <div className="flex-1 min-w-[30%] sm:min-w-0 bg-gris-bg rounded-[10px] p-[12px_6px] text-center flex flex-col justify-center">
              <div className="text-[1.2rem] font-bold text-azul leading-none mb-1">{primerPeso.toFixed(2)}</div>
              <div className="text-[10px] text-suave font-bold uppercase tracking-tighter">Primer peso kg</div>
            </div>
            <div className="flex-1 min-w-[30%] sm:min-w-0 bg-gris-bg rounded-[10px] p-[12px_6px] text-center flex flex-col justify-center">
              <div className="text-[1.2rem] font-bold text-azul leading-none mb-1">{ultimoPeso.toFixed(2)}</div>
              <div className="text-[10px] text-suave font-bold uppercase tracking-tighter">Último peso kg</div>
            </div>
            <div className="flex-1 min-w-[30%] sm:min-w-0 bg-gris-bg rounded-[10px] p-[12px_6px] text-center flex flex-col justify-center">
              <div className={`text-[1.2rem] font-bold leading-none mb-1 ${evolucionColor}`}>
                {evolucion > 0 ? '+' : ''}{evolucion.toFixed(2)}
              </div>
              <div className="text-[10px] text-suave font-bold uppercase tracking-tighter">Evolución</div>
            </div>
          </div>

          <div className="h-[280px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filledData}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#dde3ea" />
                  <XAxis dataKey="fecha_registro" tickFormatter={(v) => { const parts = v.split('-'); return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`; }} tick={{fontSize: 11, fill: '#6c7a89'}} axisLine={false} tickLine={false} />
                  <YAxis domain={[domainMin, domainMax]} tickFormatter={(v) => Number(v).toFixed(2)} tick={{fontSize: 11, fill: '#6c7a89'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(0,146,146,0.05)'}} 
                    content={({ active, payload, label }) => {
                      if (active && label) {
                        const parts = String(label).split('-');
                        const formattedLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}` : label;
                        const val = payload && payload.length ? payload[0].value : null;
                        if (val === null || val === 0) {
                          return (
                            <div className="bg-white p-[10px] border border-gris-bor shadow-lg rounded-[8px] text-[0.8rem] text-texto text-center">
                              <p className="font-semibold mb-[2px]">{formattedLabel}</p>
                              <p className="text-suave">Sin registro</p>
                            </div>
                          );
                        }
                        return (
                          <div className="bg-white p-[10px] border border-gris-bor shadow-lg rounded-[8px] text-[0.8rem] text-texto text-center">
                            <p className="font-semibold mb-[2px]">{formattedLabel}</p>
                            <p className="text-verde font-semibold">Peso: {Number(val).toFixed(2)} kg</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="peso_kg" fill="#009292" radius={[4,4,0,0]} />
                </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {!loading && data.length === 0 && desde && hasta && (
        <div className="text-center p-[40px_20px] text-suave text-[0.88rem]">
          <div className="text-[2rem] mb-2">📭</div>
          No hay registros para las fechas seleccionadas.
        </div>
      )}
    </div>
  );
}

function PatientProfile({ session, onNavigate }: { session: UserSession, onNavigate?: (view: string) => void }) {
  const [formData, setFormData] = useState({ password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async () => {
    if (!formData.password) return toast.error('Ingresá una nueva contraseña');
    if (formData.password === 'bajardepeso') return toast.error('La contraseña no puede ser la por defecto');
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: formData.password });
      if (error) throw error;
      
      toast.success('Contraseña actualizada correctamente');
      setFormData({ password: '' });
      localStorage.removeItem('force_password_change');
      
      if (onNavigate) {
          onNavigate('PESO');
      }
    } catch (e: any) {
      let ErrorMsg = e.message || 'Error al actualizar contraseña';
      if (ErrorMsg.includes('New password should be different from the old password')) {
        ErrorMsg = 'La nueva contraseña debe ser diferente de la anterior';
      } else if (ErrorMsg.includes('Password should be at least')) {
        ErrorMsg = 'La contraseña debe tener al menos 6 caracteres';
      }
      toast.error(ErrorMsg);
    } finally {
      setLoading(false);
    }
  };

  const isForced = localStorage.getItem('force_password_change') === 'true';

  return (
    <div>
      <div className="bg-gris-bg rounded-[12px] p-[16px_18px] mb-[20px]">
        <h3 className="text-azul font-semibold mb-1">Mi Perfil</h3>
        <p className="text-suave text-sm mb-4">Actualizá tu contraseña.</p>
        
        {isForced && (
            <div className="bg-red-50 text-red-700 text-[0.8rem] p-3 rounded-lg border border-red-200 mb-4 leading-tight">
                <strong>Atención:</strong> Por razones de seguridad, es <b>obligatorio</b> cambiar tu contraseña por defecto antes de continuar.
            </div>
        )}

        <div className="campo"><label>Email</label><input type="email" value={session.email || ''} disabled className="bg-white text-suave" /></div>
        
        <div className="campo mt-4 relative">
            <label>Nueva Contraseña <span className="text-red-500">*</span></label>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Nueva contraseña..." 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              className="pr-10"
            />
            <button 
              type="button" 
              className="absolute right-2 top-[34px] text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
        </div>

        <button className="btn btn-primario mt-2" onClick={handleSave} disabled={loading}>{loading ? 'GUARDANDO...' : 'GUARDAR CONTRASEÑA'}</button>
      </div>
    </div>
  );
}
