/**
 * Tests unitarios para middleware de autenticación JWT
 * Usa automock de Jest con __mocks__
 */

// Mock de dotenv para evitar carga de .env real
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  // Restaurar entorno
  process.env = { ...originalEnv };
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
});

afterAll(() => {
  process.env = originalEnv;
});

// Mock de express request/response
const mockRequest = (headers = {}, body = {}) => ({
  headers,
  body
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('Auth Middleware - verificarToken', () => {
  let jwt;
  let verificarToken;

  beforeEach(() => {
    // Resetear módulos
    jest.resetModules();
    
    // Re-requerir jwt mockado
    jwt = require('jsonwebtoken');
    
    // Cargar middleware
    const authMiddleware = require('../../../middleware/auth');
    verificarToken = authMiddleware.verificarToken;
  });

  describe('Token válido', () => {
    test('debería llamar a next() con token JWT válido', () => {
      const mockPayload = { id: 1, correo: 'admin@test.com', rol: 'admin' };
      
      jwt.verify.mockReturnValue(mockPayload);

      const req = mockRequest({
        authorization: 'Bearer valid-token-12345'
      });
      const res = mockResponse();
      const next = jest.fn();

      verificarToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token-12345', 'test-secret-key');
      expect(req.usuario).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    test('debería usar JWT_SECRET del entorno', () => {
      process.env.JWT_SECRET = 'custom-secret';
      const mockPayload = { id: 1, correo: 'test@test.com' };
      jwt.verify.mockReturnValue(mockPayload);

      const req = mockRequest({
        authorization: 'Bearer some-token'
      });
      const res = mockResponse();
      const next = jest.fn();

      verificarToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('some-token', 'custom-secret');
    });

    test('debería adjuntar el payload decodificado a req.usuario', () => {
      const mockPayload = { 
        id: 123, 
        correo: 'admin@evento.dev', 
        rol: 'admin',
        customField: 'test-value' 
      };
      
      jwt.verify.mockReturnValue(mockPayload);

      const req = mockRequest({
        authorization: 'Bearer valid-token'
      });
      const res = mockResponse();
      const next = jest.fn();

      verificarToken(req, res, next);

      expect(req.usuario).toEqual(mockPayload);
    });
  });

  describe('Token inválido o faltante', () => {
    test('debería devolver 401 si no hay header Authorization', () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = jest.fn();

      verificarToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acceso no autorizado. Token requerido.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debería devolver 401 si header Authorization no empieza con Bearer', () => {
      const req = mockRequest({
        authorization: 'Basic dXNlcjpwYXNz'
      });
      const res = mockResponse();
      const next = jest.fn();

      verificarToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acceso no autorizado. Token requerido.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debería devolver 401 si header Authorization es solo "Bearer"', () => {
      const req = mockRequest({
        authorization: 'Bearer '
      });
      const res = mockResponse();
      const next = jest.fn();

      verificarToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('debería devolver 401 si el token es inválido', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      const req = mockRequest({
        authorization: 'Bearer invalid-token'
      });
      const res = mockResponse();
      const next = jest.fn();

      verificarToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-secret-key');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido o expirado'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debería devolver 401 si el token ha expirado', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      const req = mockRequest({
        authorization: 'Bearer expired-token'
      });
      const res = mockResponse();
      const next = jest.fn();

      verificarToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido o expirado'
      });
    });

    test('debería devolver 401 si el token está mal firmado', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      const req = mockRequest({
        authorization: 'Bearer tampered-token'
      });
      const res = mockResponse();
      const next = jest.fn();

      verificarToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido o expirado'
      });
    });

    test('debería devolver 401 para cualquier error de jwt.verify', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('any error');
      });

      const req = mockRequest({
        authorization: 'Bearer any-token'
      });
      const res = mockResponse();
      const next = jest.fn();

      verificarToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido o expirado'
      });
    });
  });

  describe('Edge Cases', () => {
    test('debería manejar Authorization header en minúsculas', () => {
      const mockPayload = { id: 1, correo: 'test@test.com' };
      jwt.verify.mockReturnValue(mockPayload);

      const req = mockRequest({
        authorization: 'bearer valid-token'
      });
      const res = mockResponse();
      const next = jest.fn();

      verificarToken(req, res, next);

      // El middleware usa startsWith('Bearer ') - sensitivo a mayúsculas
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('debería manejar header Authorization vacío', () => {
      const req = mockRequest({
        authorization: ''
      });
      const res = mockResponse();
      const next = jest.fn();

      verificarToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acceso no autorizado. Token requerido.'
      });
    });

    test('debería manejar header Authorization nulo', () => {
      const req = mockRequest({
        authorization: null
      });
      const res = mockResponse();
      const next = jest.fn();

      verificarToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('debería manejar header Authorization undefined', () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = jest.fn();

      verificarToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('debería manejar token con caracteres especiales', () => {
      const mockPayload = { id: 1, correo: 'test@test.com' };
      jwt.verify.mockReturnValue(mockPayload);

      const specialToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      const req = mockRequest({
        authorization: `Bearer ${specialToken}`
      });
      const res = mockResponse();
      const next = jest.fn();

      verificarToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(specialToken, 'test-secret-key');
      expect(next).toHaveBeenCalled();
    });
  });
});

// Tests adicionales para el módulo exportado
describe('Auth Middleware Module', () => {
  test('debería exportar verificarToken como función', () => {
    jest.resetModules();
    const authMiddleware = require('../../../middleware/auth');
    
    expect(authMiddleware).toHaveProperty('verificarToken');
    expect(typeof authMiddleware.verificarToken).toBe('function');
  });

  test('debería exportar solo verificarToken', () => {
    jest.resetModules();
    const authMiddleware = require('../../../middleware/auth');
    
    expect(Object.keys(authMiddleware)).toEqual(['verificarToken']);
  });
});
