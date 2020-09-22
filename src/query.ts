import { parse, ParseContext } from './parse';
import { TemplateObj, Parse, VarParams } from './types';

type Variable<T> = {
  [K in VarParams<T>]: string | number | boolean | object | undefined;
};

type QueryThis = {
  type: string;
};

export type QueryReturn<T> = {
  (variables: Variable<T>): { query: string; variables: object };
  type: Parse<T>;
  toString(): string;
};

export const createContext = (type: string): typeof query => {
  return query.bind(<QueryThis>{
    type: type,
  });
};

export function query<T extends TemplateObj<K, V>, K extends any, V extends any>(
  template: T, options?: { name?: string }
): QueryReturn<T> {
  const ctx: ParseContext = {
    params: [],
    paramAlias: {},
    fragmentStrs: [],
    fragmentObjs: [],
    fragmentIndex: {},
  };

  // @ts-ignore
  const type = (this as QueryThis).type;
  let lazyQuery: string | undefined;
  const getQuery = () => lazyQuery || (lazyQuery = parse(type, options && options.name, template, ctx));

  const fn = (variables: object) => {
    const query = getQuery();
    const args = {};

    Object.keys(variables).forEach((key) => {
      args[ctx.paramAlias[key]] = variables[key];
    });

    return {
      query: query,
      variables: args,
    };
  };

  fn.toString = getQuery;

  // @ts-ignore
  return fn;
};
