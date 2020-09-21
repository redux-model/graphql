import { createFragmentKey, FragmentMeta } from './fragment';

export type Definition<K = any, V = any> = Types<K, V> | DefinitionObj<K, V>;

type DefinitionObj<K, V> = {
  [key: string]: Definition<K, V> | undefined;
};

type DelegateParam<T, U, Extra> = T extends Types<infer A, infer B>
  ? Types<A | Extra, B | U>
  : T extends object
    ? {
      [K in keyof T]: T[K] extends Types<infer A, infer B>
        ? Types<A | Extra, B | U>
        // The struct `undefined | { xx: Types<T, U> }` is unavailable collect parameters.
        : Extra extends undefined
          ? Types<Parse<T[K]> | undefined, U>
          : DelegateParam<T[K], U, never>
    }
    : never;

export type Parse<T> = T extends Types<infer U, any>
  ? U
  : T extends object
    ? {
      [K in keyof T]: T[K] extends Types<infer U, any>
        ? U
        : Parse<T[K]>;
    }
    : never;

export type VarParams<T> = T extends AnyType ? VarTypeParams<T> : VarObjectParams<T>;

type AnyType = Types<any, any>;

type VarTypeParams<T> = T extends Types<any, infer U>
  ? unknown extends U
    ? never
    : U
  : never;

/**
 * To resolve error: `Type instantiation is excessively deep and possibly infinite`, we should not reference VarParams here, just repeat the type until 5th level.
 *
 * Be careful that 6th level will cause the same error.
 */
type VarObjectParams<T> = {
  [K in keyof T]: T[K] extends AnyType ? VarTypeParams<T[K]> : VarObjectParams_2<T[K]>
}[keyof T];
type VarObjectParams_2<T> = {
  [K in keyof T]: T[K] extends AnyType ? VarTypeParams<T[K]> : VarObjectParams_3<T[K]>
}[keyof T];
type VarObjectParams_3<T> = {
  [K in keyof T]: T[K] extends AnyType ? VarTypeParams<T[K]> : VarObjectParams_4<T[K]>
}[keyof T];
type VarObjectParams_4<T> = {
  [K in keyof T]: T[K] extends AnyType ? VarTypeParams<T[K]> : VarObjectParams_5<T[K]>
}[keyof T];
type VarObjectParams_5<T> = {
  [K in keyof T]: T[K] extends AnyType ? VarTypeParams<T[K]> : never;
}[keyof T];

export class Types<T = never, U = never> {
  public/*protected*/ fnParams?: string[];
  public/*protected*/ totalParams?: string[];
  public/*protected*/ realName?: string;
  public/*protected*/ includeParam?: string;
  public/*protected*/ skipParam?: string;
  public/*protected*/ returns?: Definition;

  /**
   * Set the real server property name.
   * It means current property name is an alias.
   */
  aliasOf(realName: string): this {
    const that = this.clone();
    that.realName = realName;
    return that;
  }

  /**
   * Property is a number
   */
  get number(): Types<T | number, U> {
    return this;
  }

  /**
   * Property is a string
   */
  get string(): Types<T |  string, U> {
    return this;
  }

  /**
   * Property is a bool
   */
  get boolean(): Types<T | boolean, U> {
    return this;
  }

  /**
   * Property may be undefined
   */
  get undefined(): Types<T | undefined, U> {
    return this;
  }

   /**
   * Property may be null
   */
  get null(): Types<T | null, U> {
    return this;
  }

   /**
   * Define custom type:
   * ```typescript
   * types.custom<'User'>();
   *
   * enum Gender {
   *   man = 'man',
   *   woman = 'woman',
   * }
   *
   * types.custom<Gender>();
   * ```
   */
  custom<T1>(): Types<T | T1, U> {
    return this;
  }

  /**
   * ```
   * {
   *   lists {
   *     id
   *     number
   *   }
   * }
   * ```
   */
  object<T1 extends Definition<K, V>, K extends any, V extends any>(items: T1): Types<T | Parse<T1>, U | VarParams<T1>> {
    const that = this.clone();
    that.returns = items;
    return that;
  }

  /**
   * ```
   * {
   *   lists {
   *     id
   *     number
   *   }
   * }
   * ```
   */
  array<T1 extends Definition<K, V>, K extends any, V extends any>(
    // @ts-ignore
    each: T1
  ): Types<T | Parse<T1>[], U | VarParams<T1>> {
    const that = this.clone();
    that.returns = each;
    return that;
  }

  /**
   * ```
   * {
   *   id @include (if: $varA)
   *   name
   *   lists (page: 1) @include (if: $varB) {
   *     id
   *     name
   *     age @include (if: $varC)
   *   }
   * }
   * ```
   */
  include<P extends string>(param_Boolean: P): Types<T | undefined, U | P> {
    const that = this.clone();
    that.includeParam = param_Boolean;
    that.appendParams([param_Boolean]);
    return that;
  }

  /**
   * ```
   * {
   *   id @skip (if: $varA)
   *   name
   *   lists (page: 1) @skip (if: $varB) {
   *     id
   *     name
   *     age @skip (if: $varC)
   *   }
   * }
   * ```
   */
  skip<P extends string>(param_Boolean: P): Types<T | undefined, U | P> {
    const that = this.clone();
    that.skipParam = param_Boolean;
    that.appendParams([param_Boolean]);
    return that;
  }

  /**
   *
   * @param {String[]} params_Type
   * For example: `page_Int` | `name_String` | `focus_Boolean` | `data_MyObject`
   * @param {Types} returns
   */
  fn<U1 extends string, T1 extends Definition>(
    params_Type: U1[],
    returns: T1
  ): Types<T | Parse<T1>, U | U1> {
    const that = this.clone();
    that.fnParams = params_Type;
    that.returns = returns;
    that.appendParams(params_Type);
    return that;
  }

  /**
   * Inline fragment with same struct
   * ```
   * lists {
   *   ... on User {
   *     name
   *   }
   *   ... on Admin {
   *     name
   *   }
   * }
   * ```
   */
  on<T1 extends DefinitionObj<K, V>, K extends any, V extends any>(on: string | string[], definition: T1): DelegateParam<T1, U, T extends undefined ? undefined : never> {
    const data: Record<string, FragmentMeta> = {};
    let fragments: Record<string, Definition> = {};

    if (typeof on === 'string') {
      fragments[on] = definition!;
    } else if (Array.isArray(on)) {
      on.forEach((key) => {
        fragments[key] = definition!;
      });
    }

    Object.keys(fragments).forEach((key) => {
      data[createFragmentKey(key)] = {
        name: '',
        on: key,
        inline: true,
        definition: fragments[key],
        includeParam: this.includeParam,
        skipParam: this.skipParam,
      };
    });

    // @ts-ignore
    return data;
  }

  /**
   * ```
   * types.union(
   *   types.on('User', {
   *     kind: types.custom<'User'>(),
   *     name: types.string,
   *   }),
   *   types.on('Admin', {
   *     kind: types.custom<'Admin'>(),
   *     counter: types.string,
   *     age: types.number,
   *   }),
   *   ... and more
   * )
   * ```
   */
  union<T1 extends object, T2 extends object>(def1: T1, def2: T2): T1 | T2;
  union<T1 extends object, T2 extends object, T3 extends object>(def1: T1, def2: T2, def3: T3): T1 | T2 | T3;
  union<T1 extends object, T2 extends object, T3 extends object, T4 extends object>(def1: T1, def2: T2, def3: T3, def4: T4): T1 | T2 | T3 | T4;
  union(): any {
    const data = {};

    Array.prototype.forEach.call(arguments, (item) => {
      Object.keys(item).forEach((key) => {
        data[key] = item[key];
      });
    });

    return data;
  }

  protected appendParams(names: string[]): void {
    this.totalParams = this.totalParams || [];
    this.totalParams.push.apply(this.totalParams, names);
  }

  protected clone(): this {
    // @ts-ignore
    const that: Types<any, any> = new this.constructor();

    if (this.fnParams) {
      that.fnParams = this.fnParams.slice();
    }

    if (this.totalParams) {
      that.totalParams = this.totalParams.slice();
    }

    this.includeParam && (that.includeParam = this.includeParam);
    this.skipParam && (that.skipParam = this.skipParam);
    this.realName && (that.realName = this.realName);
    this.returns && (that.returns = this.returns);

    // @ts-ignore
    return that;
  }
}

export const types = new Types();
