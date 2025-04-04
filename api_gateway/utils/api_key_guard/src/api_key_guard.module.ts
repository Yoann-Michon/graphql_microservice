import { Module } from '@nestjs/common';
import { ApiKeyGuardService } from './api_key_guard.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [ApiKeyGuardService],
  exports: [ApiKeyGuardService],
})
export class ApiKeyGuardModule {}
