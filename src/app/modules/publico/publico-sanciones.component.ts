import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PublicoService, SancionPublica } from './publico.service';

@Component({ selector: 'app-publico-sanciones', templateUrl: './publico-sanciones.component.html', styleUrls: ['./publico.component.scss'] })
export class PublicoSancionesComponent implements OnInit {
  ligaId = 0; campeonatoId = 0; sanciones: SancionPublica[] = []; cargando = true; error = '';
  constructor(private readonly route: ActivatedRoute, private readonly publicoService: PublicoService) {}
  ngOnInit(): void {
    this.ligaId = Number(this.route.snapshot.paramMap.get('ligaId')); this.campeonatoId = Number(this.route.snapshot.paramMap.get('campeonatoId'));
    if (!this.ligaId || !this.campeonatoId) { this.error = 'Campeonato no válido.'; this.cargando = false; return; }
    this.publicoService.listarSanciones(this.campeonatoId).subscribe({ next: sanciones => { this.sanciones = sanciones; this.cargando = false; }, error: () => { this.error = 'No se pudieron cargar las sanciones activas.'; this.cargando = false; } });
  }
  etiqueta(destino: SancionPublica['destino']): string { return ({ jugador: 'Jugador', equipo: 'Equipo', barra: 'Barra', directivo: 'Directivo' })[destino]; }
  cumplimiento(sancion: SancionPublica): string { if (sancion.fechaFinSuspension) return `Hasta ${new Intl.DateTimeFormat('es-EC').format(new Date(sancion.fechaFinSuspension))}`; if (sancion.partidosPendientes !== null && sancion.partidosPendientes !== undefined) return `${sancion.partidosPendientes} partido${sancion.partidosPendientes === 1 ? '' : 's'} pendiente${sancion.partidosPendientes === 1 ? '' : 's'}`; return 'Sanción activa'; }
  get sancionesJugadores(): SancionPublica[] { return this.sanciones.filter(sancion => sancion.destino === 'jugador'); }
  get sancionesGenerales(): SancionPublica[] { return this.sanciones.filter(sancion => sancion.destino !== 'jugador'); }
}
