import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email) return toast.error('Ingresá tu email');
    if (!password) return toast.error('Ingresá tu contraseña');
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        toast.error('Tenés que confirmar tu email primero');
      } else if (error.message.includes('Invalid login credentials') || error.message.includes('user_not_found') || error.status === 400 || error.status === 401) {
        toast.error('Email o contraseña incorrectos');
      } else {
        toast.error('Email o contraseña incorrectos');
      }
      setLoading(false);
    } else {
      if (password === 'bajardepeso') {
        localStorage.setItem('force_password_change', 'true');
      } else {
        localStorage.removeItem('force_password_change');
      }
      onLoginSuccess();
    }
  };

  return (
    <div>
      <p className="seccion-label">Acceso al sistema</p>
      
      <div className="campo">
        <label>Email</label>
        <input 
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="Tu email de acceso" 
        />
      </div>

      <div className="campo relative">
        <label>Contraseña</label>
        <input 
          type={showPassword ? "text" : "password"} 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          placeholder="************" 
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

      <button className="btn btn-primario" onClick={handleLogin} disabled={loading}>
        {loading ? 'INGRESANDO...' : 'INGRESAR'}
      </button>

      <div className="mt-[20px] text-right">
        <span className="text-[0.65rem] text-suave italic">powered by Dédalo</span>
      </div>
    </div>
  );
}
