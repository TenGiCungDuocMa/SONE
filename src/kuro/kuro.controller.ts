import { Controller } from '@nestjs/common';
import { KuroService } from './kuro.service';

@Controller('kuro')
export class KuroController {
  constructor(private readonly kuroService: KuroService) {}
}
