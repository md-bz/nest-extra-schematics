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

  create(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input: Create<%= singular(classify(name)) %>Input<% } %>) {
    const created<%= singular(classify(name)) %> = new this.<%= lowercased(singular(classify(name))) %>Model(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input<% } %>);
    return created<%= singular(classify(name)) %>.save();
  }

  findAll() {
    return this.<%= lowercased(singular(classify(name))) %>Model.find().exec();
  }

  findOne(id: string) {
    return this.<%= lowercased(singular(classify(name))) %>Model.findById(id).exec();
  }

  update(id: string, <% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input: Update<%= singular(classify(name)) %>Input<% } %>) {
    return this.<%= lowercased(singular(classify(name))) %>Model.findByIdAndUpdate(id, <% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input<% } %>, { returnDocument: 'after' }).exec();
  }

  remove(id: string) {
    return this.<%= lowercased(singular(classify(name))) %>Model.findByIdAndDelete(id).exec();
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

  create(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input: Create<%= singular(classify(name)) %>Input<% } %>) {
    return this.<%= lowercased(singular(classify(name))) %>Repository.save(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input<% } %>);
  }

  findAll() {
    return this.<%= lowercased(singular(classify(name))) %>Repository.find();
  }

  findOne(id: string) {
    return this.<%= lowercased(singular(classify(name))) %>Repository.findOneBy({ id: new ObjectId(id) });
  }

  async update(id: string, <% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input: Update<%= singular(classify(name)) %>Input<% } %>) {
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
    return updated<%= singular(classify(name)) %>;
  }

  async remove(id: string) {
    const removed<%= singular(classify(name)) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOneAndDelete({ _id: new ObjectId(id) });
    if (!removed<%= singular(classify(name)) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return removed<%= singular(classify(name)) %>;
  }
}
<% } else { %>import { Injectable } from '@nestjs/common';<% if (crud && type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';<% } else if (crud) { %>
import { Create<%= singular(classify(name)) %>Input } from './dto/create-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Input } from './dto/update-<%= singular(name) %>.input<%= isEsm ? '.js' : '' %>';<% } %>

@Injectable()
export class <%= classify(name) %>Service {<% if (crud) { %>
  create(<% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto<% } else { %>create<%= singular(classify(name)) %>Input: Create<%= singular(classify(name)) %>Input<% } %>) {
    return 'This action adds a new <%= lowercased(singular(classify(name))) %>';
  }

  findAll() {
    return `This action returns all <%= lowercased(classify(name)) %>`;
  }

  findOne(id: number) {
    return `This action returns a #${id} <%= lowercased(singular(classify(name))) %>`;
  }

  update(id: number, <% if (type !== 'graphql-code-first' && type !== 'graphql-schema-first') { %>update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto<% } else { %>update<%= singular(classify(name)) %>Input: Update<%= singular(classify(name)) %>Input<% } %>) {
    return `This action updates a #${id} <%= lowercased(singular(classify(name))) %>`;
  }

  remove(id: number) {
    return `This action removes a #${id} <%= lowercased(singular(classify(name))) %>`;
  }
<% } %>}
<% } %>