import { <% if (isCode) { %>Inject, <% } %>Injectable, UnauthorizedException } from '@nestjs/common';
<% if (isCode) { %>import { ConfigService } from '@nestjs/config';
<% } %>import { JwtService } from '@nestjs/jwt';<% if (isCode) { %>
import { randomInt } from 'crypto';<% } else { %>
import * as argon2 from 'argon2';<% } %>
import { UsersService } from '../users/users.service<%= isEsm ? '.js' : '' %>';
<% if (isCode) { %>
// Register both with your app.
export const CODE_SENDER = 'CODE_SENDER';

export interface CodeSender {
  sendCode(to: string, code: string): Promise<void>;
}

// Store with TTL semantics, e.g. a redis wrapper.
export const CODE_STORE = 'CODE_STORE';

export interface CodeEntry {
  code: string;
  attempts: number;
}

export interface CodeStore {
  // ttlSeconds on creation only; omit to keep the current expiry (e.g. redis KEEPTTL)
  set(key: string, entry: CodeEntry, ttlSeconds?: number): Promise<void>;
  get(key: string): Promise<CodeEntry | null>;
  del(key: string): Promise<void>;
}
<% } %>
@Injectable()
export class <%= classify(name) %>Service {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,<% if (isCode) { %>
    private readonly configService: ConfigService,
    @Inject(CODE_SENDER) private readonly codeSender: CodeSender,
    @Inject(CODE_STORE) private readonly codeStore: CodeStore,<% } %>
  ) {}
<% if (isCode) { %>
  async requestCode(<%= identifier %>: string) {
    const ttlSeconds =
      Number(this.configService.get('CODE_TTL_MINUTES') ?? 10) * 60;
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.codeStore.set(<%= identifier %>, { code, attempts: 0 }, ttlSeconds);
    await this.codeSender.sendCode(<%= identifier %>, code);
    return { sent: true };
  }

  async loginWithCode(<%= identifier %>: string, code: string) {
    const entry = await this.codeStore.get(<%= identifier %>);
    if (!entry) {
      throw new UnauthorizedException('Invalid or expired code');
    }
    if (entry.code !== code) {
      entry.attempts += 1;
      if (entry.attempts >= 3) {
        await this.codeStore.del(<%= identifier %>);
      } else {
        await this.codeStore.set(<%= identifier %>, entry);
      }
      throw new UnauthorizedException('Invalid or expired code');
    }
    await this.codeStore.del(<%= identifier %>);
<% if (hasUserFinder) { %>    const user = await this.usersService.<%= identifier === 'email' ? 'findByEmail' : 'findByUsername' %>(<%= identifier %>);
<% } else { %>    // "<%= identifier %>" is custom: no lookup is plugged in — fetch the user
    // (with password hash) yourself, e.g.:
    // const user = await this.usersService.findBy<%= classify(identifier) %>(<%= identifier %>);
    const user: { id: string; <%= identifier %>: string } | null = null;
<% } %>    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.login({ userId: user.id.toString(), <%= identifier %>: user.<%= identifier %> });
  }
<% } else { %>  async validateUser(<%= identifier %>: string, password: string) {
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
<% } %>
  async login(user: { userId: string; <%= identifier %>: string }) {
    const payload = { sub: user.userId, <%= identifier %>: user.<%= identifier %> };
    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
