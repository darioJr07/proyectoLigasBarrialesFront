import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LigaPublica {
  id: number;
  nombre: string;
  ubicacion: string;
  imagen?: string | null;
}

export interface CampeonatoPublico {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'en_curso';
}

export interface CategoriaPublica { id: number; nombre: string; orden: number; }
export interface FilaPosicionPublica {
  posicion: number; equipoId: number; equipoNombre: string; equipoImagen?: string | null;
  pj: number; pg: number; pe: number; pp: number; gf: number; gc: number; dg: number; puntos: number; tieneSancion: boolean;
}
export interface PartidoPublico {
  id: number; jornada: number; fechaPartido?: string | null; horaPartido?: string | null; cancha?: string | null;
  estado: 'programado' | 'en_juego' | 'jugado' | 'suspendido'; golesLocal?: number | null; golesVisitante?: number | null;
  equipoLocal: { id: number; nombre: string; imagen?: string | null } | null;
  equipoVisitante: { id: number; nombre: string; imagen?: string | null } | null;
}
export interface PartidoDestacadoPublico extends PartidoPublico { categoriaNombre: string; campeonatoNombre: string; }
export interface GoleadorPublico { posicion: number; jugadorNombre: string; jugadorImagen?: string | null; numeroCancha?: number | null; equipoNombre: string; equipoImagen?: string | null; total: number; }
export interface SancionPublica {
  id: number; destino: 'jugador' | 'equipo' | 'barra' | 'directivo'; sancionado: string;
  jugadorImagen?: string | null;
  equipo: { id: number; nombre: string; imagen?: string | null } | null; tipo: string;
  partidosPendientes?: number | null; fechaFinSuspension?: string | null;
}

/** Servicio exclusivo del portal público; solo consume rutas de lectura abiertas. */
@Injectable({ providedIn: 'root' })
export class PublicoService {
  private readonly apiUrl = `${environment.apiUrl}/publico`;

  constructor(private readonly http: HttpClient) {}

  listarLigas(): Observable<LigaPublica[]> {
    return this.http.get<LigaPublica[]>(`${this.apiUrl}/ligas`);
  }

  listarCampeonatos(ligaId: number): Observable<CampeonatoPublico[]> {
    return this.http.get<CampeonatoPublico[]>(`${this.apiUrl}/ligas/${ligaId}/campeonatos`);
  }

  listarPartidosDestacados(ligaId: number): Observable<PartidoDestacadoPublico[]> {
    return this.http.get<PartidoDestacadoPublico[]>(`${this.apiUrl}/ligas/${ligaId}/partidos-destacados`);
  }

  listarCategorias(campeonatoId: number): Observable<CategoriaPublica[]> {
    return this.http.get<CategoriaPublica[]>(`${this.apiUrl}/campeonatos/${campeonatoId}/categorias`);
  }

  listarEtapas(campeonatoId: number, categoriaId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/partidos/etapas`, { params: { campeonatoId, categoriaId } });
  }

  consultarPosiciones(campeonatoId: number, categoriaId: number, etapa: string): Observable<FilaPosicionPublica[]> {
    return this.http.get<FilaPosicionPublica[]>(`${this.apiUrl}/posiciones`, { params: { campeonatoId, categoriaId, etapa } });
  }

  listarJornadas(campeonatoId: number, categoriaId: number, etapa: string): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/partidos/jornadas`, { params: { campeonatoId, categoriaId, etapa } });
  }

  listarPartidos(campeonatoId: number, categoriaId: number, etapa: string, jornada: number): Observable<PartidoPublico[]> {
    return this.http.get<PartidoPublico[]>(`${this.apiUrl}/partidos`, { params: { campeonatoId, categoriaId, etapa, jornada } });
  }

  listarGoleadores(campeonatoId: number, categoriaId: number): Observable<GoleadorPublico[]> {
    return this.http.get<GoleadorPublico[]>(`${this.apiUrl}/goleadores`, { params: { campeonatoId, categoriaId } });
  }

  listarSanciones(campeonatoId: number): Observable<SancionPublica[]> {
    return this.http.get<SancionPublica[]>(`${this.apiUrl}/sanciones`, { params: { campeonatoId } });
  }
}
