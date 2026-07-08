import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GarantiaEquipo {
  id: number;
  ligaId: number;
  equipoId: number;
  equipo: { id: number; nombre: string };
  monto: number;
  estado: 'pendiente' | 'pagada' | 'devuelta' | 'ejecutada';
  fechaPago: string | null;
  fechaResolucion: string | null;
  motivo: string | null;
  creadoEn: string;
}

export interface PrestamoFondo {
  id: number;
  ligaId: number;
  monto: number;
  motivo: string;
  estado: 'tomado' | 'devuelto';
  campeonatoId: number | null;
  fechaToma: string;
  fechaDevolucion: string | null;
  creadoEn: string;
}

export interface ResumenFondo {
  totalCustodiado: number;
  prestamosActivos: number;
  garantiasEjecutadas: number;
  fondoDisponible: number;
}

@Injectable({ providedIn: 'root' })
export class GarantiasService {
  private base = `${environment.apiUrl}/garantias`;

  constructor(private http: HttpClient) {}

  // ── Garantías individuales ─────────────────────────────────────────────

  crearGarantia(ligaId: number, equipoId: number, monto: number = 100): Observable<GarantiaEquipo> {
    return this.http.post<GarantiaEquipo>(this.base, { ligaId, equipoId, monto });
  }

  listarGarantias(ligaId: number): Observable<GarantiaEquipo[]> {
    const params = new HttpParams().set('ligaId', ligaId.toString());
    return this.http.get<GarantiaEquipo[]>(this.base, { params });
  }

  resumenFondo(ligaId: number): Observable<ResumenFondo> {
    const params = new HttpParams().set('ligaId', ligaId.toString());
    return this.http.get<ResumenFondo>(`${this.base}/resumen`, { params });
  }

  marcarPagada(id: number): Observable<GarantiaEquipo> {
    return this.http.patch<GarantiaEquipo>(`${this.base}/${id}/pagar`, {});
  }

  resolverGarantia(id: number, accion: 'devolver' | 'ejecutar', motivo: string, campeonatoId?: number): Observable<GarantiaEquipo> {
    return this.http.patch<GarantiaEquipo>(`${this.base}/${id}/resolver`, { accion, motivo, campeonatoId });
  }

  // ── Préstamos del fondo ────────────────────────────────────────────────

  crearPrestamo(ligaId: number, monto: number, motivo: string, campeonatoId?: number): Observable<PrestamoFondo> {
    return this.http.post<PrestamoFondo>(`${this.base}/prestamos`, { ligaId, monto, motivo, campeonatoId });
  }

  listarPrestamos(ligaId: number): Observable<PrestamoFondo[]> {
    const params = new HttpParams().set('ligaId', ligaId.toString());
    return this.http.get<PrestamoFondo[]>(`${this.base}/prestamos`, { params });
  }

  devolverPrestamo(id: number, campeonatoId?: number): Observable<PrestamoFondo> {
    return this.http.patch<PrestamoFondo>(`${this.base}/prestamos/${id}/devolver`, { campeonatoId: campeonatoId ?? null });
  }
}
