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
import { Toaster, toast } from 'react-hot-toast';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'HOME' | 'ALTAS' | 'MODIF' | 'SYNC' | 'PESO' | 'EVOLUCION' | 'ADMINS' | 'PROFILE' | 'NUTRITION' | 'EXERCISE' | 'ADMIN_EVOLUCION' | 'CARGA_DIFERIDA'>('HOME');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
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
        console.error('Session check error:', err);
        setLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.email!);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setLoading(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (email: string) => {
    try {
      setLoading(true);
      const { data: profile } = await supabase
        .from('acceso')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

      if (profile && profile.activo) {
        let pacienteId = undefined;
        if (profile.nivel?.toUpperCase() === 'PACIENTE') {
          const { data: p } = await supabase
            .from('pacientes')
            .select('id')
            .ilike('email', email)
            .maybeSingle();
          pacienteId = p?.id;
        }

        setSession({
          email,
          name: `${profile.nombre} ${profile.apellido}`,
          level: profile.nivel,
          pacienteId
        });

        if (localStorage.getItem('force_password_change') === 'true') {
          setCurrentView('PROFILE');
        } else {
          setCurrentView(profile.nivel?.toUpperCase() === 'PACIENTE' ? 'PESO' : 'HOME');
        }
      } else {
        // SESIÓN HUÉRFANA O INACTIVA
        console.warn("Usuario sin acceso. Cerrando...");
        await supabase.auth.signOut();
        setSession(null);
        toast.error('Email o contraseña incorrectos');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-poppins text-suave">Cargando aplicación...</div>;

  const handleNavigate = (view: any) => {
    if (localStorage.getItem('force_password_change') === 'true' && ['ADMIN', 'SADMIN'].includes(session?.level?.toUpperCase() || '')) {
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
