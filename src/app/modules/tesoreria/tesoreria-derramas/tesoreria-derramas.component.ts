import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { DerramasService, Derrama, DerramaEquipo } from '../../../core/services/derramas.service';
import { CampeonatosService } from '../../campeonatos/campeonatos.service';
import { LigasService } from '../../../core/services/ligas.service';
import { EquiposService } from '../../../core/services/equipos.service';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';

@Component({
  selector: 'app-tesoreria-derramas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainNavComponent],
  templateUrl: './tesoreria-derramas.component.html',
  styleUrl: './tesoreria-derramas.component.scss',
})
export class TesoreriaDerrmasComponent implements OnInit {
  user$: Observable<any>;

  // ── Filtros ──────────────────────────────────────────────────────────────
  ligas: any[]        = [];
  campeonatos: any[]  = [];
  equipos: any[]      = [];
  ligaId: number | null       = null;
  campeonatoId: number | null = null;

  // ── Lista de derramas ────────────────────────────────────────────────────
  derramas: (Derrama & { expandida?: boolean })[] = [];
  loading   = false;
  error     = '';
  exito     = '';

  // ── Modal nueva derrama ──────────────────────────────────────────────────
  modalNueva   = false;
  guardandoNueva = false;
  nuevaDerrama = {
    descripcion:   '',
    tipo:          'monetaria' as 'monetaria' | 'unidades',
    montoUnitario: 0,
  };

  // ── Modal asignar equipos ────────────────────────────────────────────────
  modalAsignar       = false;
  derramaSeleccionada: Derrama | null = null;
  asignaciones: { equipoId: number; equipoNombre: string; cantidad: number; modoPago: 'inmediato' | 'por_vocalia'; seleccionado: boolean }[] = [];
  guardandoAsignar   = false;

  // ── Modal pago directo ───────────────────────────────────────────────────
  modalPago          = false;
  pagoEquipo: DerramaEquipo | null = null;
  pagoDerramaId: number | null    = null;
  montoPago          = 0;
  observacionesPago  = '';
  guardandoPago      = false;
  // ── Modal dividir cuotas ───────────────────────────────────────────
  modalCuotas         = false;
  cuotasEquipo: DerramaEquipo | null = null;
  cuotasDerramaId: number | null    = null;
  numeroCuotas        = 2;
  guardandoCuotas     = false;
  constructor(
    private authService: AuthService,
    public permissions: PermissionsService,
    private derramasService: DerramasService,
    private campeonatosService: CampeonatosService,
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
          this.cargarCampeonatos(user.ligaId);
        }
      },
    });
  }

  cargarCampeonatos(ligaId: number): void {
    this.campeonatosService.getByLiga(ligaId).subscribe({
      next: (camps) => {
        this.campeonatos = camps;
        if (camps.length > 0 && !this.campeonatoId) {
          this.campeonatoId = camps[0].id;
          this.cargarDerramas();
          this.cargarEquipos();
        }
      },
    });
  }

  onLigaChange(): void {
    this.campeonatos    = [];
    this.campeonatoId   = null;
    this.derramas       = [];
    this.equipos        = [];
    if (this.ligaId) this.cargarCampeonatos(this.ligaId);
  }

  onCampeonatoChange(): void {
    this.derramas = [];
    if (this.campeonatoId) {
      this.cargarDerramas();
      this.cargarEquipos();
    }
  }

  private cargarEquipos(): void {
    if (!this.campeonatoId) return;
    this.equiposService.getByLiga(this.ligaId!).subscribe({
      next: (equipos) => { this.equipos = equipos; },
      error: () => {},
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LISTA DE DERRAMAS
  // ─────────────────────────────────────────────────────────────────────────

  cargarDerramas(): void {
    if (!this.campeonatoId) return;
    this.loading = true;
    this.error   = '';
    this.derramasService.listar(this.campeonatoId).subscribe({
      next: (data) => {
        this.derramas = data.map(d => ({ ...d, expandida: false }));
        this.loading  = false;
      },
      error: (err) => {
        this.error   = err?.error?.message ?? 'Error al cargar derramas';
        this.loading = false;
      },
    });
  }

  toggleDetalle(derrama: Derrama & { expandida?: boolean }): void {
    derrama.expandida = !derrama.expandida;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NUEVA DERRAMA — MODAL
  // ─────────────────────────────────────────────────────────────────────────

  abrirModalNueva(): void {
    this.nuevaDerrama  = { descripcion: '', tipo: 'monetaria', montoUnitario: 0 };
    this.error         = '';
    this.exito         = '';
    this.modalNueva    = true;
  }

  cerrarModalNueva(): void { this.modalNueva = false; }

  guardarDerrama(): void {
    if (!this.campeonatoId || !this.ligaId) return;
    if (!this.nuevaDerrama.descripcion.trim()) {
      this.error = 'La descripción es obligatoria.';
      return;
    }
    if (this.nuevaDerrama.montoUnitario <= 0) {
      this.error = 'El monto unitario debe ser mayor a 0.';
      return;
    }
    this.guardandoNueva = true;
    this.error = '';
    this.derramasService.crear({
      ligaId:        this.ligaId,
      campeonatoId:  this.campeonatoId,
      descripcion:   this.nuevaDerrama.descripcion.trim(),
      tipo:          this.nuevaDerrama.tipo,
      montoUnitario: this.nuevaDerrama.montoUnitario,
    }).subscribe({
      next: () => {
        this.guardandoNueva = false;
        this.modalNueva     = false;
        this.exito          = 'Derrama creada exitosamente.';
        this.cargarDerramas();
        setTimeout(() => { this.exito = ''; }, 4000);
      },
      error: (err) => {
        this.error          = err?.error?.message ?? 'Error al crear la derrama.';
        this.guardandoNueva = false;
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ASIGNAR EQUIPOS — MODAL
  // ─────────────────────────────────────────────────────────────────────────

  abrirModalAsignar(derrama: Derrama): void {
    this.derramaSeleccionada = derrama;
    this.error = '';
    // Construir tabla de equipos con valores previos si ya existen
    const yaAsignados = new Map<number, DerramaEquipo>(
      (derrama.equipos ?? []).map(e => [e.equipoId, e]),
    );
    this.asignaciones = this.equipos.map(eq => {
      const prev = yaAsignados.get(eq.id);
      return {
        equipoId:    eq.id,
        equipoNombre: eq.nombre,
        cantidad:    prev?.cantidad  ?? 1,
        modoPago:    prev?.modoPago  ?? 'por_vocalia',
        seleccionado: !!prev,
      };
    });
    this.modalAsignar = true;
  }

  cerrarModalAsignar(): void { this.modalAsignar = false; }

  /** Selecciona/deselecciona todos los equipos */
  toggleTodos(seleccionar: boolean): void {
    this.asignaciones.forEach(a => { a.seleccionado = seleccionar; });
  }

  guardarAsignacion(): void {
    if (!this.derramaSeleccionada) return;
    const seleccionados = this.asignaciones.filter(a => a.seleccionado);
    if (seleccionados.length === 0) {
      this.error = 'Seleccione al menos un equipo.';
      return;
    }
    this.guardandoAsignar = true;
    this.error = '';
    this.derramasService.asignarEquipos(
      this.derramaSeleccionada.id!,
      seleccionados.map(a => ({
        equipoId: a.equipoId,
        cantidad: a.cantidad,
        modoPago: a.modoPago,
      })),
    ).subscribe({
      next: () => {
        this.guardandoAsignar = false;
        this.modalAsignar     = false;
        this.exito            = `Equipos asignados a "${this.derramaSeleccionada!.descripcion}".`;
        this.cargarDerramas();
        setTimeout(() => { this.exito = ''; }, 4000);
      },
      error: (err) => {
        this.error            = err?.error?.message ?? 'Error al asignar equipos.';
        this.guardandoAsignar = false;
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PAGO DIRECTO — MODAL
  // ─────────────────────────────────────────────────────────────────────────

  abrirModalPago(derrama: Derrama, equipo: DerramaEquipo): void {
    this.pagoDerramaId   = derrama.id!;
    this.pagoEquipo      = equipo;
    this.montoPago       = Number(equipo.montoTotal) - Number(equipo.montoAbonado);
    this.observacionesPago = '';
    this.error           = '';
    this.modalPago       = true;
  }

  cerrarModalPago(): void { this.modalPago = false; }

  guardarPago(): void {
    if (!this.pagoDerramaId || !this.pagoEquipo) return;
    if (this.montoPago <= 0) {
      this.error = 'El monto debe ser mayor a 0.';
      return;
    }
    this.guardandoPago = true;
    this.error         = '';
    this.derramasService.registrarPago(
      this.pagoDerramaId,
      this.pagoEquipo.equipoId,
      this.montoPago,
      this.campeonatoId ?? undefined,
      this.observacionesPago || undefined,
    ).subscribe({
      next: () => {
        this.guardandoPago = false;
        this.modalPago     = false;
        this.exito         = `Pago registrado para ${this.pagoEquipo!.equipo?.nombre ?? 'equipo'}.`;
        this.cargarDerramas();
        setTimeout(() => { this.exito = ''; }, 4000);
      },
      error: (err) => {
        this.error         = err?.error?.message ?? 'Error al registrar el pago.';
        this.guardandoPago = false;
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CERRAR DERRAMA
  // ─────────────────────────────────────────────────────────────────────────

  cerrarDerrama(derrama: Derrama): void {
    if (!confirm(`¿Cerrar la derrama "${derrama.descripcion}"?\nLos equipos con deuda quedarán marcados como "arrastrado".`)) return;
    this.derramasService.cerrar(derrama.id!).subscribe({
      next: () => {
        this.exito = `Derrama "${derrama.descripcion}" cerrada.`;
        this.cargarDerramas();
        setTimeout(() => { this.exito = ''; }, 4000);
      },
      error: (err) => { this.error = err?.error?.message ?? 'Error al cerrar la derrama.'; },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DIVIDIR EN CUOTAS — MODAL
  // ─────────────────────────────────────────────────────────────────────────

  abrirModalCuotas(derrama: Derrama, equipo: DerramaEquipo): void {
    this.cuotasDerramaId = derrama.id!;
    this.cuotasEquipo    = equipo;
    this.numeroCuotas    = 2;
    this.error           = '';
    this.modalCuotas     = true;
  }

  cerrarModalCuotas(): void { this.modalCuotas = false; }

  get cuotaCalculada(): number {
    if (!this.cuotasEquipo || this.numeroCuotas < 1) return 0;
    const saldo = Number(this.cuotasEquipo.montoTotal) - Number(this.cuotasEquipo.montoAbonado);
    return Math.round((saldo / this.numeroCuotas) * 100) / 100;
  }

  guardarCuotas(): void {
    if (!this.cuotasDerramaId || !this.cuotasEquipo) return;
    if (this.numeroCuotas < 2) { this.error = 'Mínimo 2 cuotas.'; return; }
    this.guardandoCuotas = true;
    this.error = '';
    this.derramasService.dividirCuotas(
      this.cuotasDerramaId,
      this.cuotasEquipo.equipoId,
      this.numeroCuotas,
    ).subscribe({
      next: () => {
        this.guardandoCuotas = false;
        this.modalCuotas     = false;
        this.exito = `Deuda dividida en ${this.numeroCuotas} cuotas de $${this.cuotaCalculada.toFixed(2)} cada una.`;
        this.cargarDerramas();
        setTimeout(() => { this.exito = ''; }, 5000);
      },
      error: (err) => {
        this.error           = err?.error?.message ?? 'Error al dividir las cuotas.';
        this.guardandoCuotas = false;
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  saldoPendiente(e: DerramaEquipo): number {
    return Number(e.montoTotal) - Number(e.montoAbonado);
  }

  badgeEstado(estado: string): string {
    const map: Record<string, string> = {
      activa:    'badge-success',
      cerrada:   'badge-secondary',
      pagado:    'badge-success',
      parcial:   'badge-warning',
      pendiente: 'badge-warning',
      arrastrado:'badge-danger',
    };
    return map[estado] ?? 'badge-secondary';
  }

  etiquetaEstado(estado: string): string {
    const map: Record<string, string> = {
      activa:    'Activa',
      cerrada:   'Cerrada',
      pagado:    'Pagado',
      parcial:   'Parcial',
      pendiente: 'Pendiente',
      arrastrado:'Arrastrado',
    };
    return map[estado] ?? estado;
  }

  etiquetaModoPago(modo: string): string {
    return modo === 'por_vocalia' ? 'Por Vocalía' : 'Inmediato';
  }

  canEdit(): boolean {
    return this.permissions.isMaster()
      || this.permissions.hasRole(['directivo_liga', 'tesoreria']);
  }
}
