import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { TesoreriaService, EntradaLibroCaja } from '../../../core/services/tesoreria.service';
import { CampeonatosService } from '../../campeonatos/campeonatos.service';
import { LigasService } from '../../../core/services/ligas.service';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';

@Component({
  selector: 'app-tesoreria-libro-caja',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainNavComponent],
  templateUrl: './tesoreria-libro-caja.component.html',
  styleUrl: './tesoreria-libro-caja.component.scss',
})
export class TesoreriaLibroCajaComponent implements OnInit {
  user$: Observable<any>;

  ligas: any[] = [];
  campeonatos: any[] = [];
  entradas: EntradaLibroCaja[] = [];
  entradasFiltradas: EntradaLibroCaja[] = [];

  filtroLigaId: number | null = null;
  filtroCampeonatoId: number | null = null;
  filtroOrigen: string = '';
  filtroTipo: string = '';
  filtroEstado: string = '';

  totalIngresos  = 0;
  totalPendiente = 0;
  totalEgresos   = 0;
  saldo          = 0;

  loading = false;
  error   = '';

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
          this.buscar();
        }
      },
      error: () => {},
    });
  }

  onLigaChange(): void {
    this.campeonatos        = [];
    this.filtroCampeonatoId = null;
    this.entradas           = [];
    this.entradasFiltradas  = [];
    this.calcularTotales();
    if (this.filtroLigaId) { this.cargarCampeonatos(this.filtroLigaId); }
  }

  buscar(): void {
    if (!this.filtroLigaId) { return; }
    this.loading = true;
    this.error   = '';
    this.tesoreriaService.getLibroCaja({
      ligaId:       this.filtroLigaId,
      campeonatoId: this.filtroCampeonatoId ?? undefined,
    }).subscribe({
      next: (list) => {
        this.entradas = list;
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (err) => {
        this.error   = err?.error?.message ?? 'Error al cargar el libro de caja';
        this.loading = false;
      },
    });
  }

  aplicarFiltros(): void {
    let result = [...this.entradas];
    if (this.filtroOrigen) result = result.filter((e) => e.origen === this.filtroOrigen);
    if (this.filtroTipo)   result = result.filter((e) => e.tipo   === this.filtroTipo);
    if (this.filtroEstado) result = result.filter((e) => e.estado === this.filtroEstado);
    this.entradasFiltradas = result;
    this.calcularTotales();
  }

  calcularTotales(): void {
    const activos = this.entradasFiltradas.filter((e) => e.estado !== 'anulado');
    // Solo ingresos efectivamente cobrados (pagado) — los pendientes no son dinero en caja
    this.totalIngresos  = activos.filter((e) => e.tipo === 'ingreso' && e.estado === 'pagado').reduce((s, e) => s + e.monto, 0);
    this.totalPendiente = activos.filter((e) => e.tipo === 'ingreso' && e.estado === 'pendiente').reduce((s, e) => s + e.monto, 0);
    this.totalEgresos   = activos.filter((e) => e.tipo === 'egreso').reduce((s, e) => s + e.monto, 0);
    this.saldo          = this.totalIngresos - this.totalEgresos;
  }

  logout(): void { this.authService.logout(); }
}
