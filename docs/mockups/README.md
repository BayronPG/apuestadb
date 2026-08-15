# Mockups — ApuestaDB (PROPUESTA, no aprobado)

**Fecha:** 12/ago/2026
**Estado:** propuesta del agente para validación de Jhon. **No** son requisitos confirmados del profesor ni frontend definitivo.

## Archivos

| Archivo | Pantalla | Contenido de ejemplo |
|---------|----------|----------------------|
| `inicio.html` | Inicio de sesión | Correo, contraseña, recordarme, enlace a recuperación, mensaje de error de ejemplo |
| `registrar.html` | Registro de usuario | Nombre, correo, contraseña (mínimo 8 caracteres), confirmación, aceptación académica, mensaje de error de ejemplo |
| `recuperar.html` | Recuperación de contraseña | Solicitud de correo, mensaje de éxito simulado, enlace de regreso |
| `home.html` | Home / panel principal | Saldo ficticio, eventos de fútbol (local/empate/visitante con cuotas), boleto de apuesta de ejemplo, últimos movimientos |
| `capturas/` | Capturas PNG de las pantallas | Generadas con navegador headless (12/ago/2026) para revisión rápida |

## Cómo abrirlos

Doble clic sobre cada archivo HTML (se abren en el navegador). No requieren servidor ni internet (CSS embebido, sin dependencias externas).

## Relación con el alcance provisional

- Deporte inicial: fútbol ✅ (usado en los ejemplos)
- Estilo visual: página web tipo casa de apuestas (tema oscuro, cuotas en tarjetas, boleto lateral) — propuesta visual, pendiente de validación
- El boleto de apuesta del home es un **ejemplo estático** (sin funcionalidad); la confirmación de apuesta real pertenece a una fase posterior
- Mercado: resultado del partido ✅ (local / empate / visitante)
- Apuestas simples ✅
- Saldo ficticio ✅
- Inicio de sesión de usuarios ✅ (alcance provisional incluye registro e inicio de sesión)
- **Registro de usuarios:** ✅ mockup creado (`registrar.html`, 12/ago/2026)
- Envío de correo real para recuperación: **pendiente de decisión** (en el mockup es simulado)

## Preguntas para Jhon

1. ¿Estas pantallas van bien como base de lo que imaginamos?
2. ¿Ajustamos colores, textos o distribución?
3. ¿El mockup de registro cubre los campos que imaginabas (nombre, correo, contraseña, confirmación)? ¿Agregamos tipo de documento o nombre de usuario?
4. ¿Considerar estas pantallas como insumo de la Fase 1/2 (planteamiento/requisitos), o quedan solo como exploración?

## Nota

Estos archivos son artefactos de diseño (HTML estático). No crean tablas, SQL, backend ni frontend definitivo; la Fase 0 continúa vigente.
