# MEJORAS DEL DASHBOARD — ApuestaDB (Fase 11.1)

Rediseño visual del **Dashboard de Usuario** (`/dashboard`) y del **Dashboard de
Administrador** (`/admin`) manteniendo intacta la lógica de negocio, la base de
datos, el backend y los endpoints existentes.

- Alcance: solo `frontend/` (React + Vite). Sin cambios en `backend/`, `database/` ni en el contrato de la API.
- Prioridad aplicada: **UX/UI > estética > funcionalidad ya existente**.
- Verificación: `npm run build` sin errores (150 módulos, CSS 34.39 kB, JS 336 kB).

## 1. Auditoría del dashboard anterior

| # | Hallazgo | Evidencia en el código previo |
|---|---|---|
| 1 | **Saldo sin jerarquía**: el dato más importante competía visualmente con tres tarjetas iguales. | `DashboardUsuario` mostraba el saldo con un `Card` + `Metrica` dentro de un `grid grid-3`. |
| 2 | **Información repetida**: el conteo de apuestas aparecía como KPI y otra vez en la tabla; los eventos como KPI y en la lista; el detalle de cuentas repetía la lista visible. | Bloque `grid-3` + `Card` "Apuestas registradas" / "Eventos disponibles" y el `detalle` de `Metrica`. |
| 3 | **Componentes poco expresivos**: `Metrica` no admitía icono, tendencia ni enlace al detalle; el estado vacío dependía de emojis con baja legibilidad en tema oscuro. | `Metrica.jsx` (etiqueta, valor, detalle) y `EmptyState` con `icono` emoji. |
| 4 | **Espacios desaprovechados**: en escritorio (≥1025px) las filas de 3 tarjetas dejaban columnas libres y no existía banda de resumen. | `global.css`: `.grid-3` fija 3 columnas; sin contenedores de ancho completo. |
| 5 | **Secciones ausentes del requisito**: el panel de usuario no mostraba notificaciones y el administrativo no tenía "movimientos recientes" ni "alertas del sistema", aunque `GET /api/notificaciones`, `GET /api/auditoria` y `GET /api/health` ya existían. | `DashboardUsuario` (4 peticiones) y `DashboardAdministrador` (6 peticiones). |
| 6 | **Navegación dispersa**: las tareas frecuentes se resolvían desde el sidebar; el panel no ofrecía accesos rápidos. | Cabecera con 2 enlaces y `Sidebar` con 12 entradas. |
| 7 | **Responsive mejorable**: `grid-3`/`grid-4` saltaban a 2 columnas desde 769px (tarjetas muy anchas en tablet) y las tablas de 6 columnas obligaban a desplazamiento horizontal sin contexto. | `global.css` (`grid-3`, `grid-4`) y `.tabla { min-width: 640px }`. |
| 8 | **Jerarquía del panel administrativo**: formularios operativos, tablas y métricas compartían el mismo peso visual; los KPI no tenían icono ni tono. | `DashboardAdministrador`: `grid grid-4` de `Metrica` + tarjetas operativas. |

## 2. Dashboard de Usuario (rediseño)

Orden visual de arriba hacia abajo, con la información prioritaria primero:

1. **Cabecera** con saludo y acciones ("Apostar ahora", "Mi saldo").
2. **Hero de saldo destacado**: saldo consolidado a tamaño display, número de cuentas y apuestas, acciones directas y **chips por tipo de saldo** (tokens / PSE) con su fecha de actualización.
3. **Cuatro indicadores (KPI)**: apuestas registradas, ganadas (premios cobrados), perdidas (monto no recuperado) y pendientes (en juego).
4. **Resumen de ganancias y pérdidas**: barras de progreso ganadas / perdidas / pendientes sobre el total del historial + **resultado neto** (premios cobrados − monto apostado).
5. **Accesos rápidos**: apostar, mis apuestas, movimientos, ranking, notificaciones (con contador sin leer) y perfil.
6. **Próximos eventos** y **notificaciones recientes** (sección nueva, `GET /api/notificaciones?limite=6`).
7. **Últimas apuestas** (tabla compacta con columna nueva de premio) y **últimos movimientos** de saldo.

## 3. Dashboard de Administrador (rediseño)

1. **Cabecera** con "Nueva recarga" y "Ver reportes".
2. **Cuatro KPI del sistema**: total usuarios, total apuestas (con monto apostado), eventos activos y eventos finalizados.
3. **Tres KPI financieros**: premios pagados, margen del sistema (apostado − premios) y saldo consolidado en cuentas.
4. **Operaciones** (registrar resultado) junto a **Alertas del sistema** (sección nueva): estado de la base de datos desde `GET /api/health`, eventos activos sin resultado, eventos finalizados con resultado oficial y usuarios inhabilitados, más una barra de cobertura del catálogo de usuarios.
5. **Liquidar apuestas** (misma lógica: por evento o por apuesta) junto a **Movimientos recientes del sistema** (sección nueva sobre `GET /api/auditoria?top=8`, con semántica de éxito/fallo).
6. **Accesos administrativos**: reportes, ranking, eventos activos, eventos finalizados, movimientos y nueva recarga.
7. **Usuarios y saldo consolidado** (tabla compacta) y el **modal de recarga ficticia** (sin cambios de comportamiento).

## 4. Sistema visual

| Área | Antes | Ahora |
|---|---|---|
| Paleta | Tokens base en `variables.css` | Se conservan; se añaden gradientes de marca/acento, tintes de estado y sombras de elevación (`--grad-marca`, `--tinte-*`, `--sombra-tarjeta`, `--sombra-elevada`). |
| Jerarquía | `Metrica` y títulos del mismo peso | Escala ampliada (`--fs-3xl`, `--fs-4xl`), hero de saldo, secciones con icono y contador, KPI con tono. |
| Tipografía | `fs-xs…fs-2xl` | Se agregan tamaños display para el saldo y espaciado de títulos; se conserva `Segoe UI`/`Roboto`. |
| Tarjetas | Borde + sombra simple | Elevación al pasar el cursor, variantes `acento`, `acento-azul`, `interactiva`, `destacada` y cabecera con divisor. |
| Tablas | Encabezado plano | Encabezado con degradado sutil, filas alternas, hover más marcado y modo `compacta` en el panel. |
| Botones | Planos | Realce al pulsar, anillo de foco, sombra en primario, variante `btn--acento` y soporte de icono (`btn__icono`). |
| Formularios | Igual | Sin cambios funcionales; heredan el anillo de foco y las ayudas existentes. |
| Iconografía | Emojis del sistema | Set SVG propio de 20 iconos (`Icono.jsx`) que hereda `currentColor` y el tamaño del contexto. |
| Pestañas | Botones sueltos | Control segmentado con contenedor, borde y realce de la opción activa. |

## 5. Componentes reutilizables nuevos

| Componente | Propósito | API |
|---|---|---|
| `Icono.jsx` | Iconografía SVG sin librerías. | `nombre`, `tamano`, `titulo`, `className` |
| `StatCard.jsx` | Tarjeta KPI con icono, tono, indicador de tendencia y enlace. | `etiqueta`, `valor`, `detalle`, `icono`, `tono`, `enlace`, `indicador`, `cargando` |
| `ProgressBar.jsx` | Barra de progreso etiquetada y accesible (`role="progressbar"`). | `etiqueta`, `valor`, `total`, `textoValor`, `detalle`, `tono` |
| `AccionRapida.jsx` | Acceso rápido como enlace o botón. | `to`, `titulo`, `descripcion`, `icono`, `onClick` |
| `ListaActividad.jsx` | Lista de movimientos, notificaciones, eventos o auditoría. | `items[]`, `vacio`, `cargando` |
| `AlertaSistema.jsx` | Aviso compacto del sistema/negocio. | `titulo`, `detalle`, `tono`, `icono` |

Todos se exportan desde `src/components/index.js` y reutilizan los componentes ya existentes (`Card`, `Badge`, `EmptyState`, `Loader`, `Table`, `Alert`).

## 6. Archivos

**Nuevos**

- `src/components/Icono.jsx`, `StatCard.jsx`, `ProgressBar.jsx`, `AccionRapida.jsx`, `ListaActividad.jsx`, `AlertaSistema.jsx`
- `src/styles/dashboard.css`
- `docs/ACTUAL/frontend/MEJORAS_DASHBOARD.md` (este documento)

**Modificados**

- `src/pages/DashboardUsuario.jsx` (rediseño completo; se añadió `GET /api/notificaciones`)
- `src/pages/DashboardAdministrador.jsx` (rediseño completo; se añadieron `GET /api/auditoria` y `GET /api/health`)
- `src/styles/variables.css` (tokens aditivos), `src/styles/components.css` (mejoras a clases existentes)
- `src/components/index.js` (nuevas exportaciones), `src/main.jsx` (`import './styles/dashboard.css'`)

## 7. Compatibilidad y no modificación

- **Sin cambios** en base de datos, backend, API, procedimientos, vistas, funciones y triggers.
- **Sin endpoints nuevos**: las secciones añadidas usan endpoints ya existentes (`/api/notificaciones`, `/api/auditoria`, `/api/health`, `/api/reportes/*`, `/api/usuarios`, `/api/saldo`, `/api/apuestas`, `/api/eventos/*`).
- **APIs de componentes conservadas**: `Card`, `Metrica`, `Table`, `Alert`, `Badge`, `EmptyState`, `FormField`, `Modal`, `Loader` mantienen sus props, de modo que las demás páginas no requieren cambios.
- Se conservan `React`, `Context API` (`useAuth`), `Axios` (servicios) y `React Router` (`Link`/`useNavigate`).
- Los estados, textos y validaciones de los formularios administrativos quedaron idénticos.

## 8. Verificación

| Prueba | Resultado |
|---|---|
| `npm run build` | OK — 150 módulos transformados, sin errores ni advertencias de Vite |
| Artefactos | `dist/assets/index-*.css` 34.39 kB (gzip 6.59) · `dist/assets/index-*.js` 336.00 kB (gzip 102.38) |
| Módulos nuevos respecto a la Fase 11 | +7 (6 componentes, 1 hoja de estilos) |
| Endpoints consumidos | 12 (los mismos del contrato de Fase 10.1 + los 3 de solo lectura ya existentes en el panel) |
| Recorrido clicable en navegador | No ejecutado (política de navegación); verificación por compilación |

## 9. Pendientes que no bloquean

- `PATCH /api/notificaciones/:id` para marcar como leída (la bandeja sigue siendo de solo lectura).
- `GET /api/saldo/tipos` (catálogo global de tipos de saldo) para el selector de recargas; hoy se toman de `GET /api/saldo`.
- Prueba visual en dispositivos reales y recorrido clicable, pendientes desde la Fase 12.

---

# Ampliacion Fase 11.3 - Rediseno premium de los paneles

Segunda iteracion visual sobre `/dashboard` y `/admin`: el objetivo deja de ser
"mostrar informacion" y pasa a ser **parecer una aplicacion profesional de
apuestas deportivas** (experiencia visual > cantidad de informacion). Sigue sin
tocarse base de datos, backend ni contrato de la API: solo `frontend/`.

## 10. Auditoria de la Fase 11.1

| # | Hallazgo | Evidencia en el codigo previo |
|---|---|---|
| 1 | El hero de saldo, aun siendo el bloque principal, se veia como una tarjeta mas: sin jerarquia tipografica display ni profundidad. | `.hero-saldo` en `dashboard.css` (fase 11.1) con `--fs-4xl` fijo. |
| 2 | **Faltaban las piezas propias de una casa de apuestas**: no habia eventos destacados ni cuotas visibles en el panel; el usuario debia ir a `/eventos` para ver una cuota. | Ninguna pantalla del panel consumia `GET /api/eventos/:id/opciones`. |
| 3 | **Sin graficas**: el rendimiento solo se leia en barras de progreso y una tabla; el administrador no tenia ninguna vista comparativa. | `DashboardUsuario`/`DashboardAdministrador` sin series temporales. |
| 4 | El panel administrativo no tenia hero: tres KPI financieros competian con cuatro KPI de sistema, sin dato protagonista. | Bloque `panel-grid--3` de `StatCard` financieros. |
| 5 | Responsive de escritorio primero: los ajustes usaban `max-width: 480px`. | Bloque final de `dashboard.css`. |
| 6 | Los accesos rapidos repetian el patron de rejilla incluso en movil, empujando el contenido principal hacia abajo. | `.accesos` con `auto-fit` `--ancho-tarjeta-accion`. |

## 11. Dashboard de Usuario (iteracion premium)

1. **Cabecera** con fecha del dia y acciones.
2. **Hero principal de saldo** (`.hero-panel`): valor en `--fs-display`, cuentas por tipo, y cuatro estadisticas (apuestas, % de acierto, saldo en juego, resultado neto).
3. **KPIs en tarjetas**: las mismas cuatro metricas, ahora con indicador de tendencia en "Apuestas ganadas" (% de acierto sobre liquidadas).
4. **Grafica de rendimiento**: barras agrupadas de "Apostado" vs "Premios cobrados" de los ultimos 7 dias (`.grafica`), junto al resumen de ganancias/perdidas.
5. **Eventos destacados**: 3 tarjetas de partido con metadatos, estado y **cuotas vigentes reales** de `GET /api/eventos/:id/opciones` (max. 2 mercados x 3 opciones por evento), con CTA a `/apuestas/nueva?evento=`.
6. **Cuotas destacadas**: franja deslizable con las 6 cuotas mas altas de la cartelera destacada, con el partido como detalle.
7. **Movimientos recientes** y **notificaciones recientes**.
8. **Acciones rapidas** en carril deslizable (rejilla desde 481 px).
9. **Ultimas apuestas** (tabla compacta con fecha y hora).

## 12. Dashboard de Administrador (iteracion premium)

1. **Hero del sistema** (`.hero-panel--acento`): saldo consolidado en cuentas como dato protagonista, pildora de estado de la base de datos (`GET /api/health`) y cuatro estadisticas (margen, premios pagados, monto apostado, total recargado).
2. **KPIs de sistema** con indicadores (eventos sin resultado / eventos por liquidar).
3. **Graficas de gestion**: flujo financiero por tipo de saldo (recargado, apostado, premios) y rendimiento por evento (apostado vs premios pagados, top 6).
4. **Eventos destacados** y **cuotas destacadas** de la cartelera activa (mismas piezas que el panel de usuario).
5. **Operaciones** (registrar resultado) + **Alertas del sistema** (sin cambios de comportamiento).
6. **Liquidar apuestas** + **Movimientos recientes del sistema** (sin cambios de comportamiento).
7. **Acciones rapidas**, **tabla de usuarios** y **modal de recarga** (logica y validaciones intactas).

## 13. Piezas nuevas

| Pieza | Tipo | Datos | Estilos |
|---|---|---|---|
| `EventoDestacado` | Componente | `GET /api/eventos/activos` + `GET /api/eventos/:id/opciones` | `.evento-destacado` |
| `CuotaDestacada` | Componente | `GET /api/eventos/:id/opciones` | `.cuota-destacada` |
| `GraficaBarras` | Componente | series calculadas en la pagina | `.grafica` |
| `panel.css` | Hoja de estilos | — | Hero, secciones, eventos, cuotas, graficas y carriles |

Tokens aditivos en un tercer bloque `:root` de `variables.css`: `--grad-hero`,
`--grad-hero-acento`, `--grad-cuota`, `--grad-cuota-acento`, `--velo-vidrio`,
`--borde-vidrio`, `--borde-resalte-acento`, `--brillo-marca`, `--sombra-flotante`,
`--fs-display`, `--fs-display-sm`, `--radio-2xl`, `--alto-grafica`,
`--ancho-cuota-min`, `--ancho-evento-min`, `--alto-hero-premium`,
`--transicion-suave`. Ningun token aprobado en las fases 11 y 11.1 se reescribio.

## 14. Archivos de la Fase 11.3

**Nuevos**

- `src/components/EventoDestacado.jsx`, `src/components/CuotaDestacada.jsx`, `src/components/GraficaBarras.jsx`
- `src/styles/panel.css`

**Modificados**

- `src/pages/DashboardUsuario.jsx` (hero premium, eventos/cuotas destacadas, grafica de 7 dias)
- `src/pages/DashboardAdministrador.jsx` (hero del sistema, dos graficas, eventos/cuotas destacadas)
- `src/components/index.js` (3 exportaciones), `src/main.jsx` (`panel.css` despues de `dashboard.css`)
- `src/styles/variables.css` (tokens aditivos Fase 11.3)
- `docs/ACTUAL/frontend/COMPONENTES.md`, `docs/ACTUAL/frontend/UX_UI.md`

## 15. Compatibilidad y verificacion

- **Sin cambios** en base de datos, backend, API, procedimientos, vistas, funciones ni triggers.
- **Sin endpoints nuevos**: las piezas nuevas reutilizan `GET /api/eventos/activos`, `GET /api/eventos/:id/opciones`, `GET /api/apuestas`, `GET /api/saldo/movimientos`, `GET /api/notificaciones`, `GET /api/reportes/administrativo`, `GET /api/reportes/financiero`, `GET /api/auditoria` y `GET /api/health`.
- **APIs de componentes conservadas**: `Card`, `Metrica`, `Table`, `Alert`, `Badge`, `EmptyState`, `FormField`, `Modal`, `Loader`, `StatCard`, `ProgressBar`, `AccionRapida`, `ListaActividad` y `AlertaSistema` mantienen sus props; las demas pantallas compilan sin cambios.
- Los formularios administrativos (resultado, liquidacion, recarga) conservan validaciones, estados y textos.

| Prueba | Resultado |
|---|---|
| `npm run build` | OK - 154 modulos transformados, sin errores ni advertencias de Vite |
| Artefactos | `dist/assets/index-*.css` 45.68 kB (gzip 8.15) y `dist/assets/index-*.js` 352.16 kB (gzip 105.85) |
| Modulos nuevos respecto a la Fase 11.1 | +4 (3 componentes, 1 hoja de estilos) |
| Peticiones del panel de usuario | 6 en la carga inicial + 1 por cada evento destacado (max. 3, en paralelo) |
| Peticiones del panel administrativo | 8 en la carga inicial + 1 por cada evento destacado (max. 3, en paralelo) |
| Recorrido clicable en navegador | No ejecutado (politica de navegacion); verificacion por compilacion |

## 16. Pendientes que no bloquean

- `PATCH /api/notificaciones/:id` (la bandeja sigue siendo de solo lectura).
- `GET /api/saldo/tipos` (catalogo global para el selector de recargas).
- Las cuotas de los eventos destacados implican una peticion por evento; un endpoint de cuotas en lote las reduciria.
- Prueba visual en dispositivos reales y recorrido clicable.
