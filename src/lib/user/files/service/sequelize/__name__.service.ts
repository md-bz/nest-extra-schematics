import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as argon2 from 'argon2';
import { ChangePasswordDto } from './dto/change-password.dto<%= isEsm ? '.js' : '' %>';
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { <%= singular(classify(name)) %> } from './entities/<%= singular(name) %>.entity<%= isEsm ? '.js' : '' %>';

<%= duplicateKeyGuard %>

@Injectable()
export class <%= classify(name) %>Service {
  constructor(@InjectModel(<%= singular(classify(name)) %>) private readonly <%= lowercased(singular(classify(name))) %>Model: typeof <%= singular(classify(name)) %>) {}

  async create(create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto): <%= returnOneType %> {
    try {
      return await this.<%= lowercased(singular(classify(name))) %>Model.create(create<%= singular(classify(name)) %>Dto as <%= singular(classify(name)) %>);
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Username or email already exists');
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

  findByEmail(email: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Model.findOne({ where: { email } });
  }

  findByUsername(username: string): <%= returnNullableType %> {
    return this.<%= lowercased(singular(classify(name))) %>Model.findOne({ where: { username } });
  }

  async update(id: number, update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto): <%= returnOneType %> {
    try {
      const [affected, instances] = await this.<%= lowercased(singular(classify(name))) %>Model.update(update<%= singular(classify(name)) %>Dto as <%= singular(classify(name)) %>, { where: { id }, returning: true });
      if (!affected) {
        throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
      }
      return instances[0];
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw new ConflictException('Username or email already exists');
      }
      throw err;
    }
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.<%= lowercased(singular(classify(name))) %>Model.scope('withPassword').findByPk(id);
    if (!<%= lowercased(singular(classify(name))) %>) {
      throw new NotFoundException(`<%= singular(classify(name)) %> with ID ${id} not found`);
    }
    const isCurrentPasswordValid = await argon2.verify(
      <%= lowercased(singular(classify(name))) %>.dataValues.password,
      changePasswordDto.currentPassword,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    <%= lowercased(singular(classify(name))) %>.dataValues.password = await argon2.hash(changePasswordDto.password);
    return <%= lowercased(singular(classify(name))) %>.save();
  }

  async remove(id: number): <%= returnOneType %> {
    const <%= lowercased(singular(classify(name))) %> = await this.findOne(id);
    await <%= lowercased(singular(classify(name))) %>.destroy();
    return <%= lowercased(singular(classify(name))) %>;
  }
}
