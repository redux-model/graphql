import { expect } from 'chai';
import { graphql, type } from '../src';

describe('Graphql', () => {
  it('normal query', () => {
    const tpl = graphql.query({
      hello: type.number.null,
      hi: type.undefined.string,
      how: type.boolean
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
      hello: type.number,
      hi: {
        how: type.undefined.string,
        are: {
          you: {
            lucy: type.string,
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
      hello: type.number,
      hi: {
        how: type.undefined.string,
        are: {
          you: type.array({
            lucy: type.string,
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
      hello: type.number,
      hi: type.fn(['a_Int'], {
        how: type.undefined.string,
        are: {
          you: type.boolean,
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
      hello: type.number,
      hi: type.include('b_Boolean').skip('c_Boolean').fn(['a_Int'], {
        how: type.undefined.string,
        are: {
          you: type.boolean,
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
      hello: type.fn(['a'], {}),
    });

    expect(() => tpl({ a: 0 })).to.throw();
  });

  it ('function with duplicate parameter', () => {
    const tpl = graphql.query({
      hello:  type.fn(['a_Int', 'b_String'], {
        id: type.number,
      }),
      hi: type.fn(['a_Int', 'b_String'], {
        how: type.undefined.string,
        are: {
          you: type.boolean,
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
      hello: type.number,
      hi: type.fn(['other:a_Int'], {
        how: type.undefined.string,
        are: {
          you: type.boolean,
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
      hello: type.number.aliasOf('h'),
      hi: type.undefined.string.aliasOf('hii'),
      how: type.aliasOf('who').object({
        are: type.boolean,
      }),
      list: type.aliasOf('result').fn(['a_Int'], {
        id: type.number,
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
      hello: type.number,
      hi: type.undefined.string,
      ...type.on({
        User: {
          id: type.number,
          name: {
            desc: type.string,
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
      id: type.number,
      name: type.string,
    });

    const adminFragment = graphql.fragment('Admin', {
      i: type.number,
      j: type.boolean,
      k: type.undefined,
    })

    const tpl = graphql.query({
      hello: type.number,
      hi: type.undefined.string,
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
      id: type.number,
      name: type.string,
    });

    const fragment1 = graphql.fragment('User', {
      i: type.number,
      j: type.boolean,
      k: type.undefined,
    });

    const tpl = graphql.query({
      hello: type.number,
      hi: type.undefined.string,
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
      id: type.number,
      name: type.string,
    });

    const fragment1 = graphql.fragment({ name: 'customUserFragment', on: 'User' }, {
      i: type.number,
      j: type.boolean,
      k: type.undefined,
    })

    const tpl = graphql.query({
      hello: type.number,
      hi: type.undefined.string,
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
      id: type.number,
      name: type.fn(['id_Int'], {
        name: type.string,
      }),
    });

    const tpl = graphql.query({
      hello: type.number,
      hi: type.undefined.string,
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
