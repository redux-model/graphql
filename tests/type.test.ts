import { graphql, type } from '../src';

describe('Type definition', () => {
  it ('number', () => {
    const tpl = graphql.query({
      hello: type.number,
    });

    (function () {
      tpl.type.hello.toFixed();
    });
  });

  it ('string', () => {
    const tpl = graphql.query({
      hello: type.string,
    });

    (function () {
      tpl.type.hello.toLowerCase();
    });
  });

  it ('boolean', () => {
    const tpl = graphql.query({
      hello: type.boolean,
    });

    (function () {
      tpl.type.hello.valueOf();
    });
  });

  it ('custom', () => {
    const tpl = graphql.query({
      hello: type.custom<'User'>(),
      hi: type.custom<1>(),
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
      hello: type.array({
        id: type.number,
        name: type.string,
        vip: type.boolean.undefined,
      }),
    });

    const tpl2 = graphql.query({
      hello: type.array(type.number),
      hi: type.array(type.object({
        man: type.string,
      })),
      wow: type.array(type.string.undefined),
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
          world: type.number,
        },
        hello: type.string,
      },
    });

    const tpl2 = graphql.query({
      hello: {
        hi: type.object({
          world: type.number,
        }),
        hello: type.string,
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
      hello: type.number.string,
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
      hello: type.number.string.boolean,
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
      hello: type.number.string.boolean.undefined,
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
      hello: type.number.undefined,
    });

    (function () {
      tpl.type.hello?.toFixed();
      // @ts-expect-error
      tpl.type.hello.toFixed();
    });
  });

  it ('string + undefined', () => {
    const tpl = graphql.query({
      hello: type.string.undefined,
    });

    (function () {
      tpl.type.hello?.toLowerCase();
      // @ts-expect-error
      tpl.type.hello.toLowerCase();
    });
  });

  it ('function ()=> object', () => {
    const tpl = graphql.query({
      hello: type.fn(['a_Int', 'b_String'], {
        id: type.number,
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
      hello: type.fn(['a_Int!', 'b_String'], type.number),
    });

    (function () {
      tpl.type.hello.toFixed();
    });
  });

  it ('function ()=> array', () => {
    const tpl = graphql.query({
      hello: type.fn([], type.array({
        id: type.number,
        name: type.string,
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
      hello: type.fn([], {
        id: type.number,
        name: type.string,
      }),
    });

    (function () {
      tpl.type.hello.name.toLowerCase();
      // @ts-expect-error
      tpl.type.hello.forEach;
    });
  });

  it ('inline fragment', () => {
    const tpl = graphql.query({
      hello: {
        id: type.number,
        name: type.string,
        ...type.on({
          User: {
            kind: type.custom<'User'>(),
            age: type.number,
            age1: type.number,
          },
          Admin: {
            kind: type.custom<'Admin'>(),
            age: type.string.undefined,
            age2: type.number,
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
      hello: type.number,
      hi: type.string.undefined,
      man: {
        woman: type.number,
      }
    });

    const adminFragment = graphql.fragment({ name: 'admin', on: 'Admin' }, {
      age: type.number,
    });

    const tpl = graphql.query({
      id: type.number,
      ...usreFragment,
      list: type.fn(['id_Int'], {
        id: type.string.include(''),
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
      list: type.fn(['a_Int'], {
        id: type.number,
        name: type.string,
      }),
    });

    const tpl = graphql.query({
      result: type.fn(['b_String'], {
        id: type.number,
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
      hello: type.number.include('red_Boolean'),
      hi: type.string,
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
      hello: type.number.skip('red_Boolean'),
      hi: type.string,
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
