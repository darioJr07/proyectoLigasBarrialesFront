import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { TesoreriaService, ResumenCaja } from '../../../core/services/tesoreria.service';
import { CampeonatosService } from '../../campeonatos/campeonatos.service';
import { LigasService } from '../../../core/services/ligas.service';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';

@Component({
  selector: 'app-tesoreria-resumen',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainNavComponent],
  templateUrl: './tesoreria-resumen.component.html',
  styleUrl: './tesoreria-resumen.component.scss',
})
export class TesoreriaResumenComponent implements OnInit {
  user$: Observable<any>;

  campeonatos: any[] = [];
  ligas: any[] = [];

  filtroCampeonatoId: number | null = null;
  filtroLigaId: number | null = null;

  resumen: ResumenCaja | null = null;
  loading = false;
  error = '';

  // ── Modal de traslado de saldo ──────────────────────────────────────────
  modalTraslado = false;
  campeonatoDestinoId: number | null = null;
  trasladando = false;
  errorTraslado = '';
  mensajeTraslado = '';

  constructor(
    private authService: AuthService,
    public permissions: PermissionsService,
    private tesoreriaService: TesoreriaService,
    private campeonatosService: CampeonatosService,
    private ligasService: LigasService,
  ) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.cargarSelectores();
  }

  private cargarSelectores(): void {
    this.ligasService.getAll().subscribe({
      next: (ligas) => {
        this.ligas = ligas;
        const user = this.authService.currentUserValue;
        if (user?.ligaId) {
          this.filtroLigaId = user.ligaId;
          this.cargarCampeonatos(user.ligaId);
        }
      },
      error: () => {},
    });
  }

  cargarCampeonatos(ligaId: number): void {
    this.campeonatosService.getByLiga(ligaId).subscribe({
      next: (camps) => {
        this.campeonatos = camps;
        if (camps.length > 0 && !this.filtroCampeonatoId) {
          this.filtroCampeonatoId = camps[0].id;
          this.cargarResumen();
        }
      },
      error: () => {},
    });
  }

  onLigaChange(): void {
    this.campeonatos = [];
    this.filtroCampeonatoId = null;
    this.resumen = null;
    if (this.filtroLigaId) {
      this.cargarCampeonatos(this.filtroLigaId);
    }
  }

  cargarResumen(): void {
    if (!this.filtroCampeonatoId || !this.filtroLigaId) { return; }
    this.loading = true;
    this.error   = '';
    this.mensajeTraslado = '';
    this.tesoreriaService.getResumenCaja(this.filtroCampeonatoId, this.filtroLigaId).subscribe({
      next: (r) => {
        this.resumen = r;
        this.loading = false;
      },
      error: (err) => {
        this.error   = err?.error?.message ?? 'Error al cargar el resumen';
        this.loading = false;
      },
    });
  }

  // ── Getters para el botón de traslado ────────────────────────────────────

  /** El campeonato actualmente seleccionado en el filtro */
  get campeonatoSeleccionado(): any {
    return this.campeonatos.find(c => c.id === this.filtroCampeonatoId) ?? null;
  }

  /** Campeonatos disponibles como destino: misma liga, distinto al origen, no cancelados */
  get campeonatosDestino(): any[] {
    return this.campeonatos.filter(
      c => c.id !== this.filtroCampeonatoId && c.estado !== 'cancelado',
    );
  }

  /** Muestra el botón si: campeonato finalizado + saldo > 0 */
  get puedeTrasldar(): boolean {
    return (
      this.campeonatoSeleccionado?.estado === 'finalizado' &&
      (this.resumen?.saldo ?? 0) > 0
    );
  }

  // ── Acciones del modal ────────────────────────────────────────────────────

  abrirModalTraslado(): void {
    this.campeonatoDestinoId = null;
    this.errorTraslado       = '';
    this.modalTraslado       = true;
  }

  cerrarModalTraslado(): void {
    this.modalTraslado = false;
    this.errorTraslado = '';
  }

  confirmarTraslado(): void {
    if (!this.filtroCampeonatoId || !this.campeonatoDestinoId) { return; }
    this.trasladando   = true;
    this.errorTraslado = '';
    this.tesoreriaService.trasladarSaldo(this.filtroCampeonatoId, this.campeonatoDestinoId).subscribe({
      next: (res) => {
        this.trasladando     = false;
        this.modalTraslado   = false;
        this.mensajeTraslado = res.mensaje;
        // Recargar el resumen para reflejar que ya no hay saldo trasladable
        this.cargarResumen();
      },
      error: (err) => {
        this.trasladando   = false;
        this.errorTraslado = err?.error?.message ?? 'Error al trasladar el saldo.';
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
