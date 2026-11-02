import { ServiceUnavailableException } from '@nestjs/common';
import { type PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('responde ok cuando la base de datos contesta', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const service = new HealthService(prisma as unknown as PrismaService);

    const result = await service.check();

    expect(result).toMatchObject({ status: 'ok', database: 'up' });
    expect(typeof result.uptimeSeconds).toBe('number');
  });

  it('responde 503 cuando la base de datos no contesta', async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error('connection refused')) };
    const service = new HealthService(prisma as unknown as PrismaService);

    await expect(service.check()).rejects.toThrow(ServiceUnavailableException);
  });
});
