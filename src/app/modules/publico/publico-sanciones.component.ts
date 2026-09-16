import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PublicoService, SancionPublica } from './publico.service';

@Component({ selector: 'app-publico-sanciones', templateUrl: './publico-sanciones.component.html', styleUrls: ['./publico.component.scss'] })
export class PublicoSancionesComponent implements OnInit {
  ligaId = 0; campeonatoId = 0; sanciones: SancionPublica[] = []; cargando = true; error = '';
  vistaSanciones: 'jugadores' | 'colectivas' = 'jugadores';
  constructor(private readonly route: ActivatedRoute, private readonly publicoService: PublicoService) {}
  ngOnInit(): void {
    this.ligaId = Number(this.route.snapshot.paramMap.get('ligaId')); this.campeonatoId = Number(this.route.snapshot.paramMap.get('campeonatoId'));
    if (!this.ligaId || !this.campeonatoId) { this.error = 'Campeonato no válido.'; this.cargando = false; return; }
    this.publicoService.listarSanciones(this.campeonatoId).subscribe({ next: sanciones => {
      this.sanciones = sanciones;
      if (!this.sancionesJugadores.length && this.sancionesGenerales.length) this.vistaSanciones = 'colectivas';
      this.cargando = false;
    }, error: () => { this.error = 'No se pudieron cargar las sanciones activas.'; this.cargando = false; } });
  }
  etiqueta(destino: SancionPublica['destino']): string { return ({ jugador: 'Jugador', equipo: 'Equipo', barra: 'Barra', directivo: 'Directivo' })[destino]; }
  cumplimiento(sancion: SancionPublica): string { if (sancion.fechaFinSuspension) return `Hasta ${new Intl.DateTimeFormat('es-EC').format(new Date(sancion.fechaFinSuspension))}`; if (sancion.partidosPendientes !== null && sancion.partidosPendientes !== undefined) return `${sancion.partidosPendientes} partido${sancion.partidosPendientes === 1 ? '' : 's'} pendiente${sancion.partidosPendientes === 1 ? '' : 's'}`; if (sancion.contadorLimite) return `${sancion.contadorActual ?? 0}/${sancion.contadorLimite}`; return 'Sanción activa'; }
  get sancionesJugadores(): SancionPublica[] { return this.sanciones.filter(sancion => sancion.destino === 'jugador'); }
  descuento(sancion: SancionPublica): string {
    return sancion.puntosDescuentoAplicado > 0 ? `Descuento: -${sancion.puntosDescuentoAplicado} pts` : '';
  }
  /**
   * Las sanciones colectivas son registros históricos que alimentan un mismo
   * contador. El portal publica una sola tarjeta por equipo, destino y tipo.
   */
  get sancionesGenerales(): SancionPublica[] {
    const agrupadas = new Map<string, SancionPublica>();

    for (const sancion of this.sanciones.filter(item => item.destino !== 'jugador')) {
      const referencia = sancion.equipo?.id ?? sancion.sancionado.trim().toLocaleLowerCase('es');
      const clave = `${sancion.destino}:${referencia}:${sancion.tipo.trim().toLocaleLowerCase('es')}`;
      const existente = agrupadas.get(clave);
      if (!existente || sancion.id > existente.id) agrupadas.set(clave, sancion);
    }

    return [...agrupadas.values()];
  }
  sancionesPorTipo(destino: 'equipo' | 'barra' | 'directivo'): SancionPublica[] {
    return this.sancionesGenerales.filter(sancion => sancion.destino === destino).sort((a, b) => a.tipo.localeCompare(b.tipo) || b.id - a.id);
  }
}
