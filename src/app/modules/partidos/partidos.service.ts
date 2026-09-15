import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Partido,
  CreatePartidoDto,
  UpdatePartidoDto,
  RegistrarResultadoDto,
  GenerarFixtureDto,
  GenerarFixtureResponse,
  CrearProgramacionSemanalDto,
  ProgramacionSemanal,
} from './partido.model';

@Injectable({
  providedIn: 'root',
})
export class PartidosService {
  private apiUrl = `${environment.apiUrl}/partidos`;

  constructor(private http: HttpClient) {}

  /** Lista todos los partidos (filtrado por rol en el backend) */
  getAll(): Observable<Partido[]> {
    return this.http.get<Partido[]>(this.apiUrl);
  }

  /** Lista partidos de un campeonato, opcionalmente filtrando por categoría y etapa */
  getByCampeonato(
    campeonatoId: number,
    categoriaId?: number,
    etapa?: string
  ): Observable<Partido[]> {
    let params = new HttpParams();
    if (categoriaId) params = params.set('categoriaId', categoriaId.toString());
    if (etapa) params = params.set('etapa', etapa);
    return this.http.get<Partido[]>(`${this.apiUrl}/campeonato/${campeonatoId}`, { params });
  }

  /** Lista partidos de una jornada específica */
  getByJornada(
    campeonatoId: number,
    categoriaId: number,
    jornada: number,
    etapa: string
  ): Observable<Partido[]> {
    const params = new HttpParams()
      .set('campeonatoId', campeonatoId.toString())
      .set('categoriaId', categoriaId.toString())
      .set('jornada', jornada.toString())
      .set('etapa', etapa);
    return this.http.get<Partido[]>(`${this.apiUrl}/jornada`, { params });
  }

  /** Detalle de un partido */
  getById(id: number): Observable<Partido> {
    return this.http.get<Partido>(`${this.apiUrl}/${id}`);
  }

  /** Crear partido individual */
  create(data: CreatePartidoDto): Observable<Partido> {
    return this.http.post<Partido>(this.apiUrl, data);
  }

  /** Generar fixture completo por round-robin */
  generarFixture(data: GenerarFixtureDto): Observable<GenerarFixtureResponse> {
    return this.http.post<GenerarFixtureResponse>(
      `${this.apiUrl}/generar-fixture`,
      data
    );
  }

  /** Actualizar datos del partido (fecha, hora, cancha, estado…) */
  update(id: number, data: UpdatePartidoDto): Observable<Partido> {
    return this.http.patch<Partido>(`${this.apiUrl}/${id}`, data);
  }

  /** Registrar resultado (goles, bonificaciones) */
  registrarResultado(id: number, data: RegistrarResultadoDto): Observable<Partido> {
    return this.http.patch<Partido>(`${this.apiUrl}/${id}/resultado`, data);
  }

  /** Eliminar partido individual (soft delete) */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Eliminar todo el fixture de un campeonato/categoría/etapa */
  eliminarFixture(
    campeonatoId: number,
    categoriaId: number,
    etapa: string
  ): Observable<{ eliminados: number }> {
    const params = new HttpParams()
      .set('campeonatoId', campeonatoId.toString())
      .set('categoriaId', categoriaId.toString())
      .set('etapa', etapa);
    return this.http.delete<{ eliminados: number }>(`${this.apiUrl}/fixture`, { params });
  }

  crearProgramacionSemanal(data: CrearProgramacionSemanalDto): Observable<ProgramacionSemanal> {
    return this.http.post<ProgramacionSemanal>(`${this.apiUrl}/programacion-semanal`, data);
  }
  obtenerProgramacionSemanal(id: number): Observable<ProgramacionSemanal> {
    return this.http.get<ProgramacionSemanal>(`${this.apiUrl}/programacion-semanal/${id}`);
  }
  obtenerProgramacionSemanalPendiente(campeonatoId: number, categoriaId: number | undefined, etapa: string, jornada: number): Observable<ProgramacionSemanal | null> {
    let params = new HttpParams().set('campeonatoId', campeonatoId).set('etapa', etapa).set('jornada', jornada);
    if (categoriaId) params = params.set('categoriaId', categoriaId);
    return this.http.get<ProgramacionSemanal | null>(`${this.apiUrl}/programacion-semanal/pendiente`, { params });
  }
  sacarBolilla(id: number, partidoId: number): Observable<{ bolilla: any; partido: Partido }> {
    return this.http.post<{ bolilla: any; partido: Partido }>(`${this.apiUrl}/programacion-semanal/${id}/sacar-bolilla/${partidoId}`, {});
  }
  confirmarProgramacionSemanal(id: number): Observable<ProgramacionSemanal> {
    return this.http.post<ProgramacionSemanal>(`${this.apiUrl}/programacion-semanal/${id}/confirmar`, {});
  }
  cancelarProgramacionSemanal(id: number): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/programacion-semanal/${id}/cancelar`, {});
  }
  liberarBolillaProgramacion(id: number, bolillaId: number): Observable<ProgramacionSemanal> {
    return this.http.post<ProgramacionSemanal>(`${this.apiUrl}/programacion-semanal/${id}/bolillas/${bolillaId}/liberar`, {});
  }
  asignarBolillaManual(id: number, partidoId: number, bolillaId: number): Observable<ProgramacionSemanal> {
    return this.http.post<ProgramacionSemanal>(`${this.apiUrl}/programacion-semanal/${id}/asignar-manual`, { partidoId, bolillaId });
  }
}
