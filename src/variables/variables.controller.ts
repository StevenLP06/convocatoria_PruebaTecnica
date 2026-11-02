import { Controller, Get, Param } from '@nestjs/common';
import { type VariableCode } from '@prisma/client';
import { ParseVariableCodePipe } from './parse-variable-code.pipe';
import { type VariableResponse } from './variables.mapper';
import { VariablesService } from './variables.service';

@Controller('variables')
export class VariablesController {
  constructor(private readonly variablesService: VariablesService) {}

  /** Lista las variables ambientales con su unidad y umbrales de alerta. */
  @Get()
  findAll(): Promise<VariableResponse[]> {
    return this.variablesService.findAll();
  }

  /** Detalle de una variable por su código (p. ej. PM25). */
  @Get(':code')
  findOne(@Param('code', ParseVariableCodePipe) code: VariableCode): Promise<VariableResponse> {
    return this.variablesService.findByCode(code);
  }
}
