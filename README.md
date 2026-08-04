# Frontend - Sistema de Ligas Barriales

Aplicacion web construida con Angular, TypeScript, RxJS y SCSS.

**Estado de documentacion:** actualizado el 30/07/2026.  
Para el estado funcional completo del sistema, revisar [../ESTADO_ACTUAL_PROYECTO.md](../ESTADO_ACTUAL_PROYECTO.md).

## Tecnologias

- Angular
- TypeScript
- RxJS
- SCSS
- Reactive Forms
- Angular Material en filtros/autocomplete
- pdfmake/jsPDF segun modulo de PDF

## Modulos Frontend Principales

- Auth y dashboard.
- Usuarios.
- Ligas.
- Equipos.
- Jugadores.
- Upload de imagenes.
- Campeonatos.
- Categorias.
- Inscripciones.
- Habilitaciones de jugadores.
- Transferencias.
- Partidos y fixture.
- Tabla de posiciones.
- Goles y goleadores.
- Acta digital.
- Acta de impresion.
- Sanciones.
- Tribunal de penas.
- Tesoreria.
- Garantias.
- Derramas y deudas.
- Componentes compartidos, footer, guards y servicios core.

## Instalacion

```bash
cd frontend
npm install
npm start
```

Aplicacion local:

```text
http://localhost:4201
```

## Configuracion de Entornos

Desarrollo:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
```

Produccion:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://proyectoligasbarrialesback.onrender.com/api',
};
```

Verificar `src/environments/environment.ts` antes de desplegar.

## Scripts

```bash
npm start
npm run build
npm test
npm run test:watch
npm run lint
```

## Funcionalidades UI Destacadas

- Navegacion protegida por roles.
- Menus y acciones visibles segun permisos.
- Filtros avanzados por rol.
- Autocomplete de jugadores.
- Filtros en cascada.
- Formularios reactivos.
- Generacion de PDFs operativos.
- Carga y previsualizacion de imagenes.
- Vistas responsive.
- Acta impresa equivalente al formato fisico.
- Libro de caja y pantallas de tesoreria.

## Testing

Los comandos de test existen, pero falta consolidar una cobertura automatizada completa para los modulos actuales.

## Despliegue

El despliegue documentado usa Netlify.

Ver:

- [Despliegue Netlify + Render](../DESPLIEGUE_NETLIFY_RENDER.md)
- [Forzar rebuild en Netlify](../NETLIFY_REBUILD_INSTRUCTIONS.md)

## Documentacion Relacionada

- [Estado actual del proyecto](../ESTADO_ACTUAL_PROYECTO.md)
- [Mejoras UI y filtros](../MEJORAS_UI_FILTROS.md)
- [Acta de impresion](./ACTA_IMPRIMIR_IMPLEMENTACION.md)
- [Acta digital](../ACTA_DIGITAL_IMPLEMENTACION.md)
- [Upload de imagenes](../UPLOAD_SYSTEM.md)

