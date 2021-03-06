import { SwaggerTags } from '../models/_index';
import { SwaggerResponseType } from '../models/interfaces/swagger/swagger-response-type.interface';
import { RouteOptions } from '../models/_index';
import { SwaggerPropertyOptions } from '../models/interfaces/swagger/swagger-property-options.interface';
import {
  swaggerComponentBuilder,
  swaggerDtoPropertyBuilder,
  swaggerParameterBuilder,
  swaggerResponseBuilder,
  swaggerSecuritySchemaBuilder,
  swaggerTagBuilder
} from './utils/swagger';

export const SwaggerComponent = (): ClassDecorator => {
  return swaggerComponentBuilder();
};

export const SwaggerResponseBody = (): ClassDecorator => {
  return swaggerComponentBuilder(true);
};

export const SwaggerProperty = (
  options: SwaggerPropertyOptions,
  object: any = undefined
): PropertyDecorator => {
  return swaggerDtoPropertyBuilder(options, object);
};

export const SwaggerResponse = (
  options: RouteOptions,
  responses: SwaggerResponseType[]
): MethodDecorator => {
  return swaggerResponseBuilder(options, responses);
};

export const SwaggerTag = (tag: SwaggerTags[]): ClassDecorator => {
  return swaggerTagBuilder(tag);
};

export const SwaggerParameter = (): ClassDecorator => {
  return swaggerParameterBuilder();
}

export const SwaggerSecuritySchema = (): ClassDecorator => {
  return swaggerSecuritySchemaBuilder();
}
