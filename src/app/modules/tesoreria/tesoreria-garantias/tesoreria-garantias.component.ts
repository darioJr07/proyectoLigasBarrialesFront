import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { GarantiasService, GarantiaEquipo, PrestamoFondo, ResumenFondo } from '../../../core/services/garantias.service';
import { EquiposService } from '../../../core/services/equipos.service';
import { CampeonatosService } from '../../campeonatos/campeonatos.service';
import { LigasService } from '../../../core/services/ligas.service';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tesoreria-garantias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainNavComponent],
  templateUrl: './tesoreria-garantias.component.html',
  styleUrl: './tesoreria-garantias.component.scss',
})
export class TesoreriaGarantiasComponent implements OnInit {
  user$: Observable<any>;

  // ── Selectores ─────────────────────────────────────────────────────────
  ligas: any[]       = [];
  campeonatos: any[] = [];
  equipos: any[]     = [];

  ligaId: number | null      = null;
  campeonatoId: number | null = null;

  // ── Datos ──────────────────────────────────────────────────────────────
  garantias: GarantiaEquipo[] = [];
  prestamos: PrestamoFondo[]  = [];
  resumen: ResumenFondo | null = null;

  loading        = false;
  error          = '';
  exito          = '';

  // ── Modal: nueva garantía ──────────────────────────────────────────────
  modalNuevaGarantia  = false;
  nuevaEquipoId: number | null = null;
  nuevaMonto          = 100;
  guardandoGarantia   = false;
  errorGarantia       = '';

  // ── Modal: resolver garantía (devolver / ejecutar) ─────────────────────
  modalResolver: GarantiaEquipo | null = null;
  resolverAccion: 'devolver' | 'ejecutar' = 'devolver';
  resolverMotivo      = '';
  resolverCampeonatoId: number | null = null;
  resolviendo         = false;
  errorResolver       = '';

  // ── Modal: nuevo préstamo ──────────────────────────────────────────────
  modalNuevoPrestamo  = false;
  prestamoMonto: number | null = null;
  prestamoMotivo      = '';
  prestamoCampeonatoId: number | null = null;
  guardandoPrestamo   = false;
  errorPrestamo       = '';

  // ── Modal: devolver préstamo ───────────────────────────────────────────
  modalDevolverPrestamo: PrestamoFondo | null = null;
  devolucionCampeonatoId: number | null = null;
  devolviendo         = false;
  errorDevolucion     = '';

  constructor(
    private authService: AuthService,
    public permissions: PermissionsService,
    private garantiasService: GarantiasService,
    private equiposService: EquiposService,
    private campeonatosService: CampeonatosService,
    private ligasService: LigasService,
    private router: Router,
  ) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.cargarSelectores();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private cargarSelectores(): void {
    this.ligasService.getAll().subscribe({
      next: (ligas) => {
        this.ligas = ligas;
        const user = this.authService.currentUserValue;
        if (user?.ligaId) {
          this.ligaId = user.ligaId;
          this.onLigaChange();
        }
      },
    });
  }

  onLigaChange(): void {
    this.campeonatos = [];
    this.equipos     = [];
    this.campeonatoId = null;
    this.garantias   = [];
    this.prestamos   = [];
    this.resumen     = null;

    if (!this.ligaId) return;

    this.campeonatosService.getByLiga(this.ligaId).subscribe({
      next: (c) => { this.campeonatos = c; },
    });
    this.equiposService.getByLiga(this.ligaId).subscribe({
      next: (e) => { this.equipos = e; },
    });
    this.cargarDatos();
  }

  cargarDatos(): void {
    if (!this.ligaId) return;
    this.loading = true;
    this.error   = '';

    this.garantiasService.resumenFondo(this.ligaId).subscribe({
      next: (r) => { this.resumen = r; },
      error: () => {},
    });

    this.garantiasService.listarGarantias(this.ligaId).subscribe({
      next: (g) => { this.garantias = g; },
      error: () => {},
    });

    this.garantiasService.listarPrestamos(this.ligaId).subscribe({
      next: (p) => {
        this.prestamos = p;
        this.loading   = false;
      },
      error: () => { this.loading = false; },
    });
  }

  // ── Equipos sin garantía activa ─────────────────────────────────────────
  get equiposSinGarantia(): any[] {
    const conGarantiaActiva = new Set(
      this.garantias
        .filter(g => g.estado === 'pendiente' || g.estado === 'pagada')
        .map(g => g.equipoId),
    );
    return this.equipos.filter(e => !conGarantiaActiva.has(e.id));
  }

  // ── MODAL: Nueva garantía ───────────────────────────────────────────────
  abrirModalNuevaGarantia(): void {
    this.nuevaEquipoId  = null;
    this.nuevaMonto     = 100;
    this.errorGarantia  = '';
    this.modalNuevaGarantia = true;
  }

  cerrarModalNuevaGarantia(): void {
    this.modalNuevaGarantia = false;
  }

  confirmarNuevaGarantia(): void {
    if (!this.nuevaEquipoId || !this.ligaId) {
      this.errorGarantia = 'Seleccione un equipo.';
      return;
    }
    if (!this.nuevaMonto || this.nuevaMonto <= 0) {
      this.errorGarantia = 'El monto debe ser mayor a 0.';
      return;
    }
    this.guardandoGarantia = true;
    this.errorGarantia     = '';

    this.garantiasService.crearGarantia(this.ligaId, this.nuevaEquipoId, this.nuevaMonto).subscribe({
      next: () => {
        this.guardandoGarantia  = false;
        this.modalNuevaGarantia = false;
        this.exito = 'Garantía registrada correctamente.';
        this.cargarDatos();
        setTimeout(() => { this.exito = ''; }, 4000);
      },
      error: (err) => {
        this.guardandoGarantia = false;
        this.errorGarantia = err?.error?.message ?? 'Error al registrar la garantía.';
      },
    });
  }

  // ── Acción rápida: marcar pagada ────────────────────────────────────────
  marcarPagada(garantia: GarantiaEquipo): void {
    this.garantiasService.marcarPagada(garantia.id).subscribe({
      next: () => {
        this.exito = `Garantía de ${garantia.equipo.nombre} marcada como pagada.`;
        this.cargarDatos();
        setTimeout(() => { this.exito = ''; }, 4000);
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Error al actualizar la garantía.';
      },
    });
  }

  // ── MODAL: Resolver garantía ────────────────────────────────────────────
  abrirModalResolver(garantia: GarantiaEquipo, accion: 'devolver' | 'ejecutar'): void {
    this.modalResolver       = garantia;
    this.resolverAccion      = accion;
    this.resolverMotivo      = '';
    this.resolverCampeonatoId = this.campeonatoId;
    this.errorResolver       = '';
  }

  cerrarModalResolver(): void {
    this.modalResolver = null;
  }

  confirmarResolver(): void {
    if (!this.modalResolver) return;
    if (!this.resolverMotivo.trim()) {
      this.errorResolver = 'El motivo es obligatorio.';
      return;
    }
    this.resolviendo   = true;
    this.errorResolver = '';

    this.garantiasService.resolverGarantia(
      this.modalResolver.id,
      this.resolverAccion,
      this.resolverMotivo,
      this.resolverCampeonatoId ?? undefined,
    ).subscribe({
      next: () => {
        this.resolviendo   = false;
        this.modalResolver = null;
        const accionLabel  = this.resolverAccion === 'ejecutar' ? 'ejecutada' : 'devuelta';
        this.exito = `Garantía ${accionLabel} correctamente. Se registró el movimiento en tesorería.`;
        this.cargarDatos();
        setTimeout(() => { this.exito = ''; }, 5000);
      },
      error: (err) => {
        this.resolviendo   = false;
        this.errorResolver = err?.error?.message ?? 'Error al resolver la garantía.';
      },
    });
  }

  // ── MODAL: Nuevo préstamo ───────────────────────────────────────────────
  abrirModalNuevoPrestamo(): void {
    this.prestamoMonto       = null;
    this.prestamoMotivo      = '';
    this.prestamoCampeonatoId = this.campeonatoId;
    this.errorPrestamo       = '';
    this.modalNuevoPrestamo  = true;
  }

  cerrarModalNuevoPrestamo(): void {
    this.modalNuevoPrestamo = false;
  }

  confirmarNuevoPrestamo(): void {
    if (!this.ligaId) return;
    if (!this.prestamoMonto || this.prestamoMonto <= 0) {
      this.errorPrestamo = 'Ingrese un monto válido.';
      return;
    }
    if (!this.prestamoMotivo.trim()) {
      this.errorPrestamo = 'El motivo es obligatorio.';
      return;
    }
    this.guardandoPrestamo = true;
    this.errorPrestamo     = '';

    this.garantiasService.crearPrestamo(
      this.ligaId,
      this.prestamoMonto,
      this.prestamoMotivo,
      this.prestamoCampeonatoId ?? undefined,
    ).subscribe({
      next: () => {
        this.guardandoPrestamo  = false;
        this.modalNuevoPrestamo = false;
        this.exito = `Préstamo de $${this.prestamoMonto?.toFixed(2)} registrado. Se creó el ingreso en tesorería.`;
        this.cargarDatos();
        setTimeout(() => { this.exito = ''; }, 5000);
      },
      error: (err) => {
        this.guardandoPrestamo = false;
        this.errorPrestamo = err?.error?.message ?? 'Error al registrar el préstamo.';
      },
    });
  }

  // ── MODAL: Devolver préstamo ────────────────────────────────────────────
  abrirModalDevolverPrestamo(prestamo: PrestamoFondo): void {
    this.modalDevolverPrestamo   = prestamo;
    this.devolucionCampeonatoId  = this.campeonatoId;
    this.errorDevolucion         = '';
  }

  cerrarModalDevolverPrestamo(): void {
    this.modalDevolverPrestamo = null;
  }

  confirmarDevolucionPrestamo(): void {
    if (!this.modalDevolverPrestamo) return;
    this.devolviendo    = true;
    this.errorDevolucion = '';

    this.garantiasService.devolverPrestamo(
      this.modalDevolverPrestamo.id,
      this.devolucionCampeonatoId ?? undefined,
    ).subscribe({
      next: () => {
        this.devolviendo           = false;
        this.modalDevolverPrestamo = null;
        this.exito = 'Préstamo marcado como devuelto. Se registró el egreso en tesorería.';
        this.cargarDatos();
        setTimeout(() => { this.exito = ''; }, 5000);
      },
      error: (err) => {
        this.devolviendo    = false;
        this.errorDevolucion = err?.error?.message ?? 'Error al devolver el préstamo.';
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  etiquetaEstadoGarantia(estado: string): string {
    const map: Record<string, string> = {
      pendiente: '⏳ Pendiente',
      pagada:    '✅ Pagada',
      devuelta:  '↩ Devuelta',
      ejecutada: '⚡ Ejecutada',
    };
    return map[estado] ?? estado;
  }

  etiquetaEstadoPrestamo(estado: string): string {
    return estado === 'tomado' ? '⏳ Tomado' : '✅ Devuelto';
  }
}
