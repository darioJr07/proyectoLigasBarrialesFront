export interface Partido {
  id: number;
  campeonatoId: number;
  campeonato?: any;
  categoriaId: number;
  categoria?: any;
  equipoLocalId: number | null;
  equipoLocalOrden?: number | null;
  equipoLocal?: any;
  equipoVisitanteId: number | null;
  equipoVisitanteOrden?: number | null;
  equipoVisitante?: any;
  etapa: string;
  jornada: number;
  fechaPartido?: string;
  horaPartido?: string;
  cancha?: string;
  estado: 'programado' | 'en_juego' | 'jugado' | 'suspendido' | 'cancelado';
  golesLocal?: number;
  golesVisitante?: number;
  bonificacionLocal?: number;
  bonificacionVisitante?: number;
  sancionado?: 'ninguno' | 'local' | 'visitante';
  resultadoAdministrativoPorExpulsion?: boolean;
  observaciones?: string;
  activo: boolean;
  creadoEn: string;
  /** Indica si existe una planilla/acta de alineación guardada para el partido. */
  plantillaGuardada?: boolean;
}

export interface CreatePartidoDto {
  campeonatoId: number;
  categoriaId: number;
  equipoLocalId: number;
  equipoVisitanteId: number;
  etapa: string;
  jornada: number;
  fechaPartido?: string;
  horaPartido?: string;
  cancha?: string;
  observaciones?: string;
}

export interface UpdatePartidoDto extends Partial<CreatePartidoDto> {
  estado?: 'programado' | 'en_juego' | 'jugado' | 'suspendido' | 'cancelado';
}

export interface AutorGolDto {
  jugadorId: number;
  equipoDelJugadorId: number;
  minuto?: number;
  tipo?: 'normal' | 'penal' | 'autogol';
}

export interface RegistrarResultadoDto {
  golesLocal: number;
  golesVisitante: number;
  bonificacionLocal?: number;
  bonificacionVisitante?: number;
  observaciones?: string;
  sancionado?: 'ninguno' | 'local' | 'visitante';
  resultadoAdministrativoPorExpulsion?: boolean;
  /** Lista de autores de goles. Opcional: si no se envía, el marcador se guarda sin detalle. */
  autoresGoles?: AutorGolDto[];
}

export interface GenerarFixtureDto {
  campeonatoId: number;
  categoriaId: number;
  equipoIds?: number[];
  etapa: string;
  conRevancha?: boolean;
  formato?: 'tabla_unica' | 'grupos_cruce_descansos';
  marcarComoActual?: boolean;
  grupos?: {
    nombre: string;
    equipos: {
      equipoId: number;
      bonificaciones?: { puntos: number; etapaOrigen?: string; posicionOrigen?: number; motivo: string }[];
    }[];
  }[];
}

export interface GenerarFixtureResponse {
  totalPartidos: number;
  totalJornadas: number;
  partidos: Partido[];
}

export interface BolillaHorario {
  id?: number; numero?: number; fecha: string; hora: string; cancha: string;
  estado?: 'disponible' | 'asignada' | 'no_utilizada'; partidoId?: number | null; ordenSorteo?: number | null; asignacionManual?: boolean; solicitudHorarioId?: number | null; partido?: Partido | null;
}

export interface SolicitudHorario {
  id: number;
  ligaId: number;
  campeonatoId: number;
  categoriaId: number;
  etapa: string;
  equipoId: number;
  equipo?: any;
  partidoId: number;
  partido?: Partido;
  fechaSolicitada: string;
  horaSolicitada: string;
  canchaSolicitada?: string | null;
  motivo: string;
  estado: 'pendiente' | 'aprobada' | 'aplicada' | 'rechazada' | 'cancelada';
  programacionId?: number | null;
  bolillaId?: number | null;
  observacionResolucion?: string | null;
  creadoEn?: string;
  resueltoEn?: string | null;
}

export interface ProgramacionSeleccion {
  categoriaId: number | null;
  jornada: number;
}

export interface CrearSolicitudHorarioDto {
  campeonatoId: number;
  categoriaId: number;
  etapa: string;
  equipoId: number;
  partidoId: number;
  fechaSolicitada: string;
  horaSolicitada: string;
  canchaSolicitada?: string;
  motivo: string;
}

export interface ProgramacionSemanal {
  id: number; ligaId: number; campeonatoId: number; categoriaId?: number | null; etapa: string; jornada: number;
  totalPartidos: number; estado: 'borrador' | 'en_sorteo' | 'confirmada' | 'cancelada'; bolillas: BolillaHorario[]; partidos: Partido[];
  creadoEn?: string; confirmadoEn?: string | null;
  selecciones?: ProgramacionSeleccion[];
  solicitudesHorario?: SolicitudHorario[];
}

export type ProgramacionSemanalResumen = Omit<ProgramacionSemanal, 'bolillas' | 'partidos'>;

export interface VocaliaPartido {
  id: number;
  programacionId: number;
  partidoId: number;
  partido: Partido;
  partidoOrigenId?: number | null;
  partidoOrigen?: Partido | null;
  tipoAsignacion: 'sorteo' | 'manual_equipo' | 'directivo';
  reglaAsignacion: 'normal' | 'cierre_tres' | 'manual';
  equipoExtractorId?: number | null;
  equipoExtractor?: any | null;
  resultadoBolilla?: 'si' | 'no' | null;
  equipoVocalId?: number | null;
  equipoVocal?: any | null;
  directivoNombre?: string | null;
  estado: 'pendiente' | 'asignada' | 'confirmada';
  confirmadoEn?: string | null;
}

export interface VocaliasProgramacion {
  estado: 'sin_asignar' | 'en_preparacion' | 'confirmada';
  vocalias: VocaliaPartido[];
}

export interface CrearProgramacionSemanalDto {
  campeonatoId: number; categoriaId?: number; etapa: string; jornada: number;
  selecciones?: Array<{ categoriaId: number; jornada: number }>;
  bolillas: BolillaHorario[];
}
