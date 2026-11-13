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
  tipoSolicitud?: 'normal' | 'reingreso';
  habilitacionOrigenId?: number | null;
  habilitacionOrigen?: JugadorCampeonato | null;
  motivoReingreso?: string | null;
  referenciaReingreso?: string | null;
  fechaBaja?: string | null;
  dadoBajaPor?: number | null;
  motivoBaja?: string | null;
  referenciaBaja?: string | null;
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
  motivoReingreso?: string;
  referenciaReingreso?: string;
}

export interface AntecedenteReingreso {
  esReingreso: boolean;
  antecedente: {
    id: number;
    numeroCancha: number;
    fechaAprobacion?: string | null;
    fechaBaja?: string | null;
    motivoBaja?: string | null;
    referenciaBaja?: string | null;
  } | null;
}

export interface ResumenReingreso {
  solicitud: JugadorCampeonato;
  esReingreso: boolean;
  requiereRegularizacion: boolean;
  antecedente: JugadorCampeonato | null;
  golesAcumulados: number;
  sancionesActivas: Array<{
    id: number;
    tipo: string;
    descripcion?: string;
    partidosSuspension: number;
    partidosCumplidos: number;
    partidosPendientes: number;
    fechaFinSuspension?: string | null;
  }>;
  transferenciasEnProceso: any[];
}

export interface RegularizarReingresoDto {
  habilitacionOrigenId: number;
  motivoReingreso: string;
  referenciaReingreso?: string;
  fechaBaja?: string;
  motivoBaja?: string;
  referenciaBaja?: string;
}

export interface UpdateJugadorCampeonatoDto {
  categoriaId?: number;
  numeroCancha?: number;
  posicion?: string;
  observaciones?: string;
}
