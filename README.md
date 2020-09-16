```typescript
import { Model } from '@redux-model/react';
import { type, graphql } from '@redux-model/graphql';

const getUserTpl = graphql.query({
  a: type.undefined.json({
    i: type.number,
    j: {
      x: type.string,
      y: type.number,
    },
  }),
  b: type.null.string,
  c: type.undefined.number,
  d: type.number,
  e: type.string,
  f: type.array(type.number),
  g: type.fn(['x', 'y'], {
    m: type.number,
    n: type.string,
  }),
  i: type.is<KEY>(),
  j: type.on(['User'], {
    name: type.string,
  }),
  k: type.on({
    User: {
      name: type.string,
    },
    Admin: {
      name: type.number,
    },
  })
});

// type tpl = {
//   (variables: Args) => string;
//   type: {
//     a: string;
//   }
// }

type Response = {
  data: typeof getUserTpl.type;
};

interface Data {
  list?: Response['data'];
};

class TestModel extends Model<Data> {
  getUser = $api.action(() => {
    return this
      .post<Response>('/graphql')
      .graphql(getUserTpl({
        x: 2,
        y: 3,
      }))
      .onSuccess((state, action) => {
        state.list = action.response.data;
      });
  });

  protected initialState(): Data {
    return {};
  }
}
```
