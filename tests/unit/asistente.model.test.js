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
      nombres: 'Juan',
      apellidos: 'Pérez',
      correo: 'juan@example.com',
      empresa: 'Acme Corp'
    });

    expect(asistente).toBeDefined();
    expect(asistente.nombres).toBe('Juan');
    expect(asistente.apellidos).toBe('Pérez');
    expect(asistente.correo).toBe('juan@example.com');
    expect(asistente.empresa).toBe('Acme Corp');
    expect(asistente.estado).toBe('pendiente');
  });

  test('should reject asistente with empty nombres', async () => {
    await expect(Asistente.create({
      nombres: '',
      apellidos: 'Pérez',
      correo: 'juan@example.com',
      empresa: 'Acme Corp'
    })).rejects.toThrow(/Nombres es requerido/);
  });

  test('should reject asistente with short nombres', async () => {
    await expect(Asistente.create({
      nombres: 'A',
      apellidos: 'Pérez',
      correo: 'juan@example.com',
      empresa: 'Acme Corp'
    })).rejects.toThrow(/Nombres debe tener entre 2 y 100 caracteres/);
  });

  test('should reject asistente with empty apellidos', async () => {
    await expect(Asistente.create({
      nombres: 'Juan',
      apellidos: '',
      correo: 'juan@example.com',
      empresa: 'Acme Corp'
    })).rejects.toThrow(/Apellidos es requerido/);
  });

  test('should reject asistente with invalid email format', async () => {
    await expect(Asistente.create({
      nombres: 'Juan',
      apellidos: 'Pérez',
      correo: 'invalid-email',
      empresa: 'Acme Corp'
    })).rejects.toThrow(/Debe ser un correo válido/);
  });

  test('should reject asistente with empty correo', async () => {
    await expect(Asistente.create({
      nombres: 'Juan',
      apellidos: 'Pérez',
      correo: '',
      empresa: 'Acme Corp'
    })).rejects.toThrow(/Debe ser un correo válido/);
  });

  test('should reject asistente with empty empresa', async () => {
    await expect(Asistente.create({
      nombres: 'Juan',
      apellidos: 'Pérez',
      correo: 'juan@example.com',
      empresa: ''
    })).rejects.toThrow(/Empresa es requerida/);
  });

  test('should reject duplicate correo', async () => {
    await Asistente.create({
      nombres: 'Juan',
      apellidos: 'Pérez',
      correo: 'juan@example.com',
      empresa: 'Acme Corp'
    });

    await expect(Asistente.create({
      nombres: 'Maria',
      apellidos: 'González',
      correo: 'juan@example.com',
      empresa: 'Otra Empresa'
    })).rejects.toThrow(/Validation error|_UNIQUE_|unique/i);
  });

  test('should trim and normalize email before saving', async () => {
    const asistente = await Asistente.create({
      nombres: 'Juan',
      apellidos: 'Pérez',
      correo: '  JUAN@EXAMPLE.COM  ',
      empresa: 'Acme Corp'
    });

    expect(asistente.correo).toBe('juan@example.com');
  });

  test('should set default estado as pendiente', async () => {
    const asistente = await Asistente.create({
      nombres: 'Juan',
      apellidos: 'Pérez',
      correo: 'juan@example.com',
      empresa: 'Acme Corp'
    });

    expect(asistente.estado).toBe('pendiente');
  });

  test('should allow valid estado transitions', async () => {
    const asistente = await Asistente.create({
      nombres: 'Juan',
      apellidos: 'Pérez',
      correo: 'juan@example.com',
      empresa: 'Acme Corp'
    });

    asistente.estado = 'validado';
    await asistente.save();
    expect(asistente.estado).toBe('validado');

    asistente.estado = 'ingresado';
    await asistente.save();
    expect(asistente.estado).toBe('ingresado');
  });
});
