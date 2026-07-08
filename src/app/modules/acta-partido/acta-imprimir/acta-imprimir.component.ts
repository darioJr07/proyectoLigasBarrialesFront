import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActaPartidoService } from '../acta-partido.service';
import { TesoreriaService, ConfigVocaliaItem } from '../../../core/services/tesoreria.service';
import { SancionesService } from '../../sanciones/sanciones.service';
import { Sancion } from '../../sanciones/sancion.model';
import { DerramasService } from '../../../core/services/derramas.service';

@Component({
  selector: 'app-acta-imprimir',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './acta-imprimir.component.html',
  styleUrls: ['./acta-imprimir.component.scss'],
  providers: [DatePipe],
})
export class ActaImprimirComponent implements OnInit {
  readonly equiposVocalia: Array<'local' | 'visitante'> = ['local', 'visitante'];
  partidoId!: number;
  partido: any = null;
  jugadoresLocal: any[] = [];
  jugadoresVisitante: any[] = [];

  loading = true;
  error = '';

  /** Campo editable del vocal — pre-llenado desde el informe guardado, editable antes de imprimir */
  vocalEditable = '';

  /** Campo editable del árbitro — se escribe antes de imprimir, aparece en el Informe del Árbitro */
  arbitroEditable = '';

  /** Mínimo de filas visibles por equipo en la tabla de jugadores */
  readonly MIN_FILAS = 22;

  /** Valores predeterminados de la planilla vocalia (configurables por liga en el futuro) */
  readonly valoresVocalia = [
    { label: '1.-Valor Arbitraje',              valor: 9.00 },
    { label: '2.-Aporte a la Liga',             valor: 2.00 },
    { label: '3.-Valor premios',                valor: 2.00 },
    { label: '4.-Fondo de accidentes',          valor: 2.00 },
    { label: '5.-Limpieza y cuidado de baños',  valor: 1.00 },
    { label: '6.-TARJETAS TA / TR',             valor: null },
    { label: '7.-OTROS',                        valor: null },
  ];

  readonly filasExtrasVocalia = Array.from({ length: 5 });

  vocaliaLocal = {
    tarjetas: null as number | null,
    extras: Array.from({ length: 5 }, () => ({ detalle: '', valor: null as number | null })),
  };

  vocaliaVisitante = {
    tarjetas: null as number | null,
    extras: Array.from({ length: 5 }, () => ({ detalle: '', valor: null as number | null })),
  };

  /** Config de vocalía cargada del backend (vacía hasta que se cargue) */
  configVocalia: ConfigVocaliaItem[] = [];

  /** Estado del guardado de cobros en tesorería */
  guardandoCobros = false;
  cobrosGuardados: boolean | null = null;
  cobrosMensaje = '';
  /** true cuando al menos uno de los cobros ya fue marcado como pagado en tesorería */
  cobrosBloqueados = false;

  /** Sanciones aprobadas y no cobradas de cada equipo (se auto-cargan desde el backend) */
  sancionesLocal: Sancion[] = [];
  sancionesVisitante: Sancion[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private actaService: ActaPartidoService,
    private tesoreriaService: TesoreriaService,
    private sancionesService: SancionesService,
    private derramasService: DerramasService,
  ) {}

  ngOnInit(): void {
    this.partidoId = Number(this.route.snapshot.paramMap.get('partidoId'));
    this.cargarPlantilla();
    this.cargarVocal();
  }

  private cargarVocal(): void {
    this.actaService.obtenerInforme(this.partidoId).subscribe({
      next: (res) => {
        if (res.informe?.vocalNombre) {
          this.vocalEditable = res.informe.vocalNombre;
        }
        // Si no hay vocal guardado, se deja vacío para que el usuario lo escriba manualmente
      },
      error: () => { /* sin informe, se queda con valor por defecto */ },
    });
  }

  /**
   * La vista de impresión siempre intenta mostrar la plantilla COMPLETA de
   * jugadores habilitados (igual que el acta física).
   * Si por algún motivo no hay jugadores habilitados aún, cae automáticamente
   * a la alineación guardada para no dejar el acta vacía.
   */
  private cargarPlantilla(): void {
    this.actaService.obtenerJugadoresDisponibles(this.partidoId).subscribe({
      next: (res) => {
        this.partido = res.partido;
        this.cargarTesoreria();
        if (res.jugadoresLocal.length > 0 || res.jugadoresVisitante.length > 0) {
          this.jugadoresLocal     = this.ordenarPorNumero(res.jugadoresLocal);
          this.jugadoresVisitante = this.ordenarPorNumero(res.jugadoresVisitante);
          this.loading = false;
        } else {
          // No hay jugadores habilitados aún: usar la alineación guardada como respaldo
          this.cargarDesdeAlineacionGuardada();
        }
      },
      error: () => this.cargarDesdeAlineacionGuardada(),
    });
  }

  /** Fallback: carga la alineación ya guardada si no hay plantilla habilitada */
  private cargarDesdeAlineacionGuardada(): void {
    this.actaService.obtenerAlineacion(this.partidoId).subscribe({
      next: (res) => {
        this.partido = res.partido;
        this.cargarTesoreria();
        this.jugadoresLocal     = this.ordenarPorNumero(res.jugadoresLocal);
        this.jugadoresVisitante = this.ordenarPorNumero(res.jugadoresVisitante);
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Error al cargar los datos del partido';
        this.loading = false;
      },
    });
  }

  /** Ordena jugadores por número de camiseta (numeroCancha) de menor a mayor */
  private ordenarPorNumero(jugadores: any[]): any[] {
    return [...jugadores].sort((a, b) => (a.numeroCancha ?? 99) - (b.numeroCancha ?? 99));
  }

  /** Rellena con filas vacías hasta MIN_FILAS para que el acta siempre tenga suficiente espacio */
  get filasLocal(): (any | null)[] {
    const filas: (any | null)[] = [...this.jugadoresLocal];
    while (filas.length < this.MIN_FILAS) filas.push(null);
    return filas;
  }

  get filasVisitante(): (any | null)[] {
    const filas: (any | null)[] = [...this.jugadoresVisitante];
    while (filas.length < this.MIN_FILAS) filas.push(null);
    return filas;
  }

  // ── Helpers de datos ──────────────────────────────────────────────────────

  get ligaNombre(): string {
    return (this.partido?.campeonato?.liga?.nombre ?? '').toUpperCase();
  }

  get ligaLogo(): string {
    return this.partido?.campeonato?.liga?.imagen ?? '';
  }

  get ligaFundacion(): string {
    const f = this.partido?.campeonato?.liga?.fechaFundacion;
    if (!f) return '';
    // Extraer partes directamente para evitar desfase por zona horaria UTC
    const partes = String(f).split('T')[0].split('-').map(Number);
    const d = new Date(partes[0], partes[1] - 1, partes[2]);
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
  }

  get ligaUbicacion(): string {
    return (this.partido?.campeonato?.liga?.ubicacion ?? '').toUpperCase();
  }

  get categoriaNombre(): string {
    return (this.partido?.categoria?.nombre ?? '').toUpperCase();
  }

  get etapaLabel(): string {
    const e = this.partido?.etapa ?? '';
    return e.toUpperCase().replace(/_/g, ' ');
  }

  get fechaLabel(): string {
    const f = this.partido?.fechaPartido;
    if (!f) return '';
    const d = new Date(f + 'T12:00:00');
    return d.toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: '2-digit', year: '2-digit' }).toUpperCase();
  }

  get equipoLocalNombre(): string {
    return (this.partido?.equipoLocal?.nombre ?? '').toUpperCase();
  }

  get equipoVisitanteNombre(): string {
    return (this.partido?.equipoVisitante?.nombre ?? '').toUpperCase();
  }

  nombreJugador(fila: any): string {
    if (!fila) return '';
    const j = fila.jugador ?? fila;
    // El backend puede devolver el nombre en distintos formatos según el endpoint:
    // - campo 'nombre' (campo único en la entidad Jugador)
    // - campos 'apellidos' + 'nombres' (formato separado)
    // - campo 'nombreCompleto' (propiedad virtual)
    if (j.apellidos || j.nombres) {
      return `${j.apellidos ?? ''} ${j.nombres ?? ''}`.trim();
    }
    return (j.nombre ?? j.nombreCompleto ?? '').trim();
  }

  numeroCancha(fila: any): string {
    if (!fila) return '';
    return fila.numeroCancha != null ? String(fila.numeroCancha) : '';
  }

  /** Items fijos de vocalía: usa la config del backend si fue cargada, sino los valores por defecto */
  get vocaliaFixedItems(): Array<{ label: string; monto: number }> {
    if (this.configVocalia.length > 0) {
      return [...this.configVocalia]
        .filter((c) => c.activo)
        .sort((a, b) => a.orden - b.orden)
        .map((c) => ({ label: c.nombre, monto: Number(c.monto) }));
    }
    return this.valoresVocalia.slice(0, 5).map((v) => ({ label: v.label, monto: v.valor ?? 0 }));
  }

  get totalFijoVocalia(): number {
    return this.vocaliaFixedItems.reduce((sum, item) => sum + item.monto, 0);
  }

  getFilasVocalia(equipo: 'local' | 'visitante') {
    const vocalia = equipo === 'local' ? this.vocaliaLocal : this.vocaliaVisitante;
    const fixed   = this.vocaliaFixedItems;

    return [
      ...fixed.map((item) => ({ label: item.label, valor: item.monto })),
      { label: '6.-TARJETAS TA / TR', valor: vocalia.tarjetas },
      { label: '7.-OTROS',            valor: null },
      ...vocalia.extras.map((extra) => ({ label: extra.detalle, valor: extra.valor })),
    ];
  }

  getTotalVocalia(equipo: 'local' | 'visitante'): number {
    const vocalia     = equipo === 'local' ? this.vocaliaLocal : this.vocaliaVisitante;
    const totalExtras = vocalia.extras.reduce((sum, extra) => sum + (extra.valor ?? 0), 0);
    return this.totalFijoVocalia + (vocalia.tarjetas ?? 0) + totalExtras;
  }

  // ── Tesorería ────────────────────────────────────────────────────────────────────────────────────

  /** Carga config de vocalía, cobros previos y sanciones pendientes de cobro */
  private cargarTesoreria(): void {
    const ligaId = this.partido?.campeonato?.liga?.id ?? this.partido?.campeonato?.ligaId;
    if (!ligaId) { return; }
    this.cargarConfigVocalia(ligaId);
    this.cargarCobrosGuardados(ligaId);
  }

  private cargarConfigVocalia(ligaId: number): void {
    this.tesoreriaService.getConfigVocalia(ligaId).subscribe({
      next: (config) => { this.configVocalia = config; },
      error: () => { /* usa valores por defecto del array valoresVocalia */ },
    });
  }

  private cargarCobrosGuardados(ligaId: number): void {
    this.tesoreriaService.getCobrosDePartido(this.partidoId).subscribe({
      next: (cobros) => {
        if (cobros.length) {
          this.cobrosGuardados = true;
          // Si al menos uno ya fue cerrado (pagado o no presentado), bloquear edición
          this.cobrosBloqueados = cobros.some((c) => c.estado === 'pagado' || c.estado === 'no_presentado');
          cobros.forEach((cobro) => {
            const isLocal = this.partido?.equipoLocalId === cobro.equipoId
              || this.partido?.equipoLocal?.id === cobro.equipoId;
            const vocalia = isLocal ? this.vocaliaLocal : this.vocaliaVisitante;
            vocalia.tarjetas = cobro.montoTarjetas !== null && cobro.montoTarjetas !== undefined
              ? Number(cobro.montoTarjetas)
              : null;
            if (cobro.extrasJson?.length) {
              cobro.extrasJson.forEach((e, i) => {
                if (vocalia.extras[i]) {
                  vocalia.extras[i].detalle = e.detalle;
                  vocalia.extras[i].valor   = e.valor !== null && e.valor !== undefined ? Number(e.valor) : null;
                }
              });
            }
          });
        } else {
          // Sin cobros previos → auto-cargar sanciones pendientes de cobro
          this.cargarSancionesPendientes(ligaId);
        }
      },
      error: () => {
        // Sin cobros previos → auto-cargar sanciones pendientes de cobro
        this.cargarSancionesPendientes(ligaId);
      },
    });
  }

  /**
   * Carga las sanciones aprobadas y no cobradas para cada equipo.
   * Pre-llena el campo "Tarjetas" con la suma de sus multas.
   */
  private cargarSancionesPendientes(ligaId: number): void {
    const equipoLocalId     = this.partido?.equipoLocal?.id;
    const equipoVisitanteId = this.partido?.equipoVisitante?.id;
    if (!equipoLocalId || !equipoVisitanteId) { return; }

    this.sancionesService.getSancionesParaCobro(equipoLocalId, ligaId).subscribe({
      next: (sanciones) => {
        this.sancionesLocal = sanciones;
        const suma = sanciones.reduce((acc, s) => acc + Number(s.montoMulta ?? 0), 0);
        if (suma > 0) { this.vocaliaLocal.tarjetas = Math.round(suma * 100) / 100; }
      },
      error: () => {},
    });

    this.sancionesService.getSancionesParaCobro(equipoVisitanteId, ligaId).subscribe({
      next: (sanciones) => {
        this.sancionesVisitante = sanciones;
        const suma = sanciones.reduce((acc, s) => acc + Number(s.montoMulta ?? 0), 0);
        if (suma > 0) { this.vocaliaVisitante.tarjetas = Math.round(suma * 100) / 100; }
      },
      error: () => {},
    });

    // Pre-llenar slots de extras con derramas por_vocalia pendientes de cada equipo.
    // Esto permite al vocal ver y cobrar cuotas de derrama dentro del acta.
    const campeonatoId = this.partido?.campeonato?.id;
    if (campeonatoId) {
      this.cargarDerramasVocalia(campeonatoId, equipoLocalId,     this.vocaliaLocal);
      this.cargarDerramasVocalia(campeonatoId, equipoVisitanteId, this.vocaliaVisitante);
    }
  }

  /**
   * Carga las derramas modo 'por_vocalia' activas de un equipo y pre-rellena
   * los primeros slots vacíos del array extras con detalle + montoUnitario.
   * Si el slot ya tiene contenido, se respeta (el vocal puede haber llenado a mano).
   */
  private cargarDerramasVocalia(
    campeonatoId: number,
    equipoId: number,
    vocalia: { extras: Array<{ detalle: string; valor: number | null }> },
  ): void {
    this.derramasService.vocaliasActivas(campeonatoId, equipoId).subscribe({
      next: (derramas) => {
        let slotIdx = 0;
        for (const d of derramas) {
          // Avanzar hasta el primer slot vacío
          while (slotIdx < vocalia.extras.length && (vocalia.extras[slotIdx].detalle || vocalia.extras[slotIdx].valor !== null)) {
            slotIdx++;
          }
          if (slotIdx >= vocalia.extras.length) break;
          vocalia.extras[slotIdx].detalle = d.descripcion;
          vocalia.extras[slotIdx].valor   = Number(d.montoUnitario);
          slotIdx++;
        }
      },
      error: () => { /* Si falla, el vocal lo llena manualmente */ },
    });
  }

  /** Guarda los cobros de vocalía de ambos equipos en tesorería */
  guardarCobros(): void {
    const campeonato = this.partido?.campeonato;
    if (!campeonato) { return; }
    const ligaId = campeonato.liga?.id ?? campeonato.ligaId;
    const fixed  = this.vocaliaFixedItems;

    const buildCobro = (equipo: 'local' | 'visitante') => {
      const vocalia  = equipo === 'local' ? this.vocaliaLocal : this.vocaliaVisitante;
      const equipoId = equipo === 'local'
        ? this.partido.equipoLocal.id
        : this.partido.equipoVisitante.id;

      return {
        partidoId:            this.partidoId,
        equipoId,
        campeonatoId:         campeonato.id,
        ligaId,
        jornada:              this.partido.jornada ?? undefined,
        montoArbitraje:       fixed[0]?.monto ?? 9,
        montoAporteLiga:      fixed[1]?.monto ?? 2,
        montoPremios:         fixed[2]?.monto ?? 2,
        montoFondoAccidentes: fixed[3]?.monto ?? 2,
        montoLimpieza:        fixed[4]?.monto ?? 1,
        montoTarjetas:        vocalia.tarjetas ?? 0,
        extrasJson:           vocalia.extras.filter((e) => e.detalle || e.valor),
      };
    };

    this.guardandoCobros = true;
    this.cobrosMensaje   = '';

    this.tesoreriaService.guardarCobroPartido(buildCobro('local')).subscribe({
      next: () => {
        this.tesoreriaService.guardarCobroPartido(buildCobro('visitante')).subscribe({
          next: () => {
            // Marcar sanciones como cobradas (fire-and-forget, no bloquea el flujo)
            const idsACobrar = [
              ...this.sancionesLocal.map((s) => s.id),
              ...this.sancionesVisitante.map((s) => s.id),
            ].filter((id) => id != null);
            if (idsACobrar.length) {
              this.sancionesService.marcarCobradas(idsACobrar).subscribe();
              this.sancionesLocal     = [];
              this.sancionesVisitante = [];
            }
            this.guardandoCobros = false;
            this.cobrosGuardados = true;
            this.cobrosMensaje   = '¡Cobros guardados exitosamente!';
          },
          error: (err) => {
            this.guardandoCobros = false;
            this.cobrosMensaje   = err?.error?.message ?? 'Error al guardar cobro visitante';
          },
        });
      },
      error: (err) => {
        this.guardandoCobros = false;
        this.cobrosMensaje   = err?.error?.message ?? 'Error al guardar cobro local';
      },
    });
  }

  imprimir(): void {
    window.print();
  }

  volver(): void {
    this.router.navigate(['/partidos', this.partidoId, 'acta']);
  }
}
