import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Campeonato, CreateCampeonatoDto } from './campeonato.model';

@Injectable({
  providedIn: 'root'
})
export class CampeonatosService {
  private apiUrl = `${environment.apiUrl}/campeonatos`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Campeonato[]> {
    return this.http.get<Campeonato[]>(this.apiUrl);
  }

  getById(id: number): Observable<Campeonato> {
    return this.http.get<Campeonato>(`${this.apiUrl}/${id}`);
  }

  getByLiga(ligaId: number): Observable<Campeonato[]> {
    return this.http.get<Campeonato[]>(`${this.apiUrl}/liga/${ligaId}`);
  }

  create(campeonato: CreateCampeonatoDto): Observable<Campeonato> {
    return this.http.post<Campeonato>(this.apiUrl, campeonato);
  }

  update(id: number, campeonato: Partial<CreateCampeonatoDto>): Observable<Campeonato> {
    return this.http.patch<Campeonato>(`${this.apiUrl}/${id}`, campeonato);
  }

  cambiarEstado(id: number, estado: string): Observable<Campeonato> {
    return this.http.patch<Campeonato>(`${this.apiUrl}/${id}/estado`, { estado });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
