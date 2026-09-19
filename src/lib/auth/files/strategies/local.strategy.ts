import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { <%= classify(name) %>Service } from '../<%= name %>.service<%= isEsm ? '.js' : '' %>';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly <%= lowercased(name) %>Service: <%= classify(name) %>Service) {
    super({ usernameField: '<%= identifier %>' });
  }

  async validate(<%= identifier %>: string, password: string) {
    return this.<%= lowercased(name) %>Service.validateUser(<%= identifier %>, password);
  }
}
