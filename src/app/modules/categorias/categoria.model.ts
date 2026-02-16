import { Campeonato } from '../campeonatos/campeonato.model';

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  campeonatoId: number;
  campeonato?: Campeonato;
  orden: number;
  equiposAscienden: number;
  equiposDescienden: number;
  activo: boolean;
  creadoEn: string;
}

export interface CreateCategoriaDto {
  nombre: string;
  descripcion?: string;
  campeonatoId: number;
  orden: number;
  equiposAscienden?: number;
  equiposDescienden?: number;
}
