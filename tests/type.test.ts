import { graphql, types } from '../src';

describe('Type definition', () => {
  it ('number', () => {
    const tpl = graphql.query({
      hello: types.number,
    });

    (function () {
      tpl.type.hello.toFixed();
    });
  });

  it ('string', () => {
    const tpl = graphql.query({
      hello: types.string,
    });

    (function () {
      tpl.type.hello.toLowerCase();
    });
  });

  it ('boolean', () => {
    const tpl = graphql.query({
      hello: types.boolean,
    });

    (function () {
      tpl.type.hello.valueOf();
    });
  });

  it ('custom', () => {
    const tpl = graphql.query({
      hello: types.custom<'User'>(),
      hi: types.custom<1>(),
    });

    (function () {
      tpl.type.hello === 'User';
      tpl.type.hi === 1;
      // @ts-expect-error
      tpl.type.hello === 'User1';
      // @ts-expect-error
      tpl.type.hi === 2;
    });
  });

  it ('array', () => {
    const tpl = graphql.query({
      hello: types.array({
        id: types.number,
        name: types.string,
        vip: types.boolean.undefined,
      }),
    });

    const tpl2 = graphql.query({
      hello: types.array(types.number),
      hi: types.array(types.object({
        man: types.string,
      })),
      wow: types.array(types.string.undefined),
    });

    (function () {
      tpl.type.hello.forEach;
      tpl.type.hello[0].id.toFixed();
      tpl.type.hello[0].name.toLowerCase();
      tpl.type.hello[0].vip?.valueOf();
      // @ts-expect-error
      tpl.type.hello[0].vip.valueOf();

      tpl2.type.hello.forEach;
      tpl2.type.hello[0].toFixed();
      tpl2.type.hi.forEach;
      tpl2.type.hi[0].man.toLowerCase();
      tpl2.type.wow.forEach;
      tpl2.type.wow[0]?.toLowerCase();
      // @ts-expect-error
      tpl2.type.wow[0].toLowerCase();
    });
  });

  it ('object', () => {
    const tpl = graphql.query({
      hello: {
        hi: {
          world: types.number,
        },
        hello: types.string,
      },
    });

    const tpl2 = graphql.query({
      hello: {
        hi: types.object({
          world: types.number,
        }),
        hello: types.string,
      },
    });

    (function () {
      tpl.type.hello.hi.world.toFixed();
      tpl2.type.hello.hi.world.toFixed();
      tpl.type.hello.hello.toLowerCase();
      tpl2.type.hello.hello.toLowerCase();
    });
  });

  it ('number + string', () => {
    const tpl = graphql.query({
      hello: types.number.string,
    });

    (function () {
      tpl.type.hello.valueOf();
      // @ts-expect-error
      tpl.type.hello.toFixed();
      // @ts-expect-error
      tpl.type.hello.toLowerCase();
    });
  });

  it ('number + string + boolean', () => {
    const tpl = graphql.query({
      hello: types.number.string.boolean,
    });

    (function () {
      tpl.type.hello.valueOf();
      // @ts-expect-error
      tpl.type.hello.toFixed();
      // @ts-expect-error
      tpl.type.hello.toLowerCase();
    });
  });

  it ('number + string + boolean + undefined', () => {
    const tpl = graphql.query({
      hello: types.number.string.boolean.undefined,
    });

    (function () {
      tpl.type.hello?.valueOf();
      // @ts-expect-error
      tpl.type.hello.valueOf();
      // @ts-expect-error
      tpl.type.hello.toFixed();
      // @ts-expect-error
      tpl.type.hello.toLowerCase();
    });
  });

  it ('number + undefined', () => {
    const tpl = graphql.query({
      hello: types.number.undefined,
    });

    (function () {
      tpl.type.hello?.toFixed();
      // @ts-expect-error
      tpl.type.hello.toFixed();
    });
  });

  it ('string + undefined', () => {
    const tpl = graphql.query({
      hello: types.string.undefined,
    });

    (function () {
      tpl.type.hello?.toLowerCase();
      // @ts-expect-error
      tpl.type.hello.toLowerCase();
    });
  });

  it ('function ()=> object', () => {
    const tpl = graphql.query({
      hello: types.fn(['a_Int', 'b_String'], {
        id: types.number,
      }),
    });

    (function () {
      tpl.type.hello.id.toFixed();
      // @ts-expect-error
      tpl.type.hello.notExist;

      const { query, variables } = tpl({
        a_Int: 1,
        b_String: 2,
        // @ts-expect-error
        c_WhatEver: 3,
      });

      query.toLowerCase();
      variables.a_Int;
      variables.b_String;
      // @ts-expect-error
      variables.c_WhatEver;
    });
  });

  it ('function ()=> number', () => {
    const tpl = graphql.query({
      hello: types.fn(['a_Int!', 'b_String'], types.number),
    });

    (function () {
      tpl.type.hello.toFixed();
    });
  });

  it ('function ()=> array', () => {
    const tpl = graphql.query({
      hello: types.fn([], types.array({
        id: types.number,
        name: types.string,
      })),
    });

    (function () {
      tpl.type.hello.forEach;
      tpl.type.hello[0].id.toFixed();
      tpl.type.hello[0].name.toLowerCase();
      tpl({});
    });
  });

  it ('function ()=> object', () => {
    const tpl = graphql.query({
      hello: types.fn([], {
        id: types.number,
        name: types.string,
      }),
    });

    (function () {
      tpl.type.hello.name.toLowerCase();
      // @ts-expect-error
      tpl.type.hello.forEach;
    });
  });

  it ('deep level function', () => {
    const tpl = graphql.query({
      hello: {
        name: types.fn(['a_Int'], types.boolean),
        world: {
          end: types.fn(['a1_Int'], types.boolean),
        }
      },
      hi: types.object({
        name: types.fn(['b_Int'], types.boolean),
      }),
      how: types.array({
        name: types.fn(['c_Int'], types.boolean),
      }),
      are: types.array(types.object({
        name: types.fn(['d_Int'], types.boolean),
      })),
    });

    (function() {
      tpl({
        a_Int: 2,
        a1_Int: 3,
        b_Int: 2,
        c_Int: 2,
        d_Int: 2,
      });

      tpl({
        a_Int: 2,
        a1_Int: 3,
        b_Int: 2,
        c_Int: 2,
        d_Int: 2,
        // @ts-expect-error
        not_exist: 4,
      });

      // @ts-expect-error
      tpl({
        a1_Int: 3,
        b_Int: 2,
        c_Int: 2,
        d_Int: 2,
      });

      // @ts-expect-error
      tpl({
        a_Int: 3,
        b_Int: 2,
        c_Int: 2,
        d_Int: 2,
      });

      // @ts-expect-error
      tpl({
        a_Int: 3,
        a1_Int: 3,
        c_Int: 2,
        d_Int: 2,
      });

      // @ts-expect-error
      tpl({
        a_Int: 3,
        a1_Int: 3,
        b_Int: 2,
        d_Int: 2,
      });

      // @ts-expect-error
      tpl({
        a_Int: 3,
        a1_Int: 3,
        b_Int: 2,
        c_Int: 2,
      });
    });
  });

  it ('inline fragment', () => {
    const tpl = graphql.query({
      hello: {
        id: types.number,
        name: types.string,
        ...types.on({
          User: {
            kind: types.custom<'User'>(),
            age: types.number,
            age1: types.number,
          },
          Admin: {
            kind: types.custom<'Admin'>(),
            age: types.string.undefined,
            age2: types.number,
          }
        })
      },
    });

    (function () {
      tpl.type.hello.name.toLowerCase();
      tpl.type.hello.id.toFixed();
      // @ts-expect-error
      tpl.type.hello.age.toFixed();
      // @ts-expect-error
      tpl.type.hello.age.toLowerCase();
      tpl.type.hello.age1?.toFixed();
      // @ts-expect-error
      tpl.type.hello.age1.toFixed();
      tpl.type.hello.age2?.toFixed();
      // @ts-expect-error
      tpl.type.hello.age2.toFixed();

      if (tpl.type.hello.kind === 'User') {
        tpl.type.hello.age.toFixed();
        tpl.type.hello.age1.toFixed();
        // @ts-expect-error
        tpl.type.hello.age2.toFixed();
      }

      if (tpl.type.hello.kind === 'Admin') {
        tpl.type.hello.age?.toLowerCase();
        // @ts-expect-error
        tpl.type.hello.age.toLowerCase();
        // @ts-expect-error
        tpl.type.hello.age1.toFixed();
        tpl.type.hello.age2.toFixed();
      }
    });
  });

  it ('fragment', () => {
    const usreFragment = graphql.fragment('User', {
      hello: types.number,
      hi: types.string.undefined,
      man: {
        woman: types.number,
      }
    });

    const adminFragment = graphql.fragment({ name: 'admin', on: 'Admin' }, {
      age: types.number,
    });

    const tpl = graphql.query({
      id: types.number,
      ...usreFragment,
      list: types.fn(['id_Int'], {
        id: types.string.include(''),
        ...usreFragment,
        ...adminFragment,
      }),
    });

    (function () {
      tpl.type.hello.toFixed();
      tpl.type.man.woman.toFixed();
      tpl.type.list.hello.toFixed();
      tpl.type.list.hi?.toLowerCase();
      // @ts-expect-error
      tpl.type.list.hi.toLowerCase();
      tpl.type.list.age.toFixed();
    });
  });

  it ('fragment with function', () => {
    const fragment = graphql.fragment('Admin', {
      list: types.fn(['a_Int'], {
        id: types.number,
        name: types.string,
      }),
    });

    const tpl = graphql.query({
      result: types.fn(['b_String'], {
        id: types.number,
      }),
      ...fragment
    });

    (function () {
      tpl({
        a_Int: 0,
        b_String: 1,
      });
    });
  });

  it ('include', () => {
    const tpl = graphql.query({
      hello: types.number.include('red_Boolean'),
      hi: types.string,
    });

    (function() {
      tpl.type.hello?.toFixed();
      // @ts-expect-error
      tpl.type.hello.toFixed();
      tpl.type.hi.toLowerCase();

      tpl({
        red_Boolean: true,
        // @ts-expect-error
        blue_Boolean: true,
      }).variables.red_Boolean;
    });
  });

  it ('skip', () => {
    const tpl = graphql.query({
      hello: types.number.skip('red_Boolean'),
      hi: types.string,
    });

    (function() {
      tpl.type.hello?.toFixed();
      // @ts-expect-error
      tpl.type.hello.toFixed();
      tpl.type.hi.toLowerCase();

      tpl({
        red_Boolean: true,
        // @ts-expect-error
        blue_Boolean: true,
      }).variables.red_Boolean;
    });
  });
});
