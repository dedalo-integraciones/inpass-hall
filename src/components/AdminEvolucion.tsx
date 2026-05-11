import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { UserSession } from '../types';
import toast from 'react-hot-toast';
import { getFechaLocal } from '../utils/date';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

export default function AdminEvolucion({ session }: { session: UserSession }) {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isSadmin = session.level?.toUpperCase() === 'SADMIN';

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    setLoading(true);
    const { data: p } = await supabase
      .from('pacientes')
      .select('nombre, apellido, email, grupo, activo, altura')
      .eq('activo', 'SI')
      .order('nombre', { ascending: true });
    if (p) setPacientes(p);
    setLoading(false);
  };

  const exportarEvolucion = async () => {
    setExporting(true);
    try {
      // 1. Definir rango de 30 días (hoy incluido)
      const dates: string[] = [];
      const headers: string[] = ['Paciente', 'Altura', 'Grupo'];
      
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        dates.push(ds);
        
        // Formato DD/MM/AAAA para cabecera
        const parts = ds.split('-');
        headers.push(`${parts[2]}/${parts[1]}/${parts[0]}`);
      }

      headers.push('Efectuados', 'No efectuados', 'Mínimo kg', 'Máximo kg', 'Primer peso kg', 'Último peso kg', 'Evolución');

      // 2. Obtener pesos de todos los pacientes activos en ese rango
      const { data: pesos, error } = await supabase
        .from('registro_peso')
        .select('paciente_email, fecha_registro, peso_kg')
        .gte('fecha_registro', dates[0])
        .lte('fecha_registro', dates[dates.length - 1]);

      if (error) throw error;

      // 3. Mapear pesos por email y fecha
      const pesoMap = new Map<string, Map<string, number>>();
      pesos?.forEach(p => {
        if (!pesoMap.has(p.paciente_email)) pesoMap.set(p.paciente_email, new Map());
        pesoMap.get(p.paciente_email)?.set(p.fecha_registro, p.peso_kg);
      });

      // 4. Construir filas
      const rows = pacientes.map(p => {
        const row: any = {
          'Paciente': `${p.nombre} ${p.apellido}`,
          'Altura': p.altura ? p.altura.toFixed(2) : '-',
          'Grupo': p.grupo || '-'
        };

        const patientWeights = pesoMap.get(p.email.toLowerCase());
        const weightsList: number[] = [];
        
        // Llenar columnas de fechas
        dates.forEach((d, idx) => {
          const w = patientWeights?.get(d);
          const colHeader = headers[idx + 3];
          row[colHeader] = w || '';
          if (w) weightsList.push(w);
        });

        // Calcular métricas
        const efectuados = weightsList.length;
        const noEfectuados = dates.length - efectuados;
        const min = efectuados ? Math.min(...weightsList) : 0;
        const max = efectuados ? Math.max(...weightsList) : 0;
        
        // Primer y último peso en este periodo
        let primer = 0;
        let ultimo = 0;
        for(const d of dates) {
          const w = patientWeights?.get(d);
          if (w) {
            primer = w;
            break;
          }
        }
        for(let i = dates.length - 1; i >= 0; i--) {
          const w = patientWeights?.get(dates[i]);
          if (w) {
            ultimo = w;
            break;
          }
        }

        row['Efectuados'] = efectuados;
        row['No efectuados'] = noEfectuados;
        row['Mínimo kg'] = efectuados ? min.toFixed(2) : '-';
        row['Máximo kg'] = efectuados ? max.toFixed(2) : '-';
        row['Primer peso kg'] = primer ? primer.toFixed(2) : '-';
        row['Último peso kg'] = ultimo ? ultimo.toFixed(2) : '-';
        row['Evolución'] = primer && ultimo ? (ultimo - primer).toFixed(2) : '-';

        return row;
      });

      // 5. Crear Excel
      const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
      
      // Auto-fit columns
      const colWidths = headers.map(header => {
        let maxLen = header.length;
        rows.forEach(row => {
          const val = row[header];
          if (val !== undefined && val !== null && val !== '') {
            const currentLen = String(val).length;
            if (currentLen > maxLen) maxLen = currentLen;
          }
        });
        return { wch: maxLen + 2 }; // Margen de 2 caracteres
      });
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Evolución');
      XLSX.writeFile(wb, 'EvolucionPeso.xlsx');

      toast.success('Excel generado con éxito');
    } catch (err: any) {
      console.error(err);
      toast.error('Error al exportar datos');
    } finally {
      setExporting(false);
    }
  };

  const filteredPacientes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return pacientes;
    return pacientes.filter(p => {
      const full = `${p.nombre} ${p.apellido}`.toLowerCase();
      const email = p.email.toLowerCase();
      // Permite filtrar por nombre o por email (util si ya está seleccionado el email)
      return full.includes(term) || email.includes(term);
    });
  }, [pacientes, searchTerm]);

  if (showChart && searchTerm) {
    // Intentar buscar el paciente por email
    let p = pacientes.find(pp => pp.email.toLowerCase() === searchTerm.toLowerCase().trim());
    if (!p) {
        // En caso de que haya un solo resultado y no coincida con el email
        if (filteredPacientes.length === 1) p = filteredPacientes[0];
    }
    
    const targetEmail = p ? p.email : searchTerm;
    
    return (
      <div>
        <button className="btn btn-primario mb-[20px]" onClick={() => setShowChart(false)}>VOLVER A BÚSQUEDA</button>
        <EvolucionBarChart email={targetEmail} nombre={p ? `${p.nombre} ${p.apellido}` : targetEmail} />
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gris-bg rounded-[12px] p-[16px_18px] mb-[20px]">
        <h3 className="text-azul font-semibold mb-3">Control de Evolución</h3>
        
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
            setShowChart(true);
          }}
        >
          VER EVOLUCIÓN
        </button>

        {isSadmin && (
          <>
            <div className="h-[1.5px] bg-gris-bor w-full my-6 opacity-60"></div>
            <button 
              className="btn btn-primario !bg-azul hover:opacity-90 w-full" 
              onClick={exportarEvolucion}
              disabled={exporting}
            >
              {exporting ? 'GENERANDO MÁTRZ...' : 'EXPORTAR EVOLUCIÓN'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function EvolucionBarChart({ email, nombre }: { email: string, nombre: string }) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
    try {
      const { data: records, error } = await supabase
        .from('registro_peso')
        .select('fecha_registro, peso_kg')
        .eq('paciente_email', email.trim().toLowerCase())
        .gte('fecha_registro', desde)
        .lte('fecha_registro', hasta)
        .order('fecha_registro', { ascending: true });
      
      if (error) {
        toast.error('Error al cargar datos');
      } else {
        setData(records || []);
      }
    } catch(err) {
      toast.error('Ocurrió un error inesperado al cargar la evolución.');
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const filledData = useMemo(() => {
    try {
      if (!desde || !hasta) return [];
      const startDate = new Date(desde + 'T12:00:00');
      const endDate = new Date(hasta + 'T12:00:00');
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return [];

      const result = [];
      const dataMap = new Map();
      for(const d of (data || [])) {
         if (d && d.fecha_registro) {
           dataMap.set(d.fecha_registro, d.peso_kg);
         }
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
    } catch(err) {
      console.error('Error calculating filledData:', err);
      return [];
    }
  }, [data, desde, hasta]);

  const pesos = (data || []).map(r => parseFloat(r.peso_kg)).filter(v => !isNaN(v) && isFinite(v));
  const min = pesos.length > 0 ? Math.min(...pesos) : 0;
  const max = pesos.length > 0 ? Math.max(...pesos) : 0;
  const domainMin = pesos.length > 0 ? Math.max(0, Math.floor(min) - 1) : 0;
  const domainMax = pesos.length > 0 ? Math.ceil(max) + 1 : 100;
  const primerPeso = pesos.length > 0 ? pesos[0] : 0;
  const ultimoPeso = pesos.length > 0 ? pesos[pesos.length-1] : 0;
  const evolucion = ultimoPeso - primerPeso;
  const evolucionColor = evolucion < 0 ? 'text-verde' : evolucion > 0 ? 'text-rojo' : 'text-[#eab308]';
  const registrosNoEfectuados = filledData.length - data.length;

  return (
    <div>
      <div className="text-[1.5rem] font-semibold text-azul mb-2 text-center">{nombre}</div>
      <p className="seccion-label text-center">Evolución de peso</p>

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
                  <XAxis dataKey="fecha_registro" tickFormatter={(v) => { if (typeof v !== 'string') return ''; const parts = v.split('-'); return parts.length >= 3 ? `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}` : v; }} tick={{fontSize: 11, fill: '#6c7a89'}} axisLine={false} tickLine={false} />
                  <YAxis domain={[domainMin, domainMax]} tickFormatter={(v) => Number(v).toFixed(2)} tick={{fontSize: 11, fill: '#6c7a89'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(0,146,146,0.05)'}} 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const labelStr = String(label || '');
                        const parts = labelStr.split('-');
                        const formattedLabel = parts.length >= 3 ? `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}` : labelStr;
                        const val = payload[0].value;
                        if (val === null || val === undefined || isNaN(Number(val))) {
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
                      return <div style={{ display: 'none' }} />;
                    }}
                  />
                  <Bar dataKey="peso_kg" fill="#009292" radius={[4,4,0,0]} isAnimationActive={false} />
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
