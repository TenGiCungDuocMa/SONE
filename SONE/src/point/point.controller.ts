import { Controller, Get, Logger } from '@nestjs/common';
import { PointService } from './point.service';

@Controller('point')
export class PointController {
  private readonly logger = new Logger(PointController.name);
  constructor(private readonly pointService: PointService ) {}

  @Get("get-point-decrease")
  async getPointDecrease(){
    return this.pointService.getUsersSortedByPointsDesc();
  }
}
