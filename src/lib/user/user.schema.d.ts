import type { ResourceOptions } from '../resource/resource.schema.js';


export interface UserOptions extends Omit<ResourceOptions, 'fields'> {}