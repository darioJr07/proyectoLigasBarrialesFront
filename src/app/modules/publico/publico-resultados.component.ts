import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoriaPublica, PartidoPublico, PublicoService } from './publico.service';

@Component({ selector: 'app-publico-resultados', templateUrl: './publico-resultados.component.html', styleUrls: ['./publico.component.scss'] })
export class PublicoResultadosComponent implements OnInit {
  ligaId = 0; campeonatoId = 0; categorias: CategoriaPublica[] = []; etapas: string[] = []; jornadas: number[] = [];
  categoriaId = 0; etapa = ''; jornada = 0; partidos: PartidoPublico[] = []; cargando = true; error = '';

  constructor(private readonly route: ActivatedRoute, private readonly publicoService: PublicoService) {}

  ngOnInit(): void {
    this.ligaId = Number(this.route.snapshot.paramMap.get('ligaId')); this.campeonatoId = Number(this.route.snapshot.paramMap.get('campeonatoId'));
    if (!this.ligaId || !this.campeonatoId) { this.error = 'Campeonato no válido.'; this.cargando = false; return; }
    this.publicoService.listarCategorias(this.campeonatoId).subscribe({
      next: categorias => { this.categorias = categorias; if (!categorias.length) { this.cargando = false; return; } this.categoriaId = categorias[0].id; this.cargarEtapas(); },
      error: () => this.fallar('No se pudieron cargar las categorías.'),
    });
  }

  cambiarCategoria(valor: string): void { this.categoriaId = Number(valor); this.partidos = []; this.cargarEtapas(); }
  cambiarEtapa(valor: string): void { this.etapa = valor; this.partidos = []; this.cargarJornadas(); }
  cambiarJornada(valor: string): void { this.jornada = Number(valor); this.cargarPartidos(); }
  marcador(partido: PartidoPublico): string { return partido.estado === 'jugado' ? `${partido.golesLocal ?? 0} - ${partido.golesVisitante ?? 0}` : partido.estado === 'suspendido' ? 'SUSP.' : 'VS'; }

  private cargarEtapas(): void {
    this.cargando = true;
    this.publicoService.listarEtapas(this.campeonatoId, this.categoriaId).subscribe({
      next: etapas => { this.etapas = etapas; this.etapa = etapas[0] ?? ''; this.etapa ? this.cargarJornadas() : this.cargando = false; },
      error: () => this.fallar('No se pudieron cargar las etapas.'),
    });
  }
  private cargarJornadas(): void {
    this.cargando = true;
    this.publicoService.listarJornadas(this.campeonatoId, this.categoriaId, this.etapa).subscribe({
      next: jornadas => { this.jornadas = jornadas; this.jornada = jornadas[0] ?? 0; this.jornada ? this.cargarPartidos() : this.cargando = false; },
      error: () => this.fallar('No se pudieron cargar las jornadas.'),
    });
  }
  private cargarPartidos(): void {
    this.cargando = true;
    this.publicoService.listarPartidos(this.campeonatoId, this.categoriaId, this.etapa, this.jornada).subscribe({ next: partidos => { this.partidos = partidos; this.cargando = false; }, error: () => this.fallar('No se pudieron cargar los partidos.') });
  }
  private fallar(mensaje: string): void { this.error = mensaje; this.cargando = false; }
}
