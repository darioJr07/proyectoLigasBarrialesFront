import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FilaPosicion } from './tabla-posiciones.model';

export interface EtapaTablaDetalle {
  id: number | null;
  nombre: string;
  orden: number;
  formato: 'tabla_unica' | 'grupos_cruce_descansos';
  estado: 'pendiente' | 'actual' | 'finalizada';
  grupos: { id: number; nombre: string; orden: number }[];
}

@Injectable({
  providedIn: 'root',
})
export class TablaPosicionesService {
  private apiUrl = `${environment.apiUrl}/tabla-posiciones`;
  private partidosApiUrl = `${environment.apiUrl}/partidos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la tabla de posiciones calculada por el backend.
   * @param campeonatoId  ID del campeonato
   * @param categoriaId   ID de la categoría
   * @param etapa         Etapa (ej: 'primera_etapa', 'liguilla')
   */
  calcular(
    campeonatoId: number,
    categoriaId: number,
    etapa: string,
    grupoId?: number,
  ): Observable<FilaPosicion[]> {
    let params = new HttpParams()
      .set('campeonatoId', campeonatoId.toString())
      .set('categoriaId', categoriaId.toString())
      .set('etapa', etapa);
    if (grupoId !== undefined) params = params.set('grupoId', grupoId.toString());
    return this.http.get<FilaPosicion[]>(this.apiUrl, { params });
  }

  /**
   * Devuelve las etapas que existen en la BD para un campeonato/categoría.
   */
  getEtapas(campeonatoId: number, categoriaId: number): Observable<string[]> {
    const params = new HttpParams()
      .set('campeonatoId', campeonatoId.toString())
      .set('categoriaId', categoriaId.toString());
    return this.http.get<string[]>(`${this.partidosApiUrl}/etapas`, { params });
  }

  getEtapasDetalle(campeonatoId: number, categoriaId: number): Observable<EtapaTablaDetalle[]> {
    const params = new HttpParams()
      .set('campeonatoId', campeonatoId.toString())
      .set('categoriaId', categoriaId.toString());
    return this.http.get<EtapaTablaDetalle[]>(`${this.partidosApiUrl}/etapas/detalle`, { params });
  }
}
