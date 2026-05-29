/**
 * Mock de jsonwebtoken para tests unitarios
 * Usa mocks de Jest para simular el comportamiento de JWT
 */

module.exports = {
  sign: jest.fn().mockImplementation((_payload, _secret, _options) => 'mock-token'),
  verify: jest.fn().mockImplementation((_token, _secret) => {
    return { id: 1, correo: 'admin@test.com', rol: 'admin' };
  })
};
