export interface Transferencia {
  id: number;
  jugadorId: number;
  jugador?: any;
  campeonatoId: number;
  campeonato?: any;
  equipoOrigenId: number;
  equipoOrigen?: any;
  equipoDestinoId: number;
  equipoDestino?: any;
  fechaSolicitud: string;
  estadoEquipoOrigen: 'pendiente' | 'aprobado' | 'rechazado';
  estadoDirectivo: 'pendiente' | 'aprobado' | 'rechazado';
  solicitadoPor: number;
  aprobadoPorOrigen?: number;
  fechaAprobacionOrigen?: string;
  aprobadoPorDirectivo?: number;
  fechaAprobacionDirectivo?: string;
  observaciones?: string;
  activo: boolean;
  creadoEn: string;
}

export interface CreateTransferenciaDto {
  jugadorId: number;
  campeonatoId: number;
  equipoDestinoId: number;
  observaciones?: string;
}
