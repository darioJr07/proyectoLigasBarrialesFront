import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { CampeonatoPublico, CategoriaPublica, FilaPosicionPublica, GoleadorPublico, LigaPublica, PartidoDestacadoPublico, PartidoPublico, PublicoService, SancionPublica } from './publico.service';

@Component({
  selector: 'app-publico-liga',
  templateUrl: './publico-liga.component.html',
  styleUrls: ['./publico.component.scss'],
})
export class PublicoLigaComponent implements OnInit, OnDestroy {
  @ViewChild('listaDestacados') listaDestacados?: ElementRef<HTMLElement>;
  liga?: LigaPublica;
  campeonatos: CampeonatoPublico[] = [];
  campeonatoSeleccionado?: CampeonatoPublico;
  categorias: CategoriaPublica[] = [];
  categoriaId: number | null = null;
  etapa = '';
  tabla: FilaPosicionPublica[] = [];
  tablasGenerales: { categoria: CategoriaPublica; tabla: FilaPosicionPublica[] }[] = [];
  goleadores: GoleadorPublico[] = [];
  goleadoresGenerales: { categoria: CategoriaPublica; goleadores: GoleadorPublico[] }[] = [];
  sanciones: SancionPublica[] = [];
  resultados: PartidoPublico[] = [];
  partidosDestacados: PartidoDestacadoPublico[] = [];
  private desplazamientoAutomatico?: ReturnType<typeof setInterval>;
  resultadosGenerales: (PartidoPublico & { categoriaNombre: string })[] = [];
  jornadaResultados = 0;
  cargando = true;
  cargandoResumen = false;
  error = '';

  constructor(private readonly route: ActivatedRoute, private readonly publicoService: PublicoService) {}

  ngOnInit(): void {
    const ligaId = Number(this.route.snapshot.paramMap.get('ligaId'));
    if (!ligaId) { this.error = 'Liga no válida.'; this.cargando = false; return; }

    this.publicoService.listarLigas().subscribe({
      next: ligas => {
        this.liga = ligas.find(liga => liga.id === ligaId);
        if (!this.liga) { this.error = 'Liga pública no encontrada.'; this.cargando = false; return; }
        this.publicoService.listarPartidosDestacados(ligaId).subscribe({ next: partidos => { this.partidosDestacados = partidos; setTimeout(() => this.iniciarDesplazamientoAutomatico()); } });
        this.publicoService.listarCampeonatos(ligaId).subscribe({
          next: campeonatos => {
            this.campeonatos = campeonatos;
            this.cargando = false;
            if (campeonatos.length) this.seleccionarCampeonato(campeonatos[0]);
          },
          error: () => { this.error = 'No se pudo cargar el campeonato.'; this.cargando = false; },
        });
      },
      error: () => { this.error = 'No se pudo cargar la liga.'; this.cargando = false; },
    });
  }

  seleccionarCampeonato(campeonato: CampeonatoPublico): void {
    this.campeonatoSeleccionado = campeonato;
    this.categorias = []; this.tabla = []; this.goleadores = []; this.goleadoresGenerales = []; this.sanciones = []; this.resultados = []; this.resultadosGenerales = [];
    this.error = ''; this.cargandoResumen = true;
    this.publicoService.listarCategorias(campeonato.id).subscribe({
      next: categorias => {
        this.categorias = categorias;
        this.categoriaId = null;
        if (!categorias.length) { this.cargandoResumen = false; return; }
        this.cargarResumenGeneral();
      },
      error: () => this.fallar('No se pudieron cargar las categorías del campeonato.'),
    });
  }

  seleccionarCategoria(categoriaId: number | null): void {
    if (categoriaId === this.categoriaId) return;
    this.categoriaId = categoriaId;
    categoriaId === null ? this.cargarResumenGeneral() : this.cargarResumenCategoria();
  }

  marcador(partido: PartidoPublico): string {
    return partido.estado === 'jugado' ? `${partido.golesLocal ?? 0} - ${partido.golesVisitante ?? 0}` : partido.estado === 'suspendido' ? 'SUSP.' : 'VS';
  }
  etiquetaDestacado(partido: PartidoDestacadoPublico): string { return partido.estado === 'en_juego' ? 'EN JUEGO' : 'PRÓXIMO'; }
  moverDestacados(direccion: number): void { this.listaDestacados?.nativeElement.scrollBy({ left: direccion * 540, behavior: 'smooth' }); }
  pausarDestacados(): void { if (this.desplazamientoAutomatico) clearInterval(this.desplazamientoAutomatico); this.desplazamientoAutomatico = undefined; }
  reanudarDestacados(): void { this.iniciarDesplazamientoAutomatico(); }
  ngOnDestroy(): void { this.pausarDestacados(); }

  private iniciarDesplazamientoAutomatico(): void {
    this.pausarDestacados();
    if (!this.listaDestacados || this.partidosDestacados.length < 2) return;
    this.desplazamientoAutomatico = setInterval(() => {
      const lista = this.listaDestacados?.nativeElement;
      if (!lista) return;
      const llegoAlFinal = lista.scrollLeft + lista.clientWidth >= lista.scrollWidth - 8;
      if (llegoAlFinal) lista.scrollTo({ left: 0, behavior: 'smooth' });
      else lista.scrollBy({ left: 262, behavior: 'smooth' });
    }, 4000);
  }

  cumplimiento(sancion: SancionPublica): string {
    if (sancion.partidosPendientes != null) return `${sancion.partidosPendientes} partido${sancion.partidosPendientes === 1 ? '' : 's'} pendiente${sancion.partidosPendientes === 1 ? '' : 's'}`;
    return sancion.fechaFinSuspension ? `Hasta ${sancion.fechaFinSuspension}` : 'Sanción activa';
  }

  nombreCorto(nombreCompleto: string): string {
    const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
    if (partes.length <= 2) return nombreCompleto;
    // Convención habitual: nombres + apellido paterno + apellido materno.
    // Con cuatro o más palabras, el penúltimo corresponde al primer apellido.
    const primerApellido = partes.length >= 4 ? partes[partes.length - 2] : partes[partes.length - 1];
    return `${partes[0]} ${primerApellido}`;
  }

  private cargarResumenCategoria(): void {
    const categoriaId = this.categoriaId;
    if (!this.campeonatoSeleccionado || !categoriaId) return;
    this.cargandoResumen = true; this.error = '';
    const campeonatoId = this.campeonatoSeleccionado.id;
    this.publicoService.listarEtapas(campeonatoId, categoriaId).subscribe({
      next: etapas => {
        this.etapa = etapas[0] ?? '';
        if (!this.etapa) { this.cargandoResumen = false; return; }
        forkJoin({
          tabla: this.publicoService.consultarPosiciones(campeonatoId, categoriaId, this.etapa),
          goleadores: this.publicoService.listarGoleadores(campeonatoId, categoriaId),
          sanciones: this.publicoService.listarSanciones(campeonatoId),
          jornadas: this.publicoService.listarJornadas(campeonatoId, categoriaId, this.etapa),
        }).subscribe({
          next: resumen => {
            this.tabla = resumen.tabla;
            this.goleadores = resumen.goleadores.slice(0, 15);
            this.sanciones = this.ordenarSanciones(resumen.sanciones).slice(0, 6);
            this.obtenerUltimaJornadaConResultados(campeonatoId, categoriaId, this.etapa, resumen.jornadas).subscribe({
              next: resultado => { this.jornadaResultados = resultado.jornada; this.resultados = resultado.partidos.slice(0, 6); this.cargandoResumen = false; },
              error: () => this.fallar('No se pudieron cargar los resultados recientes.'),
            });
          },
          error: () => this.fallar('No se pudo cargar el resumen del campeonato.'),
        });
      },
      error: () => this.fallar('No se pudieron cargar las etapas del campeonato.'),
    });
  }

  /** La pestaña General conserva cada categoría en su propia tabla, sin sumar puntos entre ellas. */
  private cargarResumenGeneral(): void {
    if (!this.campeonatoSeleccionado || !this.categorias.length) return;
    this.cargandoResumen = true; this.error = ''; this.tabla = []; this.goleadores = []; this.goleadoresGenerales = []; this.sanciones = []; this.resultados = []; this.resultadosGenerales = [];
    const campeonatoId = this.campeonatoSeleccionado.id;
    forkJoin(this.categorias.map(categoria => this.publicoService.listarEtapas(campeonatoId, categoria.id))).subscribe({
      next: etapasPorCategoria => {
        const categoriasConEtapa = this.categorias
          .map((categoria, indice) => ({ categoria, etapa: etapasPorCategoria[indice][0] }))
          .filter((item): item is { categoria: CategoriaPublica; etapa: string } => Boolean(item.etapa));
        if (!categoriasConEtapa.length) { this.tablasGenerales = []; this.cargandoResumen = false; return; }
        forkJoin(categoriasConEtapa.map(item => this.publicoService.consultarPosiciones(campeonatoId, item.categoria.id, item.etapa))).subscribe({
          next: tablas => {
            this.tablasGenerales = categoriasConEtapa.map((item, indice) => ({ categoria: item.categoria, tabla: tablas[indice] }));
            forkJoin(categoriasConEtapa.map(item => this.publicoService.listarGoleadores(campeonatoId, item.categoria.id))).subscribe({
              next: goleadores => { this.goleadoresGenerales = categoriasConEtapa.map((item, indice) => ({ categoria: item.categoria, goleadores: goleadores[indice].slice(0, 15) })); },
            });
            this.publicoService.listarSanciones(campeonatoId).subscribe({ next: sanciones => this.sanciones = this.ordenarSanciones(sanciones).slice(0, 12) });
            forkJoin(categoriasConEtapa.map(item =>
              this.publicoService.listarJornadas(campeonatoId, item.categoria.id, item.etapa).pipe(
                switchMap(jornadas => this.obtenerUltimaJornadaConResultados(campeonatoId, item.categoria.id, item.etapa, jornadas)),
                map(resultado => resultado.partidos.map(partido => ({ ...partido, categoriaNombre: item.categoria.nombre }))),
              ),
            )).subscribe({
              next: grupos => {
                this.resultadosGenerales = grupos.reduce((acumulado, grupo) => acumulado.concat(grupo), [] as (PartidoPublico & { categoriaNombre: string })[])
                  .sort((a, b) => this.fechaHoraPartido(b).localeCompare(this.fechaHoraPartido(a)));
                this.cargandoResumen = false;
              },
              error: () => this.fallar('No se pudieron cargar los resultados generales.'),
            });
          },
          error: () => this.fallar('No se pudieron cargar las tablas generales.'),
        });
      },
      error: () => this.fallar('No se pudieron cargar las categorías generales.'),
    });
  }

  private obtenerUltimaJornadaConResultados(campeonatoId: number, categoriaId: number, etapa: string, jornadas: number[]) {
    if (!jornadas.length) return of({ jornada: 0, partidos: [] as PartidoPublico[] });
    const ordenadas = [...jornadas].sort((a, b) => b - a);
    return forkJoin(ordenadas.map(jornada => this.publicoService.listarPartidos(campeonatoId, categoriaId, etapa, jornada))).pipe(
      map(grupos => {
        const indice = grupos.findIndex(partidos => partidos.some(partido => partido.estado === 'jugado'));
        return { jornada: indice >= 0 ? ordenadas[indice] : 0, partidos: indice >= 0 ? grupos[indice] : [] };
      }),
    );
  }

  private fechaHoraPartido(partido: PartidoPublico): string {
    return `${partido.fechaPartido ?? '0000-00-00'}T${partido.horaPartido ?? '00:00'}`;
  }

  private ordenarSanciones(sanciones: SancionPublica[]): SancionPublica[] {
    return [...sanciones].sort((a, b) => Number(b.destino === 'jugador') - Number(a.destino === 'jugador'));
  }

  private fallar(mensaje: string): void { this.error = mensaje; this.cargandoResumen = false; }
}
