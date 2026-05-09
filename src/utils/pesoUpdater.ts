import { supabase } from '../lib/supabase';

export async function updatePatientWeights(email: string) {
  try {
    const { data: records, error } = await supabase
      .from('registro_peso')
      .select('fecha_registro, peso_kg')
      .eq('paciente_email', email)
      .order('fecha_registro', { ascending: true }); // Order by date ASC

    if (error) {
      console.error('Error fetching records to update patient weights', error);
      return;
    }

    if (!records || records.length === 0) {
      // no weights
      await supabase.from('pacientes').update({
        primer_peso_kg: null,
        primer_peso_fecha: null,
        ultimo_peso_kg: null,
        ultimo_peso_fecha: null
      }).eq('email', email);
      return;
    }

    const first = records[0];
    const last = records[records.length - 1];

    await supabase.from('pacientes').update({
      primer_peso_kg: first.peso_kg,
      primer_peso_fecha: first.fecha_registro,
      ultimo_peso_kg: last.peso_kg,
      ultimo_peso_fecha: last.fecha_registro
    }).eq('email', email);

  } catch (e) {
    console.error('Error updating patient weights on pacientes table:', e);
  }
}
