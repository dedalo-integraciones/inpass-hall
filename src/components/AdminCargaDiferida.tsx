import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { UserSession } from '../types';
import toast from 'react-hot-toast';
import { getFechaLocal } from '../utils/date';
import { updatePatientWeights } from '../utils/pesoUpdater';

export default function AdminCargaDiferida({ session }: { session: UserSession }) {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    setLoading(true);
    const { data: p } = await supabase
      .from('pacientes')
      .select('nombre, apellido, email')
      .eq('activo', 'SI')
      .order('nombre', { ascending: true });
    if (p) setPacientes(p);
    setLoading(false);
  };

  const filteredPacientes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return pacientes;
    return pacientes.filter(p => {
      const full = `${p.nombre} ${p.apellido}`.toLowerCase();
      const email = p.email.toLowerCase();
      return full.includes(term) || email.includes(term);
    });
  }, [pacientes, searchTerm]);

  if (showForm && searchTerm) {
    let p = pacientes.find(pp => pp.email.toLowerCase() === searchTerm.toLowerCase().trim());
    if (!p && filteredPacientes.length === 1) {
      p = filteredPacientes[0];
    }
    
    const targetEmail = p ? p.email : searchTerm;
    const targetNombre = p ? `${p.nombre} ${p.apellido}` : targetEmail;
    
    return (
      <div>
        <button className="btn btn-primario mb-[20px]" onClick={() => setShowForm(false)}>VOLVER A BÚSQUEDA</button>
        <CargaDiferidaForm email={targetEmail} nombre={targetNombre} />
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gris-bg rounded-[12px] p-[16px_18px] mb-[20px]">
        <h3 className="text-azul font-semibold mb-3">Carga de Peso Diferida</h3>
        
        <div className="campo">
          <label>Buscar Paciente o Email Seleccionado</label>
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
              <div className="p-4 text-center text-suave text-sm">No se encontraron pacientes activos.</div>
            ) : (
              filteredPacientes.map(p => (
                <div 
                  key={p.email} 
                  className="flex p-[10px_14px] border-b border-gris-bor last:border-b-0 hover:bg-gray-50 cursor-pointer text-[0.8rem] transition-colors items-center"
                  onDoubleClick={() => setSearchTerm(p.email)}
                  onClick={() => {
                    if (window.innerWidth < 640) setSearchTerm(p.email);
                  }}
                >
                  <div className="flex-1 font-medium text-texto">
                    {p.nombre} {p.apellido}
                    <div className="text-[0.65rem] text-suave md:hidden mt-0.5">{p.email}</div>
                  </div>
                  <div className="flex-1 text-suave hidden md:block truncate">{p.email}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <button 
          className="btn btn-primario mt-4" 
          onClick={() => {
            if (!searchTerm) return toast.error('Ingresá o seleccioná un paciente.');
            setShowForm(true);
          }}
        >
          CARGAR PESO
        </button>
      </div>
    </div>
  );
}

function CargaDiferidaForm({ email, nombre }: { email: string, nombre: string }) {
  const [fecha, setFecha] = useState(getFechaLocal());
  const [peso, setPeso] = useState('');
  const [loading, setLoading] = useState(false);
  const [existente, setExistente] = useState<{ id?: number, peso_kg: number } | null>(null);

  const handleSubmit = async () => {
    if (!fecha) return toast.error('Seleccione una fecha válida');
    if (fecha > getFechaLocal()) return toast.error('La fecha no puede ser mayor que el día actual');

    const pesoNum = parseFloat(peso.replace(',', '.'));
    if (!peso || isNaN(pesoNum) || pesoNum <= 0 || pesoNum > 200) {
      return toast.error('El peso debe ser mayor a 0 y menor o igual a 200 kg');
    }

    setLoading(true);

    try {
      // Verificar si ya existe un registro para esta fecha
      const { data: existingRecords, error: fetchError } = await supabase
        .from('registro_peso')
        .select('*')
        .eq('paciente_email', email.trim().toLowerCase())
        .eq('fecha_registro', fecha);

      if (fetchError) throw fetchError;

      if (existingRecords && existingRecords.length > 0) {
        setExistente(existingRecords[0]);
        setLoading(false);
        return;
      }

      await grabar(pesoNum, false);
    } catch (err: any) {
      toast.error('Error al verificar registro');
      console.error(err);
      setLoading(false);
    }
  };

  const grabar = async (p: number, reemplazar: boolean) => {
    setLoading(true);
    try {
      const emailTrim = email.trim().toLowerCase();
      if (reemplazar) {
        const { error: updateError } = await supabase
          .from('registro_peso')
          .update({ peso_kg: p })
          .eq('paciente_email', emailTrim)
          .eq('fecha_registro', fecha);

        if (updateError) throw updateError;
        toast.success('Peso actualizado correctamente');
      } else {
        const { error: insertError } = await supabase
          .from('registro_peso')
          .insert([{
            fecha_registro: fecha,
            peso_kg: p,
            paciente_email: emailTrim
          }]);

        if (insertError) throw insertError;
        toast.success('Peso registrado correctamente');
      }
      await updatePatientWeights(emailTrim);
      setPeso('');
      setExistente(null);
    } catch (err: any) {
      toast.error('Error al guardar el registro');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-[1.5rem] font-semibold text-azul mb-[4px] text-center">{nombre}</div>
      <div className="text-[0.9rem] text-suave mb-6 text-center">{email}</div>

      <div className="bg-gris-bg rounded-[12px] p-[16px_18px]">
        <div className="campo">
          <label>Fecha de registro</label>
          <input 
            type="date" 
            value={fecha} 
            onChange={e => {
              setFecha(e.target.value);
              setExistente(null);
            }} 
            max={getFechaLocal()} 
          />
        </div>

        <div className="campo">
          <label>Peso (kg) *</label>
          <input 
            type="number" 
            placeholder="Ej: 75.5" 
            value={peso} 
            onChange={(e) => {
              setPeso(e.target.value);
              setExistente(null);
            }} 
            step="0.1"
            min="0.1"
            max="200"
          />
        </div>

        {existente && (
          <div className="bg-amarillo-bg border-[1.5px] border-amarillo-bor rounded-[10px] p-[14px_16px] mb-[18px]">
            <p className="text-[0.86rem] text-[#7a5c00] mb-[12px] leading-[1.45]">
              Ya registraste <strong>{existente.peso_kg} kg</strong> en esta fecha.<br/>
              ¿Querés reemplazarlo?
            </p>
            <div className="flex gap-[10px]">
              <button 
                className="btn btn-primario !mt-0 !bg-verde" 
                onClick={() => grabar(parseFloat(peso.replace(',', '.')), true)}
                disabled={loading}
              >
                {loading ? 'GRABANDO...' : 'SÍ, REEMPLAZAR'}
              </button>
              <button 
                className="btn btn-secundario !mt-0 !bg-[#1e293b] !text-white !border-none" 
                onClick={() => { setExistente(null); setPeso(''); }}
                disabled={loading}
              >
                CANCELAR
              </button>
            </div>
          </div>
        )}

        {!existente && (
          <button 
            className="btn btn-primario mt-2" 
            onClick={handleSubmit} 
            disabled={loading}
          >
            {loading ? 'VERIFICANDO...' : 'REGISTRAR PESO'}
          </button>
        )}
      </div>
    </div>
  );
}
