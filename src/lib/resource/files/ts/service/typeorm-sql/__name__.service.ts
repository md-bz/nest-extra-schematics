import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';<% } else { %>
import { Create<%= singular(classify(name)) %>Input } from './dto/create-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Input } from './dto/update-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';<% } %>
import { <%= singular(classify(name)) %> } from './entities/<%= singular(name) %>.entity<%= isEsm ? '.js' : '' %>';

<%= duplicateKeyGuard %>

@Injectable()
export class <%= classify(name) %>Service {
  constructor(@InjectRepository(<%= singular(classify(name)) %>) private <%= lowercased(singular(classify(name))) %>Repository: Repository<<%= singular(classify(name)) %>>) {}

  async create(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input: Create<%= singular(classify(name)) %>Input<% } %>): <%= returnOneType %> {
    try {
      return await this.<%= lowercased(singular(classify(name))) %>Repository.save(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input<% } %>);
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Value already exists');
      }
      throw err;
    }
  }

  findAll(): <%= returnListType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.find();
  }

  async findOne(id: number): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOneBy({ id });
    if (!<%= lowercased(singular(classify(name))) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return <%= lowercased(singular(classify(name))) %>;
  }

  async update(id: number, <% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input: Update<%= singular(classify(name)) %>Input<% } %>): <%= returnOneType %> {
    try {
      const <%= lowercased(singular(classify(name))) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.preload({
        id,
        ...<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input<% } %>,
      });
      if (!<%= lowercased(singular(classify(name))) %>) {
        throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
      }
      return await this.<%= lowercased(singular(classify(name))) %>Repository.save(<%= lowercased(singular(classify(name))) %>);
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Value already exists');
      }
      throw err;
    }
  }

  async remove(id: number): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.findOne(id);
    return this.<%= lowercased(singular(classify(name))) %>Repository.remove(<%= lowercased(singular(classify(name))) %>);
  }
}
