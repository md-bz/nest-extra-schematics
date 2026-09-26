import { <% if (isCode) { %>Body, <% } %>Controller, Get, Post, Request, UseGuards } from '@nestjs/common';<% if (isCode) { %>
import { LoginDto } from './dto/login.dto<%= isEsm ? '.js' : '' %>';
import { RequestCodeDto } from './dto/request-code.dto<%= isEsm ? '.js' : '' %>';<% } %>
import { <%= classify(name) %>Service } from './<%= name %>.service<%= isEsm ? '.js' : '' %>';
import { JwtAuthGuard } from './guards/jwt-auth.guard<%= isEsm ? '.js' : '' %>';
<% if (!isCode) { %>import { LocalAuthGuard } from './guards/local-auth.guard<%= isEsm ? '.js' : '' %>';
<% } %>
@Controller('<%= dasherize(name) %>')
export class <%= classify(name) %>Controller {
  constructor(private readonly <%= lowercased(name) %>Service: <%= classify(name) %>Service) {}
<% if (isCode) { %>
  @Post('request-code')
  requestCode(@Body() requestCodeDto: RequestCodeDto) {
    return this.<%= lowercased(name) %>Service.requestCode(requestCodeDto.<%= identifier %>);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.<%= lowercased(name) %>Service.loginWithCode(loginDto.<%= identifier %>, loginDto.code);
  }
<% } else { %>
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: Record<string, any>) {
    return this.<%= lowercased(name) %>Service.login(req.user);
  }
<% } %>
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: Record<string, any>) {
    return req.user;
  }
}
