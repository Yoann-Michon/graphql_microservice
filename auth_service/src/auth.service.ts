import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { log } from 'console';
import fetch from 'node-fetch';

@Injectable()
export class AuthService {

  constructor(private jwtService: JwtService) { }

  async register(email: string, password: string, firstname: string, lastname: string) {
    const response = await fetch(`${process.env.USER_SERVICE_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY_ACTIVE! || process.env.API_KEY_OLD!,
      },
      body: JSON.stringify({
        query: `
           mutation CreateUser($createUserInput: CreateUserInput!) {
          createUser(createUserInput: $createUserInput) {
            id
            email
            role
            pseudo
          }
        }
        `,
        variables: {
          createUserInput: { email, password, firstname, lastname }
        }
      }),
    });

    const { data, errors } = await response.json();
    if (errors || !data?.createUser) {
      throw new Error('User registration failed');
    }

    const user = data.createUser;
    return this.generateToken(user);
  }


  async login(email: string, password: string) {
    const response = await fetch(`${process.env.USER_SERVICE_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY_ACTIVE! || process.env.API_KEY_OLD!,
      },
      body: JSON.stringify({
        query: `
          mutation VerifyPassword($email: String!, $password: String!) {
            verifyPassword(email: $email, password: $password) {
              id
              email
              role
              pseudo
            }
          }
        `,
        variables: { email, password },
      }),
    });

    const { data, errors } = await response.json();
    log("data: ", data, errors);
    if (errors || !data?.verifyPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = data.verifyPassword;
    return this.generateToken(user);
  }


  private generateToken(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role, pseudo: user.pseudo };
    const token = this.jwtService.sign(payload)
    return { token };
  }
}
