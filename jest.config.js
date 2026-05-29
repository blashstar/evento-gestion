module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'models/**/*.js',
    'services/**/*.js',
    'controllers/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  automock: false,  // Deshabilitar automock para tener control total
  resetMocks: false,
  setupFiles: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
};
