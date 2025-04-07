import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: AuthService;

  const mockToken = 'mocked.jwt.token';

  const mockAuthService = {
    register: jest.fn().mockImplementation(
      (email: string, password: string, firstname: string, lastname: string) => {
        return { token: mockToken };
      }
    ),
    login: jest.fn().mockImplementation(
      (email: string, password: string) => {
        return { token: mockToken };
      }
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('register', () => {
    it('should return a token after successful registration', async () => {
      const result = await resolver.register(
        'test@example.com',
        'Password123!',
        'John',
        'Doe'
      );

      expect(result).toEqual({ token: mockToken });
      expect(authService.register).toHaveBeenCalledWith(
        'test@example.com',
        'Password123!',
        'John',
        'Doe'
      );
    });
  });

  describe('login', () => {
    it('should return a token after successful login', async () => {
      const result = await resolver.login('test@example.com', 'Password123!');

      expect(result).toEqual({ token: mockToken });
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'Password123!');
    });

    it('should throw an error if login fails', async () => {
        jest.spyOn(authService, 'login').mockRejectedValueOnce(new Error('Invalid credentials'));
      
        await expect(resolver.login('wrong@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
      });
      
  });
});
