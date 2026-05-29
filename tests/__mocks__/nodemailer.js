/**
 * Mock de nodemailer para tests unitarios
 * Este mock crea un transporter que puede ser espiado en los tests
 * Usa mocks de Jest para que mock.calls y mock.results funcionen
 */

// Exportar un objeto con createTransport como mock de Jest
module.exports = {
  createTransport: jest.fn().mockImplementation((_config) => {
    // Retornar un objeto transporter con sendMail como mock de Jest
    return {
      sendMail: jest.fn().mockImplementation((_options) => {
        return Promise.resolve({ messageId: 'mock-message-id' });
      })
    };
  })
};
