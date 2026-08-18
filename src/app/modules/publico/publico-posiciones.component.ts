import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoriaPublica, FilaPosicionPublica, PublicoService } from './publico.service';

@Component({
  selector: 'app-publico-posiciones',
  templateUrl: './publico-posiciones.component.html',
  styleUrls: ['./publico.component.scss'],
})
export class PublicoPosicionesComponent implements OnInit {
  ligaId = 0;
  campeonatoId = 0;
  categorias: CategoriaPublica[] = [];
  etapas: string[] = [];
  categoriaId = 0;
  etapa = '';
  tabla: FilaPosicionPublica[] = [];
  cargando = true;
  error = '';

  constructor(private readonly route: ActivatedRoute, private readonly publicoService: PublicoService) {}

  ngOnInit(): void {
    this.ligaId = Number(this.route.snapshot.paramMap.get('ligaId'));
    this.campeonatoId = Number(this.route.snapshot.paramMap.get('campeonatoId'));
    if (!this.ligaId || !this.campeonatoId) { this.error = 'Campeonato no válido.'; this.cargando = false; return; }
    this.publicoService.listarCategorias(this.campeonatoId).subscribe({
      next: categorias => {
        this.categorias = categorias;
        if (!categorias.length) { this.cargando = false; return; }
        this.categoriaId = categorias[0].id;
        this.cargarEtapas();
      },
      error: () => { this.error = 'No se pudieron cargar las categorías.'; this.cargando = false; },
    });
  }

  cambiarCategoria(valor: string): void { this.categoriaId = Number(valor); this.tabla = []; this.cargarEtapas(); }
  cambiarEtapa(valor: string): void { this.etapa = valor; this.cargarTabla(); }

  private cargarEtapas(): void {
    this.cargando = true;
    this.publicoService.listarEtapas(this.campeonatoId, this.categoriaId).subscribe({
      next: etapas => { this.etapas = etapas; this.etapa = etapas[0] ?? ''; this.etapa ? this.cargarTabla() : this.cargando = false; },
      error: () => { this.error = 'No se pudieron cargar las etapas.'; this.cargando = false; },
    });
  }

  private cargarTabla(): void {
    this.cargando = true;
    this.publicoService.consultarPosiciones(this.campeonatoId, this.categoriaId, this.etapa).subscribe({
      next: tabla => { this.tabla = tabla; this.cargando = false; },
      error: () => { this.error = 'No se pudo cargar la tabla de posiciones.'; this.cargando = false; },
    });
  }
}
