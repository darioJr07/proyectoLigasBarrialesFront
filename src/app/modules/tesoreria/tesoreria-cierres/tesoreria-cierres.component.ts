import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import {
  CierreCajaTesoreria,
  PreviewCierreCaja,
  TesoreriaService,
} from '../../../core/services/tesoreria.service';
import { CampeonatosService } from '../../campeonatos/campeonatos.service';
import { LigasService } from '../../../core/services/ligas.service';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';
import { TesoreriaNavComponent } from '../../../shared/components/tesoreria-nav/tesoreria-nav.component';
import { CierreCajaExportService } from './cierre-caja-export.service';

@Component({
  selector: 'app-tesoreria-cierres',
  standalone: true,
  imports: [CommonModule, FormsModule, MainNavComponent, TesoreriaNavComponent],
  templateUrl: './tesoreria-cierres.component.html',
  styleUrl: './tesoreria-cierres.component.scss',
})
export class TesoreriaCierresComponent implements OnInit {
  user$: Observable<any>;
  ligas: any[] = [];
  campeonatos: any[] = [];
  ligaId: number | null = null;
  campeonatoId: number | null = null;
  fechaCorte = this.fechaLocalActual();
  fechaMaxima = this.fechaLocalActual();
  tipo: 'conciliacion' | 'cierre_definitivo' = 'conciliacion';
  saldoContado: number | null = null;
  observaciones = '';
  preview: PreviewCierreCaja | null = null;
  cierres: CierreCajaTesoreria[] = [];
  loading = false;
  guardando = false;
  error = '';
  mensaje = '';

  constructor(
    private authService: AuthService,
    public permissions: PermissionsService,
    private tesoreriaService: TesoreriaService,
    private campeonatosService: CampeonatosService,
    private ligasService: LigasService,
    private exportService: CierreCajaExportService,
  ) {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.ligasService.getAll().subscribe({
      next: (ligas) => {
        this.ligas = ligas;
        const ligaUsuario = this.authService.currentUserValue?.ligaId;
        if (ligaUsuario) {
          this.ligaId = ligaUsuario;
          this.cargarCampeonatos(ligaUsuario);
        }
      },
      error: () => { this.error = 'No fue posible cargar las ligas.'; },
    });
  }

  onLigaChange(): void {
    this.campeonatos = [];
    this.campeonatoId = null;
    this.reiniciarCorte();
    if (this.ligaId) this.cargarCampeonatos(this.ligaId);
  }

  onCampeonatoChange(): void {
    this.reiniciarCorte();
    this.cargarHistorial();
  }

  calcular(): void {
    if (!this.ligaId || !this.campeonatoId || !this.fechaCorte) return;
    this.loading = true;
    this.error = '';
    this.mensaje = '';
    this.preview = null;
    this.tesoreriaService.previsualizarCierre(this.ligaId, this.campeonatoId, this.fechaCorte).subscribe({
      next: (preview) => {
        this.preview = this.normalizarPreview(preview);
        this.saldoContado = this.preview.saldoEsperado;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'No fue posible calcular el corte de caja.';
        this.loading = false;
      },
    });
  }

  registrar(): void {
    if (!this.preview || !this.ligaId || !this.campeonatoId || this.saldoContado === null) return;
    if (Math.abs(this.diferencia) >= 0.01 && !this.observaciones.trim()) {
      this.error = 'Explique la diferencia entre el saldo esperado y el dinero contado.';
      return;
    }
    const definitivo = this.tipo === 'cierre_definitivo';
    const confirmacion = definitivo
      ? 'Este cierre es definitivo y no podrá repetirse ni modificarse. ¿Confirma el cierre final del campeonato?'
      : 'La conciliación quedará guardada sin opción de edición. Después no se permitirán pagos con esta fecha ni con fechas anteriores. ¿Desea continuar?';
    if (!window.confirm(confirmacion)) return;

    this.guardando = true;
    this.error = '';
    this.mensaje = '';
    this.tesoreriaService.crearCierre({
      ligaId: this.ligaId,
      campeonatoId: this.campeonatoId,
      tipo: this.tipo,
      fechaCorte: this.fechaCorte,
      saldoContado: Number(this.saldoContado),
      observaciones: this.observaciones.trim() || undefined,
    }).subscribe({
      next: (cierre) => {
        this.mensaje = definitivo
          ? 'Cierre definitivo registrado correctamente.'
          : 'Conciliación de caja registrada correctamente.';
        this.guardando = false;
        this.preview = null;
        this.saldoContado = null;
        this.observaciones = '';
        this.cargarHistorial(cierre.id);
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'No fue posible guardar el corte de caja.';
        this.guardando = false;
      },
    });
  }

  descargar(cierre: CierreCajaTesoreria): void {
    const liga = this.ligas.find((item) => item.id === this.ligaId);
    const campeonato = this.campeonatos.find((item) => item.id === this.campeonatoId);
    this.exportService.descargarPdf({
      cierre,
      ligaNombre: liga?.nombre ?? 'Liga barrial',
      campeonatoNombre: campeonato?.nombre ?? 'Campeonato',
    });
  }

  get diferencia(): number {
    if (!this.preview || this.saldoContado === null || this.saldoContado === undefined) return 0;
    return Number((Number(this.saldoContado) - Number(this.preview.saldoEsperado)).toFixed(2));
  }

  get cierreDefinitivo(): CierreCajaTesoreria | undefined {
    return this.cierres.find((cierre) => cierre.tipo === 'cierre_definitivo');
  }

  get campeonatoSeleccionado(): any {
    return this.campeonatos.find((item) => item.id === this.campeonatoId);
  }

  logout(): void { this.authService.logout(); }

  private cargarCampeonatos(ligaId: number): void {
    this.campeonatosService.getByLiga(ligaId).subscribe({
      next: (campeonatos) => {
        this.campeonatos = campeonatos;
        if (campeonatos.length && !this.campeonatoId) {
          this.campeonatoId = campeonatos[0].id;
          this.cargarHistorial();
        }
      },
      error: () => { this.error = 'No fue posible cargar los campeonatos.'; },
    });
  }

  private cargarHistorial(descargarId?: number): void {
    if (!this.ligaId || !this.campeonatoId) {
      this.cierres = [];
      return;
    }
    this.tesoreriaService.listarCierres(this.ligaId, this.campeonatoId).subscribe({
      next: (cierres) => {
        this.cierres = cierres.map((cierre) => this.normalizarCierre(cierre));
        if (descargarId) {
          const creado = this.cierres.find((cierre) => cierre.id === descargarId);
          if (creado) this.descargar(creado);
        }
      },
      error: (err) => { this.error = err?.error?.message ?? 'No fue posible cargar el historial.'; },
    });
  }

  private reiniciarCorte(): void {
    this.preview = null;
    this.cierres = [];
    this.saldoContado = null;
    this.observaciones = '';
    this.tipo = 'conciliacion';
    this.error = '';
    this.mensaje = '';
  }

  private normalizarPreview(preview: PreviewCierreCaja): PreviewCierreCaja {
    return {
      ...preview,
      saldoBase: Number(preview.saldoBase),
      totalIngresos: Number(preview.totalIngresos),
      totalEgresos: Number(preview.totalEgresos),
      saldoEsperado: Number(preview.saldoEsperado),
    };
  }

  private normalizarCierre(cierre: CierreCajaTesoreria): CierreCajaTesoreria {
    return {
      ...cierre,
      ...this.normalizarPreview(cierre),
      saldoContado: Number(cierre.saldoContado),
      diferencia: Number(cierre.diferencia),
    };
  }

  private fechaLocalActual(): string {
    const fecha = new Date();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }
}
