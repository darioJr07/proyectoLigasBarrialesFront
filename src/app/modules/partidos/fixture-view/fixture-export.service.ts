import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

(pdfMake as any).vfs = pdfFonts;

export interface FixtureExportEquipo {
  id: number;
  nombre: string;
  numero: number;
}

export interface FixtureExportJornada {
  numero: number;
  partidos: { localNum: number; visitanteNum: number }[];
  descanso?: { numero: number; nombre: string };
}

export interface FixtureExportData {
  liga: string;
  campeonato: string;
  categoria: string;
  etapa: string;
  equipos: FixtureExportEquipo[];
  jornadas: FixtureExportJornada[];
}

@Injectable({ providedIn: 'root' })
export class FixtureExportService {
  descargarPdf(data: FixtureExportData): void {
    const equipos = [...data.equipos].sort((a, b) => a.numero - b.numero);
    const jornadas = [...data.jornadas].sort((a, b) => a.numero - b.numero);
    const filasEquipos = this.agrupar(equipos, 4).map(fila => {
      const celdas: any[] = fila.flatMap(equipo => [
        { text: String(equipo.numero), style: 'teamNumber', alignment: 'center' },
        { text: equipo.nombre.toUpperCase(), style: 'teamName' },
      ]);
      while (celdas.length < 8) celdas.push({ text: '', style: 'teamName' });
      return celdas;
    });

    const filasJornadas = this.agrupar(jornadas, 4).map(fila => {
      const celdas: any[] = fila.map(jornada => ({
        stack: [
          { text: `FECHA ${jornada.numero}`, style: 'roundHeader', alignment: 'center' },
          {
            table: {
              widths: ['*'],
              body: [
                ...jornada.partidos.map(partido => [{
                  text: `${partido.localNum}  -  ${partido.visitanteNum}`,
                  alignment: 'center',
                  style: 'match',
                }]),
                ...(jornada.descanso ? [[{
                  text: `DESCANSA ${jornada.descanso.numero}`,
                  alignment: 'center',
                  style: 'bye',
                }]] : []),
              ],
            },
            layout: {
              hLineColor: () => '#E2E8F0',
              vLineColor: () => '#E2E8F0',
              paddingTop: () => 4,
              paddingBottom: () => 4,
            },
          },
        ],
        margin: [2, 2, 2, 7],
      }));
      while (celdas.length < 4) celdas.push({ text: '', margin: [2, 2, 2, 7] });
      return celdas;
    });

    const documento: any = {
      pageOrientation: 'landscape',
      pageMargins: [28, 30, 28, 30],
      content: [
        { text: 'FIXTURE', style: 'title', alignment: 'center' },
        { text: data.liga, style: 'league', alignment: 'center' },
        {
          text: `${data.campeonato} · ${data.categoria} · ${data.etapa}`,
          style: 'meta',
          alignment: 'center',
          margin: [0, 3, 0, 13],
        },
        { text: 'EQUIPOS PARTICIPANTES', style: 'sectionTitle', margin: [0, 0, 0, 5] },
        {
          table: {
            widths: [20, '*', 20, '*', 20, '*', 20, '*'],
            body: filasEquipos,
          },
          layout: {
            fillColor: (fila: number) => fila % 2 === 0 ? '#F7FAFC' : null,
            hLineColor: () => '#E2E8F0',
            vLineColor: () => '#E2E8F0',
            paddingTop: () => 4,
            paddingBottom: () => 4,
          },
          margin: [0, 0, 0, 13],
        },
        { text: 'CALENDARIO', style: 'sectionTitle', margin: [0, 0, 0, 5] },
        {
          table: { widths: ['*', '*', '*', '*'], body: filasJornadas, dontBreakRows: true },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 2,
            paddingRight: () => 2,
            paddingTop: () => 2,
            paddingBottom: () => 2,
          },
        },
      ],
      footer: (pagina: number, total: number) => ({
        columns: [
          { text: `Generado el ${this.fechaActual()}`, alignment: 'left' },
          { text: `Página ${pagina} de ${total}`, alignment: 'right' },
        ],
        margin: [28, 0, 28, 0],
        fontSize: 7,
        color: '#718096',
      }),
      styles: {
        title: { fontSize: 19, bold: true, color: '#173A5A' },
        league: { fontSize: 11, bold: true, color: '#2D6A4F' },
        meta: { fontSize: 10, color: '#52616B' },
        sectionTitle: { fontSize: 9, bold: true, color: '#4C51BF' },
        teamNumber: { fontSize: 8, bold: true, color: '#4C51BF' },
        teamName: { fontSize: 8, bold: true, color: '#1A202C' },
        roundHeader: { fontSize: 9, bold: true, color: '#FFFFFF', fillColor: '#173A5A', margin: [0, 5, 0, 5] },
        match: { fontSize: 9, bold: true, color: '#1A202C' },
        bye: { fontSize: 7, italics: true, color: '#718096' },
      },
      defaultStyle: { fontSize: 8 },
    };

    pdfMake.createPdf(documento).download(`${this.nombreArchivo(data)}.pdf`);
  }

  async descargarImagen(data: FixtureExportData): Promise<void> {
    const svg = this.crearSvg(data);
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    let pngUrl = '';
    try {
      const imagen = await new Promise<HTMLImageElement>((resolve, reject) => {
        const elemento = new Image();
        elemento.onload = () => resolve(elemento);
        elemento.onerror = () => reject(new Error('No se pudo renderizar el fixture.'));
        elemento.src = svgUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = imagen.naturalWidth;
      canvas.height = imagen.naturalHeight;
      const contexto = canvas.getContext('2d');
      if (!contexto) throw new Error('No se pudo crear la imagen.');
      contexto.drawImage(imagen, 0, 0);
      const png = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!png) throw new Error('No se pudo generar la imagen.');
      pngUrl = URL.createObjectURL(png);
      const enlace = document.createElement('a');
      enlace.href = pngUrl;
      enlace.download = `${this.nombreArchivo(data)}.png`;
      enlace.click();
    } finally {
      URL.revokeObjectURL(svgUrl);
      if (pngUrl) URL.revokeObjectURL(pngUrl);
    }
  }

  private crearSvg(data: FixtureExportData): string {
    const ancho = 1600;
    const margen = 60;
    const columnasEquipos = 4;
    const altoEquipo = 42;
    const filasEquipos = Math.ceil(data.equipos.length / columnasEquipos);
    const altoEquipos = 76 + filasEquipos * altoEquipo;
    // Deja una separación clara entre la última fila de equipos, el título
    // CALENDARIO y las tarjetas de las jornadas.
    const inicioFixture = 305 + altoEquipos;
    const columnasJornadas = 4;
    const separacion = 18;
    const anchoTarjeta = (ancho - margen * 2 - separacion * (columnasJornadas - 1)) / columnasJornadas;
    const filasJornadas = this.agrupar([...data.jornadas].sort((a, b) => a.numero - b.numero), columnasJornadas);
    const altosFilas = filasJornadas.map(fila => Math.max(...fila.map(jornada => 68 + jornada.partidos.length * 38 + (jornada.descanso ? 34 : 0))));
    const altoFixture = altosFilas.reduce((total, alto) => total + alto + separacion, 0);
    const alto = Math.max(1050, inicioFixture + altoFixture + 110);

    const anchoEquipo = (ancho - margen * 2 - separacion * (columnasEquipos - 1)) / columnasEquipos;
    const equiposSvg = [...data.equipos].sort((a, b) => a.numero - b.numero).map((equipo, indice) => {
      const columna = indice % columnasEquipos;
      const fila = Math.floor(indice / columnasEquipos);
      const x = margen + columna * (anchoEquipo + separacion);
      const y = 326 + fila * altoEquipo;
      return `<rect x="${x}" y="${y}" width="${anchoEquipo}" height="34" rx="6" fill="${fila % 2 ? '#FFFFFF' : '#F7FAFC'}" stroke="#DCE5EF"/><circle cx="${x + 22}" cy="${y + 17}" r="13" fill="#667EEA"/><text x="${x + 22}" y="${y + 22}" class="numero" text-anchor="middle">${equipo.numero}</text><text x="${x + 45}" y="${y + 22}" class="equipo">${this.xml(this.recortar(equipo.nombre.toUpperCase(), 27))}</text>`;
    }).join('');

    let yActual = inicioFixture;
    const jornadasSvg = filasJornadas.map((fila, filaIndice) => {
      const altoTarjeta = altosFilas[filaIndice];
      const contenido = fila.map((jornada, columna) => {
        const x = margen + columna * (anchoTarjeta + separacion);
        const partidos = jornada.partidos.map((partido, indice) => {
          const y = yActual + 61 + indice * 38;
          return `<rect x="${x + 12}" y="${y}" width="${anchoTarjeta - 24}" height="31" rx="4" fill="${indice % 2 ? '#FFFFFF' : '#F7FAFC'}"/><text x="${x + anchoTarjeta / 2}" y="${y + 22}" class="partido" text-anchor="middle">${partido.localNum}  -  ${partido.visitanteNum}</text>`;
        }).join('');
        const descansoY = yActual + 65 + jornada.partidos.length * 38;
        const descanso = jornada.descanso ? `<text x="${x + anchoTarjeta / 2}" y="${descansoY + 17}" class="descanso" text-anchor="middle">DESCANSA ${jornada.descanso.numero}</text>` : '';
        return `<rect x="${x}" y="${yActual}" width="${anchoTarjeta}" height="${altoTarjeta}" rx="10" fill="#FFFFFF" stroke="#CBD5E0"/><path d="M ${x + 10} ${yActual} H ${x + anchoTarjeta - 10} Q ${x + anchoTarjeta} ${yActual} ${x + anchoTarjeta} ${yActual + 10} V ${yActual + 48} H ${x} V ${yActual + 10} Q ${x} ${yActual} ${x + 10} ${yActual}" fill="#173A5A"/><text x="${x + anchoTarjeta / 2}" y="${yActual + 32}" class="jornada" text-anchor="middle">FECHA ${jornada.numero}</text>${partidos}${descanso}`;
      }).join('');
      yActual += altoTarjeta + separacion;
      return contenido;
    }).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}"><defs><linearGradient id="cabecera" x2="1" y2="1"><stop stop-color="#173A5A"/><stop offset="1" stop-color="#2D6A4F"/></linearGradient></defs><style>.titulo{font:700 54px Arial;fill:#FFFFFF}.liga{font:700 25px Arial;fill:#A8D8B9}.meta{font:500 22px Arial;fill:#E2E8F0}.seccion{font:700 19px Arial;fill:#4C51BF;letter-spacing:2px}.numero{font:700 15px Arial;fill:#FFFFFF}.equipo{font:700 17px Arial;fill:#1A202C}.jornada{font:700 19px Arial;fill:#FFFFFF;letter-spacing:1px}.partido{font:700 20px Arial;fill:#1A202C}.descanso{font:italic 600 15px Arial;fill:#718096}.pie{font:500 15px Arial;fill:#718096}</style><rect width="${ancho}" height="${alto}" fill="#EDF2F7"/><rect width="${ancho}" height="230" fill="url(#cabecera)"/><text x="${margen}" y="66" class="liga">${this.xml(data.liga)}</text><text x="${margen}" y="132" class="titulo">FIXTURE</text><text x="${margen}" y="180" class="meta">${this.xml(data.campeonato)} · ${this.xml(data.categoria)} · ${this.xml(data.etapa)}</text><text x="${margen}" y="291" class="seccion">EQUIPOS PARTICIPANTES</text>${equiposSvg}<text x="${margen}" y="${inicioFixture - 22}" class="seccion">CALENDARIO</text>${jornadasSvg}<text x="${margen}" y="${alto - 45}" class="pie">Sistema de Ligas Barriales</text><text x="${ancho - margen}" y="${alto - 45}" class="pie" text-anchor="end">Generado el ${this.fechaActual()}</text></svg>`;
  }

  private agrupar<T>(elementos: T[], cantidad: number): T[][] {
    const grupos: T[][] = [];
    for (let i = 0; i < elementos.length; i += cantidad) grupos.push(elementos.slice(i, i + cantidad));
    return grupos;
  }

  private fechaActual(): string {
    return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
  }

  private nombreArchivo(data: FixtureExportData): string {
    return `FIXTURE_${data.campeonato}_${data.categoria}_${data.etapa}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .toUpperCase();
  }

  private recortar(valor: string, limite: number): string {
    return valor.length > limite ? `${valor.slice(0, limite - 1)}…` : valor;
  }

  private xml(valor: string): string {
    return valor.replace(/[&<>"']/g, caracter => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
    }[caracter] || caracter));
  }
}
