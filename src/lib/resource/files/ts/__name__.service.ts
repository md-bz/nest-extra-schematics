<% if (isMongoose && crud) { %>import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';<% } else { %>
import { Create<%= singular(classify(name)) %>Input } from './dto/create-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Input } from './dto/update-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';<% } %>
import { <%= singular(classify(name)) %>, <%= singular(classify(name)) %>Document } from './schemas/<%= singular(name) %>.schema<%= isEsm ? '.js' : '' %>';

@Injectable()
export class <%= classify(name) %>Service {
  constructor(@InjectModel(<%= singular(classify(name)) %>.name) private <%= lowercased(singular(classify(name))) %>Model: Model<<%= singular(classify(name)) %>Document>) {}

  create(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input: Create<%= singular(classify(name)) %>Input<% } %>): <%= returnOneType %> {
    const created<%= singular(classify(name)) %> = new this.<%= lowercased(singular(classify(name))) %>Model(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input<% } %>);
    return created<%= singular(classify(name)) %>.save();
  }

  findAll(): <%= returnListType %> {
    return this.<%= lowercased(singular(classify(name))) %>Model.find().exec();
  }

  findOne(id: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Model.findById(id).exec();
  }

  update(id: string, <% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input: Update<%= singular(classify(name)) %>Input<% } %>): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Model.findByIdAndUpdate(id, <% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input<% } %>, { returnDocument: 'after' }).exec();
  }

  remove(id: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Model.findByIdAndDelete(id).exec();
  }
}
<% } else if (isTypeOrm && db !== 'mongodb' && crud) { %>import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';<% } else { %>
import { Create<%= singular(classify(name)) %>Input } from './dto/create-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Input } from './dto/update-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';<% } %>
import { <%= singular(classify(name)) %> } from './entities/<%= singular(name) %>.entity<%= isEsm ? '.js' : '' %>';

@Injectable()
export class <%= classify(name) %>Service {
  constructor(@InjectRepository(<%= singular(classify(name)) %>) private <%= lowercased(singular(classify(name))) %>Repository: Repository<<%= singular(classify(name)) %>>) {}

  create(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input: Create<%= singular(classify(name)) %>Input<% } %>): <%= returnOneType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.save(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input<% } %>);
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
    const <%= lowercased(singular(classify(name))) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.preload({
      id,
      ...<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input<% } %>,
    });
    if (!<%= lowercased(singular(classify(name))) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return this.<%= lowercased(singular(classify(name))) %>Repository.save(<%= lowercased(singular(classify(name))) %>);
  }

  async remove(id: number): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.findOne(id);
    return this.<%= lowercased(singular(classify(name))) %>Repository.remove(<%= lowercased(singular(classify(name))) %>);
  }
}
<% } else if (isTypeOrm && crud) { %>import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';<% } else { %>
import { Create<%= singular(classify(name)) %>Input } from './dto/create-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Input } from './dto/update-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';<% } %>
import { <%= singular(classify(name)) %> } from './entities/<%= singular(name) %>.entity<%= isEsm ? '.js' : '' %>';

@Injectable()
export class <%= classify(name) %>Service {
  constructor(@InjectRepository(<%= singular(classify(name)) %>) private <%= lowercased(singular(classify(name))) %>Repository: MongoRepository<<%= singular(classify(name)) %>>) {}

  create(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input: Create<%= singular(classify(name)) %>Input<% } %>): <%= returnOneType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.save(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input<% } %>);
  }

  findAll(): <%= returnListType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.find();
  }

  findOne(id: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.findOneBy({ id: new ObjectId(id) });
  }

  async update(id: string, <% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input: Update<%= singular(classify(name)) %>Input<% } %>): <%= returnOneType %> {
<% if (type === 'rest') { %>    const updated<%= singular(classify(name)) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update<%= singular(classify(name)) %>Dto },
      { returnDocument: 'after' },
    );
<% } else { %>    const { id: _id, ...update } = <% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input<% } %>;
    const updated<%= singular(classify(name)) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' },
    );
<% } %>    if (!updated<%= singular(classify(name)) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return updated<%= singular(classify(name)) %> as <%= entityType %>;
  }

  async remove(id: string): <%= returnOneType %> {
    const removed<%= singular(classify(name)) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOneAndDelete({ _id: new ObjectId(id) });
    if (!removed<%= singular(classify(name)) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return removed<%= singular(classify(name)) %> as <%= entityType %>;
  }
}
<% } else { %>import { Injectable } from '@nestjs/common';<% if (crud && type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';<% } else if (crud) { %>
import { Create<%= singular(classify(name)) %>Input } from './dto/create-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Input } from './dto/update-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';<% } %>

@Injectable()
export class <%= classify(name) %>Service {<% if (crud) { %>
  create(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input: Create<%= singular(classify(name)) %>Input<% } %>): <%= returnOneType %> {
    return 'This action adds a new <%= lowercased(singular(classify(name))) %>';
  }

  findAll(): <%= returnListType %> {
    return `This action returns all <%= lowercased(classify(name)) %>`;
  }

  findOne(id: number): <%= returnNullableType %> {
    return `This action returns a #${id} <%= lowercased(singular(classify(name))) %>`;
  }

  update(id: number, <% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input: Update<%= singular(classify(name)) %>Input<% } %>): <%= returnNullableType %> {
    return `This action updates a #${id} <%= lowercased(singular(classify(name))) %>`;
  }

  remove(id: number): <%= returnNullableType %> {
    return `This action removes a #${id} <%= lowercased(singular(classify(name))) %>`;
  }
<% } %>}
<% } %>