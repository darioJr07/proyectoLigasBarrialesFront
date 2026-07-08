import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { TesoreriaService, MovimientoTesoreria } from '../../../core/services/tesoreria.service';
import { CampeonatosService } from '../../campeonatos/campeonatos.service';
import { LigasService } from '../../../core/services/ligas.service';
import { EquiposService } from '../../../core/services/equipos.service';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';

@Component({
  selector: 'app-tesoreria-movimientos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainNavComponent],
  templateUrl: './tesoreria-movimientos.component.html',
  styleUrl: './tesoreria-movimientos.component.scss',
})
export class TesoreriaMovimientosComponent implements OnInit {
  user$: Observable<any>;

  campeonatos: any[]              = [];
  ligas: any[]                    = [];
  equipos: any[]                  = [];
  movimientos: MovimientoTesoreria[] = [];

  // Filtros
  filtroLigaId: number | null     = null;
  filtroCampeonatoId: number | null = null;
  filtroTipo: string              = '';
  filtroEstado: string            = '';

  // Formulario nuevo movimiento
  mostrarFormulario = false;
  guardando         = false;
  nuevoMov: Partial<MovimientoTesoreria> = {
    tipo: 'ingreso',
    categoria: 'otro',
    estado: 'pendiente',
    monto: 0,
  };

  readonly categorias = [
    { value: 'inscripcion',      label: 'Inscripción' },
    { value: 'carnets',          label: 'Carnets' },
    { value: 'multa_admin',      label: 'Multa administrativa' },
    { value: 'pago_arbitro',     label: 'Pago árbitro' },
    { value: 'premios',          label: 'Premios' },
    { value: 'papeleria',        label: 'Papelería' },
    { value: 'fondo_accidentes', label: 'Fondo de accidentes' },
    { value: 'otro',             label: 'Otro' },
  ];

  loading = false;
  error   = '';
  exito   = '';

  constructor(
    private authService: AuthService,
    public permissions: PermissionsService,
    private tesoreriaService: TesoreriaService,
    private campeonatosService: CampeonatosService,
    private ligasService: LigasService,
    private equiposService: EquiposService,
  ) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.ligasService.getAll().subscribe({
      next: (ligas) => {
        this.ligas = ligas;
        const user = this.authService.currentUserValue;
        if (user?.ligaId) {
          this.filtroLigaId = user.ligaId;
          this.nuevoMov.ligaId = user.ligaId;
          this.cargarCampeonatos(user.ligaId);
          this.cargarEquipos(user.ligaId);
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
          this.nuevoMov.campeonatoId = camps[0].id;
          this.buscar();
        }
      },
      error: () => {},
    });
  }

  onLigaChange(): void {
    this.campeonatos        = [];
    this.equipos            = [];
    this.filtroCampeonatoId = null;
    this.movimientos        = [];
    this.nuevoMov.ligaId    = this.filtroLigaId ?? undefined;
    this.nuevoMov.equipoId  = undefined;
    if (this.filtroLigaId) {
      this.cargarCampeonatos(this.filtroLigaId);
      this.cargarEquipos(this.filtroLigaId);
    }
  }

  cargarEquipos(ligaId: number): void {
    this.equiposService.getByLiga(ligaId).subscribe({
      next: (equipos) => { this.equipos = equipos; },
      error: () => {},
    });
  }

  buscar(): void {
    if (!this.filtroLigaId) { return; }
    this.loading = true;
    this.error   = '';
    this.tesoreriaService.listarMovimientos({
      ligaId:       this.filtroLigaId,
      campeonatoId: this.filtroCampeonatoId ?? undefined,
      tipo:         this.filtroTipo || undefined,
      estado:       this.filtroEstado || undefined,
    }).subscribe({
      next: (list) => { this.movimientos = list; this.loading = false; },
      error: (err) => { this.error = err?.error?.message ?? 'Error al cargar movimientos'; this.loading = false; },
    });
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) { this.resetFormulario(); }
  }

  private resetFormulario(): void {
    this.nuevoMov = {
      tipo:         'ingreso',
      categoria:    'otro',
      estado:       'pendiente',
      monto:        0,
      ligaId:       this.filtroLigaId ?? undefined,
      campeonatoId: this.filtroCampeonatoId ?? undefined,
      equipoId:     undefined,
    };
  }

  guardarMovimiento(): void {
    if (!this.nuevoMov.ligaId || !this.nuevoMov.monto) {
      this.error = 'Liga y monto son requeridos.';
      return;
    }
    this.guardando = true;
    this.error     = '';
    this.tesoreriaService.crearMovimiento(this.nuevoMov).subscribe({
      next: (mov) => {
        this.movimientos.unshift(mov);
        this.guardando       = false;
        this.mostrarFormulario = false;
        this.exito           = 'Movimiento registrado correctamente.';
        this.resetFormulario();
        setTimeout(() => { this.exito = ''; }, 3000);
      },
      error: (err) => {
        this.guardando = false;
        this.error     = err?.error?.message ?? 'Error al guardar el movimiento';
      },
    });
  }

  marcarPagado(mov: MovimientoTesoreria): void {
    if (!mov.id) { return; }
    const hoy = new Date().toISOString().split('T')[0];
    this.tesoreriaService.actualizarMovimiento(mov.id, { estado: 'pagado', fechaPago: hoy }).subscribe({
      next: (updated) => {
        const idx = this.movimientos.findIndex((m) => m.id === mov.id);
        if (idx >= 0) { this.movimientos[idx] = updated; }
        this.exito = 'Movimiento marcado como pagado.';
        setTimeout(() => { this.exito = ''; }, 3000);
      },
      error: (err) => { this.error = err?.error?.message ?? 'Error al actualizar'; },
    });
  }

  anularMovimiento(mov: MovimientoTesoreria): void {
    if (!mov.id) { return; }
    const mensaje = mov.estado === 'pagado'
      ? `⚠️ Este movimiento ya fue COBRADO ($${mov.monto}). ¿Seguro que desea anularlo?`
      : '¿Anular este movimiento?';
    if (!confirm(mensaje)) { return; }
    this.tesoreriaService.actualizarMovimiento(mov.id, { estado: 'anulado' }).subscribe({
      next: (updated) => {
        const idx = this.movimientos.findIndex((m) => m.id === mov.id);
        if (idx >= 0) { this.movimientos[idx] = updated; }
        this.exito = 'Movimiento anulado.';
        setTimeout(() => { this.exito = ''; }, 3000);
      },
      error: (err) => { this.error = err?.error?.message ?? 'Error al anular'; },
    });
  }

  logout(): void { this.authService.logout(); }
}
