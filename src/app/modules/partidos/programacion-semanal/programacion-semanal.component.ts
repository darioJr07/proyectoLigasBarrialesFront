import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';
import { LigasService } from '../../../core/services/ligas.service';
import { CampeonatosService } from '../../campeonatos/campeonatos.service';
import { CategoriasService } from '../../categorias/categorias.service';
import { PartidosService } from '../partidos.service';
import { BolillaHorario, ProgramacionSemanal } from '../partido.model';
import { ProgramacionSemanalExport, ProgramacionSemanalExportService } from './programacion-semanal-export.service';

@Component({ selector: 'app-programacion-semanal', standalone: true, imports: [CommonModule, FormsModule, RouterLink, MainNavComponent], templateUrl: './programacion-semanal.component.html', styleUrls: ['./programacion-semanal.component.scss'] })
export class ProgramacionSemanalComponent implements OnInit {
  ligas: any[] = []; campeonatos: any[] = []; categorias: any[] = [];
  ligaId: number | null = null; campeonatoId: number | null = null; categoriaId: number | null = null;
  etapa = ''; jornada: number | null = null; fecha = ''; cancha = ''; horaInicio = '07:30'; horaFin = '16:30'; intervalo = 90;
  bolillas: BolillaHorario[] = []; sesion: ProgramacionSemanal | null = null; partidoSeleccionadoId: number | null = null;
  bolillaManualId: number | null = null;
  cargando = false; sorteando = false; confirmando = false; error = ''; exito = ''; ultimaBolilla: any = null;
  partidosProgramables: any[] = []; etapasDisponibles: string[] = []; jornadasDisponibles: number[] = [];
  user$: Observable<any>;
  esMaster = false;
  constructor(private readonly ligasService: LigasService, private readonly campeonatosService: CampeonatosService, private readonly categoriasService: CategoriasService, private readonly partidosService: PartidosService, private readonly authService: AuthService, private readonly exportador: ProgramacionSemanalExportService) { this.user$ = authService.currentUser$; }
  ngOnInit(): void {
    const usuario = this.authService.getCurrentUser();
    this.esMaster = usuario?.rol?.nombre === 'master';

    this.ligasService.getAll().subscribe(l => this.ligas = l);
    if (this.esMaster) return;

    if (usuario?.ligaId) {
      this.ligaId = usuario.ligaId;
      this.cambiarLiga();
      return;
    }

    this.error = 'Tu usuario no tiene una liga asignada para realizar la programación semanal.';
  }
  cambiarLiga(): void { this.campeonatos = []; this.categorias = []; this.campeonatoId = null; if (this.ligaId) this.campeonatosService.getByLiga(this.ligaId).subscribe(c => this.campeonatos = c); }
  cambiarCampeonato(): void { this.categorias = []; this.categoriaId = null; this.etapa = ''; this.jornada = null; this.partidosProgramables = []; if (this.campeonatoId) { this.categoriasService.getByCampeonato(this.campeonatoId).subscribe(c => this.categorias = c); this.cargarOpcionesProgramables(); } }
  cambiarCategoria(): void { this.etapa = ''; this.jornada = null; this.cargarOpcionesProgramables(); }
  cambiarEtapa(): void { this.jornada = null; this.jornadasDisponibles = [...new Set(this.partidosProgramables.filter(p => p.etapa === this.etapa).map(p => p.jornada))].sort((a, b) => a - b); }
  generarBolillas(): void {
    this.error = ''; const inicio = this.minutos(this.horaInicio), fin = this.minutos(this.horaFin);
    const canchas = this.canchasDetectadas.length ? this.canchasDetectadas : this.cancha.trim() ? [this.cancha.trim()] : [];
    if (!this.fecha || !canchas.length || inicio === null || fin === null || inicio > fin || this.intervalo < 1) { this.error = 'Completa fecha, cancha, horas e intervalo válidos.'; return; }
    const nuevas: BolillaHorario[] = [];
    for (const cancha of canchas) for (let minuto = inicio; minuto <= fin; minuto += this.intervalo) nuevas.push({ fecha: this.fecha, hora: this.hora(minuto), cancha });
    const existeBolillaRepetida = nuevas.some(nueva => this.bolillas.some(actual =>
      actual.fecha === nueva.fecha && actual.hora === nueva.hora && actual.cancha.trim().toLowerCase() === nueva.cancha.trim().toLowerCase()
    ));
    if (existeBolillaRepetida) { this.error = 'Ya agregaste horarios para esa fecha, hora y cancha. Cambia la fecha o elimina las bolillas repetidas.'; return; }
    this.bolillas = [...this.bolillas, ...nuevas];
  }
  quitarBolilla(indice: number): void { this.bolillas.splice(indice, 1); }
  iniciar(): void {
    this.error = ''; this.exito = '';
    if (!this.campeonatoId || !this.etapa.trim() || !this.jornada) { this.error = 'Selecciona campeonato, etapa y jornada.'; return; }
    this.cargando = true;
    this.partidosService.obtenerProgramacionSemanalPendiente(this.campeonatoId, this.categoriaId ?? undefined, this.etapa.trim(), this.jornada).subscribe({
      next: pendiente => {
        if (pendiente) { this.sesion = pendiente; this.exito = 'Se recuperó el sorteo que estaba en curso.'; this.cargando = false; return; }
        if (!this.bolillas.length) { this.error = 'Genera al menos una bolilla para iniciar un sorteo nuevo.'; this.cargando = false; return; }
        this.crearNuevaSesion();
      },
      error: e => { this.error = e?.error?.message ?? 'No se pudo validar si existe un sorteo pendiente.'; this.cargando = false; },
    });
  }
  get pendientes(): any[] { if (!this.sesion) return []; const asignados = new Set(this.sesion.bolillas.filter(b => b.partidoId).map(b => b.partidoId)); return this.sesion.partidos.filter(p => !asignados.has(p.id)); }
  sacar(): void { if (!this.sesion || !this.partidoSeleccionadoId) return; this.sorteando = true; this.error = ''; this.partidosService.sacarBolilla(this.sesion.id, this.partidoSeleccionadoId).subscribe({ next: r => { this.ultimaBolilla = r.bolilla; this.partidoSeleccionadoId = null; this.refrescar(); this.sorteando = false; }, error: e => { this.error = e?.error?.message ?? 'No se pudo sacar la bolilla.'; this.sorteando = false; } }); }
  confirmar(): void { if (!this.sesion || this.pendientes.length) return; this.confirmando = true; this.partidosService.confirmarProgramacionSemanal(this.sesion.id).subscribe({ next: s => { this.sesion = s; this.exito = 'Programación confirmada. Los horarios fueron guardados en los partidos.'; this.confirmando = false; }, error: e => { this.error = e?.error?.message ?? 'No se pudo confirmar la programación.'; this.confirmando = false; } }); }
  cancelar(): void {
    if (!this.sesion || !window.confirm('¿Cancelar este sorteo? Las asignaciones aún no confirmadas se descartarán y los partidos no cambiarán.')) return;
    this.error = '';
    this.partidosService.cancelarProgramacionSemanal(this.sesion.id).subscribe({
      next: respuesta => { this.sesion = null; this.bolillas = []; this.partidoSeleccionadoId = null; this.bolillaManualId = null; this.exito = respuesta.mensaje; },
      error: e => this.error = e?.error?.message ?? 'No se pudo cancelar el sorteo.',
    });
  }
  liberar(bolilla: BolillaHorario): void {
    if (!this.sesion || !bolilla.id || !window.confirm('¿Liberar esta bolilla para corregir la asignación?')) return;
    this.error = '';
    this.partidosService.liberarBolillaProgramacion(this.sesion.id, bolilla.id).subscribe({ next: sesion => { this.sesion = sesion; this.exito = 'Bolilla liberada. Ahora puedes asignarla manualmente o volver a sortear.'; }, error: e => this.error = e?.error?.message ?? 'No se pudo liberar la bolilla.' });
  }
  asignarManual(): void {
    if (!this.sesion || !this.partidoSeleccionadoId || !this.bolillaManualId) return;
    this.error = '';
    this.partidosService.asignarBolillaManual(this.sesion.id, this.partidoSeleccionadoId, this.bolillaManualId).subscribe({
      next: sesion => { this.sesion = sesion; this.partidoSeleccionadoId = null; this.bolillaManualId = null; this.exito = 'Horario asignado manualmente. Revisa y confirma cuando todo esté correcto.'; },
      error: e => this.error = e?.error?.message ?? 'No se pudo asignar el horario manualmente.',
    });
  }
  exportarPdf(): void { const datos = this.datosExportacion(); if (datos) this.exportador.descargarPdf(datos); }
  exportarExcel(): void { const datos = this.datosExportacion(); if (datos) this.exportador.descargarExcel(datos); }
  async exportarImagenes(): Promise<void> {
    const datos = this.datosExportacion(); if (!datos) return;
    try { await this.exportador.descargarImagenes(datos); } catch { this.error = 'No se pudieron generar las imágenes de programación.'; }
  }
  logout(): void { this.authService.logout(); }
  get canchasDetectadas(): string[] {
    if (!this.etapa || !this.jornada) return [];
    return [...new Set(this.partidosProgramables
      .filter(partido => partido.etapa === this.etapa && partido.jornada === this.jornada && partido.cancha?.trim())
      .map(partido => partido.cancha.trim()))].sort();
  }
  get bolillasManualesDisponibles(): BolillaHorario[] {
    if (!this.sesion) return [];
    const partido = this.pendientes.find(item => item.id === this.partidoSeleccionadoId);
    return this.sesion.bolillas.filter(bolilla => bolilla.estado === 'disponible' && (!partido?.cancha || bolilla.cancha.toLowerCase() === partido.cancha.toLowerCase()));
  }
  private datosExportacion(): ProgramacionSemanalExport | null {
    if (!this.sesion) return null;
    const filas = this.sesion.bolillas.filter(bolilla => !!bolilla.partido).map(bolilla => ({
      fecha: String(bolilla.fecha).slice(0, 10), hora: bolilla.hora, cancha: bolilla.cancha,
      categoria: bolilla.partido?.categoria?.nombre ?? this.categorias.find(categoria => categoria.id === bolilla.partido?.categoriaId)?.nombre ?? 'Categoría',
      local: bolilla.partido?.equipoLocal?.nombre ?? '', visitante: bolilla.partido?.equipoVisitante?.nombre ?? '', manual: !!bolilla.asignacionManual,
    }));
    if (!filas.length) { this.error = 'Aún no existen horarios asignados para exportar.'; return null; }
    const liga = this.ligas.find(item => item.id === this.sesion!.ligaId);
    const campeonato = this.campeonatos.find(item => item.id === this.sesion!.campeonatoId);
    return { liga: liga?.nombre ?? 'Liga', ligaImagen: liga?.imagen, campeonato: campeonato?.nombre ?? 'Campeonato', categoria: this.categoriaId ? this.categorias.find(item => item.id === this.categoriaId)?.nombre ?? 'Categoría' : 'Todas las categorías', etapa: this.sesion.etapa, jornada: this.sesion.jornada, estado: this.sesion.estado === 'confirmada' ? 'confirmada' : 'en_sorteo', filas };
  }
  private crearNuevaSesion(): void {
    this.partidosService.crearProgramacionSemanal({ campeonatoId: this.campeonatoId!, categoriaId: this.categoriaId ?? undefined, etapa: this.etapa.trim(), jornada: this.jornada!, bolillas: this.bolillas }).subscribe({ next: s => { this.sesion = s; this.cargando = false; }, error: e => { this.error = e?.error?.message ?? 'No se pudo iniciar el sorteo.'; this.cargando = false; } });
  }
  private cargarOpcionesProgramables(): void { if (!this.campeonatoId) return; this.partidosService.getByCampeonato(this.campeonatoId, this.categoriaId ?? undefined).subscribe({ next: partidos => { this.partidosProgramables = partidos.filter(p => p.estado === 'programado' && (!p.fechaPartido || !p.horaPartido)); this.etapasDisponibles = [...new Set(this.partidosProgramables.map(p => p.etapa))].sort(); }, error: () => this.error = 'No se pudieron cargar las jornadas programables.' }); }
  private refrescar(): void { if (this.sesion) this.partidosService.obtenerProgramacionSemanal(this.sesion.id).subscribe(s => this.sesion = s); }
  private minutos(hora: string): number | null { const p = hora.split(':').map(Number); return p.length === 2 && p.every(Number.isFinite) ? p[0] * 60 + p[1] : null; }
  private hora(minutos: number): string { return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`; }
}
