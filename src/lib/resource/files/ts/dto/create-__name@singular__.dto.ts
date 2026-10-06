import { <%= validatorImports %> } from 'class-validator';<% if (transformerImports) { %>
<%= transformerImports %><% } %>

export class Create<%= singular(classify(name)) %>Dto {
<%= dtoBody %>}
