<% if (isCode) { %>import { ConfigService } from '@nestjs/config';
<% } %>import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service<%= isEsm ? '.js' : '' %>';
import { <%= isCode ? 'CODE_SENDER, CODE_STORE, ' : '' %><%= classify(name) %>Service } from './<%= name %>.service<%= isEsm ? '.js' : '' %>';

describe('<%= classify(name) %>Service', () => {
  let service: <%= classify(name) %>Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        <%= classify(name) %>Service,
        { provide: UsersService, useValue: {} },
        { provide: JwtService, useValue: {} },<% if (isCode) { %>
        { provide: ConfigService, useValue: { get: () => undefined } },
        { provide: CODE_SENDER, useValue: { sendCode: async () => {} } },
        { provide: CODE_STORE, useValue: { set: async () => {}, get: async () => null, del: async () => {} } },<% } %>
      ],
    }).compile();

    service = module.get<<%= classify(name) %>Service>(<%= classify(name) %>Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
