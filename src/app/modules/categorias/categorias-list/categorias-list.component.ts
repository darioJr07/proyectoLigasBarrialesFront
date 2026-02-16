import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { CategoriasService } from '../categorias.service';
import { Categoria } from '../categoria.model';
import { PermissionsService } from '../../../core/services/permissions.service';
import { AuthService } from '../../../core/services/auth.service';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';

@Component({
  selector: 'app-categorias-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MainNavComponent],
  templateUrl: './categorias-list.component.html',
  styleUrl: './categorias-list.component.scss'
})
export class CategoriasListComponent implements OnInit {
  categorias: Categoria[] = [];
  loading = false;
  errorMessage = '';
  campeonatoId: number = 0;
  campeonatoNombre = '';
  user$: Observable<any>;

  constructor(
    private categoriasService: CategoriasService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public permissions: PermissionsService
  ) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.campeonatoId = Number(this.route.snapshot.queryParamMap.get('campeonatoId'));
    this.campeonatoNombre = this.route.snapshot.queryParamMap.get('nombre') || '';
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.categoriasService.getByCampeonato(this.campeonatoId).subscribe({
      next: (data) => {
        this.categorias = data.sort((a, b) => a.orden - b.orden);
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar las categorías';
        console.error(err);
        this.loading = false;
      }
    });
  }

  verInscripciones(categoriaId: number): void {
    this.router.navigate(['/inscripciones'], {
      queryParams: { campeonatoId: this.campeonatoId, categoriaId }
    });
  }

  editarCategoria(id: number): void {
    this.router.navigate(['/categorias/editar', id], {
      queryParams: { campeonatoId: this.campeonatoId }
    });
  }

  eliminarCategoria(id: number): void {
    if (confirm('¿Está seguro de deshabilitar esta categoría?')) {
      this.categoriasService.delete(id).subscribe({
        next: () => {
          this.cargarCategorias();
        },
        error: (err) => {
          this.errorMessage = 'Error al eliminar la categoría';
          console.error(err);
        }
      });
    }
  }

  canEdit(): boolean {
    return this.permissions.canEditCategoria();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  canCreate(): boolean {
    return this.permissions.hasRole(['master', 'directivo_liga']);
  }

  nuevaCategoria(): void {
    this.router.navigate(['/categorias/nuevo'], {
      queryParams: { campeonatoId: this.campeonatoId }
    });
  }
}
