import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { <%= drizzleDbType %> } from 'drizzle-orm/<%= drizzleEntry %>';
import * as argon2 from 'argon2';
import { ChangePasswordDto } from './dto/change-password.dto<%= isEsm ? '.js' : '' %>';
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { <%= plural(lowercased(name)) %>, type <%= entityType %> } from './schemas/<%= singular(name) %>.schema<%= isEsm ? '.js' : '' %>';

const publicUserColumns = {
  id: <%= plural(lowercased(name)) %>.id,
  username: <%= plural(lowercased(name)) %>.username,
  email: <%= plural(lowercased(name)) %>.email,
  firstName: <%= plural(lowercased(name)) %>.firstName,
  lastName: <%= plural(lowercased(name)) %>.lastName,
  phoneNumber: <%= plural(lowercased(name)) %>.phoneNumber,
};

function isDuplicateKey(err: unknown): boolean {
  const e = err as { code?: string; driverError?: { code?: string }; cause?: { code?: string } };
  const code = e?.cause?.code ?? e?.driverError?.code ?? e?.code;
  return code === '23505' || code === 'ER_DUP_ENTRY' || String(code).startsWith('SQLITE_CONSTRAINT');
}

@Injectable()
export class <%= classify(name) %>Service {
  constructor(@InjectDrizzle() private readonly db: <%= drizzleDbType %>) {}

  async create(create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto): <%= returnOneType %> {
    try {
<% if (db === 'mysql') { %>      const [inserted] = await this.db.insert(<%= plural(lowercased(name)) %>).values({
        ...create<%= singular(classify(name)) %>Dto,
        password: await argon2.hash(create<%= singular(classify(name)) %>Dto.password),
      }).$returningId();
      const [created<%= singular(classify(name)) %>] = await this.db.select().from(<%= plural(lowercased(name)) %>).where(eq(<%= plural(lowercased(name)) %>.id, inserted.id));
      return created<%= singular(classify(name)) %>;
<% } else { %>      const [created<%= singular(classify(name)) %>] = await this.db.insert(<%= plural(lowercased(name)) %>).values({
        ...create<%= singular(classify(name)) %>Dto,
        password: await argon2.hash(create<%= singular(classify(name)) %>Dto.password),
      }).returning();
      return created<%= singular(classify(name)) %>;
<% } %>    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Username or email already exists');
      }
      throw err;
    }
  }

  async findAll(): <%= returnListType %> {
    const rows = await this.db.select(publicUserColumns).from(<%= plural(lowercased(name)) %>);
    return rows as <%= entityType %>[];
  }

  async findOne(id: number): <%= returnOneType %> {
    const [<%= lowercased(singular(classify(name))) %>] = await this.db.select(publicUserColumns).from(<%= plural(lowercased(name)) %>).where(eq(<%= plural(lowercased(name)) %>.id, id));
    if (!<%= lowercased(singular(classify(name))) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return <%= lowercased(singular(classify(name))) %> as <%= entityType %>;
  }

  async findByEmail(email: string): <%= returnNullableType %> {
    const [<%= lowercased(singular(classify(name))) %>] = await this.db.select().from(<%= plural(lowercased(name)) %>).where(eq(<%= plural(lowercased(name)) %>.email, email));
    return <%= lowercased(singular(classify(name))) %> ?? null;
  }

  async findByUsername(username: string): <%= returnNullableType %> {
    const [<%= lowercased(singular(classify(name))) %>] = await this.db.select().from(<%= plural(lowercased(name)) %>).where(eq(<%= plural(lowercased(name)) %>.username, username));
    return <%= lowercased(singular(classify(name))) %> ?? null;
  }

  async update(id: number, update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto): <%= returnOneType %> {
    try {
      const [<%= lowercased(singular(classify(name))) %>] = await this.db.select(publicUserColumns).from(<%= plural(lowercased(name)) %>).where(eq(<%= plural(lowercased(name)) %>.id, id));
      if (!<%= lowercased(singular(classify(name))) %>) {
        throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
      }
      await this.db.update(<%= plural(lowercased(name)) %>).set(update<%= singular(classify(name)) %>Dto).where(eq(<%= plural(lowercased(name)) %>.id, id));
      return { ...<%= lowercased(singular(classify(name))) %>, ...update<%= singular(classify(name)) %>Dto } as <%= entityType %>;
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Username or email already exists');
      }
      throw err;
    }
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto): <%= returnOneType %> {
    const [<%= lowercased(singular(classify(name))) %>] = await this.db.select().from(<%= plural(lowercased(name)) %>).where(eq(<%= plural(lowercased(name)) %>.id, id));
    if (!<%= lowercased(singular(classify(name))) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    const isCurrentPasswordValid = await argon2.verify(
      <%= lowercased(singular(classify(name))) %>.password,
      changePasswordDto.currentPassword,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const password = await argon2.hash(changePasswordDto.password);
    await this.db.update(<%= plural(lowercased(name)) %>).set({ password }).where(eq(<%= plural(lowercased(name)) %>.id, id));
    return { ...<%= lowercased(singular(classify(name))) %>, password };
  }

  async remove(id: number): <%= returnOneType %> {
    const [<%= lowercased(singular(classify(name))) %>] = await this.db.select(publicUserColumns).from(<%= plural(lowercased(name)) %>).where(eq(<%= plural(lowercased(name)) %>.id, id));
    if (!<%= lowercased(singular(classify(name))) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    await this.db.delete(<%= plural(lowercased(name)) %>).where(eq(<%= plural(lowercased(name)) %>.id, id));
    return <%= lowercased(singular(classify(name))) %> as <%= entityType %>;
  }
}
