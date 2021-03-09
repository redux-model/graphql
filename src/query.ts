import { parse, ParseContext } from './parse';
import { TemplateObj, Parse, VarParams } from './types';

export type Space = '' | ' ';
export type Suffix = '!' | '';
type AliasName<T> = T extends `${string} as ${infer R}` ? TrimRight<R> : TrimRight<T>;
type TrimRight<T> = T extends `${infer R} ` ? TrimRight<R> : T;

type Variable<T, P = VarParams<T>> = {
  [K in P as K extends `${infer R}:${Space}${'Int' | 'Float'}${Suffix}` ? AliasName<R> : never]: number;
}
& {
  [K in P as K extends `${infer R}:${Space}[${'Int' | 'Float'}${Suffix}]${Suffix}` ? AliasName<R> : never]: number[];
}
& {
  [K in P as K extends `${infer R}:${Space}${'String' | 'ID'}${Suffix}` ? AliasName<R> : never]: string;
}
& {
  [K in P as K extends `${infer R}:${Space}[${'String' | 'ID'}${Suffix}]${Suffix}` ? AliasName<R> : never]: string[];
}
& {
  [K in P as K extends `${infer R}:${Space}Boolean${Suffix}` ? AliasName<R> : never]: boolean;
}
& {
  [K in P as K extends `${infer R}:${Space}[Boolean]${Suffix}` ? AliasName<R> : never]: boolean[];
}
& {
  [K in P as K extends `${string}:${Space}${'Int' | 'Float' | 'String' | 'Boolean' | 'ID'}${Suffix}`
    ? never
    : K extends `${string}[${string}]${Suffix}`
      ? never
      : K extends `${infer R}:${string}` ? AliasName<R> : never
  ]: Record<string, any> | number | string | boolean;
}
& {
  [K in P as K extends `${string}:${Space}[${'Int' | 'Float' | 'String' | 'Boolean' | 'ID'}${Suffix}]${Suffix}` ? never : K extends `${infer R}:${Space}[${string}]${Suffix}` ? AliasName<R> : never]: (Record<string, any> | number | string | boolean)[];
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
    fragmentStrs: [],
    fragmentObjs: [],
    fragmentIndex: {},
  };

  // @ts-ignore
  const type = (this as QueryThis).type;
  let lazyQuery: string | undefined;
  const getQuery = () => lazyQuery || (lazyQuery = parse(type, options && options.name, template, ctx));

  const fn = (variables: object) => {
    return {
      query: getQuery(),
      variables,
    };
  };

  fn.toString = getQuery;

  // @ts-ignore
  return fn;
};
