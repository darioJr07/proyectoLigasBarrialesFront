import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { TesoreriaService, CobroPartido } from '../../../core/services/tesoreria.service';
import { CampeonatosService } from '../../campeonatos/campeonatos.service';
import { LigasService } from '../../../core/services/ligas.service';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';

@Component({
  selector: 'app-tesoreria-cobros-partido',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainNavComponent],
  templateUrl: './tesoreria-cobros-partido.component.html',
  styleUrl: './tesoreria-cobros-partido.component.scss',
})
export class TesoreríaCobrosPartidoComponent implements OnInit {
  user$: Observable<any>;

  campeonatos: any[] = [];
  ligas: any[] = [];
  cobros: CobroPartido[] = [];

  filtroCampeonatoId: number | null = null;
  filtroLigaId: number | null = null;
  filtroEstado: string = '';

  loading = false;
  error   = '';
  exito   = '';

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
    this.campeonatos       = [];
    this.filtroCampeonatoId = null;
    this.cobros            = [];
    if (this.filtroLigaId) { this.cargarCampeonatos(this.filtroLigaId); }
  }

  buscar(): void {
    if (!this.filtroLigaId) { return; }
    this.loading = true;
    this.error   = '';
    this.tesoreriaService.listarCobrosPartido({
      ligaId:       this.filtroLigaId,
      campeonatoId: this.filtroCampeonatoId ?? undefined,
      estado:       this.filtroEstado || undefined,
    }).subscribe({
      next: (list) => { this.cobros = list; this.loading = false; },
      error: (err) => { this.error = err?.error?.message ?? 'Error al cargar cobros'; this.loading = false; },
    });
  }

  marcarPagado(cobro: CobroPartido): void {
    if (!cobro.id) { return; }
    const equipo = cobro.equipo?.nombre ?? 'equipo';
    const monto = cobro.total ?? '';
    if (!confirm(`¿Confirmar cobro de $${monto} al equipo "${equipo}"?\nEsta acción marcará el cobro como PAGADO.`)) { return; }
    const hoy = new Date().toISOString().split('T')[0];
    this.tesoreriaService.pagarCobroPartido(cobro.id, hoy).subscribe({
      next: (updated) => {
        const idx = this.cobros.findIndex((c) => c.id === cobro.id);
        if (idx >= 0) { this.cobros[idx] = updated; }
        this.exito = 'Cobro marcado como pagado.';
        setTimeout(() => { this.exito = ''; }, 3000);
      },
      error: (err) => { this.error = err?.error?.message ?? 'Error al actualizar'; },
    });
  }

  marcarNoPresentado(cobro: CobroPartido): void {
    if (!cobro.id) { return; }
    const equipo = cobro.equipo?.nombre ?? 'equipo';
    const monto  = cobro.total ?? '';
    if (!confirm(
      `¿Confirmar que el equipo "${equipo}" NO SE PRESENTÓ?\n\n` +
      `Se creará una derrama automática de $${monto} que se descontará en sus próximas vocalías.`
    )) { return; }
    this.tesoreriaService.registrarNoPresentado(cobro.id).subscribe({
      next: (updated) => {
        const idx = this.cobros.findIndex((c) => c.id === cobro.id);
        if (idx >= 0) { this.cobros[idx] = updated; }
        this.exito = `Equipo "${equipo}" registrado como no presentado. Se generó una derrama automática.`;
        setTimeout(() => { this.exito = ''; }, 5000);
      },
      error: (err) => { this.error = err?.error?.message ?? 'Error al registrar'; },
    });
  }

  logout(): void { this.authService.logout(); }
}
