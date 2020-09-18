import { createFragmentKey, FragmentMeta } from './fragment';

export type Definition<K = any, V = any> = Types<K, V> | DefinitionObj<K, V>;

type DefinitionObj<K, V> = {
  [key: string]: Definition<K, V> | undefined;
};

export type Or<T, Next> = unknown extends T ? Next : Next | T;

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

export class Types<T = unknown, U = unknown> {
  public/*protected*/ fnParams?: string[];
  public/*protected*/ totalParams?: string[];
  public/*protected*/ realName?: string;
  public/*protected*/ includeParam?: string;
  public/*protected*/ skipParam?: string;
  public/*protected*/ returns?: Definition;

  aliasOf(realName: string): this {
    const that = this.clone();
    that.realName = realName;
    return that;
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

  get number(): Types<Or<T, number>, U> {
    return this;
  }

  get string(): Types<Or<T, string>, U> {
    return this;
  }

  get boolean(): Types<Or<T, boolean>, U> {
    return this;
  }

  get undefined(): Types<Or<T, undefined>, U> {
    return this;
  }

  get null(): Types<Or<T, null>, U> {
    return this;
  }

  custom<T1>(): Types<Or<T, T1>, U> {
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
  object<T1 extends Definition<K, V>, K extends any, V extends any>(items: T1): Types<Or<T, Parse<T1>>, Or<U, VarParams<T1>>> {
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
  ): Types<Or<T, Parse<T1>[]>, Or<U, VarParams<T1>>> {
    const that = this.clone();
    that.returns = each;
    return that;
  }

  /**
   * ```
   * {
   *   id @include (if: $varA)
   *   name
   *   lists @include (if: $varB) {
   *     id
   *     name
   *     age @include (if: $varC)
   *   }
   * }
   * ```
   */
  include<P extends string>(param_Boolean: P): Types<Or<T, undefined>, Or<U, P>> {
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
   *   lists @skip (if: $varB) {
   *     id
   *     name
   *     age @skip (if: $varC)
   *   }
   * }
   * ```
   */
  skip<P extends string>(param_Boolean: P): Types<Or<T, undefined>, Or<U, P>> {
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
  ): Types<Or<T, Parse<T1>>, Or<U, U1>> {
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
  on<T1 extends DefinitionObj<K, V>, K extends any, V extends any>(on: string | string[], definition: T1): T1;
  /**
   * Inline fragment with different struct
   * ```
   * lists {
   *   ... on User {
   *     name1
   *   }
   *   ... on Admin {
   *     name2
   *   }
   * }
   * ```
   */
  on<T1 extends Record<string, any>>(fragments: Record<string, T1>): T1;
  on(
    on: string | string[] | Record<string, Definition>,
    definition?: Definition
  ): Record<string, FragmentMeta> {
    const data: Record<string, FragmentMeta> = {};
    let fragments: Record<string, Definition> = {};

    if (typeof on === 'string') {
      fragments[on] = definition!;
    } else if (Array.isArray(on)) {
      on.forEach((key) => {
        fragments[key] = definition!;
      });
    } else {
      fragments = on;
    }

    Object.keys(fragments).forEach((key) => {
      data[createFragmentKey(key)] = {
        name: '',
        tmpName: '',
        on: key,
        inline: true,
        definition: fragments[key],
      };
    });

    return data;
  }
}

export const types = new Types();
