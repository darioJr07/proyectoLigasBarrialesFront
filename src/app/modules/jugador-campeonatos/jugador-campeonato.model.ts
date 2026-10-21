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
  estado: 'pendiente' | 'habilitado' | 'rechazado' | 'baja';
  solicitadoPor?: number;
  aprobadoPor?: number;
  fechaAprobacion?: string;
  observaciones?: string;
  fechaInscripcion: string;
  activo: boolean;
  creadoEn: string;
  cambiosDorsalActivos?: CambioDorsalEtapa[];
}

export interface CambioDorsalEtapa {
  id: number;
  jugadorCampeonatoId: number;
  etapaCompetenciaId: number;
  etapa?: { id: number; nombre: string; estado: string };
  numeroCancha: number;
  jornadaDesde: number;
  motivo: string;
  activo: boolean;
  creadoEn: string;
}

export interface OpcionEtapaCambioDorsal {
  id: number;
  nombre: string;
  orden: number;
  estado: 'pendiente' | 'actual' | 'finalizada';
  ultimaJornadaJugada: number;
  proximaJornadaSugerida: number;
  puedeCambiar: boolean;
  cambioActivo: CambioDorsalEtapa | null;
}

export interface OpcionesCambioDorsal {
  jornadaLimite: number;
  habilitacion: {
    id: number;
    numeroCancha: number;
    jugador: any;
    equipo: any;
    campeonato: any;
    categoria: any;
  };
  etapas: OpcionEtapaCambioDorsal[];
}

export interface RegistrarCambioDorsalDto {
  etapaCompetenciaId: number;
  numeroCancha: number;
  jornadaDesde: number;
  motivo: string;
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
