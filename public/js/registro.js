document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('datos');
  const registroAside = document.getElementById('registro');
  const submitBtn = form.querySelector('button[type="submit"]');
  const nota = registroAside.querySelector('.nota');

  // Validation rules matching Asistente model constraints
  const validators = {
    nombres: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      messages: {
        required: 'Nombres es requerido',
        minLength: 'Nombres debe tener al menos 2 caracteres',
        maxLength: 'Nombres no puede exceder 100 caracteres',
        pattern: 'Nombres solo puede contener letras y espacios'
      }
    },
    apellidos: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      messages: {
        required: 'Apellidos es requerido',
        minLength: 'Apellidos debe tener al menos 2 caracteres',
        maxLength: 'Apellidos no puede exceder 100 caracteres',
        pattern: 'Apellidos solo puede contener letras y espacios'
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
    }
  };

  // Add error message containers to each field
  Object.keys(validators).forEach(function(fieldName) {
    const input = form.querySelector('[name="' + fieldName + '"]');
    if (!input) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = 'color: #2563eb; font-size: 0.85rem; margin-top: 0.25rem; display: none;';
    input.parentNode.appendChild(errorDiv);

    // Real-time validation on blur
    input.addEventListener('blur', function() {
      validateField(fieldName);
    });

    // Clear error on input
    input.addEventListener('input', function() {
      clearFieldError(fieldName);
    });
  });

  function validateField(fieldName) {
    const input = form.querySelector('[name="' + fieldName + '"]');
    const rules = validators[fieldName];
    const value = input.value.trim();

    // Required check
    if (rules.required && !value) {
      showFieldError(fieldName, rules.messages.required);
      return false;
    }

    // Min length check
    if (rules.minLength && value.length < rules.minLength) {
      showFieldError(fieldName, rules.messages.minLength);
      return false;
    }

    // Max length check
    if (rules.maxLength && value.length > rules.maxLength) {
      showFieldError(fieldName, rules.messages.maxLength);
      return false;
    }

    // Pattern check
    if (rules.pattern && !rules.pattern.test(value)) {
      showFieldError(fieldName, rules.messages.pattern);
      return false;
    }

    clearFieldError(fieldName);
    return true;
  }

  function showFieldError(fieldName, message) {
    const input = form.querySelector('[name="' + fieldName + '"]');
    const errorDiv = input.parentNode.querySelector('.error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    input.style.borderColor = '#2563eb';
    input.setAttribute('aria-invalid', 'true');
  }

  function clearFieldError(fieldName) {
    const input = form.querySelector('[name="' + fieldName + '"]');
    const errorDiv = input.parentNode.querySelector('.error-message');
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
    input.style.borderColor = '#ddd';
    input.removeAttribute('aria-invalid');
  }

  function validateForm() {
    let isValid = true;
    Object.keys(validators).forEach(function(fieldName) {
      if (!validateField(fieldName)) {
        isValid = false;
      }
    });
    return isValid;
  }

  // Form submission
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrando...';

    const formData = {
      nombres: form.querySelector('[name="nombres"]').value.trim(),
      apellidos: form.querySelector('[name="apellidos"]').value.trim(),
      correo: form.querySelector('[name="correo"]').value.trim().toLowerCase(),
      empresa: form.querySelector('[name="empresa"]').value.trim()
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
        // Handle validation errors from server
        if (result.errores && result.errores.length > 0) {
          result.errores.forEach(function(error) {
            if (validators[error.campo]) {
              showFieldError(error.campo, error.mensaje);
            }
          });
        } else {
          alert('Error: ' + (result.error || 'Error al registrar'));
        }
        return;
      }

      // Success - show QR code
      showQRSuccess(result.data);

    } catch (error) {
      console.error('Error al enviar formulario:', error);
      alert('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Registrarme';
    }
  });

  function showQRSuccess(data) {
    // Hide form and show QR
    form.style.display = 'none';
    if (nota) nota.style.display = 'none';

    const qrSection = document.createElement('div');
    qrSection.id = 'qr-success';
    qrSection.style.cssText = 'text-align: center; padding: 1rem 0;';
    qrSection.innerHTML = `
      <div style="background: #fff; border-radius: 1rem; padding: 2rem; box-shadow: 0 0.5rem 1.5rem 0.2rem rgba(0,0,0,0.1);">
        <h2 style="color: #2563eb; margin: 0 0 1rem; font-size: 1.5rem;">¡Registro Exitoso!</h2>
        <p style="color: #666; margin: 0 0 0.5rem;">${data.nombres} ${data.apellidos}</p>
        <p style="color: #666; margin: 0 0 1.5rem; font-size: 0.9rem; text-align: center;">${data.correo}</p>
        <div style="margin: 1.5rem auto; display: block;">
          <img id="qr-image" src="${data.qrCodigo}" alt="Código QR de acceso" style="width: 70%; display: block; margin: 0 auto; border: 2px solid #eee; padding: 10px; border-radius: 8px;">
        </div>
        <div style="display: flex; gap: 1rem; justify-content: center; margin: 1.5rem 0;">
          <button id="btn-download" style="background: #2563eb; color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; font-weight: bold; transition: background 0.3s;">
            📥 Descargar QR
          </button>
          <button id="btn-share" style="background: #333; color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; font-weight: bold; transition: background 0.3s;">
            📤 Compartir
          </button>
        </div>
        <p style="color: #666; font-size: 0.9rem; margin: 1rem 0;">
          Se ha enviado una copia de este QR a tu correo electrónico.
        </p>
        <p style="color: #666; font-size: 0.85rem; margin: 0.5rem 0;">
          Presenta este código QR en la entrada del evento.
        </p>
      </div>
    `;

    registroAside.insertBefore(qrSection, registroAside.firstChild);
    registroAside.querySelector('p').style.display = 'none';

    // Download button handler
    document.getElementById('btn-download').addEventListener('click', function() {
      const qrImg = document.getElementById('qr-image');
      const link = document.createElement('a');
      link.href = qrImg.src;
      link.download = 'qr-evento-Deferol.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    // Share button handler using Web Share API
    document.getElementById('btn-share').addEventListener('click', async function() {
      if (navigator.share && navigator.canShare) {
        try {
          const qrImg = document.getElementById('qr-image');
          // Convert data URL to Blob directly (no fetch needed, avoids CSP issues)
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