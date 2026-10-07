import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { <%= drizzleDbType %> } from 'drizzle-orm/<%= drizzleEntry %>';<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';<% } else { %>
import { Create<%= singular(classify(name)) %>Input } from './dto/create-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Input } from './dto/update-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';<% } %>
import { <%= plural(lowercased(name)) %>, type <%= entityType %> } from './schemas/<%= singular(name) %>.schema<%= isEsm ? '.js' : '' %>';

<%= duplicateKeyGuard %>

@Injectable()
export class <%= classify(name) %>Service {
  constructor(@InjectDrizzle() private readonly db: <%= drizzleDbType %>) {}

  async create(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input: Create<%= singular(classify(name)) %>Input<% } %>): <%= returnOneType %> {
    try {
<% if (db === 'mysql') { %>      const [inserted] = await this.db.insert(<%= plural(lowercased(name)) %>).values(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input<% } %>).
        $returningId();
      const [created<%= singular(classify(name)) %>] = await this.db.select().from(<%= plural(lowercased(name)) %>).where(eq(<%= plural(lowercased(name)) %>.id, inserted.id));
      return created<%= singular(classify(name)) %>;
<% } else { %>      const [created<%= singular(classify(name)) %>] = await this.db.insert(<%= plural(lowercased(name)) %>).values(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input<% } %>).returning();
      return created<%= singular(classify(name)) %>;
<% } %>    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Value already exists');
      }
      throw err;
    }
  }

  findAll(): <%= returnListType %> {
    return this.db.select().from(<%= plural(lowercased(name)) %>);
  }

  async findOne(id: number): <%= returnOneType %> {
    const [<%= lowercased(singular(classify(name))) %>] = await this.db.select().from(<%= plural(lowercased(name)) %>).where(eq(<%= plural(lowercased(name)) %>.id, id));
    if (!<%= lowercased(singular(classify(name))) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return <%= lowercased(singular(classify(name))) %>;
  }

  async update(id: number, <% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input: Update<%= singular(classify(name)) %>Input<% } %>): <%= returnOneType %> {
    try {
      const [<%= lowercased(singular(classify(name))) %>] = await this.db.select().from(<%= plural(lowercased(name)) %>).where(eq(<%= plural(lowercased(name)) %>.id, id));
      if (!<%= lowercased(singular(classify(name))) %>) {
        throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
      }
      await this.db.update(<%= plural(lowercased(name)) %>).set(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input<% } %>).where(eq(<%= plural(lowercased(name)) %>.id, id));
      return { ...<%= lowercased(singular(classify(name))) %>, ...<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input<% } %> };
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Value already exists');
      }
      throw err;
    }
  }

  async remove(id: number): <%= returnOneType %> {
    const [<%= lowercased(singular(classify(name))) %>] = await this.db.select().from(<%= plural(lowercased(name)) %>).where(eq(<%= plural(lowercased(name)) %>.id, id));
    if (!<%= lowercased(singular(classify(name))) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    await this.db.delete(<%= plural(lowercased(name)) %>).where(eq(<%= plural(lowercased(name)) %>.id, id));
    return <%= lowercased(singular(classify(name))) %>;
  }
}
