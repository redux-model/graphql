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
      hello: types.fn(['a: Int', 'b:String'], {
        id: types.number,
      }),
    });

    (function () {
      tpl.type.hello.id.toFixed();
      // @ts-expect-error
      tpl.type.hello.notExist;

      const { query, variables } = tpl({
        a: 1,
        b: '2',
        // @ts-expect-error
        c_WhatEver: 3,
      });

      query.toLowerCase();
      // @ts-expect-error
      variables.c_WhatEver;
    });
  });

  it ('function ()=> number', () => {
    const tpl = graphql.query({
      hello: types.fn(['a:Int!', 'b:String'], types.number),
    });

    (function () {
      tpl({
        a: 1,
        // @ts-expect-error
        b: 2,
      });
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

  it ('function () => object include function', () => {
    const tpl = graphql.query({
      hello: types.fn(['a: String'], {
        id: types.number,
        name: types.fn(['b: Int'], types.string),
      }),
    });

    (function () {
      tpl.type.hello.name.toLowerCase();
      // @ts-expect-error
      tpl.type.hello.forEach;

      tpl({
        a: '2',
        b: 2,
        // @ts-expect-error
        c: '3',
      });
    });
  });

  it ('deep level function', () => {
    const tpl = graphql.query({
      hello: {
        name: types.fn(['a: Int'], types.boolean),
        world: {
          end: types.fn(['a1: Int'], types.boolean),
        }
      },
      hi: types.object({
        name: types.fn(['b: Int'], types.boolean),
      }),
      how: types.array({
        name: types.fn(['c: Int'], types.boolean),
      }),
      are: types.array(types.object({
        name: types.fn(['d: Int'], types.boolean),
      })),
    });

    (function() {
      tpl({
        a: 2,
        a1: 3,
        b: 2,
        c: 2,
        d: 2,
      });

      tpl({
        a: 2,
        a1: 3,
        b: 2,
        c: 2,
        d: 2,
        // @ts-expect-error
        not_exist: 4,
      });

      // @ts-expect-error
      tpl({
        a1: 3,
        b: 2,
        c: 2,
        d: 2,
      });

      // @ts-expect-error
      tpl({
        a: 3,
        b: 2,
        c: 2,
        d: 2,
      });

      // @ts-expect-error
      tpl({
        a: 3,
        a1: 3,
        c: 2,
        d: 2,
      });

      // @ts-expect-error
      tpl({
        a: 3,
        a1: 3,
        b: 2,
        d: 2,
      });

      // @ts-expect-error
      tpl({
        a: 3,
        a1: 3,
        b: 2,
        c: 2,
      });
    });
  });

  it ('inline fragment', () => {
    const tpl = graphql.query({
      hello: {
        id: types.number,
        name: types.string,
        ...types.union(
          types.on('User', {
            kind1: types.number,
            age: types.number,
            age1: types.number,
          }),
          types.on('Admin', {
            kind2: types.number,
            age: types.string.undefined,
            age2: types.number,
          })
        ),
        ...types.on('User', {
          title: types.string,
        }),
        ...types.include('m: Boolean').on('User', {
          title1: types.string,
        }),
        ...types.include('k: Boolean').on('Admin', {
          lists: {
            id: types.number,
          },
        }),
      },
    });

    (function () {
      tpl({
        m: true,
        k: true,
      });

      // @ts-expect-error
      tpl({});

      tpl({
        // @ts-expect-error
        abc_Boolean: true,
      });

      tpl.type.hello.name.toLowerCase();
      tpl.type.hello.id.toFixed();
      // @ts-expect-error
      tpl.type.hello.age.toFixed();
      // @ts-expect-error
      tpl.type.hello.age.toLowerCase();
      tpl.type.hello.title.toLowerCase();
      tpl.type.hello.title1?.toLowerCase();
      // @ts-expect-error
      tpl.type.hello.title1.toLowerCase();
      // @ts-expect-error
      tpl.type.hello.title.toFixed();
      // @ts-expect-error
      tpl.type.hello.title1.toFixed();

      if ('kind1' in tpl.type.hello) {
        tpl.type.hello.age.toFixed();
        tpl.type.hello.age1.toFixed();
        // @ts-expect-error
        tpl.type.hello.age2.toFixed();
      }

      if ('kind2' in tpl.type.hello) {
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
      list: types.fn(['id: Int'], {
        // @ts-expect-error
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
      list: types.fn(['a: Int'], {
        id: types.number,
        name: types.string,
      }),
    });

    const tpl = graphql.query({
      result: types.fn(['b:String'], {
        id: types.number,
      }),
      ...fragment
    });

    (function () {
      tpl({
        a: 0,
        b: '1',
      });

      tpl({
        a: 0,
        // @ts-expect-error
        b: 1,
      });
    });
  });

  it ('inline fragment with function', () => {
    const tpl = graphql.query({
      ...types.on('User', {
        fn1: types.fn(['a: Int'], types.boolean),
      }),
      hello: {
        hi: {
          ...types.on('Admin', {
            fn2: types.fn(['b: Int'], {
              id: types.number,
            }),
          })
        }
      }
    });

    (function () {
      tpl({
        a: 0,
        b: 2,
      });

      // @ts-expect-error
      tpl({
        a: 0,
      });

      // @ts-expect-error
      tpl({
        b: 0,
      });

      tpl({
        a: 0,
        b: 0,
        // @ts-expect-error
        c: 1,
      });
    });
  });

  it ('include', () => {
    const tpl = graphql.query({
      hello: types.number.include('red: Boolean'),
      hi: types.string,
    });

    (function() {
      tpl.type.hello?.toFixed();
      // @ts-expect-error
      tpl.type.hello.toFixed();
      tpl.type.hi.toLowerCase();

      tpl({
        red: true,
        // @ts-expect-error
        blue_Boolean: true,
      }).variables;
    });
  });

  it ('skip', () => {
    const tpl = graphql.query({
      hello: types.number.skip('red: Boolean'),
      hi: types.string,
    });

    (function() {
      tpl.type.hello?.toFixed();
      // @ts-expect-error
      tpl.type.hello.toFixed();
      tpl.type.hi.toLowerCase();

      tpl({
        red: true,
        // @ts-expect-error
        blue: true,
      }).variables;
    });
  });

  it ('fragment in fragment', () => {
    const usreFragment = graphql.fragment('User', {
      hello: types.number,
      hi: types.fn(['a: Int'], types.boolean),
      man: {
        woman: types.number,
      }
    });

    const adminFragment = graphql.fragment('Admin', {
      age: types.number,
      ...usreFragment,
    });

    const tpl = graphql.query({
      hello: {
        ...adminFragment,
      }
    });

    (function() {
      tpl({
        a: 2,
      });

      // @ts-expect-error
      tpl({});

      tpl({
        a: 2,
        // @ts-expect-error
        b: 2,
      });

      tpl.type.hello.age.toFixed();
      tpl.type.hello.man.woman.toFixed();
      // @ts-expect-error
      tpl.type.hello.man.child;
    });
  });

  it ('inline fragment in inline fragment', () => {
    const tpl = graphql.query({
      hello: {
        ...types.on('User', {
          id: types.number,
          ...types.on('Admin', {
            fn1: types.fn(['a: Int'], types.number),
          }),
        }),
      }
    });

    (function() {
      tpl({
        a: 2,
      });

      // @ts-expect-error
      tpl({});

      tpl({
        a: 2,
        // @ts-expect-error
        b: 2,
      });

      tpl.type.hello.fn1.toFixed();
      // @ts-expect-error
      tpl.type.hello.fn1.toLowerCase();
    });
  });

  it ('top level must be plain object', () => {
    (function() {
      graphql.query({});
      // @ts-expect-error
      graphql.query(types.number);
      // @ts-expect-error
      graphql.query(types.boolean.number);
      // @ts-expect-error
      graphql.query(types.object({}));
    });
  });

  it ('custom param type', () => {
    const tpl = graphql.query({
      hello: types.fn(['a: MyType', 'b: [MyType!]!'], {
        id: types.number,
        name: types.string,
      }),
    });

    (function() {
      tpl({
        a: 'xxx',
        b: [{ xxx: 'yy' }],
      });

      tpl({
        a: 2222,
        b: [false],
      });

      tpl({
        a: 2222,
        // @ts-expect-error
        b: false,
      });

      // @ts-expect-error
      tpl({
        a: 2222,
      });
    });
  });

  it ('params with alias', () => {
    const tpl = graphql.query({
      hello: types.fn(['a as aaa : MyType', 'b as bbb : [MyType!]!', 'c as CCc : Boolean'], {
        id: types.number,
        name: types.string,
      }),
    });

    (() => {
      tpl({
        aaa: 2,
        bbb: [3],
        CCc: true,
      });

      tpl({
        aaa: '4',
        bbb: [],
        CCc: false,
      });

      tpl({
        aaa: '4',
        bbb: [],
        // @ts-expect-error
        CCc: 'false',
      });
    })();
  });
});
