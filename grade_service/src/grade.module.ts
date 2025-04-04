import { Module } from '@nestjs/common';
import { GradeService } from './grade.service';
import { GradeResolver } from './grade.resolver';
import { Grade } from './entities/grade.entity';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ApiKeyGuardModule } from '@guards/api_key_guard/api_key_guard.module';
import { RolesGuardModule } from '@guards/roles_guard/roles_guard.module';
import { AuthGuardModule } from '@guards/auth_guard/auth_guard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
          driver: ApolloFederationDriver,
          autoSchemaFile: {
            path: 'schema.gql',
            federation: 2,
        },
          playground: true,
          context: ({ req }) => ({ req })
        }),
    TypeOrmModule.forFeature([Grade]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'mariadb',
        host: configService.get<string>("DB_HOST"),
        port: configService.get<number>("DB_PORT"),
        username: configService.get<string>("DB_USERNAME"),
        password: configService.get<string>("DB_PASSWORD"),
        database: configService.get<string>("DB_NAME"),
        entities: [Grade],
        synchronize: true,
      }),
    }),
    ApiKeyGuardModule,
    RolesGuardModule,
    AuthGuardModule,],
  providers: [GradeResolver, GradeService],
})
export class GradeModule {}
