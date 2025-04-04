import { Module } from '@nestjs/common';
import { AuthGuardService } from './auth_guard.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],

  providers: [AuthGuardService],
  exports: [AuthGuardService],
})
export class AuthGuardModule {}
