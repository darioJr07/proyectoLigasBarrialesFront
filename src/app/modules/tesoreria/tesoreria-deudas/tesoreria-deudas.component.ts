import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { DerramasService } from '../../../core/services/derramas.service';
import { GarantiasService } from '../../../core/services/garantias.service';
import {
  CuentaConsolidada,
  DeudaConsolidada,
  ResumenDeudaEquipo,
  TesoreriaService,
} from '../../../core/services/tesoreria.service';
import { LigasService } from '../../../core/services/ligas.service';
import { EquiposService } from '../../../core/services/equipos.service';
import { CampeonatosService } from '../../campeonatos/campeonatos.service';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';
import { TesoreriaNavComponent } from '../../../shared/components/tesoreria-nav/tesoreria-nav.component';
import {
  ReciboTesoreria,
  RecibosTesoreriaService,
} from '../../../core/services/recibos-tesoreria.service';
import { ReciboTesoreriaPdfService } from '../../../core/services/recibo-tesoreria-pdf.service';

@Component({
  selector: 'app-tesoreria-deudas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainNavComponent, TesoreriaNavComponent],
  templateUrl: './tesoreria-deudas.component.html',
  styleUrl: './tesoreria-deudas.component.scss',
})
export class TesoreriaDeudaComponent implements OnInit {
  user$: Observable<any>;

  ligas: any[] = [];
  equipos: any[] = [];
  campeonatos: any[] = [];
  ligaId: number | null = null;
  equipoId: number | null = null;
  campeonatoCajaId: number | null = null;
  filtroOrigen = '';

  cuenta: CuentaConsolidada | null = null;
  loading = false;
  error = '';
  exito = '';
  recibos: ReciboTesoreria[] = [];
  cargandoRecibos = false;
  errorRecibos = '';
  ultimoRecibo: ReciboTesoreria | null = null;

  modalPago: DeudaConsolidada | null = null;
  montoPago = 0;
  fechaPago = '';
  guardandoPago = false;
  errorPago = '';

  constructor(
    private authService: AuthService,
    public permissions: PermissionsService,
    private tesoreriaService: TesoreriaService,
    private derramasService: DerramasService,
    private garantiasService: GarantiasService,
    private ligasService: LigasService,
    private equiposService: EquiposService,
    private campeonatosService: CampeonatosService,
    private recibosService: RecibosTesoreriaService,
    private reciboPdfService: ReciboTesoreriaPdfService,
  ) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.ligasService.getAll().subscribe({
      next: (ligas) => {
        this.ligas = ligas;
        const user = this.authService.currentUserValue;
        if (user?.ligaId) {
          this.ligaId = user.ligaId;
          this.cargarContextoLiga(user.ligaId);
        }
      },
      error: () => { this.error = 'No se pudieron cargar las ligas.'; },
    });
  }

  logout(): void { this.authService.logout(); }

  onLigaChange(): void {
    this.equipos = [];
    this.campeonatos = [];
    this.equipoId = null;
    this.campeonatoCajaId = null;
    this.cuenta = null;
    this.recibos = [];
    this.ultimoRecibo = null;
    if (this.ligaId) this.cargarContextoLiga(this.ligaId);
  }

  private cargarContextoLiga(ligaId: number): void {
    this.equiposService.getByLiga(ligaId).subscribe({
      next: (equipos) => {
        this.equipos = [...equipos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        this.consultar();
      },
      error: () => { this.error = 'No se pudieron cargar los equipos.'; },
    });

    this.campeonatosService.getByLiga(ligaId).subscribe({
      next: (campeonatos) => {
        this.campeonatos = campeonatos;
        const enCurso = campeonatos.find((c: any) => c.estado === 'en_curso');
        this.campeonatoCajaId = enCurso?.id ?? campeonatos[0]?.id ?? null;
      },
      error: () => {},
    });
  }

  consultar(): void {
    if (!this.ligaId) return;
    this.loading = true;
    this.error = '';
    this.tesoreriaService.getDeudasConsolidadas(
      this.ligaId,
      this.equipoId ?? undefined,
    ).subscribe({
      next: (cuenta) => {
        this.cuenta = cuenta;
        this.loading = false;
        if (this.equipoId) this.cargarRecibos();
        else this.recibos = [];
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Error al consultar la cuenta de los equipos.';
        this.loading = false;
      },
    });
  }

  verDetalle(resumen: ResumenDeudaEquipo): void {
    this.equipoId = resumen.equipoId;
    this.filtroOrigen = '';
    this.consultar();
  }

  verTodos(): void {
    this.equipoId = null;
    this.filtroOrigen = '';
    this.recibos = [];
    this.consultar();
  }

  get itemsFiltrados(): DeudaConsolidada[] {
    const items = this.cuenta?.items ?? [];
    return this.filtroOrigen ? items.filter((item) => item.origen === this.filtroOrigen) : items;
  }

  get totalDetalle(): number {
    return this.itemsFiltrados.reduce((total, item) => total + Number(item.saldoPendiente), 0);
  }

  get equipoSeleccionadoNombre(): string {
    return this.equipos.find((equipo) => equipo.id === this.equipoId)?.nombre ?? '';
  }

  abrirPago(deuda: DeudaConsolidada): void {
    if (deuda.accion !== 'pagar') return;
    this.modalPago = deuda;
    this.montoPago = Number(deuda.saldoPendiente);
    this.fechaPago = this.fechaLocalActual();
    this.errorPago = '';
  }

  cerrarPago(): void {
    if (this.guardandoPago) return;
    this.modalPago = null;
    this.errorPago = '';
  }

  confirmarPago(): void {
    const deuda = this.modalPago;
    if (!deuda) return;
    if (this.montoPago <= 0 || this.montoPago > deuda.saldoPendiente) {
      this.errorPago = `El monto debe estar entre $0,01 y $${deuda.saldoPendiente.toFixed(2)}.`;
      return;
    }
    if (deuda.origen !== 'derrama' && this.montoPago !== deuda.saldoPendiente) {
      this.errorPago = 'Esta obligación debe cobrarse por su valor pendiente completo.';
      return;
    }
    if (deuda.origen === 'derrama' && !this.campeonatoCajaId) {
      this.errorPago = 'Seleccione el campeonato de caja donde se registrará el ingreso.';
      return;
    }

    this.guardandoPago = true;
    this.errorPago = '';

    let operacion: Observable<unknown>;
    if (deuda.origen === 'cobro_partido') {
      operacion = this.tesoreriaService.pagarCobroPartido(deuda.origenId, this.fechaPago);
    } else if (deuda.origen === 'movimiento') {
      operacion = this.tesoreriaService.actualizarMovimiento(deuda.origenId, {
        estado: 'pagado',
        fechaPago: this.fechaPago,
      });
    } else if (deuda.origen === 'garantia') {
      operacion = this.garantiasService.marcarPagada(deuda.origenId);
    } else {
      operacion = this.derramasService.registrarPago(
        deuda.derramaId!,
        deuda.equipoId,
        Number(this.montoPago),
        this.campeonatoCajaId!,
        deuda.estado === 'arrastrado' ? 'Pago de deuda arrastrada' : undefined,
      );
    }

    operacion.subscribe({
      next: (resultado) => {
        this.guardandoPago = false;
        this.modalPago = null;
        const recibo = (resultado as { recibo?: ReciboTesoreria })?.recibo ?? null;
        this.ultimoRecibo = recibo;
        this.exito = recibo
          ? `Pago registrado correctamente. Se emitió el recibo ${recibo.numero}.`
          : `Pago de ${deuda.equipo} registrado correctamente.`;
        this.consultar();
        setTimeout(() => { this.exito = ''; }, 7000);
      },
      error: (err) => {
        this.errorPago = err?.error?.message ?? 'No se pudo registrar el pago.';
        this.guardandoPago = false;
      },
    });
  }

  etiquetaOrigen(origen: string): string {
    const etiquetas: Record<string, string> = {
      cobro_partido: 'Vocalía',
      movimiento: 'Movimiento',
      derrama: 'Derrama',
      garantia: 'Garantía',
    };
    return etiquetas[origen] ?? origen;
  }

  claseOrigen(origen: string): string {
    return `origen-${origen.replace('_', '-')}`;
  }

  etiquetaEstado(estado: string): string {
    const etiquetas: Record<string, string> = {
      pendiente: 'Pendiente',
      parcial: 'Parcial',
      arrastrado: 'Arrastrada',
    };
    return etiquetas[estado] ?? estado;
  }

  descargarRecibo(recibo: ReciboTesoreria): void {
    this.reciboPdfService.descargar(recibo);
  }

  private cargarRecibos(): void {
    if (!this.ligaId || !this.equipoId) return;
    this.cargandoRecibos = true;
    this.errorRecibos = '';
    this.recibosService.listar(this.ligaId, this.equipoId).subscribe({
      next: (recibos) => {
        this.recibos = recibos;
        this.cargandoRecibos = false;
      },
      error: (err) => {
        this.errorRecibos = err?.error?.message ?? 'No se pudo cargar el historial de recibos.';
        this.cargandoRecibos = false;
      },
    });
  }

  private fechaLocalActual(): string {
    const hoy = new Date();
    const local = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
}
