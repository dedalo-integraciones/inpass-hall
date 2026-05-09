import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getFechaLocal } from '../utils/date';
import toast from 'react-hot-toast';
import { UserSession } from '../types';
import { Plus, Edit2, RefreshCw, Users, Home, LogOut, Eye, EyeOff, LineChart as LineChartIcon, CalendarDays, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

import AdminEvolucion from './AdminEvolucion';
import AdminCargaDiferida from './AdminCargaDiferida';

interface AdminPanelProps {
  currentView: string;
  onNavigate: (view: string) => void;
  session: UserSession;
}

export default function AdminPanel({ currentView, onNavigate, session }: AdminPanelProps) {
  const isHome = currentView === 'HOME';

  return (
    <div className="flex flex-col">
      {/* Header adaptable */}
      <div className={`flex justify-between items-center ${isHome ? 'mb-[22px]' : 'mb-[16px] pb-3 border-b border-gris-bor'}`}>
        <div className="text-left">
          {isHome ? (
            <>
              <div className="text-[0.75rem] text-suave uppercase tracking-[1px]">Hola,</div>
              <div className="text-[1.15rem] font-semibold text-azul mt-[2px]">{session.name}</div>
              <div className="text-[0.78rem] text-verde mt-[3px]">Este es tu tablero de comandos ({session.level?.toUpperCase()})</div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-verde"></div>
              <span className="text-[0.85rem] font-semibold text-azul uppercase tracking-wider">
                {currentView.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
        {!isHome && (
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gris-bg rounded-lg text-azul hover:bg-gray-200 transition-colors text-[0.75rem] font-semibold"
            onClick={() => onNavigate('HOME')}
          >
            <Home size={14} />
            <span>INICIO</span>
          </button>
        )}
      </div>
      
      {/* Contenido Mutuamente Excluyente */}
      <div className="w-full">
        {currentView === 'HOME' && <HomeTab onNavigate={onNavigate} session={session} />}
        {currentView === 'ALTAS' && <AltasTab />}
        {currentView === 'MODIF' && <ModifTab />}
        {currentView === 'ADMIN_EVOLUCION' && <AdminEvolucion session={session} />}
        {currentView === 'CARGA_DIFERIDA' && (session.level?.toUpperCase() === 'ADMIN' || session.level?.toUpperCase() === 'SADMIN') && <AdminCargaDiferida session={session} />}
        {currentView === 'SYNC' && session.level?.toUpperCase() === 'SADMIN' && <SyncTab />}
        {currentView === 'ADMINS' && session.level?.toUpperCase() === 'SADMIN' && <AdminsTab session={session} />}
        {currentView === 'PROFILE' && <ProfileTab session={session} />}
      </div>
    </div>
  );
}

function HomeTab({ onNavigate, session }: { onNavigate: (view: string) => void, session: UserSession }) {
  const isSadmin = session.level?.toUpperCase() === 'SADMIN';
  
  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col mt-4 gap-3">
      <button 
        onClick={() => onNavigate('ALTAS')}
        className="flex justify-center items-center gap-3 py-[14px] bg-verde text-white rounded-[10px] hover:opacity-90 transition-opacity w-full"
      >
        <Plus size={18} />
        <span className="text-[0.9rem] font-medium">Altas Pacientes</span>
      </button>

      <button 
        onClick={() => onNavigate('MODIF')}
        className="flex justify-center items-center gap-3 py-[14px] bg-verde text-white rounded-[10px] hover:opacity-90 transition-opacity w-full"
      >
        <Edit2 size={18} />
        <span className="text-[0.9rem] font-medium">Modificaciones Pacientes</span>
      </button>

      <button 
        onClick={() => onNavigate('ADMIN_EVOLUCION')}
        className="flex justify-center items-center gap-3 py-[14px] bg-verde text-white rounded-[10px] hover:opacity-90 transition-opacity w-full"
      >
        <LineChartIcon size={18} />
        <span className="text-[0.9rem] font-medium">Control de Evolución</span>
      </button>

      <button 
        onClick={() => onNavigate('CARGA_DIFERIDA')}
        className="flex justify-center items-center gap-3 py-[14px] bg-verde text-white rounded-[10px] hover:opacity-90 transition-opacity w-full"
      >
        <CalendarDays size={18} />
        <span className="text-[0.9rem] font-medium">Carga de peso diferida</span>
      </button>

      {isSadmin && (
        <>
          <button 
            onClick={() => onNavigate('SYNC')}
            className="flex justify-center items-center gap-3 py-[14px] bg-verde text-white rounded-[10px] hover:opacity-90 transition-opacity w-full"
          >
            <RefreshCw size={18} />
            <span className="text-[0.9rem] font-medium">Sincronización</span>
          </button>

          <button 
            onClick={() => onNavigate('ADMINS')}
            className="flex justify-center items-center gap-3 py-[14px] bg-verde text-white rounded-[10px] hover:opacity-90 transition-opacity w-full"
          >
            <Users size={18} />
            <span className="text-[0.9rem] font-medium">Gestión Admins</span>
          </button>
        </>
      )}

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

function AltasTab() {
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', email: '', telefono: '', celula: '', grupo: '', programa: '', suscripcion: '', altura: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.apellido || !formData.email || !formData.telefono) {
      return toast.error('Completá los campos obligatorios (*)');
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        altura: formData.altura ? parseFloat(formData.altura.replace(',', '.')) : null,
        email: formData.email.toLowerCase(),
        activo: 'SI',
        nivel: 'USER',
        fecha_creacion: getFechaLocal()
      };
      const { error } = await supabase.from('pacientes').insert(payload);
      if (error) throw error;
      toast.success('Alta realizada correctamente.');
      setFormData({nombre: '', apellido: '', email: '', telefono: '', celula: '', grupo: '', programa: '', suscripcion: '', altura: ''});
    } catch (err: any) {
      toast.error(err.code === '23505' ? 'Ese email ya existe.' : 'Error al guardar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="campo"><label>Nombre <span className="text-verde">*</span></label><input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} /></div>
      <div className="campo"><label>Apellido <span className="text-verde">*</span></label><input type="text" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} /></div>
      <div className="campo"><label>Email <span className="text-verde">*</span></label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
      <div className="campo"><label>Teléfono <span className="text-verde">*</span></label><input type="tel" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} /></div>
      <div className="campo"><label>Altura (mts) <span className="text-[0.7rem] font-normal text-suave">- ej: 1.75</span></label><input type="number" step="0.01" value={formData.altura} onChange={e => setFormData({...formData, altura: e.target.value})} /></div>
      
      <div className="campo">
        <label>Célula</label>
        <select value={formData.celula} onChange={e => setFormData({...formData, celula: e.target.value})}>
          <option value="">— Sin asignar —</option>
          <option value="INPASS INTENSIVO">INPASS INTENSIVO</option>
          <option value="CEL-01-AR">CEL-01-AR</option>
          <option value="CEL-04-AR">CEL-04-AR</option>
          <option value="CEL- Mantenimiento">CEL- Mantenimiento</option>
        </select>
      </div>
      <div className="campo"><label>Grupo</label><input type="text" value={formData.grupo} onChange={e => setFormData({...formData, grupo: e.target.value})} /></div>
      <div className="campo">
        <label>Programa</label>
        <select value={formData.programa} onChange={e => setFormData({...formData, programa: e.target.value})}>
          <option value="">— Sin asignar —</option>
          <option value="Descenso">Descenso</option>
          <option value="Mantenimiento">Mantenimiento</option>
        </select>
      </div>
      <div className="campo">
        <label>Suscripción</label>
        <select value={formData.suscripcion} onChange={e => setFormData({...formData, suscripcion: e.target.value})}>
          <option value="">— Sin asignar —</option>
          <option value="Autorizado">Autorizado</option>
          <option value="Free">Free</option>
          <option value="Premium">Premium</option>
        </select>
      </div>
      
      <button className="btn btn-primario mt-2" onClick={handleSubmit} disabled={loading}>{loading ? 'GUARDANDO...' : 'REGISTRAR PACIENTE'}</button>
    </div>
  );
}

function ModifTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [paciente, setPaciente] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    setLoading(true);
    // Cargamos todos para permitir reactivar inactivos
    const { data: p } = await supabase
      .from('pacientes')
      .select('*')
      .order('activo', { ascending: false }) // primero activos
      .order('nombre', { ascending: true });
    if (p) setPacientes(p);
    setLoading(false);
  };

  const filteredPacientes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const activos = pacientes.filter(p => p.activo === 'SI');
    if (!term) return activos; // por defecto muestra solo activos
    
    // Si hay búsqueda, busca en todos (activos e inactivos)
    return pacientes.filter(p => {
      const full = `${p.nombre} ${p.apellido}`.toLowerCase();
      const email = p.email.toLowerCase();
      return full.includes(term) || email.includes(term);
    });
  }, [pacientes, searchTerm]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { id, activo, altura, ...payload } = paciente;
      const { error } = await supabase.from('pacientes').update({
        ...payload,
        altura: altura ? parseFloat(String(altura).replace(',', '.')) : null,
        activo: activo ? 'SI' : 'NO'
      }).eq('id', id);
      if (error) throw error;
      toast.success('Cambios guardados con éxito.');
      setPaciente(null);
      setSearchTerm('');
      cargarPacientes(); // recargar
    } catch {
      toast.error('Error al guardar.');
    } finally {
      setLoading(false);
    }
  };

  if (!paciente) {
    return (
      <div>
        <div className="bg-gris-bg rounded-[12px] p-[16px_18px] mb-[20px]">
          <h3 className="text-azul font-semibold mb-3">Modificaciones Pacientes</h3>
          
          <div className="campo">
            <label>Buscar Paciente o Email</label>
            <input 
              type="text" 
              placeholder="Escribí nombre y apellido, o doble click abajo..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>

          <div className="text-[0.78rem] text-suave mb-2 font-medium">Resultados ({filteredPacientes.length}) - Doble click para seleccionar</div>
          <div className="bg-white border-[1.5px] border-gris-bor rounded-[10px] overflow-hidden flex flex-col h-[260px]">
            <div className="flex bg-gris-bg p-[10px_14px] border-b-[1.5px] border-gris-bor font-semibold text-[0.7rem] text-azul uppercase tracking-wider">
              <div className="flex-1">Paciente</div>
              <div className="flex-1 hidden md:block">Email</div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-suave text-sm italic">Cargando pacientes...</div>
              ) : filteredPacientes.length === 0 ? (
                <div className="p-4 text-center text-suave text-sm">No se encontraron resultados.</div>
              ) : (
                filteredPacientes.map(p => (
                  <div 
                    key={p.email} 
                    className={`flex p-[10px_14px] border-b border-gris-bor last:border-b-0 cursor-pointer text-[0.8rem] transition-colors items-center ${p.activo === 'SI' ? 'hover:bg-gray-50' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    onDoubleClick={() => setPaciente({ ...p, activo: p.activo === 'SI' })}
                    onClick={() => {
                      if (window.innerWidth < 640) setPaciente({ ...p, activo: p.activo === 'SI' });
                    }}
                  >
                    <div className="flex-1 font-medium text-texto flex items-center gap-2">
                      {p.nombre} {p.apellido}
                      {p.activo !== 'SI' && <span className="text-[0.6rem] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">INACTIVO</span>}
                      <div className="text-[0.65rem] text-suave md:hidden mt-0.5">{p.email}</div>
                    </div>
                    <div className="flex-1 text-suave hidden md:block truncate">{p.email}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gris-bg rounded-[12px] p-[16px_18px] mb-[20px]">
        <div className="text-[1rem] font-semibold text-azul">{paciente.nombre} {paciente.apellido}</div>
        <div className="text-[0.82rem] text-verde mb-1">{paciente.email}</div>
        <div className="text-[0.78rem] text-suave">Alta: {paciente.fecha_creacion}</div>
      </div>
      
      <div className="campo"><label>Nombre</label><input type="text" value={paciente.nombre} onChange={e => setPaciente({...paciente, nombre: e.target.value})} /></div>
      <div className="campo"><label>Apellido</label><input type="text" value={paciente.apellido} onChange={e => setPaciente({...paciente, apellido: e.target.value})} /></div>
      <div className="campo"><label>Email</label><input type="email" value={paciente.email} onChange={e => setPaciente({...paciente, email: e.target.value})} /></div>
      <div className="campo"><label>Teléfono</label><input type="tel" value={paciente.telefono || ''} onChange={e => setPaciente({...paciente, telefono: e.target.value})} /></div>
      <div className="campo"><label>Altura (mts) <span className="text-[0.7rem] font-normal text-suave">- ej: 1.75</span></label><input type="number" step="0.01" value={paciente.altura || ''} onChange={e => setPaciente({...paciente, altura: e.target.value})} /></div>
      
      <div className="campo">
        <label className="flex items-center gap-2 p-[12px_14px] border-[1.5px] border-gris-bor rounded-[10px] cursor-pointer bg-white hover:bg-gray-50 transition-colors">
          <input type="checkbox" className="w-[18px] h-[18px] accent-verde" checked={paciente.activo} onChange={e => setPaciente({...paciente, activo: e.target.checked})} />
          <span className="text-[0.93rem] text-texto font-medium">{paciente.activo ? 'Paciente activo' : 'Paciente inactivo'}</span>
        </label>
      </div>

      <button className="btn btn-primario mt-2" onClick={handleSave} disabled={loading}>{loading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}</button>
      <button className="btn btn-outline mt-[10px]" onClick={() => setPaciente(null)}>VOLVER A LA LISTA</button>
    </div>
  );
}

const EDGE_URL = 'https://bzfbfvpiopoolafgiwrk.supabase.co/functions/v1/smart-handler';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZmJmdnBpb3Bvb2xhZmdpd3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTMwMzUsImV4cCI6MjA5MzI4OTAzNX0.MdhhiKHj5JF10aHv-h-LYII2fh_SYXElCC10oyoUnAU';

function SyncTab() {
  const [fileData, setFileData] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, nuevos: 0, actualizados: 0, inactivos: 0 });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    const fileNameSpan = document.getElementById('fileName') as HTMLSpanElement;
    
    if (!file) {
      if (fileNameSpan) fileNameSpan.textContent = '';
      return;
    }
    
    if (fileNameSpan) fileNameSpan.textContent = file.name;

    const toastId = toast.loading('Leyendo archivo...');
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: false });
      const filas = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header:1, defval:'' }) as any[];
      
      const resetOnInvalid = () => {
        if (fileNameSpan) fileNameSpan.textContent = '';
        e.target.value = '';
        setFileData(null);
      };

      if (!filas || filas.length < 2) {
        resetOnInvalid();
        return toast.error('Archivo de sincronización incorrecto', { id: toastId });
      }

      const headers = (filas[0] as any[]).map(h => String(h || '').toLowerCase().trim());
      
      const missingColumns = [];
      if (!headers.some(h => h.includes('nombre'))) missingColumns.push('Nombre');
      if (!headers.some(h => h.includes('apellido'))) missingColumns.push('Apellido');
      if (!headers.some(h => h.includes('email') || h.includes('correo'))) missingColumns.push('Email');

      if (missingColumns.length > 0) {
        resetOnInvalid();
        return toast.error('Archivo de sincronización incorrecto', { id: toastId });
      }

      const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('correo'));

      const datos = filas.slice(1).filter(f => f[emailIdx] && f[emailIdx].toString().trim());

      if (!datos.length) {
        resetOnInvalid();
        return toast.error('Archivo de sincronización incorrecto', { id: toastId });
      }

      const { data: enDB } = await supabase.from('pacientes').select('email');
      const emailsEnDB = new Set((enDB||[]).map(p => p.email.toLowerCase()));
      const emailsEnExcel = new Set(datos.map(f => f[emailIdx].toString().toLowerCase().trim()));

      setFileData(datos);
      setStats({
        total: datos.length,
        nuevos: datos.filter(f => !emailsEnDB.has(f[emailIdx].toString().toLowerCase().trim())).length,
        actualizados: datos.filter(f => emailsEnDB.has(f[emailIdx].toString().toLowerCase().trim())).length,
        inactivos: [...emailsEnDB].filter(e => !emailsEnExcel.has(e)).length
      });
      toast.success('Archivo leído correctamente', { id: toastId });
    } catch {
      if (fileNameSpan) fileNameSpan.textContent = '';
      e.target.value = '';
      setFileData(null);
      toast.error('Archivo de sincronización incorrecto', { id: toastId });
    }
  };

  return (
    <div>
      <div className="bg-gris-bg rounded-[12px] p-[16px_18px] mb-[20px]">
        <p className="text-[0.82rem] text-suave leading-[1.6]">Seleccioná el archivo Excel exportado del sistema INPASS.<br/>
        El sincronizador va a:</p>
        <ul className="text-[0.82rem] text-suave list-disc ml-5 mt-2">
          <li>Dar de alta los pacientes nuevos</li>
          <li>Actualizar los datos de los existentes</li>
          <li>Marcar como inactivos los que no estén en el archivo</li>
        </ul>
      </div>
      
      <div className="campo">
        <label>Archivo Excel de pacientes</label>
        <div className="flex items-center gap-3 mt-2">
            <label className="flex justify-center items-center gap-3 py-[14px] bg-verde text-white rounded-[10px] hover:opacity-90 transition-opacity w-full cursor-pointer">
                <span className="text-[0.9rem] font-medium">Seleccionar archivo</span>
                <input 
                    type="file" 
                    className="hidden" 
                    accept=".xlsx,.xls" 
                    onChange={handleFileUpload}
                />
            </label>
        </div>
        <span id="fileName" className="text-[0.8rem] text-suave mt-2 block"></span>
      </div>

      {fileData && (
        <div className="mt-4">
          <div className="text-[0.82rem] text-suave mb-2">Vista previa:</div>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 bg-[#e8f8f5] rounded-lg p-2 text-center">
              <div className="text-[1.3rem] font-semibold text-[#1a7a5e]">{stats.total}</div>
              <div className="text-[0.7rem] text-[#1a7a5e]">En archivo</div>
            </div>
            <div className="flex-1 bg-[#eef6fb] rounded-lg p-2 text-center">
              <div className="text-[1.3rem] font-semibold text-[#1a5276]">{stats.nuevos}</div>
              <div className="text-[0.7rem] text-[#1a5276]">Nuevos</div>
            </div>
            <div className="flex-1 bg-[#fff8e6] rounded-lg p-2 text-center">
              <div className="text-[1.3rem] font-semibold text-[#7a5c00]">{stats.actualizados}</div>
              <div className="text-[0.7rem] text-[#7a5c00]">Updates</div>
            </div>
          </div>
          
          <button 
            className="btn btn-primario" 
            onClick={() => toast('La sincronización se está ejecutando desde la versión React MVP. En un release futuro, migraremos el handler.')} 
            disabled={loading}
          >
            SINCRONIZAR AHORA
          </button>
        </div>
      )}
    </div>
  );
}

function AdminsTab({ session }: { session: UserSession }) {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: 0, nombre: '', apellido: '', email: '', password: '', isEditing: false, activo: true });
  const [adminToDelete, setAdminToDelete] = useState<any>(null);
  
  useEffect(() => {
    cargarAdmins();
  }, []);

  const cargarAdmins = async () => {
    setLoading(true);
    const { data } = await supabase.from('acceso').select('*').in('nivel', ['ADMIN', 'SADMIN']);
    if (data) setAdmins(data);
    setLoading(false);
  };

  const handleguardar = async () => {
    if (!formData.nombre || !formData.apellido || !formData.email) return toast.error('Completá los campos obligatorios');
    setLoading(true);
    
    try {
      if (formData.isEditing) {
        const { error } = await supabase.from('acceso').update({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          activo: formData.activo
        }).eq('id', formData.id);
        if (error) throw error;
        toast.success('Administrador actualizado');
      } else {
        const res = await fetch(EDGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
          body: JSON.stringify({ email: formData.email, nombre: formData.nombre, apellido: formData.apellido, password: 'bajardepeso', accion: 'crear' })
        });
        
        const result = await res.json();
        if (!result.success) {
           console.error("Fetch Error:", result);
           throw new Error(result.error || 'Error al crear usuario en Auth');
        }

        const { error } = await supabase.from('acceso').insert({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          nivel: 'ADMIN',
          activo: true
        });
        if (error) {
            console.error("Supabase Insert Error:", error);
            if (error.code === '42501') {
                throw new Error("Permiso denegado (RLS) en Supabase tabla 'acceso'. Habilitá el acceso INSERT.");
            }
            throw new Error(error.message);
        }
        toast.success('Administrador creado. Contraseña: bajardepeso');
      }
      setFormData({ id: 0, nombre: '', apellido: '', email: '', password: '', isEditing: false, activo: true });
      cargarAdmins();
    } catch (e: any) {
      let ErrorMsg = e.message || 'Error al guardar administrador';
      if (ErrorMsg.includes('New password should be different from the old password')) {
        ErrorMsg = 'La nueva contraseña debe ser diferente de la anterior';
      } else if (ErrorMsg.includes('Password should be at least')) {
        ErrorMsg = 'La contraseña debe tener al menos 6 caracteres';
      } else if (ErrorMsg.includes('User already registered') || ErrorMsg.includes('email addresses must be unique')) {
        ErrorMsg = 'El usuario ya está registrado';
      }
      toast.error(ErrorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPass = async (email: string) => {
    try {
        await fetch(EDGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
          body: JSON.stringify({ email: email, password: 'bajardepeso', accion: 'actualizar' })
        });
        toast.success("Contraseña reseteada. (Requiere soporte en Edge Function)");
    } catch {
        toast.error("Error al resetear contraseña.");
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;

    const admin = adminToDelete;
    setAdminToDelete(null);

    // Evitar que un admin se borre a sí mismo
    if (admin.email.toLowerCase() === session.email.toLowerCase()) {
      return toast.error("No podés borrar tu propio usuario.");
    }

    // Actualización local inmediata para feedback visual instantáneo
    const oldAdmins = [...admins];
    setAdmins(prev => prev.filter(a => a.id !== admin.id));

    setLoading(true);
    try {
      console.log("Iniciando borrado de admin:", admin.email);
      
      // 1. Borrar de Auth vía Edge Function (Smart Handler)
      try {
        await fetch(EDGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
          body: JSON.stringify({ email: admin.email, accion: 'borrar' })
        });
      } catch (err) {
        console.warn("Aviso: Falló el borrado en Auth, procediendo con DB...", err);
      }
      
      // 2. Borrar registros asociados
      const emailLower = admin.email.toLowerCase();
      await supabase.from('registro_peso').delete().match({ paciente_email: emailLower });
      await supabase.from('pacientes').delete().match({ email: emailLower });

      // 3. Borrar de la tabla maestra de acceso
      const { error } = await supabase.from('acceso')
        .delete()
        .eq('id', admin.id);
      
      if (error) {
        console.error("Error en delete de acceso por ID:", error);
        // Re-intento por email si falla por ID
        const { error: error2 } = await supabase.from('acceso').delete().eq('email', admin.email);
        if (error2) throw error2;
      }
      
      toast.success('Administrador eliminado correctamente.');
      await cargarAdmins();
    } catch (e: any) {
      console.error("Delete Error Detalle:", e);
      toast.error('No se pudo borrar del servidor: ' + (e.message || 'Error de permisos'));
      setAdmins(oldAdmins); // Revertir si realmente falló
      await cargarAdmins();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-gris-bg rounded-[12px] p-[16px_18px] mb-[20px]">
        <h3 className="text-azul font-semibold mb-3">{formData.isEditing ? 'Modificar' : 'Crear'} Administrador</h3>
        <div className="campo"><label>Nombre</label><input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} /></div>
        <div className="campo"><label>Apellido</label><input type="text" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} /></div>
        <div className="campo"><label>Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={formData.isEditing}/></div>
        {!formData.isEditing && <div className="text-[0.78rem] text-suave mb-3">La contraseña por defecto será <b>bajardepeso</b></div>}
        {formData.isEditing && (
            <div className="campo mb-3 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-[18px] h-[18px] accent-verde" checked={formData.activo} onChange={e => setFormData({...formData, activo: e.target.checked})} />
                <span className="text-[0.93rem] text-texto">Usuario activo</span>
              </label>
            </div>
        )}
        <div className="flex gap-2">
            <button className="btn btn-primario flex-1 py-2 text-sm" onClick={handleguardar}>{formData.isEditing ? 'GUARDAR' : 'CREAR'}</button>
            {formData.isEditing && <button className="btn btn-outline flex-1 py-2 text-sm" onClick={() => setFormData({ id: 0, nombre: '', apellido: '', email: '', password: '', isEditing: false, activo: true })}>CANCELAR</button>}
        </div>
      </div>

      <h3 className="text-azul font-semibold mb-3">Lista de Administradores</h3>
      {loading ? <div className="text-suave text-sm">Cargando...</div> : (
        <div className="flex flex-col gap-3">
          {admins.map(a => (
            <div key={a.id} className={`p-3 rounded-lg border-[1px] ${!a.activo ? 'bg-gray-50 border-gray-200' : 'bg-white border-gris-bor'} shadow-sm flex flex-col gap-2`}>
              <div className="flex justify-between items-start">
                  <div>
                    <div className={`font-semibold ${!a.activo ? 'text-gray-400' : 'text-azul'}`}>{a.nombre} {a.apellido} <span className="text-[0.6rem] bg-gris-bor px-2 py-0.5 rounded-full ml-1 text-suave">{a.nivel}</span></div>
                    <div className="text-sm text-suave">{a.email}</div>
                  </div>
              </div>
              <div className="flex gap-2 mt-1">
                  <button className="flex-1 bg-gris-bg text-azul text-xs py-1.5 rounded font-semibold hover:bg-gray-200 transition-colors" onClick={() => setFormData({ id: a.id, nombre: a.nombre, apellido: a.apellido, email: a.email, password: '', isEditing: true, activo: a.activo })}>MODIFICAR</button>
                  <button className="flex-1 bg-red-50 text-red-600 text-xs py-1.5 rounded font-semibold hover:bg-red-100 transition-colors" onClick={() => handleResetPass(a.email)}>RESET PASS</button>
                  <button 
                    className="w-10 flex items-center justify-center bg-red-600 text-white rounded hover:bg-red-700 transition-colors" 
                    onClick={() => setAdminToDelete(a)}
                    title="Eliminar Admin"
                  >
                    <Trash2 size={16} />
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmación de Borrado */}
      {adminToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4 mx-auto">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-azul text-center mb-2">¿Eliminar administrador?</h3>
            <p className="text-gray-500 text-sm text-center mb-6 leading-relaxed">
              Estás por borrar a <span className="font-semibold text-azul">{adminToDelete.nombre} {adminToDelete.apellido}</span>.<br/>
              Esta acción eliminará todos sus datos y registros en cascada de forma permanente.
            </p>
            <div className="flex flex-col gap-2">
              <button 
                className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors"
                onClick={handleDeleteAdmin}
              >
                SÍ, BORRAR TODO
              </button>
              <button 
                className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                onClick={() => setAdminToDelete(null)}
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileTab({ session }: { session: UserSession }) {
  const [formData, setFormData] = useState({ nombre: '', apellido: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [id, setId] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    cargarPerfil();
  }, [session.email]);

  const cargarPerfil = async () => {
    const { data } = await supabase.from('acceso').select('id, nombre, apellido').eq('email', session.email!).maybeSingle();
    if (data) {
      setId(data.id);
      setFormData(prev => ({ ...prev, nombre: data.nombre, apellido: data.apellido }));
    }
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.apellido) return toast.error('Nombre y Apellido son obligatorios');
    setLoading(true);
    try {
      if (id) {
        await supabase.from('acceso').update({ nombre: formData.nombre, apellido: formData.apellido }).eq('id', id);
      }
      
      if (formData.password) {
        if (formData.password === 'bajardepeso') {
          throw new Error('Contraseña inválida');
        }
        const { error } = await supabase.auth.updateUser({ password: formData.password });
        if (error) throw error;
      }
      toast.success('Perfil actualizado correctamente');
      setFormData(prev => ({ ...prev, password: '' }));
      localStorage.removeItem('force_password_change');
      
      // Also update local session
    } catch (e: any) {
      let ErrorMsg = e.message || 'Error al actualizar perfil';
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
        <p className="text-suave text-sm mb-4">Actualizá tus datos personales y contraseña.</p>
        
        {isForced && (
            <div className="bg-red-50 text-red-700 text-[0.8rem] p-3 rounded-lg border border-red-200 mb-4 leading-tight">
                <strong>Atención:</strong> Por razones de seguridad, es <b>obligatorio</b> cambiar tu contraseña por defecto antes de continuar.
            </div>
        )}

        <div className="campo"><label>Nombre</label><input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} /></div>
        <div className="campo"><label>Apellido</label><input type="text" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} /></div>
        <div className="campo"><label>Email (no modificable)</label><input type="email" value={session.email || ''} disabled className="bg-white text-suave" /></div>
        
        <div className="campo mt-4 relative">
            <label>Nueva Contraseña {isForced && <span className="text-red-500">*</span>}</label>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Dejar en blanco para no cambiar..." 
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
        
        <button className="btn btn-primario mt-2" onClick={handleSave} disabled={loading || (isForced && !formData.password)}>
            {loading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
        </button>
      </div>
    </div>
  );
}