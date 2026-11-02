import { NodeEnvironment, validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  const validUrl = 'postgresql://user:pass@localhost:5432/db?schema=public';

  it('acepta una configuración válida y convierte PORT a número', () => {
    const config = validateEnvironment({
      NODE_ENV: 'production',
      PORT: '8080',
      DATABASE_URL: validUrl,
    });

    expect(config.NODE_ENV).toBe(NodeEnvironment.Production);
    expect(config.PORT).toBe(8080);
    expect(config.DATABASE_URL).toBe(validUrl);
  });

  it('aplica valores por defecto para NODE_ENV y PORT', () => {
    const config = validateEnvironment({ DATABASE_URL: validUrl });

    expect(config.NODE_ENV).toBe(NodeEnvironment.Development);
    expect(config.PORT).toBe(3000);
  });

  it('falla si falta DATABASE_URL', () => {
    expect(() => validateEnvironment({})).toThrow(/Configuración de entorno inválida/);
  });

  it('falla si DATABASE_URL no es de PostgreSQL', () => {
    expect(() => validateEnvironment({ DATABASE_URL: 'mysql://localhost/db' })).toThrow(
      /PostgreSQL/,
    );
  });

  it('falla si PORT está fuera de rango', () => {
    expect(() => validateEnvironment({ DATABASE_URL: validUrl, PORT: '70000' })).toThrow();
  });
});
