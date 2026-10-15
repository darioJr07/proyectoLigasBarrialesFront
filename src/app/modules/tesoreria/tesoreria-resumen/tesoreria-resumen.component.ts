import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import {
  InicioOperativoTesoreria,
  CierreCajaTesoreria,
  TesoreriaService,
  ResumenCaja,
} from '../../../core/services/tesoreria.service';
import { CampeonatosService } from '../../campeonatos/campeonatos.service';
import { LigasService } from '../../../core/services/ligas.service';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';
import { TesoreriaNavComponent } from '../../../shared/components/tesoreria-nav/tesoreria-nav.component';

@Component({
  selector: 'app-tesoreria-resumen',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainNavComponent, TesoreriaNavComponent],
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
  inicioOperativo: InicioOperativoTesoreria | null = null;
  cierreDefinitivo: CierreCajaTesoreria | null = null;
  loading = false;
  error = '';

  modalInicio = false;
  fechaInicio = '';
  saldoInicial: number | null = null;
  origenSaldo: 'caja_nueva' | 'manual' | 'traslado' = 'caja_nueva';
  campeonatoOrigenId: number | null = null;
  iniciandoOperacion = false;
  errorInicio = '';
  mensajeInicio = '';

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
    this.inicioOperativo = null;
    this.cierreDefinitivo = null;
    if (this.filtroLigaId) {
      this.cargarCampeonatos(this.filtroLigaId);
    }
  }

  cargarResumen(): void {
    if (!this.filtroCampeonatoId || !this.filtroLigaId) { return; }
    this.loading = true;
    this.error   = '';
    this.inicioOperativo = null;
    this.cierreDefinitivo = null;
    this.mensajeTraslado = '';
    this.mensajeInicio = '';
    this.tesoreriaService.getResumenCaja(this.filtroCampeonatoId, this.filtroLigaId).subscribe({
      next: (r) => {
        this.resumen = r;
        this.inicioOperativo = r.inicioOperativo;
        this.cargarCierreDefinitivo();
        this.loading = false;
      },
      error: (err) => {
        this.error   = err?.error?.message ?? 'Error al cargar el resumen';
        this.loading = false;
      },
    });
  }

  abrirModalInicio(): void {
    this.fechaInicio = new Date().toISOString().slice(0, 10);
    this.saldoInicial = null;
    this.origenSaldo = 'caja_nueva';
    this.campeonatoOrigenId = null;
    this.errorInicio = '';
    this.modalInicio = true;
  }

  cerrarModalInicio(): void {
    if (this.iniciandoOperacion) return;
    this.modalInicio = false;
    this.errorInicio = '';
  }

  confirmarInicioOperacion(): void {
    if (!this.filtroLigaId || !this.filtroCampeonatoId || !this.fechaInicio) {
      this.errorInicio = 'Indique la fecha de inicio operativo.';
      return;
    }
    if (this.origenSaldo === 'manual' && (this.saldoInicial === null || Number(this.saldoInicial) < 0)) {
      this.errorInicio = 'El saldo inicial no puede ser negativo.';
      return;
    }
    if (this.origenSaldo === 'traslado' && !this.campeonatoOrigenId) {
      this.errorInicio = 'Seleccione el campeonato finalizado del que se recibirá el saldo.';
      return;
    }

    this.iniciandoOperacion = true;
    this.errorInicio = '';
    this.tesoreriaService.iniciarOperacion({
      ligaId: this.filtroLigaId,
      campeonatoId: this.filtroCampeonatoId,
      fechaInicio: this.fechaInicio,
      saldoInicial: this.origenSaldo === 'manual' ? Number(this.saldoInicial) : 0,
      origenSaldo: this.origenSaldo,
      campeonatoOrigenId: this.origenSaldo === 'traslado' ? this.campeonatoOrigenId : null,
    }).subscribe({
      next: () => {
        this.iniciandoOperacion = false;
        this.modalInicio = false;
        this.cargarResumen();
        this.mensajeInicio = this.origenSaldo === 'traslado'
          ? 'Control iniciado y saldo del campeonato anterior trasladado correctamente.'
          : 'Control de caja iniciado correctamente.';
      },
      error: (err) => {
        this.iniciandoOperacion = false;
        this.errorInicio = err?.error?.message ?? 'No se pudo iniciar el control de caja.';
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

  get campeonatosOrigenSaldo(): any[] {
    return this.campeonatos.filter(
      c => c.id !== this.filtroCampeonatoId && c.estado === 'finalizado',
    );
  }

  /** Muestra el botón si: campeonato finalizado + saldo > 0 */
  get puedeTrasldar(): boolean {
    return (
      this.campeonatoSeleccionado?.estado === 'finalizado' &&
      Number(this.cierreDefinitivo?.saldoContado ?? 0) > 0
    );
  }

  private cargarCierreDefinitivo(): void {
    if (!this.filtroLigaId || !this.filtroCampeonatoId) return;
    this.tesoreriaService.listarCierres(this.filtroLigaId, this.filtroCampeonatoId).subscribe({
      next: (cierres) => {
        this.cierreDefinitivo = cierres.find((cierre) => cierre.tipo === 'cierre_definitivo') ?? null;
      },
      error: () => { this.cierreDefinitivo = null; },
    });
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
