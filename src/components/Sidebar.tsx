import { X, Plus, Edit2, RefreshCw, LogOut, Scale, TrendingUp, Users, Utensils, Dumbbell, LineChart as LineChartIcon, CalendarDays } from 'lucide-react';
import { UserSession } from '../types';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession | null;
  currentView: string;
  onNavigate: (view: any) => void;
}

export default function Sidebar({ isOpen, onClose, session, currentView, onNavigate }: SidebarProps) {
  if (!session) return null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  const NavItem = ({ view, icon: Icon, label }: any) => (
    <div 
      className={`flex items-center gap-3 p-[13px_22px] font-semibold text-[0.9rem] cursor-pointer transition-colors border-l-[3px] ${currentView === view ? 'bg-gris-bg text-verde border-verde' : 'border-transparent text-texto hover:bg-gris-bg hover:text-verde'}`}
      onClick={() => { onNavigate(view); onClose(); }}
    >
      <Icon size={18} /> {label}
    </div>
  );

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 z-[200] ${isOpen ? 'block' : 'hidden'}`} 
        onClick={onClose}
      />
      
      <div className={`fixed top-0 bottom-0 w-[260px] bg-white shadow-[4px_0_20px_rgba(0,0,0,0.15)] z-[201] transition-all duration-300 ${isOpen ? 'left-0' : '-left-[280px]'} flex flex-col`}>
        <div className="bg-azul p-[24px_20px_20px] flex items-center justify-between">
          <div>
            <div className="text-white text-[0.9rem] font-semibold leading-tight">{session.name}</div>
            <div className="text-verde text-[0.72rem] uppercase tracking-wide mt-1">{session.level}</div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
            <X className="text-white" size={20} />
          </button>
        </div>

        <div className="flex-1 py-4 overflow-y-auto">
          {session.level !== 'PACIENTE' ? (
            <>
              <NavItem view="ALTAS" icon={Plus} label="Altas Pacientes" />
              <NavItem view="MODIF" icon={Edit2} label="Modificaciones Pacientes" />
              <NavItem view="ADMIN_EVOLUCION" icon={LineChartIcon} label="Control de Evolución" />
              <NavItem view="CARGA_DIFERIDA" icon={CalendarDays} label="Carga de peso diferida" />
              {session.level?.toUpperCase() === 'SADMIN' && (
                <>
                  <NavItem view="SYNC" icon={RefreshCw} label="Sincronización" />
                  <NavItem view="ADMINS" icon={Users} label="Gestión Admins" />
                </>
              )}
            </>
          ) : (
            <>
              <NavItem view="PESO" icon={Scale} label="Registrar peso" />
              <NavItem view="EVOLUCION" icon={TrendingUp} label="Mi evolución" />
              <NavItem view="NUTRITION" icon={Utensils} label="Nutrición" />
              <NavItem view="EXERCISE" icon={Dumbbell} label="Ejercicio" />
            </>
          )}

          <div className="h-[1px] bg-gris-bor my-2 mx-[22px]" />
          
          <div 
            className="flex items-center gap-3 p-[13px_22px] text-[0.9rem] text-suave cursor-pointer hover:bg-[#fdecea] hover:text-rojo transition-colors font-medium border-l-[3px] border-transparent"
            onClick={handleSignOut}
          >
            <LogOut size={18} /> Cerrar Sesión
          </div>
        </div>
      </div>
    </>
  );
}
