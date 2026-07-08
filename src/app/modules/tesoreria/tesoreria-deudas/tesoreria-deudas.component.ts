import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { DerramasService, DeudaDerrama } from '../../../core/services/derramas.service';
import { LigasService } from '../../../core/services/ligas.service';
import { EquiposService } from '../../../core/services/equipos.service';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';

@Component({
  selector: 'app-tesoreria-deudas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainNavComponent],
  templateUrl: './tesoreria-deudas.component.html',
  styleUrl: './tesoreria-deudas.component.scss',
})
export class TesoreriaDeudaComponent implements OnInit {
  user$: Observable<any>;

  // ── Filtros ──────────────────────────────────────────────────────────────
  ligas: any[]   = [];
  equipos: any[] = [];
  ligaId: number | null   = null;
  equipoId: number | null = null;

  // ── Datos ────────────────────────────────────────────────────────────────
  deudas: DeudaDerrama[] = [];
  loading = false;
  error   = '';

  constructor(
    private authService: AuthService,
    public permissions: PermissionsService,
    private derramasService: DerramasService,
    private ligasService: LigasService,
    private equiposService: EquiposService,
  ) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.cargarSelectores();
  }

  logout(): void { this.authService.logout(); }

  // ─────────────────────────────────────────────────────────────────────────
  // SELECTORES
  // ─────────────────────────────────────────────────────────────────────────

  private cargarSelectores(): void {
    this.ligasService.getAll().subscribe({
      next: (ligas) => {
        this.ligas = ligas;
        const user = this.authService.currentUserValue;
        if (user?.ligaId) {
          this.ligaId = user.ligaId;
          this.cargarEquipos(user.ligaId);
        }
      },
    });
  }

  cargarEquipos(ligaId: number): void {
    this.equiposService.getByLiga(ligaId).subscribe({
      next: (equipos) => {
        this.equipos  = equipos;
        this.equipoId = null;
        this.deudas   = [];
      },
    });
  }

  onLigaChange(): void {
    this.equipos  = [];
    this.equipoId = null;
    this.deudas   = [];
    if (this.ligaId) this.cargarEquipos(this.ligaId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CARGA DE DEUDAS
  // ─────────────────────────────────────────────────────────────────────────

  consultar(): void {
    if (!this.ligaId || !this.equipoId) return;
    this.loading = true;
    this.error   = '';
    this.derramasService.deudasEquipo(this.ligaId, this.equipoId).subscribe({
      next: (data) => {
        this.deudas  = data;
        this.loading = false;
      },
      error: (err) => {
        this.error   = err?.error?.message ?? 'Error al consultar deudas.';
        this.loading = false;
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  get totalDeuda(): number {
    return this.deudas.reduce((s, d) => s + d.saldoPendiente, 0);
  }

  get equipoSeleccionadoNombre(): string {
    return this.equipos.find(e => e.id === this.equipoId)?.nombre ?? '';
  }

  badgeEstado(estado: string): string {
    const map: Record<string, string> = {
      pendiente:  'badge-warning',
      parcial:    'badge-warning',
      arrastrado: 'badge-danger',
    };
    return map[estado] ?? 'badge-secondary';
  }

  etiquetaEstado(estado: string): string {
    const map: Record<string, string> = {
      pendiente:  'Pendiente',
      parcial:    'Parcial',
      arrastrado: 'Arrastrado',
    };
    return map[estado] ?? estado;
  }
}
