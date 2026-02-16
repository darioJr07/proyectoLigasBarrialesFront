import { Liga } from './liga.model';
import { Usuario } from './usuario.model';

export interface Equipo {
  id: number;
  nombre: string;
  representante?: string;
  fundacion?: Date;
  descripcion?: string;  imagen?: string;  ligaId: number;
  liga: Liga;
  dirigenteId: number;
  dirigente: Usuario;
  activo: boolean;
  creadoEn: Date;
}
