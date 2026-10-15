import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ReciboTesoreria } from './recibos-tesoreria.service';

(pdfMake as any).vfs = pdfFonts;

@Injectable({ providedIn: 'root' })
export class ReciboTesoreriaPdfService {
  descargar(recibo: ReciboTesoreria): void {
    const liga = recibo.liga?.nombre ?? 'Liga Barrial';
    const equipo = recibo.equipo?.nombre ?? 'Equipo';
    const campeonato = recibo.campeonato?.nombre ?? 'No aplica';
    const responsable = recibo.emitidoPor?.nombre ?? 'Tesorería';

    const documento = {
      pageSize: 'A5',
      pageMargins: [34, 34, 34, 34],
      content: [
        { text: liga.toUpperCase(), style: 'liga', alignment: 'center' },
        { text: 'COMPROBANTE DE PAGO', style: 'titulo', alignment: 'center' },
        {
          columns: [
            { text: `Recibo: ${recibo.numero}`, style: 'numero' },
            { text: `Fecha: ${this.formatearFecha(recibo.fechaPago)}`, alignment: 'right', style: 'dato' },
          ],
          margin: [0, 18, 0, 12],
        },
        {
          table: {
            widths: [95, '*'],
            body: [
              [{ text: 'Recibimos de', style: 'etiqueta' }, { text: equipo, style: 'valor' }],
              [{ text: 'Concepto', style: 'etiqueta' }, { text: recibo.concepto, style: 'valor' }],
              [{ text: 'Campeonato', style: 'etiqueta' }, { text: campeonato, style: 'valor' }],
              [{ text: 'Tipo de cobro', style: 'etiqueta' }, { text: this.etiquetaOrigen(recibo.origen), style: 'valor' }],
              [{ text: 'Estado', style: 'etiqueta' }, { text: recibo.estado === 'emitido' ? 'EMITIDO' : 'ANULADO', style: 'valor' }],
            ],
          },
          layout: {
            fillColor: (fila: number) => fila % 2 === 0 ? '#f8fafc' : null,
            hLineColor: '#dbe4ee',
            vLineColor: '#dbe4ee',
          },
        },
        {
          columns: [
            { text: 'TOTAL PAGADO', style: 'totalEtiqueta' },
            { text: `$ ${Number(recibo.monto).toFixed(2)}`, style: 'totalMonto', alignment: 'right' },
          ],
          margin: [0, 18, 0, 0],
        },
        {
          columns: [
            { text: '____________________________\nEntregué conforme', style: 'firma', alignment: 'center' },
            { text: `____________________________\n${responsable}\nTesorería`, style: 'firma', alignment: 'center' },
          ],
          columnGap: 24,
          margin: [0, 42, 0, 0],
        },
        {
          text: 'Documento generado por el Sistema de Ligas Barriales.',
          style: 'pie',
          alignment: 'center',
          margin: [0, 24, 0, 0],
        },
      ],
      styles: {
        liga: { fontSize: 13, bold: true, color: '#243b5a' },
        titulo: { fontSize: 17, bold: true, color: '#0f3557', margin: [0, 5, 0, 0] },
        numero: { fontSize: 10, bold: true, color: '#1673b1' },
        dato: { fontSize: 9, color: '#475569' },
        etiqueta: { fontSize: 9, bold: true, color: '#475569', margin: [3, 4, 3, 4] },
        valor: { fontSize: 9, color: '#172033', margin: [3, 4, 3, 4] },
        totalEtiqueta: { fontSize: 12, bold: true, color: '#0f3557' },
        totalMonto: { fontSize: 18, bold: true, color: '#15803d' },
        firma: { fontSize: 8, color: '#475569', lineHeight: 1.25 },
        pie: { fontSize: 7, color: '#94a3b8' },
      },
      defaultStyle: { fontSize: 9 },
    };

    pdfMake.createPdf(documento as any).download(`${recibo.numero}_${this.limpiarNombre(equipo)}.pdf`);
  }

  private etiquetaOrigen(origen: string): string {
    const etiquetas: Record<string, string> = {
      cobro_partido: 'Vocalía de partido',
      movimiento: 'Movimiento de tesorería',
      derrama: 'Derrama',
      garantia: 'Garantía',
    };
    return etiquetas[origen] ?? origen;
  }

  private formatearFecha(valor: string): string {
    const fecha = String(valor).slice(0, 10).split('-');
    return fecha.length === 3 ? `${fecha[2]}/${fecha[1]}/${fecha[0]}` : valor;
  }

  private limpiarNombre(valor: string): string {
    return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_');
  }
}
