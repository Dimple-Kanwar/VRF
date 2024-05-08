import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/generate')
  async GenerateRandomNumber(): Promise<{ randomNum: any; }> {
    return await this.appService.generateRandomness();
  }

  @Get('/generate/v2')
  async GenerateRandomNumberV2(): Promise<{ randomNum: any; }> {
    return this.appService.generateRandomnessV2();
  }

  @Get('/keys')
  GenerateKey(): { publicKey: string, privateKey: string} {
    return this.appService.generateKey();
  }
}
