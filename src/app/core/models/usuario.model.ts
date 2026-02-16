export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: {
    id: number;
    nombre: string;
  };
  equipoId?: number;
  activo: boolean;
  creadoEn: Date;
}
