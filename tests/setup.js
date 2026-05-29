/**
 * Setup global para tests
 * Este archivo se carga ANTES de que Jest cargue los módulos de test
 * 
 * jest.mock() es hoisting por Jest ANTES de ejecutar cualquier código
 * Esto permite que los mocks estén en efecto antes de que cualquier módulo los requiera
 */

// Mock GLOBAL de nodemailer - Jest lo hoisting ANTES de cargar módulos
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'mock-message-id' });
const mockCreateTransport = jest.fn().mockImplementation((_config) => ({
  sendMail: mockSendMail
}));

jest.mock('nodemailer', () => ({
  createTransport: mockCreateTransport
}));

// Mock de dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Configurar entorno de test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Exportar mocks para que los tests puedan acceder a ellos
module.exports = {
  mockSendMail,
  mockCreateTransport
};
