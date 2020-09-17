import { createFragmentKey, FragmentMeta } from './fragment';
import { Definition } from './parse';

export type Or<T, Next> = unknown extends T ? Next : Next | T;

export type Parse<T> = T extends Type<infer U, any> ? U : {
  [K in keyof T]: T[K] extends Type<infer U, any>
    ? U
    : T[K] extends Definition<any, any>
      ? Parse<T[K]>
      : never;
};

type ParseJson<T> = T extends Type<infer U, any>
  ? U
  : T extends object
    ? {
      [K in keyof T]: ParseJson<T[K]>;
    }
    : never;

export type VarParams<T> = T extends AnyType ? VarTypeParams<T> : VarObjectParams<T>;

type AnyType = Type<any, any>;

type VarTypeParams<T> = T extends Type<any, infer U>
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

export class Type<T, U> {
  public/*protected*/ fnParams?: string[];
  public/*protected*/ totalParams?: string[];
  public/*protected*/ realName?: string;
  public/*protected*/ includeData?: { param: string };
  public/*protected*/ skipData?: { param: string };
  public/*protected*/ returns?: Definition<any, any>;

  aliasOf(realName: string): this {
    const that = this.clone();
    that.realName = realName;
    return that;
  }

  protected appendArgs(names: string[]): void {
    this.totalParams = this.totalParams || [];
    this.totalParams.push.apply(this.totalParams, names);
  }

  protected clone(): this {
    // @ts-ignore
    const that: Type<any, any> = new this.constructor();

    if (this.fnParams) {
      that.fnParams = this.fnParams.slice();
    }

    if (this.totalParams) {
      that.totalParams = this.totalParams.slice();
    }

    if (this.includeData) {
      that.includeData = { ...this.includeData };
    }

    if (this.skipData) {
      that.skipData = { ...this.skipData };
    }

    this.realName && (that.realName = this.realName);
    this.returns && (that.returns = this.returns);

    // @ts-ignore
    return that;
  }

  get number(): Type<Or<T, number>, U> {
    return this;
  }

  get string(): Type<Or<T, string>, U> {
    return this;
  }

  get boolean(): Type<Or<T, boolean>, U> {
    return this;
  }

  get undefined(): Type<Or<T, undefined>, U> {
    return this;
  }

  get null(): Type<Or<T, null>, U> {
    return this;
  }

  custom<T1>(): Type<Or<T, T1>, U> {
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
  object<T1 extends Definition<K, V>, K extends any, V extends any>(items: T1): Type<Or<T, Parse<T1>>, Or<U, VarParams<T1>>> {
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
  ): Type<Or<T, Parse<T1>[]>, Or<U, VarParams<T1>>> {
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
  include<P extends string>(ifParam_Type: P): Type<Or<T, undefined>, Or<U, P>> {
    const that = this.clone();
    // FIXME: 一行内是否支持多个include或者skip？
    that.includeData = {
      param: ifParam_Type,
    };
    that.appendArgs([ifParam_Type]);
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
  skip<P extends string>(ifParam_Type: P): Type<Or<T, undefined>, Or<U, P>> {
    const that = this.clone();
    that.skipData = {
      param: ifParam_Type,
    };
    that.appendArgs([ifParam_Type]);
    return that;
  }

  /**
   *
   * @param {String[]} params_Type
   * For example: `page_Int` | `name_String` | `focus_Boolean` | `data_MyObject`
   * @param {Type} returns
   */
  fn<A extends string, B extends Definition<any, any>>(
    params_Type: A[],
    // @ts-ignore
    returns: B
  ): Type<Or<T, ParseJson<B>>, Or<U, A>> {
    const that = this.clone();
    that.fnParams = params_Type;
    that.returns = returns;
    that.appendArgs(params_Type);
    return that;
  }
}

export class AdvancedType<T = unknown, U = unknown> extends Type<T, U> {
  /**
   * ```
   * {
   *   lists {
   *     id
   *     ... on User {
   *       name
   *       age
   *     }
   *     ... on Admin {
   *       name
   *     }
   *   }
   * }
   * ```
   */
  on<A extends Record<string, any>>(fragments: Record<string, A>): A {
    const data: Record<string, FragmentMeta> = {};

    Object.keys(fragments).forEach((key) => {
      data[createFragmentKey(key)] = {
        name: '',
        tmpName: '',
        on: key,
        inline: true,
        definition: fragments[key],
      };
    });

    // @ts-ignore
    return data;
  }
}

export const types = new AdvancedType();
