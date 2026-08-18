import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoriaPublica, GoleadorPublico, PublicoService } from './publico.service';

@Component({ selector: 'app-publico-goleadores', templateUrl: './publico-goleadores.component.html', styleUrls: ['./publico.component.scss'] })
export class PublicoGoleadoresComponent implements OnInit {
  ligaId = 0; campeonatoId = 0; categorias: CategoriaPublica[] = []; categoriaId = 0;
  goleadores: GoleadorPublico[] = []; cargando = true; error = '';
  constructor(private readonly route: ActivatedRoute, private readonly publicoService: PublicoService) {}

  ngOnInit(): void {
    this.ligaId = Number(this.route.snapshot.paramMap.get('ligaId')); this.campeonatoId = Number(this.route.snapshot.paramMap.get('campeonatoId'));
    if (!this.ligaId || !this.campeonatoId) { this.error = 'Campeonato no válido.'; this.cargando = false; return; }
    this.publicoService.listarCategorias(this.campeonatoId).subscribe({
      next: categorias => { this.categorias = categorias; if (!categorias.length) { this.cargando = false; return; } this.categoriaId = categorias[0].id; this.cargarGoleadores(); },
      error: () => { this.error = 'No se pudieron cargar las categorías.'; this.cargando = false; },
    });
  }

  cambiarCategoria(valor: string): void { this.categoriaId = Number(valor); this.cargarGoleadores(); }
  private cargarGoleadores(): void { this.cargando = true; this.publicoService.listarGoleadores(this.campeonatoId, this.categoriaId).subscribe({ next: goleadores => { this.goleadores = goleadores; this.cargando = false; }, error: () => { this.error = 'No se pudieron cargar los goleadores.'; this.cargando = false; } }); }
}
