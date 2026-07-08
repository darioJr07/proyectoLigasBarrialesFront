import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Derrama {
  id?: number;
  ligaId: number;
  campeonatoId: number;
  descripcion: string;
  tipo: 'monetaria' | 'unidades';
  montoUnitario: number;
  estado: 'activa' | 'cerrada';
  creadoEn?: string;
  // Campos calculados que devuelve el backend al listar
  totalAsignado?: number;
  totalAbonado?: number;
  totalPendiente?: number;
  equipos?: DerramaEquipo[];
}

export interface DerramaEquipo {
  id?: number;
  derramaId: number;
  equipoId: number;
  equipo?: { id: number; nombre: string };
  campeonatoOrigenId?: number;
  campeonatoOrigen?: { id: number; nombre: string } | null;
  cantidad: number;
  montoTotal: number;
  montoAbonado: number;
  modoPago: 'inmediato' | 'por_vocalia';
  estado: 'pendiente' | 'parcial' | 'pagado' | 'arrastrado';
  observaciones?: string;
  creadoEn?: string;
}

/** Deuda de un equipo en derramas (vista consolidada) */
export interface DeudaDerrama {
  derramaEquipoId: number;
  derramaId: number;
  descripcion: string;
  campeonatoOrigen: string;
  montoTotal: number;
  montoAbonado: number;
  saldoPendiente: number;
  estado: 'pendiente' | 'parcial' | 'arrastrado';
  modoPago: 'inmediato' | 'por_vocalia';
}

/** Derrama pendiente de cobro en vocalía (acta de partido) */
export interface DerramaVocalia {
  derramaEquipoId: number;
  derramaId: number;
  descripcion: string;
  montoUnitario: number;
  saldoPendiente: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DerramasService {
  private base = `${environment.apiUrl}/derramas`;

  constructor(private http: HttpClient) {}

  /** Crea una nueva derrama */
  crear(data: {
    ligaId: number;
    campeonatoId: number;
    descripcion: string;
    tipo: 'monetaria' | 'unidades';
    montoUnitario: number;
  }): Observable<Derrama> {
    return this.http.post<Derrama>(this.base, data);
  }

  /** Lista derramas de un campeonato con resumen de cobros por equipo */
  listar(campeonatoId: number): Observable<Derrama[]> {
    const params = new HttpParams().set('campeonatoId', campeonatoId.toString());
    return this.http.get<Derrama[]>(this.base, { params });
  }

  /** Detalle completo de una derrama */
  detalle(id: number): Observable<Derrama> {
    return this.http.get<Derrama>(`${this.base}/${id}`);
  }

  /** Asigna equipos a una derrama en bloque */
  asignarEquipos(
    id: number,
    equipos: { equipoId: number; cantidad: number; modoPago: 'inmediato' | 'por_vocalia' }[],
  ): Observable<DerramaEquipo[]> {
    return this.http.post<DerramaEquipo[]>(`${this.base}/${id}/equipos`, { equipos });
  }

  /** Actualiza cantidad/modo_pago de un equipo individual */
  actualizarEquipo(
    derramaId: number,
    equipoId: number,
    data: Partial<{ cantidad: number; modoPago: 'inmediato' | 'por_vocalia'; observaciones: string }>,
  ): Observable<DerramaEquipo> {
    return this.http.patch<DerramaEquipo>(`${this.base}/${derramaId}/equipos/${equipoId}`, data);
  }

  /**
   * Divide la deuda pendiente de un equipo en N cuotas de vocalía.
   * Actualiza el montoUnitario de la derrama para que abonarVocalia
   * descuente solo 1/N del saldo en cada partido.
   */
  dividirCuotas(derramaId: number, equipoId: number, numeroCuotas: number): Observable<DerramaEquipo> {
    return this.http.patch<DerramaEquipo>(
      `${this.base}/${derramaId}/equipos/${equipoId}/dividir-cuotas`,
      { numeroCuotas },
    );
  }

  /** Registra un pago directo de un equipo */
  registrarPago(
    derramaId: number,
    equipoId: number,
    monto: number,
    campeonatoId?: number,
    observaciones?: string,
  ): Observable<DerramaEquipo> {
    const body: any = { monto };
    if (campeonatoId)  body.campeonatoId  = campeonatoId;
    if (observaciones) body.observaciones = observaciones;
    return this.http.post<DerramaEquipo>(`${this.base}/${derramaId}/equipos/${equipoId}/pago`, body);
  }

  /** Cierra una derrama (arrastra deudas al siguiente campeonato) */
  cerrar(id: number): Observable<Derrama> {
    return this.http.post<Derrama>(`${this.base}/${id}/cerrar`, {});
  }

  /** Deudas de derramas pendientes de un equipo en una liga */
  deudasEquipo(ligaId: number, equipoId: number): Observable<DeudaDerrama[]> {
    const params = new HttpParams()
      .set('ligaId', ligaId.toString())
      .set('equipoId', equipoId.toString());
    return this.http.get<DeudaDerrama[]>(`${this.base}/deudas`, { params });
  }

  /** Derramas por_vocalia activas de un equipo en un campeonato (para acta) */
  vocaliasActivas(campeonatoId: number, equipoId: number): Observable<DerramaVocalia[]> {
    const params = new HttpParams()
      .set('campeonatoId', campeonatoId.toString())
      .set('equipoId', equipoId.toString());
    return this.http.get<DerramaVocalia[]>(`${this.base}/vocalia`, { params });
  }
}
