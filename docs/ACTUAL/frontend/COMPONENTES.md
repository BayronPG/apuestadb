# ApuestaDB — Componentes del frontend

Catalogo de los componentes reutilizables de `frontend/src/components/`. Todos son
componentes de funcion, sin dependencias de la API y con estilos tomados de
`styles/components.css` y `styles/layout.css`.

Resumen: **14 componentes obligatorios + 1 adicional (Metrica) + barril `index.js`**.

> **Fase 11.1:** no cambio la API de ningun componente. Las pantallas
> `CrearApuesta`, `EventosActivos`, `HistorialMovimientos` y `DashboardAdministrador`
> usan los componentes existentes (`FormField` con `tipo="select"`, `Table`,
> `Badge`, `Alert`, `Loader`, `Modal`, `Metrica`). Las cuotas de un evento se
> renderizan con el componente local `CuotasEvento` definido dentro de
> `pages/EventosActivos.jsx`, porque solo tiene sentido en esa pantalla.

---

## 1. Navbar

Barra superior de la zona autenticada: marca, boton de menu (movil), chip de saldo,
campana de notificaciones y menu desplegable del usuario con cierre de sesion.

| Prop | Tipo | Descripcion |
|---|---|---|
| `onAbrirMenu` | `() => void` | Abre el sidebar en pantallas pequenas |
| `saldoTotal` | `number \| null` | Saldo consolidado del chip; `null` lo oculta |

```jsx
<Navbar onAbrirMenu={() => setMenuAbierto(true)} saldoTotal={saldo?.saldoTotal ?? null} />
```

Usa `useAuth()` para el nombre, las iniciales, el rol y `logout()`.

---

## 2. Sidebar

Navegacion lateral. Fija en escritorio (> 1024 px) y panel deslizante con velo en
tablet y movil. Los enlaces de administracion solo se dibujan para el rol
`administrador`.

| Prop | Tipo | Descripcion |
|---|---|---|
| `abierto` | `boolean` | Controla el deslizamiento en pantallas <= 1024 px |
| `onCerrar` | `() => void` | Cierra el panel al elegir un enlace |

```jsx
<Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
```

---

## 3. Footer

Pie de pagina. Consulta `GET /api/health` y muestra badges con la version de la API y
el estado de la base (`conectada` / `sin_respuesta` / `no_disponible`).

Sin props.

```jsx
<Footer />
```

---

## 4. Card

Contenedor con cabecera y pie opcionales.

| Prop | Tipo | Descripcion |
|---|---|---|
| `titulo` | `string` | Titulo de la tarjeta |
| `subtitulo` | `string` | Texto secundario bajo el titulo |
| `acciones` | `ReactNode` | Contenido alineado a la derecha de la cabecera |
| `pie` | `ReactNode` | Contenido separado por una linea al final |
| `variante` | `'normal' \| 'plana' \| 'acento'` | Borde/sombra; `acento` resalta en verde |
| `className` | `string` | Clases extra |

```jsx
<Card titulo="Mi saldo" subtitulo="GET /api/saldo" acciones={<Badge tipo="info">2 cuentas</Badge>}
      pie={<Link to="/saldo/movimientos">Ver movimientos</Link>}>
  <p>Contenido</p>
</Card>
```

---

## 5. Table

Tabla con desplazamiento horizontal (la tabla conserva `min-width: 640px`, de modo
que en movil se desplaza en lugar de comprimirse).

| Prop | Tipo | Descripcion |
|---|---|---|
| `columnas` | `Array<{clave, titulo, render?, alineacion?, ancho?}>` | Definicion de columnas |
| `filas` | `Array<object>` | Datos |
| `cargando` | `boolean` | Muestra `<Loader>` en lugar de la tabla |
| `vacio` | `{titulo, mensaje, icono?}` | Se pasa a `<EmptyState>` |
| `claveFila` | `(fila, indice) => string \| number` | Clave estable de React |
| `compacta` | `boolean` | Reduce el espaciado de celdas |

```jsx
<Table
  filas={movimientos}
  cargando={cargando}
  claveFila={(f) => f.id_movimiento}
  vacio={{ titulo: 'Sin movimientos', icono: '🔁' }}
  columnas={[
    { clave: 'fecha_hora', titulo: 'Fecha', render: (f) => fechaHora(f.fecha_hora) },
    { clave: 'monto', titulo: 'Monto', alineacion: 'der', render: (f) => moneda(f.monto) },
  ]}
/>
```

---

## 6. FormField

Campo de formulario con etiqueta, ayuda y error accesible (`aria-invalid`,
`aria-describedby`).

| Prop | Tipo | Descripcion |
|---|---|---|
| `etiqueta` | `string` | Texto de la etiqueta |
| `nombre` | `string` | `id` y `name` del control |
| `tipo` | `'text' \| 'email' \| 'password' \| 'number' \| 'date' \| 'select' \| 'textarea' \| 'checkbox'` | Tipo de control |
| `valor` | `any` | Valor controlado |
| `onChange` | `(evento) => void` | Manejador |
| `error` | `string` | Mensaje de error; pinta el borde en rojo |
| `ayuda` | `string` | Texto de apoyo |
| `requerido` | `boolean` | Marca con asterisco y `required` |
| `opciones` | `Array<{valor, etiqueta}>` | Opciones cuando `tipo="select"` |
| `deshabilitado`, `placeholder`, `autoComplete`, `min`, `max`, `step`, `maxLength`, `filas` | varios | Atributos del control |

```jsx
<FormField etiqueta="Correo" nombre="correo" tipo="email" valor={correo}
           onChange={(e) => setCorreo(e.target.value)} error={errores.correo} requerido />
```

---

## 7. Alert

Mensaje de retroalimentacion con icono segun el tipo.

| Prop | Tipo | Descripcion |
|---|---|---|
| `tipo` | `'error' \| 'exito' \| 'advertencia' \| 'info'` | Color e icono |
| `titulo` | `string` | Encabezado en negrita |
| `onCerrar` | `() => void` | Si se informa, agrega boton × |
| `children` | `ReactNode` | Cuerpo del mensaje |

```jsx
<Alert tipo="error" titulo="No fue posible iniciar sesion" onCerrar={limpiar}>
  {mensaje}
</Alert>
```

---

## 8. Modal

Ventana modal controlada por el padre, con cierre por Escape, clic en el velo y boton
×; bloquea el desplazamiento del documento y enfoca el primer elemento interactivo.

| Prop | Tipo | Descripcion |
|---|---|---|
| `abierto` | `boolean` | Visibilidad |
| `titulo` | `string` | Titulo del dialogo (`aria-label`) |
| `onCerrar` | `() => void` | Cierre |
| `pie` | `ReactNode` | Botones de accion |
| `tamano` | `'sm' \| 'md' \| 'lg'` | Ancho maximo |

```jsx
<Modal abierto={modalRecarga} titulo="Recarga de saldo ficticio" onCerrar={() => setModalRecarga(false)}
       pie={<button className="btn btn--secundario" onClick={() => setModalRecarga(false)}>Cerrar</button>}>
  <p>Contenido</p>
</Modal>
```

---

## 9. Loader

Indicador de carga accesible (`role="status"`, `aria-live="polite"`).

| Prop | Tipo | Descripcion |
|---|---|---|
| `texto` | `string` | Texto junto al aro |
| `tamano` | `'sm' \| 'md' \| 'lg'` | Tamano del aro |
| `bloque` | `boolean` | Centra el indicador en un bloque con padding |

```jsx
<Loader bloque texto="Consultando cartelera..." />
```

---

## 10. Badge

Etiqueta de estado.

| Prop | Tipo | Descripcion |
|---|---|---|
| `tipo` | `'neutro' \| 'exito' \| 'error' \| 'advertencia' \| 'info' \| 'primario'` | Color |
| `children` | `ReactNode` | Texto |

```jsx
<Badge tipo="advertencia">Pendiente</Badge>
```

Las pantallas suelen combinar `textoEstado()` y `tipoBadgeEstado()` de
`utils/formato.js` para traducir los estados de la base.

---

## 11. EmptyState

Estado vacio para listas y tablas.

| Prop | Tipo | Descripcion |
|---|---|---|
| `titulo` | `string` | Titulo |
| `mensaje` | `string` | Explicacion |
| `icono` | `string` | Emoji o texto corto |
| `accion` | `ReactNode` | Boton o enlace de salida |

```jsx
<EmptyState icono="⚽" titulo="Sin eventos activos" mensaje="No hay eventos programados." />
```

---

## 12. Pagination

Paginacion numerica con rango visible y salto de paginas intermedias mediante puntos
suspensivos.

| Prop | Tipo | Descripcion |
|---|---|---|
| `pagina` | `number` | Pagina actual |
| `totalPaginas` | `number` | Total de paginas |
| `onCambiar` | `(pagina) => void` | Cambio de pagina |
| `total` | `number` | Total de elementos |
| `desde`, `hasta` | `number` | Rango visible (si no se envian, se calcula) |

```jsx
const p = usePaginacion(apuestas, 10);
<Pagination pagina={p.pagina} totalPaginas={p.totalPaginas} total={p.total}
            desde={p.desde} hasta={p.hasta} onCambiar={p.cambiarPagina} />
```

---

## 13. ProtectedRoute

Exige sesion activa. Acepta `children` o, sin ellos, renderiza `<Outlet />` para
usarse como ruta de layout.

```jsx
<Route element={<ProtectedRoute />}>
  <Route element={<MainLayout />}> ... </Route>
</Route>
```

Sin sesion redirige a `/login` con `state.desde` para volver al destino original.

---

## 14. RoleRoute

Exige un rol (por defecto `administrador`). Debe anidarse dentro de `ProtectedRoute`.
Si hay sesion pero el rol no coincide, muestra una tarjeta de acceso restringido con
el rol actual, en lugar de redirigir.

| Prop | Tipo | Descripcion |
|---|---|---|
| `rol` | `string` | Rol requerido (`'administrador'` por defecto) |
| `children` | `ReactNode` | Opcional; sin el renderiza `<Outlet />` |

```jsx
<Route element={<RoleRoute rol="administrador" />}>
  <Route path="/admin" element={<DashboardAdministrador />} />
  <Route path="/admin/reportes" element={<ReportesAdministrativos />} />
  <Route path="/ranking" element={<RankingUsuarios />} />
</Route>
```

---

## 15. Metrica (adicional)

Indicador numerico destacado, usado en paneles y resumenes.

| Prop | Tipo | Descripcion |
|---|---|---|
| `etiqueta` | `string` | Texto en mayusculas pequenas |
| `valor` | `string \| number` | Valor formateado |
| `detalle` | `string` | Nota inferior |
| `tono` | `'normal' \| 'exito' \| 'error' \| 'advertencia'` | Color del valor |

```jsx
<Metrica etiqueta="Saldo total" valor={moneda(saldo)} detalle="2 cuentas" tono="exito" />
```

---

## 16. Barril `index.js`

Permite importar varios componentes en una linea:

```jsx
import { Card, Table, Alert, Badge } from '../components/index.js';
```

---

## 17. Icono (Fase 11.1)

Iconografia SVG propia (sin librerias). Claves definidas en `TRAZOS`:
`saldo`, `apuestas`, `eventos`, `usuarios`, `premio`, `campana`, `tendencia`, `reloj`,
`alerta`, `escudo`, `rayo`, `ranking`, `reporte`, `balon`, `usuario`, `flecha`, `mas`,
`rayas`, `carpeta`, `combo`.

| Prop | Tipo | Descripcion |
|---|---|---|
| `nombre` | `string` | Clave del trazo; si no existe no se dibuja nada |
| `tamano` | `number` | Lado en px (20 por defecto) |
| `titulo` | `string` | Texto accesible; sin el, el icono es decorativo |
| `className` | `string` | Clase adicional |

---

## 18. StatCard, ProgressBar, AccionRapida, ListaActividad, AlertaSistema (Fase 11.1)

| Componente | Props | Uso |
|---|---|---|
| `StatCard` | `etiqueta`, `valor`, `detalle`, `icono`, `tono`, `enlace`, `indicador`, `cargando` | KPI del panel |
| `ProgressBar` | `etiqueta`, `valor`, `total`, `textoValor`, `detalle`, `tono` | Proporciones del resumen |
| `AccionRapida` | `to`, `titulo`, `descripcion`, `icono`, `onClick` | Acceso rapido del panel |
| `ListaActividad` | `items[]`, `vacio`, `cargando` | Movimientos, notificaciones, auditoria y eventos |
| `AlertaSistema` | `titulo`, `detalle`, `tono`, `icono` | Aviso compacto del sistema |

---

## 19. EventoDestacado, CuotaDestacada y GraficaBarras (Fase 11.3)

Piezas del rediseno premium. No anaden dependencias: SVG/CSS propios y datos de
los servicios existentes.

### `EventoDestacado`

| Prop | Tipo | Descripcion |
|---|---|---|
| `evento` | `object` | Fila snake_case de `GET /api/eventos/activos` |
| `cuotas` | `Array<{clave, mercado, etiqueta, valor, deshabilitada}>` | Salen de `GET /api/eventos/:id/opciones` |
| `cargandoCuotas` | `boolean` | Estado de la consulta de cuotas |
| `errorCuotas` | `string` | Mensaje alternativo si falla la consulta |
| `maxCuotas` | `number` | Cuotas visibles (3 por defecto) |

### `CuotaDestacada`

| Prop | Tipo | Descripcion |
|---|---|---|
| `mercado` | `string` | Nombre del mercado |
| `etiqueta` | `string` | Etiqueta de la opcion |
| `valor` | `number \| string` | Cuota vigente (`null` -> "sin cuota") |
| `detalle` | `string` | Nota inferior |
| `tono` | `'primario' \| 'acento'` | Color del valor |
| `to` | `string` | Con valor la pieza es un `Link` |
| `deshabilitada` | `boolean` | Borde discontinuo y opacidad reducida |

### `GraficaBarras`

| Prop | Tipo | Descripcion |
|---|---|---|
| `etiquetas` | `string[]` | Eje horizontal |
| `series` | `Array<{nombre, valores:number[], tono?}>` | Barras por columna; `tono` = `primario` \| `acento` \| `advertencia` \| `error` |
| `formatoValor` | `(n) => string` | Formato del tooltip (por defecto `numero()`) |
| `altura` | `number` | Alto del area de barras |
| `descripcion` | `string` | Texto accesible y pie |
| `cargando` | `boolean` | Estado de carga |

```jsx
<GraficaBarras
  etiquetas={['Lun', 'Mar']}
  series={[{ nombre: 'Apostado', valores: [120000, 95000] }]}
  formatoValor={moneda}
  descripcion="Monto apostado por dia"
/>
```

---

## Layouts (no son componentes de contenido)

| Layout | Props | Uso |
|---|---|---|
| `MainLayout` | — | Navbar + Sidebar + `<Outlet />` + Footer. Consulta `GET /api/saldo` para el chip del navbar y administra el estado del sidebar movil. |
| `AuthLayout` | — | Panel informativo + `<Outlet />` para `/login`, `/registro` y `/recuperar`. |
