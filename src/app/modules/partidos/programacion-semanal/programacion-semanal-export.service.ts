import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';

(pdfMake as any).vfs = pdfFonts;

export interface ProgramacionExportFila {
  fecha: string;
  hora: string;
  cancha: string;
  categoria: string;
  local: string;
  visitante: string;
  manual: boolean;
}

export interface ProgramacionSemanalExport {
  liga: string;
  ligaImagen?: string;
  campeonato: string;
  categoria: string;
  etapa: string;
  jornada: number;
  estado: 'en_sorteo' | 'confirmada';
  filas: ProgramacionExportFila[];
}

@Injectable({ providedIn: 'root' })
export class ProgramacionSemanalExportService {
  descargarPdf(data: ProgramacionSemanalExport): void {
    const filas = this.ordenar(data.filas);
    const body = [
      ['FECHA', 'CANCHA', 'HORA', 'CATEGORÍA', 'LOCAL', 'VISITANTE', 'ASIGNACIÓN'].map(texto => ({ text: texto, style: 'header' })),
      ...filas.map(fila => [this.fechaTexto(fila.fecha), fila.cancha, fila.hora, fila.categoria, fila.local, fila.visitante, fila.manual ? 'Solicitado / manual' : 'Sorteo']),
    ];
    pdfMake.createPdf({
      pageMargins: [25, 30, 25, 30],
      pageOrientation: 'landscape',
      content: [
        { text: data.estado === 'confirmada' ? 'PROGRAMACIÓN SEMANAL OFICIAL' : 'PROGRAMACIÓN SEMANAL — BORRADOR', style: 'title', alignment: 'center' },
        { text: data.liga, style: 'liga', alignment: 'center' },
        { text: `${data.campeonato} · ${data.categoria} · ${data.etapa} · Jornada ${data.jornada}`, style: 'meta', alignment: 'center', margin: [0, 3, 0, 14] },
        { table: { headerRows: 1, widths: [72, 90, 52, 82, '*', '*', 86], body }, layout: { fillColor: (fila: number) => fila === 0 ? '#243B5A' : fila % 2 === 0 ? '#F4F7FA' : null } },
        { text: `Generado el ${this.fechaTexto(new Date().toISOString().slice(0, 10))}`, style: 'pie', margin: [0, 12, 0, 0] },
      ],
      styles: { title: { fontSize: 17, bold: true, color: '#1A252F' }, liga: { fontSize: 11, bold: true, color: '#1677C7' }, meta: { fontSize: 10, color: '#52616B' }, pie: { fontSize: 8, color: '#718096' }, header: { bold: true, color: '#FFFFFF', fontSize: 8 } },
      defaultStyle: { fontSize: 8 },
    } as any).download(`${this.nombre(data)}.pdf`);
  }

  descargarExcel(data: ProgramacionSemanalExport): void {
    const hoja = XLSX.utils.aoa_to_sheet([
      [data.estado === 'confirmada' ? 'PROGRAMACIÓN SEMANAL OFICIAL' : 'PROGRAMACIÓN SEMANAL — BORRADOR'],
      ['Liga', data.liga], ['Campeonato', data.campeonato], ['Categoría', data.categoria], ['Etapa', data.etapa], ['Jornada', data.jornada], ['Estado', data.estado === 'confirmada' ? 'Confirmada' : 'Borrador'], [],
      ['Fecha', 'Cancha', 'Hora', 'Categoría', 'Equipo local', 'Equipo visitante', 'Asignación'],
      ...this.ordenar(data.filas).map(fila => [this.fechaTexto(fila.fecha), fila.cancha, fila.hora, fila.categoria, fila.local, fila.visitante, fila.manual ? 'Solicitado / manual' : 'Sorteo']),
    ]);
    hoja['!cols'] = [{ wch: 15 }, { wch: 24 }, { wch: 12 }, { wch: 20 }, { wch: 28 }, { wch: 28 }, { wch: 22 }];
    hoja['!merges'] = [XLSX.utils.decode_range('A1:G1')];
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Programación');
    XLSX.writeFile(libro, `${this.nombre(data)}.xlsx`);
  }

  async descargarImagenes(data: ProgramacionSemanalExport): Promise<void> {
    const logo = data.ligaImagen ? await this.dataUrl(data.ligaImagen) : undefined;
    const porFecha = new Map<string, ProgramacionExportFila[]>();
    for (const fila of this.ordenar(data.filas)) porFecha.set(fila.fecha, [...(porFecha.get(fila.fecha) ?? []), fila]);
    for (const [fecha, filas] of porFecha) await this.descargarPng(this.svg(data, fecha, filas, logo), `${this.nombre(data)}_${fecha}`);
  }

  private async descargarPng(svg: string, nombre: string): Promise<void> {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const imagen = await new Promise<HTMLImageElement>((resolver, rechazar) => { const elemento = new Image(); elemento.onload = () => resolver(elemento); elemento.onerror = () => rechazar(new Error('No se pudo crear la imagen.')); elemento.src = url; });
      const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1350;
      canvas.getContext('2d')!.drawImage(imagen, 0, 0);
      const png = await new Promise<Blob | null>(resolver => canvas.toBlob(resolver, 'image/png'));
      if (!png) throw new Error('No se pudo crear la imagen.');
      const enlace = document.createElement('a'); enlace.href = URL.createObjectURL(png); enlace.download = `${nombre}.png`; enlace.click(); URL.revokeObjectURL(enlace.href);
    } finally { URL.revokeObjectURL(url); }
  }

  private svg(data: ProgramacionSemanalExport, fecha: string, filas: ProgramacionExportFila[], logo?: string): string {
    const alto = Math.min(64, Math.floor(760 / Math.max(filas.length, 1)));
    const contenido = filas.map((fila, indice) => {
      const y = 380 + indice * alto;
      return `<rect x="54" y="${y}" width="972" height="${alto - 6}" rx="5" fill="${indice % 2 ? '#F7FAFC' : '#FFFFFF'}"/><text x="85" y="${y + alto / 2 + 7}" class="hora">${this.xml(fila.hora)}</text><text x="200" y="${y + alto / 2 + 7}" class="cancha">${this.xml(this.recortar(fila.cancha, 18))}</text><text x="460" y="${y + alto / 2 + 7}" class="equipo" text-anchor="end">${this.xml(this.recortar(fila.local, 27))}</text><text x="540" y="${y + alto / 2 + 7}" class="vs" text-anchor="middle">VS</text><text x="620" y="${y + alto / 2 + 7}" class="equipo">${this.xml(this.recortar(fila.visitante, 27))}</text>`;
    }).join('');
    const sello = data.estado === 'confirmada' ? 'PROGRAMACIÓN OFICIAL' : 'BORRADOR';
    const logoSvg = logo ? `<circle cx="950" cy="130" r="67" fill="#fff" opacity=".16"/><image href="${logo}" x="895" y="75" width="110" height="110" preserveAspectRatio="xMidYMid meet"/>` : '';
    const marca = logo ? `<image href="${logo}" x="300" y="650" width="480" height="480" opacity=".08" preserveAspectRatio="xMidYMid meet"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><style>.titulo{font:700 44px Arial;fill:#fff}.liga{font:700 23px Arial;fill:#9DCEFF}.meta{font:600 21px Arial;fill:#DBEAFE}.sello{font:700 17px Arial;fill:#FACC15}.cab{font:700 16px Arial;fill:#52616B}.hora{font:700 23px Arial;fill:#0F2E4F}.cancha{font:600 18px Arial;fill:#52616B}.equipo{font:700 19px Arial;fill:#16263A}.vs{font:700 19px Arial;fill:#D19D12}.pie{font:600 15px Arial;fill:#DBEAFE}</style><rect width="1080" height="1350" fill="#063B75"/><rect width="1080" height="280" fill="#183554"/><text x="54" y="76" class="liga">${this.xml(data.liga)}</text><text x="54" y="140" class="titulo">PROGRAMACIÓN SEMANAL</text><text x="54" y="188" class="meta">${this.xml(data.campeonato)} · Jornada ${data.jornada}</text><text x="54" y="224" class="meta">${this.xml(data.categoria)} · ${this.xml(data.etapa)} · ${this.fechaTexto(fecha)}</text><text x="54" y="257" class="sello">${sello}</text>${logoSvg}${marca}<rect x="54" y="320" width="972" height="48" rx="5" fill="#D5B117"/><text x="85" y="351" class="cab">HORA</text><text x="200" y="351" class="cab">CANCHA</text><text x="540" y="351" class="cab" text-anchor="middle">ENCUENTRO</text>${contenido}<text x="54" y="1285" class="pie">Sistema de Ligas Barriales</text><text x="1026" y="1285" class="pie" text-anchor="end">${sello}</text></svg>`;
  }

  private ordenar(filas: ProgramacionExportFila[]): ProgramacionExportFila[] { return [...filas].sort((a, b) => `${a.fecha}|${a.cancha}|${a.hora}`.localeCompare(`${b.fecha}|${b.cancha}|${b.hora}`)); }
  private fechaTexto(fecha: string): string { const [anio, mes, dia] = fecha.slice(0, 10).split('-'); return anio && mes && dia ? `${dia}/${mes}/${anio}` : fecha; }
  private nombre(data: ProgramacionSemanalExport): string { return `PROGRAMACION_${data.campeonato}_J${data.jornada}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase(); }
  private recortar(valor: string, limite: number): string { return valor.length > limite ? `${valor.slice(0, limite - 1)}…` : valor; }
  private xml(valor: string): string { return valor.replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[caracter]!)); }
  private async dataUrl(url: string): Promise<string | undefined> { if (url.startsWith('data:')) return url; try { const respuesta = await fetch(url); if (!respuesta.ok) return undefined; const blob = await respuesta.blob(); return await new Promise<string>((resolver, rechazar) => { const lector = new FileReader(); lector.onload = () => resolver(lector.result as string); lector.onerror = rechazar; lector.readAsDataURL(blob); }); } catch { return undefined; } }
}
