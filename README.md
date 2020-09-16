# redux-model-graphql
Graphql模板运行时生成工具，同时支自动生成Typescript类型， 辅助[Redux-Model](https://github.com/redux-model/redux-model)实现graphql请求

[![License](https://img.shields.io/github/license/redux-model/graphql)](https://github.com/redux-model/graphql/blob/master/LICENSE)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/redux-model/graphql/CI/master)](https://github.com/redux-model/graphql/actions)
[![Codecov](https://img.shields.io/codecov/c/github/redux-model/graphql)](https://codecov.io/gh/redux-model/graphql)


# 安装
```bash
yarn add @redux-model/graphql
```

# 注意事项
* 函数参数需遵循：`xxx_Int`, `yyy_String!`, `zzz_ObjInput`，以下划线`_`分割参数名和类型，否则会报错

# 基础用法
```typescript
import { Model } from '@redux-model/react';
import { type, graphql } from '@redux-model/graphql';

const getUserTpl = graphql.query({
  getUser: {
    id: type.number,   // number
    name: type.string, // string
    bankAccount: {     // object
      id: type.number,
      branch: type.string.number,   // string | number
    },
  }
});

// console.log(getUserTpl.toString());
// 生成模板：
// query getUser {
//   getUser {
//     id
//     name
//     bankAccount {
//       id
//       branch
//     }
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
      .graphql(getUserTpl)
      .onSuccess((state, action) => {
        state.list = action.response.data;
      });
  });

  protected initialState(): Data {
    return {};
  }
}
```

# 函数
```typescript
const tpl = graphql.query({
  getUser: {
    id: type.number,
    logs: type.fn(['page_Int', 'size_Int'], type.array({
      id: type.number,
      title: type.string,
    })),
  }
});

// 生成模板：
// query getUser ($page: Int, $size: Int) {
//   getUser: {
//     id
//     logs (page: $page, size: $size) {
//       id
//       title
//     }
//   }
// }

// 在模型中使用
this
  .post('/graphql')
  .graphql(tpl({
    page_Int: 1,
    size_Int: 10,
  }))
  .onSuccess((state, action) => {});
```

# 片段
```typescript
const fragment1 = graphql.fragment('User', {
  name: type.string,
});

const tpl = graphql.query({
  getUser: {
    id: type.number,
    ...fragment1,
  }
});

// 生成模板：
// query getUse {
//   getUser: {
//     id
//     ...UserFragment
//   }
// }
//
// fragment UserFragment on User {
//   name
// }
```

# 内联片段
```typescript
const tpl = graphql.query({
  getUser: {
    id: type.number,
    ...type.on({
      User: {
        name: type.string,
      },
    }),
    ...type.on({
      Admin: {
        title: type.string,
      },
    }),
  }
});

// 生成模板：
// query getUse {
//   getUser: {
//     id
//     ... on User {
//       name
//     }
//     ... on Admin {
//       title
//     }
//   }
// }
```

# 互斥内联片段
生成的模板和内联片段一样，但是在类型上是互斥的
```typescript
const tpl = graphql.query({
  getUser: {
    id: type.number,
    ...type.on({
      User: {
        kind: type.custom<'User'>(),
        name: type.string,
        age: type.number,
      },
      Admin: {
        kind: type.custom<'Admin'>(),
        name1: type.string,
        age1: type.number,
      },
    }),
  }
});

// 生成模板：
// query getUse {
//   getUser: {
//     id
//     ... on User {
//       name
//       age
//     }
//     ... on Admin {
//       name1
//       age1
//     }
//   }
// }
```

您可以通过判断来确定哪个字段存在

```typescript
if (data.kind === 'User') {
  // data.name
} else if (data.kind === 'Admin') {
  // data.name1
}
```

# 指令
```typescript
const tpl = graphql.query({
  getUser: {
    id: type.number.include('test_Boolean'),   // number | undefined
    logs: type.skip('other_Boolean').object({  // object | undefined
      id: type.number,
      title: type.string,
    }),
  }
});

// 生成模板：
// query getUser ($test: Boolean, $other: Boolean) {
//   getUser: {
//     id @include(if: $test)
//     logs @skip(if: $other) {
//       id
//       title
//     }
//   }
// }
```
