import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';
import { FilaPosicion } from './tabla-posiciones.model';

(pdfMake as any).vfs = pdfFonts;

export interface TablaExportable {
  ligaNombre: string;
  ligaImagen?: string;
  campeonatoNombre: string;
  categoriaNombre: string;
  etapa: string;
  tabla: FilaPosicion[];
}

@Injectable({ providedIn: 'root' })
export class TablaPosicionesExportService {
  descargarPdf(data: TablaExportable): void {
    const encabezado = ['#', 'EQUIPO', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'PTS']
      .map((text, index) => ({ text, style: 'tableHeader', alignment: index === 1 ? 'left' : 'center' }));
    const filas = data.tabla.map(f => [String(f.posicion), f.equipoNombre, String(f.pj), String(f.pg), String(f.pe), String(f.pp), String(f.gf), String(f.gc), this.dg(f.dg), String(f.puntos)]);
    const documento: any = {
      pageOrientation: 'landscape', pageMargins: [28, 32, 28, 32],
      content: [
        { text: 'TABLA DE POSICIONES', style: 'title', alignment: 'center' },
        { text: data.ligaNombre, style: 'league', alignment: 'center', margin: [0, 3, 0, 0] },
        { text: `${data.campeonatoNombre} — ${data.categoriaNombre} | ${data.etapa}`, style: 'subtitle', alignment: 'center', margin: [0, 2, 0, 14] },
        { table: { headerRows: 1, widths: [30, '*', 35, 35, 35, 35, 35, 35, 38, 38], body: [encabezado, ...filas] }, layout: { fillColor: (r: number) => r === 0 ? '#1A252F' : r % 2 === 0 ? '#F5F7FA' : null, hLineColor: () => '#DDE3EA', vLineColor: () => '#DDE3EA' } },
        { text: `Generado el ${this.fecha()}`, style: 'footer', alignment: 'right', margin: [0, 14, 0, 0] },
      ],
      styles: { title: { fontSize: 17, bold: true, color: '#1A252F' }, league: { fontSize: 11, bold: true, color: '#3498DB' }, subtitle: { fontSize: 10, color: '#52616B' }, footer: { fontSize: 8, color: '#7F8C8D' }, tableHeader: { bold: true, color: '#FFFFFF', fontSize: 9 } },
      defaultStyle: { fontSize: 9, color: '#263238' },
    };
    pdfMake.createPdf(documento).download(`${this.nombre(data)}.pdf`);
  }

  descargarExcel(data: TablaExportable): void {
    const hoja = XLSX.utils.aoa_to_sheet([
      ['TABLA DE POSICIONES'], ['Liga', data.ligaNombre], ['Campeonato', data.campeonatoNombre], ['Categoría', data.categoriaNombre], ['Etapa', data.etapa], ['Generado el', this.fecha()], [],
      ['Posición', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'Puntos'],
      ...data.tabla.map(f => [f.posicion, f.equipoNombre, f.pj, f.pg, f.pe, f.pp, f.gf, f.gc, f.dg, f.puntos]),
    ]);
    hoja['!cols'] = [{ wch: 11 }, { wch: 32 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 }];
    hoja['!merges'] = [XLSX.utils.decode_range('A1:J1')];
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Posiciones');
    XLSX.writeFile(libro, `${this.nombre(data)}.xlsx`);
  }

  async descargarImagen(data: TablaExportable, escudos: Record<number, string | undefined> = {}): Promise<void> {
    const escudosEmbebidos = await this.embebirEscudos(escudos);
    const logoLiga = data.ligaImagen ? await this.urlADataUrl(data.ligaImagen) : undefined;
    const url = URL.createObjectURL(new Blob([this.svg(data, escudosEmbebidos, logoLiga)], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const imagen = await new Promise<HTMLImageElement>((resolve, reject) => { const el = new Image(); el.onload = () => resolve(el); el.onerror = () => reject(new Error('No se pudo renderizar la imagen.')); el.src = url; });
      const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1350;
      const contexto = canvas.getContext('2d');
      if (!contexto) throw new Error('No se pudo crear el lienzo.');
      contexto.drawImage(imagen, 0, 0);
      const png = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!png) throw new Error('No se pudo generar la imagen.');
      const enlace = document.createElement('a'); enlace.href = URL.createObjectURL(png); enlace.download = `${this.nombre(data)}.png`; enlace.click(); URL.revokeObjectURL(enlace.href);
    } finally { URL.revokeObjectURL(url); }
  }

  private svg(data: TablaExportable, escudos: Record<number, string>, logoLiga?: string): string {
    const margen = 54, inicio = 322, visibles = data.tabla.slice(0, 18), altoFila = Math.min(52, Math.floor((1350 - inicio - 104) / Math.max(visibles.length, 1)));
    const x = [82, 154, 600, 658, 714, 770, 826, 882, 938, 986];
    const header = ['#', 'EQUIPO', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'PTS'].map((t, i) => `<text x="${x[i]}" y="${inicio - 20}" class="th" text-anchor="${i === 1 ? 'start' : 'middle'}">${t}</text>`).join('');
    const imagenLiga = logoLiga ? `<circle cx="954" cy="128" r="68" fill="#FFFFFF" opacity="0.16"/><image href="${logoLiga}" x="899" y="73" width="110" height="110" preserveAspectRatio="xMidYMid meet"/>` : '';
    const rows = imagenLiga + visibles.map((f, i) => { const y = inicio + i * altoFila, color = this.color(f.posicion, data.tabla.length), equipo = this.xml(this.acortar(f.equipoNombre, 27)), escudo = escudos[f.equipoId]; const logo = escudo ? `<image href="${escudo}" x="111" y="${y + (altoFila - 30) / 2}" width="30" height="30" preserveAspectRatio="xMidYMid meet"/>` : ''; return `<rect x="${margen}" y="${y}" width="972" height="${altoFila}" fill="${i % 2 ? '#FFFFFF' : '#F7F9FC'}"/><rect x="${margen}" y="${y}" width="8" height="${altoFila}" fill="${color}"/><circle cx="${x[0]}" cy="${y + altoFila / 2}" r="17" fill="${color}"/><text x="${x[0]}" y="${y + altoFila / 2 + 7}" class="pos" text-anchor="middle">${f.posicion}</text>${logo}<text x="${x[1]}" y="${y + altoFila / 2 + 7}" class="team">${equipo}${f.tieneSancion ? ' *' : ''}</text>${[f.pj, f.pg, f.pe, f.pp, f.gf, f.gc, this.dg(f.dg), f.puntos].map((v, j) => `<text x="${x[j + 2]}" y="${y + altoFila / 2 + 7}" class="${j === 7 ? 'pts' : 'cell'}" text-anchor="middle">${v}</text>`).join('')}`; }).join('');
    const nota = data.tabla.length > visibles.length ? `Se muestran los primeros ${visibles.length} equipos` : 'PJ: jugados · PG: ganados · PE: empatados · PP: perdidos';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#152238"/><stop offset="1" stop-color="#304C70"/></linearGradient></defs><style>.title{font:700 46px Arial;fill:#fff}.league{font:700 24px Arial;fill:#75D1FF}.meta{font:400 22px Arial;fill:#D9E5F2}.th{font:700 17px Arial;fill:#5C6B7A}.pos{font:700 18px Arial;fill:#fff}.team{font:700 21px Arial;fill:#1A252F}.cell{font:400 20px Arial;fill:#334155}.pts{font:700 23px Arial;fill:#152238}.foot{font:400 16px Arial;fill:#6B7A8C}</style><rect width="1080" height="1350" fill="#EAF0F6"/><rect width="1080" height="258" fill="url(#bg)"/><text x="54" y="76" class="league">${this.xml(data.ligaNombre || 'LIGA BARRIAL')}</text><text x="54" y="136" class="title">TABLA DE POSICIONES</text><text x="54" y="183" class="meta">${this.xml(data.campeonatoNombre)} · ${this.xml(data.categoriaNombre)}</text><text x="54" y="218" class="meta">${this.xml(data.etapa)} · Actualizado: ${this.fecha()}</text><rect x="54" y="278" width="972" height="994" rx="18" fill="#fff"/><rect x="54" y="${inicio - 55}" width="972" height="55" fill="#EDF2F7"/>${header}${rows}<text x="54" y="1303" class="foot">${this.xml(nota)}</text><text x="1026" y="1303" class="foot" text-anchor="end">Sistema de Ligas Barriales</text></svg>`;
  }

  private color(posicion: number, total: number): string { if (posicion === 1) return '#F39C12'; if (posicion === 2) return '#95A5A6'; if (posicion === 3) return '#CD7F32'; return total >= 7 && posicion > total - 3 ? '#E74C3C' : '#3498DB'; }
  private async embebirEscudos(escudos: Record<number, string | undefined>): Promise<Record<number, string>> {
    const entradas = await Promise.all(Object.entries(escudos).map(async ([id, url]) => [id, url ? await this.urlADataUrl(url) : undefined] as const));
    return Object.fromEntries(entradas.filter((entrada): entrada is [string, string] => !!entrada[1]));
  }
  private async urlADataUrl(url: string): Promise<string | undefined> {
    if (url.startsWith('data:')) return url;
    try { const respuesta = await fetch(url); if (!respuesta.ok) return undefined; const blob = await respuesta.blob(); return await new Promise<string>((resolve, reject) => { const lector = new FileReader(); lector.onload = () => resolve(lector.result as string); lector.onerror = () => reject(); lector.readAsDataURL(blob); }); } catch { return undefined; }
  }
  private dg(valor: number): string { return valor > 0 ? `+${valor}` : String(valor); }
  private fecha(): string { return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date()); }
  private acortar(valor: string, limite: number): string { return valor.length > limite ? `${valor.slice(0, limite - 1)}…` : valor; }
  private xml(valor: string): string { return valor.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] || c)); }
  private nombre(data: TablaExportable): string { return `TABLA_POSICIONES_${data.campeonatoNombre}_${data.categoriaNombre}_${data.etapa}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toUpperCase(); }
}
