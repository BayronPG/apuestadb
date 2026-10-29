import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Alert from '../components/Alert.jsx';
import FormField from '../components/FormField.jsx';
import Loader from '../components/Loader.jsx';
import { registrarUsuario } from '../services/authService.js';
import { mensajeDeError } from '../utils/errores.js';
import { validarRegistro, sinErrores } from '../utils/validaciones.js';

/**
 * Pantalla de registro de usuario  ->  POST /api/auth/registro
 * Ruta: /registro
 *
 * Cuerpo enviado: { nombres, apellidos, correo, contrasena, telefono? }
 * Respuesta usada: { idUsuario, mensaje } (201). El backend crea las cuentas de
 * saldo en cero (usp_Usuario_Registrar).
 */
export default function Registro() {
  const navegar = useNavigate();

  const [formulario, setFormulario] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    contrasena: '',
    confirmacion: '',
  });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (evento) => {
    const { name, value } = evento.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    const encontrados = validarRegistro(formulario);
    setErrores(encontrados);
    setErrorServidor(null);
    if (!sinErrores(encontrados)) return;

    setEnviando(true);
    try {
      await registrarUsuario({
        nombres: formulario.nombres.trim(),
        apellidos: formulario.apellidos.trim(),
        correo: formulario.correo.trim(),
        contrasena: formulario.contrasena,
        telefono: formulario.telefono.trim() || undefined,
      });
      navegar('/login', { replace: true, state: { registrado: true, correo: formulario.correo } });
    } catch (excepcion) {
      setErrorServidor(mensajeDeError(excepcion));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={manejarEnvio} noValidate>
      <h1 style={{ fontSize: 'var(--fs-xl)' }}>Crear cuenta</h1>
      <p className="texto-suave texto-pequeno">
        El registro crea tus cuentas de saldo ficticio en cero (tokens y PSE).
      </p>

      {errorServidor && (
        <Alert tipo="error" titulo="No fue posible registrar la cuenta" onCerrar={() => setErrorServidor(null)}>
          {errorServidor}
        </Alert>
      )}

      <FormField
        etiqueta="Nombres"
        nombre="nombres"
        valor={formulario.nombres}
        onChange={cambiar}
        error={errores.nombres}
        requerido
        maxLength={100}
        autoComplete="given-name"
        deshabilitado={enviando}
      />

      <FormField
        etiqueta="Apellidos"
        nombre="apellidos"
        valor={formulario.apellidos}
        onChange={cambiar}
        error={errores.apellidos}
        requerido
        maxLength={100}
        autoComplete="family-name"
        deshabilitado={enviando}
      />

      <FormField
        etiqueta="Correo"
        nombre="correo"
        tipo="email"
        valor={formulario.correo}
        onChange={cambiar}
        error={errores.correo}
        requerido
        autoComplete="email"
        deshabilitado={enviando}
      />

      <FormField
        etiqueta="Telefono (opcional)"
        nombre="telefono"
        valor={formulario.telefono}
        onChange={cambiar}
        error={errores.telefono}
        maxLength={20}
        ayuda="Maximo 20 caracteres. No es obligatorio."
        autoComplete="tel"
        deshabilitado={enviando}
      />

      <FormField
        etiqueta="Contrasena"
        nombre="contrasena"
        tipo="password"
        valor={formulario.contrasena}
        onChange={cambiar}
        error={errores.contrasena}
        requerido
        autoComplete="new-password"
        ayuda="Entre 8 y 72 caracteres (bcrypt en el backend)."
        deshabilitado={enviando}
      />

      <FormField
        etiqueta="Confirmar contrasena"
        nombre="confirmacion"
        tipo="password"
        valor={formulario.confirmacion}
        onChange={cambiar}
        error={errores.confirmacion}
        requerido
        autoComplete="new-password"
        deshabilitado={enviando}
      />

      <button type="submit" className="btn btn--primario btn--bloque" disabled={enviando}>
        {enviando ? <Loader tamano="sm" texto="Registrando..." /> : 'Registrarme'}
      </button>

      <p className="texto-pequeno texto-suave centrado" style={{ marginTop: 'var(--esp-4)' }}>
        Ya tengo cuenta: <Link to="/login">iniciar sesion</Link>
      </p>

      <p className="texto-pequeno texto-suave centrado">
        Proyecto academico: no se maneja dinero real ni datos bancarios.
      </p>
    </form>
  );
}
