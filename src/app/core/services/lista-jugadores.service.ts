import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';
import { JugadorCampeonato } from '../../modules/jugador-campeonatos/jugador-campeonato.model';

(pdfMake as any).vfs = pdfFonts;

@Injectable({
  providedIn: 'root'
})
export class ListaJugadoresService {

  /**
   * Ordena los jugadores habilitados activos por número de camiseta (ascendente).
   * Los que no tienen número asignado van al final.
   */
  private ordenarPorNumeroCamiseta(jugadores: JugadorCampeonato[]): JugadorCampeonato[] {
    return [...jugadores]
      .filter(jc => jc.estado === 'habilitado' && jc.activo !== false)
      .sort((a, b) => {
        const na = a.numeroCancha ?? 9999;
        const nb = b.numeroCancha ?? 9999;
        return na - nb;
      });
  }

  /**
   * Genera y descarga un PDF con la lista de jugadores habilitados,
   * ordenados por número de camiseta.
   *
   * Usa pdfMake (ya instalado en el proyecto) para construir el documento
   * con una tabla profesional. El método .download() le indica al navegador
   * que descargue el archivo en lugar de abrirlo.
   */
  /**
   * Convierte una URL de imagen (ej. Cloudinary) a Base64 para poder
   * embeberla en un documento pdfMake sin problemas de CORS.
   */
  private async fetchImagenBase64(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  async descargarListaPDF(
    jugadores: JugadorCampeonato[],
    campeonatoNombre: string,
    equipoNombre: string,
    escudoUrl?: string,
    categoriaNombre?: string
  ): Promise<void> {
    const ordenados = this.ordenarPorNumeroCamiseta(jugadores);

    // Intentar cargar el escudo como Base64
    const escudoBase64 = escudoUrl ? await this.fetchImagenBase64(escudoUrl) : null;

    // Encabezados de la tabla
    const header = [
      { text: 'N° Camiseta', style: 'tableHeader' },
      { text: 'Nombre', style: 'tableHeader' },
      { text: 'Cédula', style: 'tableHeader' },
    ];

    // Filas de jugadores
    const filas = ordenados.map((jc) => [
      { text: String(jc.numeroCancha ?? '-'), alignment: 'center' },
      { text: jc.jugador?.nombre || '-' },
      { text: jc.jugador?.cedula || '-' },
    ]);

    const docDefinition: any = {
      pageOrientation: 'landscape',
      pageMargins: [30, 40, 30, 40],
      content: [
        // Encabezado: escudo a la izquierda + texto centrado
        {
          columns: [
            // Columna izquierda: escudo del equipo (si existe)
            escudoBase64
              ? { image: escudoBase64, width: 60, height: 60, margin: [0, 0, 0, 0] }
              : { text: '', width: 60 },
            // Columna central: títulos
            {
              stack: [
                { text: 'LISTA DE JUGADORES HABILITADOS', style: 'title', alignment: 'center', margin: [0, 0, 0, 4] },
                { text: `Campeonato: ${campeonatoNombre}   |   Equipo: ${equipoNombre}   |   Categoría: ${categoriaNombre || 'Todas'}`, style: 'subtitle', alignment: 'center', margin: [0, 0, 0, 4] },
                { text: `Generado el: ${new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })}   |   Total jugadores: ${ordenados.length}`, style: 'info', alignment: 'center' },
              ],
            },
            // Columna derecha: espejo del escudo para centrar el texto
            { text: '', width: 60 },
          ],
          margin: [0, 0, 0, 16],
        },
        {
          table: {
            headerRows: 1,
            widths: [60, '*', 100],
            body: [header, ...filas],
          },
          layout: {
            hLineWidth: (i: number) => (i === 0 || i === 1) ? 2 : 0.5,
            vLineWidth: () => 0.5,
            hLineColor: (i: number) => (i === 0 || i === 1) ? '#2c3e50' : '#bdc3c7',
            vLineColor: () => '#bdc3c7',
            fillColor: (rowIndex: number) => {
              if (rowIndex === 0) return '#2c3e50';
              return rowIndex % 2 === 0 ? '#f2f3f4' : null;
            },
          },
        },
        {
          text: `\nFirma del Dirigente: _______________________________     Sello del Equipo: _______________________________`,
          style: 'firma',
          margin: [0, 20, 0, 0],
        },
      ],
      styles: {
        title: { fontSize: 16, bold: true, color: '#2c3e50' },
        subtitle: { fontSize: 11, bold: true, color: '#555' },
        info: { fontSize: 9, color: '#888' },
        tableHeader: { bold: true, color: 'white', fontSize: 10 },
        firma: { fontSize: 10, color: '#555', italics: true },
      },
      defaultStyle: { fontSize: 9, color: '#333' },
    };

    const nombreArchivo = `LISTA_JUGADORES_${equipoNombre}_${campeonatoNombre}.pdf`
      .replace(/\s+/g, '_').toUpperCase();

    pdfMake.createPdf(docDefinition).download(nombreArchivo);
  }

  /**
   * Genera y descarga un archivo Excel (.xlsx) con la lista de jugadores habilitados,
   * ordenados por número de camiseta.
   *
   * Usa la librería xlsx (SheetJS) para construir la hoja de cálculo en memoria
   * y luego dispara la descarga usando un enlace temporal. No requiere servidor.
   */
  descargarListaExcel(jugadores: JugadorCampeonato[], campeonatoNombre: string, equipoNombre: string): void {
    const ordenados = this.ordenarPorNumeroCamiseta(jugadores);

    // Construir los datos como array de objetos
    const datos = ordenados.map((jc) => ({
      'N° Camiseta': jc.numeroCancha ?? '-',
      'Nombre': jc.jugador?.nombre || '-',
      'Cédula': jc.jugador?.cedula || '-',
      'Equipo': jc.equipo?.nombre || '-',
      'Campeonato': jc.campeonato?.nombre || '-',
    }));

    // Crear la hoja de cálculo a partir del array de objetos
    const hoja: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datos);

    // Ajustar el ancho de las columnas automáticamente
    hoja['!cols'] = [
      { wch: 12 },  // N° Camiseta
      { wch: 30 },  // Nombre
      { wch: 15 },  // Cédula
      { wch: 20 },  // Equipo
      { wch: 25 },  // Campeonato
    ];

    // Crear el libro de trabajo y agregar la hoja
    const libro: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Jugadores Habilitados');

    // Descargar el archivo
    const nombreArchivo = `LISTA_JUGADORES_${equipoNombre}_${campeonatoNombre}.xlsx`
      .replace(/\s+/g, '_').toUpperCase();

    XLSX.writeFile(libro, nombreArchivo);
  }
}
