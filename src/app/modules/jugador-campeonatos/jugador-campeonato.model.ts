export interface JugadorCampeonato {
  id: number;
  jugadorId: number;
  jugador?: any;
  campeonatoId: number;
  campeonato?: any;
  equipoId: number;
  equipo?: any;
  categoriaId: number;
  categoria?: any;
  numeroCancha: number;
  posicion: string;
  estado: 'pendiente' | 'habilitado' | 'rechazado';
  solicitadoPor?: number;
  aprobadoPor?: number;
  fechaAprobacion?: string;
  observaciones?: string;
  fechaInscripcion: string;
  activo: boolean;
  creadoEn: string;
}

export interface CreateJugadorCampeonatoDto {
  jugadorId: number;
  campeonatoId: number;
  equipoId: number;
  categoriaId: number;
  numeroCancha: number;
  posicion: string;
}

export interface UpdateJugadorCampeonatoDto {
  categoriaId?: number;
  numeroCancha?: number;
  posicion?: string;
  observaciones?: string;
}
