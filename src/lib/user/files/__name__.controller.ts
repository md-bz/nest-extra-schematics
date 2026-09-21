import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { <%= classify(name) %>Service } from './<%= name %>.service<%= isEsm ? '.js' : '' %>';
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { ChangePasswordDto } from './dto/change-password.dto<%= isEsm ? '.js' : '' %>';

@Controller('<%= dasherize(name) %>')
export class <%= classify(name) %>Controller {
  constructor(private readonly <%= lowercased(name) %>Service: <%= classify(name) %>Service) {}

  @Post()
  create(@Body() create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto) {
    return this.<%= lowercased(name) %>Service.create(create<%= singular(classify(name)) %>Dto);
  }

  @Get()
  findAll() {
    return this.<%= lowercased(name) %>Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.<%= lowercased(name) %>Service.findOne(<% if (isMongoose || (isTypeOrm && db === 'mongodb')) { %>id<% } else { %>+id<% } %>);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto) {
    return this.<%= lowercased(name) %>Service.update(<% if (isMongoose || (isTypeOrm && db === 'mongodb')) { %>id<% } else { %>+id<% } %>, update<%= singular(classify(name)) %>Dto);
  }

  @Patch(':id/password')
  changePassword(@Param('id') id: string, @Body() changePasswordDto: ChangePasswordDto) {
    return this.<%= lowercased(name) %>Service.changePassword(<% if (isMongoose || (isTypeOrm && db === 'mongodb')) { %>id<% } else { %>+id<% } %>, changePasswordDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.<%= lowercased(name) %>Service.remove(<% if (isMongoose || (isTypeOrm && db === 'mongodb')) { %>id<% } else { %>+id<% } %>);
  }
}
