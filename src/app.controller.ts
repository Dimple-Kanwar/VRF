import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { verifyRandomness } from './interfaces';

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

  @Get('/keys')
  GenerateKey(): { publicKey: string, privateKey: string} {
    return this.appService.generateKey();
  }

  @Get('/verify')
  async verify(input:verifyRandomness) {
    return this.appService.verify(input);
  }
}
