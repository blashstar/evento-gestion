/**
 * Servicio de validación de QR para el kiosco de ingreso
 * Principios aplicados: SOLID, SLAP, DRY
 * Todo el código y comentarios en español
 */
class QrValidationService {
  constructor() {
    // Elementos del DOM
    this.estadoEscaneo = document.getElementById('estado-escaneo');
    this.resultado = document.getElementById('resultado');
    this.resultadoContenido = document.getElementById('resultado-contenido');
    this.btnNuevoEscaneo = document.getElementById('btn-nuevo-escaneo');

    // Estado interno de la aplicación
    this.html5QrCode = null;
    this.ultimoUuidProcesado = null;
    this.debounceTimer = null;

    // Bandera para controlar detección de QR
    this.inactivo = false;

    // Timers para control de auto-ocultado y reactivación
    this.timerOcultarResultado = null;
    this.timerReactivarEscaneo = null;

    // Constantes de configuración
    this.CONFIG = {
      UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      DEBOUNCE_MS: 100,
      DUPLICADO_FEEDBACK_MS: 2000, // Feedback de UUID duplicado
      TIMER_OCULTAR_MS: 300000,    // 5 minutos para ocultar resultado
      TIMER_REACTIVAR_MS: 15000,   // 15 segundos para reactivar escaneo
      MENSAJE_YA_INGRESO: 'Este asistente YA INGRESO al evento',
      QR_CONFIG: {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }
    };

    this.inicializar();
  }

  /**
   * Inicializa el servicio y comienza el escaneo
   */
  inicializar() {
    this.inicializarEscaneo();
    this.configurarEventos();
  }

  /**
   * Inicializa el escáner QR (SRP: única responsabilidad)
   */
  inicializarEscaneo() {
    this.html5QrCode = new Html5Qrcode('lector-qr');

    this.html5QrCode.start(
      { facingMode: 'environment' },
      this.CONFIG.QR_CONFIG,
      this.onScanSuccess.bind(this),
      this.onScanFailure.bind(this)
    ).then(() => {
      this.actualizarEstado('escaneando', '📷', 'Escaneando...');
    }).catch((err) => {
      console.error('Error al iniciar cámara:', err);
      this.actualizarEstado('invalido', '❌', 'Error al acceder a la cámara');
    });
  }

  /**
   * Configura los eventos del DOM (SRP: única responsabilidad)
   */
  configurarEventos() {
    this.btnNuevoEscaneo.addEventListener('click', () => this.handleNuevoEscaneoClick());
  }

  /**
   * Maneja el click en el botón de nuevo escaneo (SRP: única responsabilidad)
   */
  handleNuevoEscaneoClick() {
    this.detenerTimers();
    this.desactivarInactivo();
    this.ocultarResultado();
    this.actualizarEstado('escaneando', '📷', 'Escaneando...');
  }

  /**
   * Detiene todos los timers activos (SRP: única responsabilidad)
   */
  detenerTimers() {
    this.detenerTimerOcultarResultado();
    this.detenerTimerReactivarEscaneo();
  }

  /**
   * Detiene el timer de ocultado de resultado
   */
  detenerTimerOcultarResultado() {
    if (this.timerOcultarResultado !== null) {
      clearTimeout(this.timerOcultarResultado);
      this.timerOcultarResultado = null;
    }
  }

  /**
   * Detiene el timer de reactivación del escaneo
   */
  detenerTimerReactivarEscaneo() {
    if (this.timerReactivarEscaneo !== null) {
      clearTimeout(this.timerReactivarEscaneo);
      this.timerReactivarEscaneo = null;
    }
  }

  /**
   * Activa la bandera inactivo para dejar de detectar QRs
   */
  activarInactivo() {
    this.inactivo = true;
  }

  /**
   * Desactiva la bandera inactivo para volver a detectar QRs
   */
  desactivarInactivo() {
    this.inactivo = false;
  }

  /**
   * Callback cuando se detecta un QR válido
   * Aplica SLAP: flujo de alto nivel.delega a métodos específicos
   */
  onScanSuccess(decodedText) {
    // Guard clause: si está inactivo, ignorar escaneo
    if (this.inactivo) return;

    // Validar formato UUID
    if (!this.esUuidValido(decodedText)) {
      this.mostrarErrorTemporal('QR no válido', '❌');
      return;
    }

    // Evitar procesar el mismo UUID dos veces seguidas
    if (this.esUuidDuplicadoReciente(decodedText)) {
      this.mostrarFeedbackDuplicado();
      return;
    }

    // Iniciar proceso de validación con debounce
    this.iniciarValidacionConDebounce(decodedText);
  }

  /**
   * Callback cuando falla el escaneo (normal, no es error)
   */
  onScanFailure() {
    // No hacer nada, es normal cuando no hay QR en el frame
  }

  /**
   * Inicia el proceso de validación con debounce de 500ms
   */
  iniciarValidacionConDebounce(uuid) {
    // Limpiar debounce previo
    this.limpiarDebounceTimer();

    // Establecer nuevo debounce
    this.debounceTimer = setTimeout(() => {
      this.procesarValidacion(uuid);
    }, this.CONFIG.DEBOUNCE_MS);
  }

  /**
   * Procesa la validación de un UUID
   * Activa bandera inactivo mientras espera respuesta
   */
  async procesarValidacion(uuid) {
    // Activar bandera inactivo para dejar de detectar QR mientras se procesa
    this.activarInactivo();
    this.actualizarEstado('escaneando', '⏳', 'Validando...');

    try {
      const result = await this.validarIngresoConApi(uuid);
      this.procesarRespuestaValidacion(result);
    } catch (error) {
      this.mostrarErrorConexion();
      this.desactivarInactivo();
    }
  }

  /**
   * Valida el ingreso mediante llamada a API (SRP: única responsabilidad)
   */
  async validarIngresoConApi(token) {
    const response = await fetch('/api/ingreso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    // Procesar respuestas de error (401, 409, etc.) como JSON válido
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    }

    return response.json();
  }

  /**
   * Procesa la respuesta de validación de la API
   * Según el tipo de respuesta,delegar al método específico
   */
  procesarRespuestaValidacion(result) {
    if (result.success) {
      this.procesarIngresoExitoso(result.data);
    } else if (result.status === 409 || result.status === 401) {
      this.procesarIngresoDuplicado(result.data);
    } else {
      this.procesarErrorValidacion(result.error);
    }

    // Configurar timers después de procesar respuesta
    this.configurarTimerOcultarResultado();
    this.configurarTimerReactivarEscaneo();
  }

  /**
   * Procesa un ingreso exitoso (primera vez)
   */
  procesarIngresoExitoso(data) {
    // Actualizar UUID procesado
    this.almacenarUuidProcesado(data.uuid);

    // Mostrar resultado válido
    this.mostrarResultado('valido', data);
  }

  /**
   * Procesa un ingreso duplicado (ya ingresado)
   */
  procesarIngresoDuplicado(data) {
    // No reproducir audio, solo mostrar mensaje
    this.almacenarUuidProcesado(data.uuid);

    // Mostrar resultado duplicado
    this.mostrarResultado('duplicado', data);
  }

  /**
   * Procesa un error de validación
   */
  procesarErrorValidacion(error) {
    this.mostrarResultado('invalido', null, error);
  }

  /**
   * Muestra error de conexión
   */
  mostrarErrorConexion() {
    this.mostrarResultado('invalido', null, 'Error de conexión');
  }

  /**
   * Configura el timer para ocultar resultado después de 90 segundos
   */
  configurarTimerOcultarResultado() {
    this.detenerTimerOcultarResultado();

    this.timerOcultarResultado = setTimeout(() => {
      this.handleNuevoEscaneoClick();
    }, this.CONFIG.TIMER_OCULTAR_MS);
  }

  /**
   * Configura el timer para reactivar escaneo después de 15 segundos
   */
  configurarTimerReactivarEscaneo() {
    this.detenerTimerReactivarEscaneo();

    this.timerReactivarEscaneo = setTimeout(() => {
      this.desactivarInactivo();
    }, this.CONFIG.TIMER_REACTIVAR_MS);
  }

  /**
   * Muestra el resultado del escaneo
   */
  mostrarResultado(tipo, data, error) {
    this.prepararContenedorResultado();
    this.aplicarClaseResultado(tipo);

    if (tipo === 'valido' && data) {
      this.mostrarResultadoValido(data);
    } else if (tipo === 'duplicado' && data) {
      this.mostrarResultadoDuplicado(data);
    } else {
      this.mostrarResultadoInvalido(error);
    }

    this.mostrarResultadoVisible();
  }

  /**
   * Prepara el contenedor de resultado
   */
  prepararContenedorResultado() {
    this.resultado.classList.remove(
      'oculto',
      'resultado-valido',
      'resultado-invalido',
      'resultado-duplicado'
    );
  }

  /**
   * Aplica la clase CSS correspondiente al tipo de resultado
   */
  aplicarClaseResultado(tipo) {
    this.resultado.classList.add(`resultado-${tipo}`);
  }

  /**
   * Muestra resultado de ingreso válido
   */
  mostrarResultadoValido(data) {
    this.resultadoContenido.innerHTML = `
      <h2>✅ Ingreso Permitido</h2>
      <div class="datos-asistente">
        <strong>${data.nombre}</strong>
      </div>
      <div class="empresa">${data.empresa}</div>
      <div class="hora-ingreso">Ingreso: ${new Date(data.fechaIngreso).toLocaleString('es-PE')}</div>
    `;
  }

  /**
   * Muestra resultado de ingreso duplicado (usuario ya ha ingresado)
   */
  mostrarResultadoDuplicado(data) {
    // Formatear la fecha y hora del último ingreso
    const fechaUltimoIngreso = data.fechaIngreso
      ? new Date(data.fechaIngreso).toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      : 'Sin registro';

    this.resultadoContenido.innerHTML = `
      <h2>ℹ️ El Usuario ya ha ingresado</h2>
      <div class="datos-asistente">
        <strong>${data.nombre}</strong>
      </div>
      <div class="hora-ingreso">
        <strong>Último ingreso:</strong> ${fechaUltimoIngreso}
      </div>
    `;
  }

  /**
   * Muestra resultado de error
   */
  mostrarResultadoInvalido(error) {
    this.resultadoContenido.innerHTML = `
      <h2>❌ QR No Válido</h2>
      <p>${error || 'Código QR no reconocido'}</p>
    `;
  }

  /**
   * Muestra el contenedor de resultado
   */
  mostrarResultadoVisible() {
    this.resultado.classList.remove('oculto');
  }

  /**
   * Oculta el contenedor de resultado
   */
  ocultarResultado() {
    this.resultado.classList.add('oculto');
    this.resultado.classList.remove(
      'resultado-valido',
      'resultado-invalido',
      'resultado-duplicado'
    );
  }

  /**
   * Verifica si un UUID es válido según el formato
   */
  esUuidValido(texto) {
    return this.CONFIG.UUID_REGEX.test(texto);
  }

  /**
   * Verifica si el UUID es el mismo que el último procesado recientemente
   */
  esUuidDuplicadoReciente(uuid) {
    return uuid === this.ultimoUuidProcesado;
  }

  /**
   * Almacena el UUID como el último procesado
   */
  almacenarUuidProcesado(uuid) {
    this.ultimoUuidProcesado = uuid;
  }

  /**
   * Muestra feedback temporal para UUID duplicado
   */
  mostrarFeedbackDuplicado() {
    this.actualizarEstado('duplicado', '🔄', 'El usuario ya ingresó');
    setTimeout(() => {
      this.actualizarEstado('escaneando', '📷', 'Escaneando...');
    }, this.CONFIG.DUPLICADO_FEEDBACK_MS);
  }

  /**
   * Muestra error temporal en el estado de escaneo
   */
  mostrarErrorTemporal(mensaje, icono) {
    this.actualizarEstado('invalido', icono, mensaje);
    setTimeout(() => {
      this.actualizarEstado('escaneando', '📷', 'Escaneando...');
    }, 2000);
  }

  /**
   * Limpia el timer de debounce si existe
   */
  limpiarDebounceTimer() {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Actualiza el estado visual del escáner
   */
  actualizarEstado(tipo, icono, mensaje) {
    this.estadoEscaneo.className = `estado-${tipo}`;
    this.estadoEscaneo.innerHTML = `
      <span class="icono-estado">${icono}</span>
      <p>${mensaje}</p>
    `;
  }

  /**
   * Oculta el resultado si está actualmente visible (método auxiliar)
   */
  ocultarResultadoSiEsVisible() {
    if (!this.resultado.classList.contains('oculto')) {
      this.ocultarResultado();
      this.detenerTimerOcultarResultado();
    }
  }
}

// Inicializar el servicio cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new QrValidationService();
});
