import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import * as argon2 from 'argon2';
import { ChangePasswordDto } from './dto/change-password.dto<%= isEsm ? '.js' : '' %>';
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { <%= singular(classify(name)) %> } from './entities/<%= singular(name) %>.entity<%= isEsm ? '.js' : '' %>';

<%= duplicateKeyGuard %>

const publicSelect = { id: true, username: true, email: true, firstName: true, lastName: true, phoneNumber: true };

@Injectable()
export class <%= classify(name) %>Service {
  constructor(@InjectRepository(<%= singular(classify(name)) %>) private <%= lowercased(singular(classify(name))) %>Repository: MongoRepository<<%= singular(classify(name)) %>>) {}

  async create(create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto): <%= returnOneType %> {
    try {
      return await this.<%= lowercased(singular(classify(name))) %>Repository.save(this.<%= lowercased(singular(classify(name))) %>Repository.create(create<%= singular(classify(name)) %>Dto));
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Username or email already exists');
      }
      throw err;
    }
  }

  findAll(): <%= returnListType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.find({ select: publicSelect });
  }

  async findOne(id: string): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOne({
      where: { id: new ObjectId(id) },
      select: publicSelect,
    });
    if (!<%= lowercased(singular(classify(name))) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return <%= lowercased(singular(classify(name))) %> as <%= entityType %>;
  }

  findByEmail(email: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.findOne({
      where: { email },
      select: { ...publicSelect, password: true },
    });
  }

  findByUsername(username: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Repository.findOne({
      where: { username },
      select: { ...publicSelect, password: true },
    });
  }

  async update(id: string, update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto): <%= returnOneType %> {
    try {
<% if (type === 'microservice' || type === 'ws') { %>      const { id: _id, ...update } = update<%= singular(classify(name)) %>Dto;
      const updated<%= singular(classify(name)) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: update },
        { returnDocument: 'after', projection: { password: 0 } },
      );
<% } else { %>      const updated<%= singular(classify(name)) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: update<%= singular(classify(name)) %>Dto },
        { returnDocument: 'after', projection: { password: 0 } },
      );
<% } %>      if (!updated<%= singular(classify(name)) %>) {
        throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
      }
      return updated<%= singular(classify(name)) %> as <%= entityType %>;
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Username or email already exists');
      }
      throw err;
    }
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOne({
      where: { id: new ObjectId(id) },
      select: { ...publicSelect, password: true },
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
    const removed<%= singular(classify(name)) %> = await this.<%= lowercased(singular(classify(name))) %>Repository.findOneAndDelete({ _id: new ObjectId(id) }, { projection: { password: 0 } });
    if (!removed<%= singular(classify(name)) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return removed<%= singular(classify(name)) %> as <%= entityType %>;
  }
}
