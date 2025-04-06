// app.module.ts
import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import { IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';

const logger = new Logger('ApolloGateway');

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,
      gateway: {
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: [
            { name: 'auth', url: 'http://auth-service:4001/graphql' },
            { name: 'user', url: 'http://user-service:4002/graphql' },
            { name: 'grade', url: 'http://grade-service:4003/graphql' },
            { name: 'class', url: 'http://class-service:4004/graphql' },
          ],
        }),
        buildService({ url }) {
          return new RemoteGraphQLDataSource({
            url,
            willSendRequest({ request, context }) {
              const headers = request.http?.headers;
              const apiKey = process.env.API_KEY_ACTIVE ?? process.env.API_KEY_OLD;
              const authToken = context.req?.headers?.authorization;

              headers?.set('x-api-key', apiKey || '');
              authToken
                ? headers?.set('authorization', authToken)
                : logger.warn(`⚠️ No Authorization header found`);
            },
          });
        },
      },
    }),
  ],
})
export class AppModule {}
