/**
 * Configuración centralizada de branding
 * Modificar este archivo para cambiar la identidad del evento
 */

module.exports = {
  // Marca principal
  marca: 'Deferol',
  marcaHtml: 'Deferol',

  // Evento
  nombreEvento: 'Evento Deferol',
  tituloEvento: 'Lanzamiento del Asistente Virtual de Viajes con IA',
  descripcionEvento: 'Una herramienta innovadora para descubrir el Perú con itinerarios personalizados.',

  // URLs y paths
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',

  // Email
  email: {
    remitenteNombre: process.env.SMTP_REMITE || 'Evento Deferol',
    remitenteCorreo: process.env.SMTP_FROM || process.env.SMTP_USER,
    asuntoConfirmacion: 'Confirmación de Registro - Evento Deferol',
    firma: 'Deferol - Todos los derechos reservados',
    colorPrimario: '#2563eb' // Azul deferol
  },

  // Admin
  admin: {
    titulo: 'Panel Admin - Evento Deferol',
    nombreSidebar: 'Deferol',
    subtituloSidebar: 'Admin'
  },

  // Assets
  assets: {
    logoHeader: '/img/marca-logo.png',
    logoFooter: '/img/deferol-logo.png',
    favicon: '/img/favicon.ico',
    tramaFondo: '/img/trama.png'
  },

  // Colores
  colores: {
    primario: '#2563eb',    // Azul deferol
    primarioOscuro: '#1d4ed8',
    fondo: '#2563eb',
    footer: '#1e40af'
  }
};
