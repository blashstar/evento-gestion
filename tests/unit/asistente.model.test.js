const { Sequelize } = require('sequelize');

describe('Asistente Model', () => {
  let sequelize;
  let Asistente;

  beforeAll(async () => {
    // Use SQLite in-memory for tests (no MySQL required)
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false
    });

    // Load model directly with test sequelize instance
    const AsistenteModelFactory = require('../../models/asistente');
    Asistente = AsistenteModelFactory(sequelize, Sequelize.DataTypes);

    // Sync database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Asistente.destroy({ where: {}, truncate: true });
  });

  test('should create a valid asistente', async () => {
    const asistente = await Asistente.create({
      nombre: 'Juan Pérez',
      celular: '987654321',
      correo: 'juan@example.com',
      empresa: 'Acme Corp',
      especialidad: 'Desarrollo de Software'
    });

    expect(asistente).toBeDefined();
    expect(asistente.nombre).toBe('Juan Pérez');
    expect(asistente.celular).toBe('987654321');
    expect(asistente.correo).toBe('juan@example.com');
    expect(asistente.empresa).toBe('Acme Corp');
    expect(asistente.especialidad).toBe('Desarrollo de Software');
    expect(asistente.estado).toBe('pendiente');
  });

  test('should reject asistente with empty nombre', async () => {
    await expect(Asistente.create({
      nombre: '',
      celular: '987654321',
      correo: 'juan@example.com',
      empresa: 'Acme Corp',
      especialidad: 'Desarrollo'
    })).rejects.toThrow(/Nombre es requerido/);
  });

  test('should reject asistente with short nombre', async () => {
    await expect(Asistente.create({
      nombre: 'A',
      celular: '987654321',
      correo: 'juan@example.com',
      empresa: 'Acme Corp',
      especialidad: 'Desarrollo'
    })).rejects.toThrow(/Nombre debe tener entre 2 y 100 caracteres/);
  });

  test('should reject asistente with empty celular', async () => {
    await expect(Asistente.create({
      nombre: 'Juan Pérez',
      celular: '',
      correo: 'juan@example.com',
      empresa: 'Acme Corp',
      especialidad: 'Desarrollo'
    })).rejects.toThrow(/Celular es requerido/);
  });

  test('should reject asistente with short celular', async () => {
    await expect(Asistente.create({
      nombre: 'Juan Pérez',
      celular: '123456',
      correo: 'juan@example.com',
      empresa: 'Acme Corp',
      especialidad: 'Desarrollo'
    })).rejects.toThrow(/Celular debe tener entre 7 y 20 caracteres/);
  });

  test('should reject asistente with invalid email format', async () => {
    await expect(Asistente.create({
      nombre: 'Juan Pérez',
      celular: '987654321',
      correo: 'invalid-email',
      empresa: 'Acme Corp',
      especialidad: 'Desarrollo'
    })).rejects.toThrow(/Debe ser un correo válido/);
  });

  test('should reject asistente with empty correo', async () => {
    await expect(Asistente.create({
      nombre: 'Juan Pérez',
      celular: '987654321',
      correo: '',
      empresa: 'Acme Corp',
      especialidad: 'Desarrollo'
    })).rejects.toThrow(/Debe ser un correo válido/);
  });

  test('should reject asistente with empty empresa', async () => {
    await expect(Asistente.create({
      nombre: 'Juan Pérez',
      celular: '987654321',
      correo: 'juan@example.com',
      empresa: '',
      especialidad: 'Desarrollo'
    })).rejects.toThrow(/Empresa es requerida/);
  });

  test('should reject asistente with empty especialidad', async () => {
    await expect(Asistente.create({
      nombre: 'Juan Pérez',
      celular: '987654321',
      correo: 'juan@example.com',
      empresa: 'Acme Corp',
      especialidad: ''
    })).rejects.toThrow(/Especialidad es requerida/);
  });

  test('should reject duplicate correo', async () => {
    await Asistente.create({
      nombre: 'Juan Pérez',
      celular: '987654321',
      correo: 'juan@example.com',
      empresa: 'Acme Corp',
      especialidad: 'Desarrollo'
    });

    await expect(Asistente.create({
      nombre: 'Maria González',
      celular: '987654322',
      correo: 'juan@example.com',
      empresa: 'Otra Empresa',
      especialidad: 'Diseño'
    })).rejects.toThrow(/Validation error|_UNIQUE_|unique/i);
  });

  test('should trim and normalize email before saving', async () => {
    const asistente = await Asistente.create({
      nombre: 'Juan Pérez',
      celular: '987654321',
      correo: '  JUAN@EXAMPLE.COM  ',
      empresa: 'Acme Corp',
      especialidad: 'Desarrollo'
    });

    expect(asistente.correo).toBe('juan@example.com');
  });

  test('should set default estado as pendiente', async () => {
    const asistente = await Asistente.create({
      nombre: 'Juan Pérez',
      celular: '987654321',
      correo: 'juan@example.com',
      empresa: 'Acme Corp',
      especialidad: 'Desarrollo'
    });

    expect(asistente.estado).toBe('pendiente');
  });

  test('should allow valid estado transitions', async () => {
    const asistente = await Asistente.create({
      nombre: 'Juan Pérez',
      celular: '987654321',
      correo: 'juan@example.com',
      empresa: 'Acme Corp',
      especialidad: 'Desarrollo'
    });

    asistente.estado = 'validado';
    await asistente.save();
    expect(asistente.estado).toBe('validado');

    asistente.estado = 'ingresado';
    await asistente.save();
    expect(asistente.estado).toBe('ingresado');
  });
});
