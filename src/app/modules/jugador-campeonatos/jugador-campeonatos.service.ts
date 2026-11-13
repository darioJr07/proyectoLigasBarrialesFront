import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CambioDorsalEtapa,
  AntecedenteReingreso,
  CreateJugadorCampeonatoDto,
  JugadorCampeonato,
  OpcionesCambioDorsal,
  RegularizarReingresoDto,
  RegistrarCambioDorsalDto,
  ResumenReingreso,
} from './jugador-campeonato.model';

@Injectable({
  providedIn: 'root'
})
export class JugadorCampeonatosService {
  private apiUrl = `${environment.apiUrl}/jugador-campeonatos`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<JugadorCampeonato[]> {
    return this.http.get<JugadorCampeonato[]>(this.apiUrl);
  }

  getById(id: number): Observable<JugadorCampeonato> {
    return this.http.get<JugadorCampeonato>(`${this.apiUrl}/${id}`);
  }

  getByCampeonato(campeonatoId: number): Observable<JugadorCampeonato[]> {
    return this.http.get<JugadorCampeonato[]>(`${this.apiUrl}/campeonato/${campeonatoId}`);
  }

  getDisponiblesParaTransferencia(campeonatoId: number): Observable<JugadorCampeonato[]> {
    return this.http.get<JugadorCampeonato[]>(`${this.apiUrl}/campeonato/${campeonatoId}/disponibles-transferencia`);
  }

  getByCampeonatoAndEquipo(campeonatoId: number, equipoId: number): Observable<JugadorCampeonato[]> {
    return this.http.get<JugadorCampeonato[]>(`${this.apiUrl}/campeonato/${campeonatoId}/equipo/${equipoId}`);
  }

  getByJugador(jugadorId: number): Observable<JugadorCampeonato[]> {
    return this.http.get<JugadorCampeonato[]>(`${this.apiUrl}/jugador/${jugadorId}`);
  }

  getPendientes(): Observable<JugadorCampeonato[]> {
    return this.http.get<JugadorCampeonato[]>(`${this.apiUrl}/pendientes`);
  }

  getAntecedenteReingreso(
    jugadorId: number,
    campeonatoId: number,
    equipoId: number,
  ): Observable<AntecedenteReingreso> {
    return this.http.get<AntecedenteReingreso>(
      `${this.apiUrl}/jugador/${jugadorId}/antecedente-reingreso`,
      { params: { campeonatoId, equipoId } },
    );
  }

  getResumenReingreso(id: number): Observable<ResumenReingreso> {
    return this.http.get<ResumenReingreso>(`${this.apiUrl}/${id}/resumen-reingreso`);
  }

  regularizarReingreso(id: number, data: RegularizarReingresoDto): Observable<JugadorCampeonato> {
    return this.http.patch<JugadorCampeonato>(`${this.apiUrl}/${id}/regularizar-reingreso`, data);
  }

  create(data: CreateJugadorCampeonatoDto): Observable<JugadorCampeonato> {
    return this.http.post<JugadorCampeonato>(this.apiUrl, data);
  }

  update(id: number, data: Partial<CreateJugadorCampeonatoDto>): Observable<JugadorCampeonato> {
    return this.http.patch<JugadorCampeonato>(`${this.apiUrl}/${id}`, data);
  }

  aprobar(id: number, observaciones?: string): Observable<JugadorCampeonato> {
    return this.http.patch<JugadorCampeonato>(`${this.apiUrl}/${id}/aprobar`, { observaciones });
  }

  rechazar(id: number, observaciones: string): Observable<JugadorCampeonato> {
    return this.http.patch<JugadorCampeonato>(`${this.apiUrl}/${id}/rechazar`, { observaciones });
  }

  darDeBaja(id: number, motivo: string, referencia?: string): Observable<JugadorCampeonato> {
    return this.http.patch<JugadorCampeonato>(`${this.apiUrl}/${id}/dar-de-baja`, { motivo, referencia });
  }

  getOpcionesCambioDorsal(id: number): Observable<OpcionesCambioDorsal> {
    return this.http.get<OpcionesCambioDorsal>(`${this.apiUrl}/${id}/cambios-dorsal/opciones`);
  }

  registrarCambioDorsal(id: number, data: RegistrarCambioDorsalDto): Observable<CambioDorsalEtapa> {
    return this.http.post<CambioDorsalEtapa>(`${this.apiUrl}/${id}/cambios-dorsal`, data);
  }

  anularCambioDorsal(id: number, cambioId: number, motivo: string): Observable<CambioDorsalEtapa> {
    return this.http.patch<CambioDorsalEtapa>(
      `${this.apiUrl}/${id}/cambios-dorsal/${cambioId}/anular`,
      { motivo },
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
