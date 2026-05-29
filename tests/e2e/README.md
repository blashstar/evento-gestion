# End-to-End Tests

This directory contains Playwright E2E tests for the Evento Deferol application.

## Prerequisites

```bash
# Install Playwright and browsers (one time only)
npm run test:e2e:install
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests in headed mode (visible browser)
```bash
npm run test:e2e:headed
```

### Run tests with interactive UI
```bash
npm run test:e2e:ui
```

### View test report
```bash
npm run test:e2e:report
```

## Test Coverage

The tests cover:

### Landing Page
- Page loads successfully
- Navigation to registration page
- Navigation to validation page

### Registration Page
- Page loads successfully
- Form validation (empty form)
- Email validation (invalid format)
- Duplicate email handling

### Validation Page (QR Scanner)
- Page loads successfully
- Scanner initialization
- Result area display
- QR validation states

### API Endpoints
- Health check (`/api/_ok`)
- Registration validation
- Ingreso validation
- Error handling

### Admin Login
- Login page loads
- Invalid credentials rejection

### Security
- Security headers verification

### Responsive Design
- Mobile viewport
- Tablet viewport

## Configuration

See `playwright.config.js` for test configuration options.

## Adding New Tests

1. Create a new test file in this directory with `.spec.js` extension
2. Use the test structure pattern shown in existing tests
3. Run tests to verify

## Tips

- Use `test.only()` in specific tests for focused debugging
- Use `test.skip()` to temporarily skip tests
- Check `playwright-report` folder for detailed test results
- Use the `--ui` mode to interactively run and debug tests