import { Injectable, NotFoundException } from '@nestjs/common';
import { type VariableCode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { type VariableResponse } from './dto/variable-response.dto';
import { toVariableResponse } from './variables.mapper';

@Injectable()
export class VariablesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<VariableResponse[]> {
    const variables = await this.prisma.variable.findMany({ orderBy: { id: 'asc' } });
    return variables.map(toVariableResponse);
  }

  async findByCode(code: VariableCode): Promise<VariableResponse> {
    const variable = await this.prisma.variable.findUnique({ where: { code } });

    if (!variable) {
      throw new NotFoundException(`No existe la variable ${code}`);
    }

    return toVariableResponse(variable);
  }
}
