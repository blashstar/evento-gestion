/**
 * Lógica del Panel de Administración - Evento Deferol
 * Usa Admin One Bulma Dashboard + Tabulator
 */

// Variables globales
let table = null;
let searchTimeout = null;

// ============================================
// Autenticación
// ============================================

/**
 * Verificar si el usuario está autenticado
 */
function checkAuth() {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = '/adm/login';
    return false;
  }
  return true;
}

/**
 * Cerrar sesión
 */
function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUsuario');
  localStorage.removeItem('csrfToken');
  window.location.href = '/adm/login';
}

/**
 * Obtener headers con token de autenticación
 */
function getAuthHeaders() {
  const token = localStorage.getItem('adminToken');
  const csrfToken = localStorage.getItem('csrfToken') || '';

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  return headers;
}

// ============================================
// Inicialización de Tabulator
// ============================================

/**
 * Inicializar tabla con Tabulator
 */
function initTable() {
  table = new Tabulator('#asistentes-table', {
    layout: 'fitColumns',
    responsiveLayout: 'collapse',
    responsiveLayoutCollapseStartOpen: true,
    responsiveLayoutCollapseFormatter: function(data) {
      // Crear lista de datos ocultos con mejor formato
      let list = document.createElement('div');
      list.className = 'is-flex is-flex-direction-column is-gap-2';

      data.forEach(function(col) {
        let item = document.createElement('div');
        item.className = 'is-flex is-justify-content-space-between';
        item.innerHTML = `
          <span class="has-text-weight-semibold">${col.title}:</span>
          <span>${col.value}</span>
        `;
        list.appendChild(item);
      });

      return Object.keys(data).length ? list : '';
    },
    rowHeader: {
      formatter: 'responsiveCollapse',
      width: 30,
      minWidth: 30,
      hozAlign: 'center',
      resizable: false,
      headerSort: false
    },
    pagination: 'local',
    paginationSize: 20,
    paginationSizeSelector: [10, 20, 50, 100],
    movableColumns: false,
    resizableRows: false,
    height: 'auto',

    columns: [
      {
        title: 'ID',
        field: 'id',
        width: 60,
        responsive: 0,
        sorter: 'number',
        download: true,
        resizable:false
      },
      {
        title: 'Nombre Completo',
        field: 'nombre',
        minWidth: 180,
        responsive: 0,
        headerFilter: false,
        download: true,
        titleDownload: 'Nombre Completo',
        formatter: (cell) => cell.getValue() || '',
        accessorDownload: (_value, data, _type, _params, _column) => data.nombre || '',
        resizable:false
      },
      {
        title: 'Celular',
        field: 'celular',
        minWidth: 120,
        responsive: 1,
        download: true,
        titleDownload: 'Celular',
        formatter: (cell) => cell.getValue() || '',
        resizable:false
      },
      {
        title: 'Especialidad',
        field: 'especialidad',
        minWidth: 150,
        responsive: 1,
        download: true,
        titleDownload: 'Especialidad',
        formatter: (cell) => cell.getValue() || '',
        resizable:false
      },
      {
        title: 'Correo',
        field: 'correo',
        responsive: 2,
        download: true,
        titleDownload: 'Correo',
        formatter: (cell) => cell.getValue(),
        resizable:false
      },
      {
        title: 'Empresa',
        field: 'empresa',
        responsive: 2,
        download: true,
        titleDownload: 'Empresa',
        formatter: (cell) => cell.getValue(),
        resizable:false
      },
      {
        title: 'Estado',
        field: 'estado',
        width: 120,
        responsive: 2,
        download: true,
        titleDownload: 'Estado',
        formatter: (cell) => {
          const estado = cell.getValue();
          return `<span class="status-badge status-${estado}">${getEstadoLabel(estado)}</span>`;
        },
        accessorDownload: (value) => getEstadoLabel(value),
        resizable:false
      },
      {
        title: 'Fecha Registro',
        field: 'fecha_registro',
        width: 150,
        visible: false,
        download: true,
        formatter: (cell) => formatDate(cell.getValue()),
        accessorDownload: (value) => formatDate(value)
      },
      {
        title: 'Fecha Ingreso',
        field: 'fecha_ingreso',
        width: 150,
        visible: false,
        download: true,
        formatter: (cell) => cell.getValue() ? formatDate(cell.getValue()) : '-',
        accessorDownload: (value) => value ? formatDate(value) : '-'
      },
      {
        title: 'Acciones',
        field: 'id',
        width: 140,
        minWidth: 100,
        responsive: 3,
        headerSort: false,
        formatter: (cell) => {
          const data = cell.getData();
          const id = data.id;
          const estado = data.estado;

          // Botón para ver detalle
          const viewBtn = `<button type="button" class="button is-small is-info is-light jb-view-detail" data-id="${id}" title="Ver detalle">
            <span class="icon"><i class="mdi mdi-eye"></i></span>
            <span>Ver</span>
          </button>`;

          // Botón para cambiar a pendiente (solo si está ingresado)
          let resetBtn = '';
          if (estado === 'ingresado') {
            resetBtn = `<button type="button" class="button is-small is-warning is-light jb-reset-estado" data-id="${id}" title="Marcar como pendiente">
              <span class="icon"><i class="mdi mdi-undo"></i></span>
              <span>Reiniciar</span>
            </button>`;
          }

          return `<div class="buttons are-small has-addons">${viewBtn}${resetBtn}</div>`;
        },
        download: false,
        resizable:false
      }
    ],

    // Data loaded manually via loadAsistentes()
    data: []
  });
}

// ============================================
// Carga de datos
// ============================================

/**
 * Cargar lista de asistentes (sin filtros - se aplican localmente con Tabulator)
 */
async function loadAsistentes() {
  if (!checkAuth()) return;

  showLoading(true);

  try {
    const response = await fetch('/adm/asistentes?limit=1000&offset=0', {
      headers: getAuthHeaders()
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const result = await response.json();

    if (result.success) {
      if (table) {
        table.setData(result.data.asistentes);
      }
      updateStats(result.data.estadisticas);
    } else {
      showError(result.error || 'Error al cargar asistentes');
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Error de conexión');
  } finally {
    showLoading(false);
  }
}

/**
 * Cargar detalle de un asistente
 */
async function loadAsistenteDetalle(id) {
  try {
    const response = await fetch(`/adm/asistentes/${id}`, {
      headers: getAuthHeaders()
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const result = await response.json();

    if (result.success) {
      renderDetalle(result.data);
      openModal();
    } else {
      showError(result.error || 'Error al cargar detalle');
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Error de conexión');
  }
}

/**
 * Cambiar el estado de un asistente a pendiente
 */
async function resetEstado(id) {
  if (!confirm('¿Estás seguro de marcar este asistente como pendiente?')) {
    return;
  }

  showLoading(true);

  try {
    const response = await fetch(`/adm/asistentes/${id}/estado`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ estado: 'pendiente' })
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const result = await response.json();

    if (result.success) {
      showError('Estado actualizado a pendiente');
      // Recargar la lista
      loadAsistentes();
    } else {
      showError(result.error || 'Error al cambiar estado');
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Error de conexión');
  } finally {
    showLoading(false);
  }
}

// ============================================
// Renderizado UI
// ============================================

/**
 * Renderizar detalle del asistente
 */
function renderDetalle(asistente) {
  const container = document.getElementById('asistente-detail');

  const estadoLabel = getEstadoLabel(asistente.estado);
  const estadoClass = `status-${asistente.estado}`;

  container.innerHTML = `
    <div class="columns is-multiline">
      <div class="column is-full">
        <label class="label">Nombre Completo</label>
        <p class="content is-medium">${asistente.nombre}</p>
      </div>
      <div class="column is-half">
        <label class="label">Celular</label>
        <p class="content is-medium">${asistente.celular || '-'}</p>
      </div>
      <div class="column is-half">
        <label class="label">Especialidad</label>
        <p class="content is-medium">${asistente.especialidad || '-'}</p>
      </div>
      <div class="column is-full">
        <label class="label">Correo</label>
        <p class="content is-medium">${asistente.correo}</p>
      </div>
      <div class="column is-full">
        <label class="label">Empresa</label>
        <p class="content is-medium">${asistente.empresa}</p>
      </div>
      <div class="column is-half">
        <label class="label">Estado</label>
        <p class="content">
          <span class="status-badge ${estadoClass}">${estadoLabel}</span>
        </p>
      </div>
      <div class="column is-half">
        <label class="label">Fecha de Registro</label>
        <p class="content is-medium">${formatDate(asistente.fecha_registro)}</p>
      </div>
      ${asistente.fecha_ingreso ? `
      <div class="column is-half">
        <label class="label">Fecha de Ingreso</label>
        <p class="content is-medium">${formatDate(asistente.fecha_ingreso)}</p>
      </div>
      ` : ''}
      <div class="column is-full">
        <label class="label">Código QR</label>
        ${asistente.qr_codigo ? `
          <figure class="image" style="width: 100%; max-width: 400px; margin: 0 auto;">
            <img src="${asistente.qr_codigo}" alt="QR Code" class="qr-preview" id="qr-image" style="width: 100%; height: auto;">
          </figure>
          <p class="is-size-7 has-text-grey">UUID: ${asistente.token_validacion}</p>
          <div class="buttons is-centered mt-3">
            <button type="button" class="button is-primary" id="btn-download-qr">
              <span class="icon"><i class="mdi mdi-download"></i></span>
              <span>Descargar</span>
            </button>
            <button type="button" class="button is-info" id="btn-share-qr">
              <span class="icon"><i class="mdi mdi-share-variant"></i></span>
              <span>Compartir</span>
            </button>
            <button type="button" class="button is-warning" id="btn-email-qr">
              <span class="icon"><i class="mdi mdi-email"></i></span>
              <span>Enviar por Correo</span>
            </button>
          </div>
          <input type="hidden" id="qr-asistente-id" value="${asistente.id}">
          <input type="hidden" id="qr-asistente-nombre" value="${asistente.nombre}">
        ` : '<p class="has-text-grey">No disponible</p>'}
      </div>
    </div>
  `;

  // Agregar event listeners para los botones QR
  if (asistente.qr_codigo) {
    setTimeout(() => {
      // Botón descargar QR
      const btnDownload = document.getElementById('btn-download-qr');
      if (btnDownload) {
        btnDownload.addEventListener('click', () => downloadQR(asistente.qr_codigo, asistente.nombre));
      }

      // Botón compartir QR
      const btnShare = document.getElementById('btn-share-qr');
      if (btnShare) {
        btnShare.addEventListener('click', () => shareQR(asistente.qr_codigo, asistente.nombre));
      }

      // Botón enviar por correo
      const btnEmail = document.getElementById('btn-email-qr');
      if (btnEmail) {
        btnEmail.addEventListener('click', () => sendQRByEmail(asistente.id));
      }
    }, 100);
  }
}

/**
 * Actualizar estadísticas
 */
function updateStats(stats) {
  document.getElementById('stat-total').textContent = stats.total || 0;
  document.getElementById('stat-ingresados').textContent = stats.ingresados || 0;
}

/**
 * Descargar código QR como imagen
 */
function downloadQR(qrDataUrl, nombre) {
  // Convertir data URL a blob para descargar
  const link = document.createElement('a');
  link.href = qrDataUrl;
  link.download = `qr-${nombre.replace(/\s+/g, '-').toLowerCase()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Compartir código QR usando la API nativa del navegador
 */
async function shareQR(qrDataUrl, nombre) {
  try {
    // Convertir data URL a blob sin usar fetch (para evitar CSP)
    const blob = dataURLtoBlob(qrDataUrl);

    // Crear archivo para compartir
    const file = new File([blob], `qr-${nombre.replace(/\s+/g, '-').toLowerCase()}.png`, {
      type: 'image/png'
    });

    // Verificar si la API de compartir está disponible
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Código QR - ${nombre}`,
        text: `Código QR de acceso para ${nombre}`,
        files: [file]
      });
    } else if (navigator.share) {
      // Si no soporta archivos, intentar solo texto
      await navigator.share({
        title: `Código QR - ${nombre}`,
        text: `Código QR de acceso para ${nombre}: ${qrDataUrl}`
      });
    } else {
      // fallback: copiar al portapapeles
      await navigator.clipboard.writeText(qrDataUrl);
      showError('URL del QR copiada al portapapeles');
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error al compartir:', error);
      showError('No se pudo compartir el QR');
    }
  }
}

/**
 * Convertir data URL a Blob
 */
function dataURLtoBlob(dataURL) {
  const parts = dataURL.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

// ============================================
// Utilidades
// ============================================

/**
 * Obtener etiqueta legible del estado
 */
function getEstadoLabel(estado) {
  // Solo "ingresado" muestra "Ingresó", todo lo demás es "Registrado"
  return estado === 'ingresado' ? 'Ingresó' : 'Registrado';
}

/**
 * Formatear fecha
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Mostrar/ocultar loading
 */
function showLoading(show) {
  const loading = document.getElementById('loading');
  if (show) {
    loading.classList.remove('is-hidden');
  } else {
    loading.classList.add('is-hidden');
  }
}

/**
 * Mostrar mensaje de error
 */
function showError(message) {
  // Create notification
  const notification = document.createElement('div');
  notification.className = 'notification is-danger';
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.zIndex = '9999';
  notification.innerHTML = `
    <button type="button" class="delete jb-notification-dismiss"></button>
    ${message}
  `;

  document.body.appendChild(notification);

  // Close button handler
  const dismissBtn = notification.querySelector('.jb-notification-dismiss');
  dismissBtn.addEventListener('click', function() {
    notification.remove();
  });

  setTimeout(() => notification.remove(), 5000);
}

/**
 * Mostrar mensaje de éxito
 */
function showSuccess(message) {
  const notification = document.createElement('div');
  notification.className = 'notification is-success';
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.zIndex = '9999';
  notification.innerHTML = `
    <button type="button" class="delete jb-notification-dismiss"></button>
    ${message}
  `;

  document.body.appendChild(notification);

  const dismissBtn = notification.querySelector('.jb-notification-dismiss');
  dismissBtn.addEventListener('click', function() {
    notification.remove();
  });

  setTimeout(() => notification.remove(), 5000);
}

/**
 * Enviar QR por correo al asistente
 */
async function sendQRByEmail(asistenteId) {
  const btn = document.getElementById('btn-email-qr');
  btn.classList.add('is-loading');
  btn.disabled = true;

  try {
    const response = await fetch(`/adm/asistentes/${asistenteId}/enviar-qr`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const result = await response.json();

    if (result.success) {
      showSuccess('QR enviado exitosamente al correo del asistente');
    } else {
      showError(result.error || 'Error al enviar el correo');
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Error de conexión');
  } finally {
    btn.classList.remove('is-loading');
    btn.disabled = false;
  }
}

/**
 * Debounce para búsqueda - aplica filtros localmente
 */
function debounceSearch(_value) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 300);
}

// ============================================
// Navegación
// ============================================

// ============================================
// Navigation
// ============================================

/**
 * Mostrar sección
 */
function showSection(section) {
  // Ocultar todas las secciones
  document.querySelectorAll('.is-main-section').forEach(el => {
    el.classList.add('is-hidden');
  });

  // Mostrar la sección seleccionada
  const target = document.getElementById('section-' + section);
  if (target) {
    target.classList.remove('is-hidden');
  }

  // Actualizar breadcrumb y título
  const titles = {
    asistentes: 'Lista de Asistentes',
    enlaces: 'Enlaces del Evento'
  };
  const breadcrumb = document.getElementById('breadcrumb-active');
  const heroTitle = document.getElementById('hero-title');
  if (breadcrumb) breadcrumb.textContent = titles[section] || section;
  if (heroTitle) heroTitle.textContent = titles[section] || section;
}

/**
 * Exportar listado a Excel usando Tabulator
 */
function exportToExcel() {
  if (!table) {
    showError('Tabla no inicializada');
    return;
  }

  showLoading(true);

  // Usar función nativa de Tabulator para descargar XLSX
  table.download('xlsx', 'asistentes.xlsx', {
    sheetName: 'Asistentes'
  });

  setTimeout(() => {
    showLoading(false);
  }, 1000);
}

// Agregar event listeners para navegación
document.addEventListener('click', function(e) {
  // Menu items
  const menuItem = e.target.closest('.jb-menu-item');
  if (menuItem) {
    e.preventDefault();
    const section = menuItem.dataset.section;
    showSection(section);

    // Update active state
    document.querySelectorAll('.jb-menu-item').forEach(link => {
      link.classList.remove('is-active');
      link.classList.remove('router-link-active');
    });
    menuItem.classList.add('is-active');
    menuItem.classList.add('router-link-active');
    return;
  }

  // Logout button
  if (e.target.closest('#btn-logout')) {
    logout();
    return;
  }

  // Refresh button
  if (e.target.closest('#btn-refresh') || e.target.closest('.jb-refresh-icon')) {
    loadAsistentes();
    return;
  }

  // Copy link buttons
  const copyBtn = e.target.closest('.jb-copy-link');
  if (copyBtn) {
    const targetId = copyBtn.dataset.target;
    const urlEl = document.getElementById(targetId);
    if (urlEl) {
      const fullUrl = window.location.origin + urlEl.textContent.trim();
      navigator.clipboard.writeText(fullUrl).then(() => {
        const originalHtml = copyBtn.innerHTML;
        copyBtn.classList.add('is-copied');
        copyBtn.innerHTML = '<span class="icon"><i class="mdi mdi-check"></i></span><span>Copiado</span>';
        setTimeout(() => {
          copyBtn.classList.remove('is-copied');
          copyBtn.innerHTML = originalHtml;
        }, 2000);
      }).catch(err => {
        console.error('Error al copiar:', err);
      });
    }
    return;
  }

  // View detail button (in table)
  const viewDetailBtn = e.target.closest('.jb-view-detail');
  if (viewDetailBtn) {
    const id = viewDetailBtn.dataset.id;
    loadAsistenteDetalle(id);
    return;
  }

  // Reset estado button (in table)
  const resetEstadoBtn = e.target.closest('.jb-reset-estado');
  if (resetEstadoBtn) {
    const id = resetEstadoBtn.dataset.id;
    resetEstado(id);
    return;
  }

  // Close modal button
  if (e.target.closest('#btn-close-modal') || e.target.closest('.modal-background') || e.target.closest('#btn-cerrar-modal')) {
    closeModal();
    return;
  }
});

// ============================================
// Modal
// ============================================

/**
 * Abrir modal de detalle
 */
function openModal() {
  const modal = document.getElementById('detail-modal');
  modal.classList.add('is-active');
}

/**
 * Cerrar modal
 */
function closeModal() {
  const modal = document.getElementById('detail-modal');
  modal.classList.remove('is-active');
}

// ============================================
// Event Listeners
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticación
  if (!checkAuth()) return;

  // Inicializar Tabulator
  initTable();

  // Configurar búsqueda con debounce
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    debounceSearch(e.target.value);
  });

  // Botón de búsqueda
  const btnBuscar = document.getElementById('btn-buscar');
  if (btnBuscar) {
    btnBuscar.addEventListener('click', () => {
      // Aplicar filtros usando Tabulator
      applyFilters();
    });
  }

  // Botón exportar Excel
  const btnExportExcel = document.getElementById('btn-export-excel');
  if (btnExportExcel) {
    btnExportExcel.addEventListener('click', () => {
      exportToExcel();
    });
  }

  // Configurar filtro de estado
  const filterEstado = document.getElementById('filter-estado');
  filterEstado.addEventListener('change', () => {
    // Aplicar filtros usando Tabulator
    applyFilters();
  });

  // Cargar datos iniciales al iniciar
  loadAsistentes();
});

// Función para aplicar filtros locales con Tabulator
function applyFilters() {
  if (!table) return;

  const search = document.getElementById('search-input').value.trim().toLowerCase();
  const estado = document.getElementById('filter-estado').value;

  // Aplicar filtro usando función personalizada
  if (search || estado) {
    table.setFilter((item) => {
      // Filtro de búsqueda
      if (search) {
        const matchSearch = (item.nombre && item.nombre.toLowerCase().includes(search)) ||
                            (item.correo && item.correo.toLowerCase().includes(search)) ||
                            (item.empresa && item.empresa.toLowerCase().includes(search)) ||
                            (item.celular && item.celular.toLowerCase().includes(search)) ||
                            (item.especialidad && item.especialidad.toLowerCase().includes(search));
        if (!matchSearch) return false;
      }

      // Filtro de estado
      if (estado) {
        if (estado === 'ingresado') {
          if (item.estado !== 'ingresado') return false;
        } else if (estado === 'registrado') {
          if (item.estado === 'ingresado') return false;
        }
      }

      return true;
    });
  } else {
    table.clearFilter();
  }
}
