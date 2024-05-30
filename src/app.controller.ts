import { Body, Controller, Get, Header, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { GenerateRandomeNumber, verifyRandomness } from './interfaces';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/generate')
  async GenerateRandomNumber(@Body() body: GenerateRandomeNumber): Promise<{ randomNum: any; }> {
    return await this.appService.generateRandomness(body.jobId, body.attestation);
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
