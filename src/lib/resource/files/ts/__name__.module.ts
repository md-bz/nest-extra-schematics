import { Module } from '@nestjs/common';<% if (isMongoose && crud) { %>
import { MongooseModule } from '@nestjs/mongoose';
import { <%= singular(classify(name)) %>, <%= singular(classify(name)) %>Schema } from './schemas/<%= singular(name) %>.schema<%= isEsm ? '.js' : '' %>';<% } 
%>
import { <%= classify(name) %>Service } from './<%= name %>.service<%= isEsm ? '.js' : '' %>';
<% if (type === 'rest' || type === 'microservice') { %>import { <%= classify(name) %>Controller } from './<%= name %>.controller<%= isEsm ? '.js' : '' %>';<% } %><% if (type === 'graphql-code-first' || type === 'graphql-schema-first') { %>import { <%= classify(name) %>Resolver } from './<%= name %>.resolver<%= isEsm ? '.js' : '' %>';<% } %><% if (type === 'ws') { %>import { <%= classify(name) %>Gateway } from './<%= name %>.gateway<%= isEsm ? '.js' : '' %>';<% } %>

@Module({
  <% if (isMongoose && crud) { %>imports: [MongooseModule.forFeature([{ name: <%= singular(classify(name)) %>.name, schema: <%= singular(classify(name)) %>Schema }])],
  <% } %><% if (type === 'rest' || type === 'microservice') { %>controllers: [<%= classify(name) %>Controller],
  providers: [<%= classify(name) %>Service],<% } else if (type === 'graphql-code-first' || type === 'graphql-schema-first') { %>providers: [<%= classify(name) %>Resolver, <%= classify(name) %>Service],<% } else { %>providers: [<%= classify(name) %>Gateway, <%= classify(name) %>Service],<% } %>
})
export class <%= classify(name) %>Module {}
