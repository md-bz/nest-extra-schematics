import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/<%= mikroOrmDriver %>';
import * as argon2 from 'argon2';
import { ChangePasswordDto } from './dto/change-password.dto<%= isEsm ? '.js' : '' %>';
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { <%= singular(classify(name)) %> } from './entities/<%= singular(name) %>.entity<%= isEsm ? '.js' : '' %>';<% if (mikroOrmMongo) { %>
import { ObjectId } from 'mongodb';
<% } %>

function isDuplicateKey(err: unknown): boolean {
  const e = err as { code?: string | number; driverError?: { code?: string | number }; cause?: { code?: string | number } };
  const code = e?.cause?.code ?? e?.driverError?.code ?? e?.code;
  return code === '23505' || code === 'ER_DUP_ENTRY' || code === 11000 || String(code).startsWith('SQLITE_CONSTRAINT');
}

@Injectable()
export class <%= classify(name) %>Service {
  constructor(
    @InjectRepository(<%= singular(classify(name)) %>) private readonly <%= lowercased(singular(classify(name))) %>Repository: EntityRepository<<%= singular(classify(name)) %>>,
    private readonly em: EntityManager,
  ) {}

  async create(create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto): <%= returnOneType %> {
    try {
      const <%= lowercased(singular(classify(name))) %> = this.<%= lowercased(singular(classify(name))) %>Repository.create({
        ...create<%= singular(classify(name)) %>Dto,
        password: await argon2.hash(create<%= singular(classify(name)) %>Dto.password),
      });
      await this.em.flush();
      return <%= lowercased(singular(classify(name))) %>;
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Username or email already exists');
      }
      throw err;
    }
  }

  findAll(): <%= returnListType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.findAll();
  }

  async findOne(id: <% if (mikroOrmMongo || isStringId) { %>string<% } else { %>number<% } %>): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOne(<% if (mikroOrmMongo) { %>{ _id: new ObjectId(id) }<% } else { %>{ id }<% } %>);
    if (!<%= lowercased(singular(classify(name))) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return <%= lowercased(singular(classify(name))) %>;
  }

  findByEmail(email: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.findOne({ email });
  }

  findByUsername(username: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.findOne({ username });
  }

  async update(id: <% if (mikroOrmMongo || isStringId) { %>string<% } else { %>number<% } %>, update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto): <%= returnOneType %> {
    try {
      const <%= lowercased(singular(classify(name))) %> = await this.findOne(id);
      this.em.assign(<%= lowercased(singular(classify(name))) %>, update<%= singular(classify(name)) %>Dto);
      await this.em.flush();
      return <%= lowercased(singular(classify(name))) %>;
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Username or email already exists');
      }
      throw err;
    }
  }

  async changePassword(id: <% if (isStringId) { %>string<% } else { %>number<% } %>, changePasswordDto: ChangePasswordDto): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.findOne(id);
    const isCurrentPasswordValid = await argon2.verify(
      <%= lowercased(singular(classify(name))) %>.password,
      changePasswordDto.currentPassword,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    <%= lowercased(singular(classify(name))) %>.password = await argon2.hash(changePasswordDto.password);
    await this.em.flush();
    return <%= lowercased(singular(classify(name))) %>;
  }

  async remove(id: <% if (mikroOrmMongo || isStringId) { %>string<% } else { %>number<% } %>): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.findOne(id);
    await this.em.remove(<%= lowercased(singular(classify(name))) %>).flush();
    return <%= lowercased(singular(classify(name))) %>;
  }
}
