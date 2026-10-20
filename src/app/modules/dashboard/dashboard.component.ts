import { Component } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { PermissionsService } from '@core/services/permissions.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  user$ = this.authService.currentUser$;
  resumen: any = null;
  moduloBloqueadoMensaje = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public permissions: PermissionsService,
    private http: HttpClient,
  ) {
    this.cargarResumen();
    this.route.queryParamMap.subscribe((params) => {
      const modulo = params.get('modulo_bloqueado');
      const nombres: Record<string, string> = {
        modulo_jugadores: 'Jugadores',
        modulo_inscripciones: 'Inscripciones y habilitaciones',
        modulo_transferencias: 'Transferencias',
      };
      this.moduloBloqueadoMensaje = modulo
        ? `El módulo de ${nombres[modulo] ?? 'gestión'} está temporalmente deshabilitado para dirigentes de equipo.`
        : '';
    });
  }

  private cargarResumen(): void { this.http.get<any>(`${environment.apiUrl}/dashboard/resumen`).subscribe({ next: r => this.resumen = r, error: () => this.resumen = null }); }

  logout(): void {
    this.authService.logout();
  }

  // Métodos para verificar permisos (usando el servicio centralizado)
  canAccessLigas(): boolean {
    return this.permissions.canAccessLigas();
  }

  canAccessEquipos(): boolean {
    return this.permissions.canAccessEquipos();
  }

  canAccessJugadores(): boolean {
    return this.permissions.canAccessJugadores();
  }

  canAccessUsuarios(): boolean {
    return this.permissions.canAccessUsuarios();
  }

  canAccessCampeonatos(): boolean {
    return this.permissions.canAccessCampeonatos();
  }

  canAccessCategorias(): boolean {
    return this.permissions.canAccessCategorias();
  }

  canAccessInscripciones(): boolean {
    return this.permissions.canAccessInscripciones();
  }

  canAccessJugadorCampeonatos(): boolean {
    return this.permissions.canAccessJugadorCampeonatos();
  }

  canAccessTransferencias(): boolean {
    return this.permissions.canAccessTransferencias();
  }

  canAccessPartidos(): boolean {
    return this.permissions.canAccessPartidos();
  }

  canAccessTesoreria(): boolean {
    return this.permissions.canAccessTesoreria();
  }
}
