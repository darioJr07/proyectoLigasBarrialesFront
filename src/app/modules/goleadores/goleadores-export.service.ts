import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';
import { FilaGoleador } from './goleadores.model';

(pdfMake as any).vfs = pdfFonts;

export interface GoleadoresExportables {
  ligaNombre: string;
  ligaImagen?: string;
  campeonatoNombre: string;
  categoriaNombre: string;
  goleadores: FilaGoleador[];
}

@Injectable({ providedIn: 'root' })
export class GoleadoresExportService {
  descargarPdf(data: GoleadoresExportables): void {
    const encabezado = ['#', 'JUGADOR', 'EQUIPO', 'GOLES', 'PENALES', 'AG']
      .map((text, index) => ({ text, style: 'tableHeader', alignment: index === 1 || index === 2 ? 'left' : 'center' }));
    const filas = data.goleadores.map(f => [String(f.posicion), f.jugadorNombre, f.equipoNombre, String(f.total), String(f.penales), String(f.autogoles)]);
    const documento: any = {
      pageMargins: [32, 34, 32, 34],
      content: [
        { text: 'TABLA DE GOLEADORES', style: 'title', alignment: 'center' },
        { text: data.ligaNombre, style: 'league', alignment: 'center', margin: [0, 3, 0, 0] },
        { text: `${data.campeonatoNombre} — ${data.categoriaNombre}`, style: 'subtitle', alignment: 'center', margin: [0, 2, 0, 14] },
        { table: { headerRows: 1, widths: [32, '*', '*', 50, 58, 38], body: [encabezado, ...filas] }, layout: { fillColor: (r: number) => r === 0 ? '#1A252F' : r % 2 === 0 ? '#F5F7FA' : null, hLineColor: () => '#DDE3EA', vLineColor: () => '#DDE3EA' } },
        { text: `AG: autogoles (no suman al total) · Generado el ${this.fecha()}`, style: 'footer', margin: [0, 14, 0, 0] },
      ],
      styles: { title: { fontSize: 17, bold: true, color: '#1A252F' }, league: { fontSize: 11, bold: true, color: '#3498DB' }, subtitle: { fontSize: 10, color: '#52616B' }, footer: { fontSize: 8, color: '#7F8C8D' }, tableHeader: { bold: true, color: '#FFFFFF', fontSize: 9 } },
      defaultStyle: { fontSize: 9, color: '#263238' },
    };
    pdfMake.createPdf(documento).download(`${this.nombre(data)}.pdf`);
  }

  descargarExcel(data: GoleadoresExportables): void {
    const hoja = XLSX.utils.aoa_to_sheet([
      ['TABLA DE GOLEADORES'], ['Liga', data.ligaNombre], ['Campeonato', data.campeonatoNombre], ['Categoría', data.categoriaNombre], ['Generado el', this.fecha()], [],
      ['Posición', 'Jugador', 'N.º camiseta', 'Equipo', 'Goles', 'Penales', 'Autogoles'],
      ...data.goleadores.map(f => [f.posicion, f.jugadorNombre, f.numeroCancha ?? '', f.equipoNombre, f.total, f.penales, f.autogoles]),
    ]);
    hoja['!cols'] = [{ wch: 11 }, { wch: 30 }, { wch: 14 }, { wch: 28 }, { wch: 10 }, { wch: 11 }, { wch: 12 }];
    hoja['!merges'] = [XLSX.utils.decode_range('A1:G1')];
    const libro = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(libro, hoja, 'Goleadores');
    XLSX.writeFile(libro, `${this.nombre(data)}.xlsx`);
  }

  async descargarImagen(data: GoleadoresExportables): Promise<void> {
    const logoLiga = data.ligaImagen ? await this.urlADataUrl(data.ligaImagen) : undefined;
    const url = URL.createObjectURL(new Blob([this.svg(data, logoLiga)], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const imagen = await new Promise<HTMLImageElement>((resolve, reject) => { const el = new Image(); el.onload = () => resolve(el); el.onerror = () => reject(new Error('No se pudo renderizar la imagen.')); el.src = url; });
      const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1350;
      const contexto = canvas.getContext('2d'); if (!contexto) throw new Error('No se pudo crear el lienzo.');
      contexto.drawImage(imagen, 0, 0);
      const png = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png')); if (!png) throw new Error('No se pudo generar la imagen.');
      const enlace = document.createElement('a'); enlace.href = URL.createObjectURL(png); enlace.download = `${this.nombre(data)}_TOP_15.png`; enlace.click(); URL.revokeObjectURL(enlace.href);
    } finally { URL.revokeObjectURL(url); }
  }

  private svg(data: GoleadoresExportables, logoLiga?: string): string {
    const top = data.goleadores.slice(0, 15), inicio = 330, altoFila = Math.min(58, Math.floor((1350 - inicio - 108) / Math.max(top.length, 1)));
    const imagenLiga = logoLiga ? `<circle cx="954" cy="128" r="68" fill="#FFFFFF" opacity="0.16"/><image href="${logoLiga}" x="899" y="73" width="110" height="110" preserveAspectRatio="xMidYMid meet"/>` : '';
    const filas = imagenLiga + top.map((f, i) => { const y = inicio + i * altoFila, color = this.color(f.posicion), jugador = this.xml(this.acortar(this.nombreParaImagen(f.jugadorNombre), 30)), equipo = this.xml(this.acortar(f.equipoNombre, 25)); return `<rect x="54" y="${y}" width="972" height="${altoFila}" fill="${i % 2 ? '#FFFFFF' : '#F7F9FC'}"/><rect x="54" y="${y}" width="8" height="${altoFila}" fill="${color}"/><circle cx="88" cy="${y + altoFila / 2}" r="18" fill="${color}"/><text x="88" y="${y + altoFila / 2 + 7}" class="pos" text-anchor="middle">${f.posicion}</text><text x="132" y="${y + altoFila / 2 + 7}" class="player">${jugador}</text><text x="650" y="${y + altoFila / 2 + 7}" class="team">${equipo}</text><text x="960" y="${y + altoFila / 2 + 10}" class="goals" text-anchor="middle">${f.total}</text>`; }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#152238"/><stop offset="1" stop-color="#304C70"/></linearGradient></defs><style>.title{font:700 46px Arial;fill:#fff}.league{font:700 24px Arial;fill:#75D1FF}.meta{font:400 22px Arial;fill:#D9E5F2}.th{font:700 17px Arial;fill:#5C6B7A}.pos{font:700 18px Arial;fill:#fff}.player{font:700 22px Arial;fill:#1A252F}.team{font:400 19px Arial;fill:#52616B}.goals{font:700 28px Arial;fill:#152238}.foot{font:400 16px Arial;fill:#6B7A8C}</style><rect width="1080" height="1350" fill="#EAF0F6"/><rect width="1080" height="258" fill="url(#bg)"/><text x="54" y="76" class="league">${this.xml(data.ligaNombre || 'LIGA BARRIAL')}</text><text x="54" y="136" class="title">TOP 15 GOLEADORES</text><text x="54" y="183" class="meta">${this.xml(data.campeonatoNombre)} · ${this.xml(data.categoriaNombre)}</text><text x="54" y="218" class="meta">Actualizado: ${this.fecha()} · Clasificado por goles totales</text><rect x="54" y="278" width="972" height="994" rx="18" fill="#fff"/><rect x="54" y="275" width="972" height="55" fill="#EDF2F7"/><text x="88" y="310" class="th" text-anchor="middle">#</text><text x="132" y="310" class="th">JUGADOR</text><text x="650" y="310" class="th">EQUIPO</text><text x="960" y="310" class="th" text-anchor="middle">GOLES</text>${filas}<text x="54" y="1303" class="foot">Solo goles totales · No incluye detalle de penales ni autogoles</text><text x="1026" y="1303" class="foot" text-anchor="end">Sistema de Ligas Barriales</text></svg>`;
  }

  private color(posicion: number): string { if (posicion === 1) return '#F39C12'; if (posicion === 2) return '#95A5A6'; if (posicion === 3) return '#CD7F32'; return '#3498DB'; }
  private async urlADataUrl(url: string): Promise<string | undefined> {
    if (url.startsWith('data:')) return url;
    try { const respuesta = await fetch(url); if (!respuesta.ok) return undefined; const blob = await respuesta.blob(); return await new Promise<string>((resolve, reject) => { const lector = new FileReader(); lector.onload = () => resolve(lector.result as string); lector.onerror = () => reject(); lector.readAsDataURL(blob); }); } catch { return undefined; }
  }
  private fecha(): string { return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date()); }
  private nombreParaImagen(nombre: string): string {
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    if (partes.length <= 2) return nombre;
    if (partes.length === 3) return `${partes[0]} ${partes[2]}`;
    return `${partes[0]} ${partes[partes.length - 2]} ${partes[partes.length - 1][0]}.`;
  }
  private acortar(valor: string, limite: number): string { return valor.length > limite ? `${valor.slice(0, limite - 1)}…` : valor; }
  private xml(valor: string): string { return valor.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] || c)); }
  private nombre(data: GoleadoresExportables): string { return `GOLEADORES_${data.campeonatoNombre}_${data.categoriaNombre}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toUpperCase(); }
}
