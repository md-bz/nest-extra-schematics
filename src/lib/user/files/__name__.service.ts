import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

  create(create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto) {
    const created<%= singular(classify(name)) %> = new this.<%= lowercased(singular(classify(name))) %>Model(create<%= singular(classify(name)) %>Dto);
    return created<%= singular(classify(name)) %>.save();
  }

  findAll() {
    return this.<%= lowercased(singular(classify(name))) %>Model.find().exec();
  }

  findOne(id: string) {
    return this.<%= lowercased(singular(classify(name))) %>Model.findById(id).exec();
  }

  findByEmail(email: string) {
    return this.<%= lowercased(singular(classify(name))) %>Model.findOne({ email }).select('+password').exec();
  }

  findByUsername(username: string) {
    return this.<%= lowercased(singular(classify(name))) %>Model.findOne({ username }).select('+password').exec();
  }

  update(id: string, update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto) {
    return this.<%= lowercased(singular(classify(name))) %>Model.findByIdAndUpdate(id, update<%= singular(classify(name)) %>Dto, { returnDocument: 'after' }).exec();
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
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

  remove(id: string) {
    return this.<%= lowercased(singular(classify(name))) %>Model.findByIdAndDelete(id).exec();
  }
}
