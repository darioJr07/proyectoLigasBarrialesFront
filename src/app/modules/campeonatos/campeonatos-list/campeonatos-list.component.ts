import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { CampeonatosService } from '../campeonatos.service';
import { Campeonato } from '../campeonato.model';
import { PermissionsService } from '../../../core/services/permissions.service';
import { AuthService } from '../../../core/services/auth.service';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';

@Component({
  selector: 'app-campeonatos-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MainNavComponent],
  templateUrl: './campeonatos-list.component.html',
  styleUrl: './campeonatos-list.component.scss'
})
export class CampeonatosListComponent implements OnInit {
  campeonatos: Campeonato[] = [];
  loading = false;
  errorMessage = '';
  user$: Observable<any>;

  constructor(
    private campeonatosService: CampeonatosService,
    private router: Router,
    private authService: AuthService,
    public permissions: PermissionsService
  ) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.loadCampeonatos();
  }

  loadCampeonatos(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.campeonatosService.getAll().subscribe({
      next: (data: Campeonato[]) => {
        this.campeonatos = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMessage = 'Error al cargar campeonatos';
        this.loading = false;
        console.error('Error:', err);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  verCategorias(campeonatoId: number): void {
    this.router.navigate(['/categorias'], { queryParams: { campeonatoId } });
  }

  verInscripciones(campeonatoId: number): void {
    this.router.navigate(['/inscripciones'], { queryParams: { campeonatoId } });
  }

  editarCampeonato(id: number): void {
    this.router.navigate(['/campeonatos/editar', id]);
  }

  cambiarEstado(campeonato: Campeonato, nuevoEstado: string): void {
    if (confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) {
      this.campeonatosService.cambiarEstado(campeonato.id, nuevoEstado).subscribe({
        next: () => {
          this.loadCampeonatos();
        },
        error: (err: any) => {
          this.errorMessage = 'Error al cambiar estado: ' + (err.error?.message || 'Error desconocido');
          console.error('Error:', err);
        }
      });
    }
  }

  eliminarCampeonato(id: number): void {
    if (confirm('¿Estás seguro de deshabilitar este campeonato?')) {
      this.campeonatosService.delete(id).subscribe({
        next: () => {
          this.loadCampeonatos();
        },
        error: (err: any) => {
          this.errorMessage = 'Error al eliminar: ' + (err.error?.message || 'Error desconocido');
          console.error('Error:', err);
        }
      });
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'inscripcion_abierta':
        return 'badge-success';
      case 'en_curso':
        return 'badge-primary';
      case 'finalizado':
        return 'badge-secondary';
      case 'cancelado':
        return 'badge-danger';
      default:
        return '';
    }
  }

  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'inscripcion_abierta':
        return 'Inscripción Abierta';
      case 'en_curso':
        return 'En Curso';
      case 'finalizado':
        return 'Finalizado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return estado;
    }
  }

  canCreate(): boolean {
    return this.permissions.hasRole(['master', 'directivo_liga']);
  }

  canEdit(): boolean {
    return this.permissions.hasRole(['master', 'directivo_liga']);
  }
}
