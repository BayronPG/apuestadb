/**
 * Campo de formulario con etiqueta, ayuda y mensaje de error accesible.
 *
 * Props:
 *   - etiqueta    : string
 *   - nombre      : string   (name + id)
 *   - tipo        : 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local'
 *                   | 'select' | 'textarea' | 'checkbox'
 *   - valor       : string|number|boolean
 *   - onChange    : (evento) => void
 *   - error       : string
 *   - ayuda       : string
 *   - requerido   : boolean
 *   - opciones    : Array<{ valor, etiqueta }>  (para tipo 'select')
 *   - deshabilitado, placeholder, autoComplete, min, max, step, maxLength, filas
 *
 * Ejemplo:
 *   <FormField etiqueta="Correo" nombre="correo" tipo="email" valor={correo}
 *              onChange={manejar} error={errores.correo} requerido />
 */
export default function FormField({
  etiqueta,
  nombre,
  tipo = 'text',
  valor = '',
  onChange,
  error,
  ayuda,
  requerido = false,
  opciones = [],
  deshabilitado = false,
  placeholder,
  autoComplete,
  min,
  max,
  step,
  maxLength,
  filas = 4,
  className = '',
}) {
  const idAyuda = ayuda ? `${nombre}-ayuda` : undefined;
  const idError = error ? `${nombre}-error` : undefined;
  const descrito = [idAyuda, idError].filter(Boolean).join(' ') || undefined;

  const clases = ['campo'];
  if (error) clases.push('campo--error');
  if (className) clases.push(className);

  const comunes = {
    id: nombre,
    name: nombre,
    value: valor,
    onChange,
    disabled: deshabilitado,
    required: requerido,
    'aria-invalid': Boolean(error),
    'aria-describedby': descrito,
    className: 'campo__control',
  };

  return (
    <div className={clases.join(' ')}>
      <label className="campo__etiqueta" htmlFor={nombre}>
        {etiqueta}
        {requerido && (
          <span className="campo__requerido" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {tipo === 'select' && (
        <select {...comunes}>
          {placeholder && <option value="">{placeholder}</option>}
          {opciones.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      )}

      {tipo === 'textarea' && <textarea {...comunes} rows={filas} placeholder={placeholder} />}

      {tipo === 'checkbox' && (
        <label className="fila" style={{ gap: 8 }}>
          <input
            id={nombre}
            name={nombre}
            type="checkbox"
            checked={Boolean(valor)}
            onChange={onChange}
            disabled={deshabilitado}
            aria-invalid={Boolean(error)}
            aria-describedby={descrito}
            style={{ width: 18, height: 18 }}
          />
          <span className="texto-suave texto-pequeno">{placeholder}</span>
        </label>
      )}

      {!['select', 'textarea', 'checkbox'].includes(tipo) && (
        <input
          {...comunes}
          type={tipo}
          placeholder={placeholder}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          maxLength={maxLength}
        />
      )}

      {ayuda && (
        <span className="campo__ayuda" id={idAyuda}>
          {ayuda}
        </span>
      )}

      {error && (
        <span className="campo__error" id={idError} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
