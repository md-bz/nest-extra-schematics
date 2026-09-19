import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { <%= classify(name) %>Service } from './<%= name %>.service<%= isEsm ? '.js' : '' %>';
import { JwtAuthGuard } from './guards/jwt-auth.guard<%= isEsm ? '.js' : '' %>';
import { LocalAuthGuard } from './guards/local-auth.guard<%= isEsm ? '.js' : '' %>';

@Controller('<%= dasherize(name) %>')
export class <%= classify(name) %>Controller {
  constructor(private readonly <%= lowercased(name) %>Service: <%= classify(name) %>Service) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: Record<string, any>) {
    return this.<%= lowercased(name) %>Service.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: Record<string, any>) {
    return req.user;
  }
}
