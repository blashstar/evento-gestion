/**
 * Funcionalidad del formulario de registro
 * Evento Deferol
 */

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('datos');
  const registroAside = document.getElementById('registro');
  const submitBtn = document.querySelector('.botones .boton');

  // Validación de campos según el modelo Asistente
  const validators = {
    nombre: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      messages: {
        required: 'Nombre es requerido',
        minLength: 'Nombre debe tener al menos 2 caracteres',
        maxLength: 'Nombre no puede exceder 100 caracteres',
        pattern: 'Nombre solo puede contener letras y espacios'
      }
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
        pattern: 'Celular debe contener solo números'
      }
    },
    correo: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      messages: {
        required: 'Correo es requerido',
        pattern: 'Debe ser un correo válido'
      }
    },
    empresa: {
      required: true,
      minLength: 2,
      maxLength: 200,
      messages: {
        required: 'Empresa es requerida',
        minLength: 'Empresa debe tener al menos 2 caracteres',
        maxLength: 'Empresa no puede exceder 200 caracteres'
      }
    },
    especialidad: {
      required: true,
      minLength: 2,
      maxLength: 100,
      messages: {
        required: 'Especialidad es requerida',
        minLength: 'Especialidad debe tener al menos 2 caracteres',
        maxLength: 'Especialidad no puede exceder 100 caracteres'
      }
    }
  };

  // Validar campo individual
  function validateField(fieldName) {
    const input = form.querySelector('[name="' + fieldName + '"]');
    const campo = input.closest('.campo');
    const rules = validators[fieldName];
    const value = input.value.trim();

    // Limpiar error previo
    clearFieldError(fieldName);

    // Validar requerido
    if (rules.required && !value) {
      showFieldError(fieldName, rules.messages.required);
      return false;
    }

    // Validar longitud mínima
    if (rules.minLength && value.length < rules.minLength) {
      showFieldError(fieldName, rules.messages.minLength);
      return false;
    }

    // Validar longitud máxima
    if (rules.maxLength && value.length > rules.maxLength) {
      showFieldError(fieldName, rules.messages.maxLength);
      return false;
    }

    // Validar patrón
    if (rules.pattern && !rules.pattern.test(value)) {
      showFieldError(fieldName, rules.messages.pattern);
      return false;
    }

    // Campo válido
    campo.classList.remove('error');
    campo.classList.add('valid');
    return true;
  }

  // Mostrar error en el campo
  function showFieldError(fieldName, message) {
    const input = form.querySelector('[name="' + fieldName + '"]');
    const campo = input.closest('.campo');
    const messageSpan = campo.querySelector('.mensaje');
    
    campo.classList.add('error');
    campo.classList.remove('valid');
    messageSpan.textContent = message;
    input.setAttribute('aria-invalid', 'true');
  }

  // Limpiar error del campo
  function clearFieldError(fieldName) {
    const input = form.querySelector('[name="' + fieldName + '"]');
    const campo = input.closest('.campo');
    const messageSpan = campo.querySelector('.mensaje');
    
    campo.classList.remove('error');
    campo.classList.remove('valid');
    messageSpan.textContent = '';
    input.removeAttribute('aria-invalid');
  }

  // Validar todo el formulario
  function validateForm() {
    let isValid = true;
    Object.keys(validators).forEach(function(fieldName) {
      if (!validateField(fieldName)) {
        isValid = false;
      }
    });
    return isValid;
  }

  // Validación en tiempo real al salir del campo
  Object.keys(validators).forEach(function(fieldName) {
    const input = form.querySelector('[name="' + fieldName + '"]');
    if (!input) return;

    // Validar al salir del campo
    input.addEventListener('blur', function() {
      validateField(fieldName);
    });

    // Limpiar error al escribir
    input.addEventListener('input', function() {
      clearFieldError(fieldName);
    });
  });

  // Manejo del envío del formulario
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll al primer error
      const firstError = form.querySelector('.campo.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Mostrar loading en el botón
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    const formData = {
      nombre: form.querySelector('[name="nombre"]').value.trim(),
      celular: form.querySelector('[name="celular"]').value.trim(),
      correo: form.querySelector('[name="correo"]').value.trim().toLowerCase(),
      empresa: form.querySelector('[name="empresa"]').value.trim(),
      especialidad: form.querySelector('[name="especialidad"]').value.trim()
    };

    try {
      const response = await fetch('/api/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        // Manejar errores de validación del servidor
        if (result.errores && result.errores.length > 0) {
          result.errores.forEach(function(error) {
            if (validators[error.campo]) {
              showFieldError(error.campo, error.mensaje);
            }
          });
          // Scroll al primer error
          const firstError = form.querySelector('.campo.error');
          if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          alert('Error: ' + (result.error || 'Error al registrar'));
        }
        return;
      }

      // Éxito - mostrar QR
      showQRSuccess(result.data);

    } catch (error) {
      console.error('Error al enviar formulario:', error);
      alert('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });

  // Mostrar sección de éxito con QR
  function showQRSuccess(data) {
    // Ocultar formulario
    form.style.display = 'none';

    // Crear sección de éxito
    const qrSection = document.createElement('div');
    qrSection.id = 'qr-success';
    qrSection.innerHTML = `
      <h2>¡Registro Exitoso!</h2>
      <p>${data.nombre}</p>
      <p>${data.correo}</p>
      
      <div class="qr-container">
        <img id="qr-image" src="${data.qrCodigo}" alt="Código QR de acceso">
      </div>
      
      <div class="buttons">
        <button id="btn-download">
          📥 Descargar QR
        </button>
        <button id="btn-share">
          📤 Compartir
        </button>
      </div>
      
      <p class="qr-info">Se ha enviado una copia de este QR a tu correo electrónico.</p>
      <p class="qr-info">Presenta este código QR en la entrada del evento.</p>
    `;

    // Insertar antes del title
    const title = registroAside.querySelector('h2');
    registroAside.insertBefore(qrSection, title.nextSibling);
    
    // Eliminar el título y descripción
    if (title) {
      title.style.display = 'none';
    }
    const description = registroAside.querySelector('p');
    if (description && !description.classList.contains('qr-info')) {
      description.style.display = 'none';
    }

    // Evento para descargar QR
    document.getElementById('btn-download').addEventListener('click', function() {
      const qrImg = document.getElementById('qr-image');
      const link = document.createElement('a');
      link.href = qrImg.src;
      link.download = 'qr-evento-Deferol.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    // Evento para compartir QR
    document.getElementById('btn-share').addEventListener('click', async function() {
      const qrImg = document.getElementById('qr-image');

      if (navigator.share && navigator.canShare) {
        try {
          // Convertir data URL a Blob
          const parts = qrImg.src.split(',');
          const byteString = atob(parts[1]);
          const mimeString = parts[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          const file = new File([blob], 'qr-evento-Deferol.png', { type: 'image/png' });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'QR Evento Deferol',
              text: 'Mi código QR para el evento Deferol',
              files: [file]
            });
          } else {
            alert('Tu navegador no permite compartir archivos.');
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Error al compartir:', err);
            alert('No se pudo compartir el QR.');
          }
        }
      } else {
        alert('Tu navegador no soporta la función de compartir. Puedes descargar el QR y compartirlo manualmente.');
      }
    });
  }
});
