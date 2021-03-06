import { expect } from 'chai';
import { graphql, types } from '../src';

describe('Graphql', () => {
  it('normal query', () => {
    const tpl = graphql.query({
      hello: types.number.null,
      hi: types.undefined.string,
      how: types.boolean
    });

    expect(tpl({}).query).to.equal(
`query Hello {
  hello
  hi
  how
}`
    );
  });

  it('normal mutation', () => {
    const tpl = graphql.mutation({
      hello: types.number.null,
      hi: types.undefined.string,
      how: types.boolean
    });

    expect(tpl({}).query).to.equal(
`mutation Hello {
  hello
  hi
  how
}`
    );
  });

  it('normal subscription', () => {
    const tpl = graphql.subscription({
      hello: types.number.null,
      hi: types.undefined.string,
      how: types.boolean
    });

    expect(tpl({}).query).to.equal(
`subscription Hello {
  hello
  hi
  how
}`
    );
  });

  it ('object query', () => {
    const tpl = graphql.query({
      hello: types.number,
      hi: {
        how: types.undefined.string,
        are: {
          you: {
            lucy: types.string,
          },
        },
      }
    });

    expect(tpl({}).query).to.equal(
`query Hello {
  hello
  hi {
    how
    are {
      you {
        lucy
      }
    }
  }
}`
    );
  });

  it ('array query', () => {
    const tpl = graphql.query({
      hello: types.number,
      hi: {
        how: types.undefined.string,
        are: {
          you: types.array({
            lucy: types.string,
          }),
        },
      }
    });

    expect(tpl({}).query).to.equal(
`query Hello {
  hello
  hi {
    how
    are {
      you {
        lucy
      }
    }
  }
}`
    );
  });

  it ('function query', () => {
    const tpl = graphql.query({
      hello: types.number,
      hi: types.fn(['a: Int!'], {
        how: types.undefined.string,
        are: {
          you: types.boolean,
        },
      }),
      body: types.fn(['b: Int'], types.boolean).include('c: Boolean'),
    });

    expect(tpl({ a: 3, b: 3, c: true }).query).to.equal(
`query Hello ($a: Int!, $b: Int, $c: Boolean) {
  hello
  hi (a: $a) {
    how
    are {
      you
    }
  }
  body (b: $b) @include(if: $c)
}`
    );
  });

it ('function in function', () => {
  const tpl = graphql.query({
    hello: types.number,
    hi: types.fn(['a: Int!'], {
      how: types.undefined.string,
      are: {
        you: types.fn(['b: Int'], types.boolean),
      },
    }),
  });

  expect(tpl({ a: 3, b: 3 }).query).to.equal(
`query Hello ($a: Int!, $b: Int) {
  hello
  hi (a: $a) {
    how
    are {
      you (b: $b)
    }
  }
}`
  );
});

  it ('wrong function parameter name', () => {
    const tpl = graphql.query({
      // @ts-expect-error
      hello: types.fn(['a'], {}),
    });

    expect(() => tpl({ a: 0 })).to.throw();
  });

  it ('function with duplicate parameter', () => {
    const tpl = graphql.query({
      hello:  types.fn(['a: Int', 'b: String'], {
        id: types.number,
      }),
      hi: types.fn(['a: Int', 'b: String'], {
        how: types.undefined.string,
        are: {
          you: types.boolean,
        },
      }),
    });

    expect(tpl({ a: 3, b: '2' }).query).to.equal(
`query Hello ($a: Int, $b: String) {
  hello (a: $a, b: $b) {
    id
  }
  hi (a: $a, b: $b) {
    how
    are {
      you
    }
  }
}`
    );
  });

  it ('function parameter with alias variable', () => {
    const tpl = graphql.query({
      hello: types.number,
      hi: types.fn(['a as other: Int', 'b: String'], {
        how: types.undefined.string,
        are: {
          you: types.boolean,
        },
      }),
    });

    expect(tpl({ other: 3, b: '666' }).query).to.equal(
`query Hello ($other: Int, $b: String) {
  hello
  hi (a: $other, b: $b) {
    how
    are {
      you
    }
  }
}`
    );

    expect(tpl({ other: 3, b: '666' }).variables).to.contain({
      other: 3,
      b: '666',
    });
  });

  it ('function returns boolean, number or string', () => {
    const tpl = graphql.query({
      hello: types.fn(['a: Int'], types.boolean),
      hi: types.fn(['a: Int'], types.number),
      how: types.fn(['a: Int'], types.string),
      are: types.fn(['a: Int'], types.number.string.undefined.null),
    });

    expect(tpl({ a: 3 }).query).to.equal(
`query Hello ($a: Int) {
  hello (a: $a)
  hi (a: $a)
  how (a: $a)
  are (a: $a)
}`
    );
  });

  it('alias', () => {
    const tpl = graphql.query({
      hello: types.number.aliasOf('h'),
      hi: types.undefined.string.aliasOf('hii'),
      how: types.aliasOf('who').object({
        are: types.boolean,
      }),
      list: types.aliasOf('result').fn(['a: Int'], {
        id: types.number,
      }),
    });

    expect(tpl({ a: 0 }).query).to.equal(
`query Hello ($a: Int) {
  hello: h
  hi: hii
  how: who {
    are
  }
  list: result (a: $a) {
    id
  }
}`
    );
  });

  it('inline fragment', () => {
    const tpl = graphql.query({
      hello: types.number,
      hi: types.undefined.string,
      ...types.union(
        types.on('User', {
          id: types.number,
          name: {
            desc: types.string,
          }
        }),
        types.on('Admin', {
          id: types.number,
          name1: {
            desc1: types.string,
          }
        }),
      ),
      ...types.on(['User', 'Admin'], {
        id1: types.number,
        title1: types.string,
      }),
      ...types.on('User', {
        id2: types.number,
        title2: types.string,
      }),
    });

    expect(tpl({}).query).to.equal(
`query Hello {
  hello
  hi
  ... on User {
    id
    name {
      desc
    }
  }
  ... on Admin {
    id
    name1 {
      desc1
    }
  }
  ... on User {
    id1
    title1
  }
  ... on Admin {
    id1
    title1
  }
  ... on User {
    id2
    title2
  }
}`
    );
  });

  it ('fragment', () => {
    const fragment = graphql.fragment('User', {
      id: types.number,
      name: types.string,
    });

    const adminFragment = graphql.fragment('Admin', {
      i: types.number,
      j: types.boolean,
      k: types.undefined,
    })

    const tpl = graphql.query({
      hello: types.number,
      hi: types.undefined.string,
      ...fragment,
      ok: {
        ...fragment,
        ...adminFragment,
      }
    });

    expect(tpl({}).query).to.equal(
`query Hello {
  hello
  hi
  ...UserFragment
  ok {
    ...UserFragment
    ...AdminFragment
  }
}

fragment UserFragment on User {
  id
  name
}

fragment AdminFragment on Admin {
  i
  j
  k
}`
    );
  });

  it ('duplicate fragment', () => {
    const fragment = graphql.fragment('User', {
      id: types.number,
      name: types.string,
    });

    const fragment1 = graphql.fragment('User', {
      i: types.number,
      j: types.boolean,
      k: types.undefined,
    });

    const tpl = graphql.query({
      hello: types.number,
      hi: types.undefined.string,
      ...fragment,
      ok: {
        ...fragment,
        ...fragment1,
      }
    });

    expect(tpl({}).query).to.equal(
`query Hello {
  hello
  hi
  ...UserFragment
  ok {
    ...UserFragment
    ...UserFragment_1
  }
}

fragment UserFragment on User {
  id
  name
}

fragment UserFragment_1 on User {
  i
  j
  k
}`
    );
  });

  it ('fragment with specific name', () => {
    const fragment = graphql.fragment('User', {
      id: types.number,
      name: types.string,
    });

    const fragment1 = graphql.fragment({ name: 'customUserFragment', on: 'User' }, {
      i: types.number,
      j: types.boolean,
      k: types.undefined,
    })

    const tpl = graphql.query({
      hello: types.number,
      hi: types.undefined.string,
      ...fragment,
      ok: {
        ...fragment,
        ...fragment1,
      }
    });

    expect(tpl({}).query).to.equal(
`query Hello {
  hello
  hi
  ...UserFragment
  ok {
    ...UserFragment
    ...customUserFragment
  }
}

fragment UserFragment on User {
  id
  name
}

fragment customUserFragment on User {
  i
  j
  k
}`
    );
  });

  it ('fragment includes function', () => {
    const fragment = graphql.fragment('User', {
      id: types.number,
      name: types.fn(['id: Int'], {
        name: types.string,
      }),
    });

    const tpl = graphql.query({
      hello: types.number,
      hi: types.undefined.string,
      ...fragment,
      ok: {
        ...fragment,
      }
    });

    expect(tpl({ id: 0 }).query).to.equal(
`query Hello ($id: Int) {
  hello
  hi
  ...UserFragment
  ok {
    ...UserFragment
  }
}

fragment UserFragment on User {
  id
  name (id: $id) {
    name
  }
}`
    );
  });

  it ('fragment in fragment', () => {
    const fragment = graphql.fragment('User', {
      id: types.number,
      fn1: types.fn(['a: Int'], types.number),
    });

    const fragment1 = graphql.fragment('Admin', {
      name: types.string,
      ...fragment,
    });

    const fragment2 = graphql.fragment('Admin', {
      age: types.number,
      ...fragment1,
    });

    const tpl = graphql.query({
      hello: {
        ...fragment2,
      },
    });

    expect(tpl({
      a: 2,
    }).query).to.equal(
`query Hello ($a: Int) {
  hello {
    ...AdminFragment
  }
}

fragment UserFragment on User {
  id
  fn1 (a: $a)
}

fragment AdminFragment_1 on Admin {
  name
  ...UserFragment
}

fragment AdminFragment on Admin {
  age
  ...AdminFragment_1
}`
    );
  });

  it ('inline fragment in inline fragment', () => {
    const tpl = graphql.query({
      hello: {
        ...types.on('User', {
          id: types.number,
          ...types.on('Admin', {
            name: types.string,
            fn1: types.fn(['b: Int'], {
              id: types.number,
            }),
          }),
        })
      }
    });

    expect(tpl({ b: 2 }).query).to.equal(
`query Hello ($b: Int) {
  hello {
    ... on User {
      id
      ... on Admin {
        name
        fn1 (b: $b) {
          id
        }
      }
    }
  }
}`
    );
  });

  it ('directives', () => {
    const tpl = graphql.query({
      hello: types.number.include('b:Boolean'),
      hi: types.include('b:Boolean').skip('c:Boolean').fn(['a: Int'], {
        how: types.undefined.string,
        are: {
          you: types.boolean,
        },
      }),
      ...types.include('d:Boolean').on('User', {
        name: types.string,
      }),
      ...types.include('f:Boolean').on('User', {
        lists: {
          id: types.number,
        }
      }),
    });

    expect(tpl({ a: 3, b: false, c: true, d: true, f: true }).query).to.equal(
`query Hello ($b: Boolean, $c: Boolean, $a: Int, $d: Boolean, $f: Boolean) {
  hello @include(if: $b)
  hi (a: $a) @include(if: $b) @skip(if: $c) {
    how
    are {
      you
    }
  }
  ... on User @include(if: $d) {
    name
  }
  ... on User @include(if: $f) {
    lists {
      id
    }
  }
}`
    );
  });

  it ('template with custom name', () => {
    const tpl = graphql.mutation({
      id: types.number,
    }, {
      name: 'CustomMutation',
    });

    expect(tpl.toString()).to.equal(
`mutation CustomMutation {
  id
}`
    );
  });
});
