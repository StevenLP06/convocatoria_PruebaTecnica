import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { VariableCode } from '@prisma/client';
import { BadRequestErrorDto, NotFoundErrorDto } from '../common/dto/error-response.dto';
import { API_TAGS } from '../config/swagger.config';
import { VariableResponse } from './dto/variable-response.dto';
import { ParseVariableCodePipe } from './parse-variable-code.pipe';
import { VariablesService } from './variables.service';

@ApiTags(API_TAGS.variables)
@Controller('variables')
export class VariablesController {
  constructor(private readonly variablesService: VariablesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista las variables ambientales con su unidad y umbrales de alerta' })
  @ApiOkResponse({ type: [VariableResponse] })
  findAll(): Promise<VariableResponse[]> {
    return this.variablesService.findAll();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Detalle de una variable por su código' })
  @ApiParam({
    name: 'code',
    enum: VariableCode,
    enumName: 'VariableCode',
    description: 'Código de la variable (no distingue mayúsculas)',
  })
  @ApiOkResponse({ type: VariableResponse })
  @ApiBadRequestResponse({ type: BadRequestErrorDto, description: 'Código de variable inválido' })
  @ApiNotFoundResponse({ type: NotFoundErrorDto, description: 'La variable no existe' })
  findOne(@Param('code', ParseVariableCodePipe) code: VariableCode): Promise<VariableResponse> {
    return this.variablesService.findByCode(code);
  }
}
