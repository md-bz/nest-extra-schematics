import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module<%= isEsm ? '.js' : '' %>';
import { <%= classify(name) %>Controller } from './<%= name %>.controller<%= isEsm ? '.js' : '' %>';
import { <%= classify(name) %>Service } from './<%= name %>.service<%= isEsm ? '.js' : '' %>';
import { JwtStrategy } from './strategies/jwt.strategy<%= isEsm ? '.js' : '' %>';
import { LocalStrategy } from './strategies/local.strategy<%= isEsm ? '.js' : '' %>';

// The app must boot ConfigModule (forRoot, ideally global) and set JWT_SECRET
// and optionally JWT_EXPIRES_IN, otherwise the JWT setup below throws on startup.
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // JWT_EXPIRES_IN takes ms-style strings ("3600s", "1h"); the env
          // read is a plain string, so narrow it to what jsonwebtoken accepts.
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ?? '3600s') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [<%= classify(name) %>Controller],
  providers: [<%= classify(name) %>Service, LocalStrategy, JwtStrategy],
})
export class <%= classify(name) %>Module {}
