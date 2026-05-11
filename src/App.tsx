/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { UserSession } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import AdminPanel from './components/AdminPanel';
import PatientPanel from './components/PatientPanel';
import { Menu, MoreVertical, Home as HomeIcon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'HOME' | 'ALTAS' | 'MODIF' | 'SYNC' | 'PESO' | 'EVOLUCION' | 'ADMINS' | 'PROFILE' | 'NUTRITION' | 'EXERCISE' | 'TALLERES' | 'ADMIN_EVOLUCION' | 'CARGA_DIFERIDA'>('HOME');

  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!active) return;
        
        if (error) {
          console.error("Auth error:", error);
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('invalid') || error.status === 401) {
            await supabase.auth.signOut();
          }
          setLoading(false);
          return;
        }

        if (session?.user) {
          await loadUserProfile(session.user.email!);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Init auth error:", err);
        if (active) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      if (event === 'SIGNED_IN' && session?.user) {
        // If we already have the session, don't continually reload profile!
        // To be safe, only do it if loading is false, or session is not set
        setSession(prev => {
          if (!prev) {
            loadUserProfile(session.user.email!);
          }
          return prev;
        });
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (email: string) => {
    try {
      setLoading(true);

      // 1. Chequear tabla 'acceso' (ADMIN, SADMIN, etc)
      const { data: adminProfile } = await supabase
        .from('acceso')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

      if (adminProfile && adminProfile.activo) {
        setSession({
          email,
          name: `${adminProfile.nombre} ${adminProfile.apellido}`,
          level: adminProfile.nivel,
        });

        if (localStorage.getItem('force_password_change') === 'true') {
          setCurrentView('PROFILE');
        } else {
          setCurrentView('HOME');
        }
        return;
      }

      // 2. Si no es admin/sadmin (o no está activo en acceso), chequear tabla 'pacientes'
      const { data: pacienteProfile } = await supabase
        .from('pacientes')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

      if (pacienteProfile && pacienteProfile.activo) {
        setSession({
          email,
          name: `${pacienteProfile.nombre} ${pacienteProfile.apellido}`,
          level: 'PACIENTE',
          pacienteId: pacienteProfile.id,
        });

        if (localStorage.getItem('force_password_change') === 'true') {
          setCurrentView('PROFILE');
        } else {
          setCurrentView('PESO');
        }
        return;
      }

      // SESIÓN HUÉRFANA O INACTIVA
      await supabase.auth.signOut();
      setSession(null);
      toast.error('El usuario está inactivo o no tiene acceso autorizado.');
    } catch (err: any) {
      console.error("loadUserProfile error:", err);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center font-poppins text-suave">
        <div className="mb-4">Cargando aplicación...</div>
      </div>
    );
  }

  const handleNavigate = (view: any) => {
    if (localStorage.getItem('force_password_change') === 'true') {
      setCurrentView('PROFILE');
      return;
    }
    setCurrentView(view);
  };

  if (currentView === 'NUTRITION') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-transparent">
        <Toaster position="top-center" />
        <button 
          className="absolute top-4 right-4 z-[60] w-10 h-10 flex items-center justify-center bg-white/80 rounded-full shadow-md text-azul hover:bg-white transition-colors border border-gris-bor"
          onClick={() => handleNavigate('HOME')}
        >
          <HomeIcon size={20} />
        </button>
        
        <iframe 
          title="EPI - Plan Alimentario Semana 1 y 2" 
          frameBorder="0" 
          className="w-full h-full flex-1"
          src="https://view.genially.com/673dd5bab2ad8a22ff691a17" 
          type="text/html" 
          allowScriptAccess="always" 
          allowFullScreen={true} 
          scrolling="yes" 
          allowNetworking="all"
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[480px] bg-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden relative">
      <Toaster position="top-center" />
      
      <div className="bg-azul p-[28px_24px] text-center relative flex items-center justify-center min-h-[90px]">
            {session && (
              <button 
                className="absolute left-[18px] top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-white/10 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="text-white" size={24} />
              </button>
            )}
            <img src="https://i.ibb.co/XZyj0bxd/Logo-Inpass.png" alt="INPASS Hall" className="w-[180px]" />
            {session && ['ADMIN', 'SADMIN'].includes(session.level?.toUpperCase() || '') && (
              <button 
                className="absolute right-[18px] top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-white/10 transition-colors text-white"
                onClick={() => handleNavigate('PROFILE')}
                title="Mi Perfil"
              >
                <MoreVertical size={24} />
              </button>
            )}
          </div>

          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
            session={session} 
            currentView={currentView}
            onNavigate={handleNavigate}
          />

          <main className="p-[28px_24px_32px]">
            {!session ? (
              <Login onLoginSuccess={() => {}} />
            ) : session.level === 'PACIENTE' ? (
              <PatientPanel currentView={currentView} session={session} onNavigate={handleNavigate} />
            ) : (
              <AdminPanel currentView={currentView} onNavigate={handleNavigate} session={session} />
            )}
          </main>
    </div>
  );
}
