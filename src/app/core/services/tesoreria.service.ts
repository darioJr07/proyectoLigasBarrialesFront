import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReciboTesoreria } from './recibos-tesoreria.service';

export interface ConfigVocaliaItem {
  id?: number;
  nombre: string;
  monto: number;
  orden: number;
  activo: boolean;
}

export interface ExtraVocalia {
  detalle: string;
  valor: number | null;
}

export interface CobroPartido {
  id?: number;
  partidoId: number;
  equipoId: number;
  campeonatoId: number;
  ligaId: number;
  jornada?: number;
  montoArbitraje: number;
  montoAporteLiga: number;
  montoPremios: number;
  montoFondoAccidentes: number;
  montoLimpieza: number;
  montoTarjetas: number;
  extrasJson?: ExtraVocalia[];
  total?: number;
  estado?: 'pendiente' | 'pagado' | 'no_presentado';
  creadoEn?: string;
  esHistorico?: boolean;
  equipo?: { id: number; nombre: string };
  recibo?: ReciboTesoreria;
}

export interface MovimientoTesoreria {
  id?: number;
  ligaId: number;
  campeonatoId?: number;
  equipoId?: number;
  tipo: 'ingreso' | 'egreso';
  categoria: string;
  descripcion?: string;
  monto: number;
  estado: 'pendiente' | 'pagado' | 'anulado';
  fechaVencimiento?: string;
  fechaPago?: string;
  comprobante?: string;
  origenAutomatico?: boolean;
  equipo?: { id: number; nombre: string };
  campeonato?: { id: number; nombre: string };
  creadoEn?: string;
  recibo?: ReciboTesoreria;
}

export interface EntradaLibroCaja {
  id: number;
  fecha: string;
  concepto: string;
  equipo: string | null;
  tipo: 'ingreso' | 'egreso';
  origen: 'vocalia' | 'manual' | 'saldo_inicial';
  monto: number;
  estado: string;
  referencia: string;
}

export interface ResumenCaja {
  inicioOperativo: InicioOperativoTesoreria | null;
  totalCobrosPartidoPagados: number;
  totalCobrosPartidoPendientes: number;
  totalIngresosManualesPagados: number;
  totalIngresosManualesPendientes: number;
  totalEgresos: number;
  saldo: number;
  resumenPorEquipo: Array<{
    equipo: string;
    cobrosPartido: number;
    ingresosManuales: number;
    pendienteTotal: number;
  }>;
}

export interface InicioOperativoTesoreria {
  id?: number;
  ligaId: number;
  campeonatoId: number;
  fechaInicio: string;
  saldoInicial: number;
  origenSaldo?: 'caja_nueva' | 'manual' | 'traslado';
  campeonatoOrigenId?: number | null;
  creadoEn?: string;
}

export interface PreviewCierreCaja {
  fechaDesde: string;
  fechaCorte: string;
  cierreAnteriorId: number | null;
  saldoBase: number;
  totalIngresos: number;
  totalEgresos: number;
  saldoEsperado: number;
}

export interface CierreCajaTesoreria extends PreviewCierreCaja {
  id: number;
  ligaId: number;
  campeonatoId: number;
  tipo: 'conciliacion' | 'cierre_definitivo';
  saldoContado: number;
  diferencia: number;
  observaciones?: string | null;
  creadoPorId?: number | null;
  creadoPor?: { id: number; nombre: string } | null;
  creadoEn: string;
}

export type OrigenDeuda = 'cobro_partido' | 'movimiento' | 'derrama' | 'garantia';

export interface DeudaConsolidada {
  clave: string;
  origen: OrigenDeuda;
  origenId: number;
  derramaId?: number;
  equipoId: number;
  equipo: string;
  campeonatoId: number | null;
  campeonato: string;
  concepto: string;
  fecha: string;
  montoTotal: number;
  montoAbonado: number;
  saldoPendiente: number;
  estado: string;
  modoPago: string;
  accion: 'pagar' | 'automatico';
  categoria?: string;
}

export interface ResumenDeudaEquipo {
  equipoId: number;
  equipo: string;
  cantidadObligaciones: number;
  cobrosPartido: number;
  movimientos: number;
  derramas: number;
  garantias: number;
  totalPendiente: number;
}

export interface CuentaConsolidada {
  items: DeudaConsolidada[];
  resumenEquipos: ResumenDeudaEquipo[];
  totalPendiente: number;
}

/**
 * Servicio de Tesorería
 * Maneja config de vocalía, cobros por partido y movimientos generales.
 */
@Injectable({ providedIn: 'root' })
export class TesoreriaService {
  private readonly base = `${environment.apiUrl}/tesoreria`;

  constructor(private http: HttpClient) {}

  // ── Config Vocalía ────────────────────────────────────────────────────────

  getConfigVocalia(ligaId: number): Observable<ConfigVocaliaItem[]> {
    return this.http.get<ConfigVocaliaItem[]>(`${this.base}/config-vocalia/${ligaId}`);
  }

  guardarConfigVocalia(ligaId: number, items: ConfigVocaliaItem[]): Observable<ConfigVocaliaItem[]> {
    const payload = items.map(({ nombre, monto, orden, activo }) => ({ nombre, monto: Number(monto), orden, activo }));
    return this.http.patch<ConfigVocaliaItem[]>(`${this.base}/config-vocalia/${ligaId}`, { items: payload });
  }

  // ── Cobros de Partido ─────────────────────────────────────────────────────

  guardarCobroPartido(cobro: CobroPartido): Observable<CobroPartido> {
    return this.http.post<CobroPartido>(`${this.base}/cobros-partido`, cobro);
  }

  getCobrosDePartido(partidoId: number): Observable<CobroPartido[]> {
    return this.http.get<CobroPartido[]>(`${this.base}/cobros-partido/partido/${partidoId}`);
  }

  listarCobrosPartido(filtros: {
    ligaId?: number;
    campeonatoId?: number;
    equipoId?: number;
    jornada?: number;
    estado?: string;
    incluirHistorial?: boolean;
  }): Observable<CobroPartido[]> {
    let params = new HttpParams();
    if (filtros.ligaId)       params = params.set('ligaId',       filtros.ligaId);
    if (filtros.campeonatoId) params = params.set('campeonatoId', filtros.campeonatoId);
    if (filtros.equipoId)     params = params.set('equipoId',     filtros.equipoId);
    if (filtros.jornada)      params = params.set('jornada',      filtros.jornada);
    if (filtros.estado)       params = params.set('estado',       filtros.estado);
    if (filtros.incluirHistorial) params = params.set('incluirHistorial', 'true');
    return this.http.get<CobroPartido[]>(`${this.base}/cobros-partido`, { params });
  }

  pagarCobroPartido(id: number, fechaPago?: string): Observable<CobroPartido> {
    return this.http.patch<CobroPartido>(`${this.base}/cobros-partido/${id}/pagar`, { fechaPago });
  }

  registrarNoPresentado(id: number, observaciones?: string): Observable<CobroPartido> {
    return this.http.patch<CobroPartido>(`${this.base}/cobros-partido/${id}/no-presentado`, { observaciones });
  }

  // ── Movimientos Generales ────────────────────────────────────────────────

  crearMovimiento(mov: Partial<MovimientoTesoreria>): Observable<MovimientoTesoreria> {
    return this.http.post<MovimientoTesoreria>(`${this.base}/movimientos`, mov);
  }

  listarMovimientos(filtros: {
    ligaId?: number;
    campeonatoId?: number;
    equipoId?: number;
    tipo?: string;
    categoria?: string;
    estado?: string;
  }): Observable<MovimientoTesoreria[]> {
    let params = new HttpParams();
    if (filtros.ligaId)       params = params.set('ligaId',       filtros.ligaId);
    if (filtros.campeonatoId) params = params.set('campeonatoId', filtros.campeonatoId);
    if (filtros.equipoId)     params = params.set('equipoId',     filtros.equipoId);
    if (filtros.tipo)         params = params.set('tipo',         filtros.tipo);
    if (filtros.categoria)    params = params.set('categoria',    filtros.categoria);
    if (filtros.estado)       params = params.set('estado',       filtros.estado);
    return this.http.get<MovimientoTesoreria[]>(`${this.base}/movimientos`, { params });
  }

  actualizarMovimiento(id: number, cambios: { estado?: string; fechaPago?: string; comprobante?: string; descripcion?: string }): Observable<MovimientoTesoreria> {
    return this.http.patch<MovimientoTesoreria>(`${this.base}/movimientos/${id}`, cambios);
  }

  // ── Cuenta consolidada por equipo ────────────────────────────────────────

  getDeudasConsolidadas(ligaId: number, equipoId?: number): Observable<CuentaConsolidada> {
    let params = new HttpParams().set('ligaId', ligaId);
    if (equipoId) params = params.set('equipoId', equipoId);
    return this.http.get<CuentaConsolidada>(`${this.base}/deudas`, { params });
  }

  // ── Libro de Caja ─────────────────────────────────────────────

  getLibroCaja(filtros: {
    ligaId?: number;
    campeonatoId?: number;
    fechaDesde?: string;
    fechaHasta?: string;
  }): Observable<EntradaLibroCaja[]> {
    let params = new HttpParams();
    if (filtros.ligaId)       params = params.set('ligaId',       filtros.ligaId);
    if (filtros.campeonatoId) params = params.set('campeonatoId', filtros.campeonatoId);
    if (filtros.fechaDesde)   params = params.set('fechaDesde',   filtros.fechaDesde);
    if (filtros.fechaHasta)   params = params.set('fechaHasta',   filtros.fechaHasta);
    return this.http.get<EntradaLibroCaja[]>(`${this.base}/libro-caja`, { params });
  }

  previsualizarCierre(
    ligaId: number,
    campeonatoId: number,
    fechaCorte: string,
  ): Observable<PreviewCierreCaja> {
    const params = new HttpParams()
      .set('ligaId', ligaId)
      .set('campeonatoId', campeonatoId)
      .set('fechaCorte', fechaCorte);
    return this.http.get<PreviewCierreCaja>(`${this.base}/cierres/preview`, { params });
  }

  listarCierres(ligaId: number, campeonatoId: number): Observable<CierreCajaTesoreria[]> {
    const params = new HttpParams()
      .set('ligaId', ligaId)
      .set('campeonatoId', campeonatoId);
    return this.http.get<CierreCajaTesoreria[]>(`${this.base}/cierres`, { params });
  }

  crearCierre(datos: {
    ligaId: number;
    campeonatoId: number;
    tipo: 'conciliacion' | 'cierre_definitivo';
    fechaCorte: string;
    saldoContado: number;
    observaciones?: string;
  }): Observable<CierreCajaTesoreria> {
    return this.http.post<CierreCajaTesoreria>(`${this.base}/cierres`, datos);
  }
  // ── Resumen de Caja ───────────────────────────────────────────────────────

  getResumenCaja(campeonatoId: number, ligaId: number): Observable<ResumenCaja> {
    const params = new HttpParams()
      .set('campeonatoId', campeonatoId)
      .set('ligaId', ligaId);
    return this.http.get<ResumenCaja>(`${this.base}/resumen`, { params });
  }

  getInicioOperativo(campeonatoId: number, ligaId: number): Observable<InicioOperativoTesoreria | null> {
    const params = new HttpParams()
      .set('campeonatoId', campeonatoId)
      .set('ligaId', ligaId);
    return this.http.get<InicioOperativoTesoreria | null>(`${this.base}/inicio-operativo`, { params });
  }

  iniciarOperacion(datos: Omit<InicioOperativoTesoreria, 'id' | 'creadoEn'>): Observable<InicioOperativoTesoreria> {
    return this.http.post<InicioOperativoTesoreria>(`${this.base}/inicio-operativo`, datos);
  }

  // ── Traslado de saldo ─────────────────────────────────────────────────────

  trasladarSaldo(campeonatoOrigenId: number, campeonatoDestinoId: number): Observable<{ mensaje: string; monto: number; movimientoId: number }> {
    return this.http.post<{ mensaje: string; monto: number; movimientoId: number }>(
      `${this.base}/trasladar-saldo`,
      { campeonatoOrigenId, campeonatoDestinoId },
    );
  }
}
