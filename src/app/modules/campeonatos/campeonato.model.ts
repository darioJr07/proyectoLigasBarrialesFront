import { Liga } from '../../core/models/liga.model';

export interface Campeonato {
  id: number;
  nombre: string;
  descripcion?: string;
  ligaId: number;
  liga?: Liga;
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteInscripcion: string;
  estado: 'inscripcion_abierta' | 'en_curso' | 'finalizado' | 'cancelado';
  activo: boolean;
  creadoEn: string;
}

export interface CreateCampeonatoDto {
  nombre: string;
  descripcion?: string;
  ligaId: number;
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteInscripcion: string;
  estado?: 'inscripcion_abierta' | 'en_curso' | 'finalizado' | 'cancelado';
}
