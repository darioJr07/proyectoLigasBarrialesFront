import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EquiposService } from '../../../core/services/equipos.service';
import { AuthService } from '../../../core/services/auth.service';import { PermissionsService } from '@core/services/permissions.service';import { Equipo } from '../../../core/models/equipo.model';

@Component({
  selector: 'app-equipos-list',
  templateUrl: './equipos-list.component.html',
  styleUrl: './equipos-list.component.scss'
})
export class EquiposListComponent implements OnInit {
  equipos: Equipo[] = [];
  loading = false;
  errorMessage = '';
  isMaster = false;
  user$ = this.authService.currentUser$;

  constructor(
    private equiposService: EquiposService,
    private authService: AuthService,
    private router: Router,
    public permissions: PermissionsService
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadEquipos();
  }

  checkUserRole(): void {
    const currentUser = this.authService.getCurrentUser();
    this.isMaster = currentUser?.rol?.nombre === 'master';
  }

  loadEquipos(): void {
    this.loading = true;
    this.errorMessage = '';

    const currentUser = this.authService.getCurrentUser();
    const rolNombre = currentUser?.rol?.nombre;

    // Verificar si el usuario tiene asignación según su rol
    if (rolNombre === 'directivo_liga' && !currentUser?.ligaId) {
      this.errorMessage = 'No tienes una liga asignada aún. Contacta al administrador.';
      this.loading = false;
      this.equipos = [];
      return;
    }

    if (rolNombre === 'dirigente_equipo' && !currentUser?.equipoId) {
      this.errorMessage = 'No tienes un equipo asignado aún. Contacta al administrador o directivo de liga.';
      this.loading = false;
      this.equipos = [];
      return;
    }

    this.equiposService.getAll().subscribe({
      next: (equipos) => {
        this.equipos = equipos;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al cargar los equipos';
        this.loading = false;
      },
    });
  }

  viewEquipo(id: number): void {
    this.router.navigate(['/equipos', id]);
  }

  editEquipo(id: number): void {
    this.router.navigate(['/equipos/edit', id]);
  }

  disableEquipo(equipo: Equipo): void {
    if (confirm(`¿Estás seguro de desactivar el equipo "${equipo.nombre}"?`)) {
      this.equiposService.delete(equipo.id).subscribe({
        next: () => {
          this.loadEquipos();
        },
        error: (error) => {
          alert(error.error?.message || 'Error al desactivar el equipo');
        },
      });
    }
  }

  deleteEquipoPermanently(equipo: Equipo): void {
    if (confirm(`⚠️ ¿Estás seguro de ELIMINAR PERMANENTEMENTE el equipo "${equipo.nombre}"? Esta acción no se puede deshacer.`)) {
      this.equiposService.deletePermanently(equipo.id).subscribe({
        next: (response) => {
          alert(response.message);
          this.loadEquipos();
        },
        error: (error) => {
          alert(error.error?.message || 'Error al eliminar el equipo permanentemente');
        },
      });
    }
  }

  createEquipo(): void {
    this.router.navigate(['/equipos/new']);
  }

  canCreateEquipo(): boolean {
    const currentUser = this.authService.getCurrentUser();
    const rolNombre = currentUser?.rol?.nombre;
    
    // Master puede crear siempre
    if (rolNombre === 'master') {
      return true;
    }
    
    // Directivo de liga solo si tiene liga asignada
    if (rolNombre === 'directivo_liga') {
      return !!currentUser?.ligaId;
    }
    
    return false;
  }

  logout(): void {
    this.authService.logout();
  }
}
