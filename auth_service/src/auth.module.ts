import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { JwtModule } from '@nestjs/jwt';
import { ApiKeyGuardModule } from '@guards/api_key_guard/api_key_guard.module';
import { AuthGuardModule } from '@guards/auth_guard/auth_guard.module';
import { RolesGuardModule } from '@guards/roles_guard/roles_guard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    AuthGuardModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
    }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        path: 'schema.gql',
        federation: 2,
    },
      playground: true,
      context: ({ req }) => ({ req })
    }),
    ApiKeyGuardModule,
    RolesGuardModule,
  ],
  providers: [AuthResolver, AuthService],
})
export class AuthModule {}
