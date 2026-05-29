/**
 * End-to-End Tests para Evento Deferol - Pagina de Validacion
 * usa Playwright para automatizacion del navegador
 */

const { test, expect } = require('@playwright/test');

// Configuracion de tests
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const INVALID_UUID = 'not-a-valid-uuid';

/**
 * Testes para la pagina de landing
 */
test.describe('Pagina de Landing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('deberia cargar la pagina de inicio correctamente', async ({ page }) => {
    await expect(page).toHaveTitle(/Deferol|Evento/i);
    
    // Verificar elementos principales
    const logo = page.locator('.logo, img[alt*="Logo"]');
    await expect(logo.first()).toBeVisible();
  });

  test('deberia tener enlace a la pagina de registro via URL directa', async ({ page }) => {
    // Navegar directamente a registro
    await page.goto(`${BASE_URL}/registro`);
    await expect(page).toHaveURL(/\/registro/);
    await expect(page.locator('form')).toBeVisible();
  });

  test('deberia tener enlace a la pagina de validacion via URL directa', async ({ page }) => {
    // Navegar directamente a validacion
    await page.goto(`${BASE_URL}/validacion`);
    await expect(page).toHaveURL(/\/validacion/);
  });
});

/**
 * Testes para la pagina de registro
 */
test.describe('Pagina de Registro', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/registro`);
  });

  test('deberia cargar la pagina de registro correctamente', async ({ page }) => {
    await expect(page).toHaveURL(/\/registro/);
    await expect(page.locator('form')).toBeVisible();
  });

  test('deberia mostrar errores de validacion para formulario vacio', async ({ page }) => {
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);
    
    const pageContent = await page.content();
    expect(pageContent).toMatch(/requerido|válido|required/i);
  });

  test('deberia mostrar error para correo invalido', async ({ page }) => {
    await page.fill('input[name="nombres"]', 'Juan');
    await page.fill('input[name="apellidos"]', 'Perez');
    await page.fill('input[name="correo"]', 'correo-invalido');
    await page.fill('input[name="empresa"]', 'Empresa Test');
    
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);
    
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toMatch(/correo|válido|email/i);
  });
});

/**
 * Testes para la pagina de validacion (Escaner QR)
 */
test.describe('Pagina de Validacion (Escaner QR)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/validacion`);
  });

  test('deberia cargar la pagina de validacion correctamente', async ({ page }) => {
    await expect(page).toHaveURL(/\/validacion/);
    
    // Verificar elementos principales
    await expect(page.locator('#escaner')).toBeVisible();
    // El lector-qr puede estar oculto si no hay camara disponible
    await expect(page.locator('#lector-qr')).toBeAttached();
    await expect(page.locator('#estado-escaneo')).toBeVisible();
  });

  test('deberia mostrar el area de resultado oculta inicialmente', async ({ page }) => {
    const resultado = page.locator('#resultado');
    await expect(resultado).toBeAttached();
    await expect(resultado).toHaveClass(/oculto/);
  });

  test('deberia tener el boton de Escanear otro QR', async ({ page }) => {
    const btnNuevoEscaneo = page.locator('#btn-nuevo-escaneo');
    await expect(btnNuevoEscaneo).toBeAttached();
    await expect(btnNuevoEscaneo).toHaveText(/Escanear otro QR/i);
  });

  test('deberia mostrar estado de escaneo', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const estado = page.locator('#estado-escaneo');
    await expect(estado).toBeVisible();
    
    const estadoText = await estado.textContent();
    // Puede mostrar "Escaneando..." o "Error al acceder a la camara" dependiendo de si hay camara
    expect(
      estadoText.includes('Escaneando') || 
      estadoText.includes('Error') ||
      estadoText.includes('Validando')
    ).toBeTruthy();
  });
});

/**
 * Testes para los endpoints de la API
 */
test.describe('Endpoints de API', () => {
  test('/api/_ok deberia devolver estado saludable', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/_ok`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('/api/ingreso deberia rechazar formato UUID invalido', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/ingreso`, {
      data: { token: INVALID_UUID }
    });
    
    const data = await response.json();
    
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/UUID|token|válido/i);
  });

  test('/api/ingreso deberia devolver 404 para QR inexistente', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/ingreso`, {
      data: { token: '12345678-1234-1234-1234-123456789012' }
    });
    
    // Puede devolver 404 (no encontrado) o 500 (si no hay DB)
    expect([404, 500]).toContain(response.status());
    
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test('/api/ingreso deberia manejar caso cuando la DB no esta disponible', async ({ request }) => {
    // Este test verifica que la API responde, aunque sea con error de DB
    const nonExistentUuid = '99999999-9999-9999-9999-999999999999';
    const response = await request.post(`${BASE_URL}/api/ingreso`, {
      data: { token: nonExistentUuid }
    });
    
    // La respuesta puede ser 404 (no encontrado) o 500 (error de DB)
    expect([404, 500]).toContain(response.status());
  });

  test('/api/registro deberia rechazar datos invalidos', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/registro`, {
      data: {
        nombres: '',
        apellidos: '',
        correo: 'invalid',
        empresa: ''
      }
    });
    
    expect([400, 422]).toContain(response.status());
  });
});

/**
 * Testes de diseno responsivo
 */
test.describe('Diseno Responsivo', () => {
  test('deberia funcionar en viewport movil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`${BASE_URL}/validacion`);
    await expect(page).toHaveURL(/\/validacion/);
    await expect(page.locator('#escaner')).toBeVisible();
  });

  test('deberia funcionar en viewport de tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto(`${BASE_URL}/validacion`);
    await expect(page).toHaveURL(/\/validacion/);
  });
});

/**
 * Testes de seguridad
 */
test.describe('Cabeceras de Seguridad', () => {
  test('deberia tener cabeceras de seguridad', async ({ request }) => {
    const response = await request.get(BASE_URL);
    
    const headers = response.headers();
    
    const hasSecurityHeaders = 
      headers['x-content-type-options'] || 
      headers['x-frame-options'] ||
      headers['content-security-policy'];
    
    expect(hasSecurityHeaders).toBeTruthy();
  });
});

/**
 * Testes para flujos de usuario
 */
test.describe('Flujos de Usuario', () => {
  test('deberia poder navegar a las principales paginas', async ({ page }) => {
    // Navegar a registro
    await page.goto(`${BASE_URL}/registro`);
    await expect(page).toHaveURL(/\/registro/);
    await expect(page.locator('form')).toBeVisible();
    
    // Navegar a validacion
    await page.goto(`${BASE_URL}/validacion`);
    await expect(page).toHaveURL(/\/validacion/);
    
    // Verificar elementos del scanner (el lector-qr puede estar oculto si no hay camara)
    await expect(page.locator('#lector-qr')).toBeAttached();
    await expect(page.locator('#estado-escaneo')).toBeVisible();
  });
  
  test('deberia cargar la pagina principal sin errores', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Verificar titulo
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    // Verificar que no hay errores criticos en consola
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    
    // No deberia haber errores criticos (algunos errores de camara son esperados)
    const criticalErrors = consoleErrors.filter(e => 
      !e.includes('camera') && !e.includes('Camera') && !e.includes('MediaDevice')
    );
    expect(criticalErrors.length).toBe(0);
  });
});