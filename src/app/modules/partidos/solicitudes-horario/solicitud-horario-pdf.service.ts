import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { SolicitudHorario } from '../partido.model';

(pdfMake as any).vfs = pdfFonts;

export interface DatosSolicitudHorarioPdf {
  solicitud: SolicitudHorario;
  liga: string;
  ligaImagen?: string;
  campeonato: string;
  categoria: string;
}

@Injectable({ providedIn: 'root' })
export class SolicitudHorarioPdfService {
  async descargar(datos: DatosSolicitudHorarioPdf): Promise<void> {
    const { solicitud } = datos;
    const logo = datos.ligaImagen ? await this.dataUrl(datos.ligaImagen) : undefined;
    const partido = solicitud.partido;
    const numero = this.numero(solicitud);
    const estado = this.estado(solicitud.estado);
    const local = partido?.equipoLocal?.nombre ?? 'Equipo local';
    const visitante = partido?.equipoVisitante?.nombre ?? 'Equipo visitante';
    const contenido: any[] = [];

    if (logo) contenido.push({ image: logo, width: 62, height: 62, fit: [62, 62], alignment: 'center', margin: [0, 0, 0, 7] });
    contenido.push(
      { text: datos.liga.toUpperCase(), style: 'liga', alignment: 'center' },
      { text: 'SOLICITUD REGLAMENTARIA DE HORARIO', style: 'titulo', alignment: 'center' },
      {
        columns: [
          { text: `Solicitud: ${numero}`, style: 'numero' },
          { text: `Registrada: ${this.fechaHora(solicitud.creadoEn)}`, alignment: 'right', style: 'dato' },
        ],
        margin: [0, 16, 0, 10],
      },
      {
        table: {
          widths: [120, '*'],
          body: [
            [{ text: 'Estado', style: 'etiqueta' }, { text: estado, style: `estado${solicitud.estado}`, bold: true }],
            [{ text: 'Equipo solicitante', style: 'etiqueta' }, { text: solicitud.equipo?.nombre ?? 'Equipo', style: 'valor' }],
            [{ text: 'Campeonato', style: 'etiqueta' }, { text: datos.campeonato, style: 'valor' }],
            [{ text: 'Categoría', style: 'etiqueta' }, { text: datos.categoria, style: 'valor' }],
            [{ text: 'Etapa', style: 'etiqueta' }, { text: this.etapa(solicitud.etapa), style: 'valor' }],
            [{ text: 'Partido', style: 'etiqueta' }, { text: `${local} vs ${visitante}`, style: 'valor' }],
            [{ text: 'Jornada', style: 'etiqueta' }, { text: partido?.jornada ? `Jornada ${partido.jornada}` : 'Por definir', style: 'valor' }],
            [{ text: 'Horario solicitado', style: 'etiqueta' }, { text: `${this.fecha(solicitud.fechaSolicitada)} · ${solicitud.horaSolicitada}`, style: 'horario' }],
            [{ text: 'Cancha solicitada', style: 'etiqueta' }, { text: solicitud.canchaSolicitada || 'Sin cancha específica', style: 'valor' }],
          ],
        },
        layout: {
          fillColor: (fila: number) => fila % 2 === 0 ? '#f5f8fb' : null,
          hLineColor: '#d8e3ec',
          vLineColor: '#d8e3ec',
        },
      },
      { text: 'MOTIVO DE LA SOLICITUD', style: 'subtitulo', margin: [0, 16, 0, 5] },
      { text: solicitud.motivo, style: 'parrafo' },
    );

    if (solicitud.estado !== 'pendiente') {
      contenido.push(
        { text: 'RESOLUCIÓN', style: 'subtitulo', margin: [0, 16, 0, 5] },
        {
          table: {
            widths: [120, '*'],
            body: [
              [{ text: 'Decisión', style: 'etiqueta' }, { text: estado, style: 'valor' }],
              [{ text: 'Fecha de resolución', style: 'etiqueta' }, { text: this.fechaHora(solicitud.resueltoEn), style: 'valor' }],
              [{ text: 'Observación', style: 'etiqueta' }, { text: solicitud.observacionResolucion || 'Sin observaciones', style: 'valor' }],
            ],
          },
          layout: { hLineColor: '#d8e3ec', vLineColor: '#d8e3ec' },
        },
      );
    } else {
      contenido.push({ text: 'Esta solicitud se encuentra pendiente de resolución por la directiva de la liga.', style: 'pendiente', margin: [0, 16, 0, 0] });
    }

    contenido.push(
      {
        columns: [
          { text: `____________________________\n${solicitud.equipo?.nombre ?? 'Equipo solicitante'}\nDirigente`, style: 'firma', alignment: 'center' },
          { text: `____________________________\nDirectiva\n${datos.liga}`, style: 'firma', alignment: 'center' },
        ],
        columnGap: 35,
        margin: [0, 55, 0, 0],
      },
      { text: 'Documento generado por el Sistema de Ligas Barriales. La validez del horario depende de su aprobación y aplicación en la programación semanal.', style: 'pie', alignment: 'center', margin: [0, 30, 0, 0] },
    );

    pdfMake.createPdf({
      pageSize: 'A4',
      pageMargins: [48, 38, 48, 38],
      content: contenido,
      styles: {
        liga: { fontSize: 13, bold: true, color: '#1677c7' },
        titulo: { fontSize: 17, bold: true, color: '#17324d', margin: [0, 4, 0, 0] },
        numero: { fontSize: 10, bold: true, color: '#1677c7' },
        dato: { fontSize: 9, color: '#526b84' },
        etiqueta: { fontSize: 9, bold: true, color: '#475569', margin: [4, 5, 4, 5] },
        valor: { fontSize: 9, color: '#172033', margin: [4, 5, 4, 5] },
        horario: { fontSize: 10, bold: true, color: '#0f5f9a', margin: [4, 5, 4, 5] },
        subtitulo: { fontSize: 10, bold: true, color: '#17324d' },
        parrafo: { fontSize: 9, color: '#334155', lineHeight: 1.3, fillColor: '#f8fafc', margin: [8, 8, 8, 8] },
        pendiente: { fontSize: 9, bold: true, color: '#806000', fillColor: '#fff4cf', margin: [8, 8, 8, 8] },
        estadopendiente: { fontSize: 9, color: '#806000', margin: [4, 5, 4, 5] },
        estadoaprobada: { fontSize: 9, color: '#1d4ed8', margin: [4, 5, 4, 5] },
        estadoaplicada: { fontSize: 9, color: '#166534', margin: [4, 5, 4, 5] },
        estadorechazada: { fontSize: 9, color: '#991b1b', margin: [4, 5, 4, 5] },
        estadocancelada: { fontSize: 9, color: '#991b1b', margin: [4, 5, 4, 5] },
        firma: { fontSize: 8, color: '#475569', lineHeight: 1.25 },
        pie: { fontSize: 7, color: '#94a3b8' },
      },
      defaultStyle: { fontSize: 9 },
    } as any).download(`${numero}_${this.nombreArchivo(solicitud.equipo?.nombre ?? 'EQUIPO')}.pdf`);
  }

  private numero(solicitud: SolicitudHorario): string {
    const anio = String(solicitud.creadoEn || '').slice(0, 4) || new Date().getFullYear();
    return `SOL-HOR-${anio}-${String(solicitud.id).padStart(6, '0')}`;
  }

  private estado(valor: SolicitudHorario['estado']): string {
    return ({ pendiente: 'PENDIENTE', aprobada: 'APROBADA', aplicada: 'APLICADA EN PROGRAMACIÓN', rechazada: 'RECHAZADA', cancelada: 'CANCELADA' } as const)[valor];
  }

  private etapa(valor: string): string { return valor.replace(/_/g, ' ').replace(/\b\w/g, letra => letra.toUpperCase()); }

  private fecha(valor?: string | null): string {
    if (!valor) return 'No registrada';
    const [anio, mes, dia] = String(valor).slice(0, 10).split('-');
    return anio && mes && dia ? `${dia}/${mes}/${anio}` : String(valor);
  }

  private fechaHora(valor?: string | null): string {
    if (!valor) return 'No registrada';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return String(valor);
    return fecha.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
  }

  private nombreArchivo(valor: string): string {
    return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase();
  }

  private async dataUrl(url: string): Promise<string | undefined> {
    if (url.startsWith('data:')) return url;
    try {
      const respuesta = await fetch(url);
      if (!respuesta.ok) return undefined;
      const blob = await respuesta.blob();
      return await new Promise<string>((resolver, rechazar) => {
        const lector = new FileReader();
        lector.onload = () => resolver(lector.result as string);
        lector.onerror = rechazar;
        lector.readAsDataURL(blob);
      });
    } catch {
      return undefined;
    }
  }
}
