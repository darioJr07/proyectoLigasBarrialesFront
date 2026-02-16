import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categoria, CreateCategoriaDto } from './categoria.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  private apiUrl = `${environment.apiUrl}/categorias`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.apiUrl);
  }

  getById(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/${id}`);
  }

  getByCampeonato(campeonatoId: number): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/campeonato/${campeonatoId}`);
  }

  create(categoria: CreateCategoriaDto): Observable<Categoria> {
    return this.http.post<Categoria>(this.apiUrl, categoria);
  }

  update(id: number, categoria: Partial<CreateCategoriaDto>): Observable<Categoria> {
    return this.http.patch<Categoria>(`${this.apiUrl}/${id}`, categoria);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
