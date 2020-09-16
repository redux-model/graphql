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
      hi: types.fn(['a_Int'], {
        how: types.undefined.string,
        are: {
          you: types.boolean,
        },
      }),
    });

    expect(tpl({ a_Int: 3 }).query).to.equal(
`query Hello ($a: Int) {
  hello
  hi (a: $a) {
    how
    are {
      you
    }
  }
}`
    );
  });

  it ('function query with diretives', () => {
    const tpl = graphql.query({
      hello: types.number,
      hi: types.include('b_Boolean').skip('c_Boolean').fn(['a_Int'], {
        how: types.undefined.string,
        are: {
          you: types.boolean,
        },
      }),
    });

    expect(tpl({ a_Int: 3, b_Boolean: false, c_Boolean: true }).query).to.equal(
`query Hello ($b: Boolean, $c: Boolean, $a: Int) {
  hello
  hi @include(if: $b) @skip(if: $c) (a: $a) {
    how
    are {
      you
    }
  }
}`
    );
  });

  it ('wrong function parameter name', () => {
    const tpl = graphql.query({
      hello: types.fn(['a'], {}),
    });

    expect(() => tpl({ a: 0 })).to.throw();
  });

  it ('function with duplicate parameter', () => {
    const tpl = graphql.query({
      hello:  types.fn(['a_Int', 'b_String'], {
        id: types.number,
      }),
      hi: types.fn(['a_Int', 'b_String'], {
        how: types.undefined.string,
        are: {
          you: types.boolean,
        },
      }),
    });

    expect(tpl({ a_Int: 3, b_String: '2' }).query).to.equal(
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
      hi: types.fn(['other:a_Int'], {
        how: types.undefined.string,
        are: {
          you: types.boolean,
        },
      }),
    });

    expect(tpl({ 'other:a_Int': 3 }).query).to.equal(
`query Hello ($other: Int) {
  hello
  hi (a: $other) {
    how
    are {
      you
    }
  }
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
      list: types.aliasOf('result').fn(['a_Int'], {
        id: types.number,
      }),
    });

    expect(tpl({ a_Int: 0 }).query).to.equal(
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
      ...types.on({
        User: {
          id: types.number,
          name: {
            desc: types.string,
          }
        },
      })
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
      name: types.fn(['id_Int'], {
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

    expect(tpl({ id_Int: 0 }).query).to.equal(
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
});
