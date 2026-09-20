import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service<%= isEsm ? '.js' : '' %>';

@Injectable()
export class <%= classify(name) %>Service {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(<%= identifier %>: string, password: string) {
<% if (hasUserFinder) { %>    const user = await this.usersService.<%= identifier === 'email' ? 'findByEmail' : 'findByUsername' %>(<%= identifier %>);
<% } else { %>    // "<%= identifier %>" is custom: no lookup is plugged in — fetch the user
    // (with password hash) yourself, e.g.:
    // const user = await this.usersService.findBy<%= classify(identifier) %>(<%= identifier %>);
    const user: { id: string; <%= identifier %>: string; password: string } | null = null;
<% } %>    if (!user || !(await argon2.verify(user.password, password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return { userId: user.id.toString(), <%= identifier %>: user.<%= identifier %> };
  }

  async login(user: { userId: string; <%= identifier %>: string }) {
    const payload = { sub: user.userId, <%= identifier %>: user.<%= identifier %> };
    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
