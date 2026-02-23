import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { CampeonatosService } from '../campeonatos.service';
import { Campeonato } from '../campeonato.model';
import { LigasService } from '../../../core/services/ligas.service';
import { Liga } from '../../../core/models/liga.model';
import { PermissionsService } from '../../../core/services/permissions.service';
import { AuthService } from '../../../core/services/auth.service';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';

@Component({
  selector: 'app-campeonatos-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainNavComponent],
  templateUrl: './campeonatos-list.component.html',
  styleUrl: './campeonatos-list.component.scss'
})
export class CampeonatosListComponent implements OnInit {
  campeonatos: Campeonato[] = [];
  filteredCampeonatos: Campeonato[] = [];
  ligas: Liga[] = [];
  loading = false;
  errorMessage = '';
  searchTerm: string = '';
  selectedLigaId: string = '';
  selectedEstado: string = '';
  isMaster = false;
  user$: Observable<any>;

  constructor(
    private campeonatosService: CampeonatosService,
    private ligasService: LigasService,
    private router: Router,
    private authService: AuthService,
    public permissions: PermissionsService
  ) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.checkUserRole();
    this.loadLigas();
    this.loadCampeonatos();
  }

  checkUserRole(): void {
    const currentUser = this.authService.getCurrentUser();
    this.isMaster = currentUser?.rol?.nombre === 'master';
  }

  loadCampeonatos(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.campeonatosService.getAll().subscribe({
      next: (data: Campeonato[]) => {
        this.campeonatos = data;
        this.filteredCampeonatos = data;
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

  loadLigas(): void {
    // Solo cargar ligas para master
    if (!this.isMaster) {
      return;
    }

    this.ligasService.getAll().subscribe({
      next: (ligas) => {
        this.ligas = ligas.filter(liga => liga.activo);
      },
      error: (error) => {
        console.error('Error loading ligas:', error);
      }
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onLigaChange(): void {
    this.applyFilters();
  }

  onEstadoChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = this.campeonatos;

    // Filtrar por liga (solo para master)
    if (this.selectedLigaId) {
      const ligaId = Number(this.selectedLigaId);
      filtered = filtered.filter(campeonato => campeonato.liga?.id === ligaId);
    }

    // Filtrar por estado
    if (this.selectedEstado) {
      filtered = filtered.filter(campeonato => campeonato.estado === this.selectedEstado);
    }

    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter((campeonato) => {
        const nombre = campeonato.nombre?.toLowerCase() || '';
        const descripcion = campeonato.descripcion?.toLowerCase() || '';
        const liga = campeonato.liga?.nombre?.toLowerCase() || '';
        
        return (
          nombre.includes(searchLower) ||
          descripcion.includes(searchLower) ||
          liga.includes(searchLower)
        );
      });
    }

    this.filteredCampeonatos = filtered;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedLigaId = '';
    this.selectedEstado = '';
    this.filteredCampeonatos = this.campeonatos;
  }

  canShowFilters(): boolean {
    const currentUser = this.authService.getCurrentUser();
    const rolNombre = currentUser?.rol?.nombre;
    return rolNombre === 'master' || rolNombre === 'directivo_liga';
  }
}
