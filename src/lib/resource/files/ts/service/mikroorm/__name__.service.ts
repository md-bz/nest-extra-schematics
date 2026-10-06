import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/<%= mikroOrmDriver %>';<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';<% } else { %>
import { Create<%= singular(classify(name)) %>Input } from './dto/create-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Input } from './dto/update-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';<% } %>
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

  async create(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input: Create<%= singular(classify(name)) %>Input<% } %>): <%= returnOneType %> {
    try {
      const <%= lowercased(singular(classify(name))) %> = this.<%= lowercased(singular(classify(name))) %>Repository.create(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input<% } %>);
      await this.em.flush();
      return <%= lowercased(singular(classify(name))) %>;
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Value already exists');
      }
      throw err;
    }
  }

  findAll(): <%= returnListType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.findAll();
  }

  async findOne(id: <% if (mikroOrmMongo) { %>string<% } else if (isStringId) { %>string<% } else { %>number<% } %>): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOne(<% if (mikroOrmMongo) { %>{ _id: new ObjectId(id) }<% } else { %>{ id }<% } %>);
    if (!<%= lowercased(singular(classify(name))) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return <%= lowercased(singular(classify(name))) %>;
  }

  async update(id: <% if (mikroOrmMongo || isStringId) { %>string<% } else { %>number<% } %>, <% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input: Update<%= singular(classify(name)) %>Input<% } %>): <%= returnOneType %> {
    try {
      const <%= lowercased(singular(classify(name))) %> = await this.findOne(id);
      this.em.assign(<%= lowercased(singular(classify(name))) %>, <% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input<% } %>);
      await this.em.flush();
      return <%= lowercased(singular(classify(name))) %>;
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Value already exists');
      }
      throw err;
    }
  }

  async remove(id: <% if (mikroOrmMongo || isStringId) { %>string<% } else { %>number<% } %>): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.findOne(id);
    await this.em.remove(<%= lowercased(singular(classify(name))) %>).flush();
    return <%= lowercased(singular(classify(name))) %>;
  }
}
