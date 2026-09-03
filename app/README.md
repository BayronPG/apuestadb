# ApuestaDB — app

Código de la aplicación del proyecto **ApuestaDB** (sandbox académico de apuestas deportivas simuladas). Esta carpeta es la recomendada para abrir en tu editor.

## Estructura

```
app/
├── backend/     ← API Node.js + Express conectada a SQL Server (puerto 3000)
├── frontend/    ← React + Vite (puerto 5173)
└── README.md
```

## Iniciar (dos terminales)

**Terminal 1 — Backend:**
```powershell
cd C:\Proyectos\ApuestaDB\app\backend
npm start
```

**Terminal 2 — Frontend:**
```powershell
cd C:\Proyectos\ApuestaDB\app\frontend
npm run dev
```

Abre **http://localhost:5173** en el navegador.

> Requisitos previos (solo la primera vez en una máquina): Node.js, SQL Server con TCP y modo mixto, base `ApuestaDB` creada y `.env` configurado. La guía completa está en `C:\Proyectos\ApuestaDB\README.md`.

## En el editor (VS Code / Cursor)

- Abre esta carpeta (`C:\Proyectos\ApuestaDB\app`).
- Tareas disponibles en Terminal > Run Task: *Backend (npm start)*, *Frontend (npm run dev)*, *Pruebas backend*.
- Extensiones recomendadas: SQL Server (`ms-mssql.mssql`), PowerShell, Oxlint.
