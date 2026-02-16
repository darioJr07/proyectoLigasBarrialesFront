import { Equipo } from './equipo.model';

export interface Jugador {
  id: number;
  nombre: string;
  fechaNacimiento?: Date;
  cedula?: string;
  equipoId?: number;
  equipo?: Equipo;
  descripcion?: string;
  imagen?: string;
  imagenCedula?: string;
  numeroCancha?: number;
  posicion?: string;
  activo: boolean;
  creadoEn: Date;
}
