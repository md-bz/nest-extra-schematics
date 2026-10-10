import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';<% } else { %>
import { Create<%= singular(classify(name)) %>Input } from './dto/create-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Input } from './dto/update-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';<% } %>
import { <%= singular(classify(name)) %> } from './entities/<%= singular(name) %>.entity<%= isEsm ? '.js' : '' %>';

<%= duplicateKeyGuard %>

@Injectable()
export class <%= classify(name) %>Service {
  constructor(@InjectModel(<%= singular(classify(name)) %>) private readonly <%= lowercased(singular(classify(name))) %>Model: typeof <%= singular(classify(name)) %>) {}

  async create(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input: Create<%= singular(classify(name)) %>Input<% } %>): <%= returnOneType %> {
    try {
      return await this.<%= lowercased(singular(classify(name))) %>Model.create(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input<% } %> as <%= singular(classify(name)) %>);
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Value already exists');
      }
      throw err;
    }
  }

  findAll(): <%= returnListType %> {
    return this.<%= lowercased(singular(classify(name))) %>Model.findAll();
  }

  async findOne(id: number): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.<%= lowercased(singular(classify(name))) %>Model.findByPk(id);
    if (!<%= lowercased(singular(classify(name))) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return <%= lowercased(singular(classify(name))) %>;
  }

  async update(id: number, <% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input: Update<%= singular(classify(name)) %>Input<% } %>): <%= returnOneType %> {
    try {
      const [affected, instances] = await this.<%= lowercased(singular(classify(name))) %>Model.update(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input<% } %> as <%= singular(classify(name)) %>, { where: { id }, returning: true });
      if (!affected) {
        throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
      }
      return instances[0];
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Value already exists');
      }
      throw err;
    }
  }

  async remove(id: number): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.findOne(id);
    await <%= lowercased(singular(classify(name))) %>.destroy();
    return <%= lowercased(singular(classify(name))) %>;
  }
}
