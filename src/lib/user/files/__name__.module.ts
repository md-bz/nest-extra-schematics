import { Module } from '@nestjs/common';
<% if (isTypeOrm) { %>import { TypeOrmModule } from '@nestjs/typeorm';
import { <%= singular(classify(name)) %> } from './entities/<%= singular(name) %>.entity<%= isEsm ? '.js' : '' %>';
<% } else { %>import { MongooseModule } from '@nestjs/mongoose';
import { <%= singular(classify(name)) %>, <%= singular(classify(name)) %>Schema } from './schemas/<%= singular(name) %>.schema<%= isEsm ? '.js' : '' %>';
<% } %>import { <%= classify(name) %>Service } from './<%= name %>.service<%= isEsm ? '.js' : '' %>';
import { <%= classify(name) %>Controller } from './<%= name %>.controller<%= isEsm ? '.js' : '' %>';

@Module({
  imports: [<% if (isTypeOrm) { %>TypeOrmModule.forFeature([<%= singular(classify(name)) %>])<% } else { %>MongooseModule.forFeature([{ name: <%= singular(classify(name)) %>.name, schema: <%= singular(classify(name)) %>Schema }])<% } %>],
  controllers: [<%= classify(name) %>Controller],
  providers: [<%= classify(name) %>Service],
  exports: [<%= classify(name) %>Service],
})
export class <%= classify(name) %>Module {}
