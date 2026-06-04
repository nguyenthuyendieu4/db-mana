import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { InstancesService } from './instances.service';
import { CreateInstanceDto, InstanceActionDto } from './instances.types';

@Controller('api/instances')
export class InstancesController {
  constructor(private readonly instancesService: InstancesService) {}

  @Get()
  list() {
    return this.instancesService.list();
  }

  @Post()
  create(@Body() dto: CreateInstanceDto) {
    return this.instancesService.create(dto);
  }

  @Get(':id/compose')
  compose(@Param('id') id: string) {
    return this.instancesService.getComposePreview(id);
  }

  @Post(':id/actions')
  action(@Param('id') id: string, @Body() dto: InstanceActionDto) {
    return this.instancesService.act(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    this.instancesService.delete(id);
    return { success: true };
  }
}
