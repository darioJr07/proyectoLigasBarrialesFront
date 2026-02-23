import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LigasService } from '../../../core/services/ligas.service';
import { AuthService } from '../../../core/services/auth.service';import { PermissionsService } from '@core/services/permissions.service';import { Liga } from '../../../core/models/liga.model';

@Component({
  selector: 'app-ligas-list',
  templateUrl: './ligas-list.component.html',
  styleUrls: ['./ligas-list.component.scss'],
})
export class LigasListComponent implements OnInit {
  ligas: Liga[] = [];
  filteredLigas: Liga[] = [];
  loading = false;
  errorMessage = '';
  isMaster = false;
  searchTerm: string = '';
  selectedStatus: string = '';
  user$ = this.authService.currentUser$;

  constructor(
    private ligasService: LigasService,
    private authService: AuthService,
    private router: Router,
    public permissions: PermissionsService
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadLigas();
  }

  checkUserRole(): void {
    const currentUser = this.authService.getCurrentUser();
    this.isMaster = currentUser?.rol?.nombre === 'master';
  }

  loadLigas(): void {
    this.loading = true;
    this.errorMessage = '';

    const currentUser = this.authService.getCurrentUser();
    const rolNombre = currentUser?.rol?.nombre;

    // Verificar si el usuario directivo tiene liga asignada
    if (rolNombre === 'directivo_liga' && !currentUser?.ligaId) {
      this.errorMessage = 'No tienes una liga asignada aún. Contacta al administrador del sistema.';
      this.loading = false;
      this.ligas = [];
      return;
    }

    this.ligasService.getAll().subscribe({
      next: (ligas) => {
        this.ligas = ligas;
        this.filteredLigas = ligas;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al cargar las ligas';
        this.loading = false;
      },
    });
  }

  viewLiga(id: number): void {
    this.router.navigate(['/ligas', id]);
  }

  editLiga(id: number): void {
    this.router.navigate(['/ligas', id, 'editar']);
  }

  disableLiga(liga: Liga): void {
    if (confirm(`¿Estás seguro de desactivar la liga "${liga.nombre}"?`)) {
      this.ligasService.delete(liga.id).subscribe({
        next: () => {
          this.loadLigas();
        },
        error: (error) => {
          alert(error.error?.message || 'Error al desactivar la liga');
        },
      });
    }
  }

  deleteLigaPermanently(liga: Liga): void {
    if (confirm(`⚠️ ¿Estás seguro de ELIMINAR PERMANENTEMENTE la liga "${liga.nombre}"? Esta acción no se puede deshacer.`)) {
      this.ligasService.deletePermanently(liga.id).subscribe({
        next: (response) => {
          alert(response.message);
          this.loadLigas();
        },
        error: (error) => {
          alert(error.error?.message || 'Error al eliminar la liga permanentemente');
        },
      });
    }
  }

  createLiga(): void {
    this.router.navigate(['/ligas/nueva']);
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = this.ligas;

    // Filtrar por estado (activa/inactiva)
    if (this.selectedStatus === 'activa') {
      filtered = filtered.filter(liga => liga.activo);
    } else if (this.selectedStatus === 'inactiva') {
      filtered = filtered.filter(liga => !liga.activo);
    }

    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(liga =>
        liga.nombre.toLowerCase().includes(term) ||
        liga.ubicacion?.toLowerCase().includes(term) ||
        liga.directivo?.nombre?.toLowerCase().includes(term)
      );
    }

    this.filteredLigas = filtered;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.filteredLigas = this.ligas;
  }

  canShowFilters(): boolean {
    return this.isMaster;
  }

  logout(): void {
    this.authService.logout();
  }
}
