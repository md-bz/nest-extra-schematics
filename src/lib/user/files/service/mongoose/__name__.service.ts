import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as argon2 from 'argon2';
import { ChangePasswordDto } from './dto/change-password.dto<%= isEsm ? '.js' : '' %>';
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { <%= singular(classify(name)) %>, <%= singular(classify(name)) %>Document } from './schemas/<%= singular(name) %>.schema<%= isEsm ? '.js' : '' %>';

<%= duplicateKeyGuard %>

@Injectable()
export class <%= classify(name) %>Service {
  constructor(@InjectModel(<%= singular(classify(name)) %>.name) private <%= lowercased(singular(classify(name))) %>Model: Model<<%= singular(classify(name)) %>Document>) {}

  async create(create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto): <%= returnOneType %> {
    try {
      const created<%= singular(classify(name)) %> = new this.<%= lowercased(singular(classify(name))) %>Model(create<%= singular(classify(name)) %>Dto);
      return await created<%= singular(classify(name)) %>.save();
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Username or email already exists');
      }
      throw err;
    }
  }

  findAll(): <%= returnListType %> {
    return this.<%= lowercased(singular(classify(name))) %>Model.find().exec();
  }

  async findOne(id: string): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.<%= lowercased(singular(classify(name))) %>Model.findById(id).exec();
    if (!<%= lowercased(singular(classify(name))) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return <%= lowercased(singular(classify(name))) %>;
  }

  findByEmail(email: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Model.findOne({ email }).select('+password').exec();
  }

  findByUsername(username: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Model.findOne({ username }).select('+password').exec();
  }

  async update(id: string, update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto): <%= returnNullableType %> {
    try {
      return await this.<%= lowercased(singular(classify(name))) %>Model.findByIdAndUpdate(id, update<%= singular(classify(name)) %>Dto, { returnDocument: 'after' }).exec();
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Username or email already exists');
      }
      throw err;
    }
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

  async remove(id: string): <%= returnOneType %> {
    const removed<%= singular(classify(name)) %> = await this.<%= lowercased(singular(classify(name))) %>Model.findByIdAndDelete(id).exec();
    if (!removed<%= singular(classify(name)) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    return removed<%= singular(classify(name)) %>;
  }
}
