import { Module } from '@nestjs/common';<% if (isMongoose && crud) { %>
import { MongooseModule } from '@nestjs/mongoose';
import { <%= singular(classify(name)) %>, <%= singular(classify(name)) %>Schema } from './schemas/<%= singular(name) %>.schema<%= isEsm ? '.js' : '' %>';<% } 
%><% if (isTypeOrm && crud) { %>
import { TypeOrmModule } from '@nestjs/typeorm';
import { <%= singular(classify(name)) %> } from './entities/<%= singular(name) %>.entity<%= isEsm ? '.js' : '' %>';<% } 
%>
import { <%= classify(name) %>Service } from './<%= name %>.service<%= isEsm ? '.js' : '' %>';
<% if (type === 'rest' || type === 'microservice') { %>import { <%= classify(name) %>Controller } from './<%= name %>.controller<%= isEsm ? '.js' : '' %>';<% } %><% if (type === 'graphql-code-first' || type === 'graphql-schema-first') { %>import { <%= classify(name) %>Resolver } from './<%= name %>.resolver<%= isEsm ? '.js' : '' %>';<% } %><% if (type === 'ws') { %>import { <%= classify(name) %>Gateway } from './<%= name %>.gateway<%= isEsm ? '.js' : '' %>';<% } %>

@Module({
  <% if (isMongoose && crud) { %>imports: [MongooseModule.forFeature([{ name: <%= singular(classify(name)) %>.name, schema: <%= singular(classify(name)) %>Schema }])],
  <% } %><% if (isTypeOrm && crud) { %>imports: [TypeOrmModule.forFeature([<%= singular(classify(name)) %>])],
  <% } %><% if (type === 'rest' || type === 'microservice') { %>controllers: [<%= classify(name) %>Controller],
  providers: [<%= classify(name) %>Service],<% } else if (type === 'graphql-code-first' || type === 'graphql-schema-first') { %>providers: [<%= classify(name) %>Resolver, <%= classify(name) %>Service],<% } else { %>providers: [<%= classify(name) %>Gateway, <%= classify(name) %>Service],<% } %>
})
export class <%= classify(name) %>Module {}
