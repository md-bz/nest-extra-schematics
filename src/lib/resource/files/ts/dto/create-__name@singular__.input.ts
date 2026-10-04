<% if (type === 'graphql-code-first') { %>import { <%= graphqlDecoratorsAndTypes %> } from '@nestjs/graphql';

@InputType()
export class Create<%= singular(classify(name)) %>Input {
<%= graphqlBody %>}<% } else { %>export class Create<%= singular(classify(name)) %>Input {}<% } %>
