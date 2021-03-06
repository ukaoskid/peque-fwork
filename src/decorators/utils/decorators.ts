import { RouteDefinition } from '../../models/_index';
import { DECORATORS } from '../../models/constants/decorators';
import {
  ParamType,
  ExpressMethods,
  MiddlewareHandler
} from '../../models/_index';
import { ControllerDefinition } from '../../models/_index';
import { Injector } from '../../models/dependency-injection/injector.service';
import { ModuleDefinition } from '../../models/_index';
import { Controllers } from '../../models/dependency-injection/controller.service';

export const Providers = [];
export const CustomProviders = [];

const getMetadataKeyFromParam = (param: ParamType) => {
  switch (param) {
    case 'body':
      return DECORATORS.metadata.BODY;
    case 'header':
      return DECORATORS.metadata.HEADERS;
    case 'param':
      return DECORATORS.metadata.PARAMETERS;
    case 'request':
      return DECORATORS.metadata.REQUEST;
    case 'response':
      return DECORATORS.metadata.RESPONSE;
    default:
      return;
  }
};

const extractParameters = (
  param: ParamType,
  target: any,
  propertyKey: string | symbol
) => {
  const metadataKey = getMetadataKeyFromParam(param);
  const metadata = (
    Reflect.getMetadata(metadataKey, target.constructor) || []
  ).filter(value => value[propertyKey]);
  return metadata.map(param => param[propertyKey]);
};

export const controllerBuilder = (
  prefix: string,
  middlewares: MiddlewareHandler = []
): ClassDecorator => {
  return (target: any) => {
    const controllerDefinition: ControllerDefinition = {
      prefix,
      middlewares: Array.isArray(middlewares) ? middlewares : [middlewares]
    };
    Reflect.defineMetadata(
      DECORATORS.metadata.CONTROLLER,
      controllerDefinition,
      target
    );

    if (!Reflect.hasMetadata(DECORATORS.metadata.ROUTES, target)) {
      Reflect.defineMetadata(DECORATORS.metadata.ROUTES, [], target);
    }
  };
};

export const methodBuilder = (
  method: ExpressMethods,
  path: string,
  middleware: MiddlewareHandler = [],
  documentOnly: boolean,
  noRestWrapper: boolean
): MethodDecorator => {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ): void => {
    if (
      !Reflect.hasMetadata(DECORATORS.metadata.ROUTES, target.constructor)
    ) {
      Reflect.defineMetadata(
        DECORATORS.metadata.ROUTES,
        [],
        target.constructor
      );
    }

    // Get the routes.
    const routes = Reflect.getMetadata(
      DECORATORS.metadata.ROUTES,
      target.constructor
    ) as Array<RouteDefinition>;
    routes.push({
      requestMethod: method,
      path,
      method: {
        name: propertyKey,
        body: extractParameters('body', target, propertyKey),
        params: extractParameters('param', target, propertyKey),
        query: extractParameters('query', target, propertyKey),
        headers: extractParameters('header', target, propertyKey),
        request: extractParameters('request', target, propertyKey),
        response: extractParameters('response', target, propertyKey)
      },
      middlewareFunctions: Array.isArray(middleware)
        ? middleware
        : [middleware],
      documentOnly,
      noRestWrapper
    });
    Reflect.defineMetadata(
      DECORATORS.metadata.ROUTES,
      routes,
      target.constructor
    );
  };
};

export const paramBuilder = (
  param: ParamType,
  paramName: string = undefined
): ParameterDecorator => {
  const metadataKey = getMetadataKeyFromParam(param);

  return (target, propertyKey, parameterIndex) => {
    const parameters =
      Reflect.getMetadata(metadataKey, target.constructor) || [];
    const parameter = {
      [propertyKey]: {
        index: parameterIndex,
        param: paramName
      }
    };
    parameters.push(parameter);
    Reflect.defineMetadata(metadataKey, parameters, target.constructor);
  };
};

export const moduleBuilder = (module: ModuleDefinition): ClassDecorator => {
  return (target: any) => {
    if (module.controllers) {
      module.controllers.forEach(controller => Controllers.push(controller));
    }
    // Setting custom providers.
    const providers = module.providers || [];
    providers.forEach(provider => {
      if (provider.useClass) {
        Injector.set(provider.provider, provider.useClass);
      }
    })
  }
}

export const injectableBuilder = (provider?: string): ClassDecorator => {
  return (target: any) => {
    Providers.push(target);
  };
};

export const injectClass = (provider?: string | Function): PropertyDecorator => {
  return (target: any, key: string) => {
    let paramType = '';
    if (typeof provider === 'function') {
      paramType = provider.apply(this);
    } else {
      paramType = provider ? provider :
        (Reflect.getMetadata('design:type', target, key).name || '');
    }
    Object.defineProperty(target, key, {
      get: () => Injector.resolve(paramType),
      enumerable: true,
      configurable: true
    });
  };
};
