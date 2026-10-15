import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type OrigenReciboTesoreria =
  | 'cobro_partido'
  | 'movimiento'
  | 'derrama'
  | 'garantia';

export interface ReciboTesoreria {
  id: number;
  ligaId: number;
  liga?: { id: number; nombre: string };
  campeonatoId: number | null;
  campeonato?: { id: number; nombre: string } | null;
  equipoId: number;
  equipo?: { id: number; nombre: string };
  numero: string;
  anio: number;
  secuencial: number;
  origen: OrigenReciboTesoreria;
  origenId: number;
  movimientoId: number | null;
  concepto: string;
  monto: number;
  fechaPago: string;
  estado: 'emitido' | 'anulado';
  emitidoPorId: number | null;
  emitidoPor?: { id: number; nombre: string } | null;
  creadoEn: string;
}

@Injectable({ providedIn: 'root' })
export class RecibosTesoreriaService {
  private readonly base = `${environment.apiUrl}/recibos-tesoreria`;

  constructor(private http: HttpClient) {}

  listar(ligaId: number, equipoId?: number, campeonatoId?: number): Observable<ReciboTesoreria[]> {
    let params = new HttpParams().set('ligaId', ligaId);
    if (equipoId) params = params.set('equipoId', equipoId);
    if (campeonatoId) params = params.set('campeonatoId', campeonatoId);
    return this.http.get<ReciboTesoreria[]>(this.base, { params });
  }

  obtener(id: number): Observable<ReciboTesoreria> {
    return this.http.get<ReciboTesoreria>(`${this.base}/${id}`);
  }
}
