# ApuestaDB — Guia de UX/UI del frontend

Documento de la capa visual: tokens, tipografia, espaciados, estados y
comportamiento responsive. Todo esta implementado con CSS propio (variables +
media queries), sin frameworks de UI.

---

## 1. Paleta

Definida en `src/styles/variables.css` como variables CSS reutilizables. Tema oscuro
coherente con la propuesta visual de `docs/HISTORICO/mockups/` (aspecto de casa de apuestas),
sin copiar su marcado.

### Marca y estado

| Token | Valor | Uso |
|---|---|---|
| `--color-primario` | `#10b981` | Marca, boton principal, foco, enlaces activos |
| `--color-primario-oscuro` | `#0d9668` | Hover del boton principal |
| `--color-primario-claro` | `#34d399` | Detalles y texto sobre fondos oscuros |
| `--color-acento` | `#3b82f6` | Enlaces y acentos secundarios |
| `--color-exito` | `#34d399` | Saldo, premios, estados ganados |
| `--color-error` | `#f87171` | Errores, perdidas, acciones destructivas |
| `--color-advertencia` | `#fbbf24` | Pendientes, avisos de alcance |
| `--color-info` | `#60a5fa` | Informacion neutra, estados `programado` |

### Superficies y texto

| Token | Valor | Uso |
|---|---|---|
| `--color-fondo` | `#0b1220` | Fondo de la aplicacion |
| `--color-superficie` | `#131c2e` | Tarjetas, navbar, sidebar, footer |
| `--color-superficie-2` | `#182338` | Controles, cabeceras de tabla, chips |
| `--color-superficie-3` | `#0e1626` | Fondo de inputs |
| `--color-borde` | `#243450` | Bordes principales |
| `--color-borde-suave` | `#1d2b43` | Separadores internos |
| `--color-texto` | `#e6edf7` | Texto principal |
| `--color-texto-suave` | `#8fa3bf` | Texto secundario y etiquetas |
| `--color-texto-inverso` | `#04120c` | Texto sobre fondos verdes |

Los estados se comunican con **color + texto**, nunca solo con color (accesibilidad).

---

## 2. Tipografia

| Token | Valor |
|---|---|
| `--fuente-base` | `'Segoe UI', Roboto, 'Helvetica Neue', Arial, system-ui, sans-serif` |
| `--fuente-mono` | `'Cascadia Mono', Consolas, monospace` |
| `--fs-xs` / `--fs-sm` / `--fs-md` / `--fs-lg` / `--fs-xl` / `--fs-2xl` | 12 / 13 / 15 / 18 / 22 / 28 px |
| `--peso-normal` / `--peso-medio` / `--peso-fuerte` | 400 / 600 / 700 |
| `--interlineado` | 1.55 |

Sin fuentes externas (no hay peticiones de red para tipografia). Los montos usan
`font-variant-numeric: tabular-nums` para alinear cifras en tablas.

---

## 3. Espaciado, radios y sombras

| Grupo | Tokens | Valores |
|---|---|---|
| Espaciado | `--esp-1` … `--esp-7` | 4, 8, 12, 16, 24, 32, 48 px |
| Radios | `--radio-sm` / `md` / `lg` / `pill` | 6 / 10 / 14 / 999 px |
| Sombras | `--sombra-sm` / `md` / `lg` | Desde un borde suave hasta el modal |
| Foco | `--anillo-foco`, `--anillo-foco-error` | Anillos verdes/rojos de 3 px |
| Estructura | `--alto-navbar`, `--ancho-sidebar`, `--ancho-contenedor` | 64 px, 240 px, 1200 px |

Escala de 4 px: cualquier separacion nueva debe usar estos tokens.

---

## 4. Estados visuales obligatorios

| Estado | Implementacion |
|---|---|
| `loading` | `<Loader>` (`role="status"`, `aria-live="polite"`), en bloque o en linea; las tablas muestran el loader en lugar de filas vacias |
| Vacio | `<EmptyState>` con icono, titulo, mensaje y accion de salida |
| Error | `<Alert tipo="error">` con el mensaje normalizado; las tablas y tarjetas conservan el contenido previo cuando ya habia datos |
| `disabled` | `opacity: .55` + `cursor: not-allowed` en `.btn:disabled` y `.campo__control:disabled` |
| Hover | Botones (cambio de fondo), enlaces (subrayado), filas de tabla (tinte azul `rgba(59,130,246,.06)`), tarjetas de cuota (borde primario) |
| Foco | `:focus-visible` con `--anillo-foco`; los inputs usan borde primario + anillo |
| Exito | `<Alert tipo="exito">` y `<Badge tipo="exito">`; montos abonados en verde |
| Advertencia | `<Alert tipo="advertencia">` usado en los avisos «requiere endpoints» |

Detalles de accesibilidad aplicados: `aria-invalid` y `aria-describedby` en campos
con error, `role="alert"` en mensajes de error, `aria-expanded`/`aria-haspopup` en el
menu del usuario, cierre de modal con `Escape`, `aria-current="page"` en la
paginacion, enlace «Saltar al contenido principal» y respeto de
`prefers-reduced-motion`.

---

## 5. Responsive (mobile-first)

Los estilos se escriben para movil y se amplian con `@media (min-width:)`.

| Breakpoint | Objetivo | Cambios principales |
|---|---|---|
| Base (<= 480 px) | Movil | Una columna; sidebar deslizante con velo; navbar compacta (chip de saldo oculto); tablas con scroll horizontal; botones de ancho completo en formularios |
| 481-768 px | Movil grande / tablet vertical | Rejillas a 2 columnas (`.grid-2`, `.rejilla-filtros`); formularios de filtros en dos columnas |
| 769-1024 px | Tablet horizontal / escritorio pequeno | Contenedor con mas padding; cabeceras de pagina en fila (titulo + acciones); `.grid-3` a 2 columnas; `AuthLayout` muestra la columna informativa |
| > 1024 px | Escritorio | Sidebar fijo; `.grid-3` a 3 y `.grid-4` a 4 columnas; filtros hasta 4 columnas |

Comportamientos especificos:

- **Sidebar:** `position: fixed` con `transform: translateX(-105%)` hasta 1024 px;
  desde 1025 px queda fijo y el velo se oculta.
- **Tablas:** `.tabla-envoltura` aplica `overflow-x: auto` y la tabla mantiene
  `min-width: 640px` (480 px en la variante compacta) para no romper el layout.
- **Formularios:** `.rejilla-filtros` pasa de 1 → 2 → 4 columnas; `.formulario--linea`
  de 1 a 4 columnas en escritorio.
- **Navbar:** el chip de saldo se oculta en movil (`display: none` hasta 769 px).

---

## 6. Jerarquia y patrones de pantalla

Todas las pantallas autenticadas siguen el mismo patron:

```
.pagina__cabecera   -> h1 + descripcion + acciones (se apilan en movil)
"pila"              -> columna con gap 16 px entre bloques
Card                -> un proposito por tarjeta: filtros, resumen, tabla o accion
Alert               -> retroalimentacion inmediata arriba del formulario
EmptyState          -> dentro de la tabla o tarjeta cuando no hay datos
```

Las pantallas administrativas separan **acciones** (formularios en tarjetas) de
**consultas** (tablas), y usan pestanas `.pestana` para alternar vistas sin recargar
la pagina.

---

## 7. Limitaciones visuales declaradas

1. Los avisos de funcionalidad pendiente se muestran con `<Alert tipo="info">` y no
   con contenido simulado: no se inventan cuotas, saldos ni notificaciones.
2. Las cuotas y opciones se pintan con el dato real de
   `GET /api/eventos/:id/opciones`. Una opcion o un mercado no operables (estado
   `cerrado` / `inhabilitada`) se dibujan con `.cuota--no-disponible` (borde
   discontinuo y opacidad reducida) y quedan deshabilitados, sin ocultar el dato.
3. La opcion elegida en `CrearApuesta` se resalta con borde y fondo del color
   primario (`aria-pressed`), y el premio potencial se muestra como metrica
   mientras la API recalcula.
4. No hay modo claro: la propuesta visual del proyecto es de tema oscuro.

---

## 8. Ampliacion Fase 11.3 (rediseno premium de los paneles)

Piezas nuevas, todas con datos reales de la API existente y sin dependencias
nuevas. Los estilos viven en `src/styles/panel.css`, importado **despues** de
`dashboard.css`, y amplian el sistema visual de las fases 11 y 11.1 (ningun valor
de token ni regla aprobada se reescribio).

| Pieza | Clases | Uso |
|---|---|---|
| Hero principal | `.hero-panel`, `.hero-panel--acento`, `.hero-stat`, `.hero-panel__pildora` | Saldo consolidado (usuario) y estado del sistema (administrador) |
| Encabezado de seccion | `.panel-seccion`, `.panel-seccion__cabecera`, `.panel-seccion__titulo` | Titulo con icono + subtitulo + accion a la derecha |
| Eventos destacados | `.eventos-destacados`, `.evento-destacado` | 3 tarjetas de partido con cuotas y CTA de apuesta |
| Cuotas destacadas | `.cuotas-destacadas`, `.cuota-destacada` | Franja de cuotas con desplazamiento horizontal |
| Graficas | `.grafica`, `.grafica__lienzo`, `.grafica__barra`, `.grafica__leyenda` | Barras agrupadas y accesibles (`role="img"` + `title` por barra) |
| Acciones rapidas | `.accesos--rail` | Carril deslizable en movil; rejilla desde 481 px |

Reglas de responsive (mobile first, solo `min-width`):

| Breakpoint | Cambios |
|---|---|
| Base | Una columna; hero a pantalla completa con valor en `--fs-display`; estadisticas del hero a 2 columnas; eventos y cuotas en carril deslizable |
| 481 px | Hero con padding ampliado y 4 estadisticas; eventos a 2 columnas; acciones rapidas pasan de carril a rejilla |
| 769 px | Hero a 2 columnas (valor + estadisticas); eventos `auto-fit` con `--ancho-evento-min` |
| 1025 px | Hero con padding `--esp-6`; eventos a 3 columnas |
| <= 380 px | Estadisticas del hero a 1 columna; el marcador "vs" se oculta y los equipos se apilan |

Estados declarados: una cuota sin valor se muestra con `.cuota-destacada__valor--apagado`
("sin cuota") y una opcion no operable con `.cuota-destacada--deshabilitada`; la
grafica sin datos mantiene las columnas con `.grafica__barra--vacia` y lo indica en
el pie. Nunca se simulan cuotas, montos ni series.
