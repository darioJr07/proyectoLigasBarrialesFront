import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';
import { EntradaLibroCaja } from '../../../core/services/tesoreria.service';

(pdfMake as any).vfs = pdfFonts;

export interface LibroCajaExportData {
  ligaNombre: string;
  campeonatoNombre: string;
  fechaDesde?: string;
  fechaHasta?: string;
  origen: string;
  tipo: string;
  estado: string;
  entradas: EntradaLibroCaja[];
  totalIngresos: number;
  totalPendiente: number;
  totalEgresos: number;
  saldo: number;
  generadoPor: string;
}

@Injectable({ providedIn: 'root' })
export class LibroCajaExportService {
  descargarPdf(data: LibroCajaExportData): void {
    const encabezado = ['FECHA', 'CONCEPTO', 'EQUIPO', 'ORIGEN', 'REFERENCIA', 'TIPO', 'ESTADO', 'MONTO']
      .map((texto, indice) => ({
        text: texto,
        style: 'tableHeader',
        alignment: indice === 7 ? 'right' : 'left',
      }));
    const filas = data.entradas.map((entrada) => [
      this.fechaTexto(entrada.fecha),
      entrada.concepto,
      entrada.equipo ?? '—',
      this.etiquetaOrigen(entrada.origen),
      entrada.referencia,
      entrada.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
      this.etiquetaEstado(entrada.estado),
      { text: `${entrada.tipo === 'egreso' ? '-' : '+'}$ ${Number(entrada.monto).toFixed(2)}`, alignment: 'right' },
    ]);

    const documento = {
      pageOrientation: 'landscape',
      pageMargins: [25, 30, 25, 30],
      content: [
        { text: 'LIBRO DE CAJA', style: 'title', alignment: 'center' },
        { text: data.ligaNombre, style: 'league', alignment: 'center' },
        { text: data.campeonatoNombre, style: 'subtitle', alignment: 'center' },
        { text: this.descripcionPeriodo(data), style: 'meta', alignment: 'center', margin: [0, 3, 0, 0] },
        { text: this.descripcionFiltros(data), style: 'meta', alignment: 'center', margin: [0, 2, 0, 12] },
        {
          table: {
            headerRows: 1,
            widths: [55, '*', 82, 62, 72, 48, 52, 58],
            body: [encabezado, ...filas],
          },
          layout: {
            fillColor: (fila: number) => fila === 0 ? '#243B5A' : fila % 2 === 0 ? '#F5F7FA' : null,
            hLineColor: () => '#DDE3EA',
            vLineColor: () => '#DDE3EA',
          },
        },
        {
          columns: [
            this.totalPdf('Ingresos cobrados', data.totalIngresos, '#166534'),
            this.totalPdf('Pendiente de cobro', data.totalPendiente, '#92400e'),
            this.totalPdf('Egresos', data.totalEgresos, '#991b1b'),
            this.totalPdf('Saldo del periodo', data.saldo, data.saldo >= 0 ? '#166534' : '#991b1b'),
          ],
          columnGap: 12,
          margin: [0, 15, 0, 0],
        },
        {
          text: `Generado el ${this.fechaActual()} por ${data.generadoPor}`,
          style: 'footer',
          alignment: 'right',
          margin: [0, 12, 0, 0],
        },
      ],
      styles: {
        title: { fontSize: 17, bold: true, color: '#1A252F' },
        league: { fontSize: 11, bold: true, color: '#1673B1', margin: [0, 3, 0, 0] },
        subtitle: { fontSize: 10, bold: true, color: '#334155', margin: [0, 2, 0, 0] },
        meta: { fontSize: 8, color: '#64748B' },
        tableHeader: { bold: true, color: '#FFFFFF', fontSize: 7 },
        totalLabel: { fontSize: 7, color: '#64748B' },
        totalValue: { fontSize: 11, bold: true },
        footer: { fontSize: 7, color: '#7F8C8D' },
      },
      defaultStyle: { fontSize: 7.5, color: '#263238' },
    };

    pdfMake.createPdf(documento as any).download(`${this.nombreArchivo(data)}.pdf`);
  }

  descargarExcel(data: LibroCajaExportData): void {
    const filas = data.entradas.map((entrada) => [
      this.fechaTexto(entrada.fecha),
      entrada.concepto,
      entrada.equipo ?? '',
      this.etiquetaOrigen(entrada.origen),
      entrada.referencia,
      entrada.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
      this.etiquetaEstado(entrada.estado),
      Number(entrada.monto),
    ]);
    const filaEncabezado = 8;
    const hoja = XLSX.utils.aoa_to_sheet([
      ['LIBRO DE CAJA'],
      ['Liga', data.ligaNombre],
      ['Campeonato', data.campeonatoNombre],
      ['Periodo', this.descripcionPeriodo(data)],
      ['Filtros', this.descripcionFiltros(data)],
      ['Generado', `${this.fechaActual()} por ${data.generadoPor}`],
      [],
      ['Fecha', 'Concepto', 'Equipo', 'Origen', 'Referencia', 'Tipo', 'Estado', 'Monto'],
      ...filas,
      [],
      ['RESUMEN'],
      ['Ingresos cobrados', data.totalIngresos],
      ['Pendiente de cobro', data.totalPendiente],
      ['Egresos', data.totalEgresos],
      ['Saldo del periodo', data.saldo],
    ]);
    hoja['!cols'] = [
      { wch: 13 }, { wch: 42 }, { wch: 25 }, { wch: 18 },
      { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
    ];
    hoja['!merges'] = [XLSX.utils.decode_range('A1:H1')];
    if (filas.length > 0) {
      hoja['!autofilter'] = { ref: `A${filaEncabezado}:H${filaEncabezado + filas.length}` };
    }
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Libro de Caja');
    XLSX.writeFile(libro, `${this.nombreArchivo(data)}.xlsx`);
  }

  private totalPdf(etiqueta: string, valor: number, color: string): any {
    return {
      stack: [
        { text: etiqueta.toUpperCase(), style: 'totalLabel' },
        { text: `$ ${Number(valor).toFixed(2)}`, style: 'totalValue', color },
      ],
    };
  }

  private descripcionPeriodo(data: LibroCajaExportData): string {
    if (data.fechaDesde && data.fechaHasta) {
      return `Periodo: ${this.fechaTexto(data.fechaDesde)} al ${this.fechaTexto(data.fechaHasta)}`;
    }
    if (data.fechaDesde) return `Periodo: desde ${this.fechaTexto(data.fechaDesde)}`;
    if (data.fechaHasta) return `Periodo: hasta ${this.fechaTexto(data.fechaHasta)}`;
    return 'Periodo: todos los registros operativos';
  }

  private descripcionFiltros(data: LibroCajaExportData): string {
    return [
      `Origen: ${data.origen || 'Todos'}`,
      `Tipo: ${data.tipo || 'Todos'}`,
      `Estado: ${data.estado || 'Todos'}`,
    ].join(' · ');
  }

  private etiquetaOrigen(origen: string): string {
    const etiquetas: Record<string, string> = {
      vocalia: 'Vocalía',
      manual: 'Manual',
      saldo_inicial: 'Saldo inicial',
    };
    return etiquetas[origen] ?? origen;
  }

  private etiquetaEstado(estado: string): string {
    const etiquetas: Record<string, string> = {
      pendiente: 'Pendiente',
      pagado: 'Pagado',
      anulado: 'Anulado',
    };
    return etiquetas[estado] ?? estado;
  }

  private fechaTexto(fecha: string): string {
    const [anio, mes, dia] = String(fecha).slice(0, 10).split('-');
    return anio && mes && dia ? `${dia}/${mes}/${anio}` : String(fecha);
  }

  private fechaActual(): string {
    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date());
  }

  private nombreArchivo(data: LibroCajaExportData): string {
    const periodo = data.fechaDesde || data.fechaHasta
      ? `${data.fechaDesde ?? 'INICIO'}_${data.fechaHasta ?? 'HOY'}`
      : 'COMPLETO';
    return `LIBRO_CAJA_${data.campeonatoNombre}_${periodo}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .toUpperCase();
  }
}
