import { type INestApplication, VersioningType } from '@nestjs/common';

/**
 * Configuración HTTP compartida entre la aplicación real (main.ts) y las pruebas
 * e2e, para que ambas expongan exactamente las mismas rutas.
 */
export function configureApp(app: INestApplication): void {
  // Rutas bajo /api/v1/...
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
}
