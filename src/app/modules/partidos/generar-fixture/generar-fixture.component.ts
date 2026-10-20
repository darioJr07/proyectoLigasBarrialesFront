import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PartidosService } from '../partidos.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { AuthService } from '../../../core/services/auth.service';
import { LigasService } from '../../../core/services/ligas.service';
import { CampeonatosService } from '../../campeonatos/campeonatos.service';
import { CategoriasService } from '../../categorias/categorias.service';
import { InscripcionesService } from '../../inscripciones/inscripciones.service';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';
import { GenerarFixtureResponse } from '../partido.model';

@Component({
  selector: 'app-generar-fixture',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MainNavComponent],
  templateUrl: './generar-fixture.component.html',
  styleUrls: ['./generar-fixture.component.scss'],
})
export class GenerarFixtureComponent implements OnInit {
  fixtureForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  user$ = this.authService.currentUser$;

  ligas: any[] = [];
  campeonatos: any[] = [];
  categorias: any[] = [];
  equiposDisponibles: any[] = [];
  equiposSeleccionados: number[] = [];
  grupoPorEquipo: Record<number, '' | 'A' | 'B'> = {};
  puntosInicialesPorEquipo: Record<number, number> = {};
  motivoBonificacionPorEquipo: Record<number, string> = {};
  origenBonificacionPorEquipo: Record<number, string> = {};
  posicionOrigenPorEquipo: Record<number, number | null> = {};

  fixtureGenerado: GenerarFixtureResponse | null = null;
  jornadaActiva = 1;

  constructor(
    private fb: FormBuilder,
    private partidosService: PartidosService,
    private ligasService: LigasService,
    private campeonatosService: CampeonatosService,
    private categoriasService: CategoriasService,
    private inscripcionesService: InscripcionesService,
    public permissions: PermissionsService,
    private authService: AuthService,
    private router: Router
  ) {
    this.fixtureForm = this.fb.group({
      ligaId: ['', Validators.required],
      campeonatoId: ['', Validators.required],
      categoriaId: ['', Validators.required],
      etapa: ['Fase Regular', [Validators.required, Validators.maxLength(50)]],
      conRevancha: [false],
      formato: ['tabla_unica', Validators.required],
      marcarComoActual: [true],
    });
  }

  ngOnInit(): void {
    if (!this.permissions.canGenerarFixture()) {
      this.router.navigate(['/partidos']);
      return;
    }
    this.loadLigas();

    // Reaccionar a cambios en cascada
    this.fixtureForm.get('ligaId')?.valueChanges.subscribe((ligaId) => {
      this.campeonatos = [];
      this.categorias = [];
      this.equiposDisponibles = [];
      this.equiposSeleccionados = [];
      this.reiniciarConfiguracionGrupos();
      this.fixtureForm.patchValue({ campeonatoId: '', categoriaId: '' });
      if (ligaId) this.loadCampeonatos(ligaId);
    });

    this.fixtureForm.get('campeonatoId')?.valueChanges.subscribe((campeonatoId) => {
      this.categorias = [];
      this.equiposDisponibles = [];
      this.equiposSeleccionados = [];
      this.reiniciarConfiguracionGrupos();
      this.fixtureForm.patchValue({ categoriaId: '' });
      if (campeonatoId) this.loadCategorias(campeonatoId);
    });

    this.fixtureForm.get('categoriaId')?.valueChanges.subscribe((categoriaId) => {
      this.equiposDisponibles = [];
      this.equiposSeleccionados = [];
      this.reiniciarConfiguracionGrupos();
      if (categoriaId) this.loadEquipasPorCategoria(categoriaId);
    });
  }

  loadLigas(): void {
    this.ligasService.getAll().subscribe({
      next: (data) => {
        this.ligas = data;
        const user = this.authService.getCurrentUser();
        if (user?.rol?.nombre === 'directivo_liga' && user.ligaId) {
          this.fixtureForm.patchValue({ ligaId: user.ligaId });
          this.fixtureForm.get('ligaId')?.disable();
        }
      },
      error: () => (this.errorMessage = 'Error al cargar las ligas'),
    });
  }

  loadCampeonatos(ligaId: number): void {
    this.campeonatosService.getByLiga(ligaId).subscribe({
      next: (data) => (this.campeonatos = data),
      error: () => (this.errorMessage = 'Error al cargar los campeonatos'),
    });
  }

  loadCategorias(campeonatoId: number): void {
    this.categoriasService.getByCampeonato(campeonatoId).subscribe({
      next: (data) => (this.categorias = data),
      error: () => (this.errorMessage = 'Error al cargar las categorías'),
    });
  }

  loadEquipasPorCategoria(categoriaId: number): void {
    this.inscripcionesService.getByCategoria(categoriaId).subscribe({
      next: (inscripciones) => {
        // Extraer equipos únicos de las inscripciones confirmadas
        const seen = new Set<number>();
        this.equiposDisponibles = inscripciones
          .filter((i) => i.estado === 'confirmada' && i.equipo)
          .filter((i) => {
            if (seen.has(i.equipoId)) return false;
            seen.add(i.equipoId);
            return true;
          })
          .map((i) => i.equipo);
      },
      error: () => (this.errorMessage = 'Error al cargar los equipos inscritos'),
    });
  }

  toggleEquipo(equipoId: number): void {
    const idx = this.equiposSeleccionados.indexOf(equipoId);
    if (idx === -1) {
      this.equiposSeleccionados.push(equipoId);
      this.grupoPorEquipo[equipoId] = '';
    } else {
      this.equiposSeleccionados.splice(idx, 1);
      delete this.grupoPorEquipo[equipoId];
      delete this.puntosInicialesPorEquipo[equipoId];
      delete this.motivoBonificacionPorEquipo[equipoId];
      delete this.origenBonificacionPorEquipo[equipoId];
      delete this.posicionOrigenPorEquipo[equipoId];
    }
  }

  isEquipoSeleccionado(equipoId: number): boolean {
    return this.equiposSeleccionados.includes(equipoId);
  }

  getOrdenSeleccion(equipoId: number): number | null {
    const index = this.equiposSeleccionados.indexOf(equipoId);
    return index === -1 ? null : index + 1;
  }

  get equiposSeleccionadosDetalle(): any[] {
    return this.equiposSeleccionados
      .map((equipoId) => this.equiposDisponibles.find((equipo) => equipo.id === equipoId))
      .filter((equipo): equipo is any => !!equipo);
  }

  seleccionarTodos(): void {
    this.equiposSeleccionados = this.equiposDisponibles.map((e) => e.id);
    this.equiposSeleccionados.forEach(id => this.grupoPorEquipo[id] ??= '');
  }

  deseleccionarTodos(): void {
    this.equiposSeleccionados = [];
    this.reiniciarConfiguracionGrupos();
  }

  private reiniciarConfiguracionGrupos(): void {
    this.grupoPorEquipo = {};
    this.puntosInicialesPorEquipo = {};
    this.motivoBonificacionPorEquipo = {};
    this.origenBonificacionPorEquipo = {};
    this.posicionOrigenPorEquipo = {};
  }

  get jornadasFixture(): number[] {
    if (!this.fixtureGenerado) return [];
    return Array.from({ length: this.fixtureGenerado.totalJornadas }, (_, i) => i + 1);
  }

  get partidosJornadaActiva() {
    return this.fixtureGenerado?.partidos.filter((p) => p.jornada === this.jornadaActiva) ?? [];
  }

  getEquipoNombre(id: number | null | undefined): string {
    if (!id) return 'BYE';
    const equipo = this.equiposDisponibles.find((e) => e.id === id);
    return equipo?.nombre ?? `Equipo #${id}`;
  }

  get esLiguilla(): boolean {
    return this.fixtureForm.get('formato')?.value === 'grupos_cruce_descansos';
  }

  get grupoAIds(): number[] { return this.equiposSeleccionados.filter(id => this.grupoPorEquipo[id] === 'A'); }
  get grupoBIds(): number[] { return this.equiposSeleccionados.filter(id => this.grupoPorEquipo[id] === 'B'); }

  puedeGenerar(): boolean {
    if (this.loading || this.fixtureForm.invalid || this.equiposSeleccionados.length < 2) return false;
    if (!this.esLiguilla) return true;
    return this.grupoAIds.length + this.grupoBIds.length === this.equiposSeleccionados.length
      && this.grupoAIds.length >= 3
      && this.grupoAIds.length === this.grupoBIds.length
      && this.grupoAIds.length % 2 !== 0;
  }

  onSubmit(): void {
    if (!this.puedeGenerar()) {
      this.errorMessage = this.esLiguilla
        ? 'Asigna todos los equipos en dos grupos iguales, con una cantidad impar mínima de 3 por grupo.'
        : 'Debes seleccionar al menos 2 equipos y completar todos los campos.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.fixtureGenerado = null;

    const formValue = this.fixtureForm.getRawValue();
    const crearGrupo = (nombre: string, ids: number[]) => ({
      nombre,
      equipos: ids.map(equipoId => {
        const puntos = Number(this.puntosInicialesPorEquipo[equipoId] ?? 0);
        return {
          equipoId,
          bonificaciones: puntos > 0 ? [{
            puntos,
            etapaOrigen: this.origenBonificacionPorEquipo[equipoId]?.trim() || undefined,
            posicionOrigen: this.posicionOrigenPorEquipo[equipoId] || undefined,
            motivo: this.motivoBonificacionPorEquipo[equipoId]?.trim() || 'Puntos favorables por clasificación',
          }] : [],
        };
      }),
    });
    this.partidosService
      .generarFixture({
        campeonatoId: +formValue.campeonatoId,
        categoriaId: +formValue.categoriaId,
        equipoIds: this.esLiguilla ? undefined : [...this.equiposSeleccionados],
        etapa: formValue.etapa,
        conRevancha: formValue.conRevancha,
        formato: formValue.formato,
        marcarComoActual: formValue.marcarComoActual,
        grupos: this.esLiguilla ? [crearGrupo('Grupo A', this.grupoAIds), crearGrupo('Grupo B', this.grupoBIds)] : undefined,
      })
      .subscribe({
        next: (res) => {
          this.fixtureGenerado = res;
          this.jornadaActiva = 1;
          this.successMessage = `¡Fixture generado! ${res.totalPartidos} partidos en ${res.totalJornadas} jornadas.`;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Error al generar el fixture.';
          this.loading = false;
        },
      });
  }

  verFixture(): void {
    const v = this.fixtureForm.getRawValue();
    this.router.navigate(['/partidos/fixture'], {
      queryParams: {
        campeonatoId: v.campeonatoId,
        categoriaId: v.categoriaId,
        etapa: v.etapa,
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
