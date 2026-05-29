/**
 * Registro de Asistentes - Evento Deferol
 *
 * Arquitectura modular aplicando principios SOLID y SLAP:
 * - SRP: Cada clase tiene una única razón de cambiar.
 * - OCP: Validadores y renderers son extensibles sin modificar código existente.
 * - DIP: El controlador depende de abstracciones (interfaces implícitas), no de implementaciones concretas.
 * - SLAP: Cada función opera en un único nivel de abstracción.
 */

(() => {
  'use strict';

  // ============================================================
  // CONFIGURACIÓN — Datos puros, sin lógica de negocio
  // ============================================================

  /**
   * @typedef {Object} FieldValidationConfig
   * @property {boolean} [required]
   * @property {number} [minLength]
   * @property {number} [maxLength]
   * @property {RegExp} [pattern]
   * @property {Object<string, string>} messages
   */

  /**
   * Reglas de validación por campo.
   * @type {Object<string, FieldValidationConfig>}
   */
  const VALIDATION_RULES = {
    nombre: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      messages: {
        required: 'Nombre es requerido',
        minLength: 'Nombre debe tener al menos 2 caracteres',
        maxLength: 'Nombre no puede exceder 100 caracteres',
        pattern: 'Nombre solo puede contener letras y espacios',
      },
    },
    celular: {
      required: true,
      minLength: 7,
      maxLength: 20,
      pattern: /^[0-9\s\-+]+$/,
      messages: {
        required: 'Celular es requerido',
        minLength: 'Celular debe tener al menos 7 caracteres',
        maxLength: 'Celular no puede exceder 20 caracteres',
        pattern: 'Celular debe contener solo números',
      },
    },
    correo: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      messages: {
        required: 'Correo es requerido',
        pattern: 'Debe ser un correo válido',
      },
    },
    empresa: {
      required: true,
      minLength: 2,
      maxLength: 200,
      messages: {
        required: 'Empresa es requerida',
        minLength: 'Empresa debe tener al menos 2 caracteres',
        maxLength: 'Empresa no puede exceder 200 caracteres',
      },
    },
    especialidad: {
      required: true,
      minLength: 2,
      maxLength: 100,
      messages: {
        required: 'Especialidad es requerida',
        minLength: 'Especialidad debe tener al menos 2 caracteres',
        maxLength: 'Especialidad no puede exceder 100 caracteres',
      },
    },
    acepta_terminos: {
      required: true,
      isCheckbox: true,
      messages: {
        required: 'Debes aceptar los Términos de Servicio y la Política de Privacidad',
      },
    },
  };

  const API_ENDPOINT = '/api/registro';

  // ============================================================
  // UTILIDADES — Funciones puras de bajo nivel
  // ============================================================

  /**
   * Recorre las claves de un objeto ejecutando un callback.
   * @template T
   * @param {Object<string, T>} obj
   * @param {(key: string, value: T) => void} fn
   */
  const eachKey = (obj, fn) => {
    Object.keys(obj).forEach((key) => fn(key, obj[key]));
  };

  /**
   * Convierte una data URL en un objeto File.
   * @param {string} dataUrl
   * @param {string} fileName
   * @returns {File}
   */
  const dataUrlToFile = (dataUrl, fileName) => {
    const parts = dataUrl.split(',');
    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(':')[1].split(';')[0];
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uintArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uintArray[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([arrayBuffer], { type: mimeString });
    return new File([blob], fileName, { type: mimeString });
  };

  /**
   * Escapa caracteres HTML para prevenir XSS.
   * @param {string} text
   * @returns {string}
   */
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // ============================================================
  // FIELD VALIDATOR — SRP: validar un campo contra reglas
  // ============================================================

  /**
   * @typedef {Object} ValidationResult
   * @property {boolean} valid
   * @property {string} [error]
   */

  /**
   * Valida un valor contra una configuración de campo.
   * Función pura: no muta el DOM.
   * @param {string} value
   * @param {FieldValidationConfig} config
   * @returns {ValidationResult}
   */
  const validateFieldValue = (value, config) => {
    if (config.isCheckbox) {
      if (config.required && !value) {
        return { valid: false, error: config.messages.required };
      }
      return { valid: true };
    }

    const trimmed = value.trim();

    if (config.required && !trimmed) {
      return { valid: false, error: config.messages.required };
    }

    if (config.minLength && trimmed.length < config.minLength) {
      return { valid: false, error: config.messages.minLength };
    }

    if (config.maxLength && trimmed.length > config.maxLength) {
      return { valid: false, error: config.messages.maxLength };
    }

    if (config.pattern && !config.pattern.test(trimmed)) {
      return { valid: false, error: config.messages.pattern };
    }

    return { valid: true };
  };

  // ============================================================
  // ERROR RENDERER — SRP: pintar/limpiar errores en el DOM
  // ============================================================

  class ErrorRenderer {
    /**
     * @param {HTMLFormElement} formElement
     */
    constructor(formElement) {
      this._form = formElement;
    }

    /**
     * Muestra un mensaje de error en un campo.
     * @param {string} fieldName
     * @param {string} message
     */
    show(fieldName, message) {
      const input = this._getInput(fieldName);
      const campo = input.closest('.campo');
      const messageSpan = campo.querySelector('.mensaje');

      campo.classList.add('error');
      campo.classList.remove('valid');
      messageSpan.textContent = message;
      input.setAttribute('aria-invalid', 'true');
    }

    /**
     * Limpia el estado de error de un campo.
     * @param {string} fieldName
     */
    clear(fieldName) {
      const input = this._getInput(fieldName);
      const campo = input.closest('.campo');
      const messageSpan = campo.querySelector('.mensaje');

      campo.classList.remove('error');
      campo.classList.remove('valid');
      messageSpan.textContent = '';
      input.removeAttribute('aria-invalid');
    }

    /**
     * Marca un campo como válido.
     * @param {string} fieldName
     */
    markValid(fieldName) {
      const input = this._getInput(fieldName);
      const campo = input.closest('.campo');

      campo.classList.remove('error');
      campo.classList.add('valid');
      input.removeAttribute('aria-invalid');
    }

    /**
     * Hace scroll al primer campo con error.
     */
    scrollToFirstError() {
      const firstError = this._form.querySelector('.campo.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    /**
     * Renderiza múltiples errores provenientes del servidor.
     * @param {Array<{campo: string, mensaje: string}>} serverErrors
     */
    renderServerErrors(serverErrors) {
      serverErrors.forEach((error) => {
        if (VALIDATION_RULES[error.campo]) {
          this.show(error.campo, error.mensaje);
        }
      });
      this.scrollToFirstError();
    }

    _getInput(fieldName) {
      return this._form.querySelector('[name="' + fieldName + '"]');
    }
  }

  // ============================================================
  // FORM VALIDATOR — SRP: orquestar validación del formulario
  // ============================================================

  class FormValidator {
    /**
     * @param {HTMLFormElement} formElement
     * @param {Object<string, FieldValidationConfig>} rules
     * @param {ErrorRenderer} errorRenderer
     */
    constructor(formElement, rules, errorRenderer) {
      this._form = formElement;
      this._rules = rules;
      this._errorRenderer = errorRenderer;
    }

    /**
     * Registra eventos de validación en tiempo real.
     */
    bindEvents() {
      eachKey(this._rules, (fieldName) => {
        const input = this._getInput(fieldName);
        if (!input) return;
        const config = this._rules[fieldName];

        if (config.isCheckbox) {
          input.addEventListener('change', () => this.validateField(fieldName));
        } else {
          input.addEventListener('blur', () => this.validateField(fieldName));
          input.addEventListener('input', () => this._errorRenderer.clear(fieldName));
        }
      });
    }

    /**
     * Valida un campo individual.
     * @param {string} fieldName
     * @returns {boolean}
     */
    validateField(fieldName) {
      const config = this._rules[fieldName];
      const input = this._getInput(fieldName);
      const rawValue = config.isCheckbox ? input.checked : input.value;
      const result = validateFieldValue(rawValue, config);

      if (result.valid) {
        this._errorRenderer.markValid(fieldName);
      } else {
        this._errorRenderer.show(fieldName, result.error);
      }

      return result.valid;
    }

    /**
     * Valida todo el formulario.
     * @returns {boolean}
     */
    validateAll() {
      let isValid = true;

      eachKey(this._rules, (fieldName) => {
        if (!this.validateField(fieldName)) {
          isValid = false;
        }
      });

      return isValid;
    }

    _getInput(fieldName) {
      return this._form.querySelector('[name="' + fieldName + '"]');
    }
  }

  // ============================================================
  // FORM SERIALIZER — SRP: extraer y transformar datos del form
  // ============================================================

  class FormSerializer {
    /**
     * @param {HTMLFormElement} formElement
     */
    constructor(formElement) {
      this._form = formElement;
    }

    /**
     * Extrae los datos del formulario como objeto plano.
     * @returns {Object<string, string>}
     */
    serialize() {
      return {
        nombre: this._getValue('nombre'),
        celular: this._getValue('celular'),
        correo: this._getValue('correo').toLowerCase(),
        empresa: this._getValue('empresa'),
        especialidad: this._getValue('especialidad'),
      };
    }

    _getValue(fieldName) {
      const input = this._form.querySelector('[name="' + fieldName + '"]');
      return input ? input.value.trim() : '';
    }
  }

  // ============================================================
  // LOADING BUTTON — SRP: gestionar estado visual del botón
  // ============================================================

  class LoadingButton {
    /**
     * @param {HTMLButtonElement} buttonElement
     */
    constructor(buttonElement) {
      this._button = buttonElement;
    }

    setLoading(isLoading) {
      this._button.disabled = isLoading;
      this._button.classList.toggle('loading', isLoading);
    }
  }

  // ============================================================
  // API SERVICE — SRP: comunicación con el backend
  // ============================================================

  class ApiService {
    /**
     * @param {string} baseUrl
     */
    constructor(baseUrl) {
      this._baseUrl = baseUrl;
    }

    /**
     * Envía los datos de registro al servidor.
     * @param {Object} payload
     * @returns {Promise<{ok: boolean, data: any, error?: string, errores?: Array}>}
     */
    async register(payload) {
      const response = await fetch(this._baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      return {
        ok: response.ok,
        data: result.data,
        error: result.error,
        errores: result.errores,
      };
    }
  }

  // ============================================================
  // QR RENDERER — SRP: renderizar la vista de éxito con QR
  // ============================================================

  class QRSuccessRenderer {
    /**
     * @param {HTMLElement} containerElement
     */
    constructor(containerElement) {
      this._container = containerElement;
      this._form = containerElement.querySelector('#datos');
      this._title = containerElement.querySelector('h2');
      this._description = this._title ? this._title.nextElementSibling : null;
    }

    /**
     * Muestra la pantalla de éxito con el QR.
     * @param {Object} data — respuesta del servidor
     */
    render(data) {
      this._hideForm();
      const qrSection = this._buildQRSection(data);
      this._insertQRSection(qrSection);
      this._attachQRActions();
    }

    // ---------- Nivel medio: operaciones de DOM ----------

    _hideForm() {
      this._form.style.display = 'none';
      if (this._title) {
        this._title.style.display = 'none';
      }
      if (this._isDescriptionElement(this._description)) {
        this._description.style.display = 'none';
      }
    }

    _buildQRSection(data) {
      const section = document.createElement('div');
      section.id = 'qr-success';
      section.innerHTML = this._qrTemplate(data);
      return section;
    }

    _insertQRSection(section) {
      if (this._title) {
        this._container.insertBefore(section, this._title.nextSibling);
      } else {
        this._container.appendChild(section);
      }
    }

    _attachQRActions() {
      this._bindDownloadAction();
      this._bindShareAction();
    }

    // ---------- Nivel bajo: template y eventos ----------

    _qrTemplate(data) {
      return [
        '<h2>¡Registro Exitoso!</h2>',
        '<p>' + escapeHtml(data.nombre) + '</p>',
        '<p>' + escapeHtml(data.correo) + '</p>',
        '<div class="qr-container">',
        '  <img id="qr-image" src="' + data.qrCodigo + '" alt="Código QR de acceso">',
        '</div>',
        '<div class="buttons">',
        '  <button id="btn-download">Descargar QR</button>',
        '  <button id="btn-share">Compartir</button>',
        '</div>',
        '<p class="qr-info">Se ha enviado una copia de este QR a tu correo electrónico.</p>',
        '<p class="qr-info">Presenta este código QR en la entrada del evento.</p>',
      ].join('\n');
    }

    _bindDownloadAction() {
      const btn = document.getElementById('btn-download');
      if (!btn) return;

      btn.addEventListener('click', () => {
        const qrImg = document.getElementById('qr-image');
        const link = document.createElement('a');
        link.href = qrImg.src;
        link.download = 'qr-evento-Deferol.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    _bindShareAction() {
      const btn = document.getElementById('btn-share');
      if (!btn) return;

      btn.addEventListener('click', this._onShareClick.bind(this));
    }

    async _onShareClick() {
      const qrImg = document.getElementById('qr-image');

      if (!navigator.share || !navigator.canShare) {
        alert(
          'Tu navegador no soporta la función de compartir. ' +
            'Puedes descargar el QR y compartirlo manualmente.'
        );
        return;
      }

      try {
        const file = dataUrlToFile(qrImg.src, 'qr-evento-Deferol.png');
        const shareData = {
          title: 'QR Evento Deferol',
          text: 'Mi código QR para el evento Deferol',
          files: [file],
        };

        if (!navigator.canShare(shareData)) {
          alert('Tu navegador no permite compartir archivos.');
          return;
        }

        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error al compartir:', err);
          alert('No se pudo compartir el QR.');
        }
      }
    }

    _isDescriptionElement(element) {
      return element && element.tagName === 'P' && !element.classList.contains('qr-info');
    }
  }

  // ============================================================
  // REGISTRO CONTROLLER — Orquesta los módulos (DIP)
  // ============================================================

  class RegistroController {
    /**
     * @param {Object} config
     * @param {HTMLFormElement} config.form
     * @param {HTMLButtonElement} config.submitBtn
     * @param {HTMLElement} config.registroAside
     */
    constructor(config) {
      this._form = config.form;
      this._submitBtn = config.submitBtn;
      this._registroAside = config.registroAside;

      this._errorRenderer = new ErrorRenderer(this._form);
      this._formValidator = new FormValidator(this._form, VALIDATION_RULES, this._errorRenderer);
      this._serializer = new FormSerializer(this._form);
      this._loadingBtn = new LoadingButton(this._submitBtn);
      this._api = new ApiService(API_ENDPOINT);
      this._qrRenderer = new QRSuccessRenderer(this._registroAside);
    }

    init() {
      this._formValidator.bindEvents();
      this._form.addEventListener('submit', this._onSubmit.bind(this));
    }

    // ---------- Nivel alto: flujo de submit ----------

    async _onSubmit(event) {
      event.preventDefault();

      if (!this._formValidator.validateAll()) {
        this._errorRenderer.scrollToFirstError();
        return;
      }

      this._loadingBtn.setLoading(true);

      try {
        const payload = this._serializer.serialize();
        const result = await this._api.register(payload);
        this._handleResult(result);
      } catch (error) {
        this._handleNetworkError(error);
      } finally {
        this._loadingBtn.setLoading(false);
      }
    }

    _handleResult(result) {
      if (result.ok) {
        this._qrRenderer.render(result.data);
      } else if (result.errores && result.errores.length > 0) {
        this._errorRenderer.renderServerErrors(result.errores);
      } else {
        alert('Error: ' + (result.error || 'Error al registrar'));
      }
    }

    _handleNetworkError(error) {
      console.error('Error al enviar formulario:', error);
      alert('Error de conexión. Por favor, intenta nuevamente.');
    }
  }

  // ============================================================
  // INICIALIZACIÓN
  // ============================================================

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('datos');
    const registroAside = document.getElementById('registro');
    const submitBtn = document.querySelector('.botones .boton');

    if (!form || !registroAside || !submitBtn) {
      console.error('Registro: elementos esenciales no encontrados en el DOM');
      return;
    }

    const controller = new RegistroController({
      form,
      registroAside,
      submitBtn,
    });

    controller.init();
  });
})();
