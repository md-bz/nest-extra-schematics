import { Test, TestingModule } from '@nestjs/testing';
<%= specMockImports %>import { <%= classify(name) %>Service } from './<%= name %>.service<%= isEsm ? '.js' : '' %>';

describe('<%= classify(name) %>Service', () => {
  let service: <%= classify(name) %>Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [<%= classify(name) %>Service<%= specMockProviders %>],
    }).compile();

    service = module.get<<%= classify(name) %>Service>(<%= classify(name) %>Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
