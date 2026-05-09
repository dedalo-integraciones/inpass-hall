export type UserLevel = 'ADMIN' | 'SADMIN' | 'PACIENTE';

export interface UserSession {
  email: string;
  name: string;
  level: UserLevel;
  pacienteId?: number;
}
