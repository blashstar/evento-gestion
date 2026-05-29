const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Servicio de envío de correos
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Envía el código QR al asistente registrado
   * @param {Object} params - Parámetros del correo
   * @param {string} params.nombres - Nombres del asistente
   * @param {string} params.apellidos - Apellidos del asistente
   * @param {string} params.correo - Correo del destinatario
   * @param {string} params.qrDataUrl - QR en formato data URL
   * @param {string} params.tokenValidacion - Token de validación
   */
  async enviarQR({ nombres, apellidos, correo, qrDataUrl, _tokenValidacion }) {
    // Convertir data URL a Buffer para adjuntar como imagen
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    const qrBuffer = Buffer.from(base64Data, 'base64');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #2563eb; margin: 0; }
          .header p { color: #666; margin: 5px 0 0; }
          .qr-section { text-align: center; margin: 30px 0; }
          .qr-section img { max-width: 300px; width: 100%; border: 2px solid #eee; padding: 10px; border-radius: 8px; }
          .info { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .info p { margin: 8px 0; }
          .info strong { color: #333; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Deferol</h1>
            <p>Confirmación de Registro al Evento</p>
          </div>

          <p>Hola <strong>${nombres} ${apellidos}</strong>,</p>

          <p>¡Gracias por registrarte! Tu registro ha sido exitoso. A continuación encontrarás tu código QR de acceso:</p>

          <div class="qr-section">
            <img src="cid:qr-code-image" alt="Código QR de acceso">
          </div>

          <div class="info">
            <p><strong>Nombre:</strong> ${nombres} ${apellidos}</p>
            <p><strong>Correo:</strong> ${correo}</p>
            <p><strong>Estado:</strong> Registro confirmado</p>
          </div>

          <p>Por favor, presenta este código QR en la entrada del evento para facilitar tu registro.</p>

          <div class="footer">
            <p>Este correo fue enviado automáticamente. No respondas a este mensaje.</p>
            <p>© ${new Date().getFullYear()} Deferol - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: `${process.env.SMTP_REMITE ||'Evento Deferol'} <${process.env.SMTP_FROM ||process.env.SMTP_USER}>`,
      to: correo,
      subject: 'Confirmación de Registro - Evento Deferol',
      html: html,
      attachments: [
        {
          filename: 'qr-acceso.png',
          content: qrBuffer,
          cid: 'qr-code-image',
          contentType: 'image/png',
          contentDisposition: 'inline'
        }
      ]
    });
  }
}

module.exports = new EmailService();
