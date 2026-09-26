<% if (crud && type === 'rest') { %>import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';<%
} else if (crud && type === 'microservice') { %>import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';<%
} else { %>import { Controller } from '@nestjs/common';<%
} %>
import { <%= classify(name) %>Service } from './<%= name %>.service<%= isEsm ? '.js' : '' %>';<% if (crud) { %>
import { Create<%= singular(classify(name)) %>Dto } from './dto/create-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';
import { Update<%= singular(classify(name)) %>Dto } from './dto/update-<%= singular(name) %>.dto<%= isEsm ? '.js' : '' %>';<% } %><% if (crud && hasOrm) { %>
import { <%= entityType %> } from '<%= entityPath %><%= isEsm ? '.js' : '' %>';<% } %>

<% if (type === 'rest') { %>@Controller('<%= dasherize(name) %>')<% } else { %>@Controller()<% } %>
export class <%= classify(name) %>Controller {
  constructor(private readonly <%= lowercased(name) %>Service: <%= classify(name) %>Service) {}<% if (type === 'rest' && crud) { %>

  @Post()
  create(@Body() create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto): <%= returnOneType %> {
    return this.<%= lowercased(name) %>Service.create(create<%= singular(classify(name)) %>Dto);
  }

  @Get()
  findAll(): <%= returnListType %> {
    return this.<%= lowercased(name) %>Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): <%= returnNullableType %> {
    return this.<%= lowercased(name) %>Service.findOne(<% if ((isMongoose || (isTypeOrm && db === 'mongodb'))) { %>id<% } else { %>+id<% } %>);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto): <%= returnNullableType %> {
    return this.<%= lowercased(name) %>Service.update(<% if ((isMongoose || (isTypeOrm && db === 'mongodb'))) { %>id<% } else { %>+id<% } %>, update<%= singular(classify(name)) %>Dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): <%= returnNullableType %> {
    return this.<%= lowercased(name) %>Service.remove(<% if ((isMongoose || (isTypeOrm && db === 'mongodb'))) { %>id<% } else { %>+id<% } %>);
  }<% } else if (type === 'microservice' && crud) { %>

  @MessagePattern('create<%= singular(classify(name)) %>')
  create(@Payload() create<%= singular(classify(name)) %>Dto: Create<%= singular(classify(name)) %>Dto): <%= returnOneType %> {
    return this.<%= lowercased(name) %>Service.create(create<%= singular(classify(name)) %>Dto);
  }

  @MessagePattern('findAll<%= classify(name) %>')
  findAll(): <%= returnListType %> {
    return this.<%= lowercased(name) %>Service.findAll();
  }

  @MessagePattern('findOne<%= singular(classify(name)) %>')
  findOne(@Payload() id: <% if ((isMongoose || (isTypeOrm && db === 'mongodb'))) { %>string<% } else { %>number<% } %>): <%= returnNullableType %> {
    return this.<%= lowercased(name) %>Service.findOne(id);
  }

  @MessagePattern('update<%= singular(classify(name)) %>')
  update(@Payload() update<%= singular(classify(name)) %>Dto: Update<%= singular(classify(name)) %>Dto): <%= returnNullableType %> {
    return this.<%= lowercased(name) %>Service.update(update<%= singular(classify(name)) %>Dto.id, update<%= singular(classify(name)) %>Dto);
  }

  @MessagePattern('remove<%= singular(classify(name)) %>')
  remove(@Payload() id: <% if ((isMongoose || (isTypeOrm && db === 'mongodb'))) { %>string<% } else { %>number<% } %>): <%= returnNullableType %> {
    return this.<%= lowercased(name) %>Service.remove(id);
  }<% } %>
}
