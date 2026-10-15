import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { CierreCajaTesoreria } from '../../../core/services/tesoreria.service';

(pdfMake as any).vfs = pdfFonts;

@Injectable({ providedIn: 'root' })
export class CierreCajaExportService {
  descargarPdf(data: {
    cierre: CierreCajaTesoreria;
    ligaNombre: string;
    campeonatoNombre: string;
  }): void {
    const { cierre } = data;
    const tipo = cierre.tipo === 'cierre_definitivo' ? 'CIERRE DEFINITIVO DE CAJA' : 'CONCILIACIÓN DE CAJA';
    const documento = {
      pageMargins: [45, 42, 45, 42],
      content: [
        { text: tipo, style: 'title', alignment: 'center' },
        { text: data.ligaNombre, style: 'league', alignment: 'center' },
        { text: data.campeonatoNombre, style: 'subtitle', alignment: 'center' },
        { text: `Corte N.º ${cierre.id}`, style: 'meta', alignment: 'center', margin: [0, 3, 0, 18] },
        {
          table: {
            widths: ['35%', '65%'],
            body: [
              ['Fecha de corte', this.fecha(cierre.fechaCorte)],
              ['Período conciliado', `${this.fecha(cierre.fechaDesde)} al ${this.fecha(cierre.fechaCorte)}`],
              ['Responsable', cierre.creadoPor?.nombre ?? 'Usuario no disponible'],
              ['Registrado el', this.fechaHora(cierre.creadoEn)],
            ],
          },
          layout: 'lightHorizontalLines',
        },
        { text: 'RESUMEN DEL CONTEO', style: 'section', margin: [0, 20, 0, 8] },
        {
          table: {
            widths: ['*', 100],
            body: [
              ['Saldo base', this.dinero(cierre.saldoBase)],
              ['(+) Ingresos cobrados del período', this.dinero(cierre.totalIngresos)],
              ['(−) Egresos pagados del período', this.dinero(cierre.totalEgresos)],
              [{ text: 'Saldo esperado', bold: true }, { text: this.dinero(cierre.saldoEsperado), bold: true }],
              [{ text: 'Dinero contado', bold: true }, { text: this.dinero(cierre.saldoContado), bold: true }],
              [
                { text: 'Diferencia', bold: true },
                { text: `${Number(cierre.diferencia) > 0 ? '+' : ''}${this.dinero(cierre.diferencia)}`, bold: true, color: Number(cierre.diferencia) === 0 ? '#166534' : '#B91C1C' },
              ],
            ],
          },
          layout: {
            fillColor: (fila: number) => fila >= 3 ? '#F8FAFC' : null,
            hLineColor: () => '#CBD5E1',
            vLineColor: () => '#CBD5E1',
          },
        },
        { text: 'OBSERVACIONES', style: 'section', margin: [0, 20, 0, 6] },
        { text: cierre.observaciones || 'Sin novedades.', style: 'observations' },
        {
          columns: [
            { stack: [{ text: '_______________________________', alignment: 'center' }, { text: 'Responsable de Tesorería', alignment: 'center', style: 'signature' }] },
            { stack: [{ text: '_______________________________', alignment: 'center' }, { text: 'Representante de la Liga', alignment: 'center', style: 'signature' }] },
          ],
          columnGap: 40,
          margin: [0, 70, 0, 0],
        },
        { text: 'Este documento corresponde a un registro inmutable del sistema.', style: 'footer', alignment: 'center', margin: [0, 25, 0, 0] },
      ],
      styles: {
        title: { fontSize: 17, bold: true, color: '#1E293B' },
        league: { fontSize: 12, bold: true, color: '#1673B1', margin: [0, 5, 0, 0] },
        subtitle: { fontSize: 10, color: '#475569', margin: [0, 2, 0, 0] },
        meta: { fontSize: 9, color: '#64748B' },
        section: { fontSize: 10, bold: true, color: '#334155' },
        observations: { fontSize: 9, color: '#334155', fillColor: '#F8FAFC', margin: [7, 7, 7, 7] },
        signature: { fontSize: 8, color: '#64748B', margin: [0, 4, 0, 0] },
        footer: { fontSize: 7, color: '#94A3B8' },
      },
      defaultStyle: { fontSize: 9, color: '#334155' },
    };
    pdfMake.createPdf(documento as any).download(
      `${cierre.tipo === 'cierre_definitivo' ? 'CIERRE_FINAL' : 'CONCILIACION'}_${data.campeonatoNombre}_${cierre.fechaCorte}`
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase() + '.pdf',
    );
  }

  private dinero(valor: number): string { return `$ ${Number(valor).toFixed(2)}`; }

  private fecha(valor: string): string {
    const [anio, mes, dia] = String(valor).slice(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
  }

  private fechaHora(valor: string): string {
    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(valor));
  }
}
