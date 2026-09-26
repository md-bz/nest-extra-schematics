<% if (isTypeOrm && db !== 'mongodb') { %>import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { ChangePasswordDto } from './dto/change-password.dto<%= isEsm ? '.js' : '' %>';
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { <%= singular(classify(name)) %> } from './entities/<%= singular(name) %>.entity<%= isEsm ? '.js' : '' %>';

@Injectable()
export class <%= classify(name) %>Service {
  constructor(@InjectRepository(<%= singular(classify(name)) %>) private <%= lowercased(singular(classify(name))) %>Repository: Repository<<%= singular(classify(name)) %>>) {}

  create(create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto): <%= returnOneType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.save(this.<%= lowercased(singular(classify(name))) %>Repository.create(create<%= singular(classify(name)) %>Dto));
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

  findByEmail(email: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.findOne({
      where: { email },
      select: { id: true, username: true, email: true, firstName: true, lastName: true, phoneNumber: true, password: true },
    });
  }

  findByUsername(username: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.findOne({
      where: { username },
      select: { id: true, username: true, email: true, firstName: true, lastName: true, phoneNumber: true, password: true },
    });
  }

  async update(id: number, update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.preload({ id, ...update<%= singular(classify(name)) %>Dto });
    if (!<%= lowercased(singular(classify(name))) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return this.<%= lowercased(singular(classify(name))) %>Repository.save(<%= lowercased(singular(classify(name))) %>);
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOne({
      where: { id },
      select: { id: true, username: true, email: true, firstName: true, lastName: true, phoneNumber: true, password: true },
    });
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
    <%= lowercased(singular(classify(name))) %>.password = await argon2.hash(changePasswordDto.password);
    return this.<%= lowercased(singular(classify(name))) %>Repository.save(<%= lowercased(singular(classify(name))) %>);
  }

  async remove(id: number): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.findOne(id);
    return this.<%= lowercased(singular(classify(name))) %>Repository.remove(<%= lowercased(singular(classify(name))) %>);
  }
}
<% } else if (isTypeOrm) { %>import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import * as argon2 from 'argon2';
import { ChangePasswordDto } from './dto/change-password.dto<%= isEsm ? '.js' : '' %>';
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { <%= singular(classify(name)) %> } from './entities/<%= singular(name) %>.entity<%= isEsm ? '.js' : '' %>';

@Injectable()
export class <%= classify(name) %>Service {
  constructor(@InjectRepository(<%= singular(classify(name)) %>) private <%= lowercased(singular(classify(name))) %>Repository: MongoRepository<<%= singular(classify(name)) %>>) {}

  create(create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto): <%= returnOneType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.save(this.<%= lowercased(singular(classify(name))) %>Repository.create(create<%= singular(classify(name)) %>Dto));
  }

  findAll(): <%= returnListType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.find();
  }

  findOne(id: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.findOneBy({ id: new ObjectId(id) });
  }

  findByEmail(email: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.findOne({
      where: { email },
      select: { id: true, username: true, email: true, firstName: true, lastName: true, phoneNumber: true, password: true },
    });
  }

  findByUsername(username: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.findOne({
      where: { username },
      select: { id: true, username: true, email: true, firstName: true, lastName: true, phoneNumber: true, password: true },
    });
  }

  async update(id: string, update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto): <%= returnOneType %> {
<% if (type === 'microservice' || type === 'ws') { %>    const { id: _id, ...update } = update<%= singular(classify(name)) %>Dto;
    const updated<%= singular(classify(name)) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' },
    );
<% } else { %>    const updated<%= singular(classify(name)) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update<%= singular(classify(name)) %>Dto },
      { returnDocument: 'after' },
    );
<% } %>    if (!updated<%= singular(classify(name)) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return updated<%= singular(classify(name)) %> as <%= entityType %>;
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOne({
      where: { id: new ObjectId(id) },
      select: { id: true, username: true, email: true, firstName: true, lastName: true, phoneNumber: true, password: true },
    });
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
    <%= lowercased(singular(classify(name))) %>.password = await argon2.hash(changePasswordDto.password);
    return this.<%= lowercased(singular(classify(name))) %>Repository.save(<%= lowercased(singular(classify(name))) %>);
  }

  async remove(id: string): <%= returnOneType %> {
    const removed<%= singular(classify(name)) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOneAndDelete({ _id: new ObjectId(id) });
    if (!removed<%= singular(classify(name)) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return removed<%= singular(classify(name)) %> as <%= entityType %>;
  }
}
<% } else { %>import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as argon2 from 'argon2';
import { ChangePasswordDto } from './dto/change-password.dto<%= isEsm ? '.js' : '' %>';
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { <%= singular(classify(name)) %>, <%= singular(classify(name)) %>Document } from './schemas/<%= singular(name) %>.schema<%= isEsm ? '.js' : '' %>';

@Injectable()
export class <%= classify(name) %>Service {
  constructor(@InjectModel(<%= singular(classify(name)) %>.name) private <%= lowercased(singular(classify(name))) %>Model: Model<<%= singular(classify(name)) %>Document>) {}

  create(create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto): <%= returnOneType %> {
    const created<%= singular(classify(name)) %> = new this.<%= lowercased(singular(classify(name))) %>Model(create<%= singular(classify(name)) %>Dto);
    return created<%= singular(classify(name)) %>.save();
  }

  findAll(): <%= returnListType %> {
    return this.<%= lowercased(singular(classify(name))) %>Model.find().exec();
  }

  findOne(id: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Model.findById(id).exec();
  }

  findByEmail(email: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Model.findOne({ email }).select('+password').exec();
  }

  findByUsername(username: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Model.findOne({ username }).select('+password').exec();
  }

  update(id: string, update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Model.findByIdAndUpdate(id, update<%= singular(classify(name)) %>Dto, { returnDocument: 'after' }).exec();
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.<%= lowercased(singular(classify(name))) %>Model.findById(id).select('+password').exec();
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
    <%= lowercased(singular(classify(name))) %>.password = changePasswordDto.password;
    return <%= lowercased(singular(classify(name))) %>.save();
  }

  remove(id: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Model.findByIdAndDelete(id).exec();
  }
}
<% } %>
