import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ServiceUnavailableErrorDto } from '../common/dto/error-response.dto';
import { API_TAGS } from '../config/swagger.config';
import { HealthResponse } from './dto/health-response.dto';
import { HealthService } from './health.service';

@ApiTags(API_TAGS.health)
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Estado del servicio',
    description: 'Verifica que la API esté en ejecución y que pueda consultar la base de datos.',
  })
  @ApiOkResponse({ type: HealthResponse })
  @ApiServiceUnavailableResponse({
    type: ServiceUnavailableErrorDto,
    description: 'La base de datos no responde',
  })
  check(): Promise<HealthResponse> {
    return this.healthService.check();
  }
}
