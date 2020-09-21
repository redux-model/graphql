# redux-model-graphql
Graphql模板运行时工具，自动生成标准模板和Typescript类型， 配合[Redux-Model](https://github.com/redux-model/redux-model)实现graphql请求。

[![License](https://img.shields.io/github/license/redux-model/graphql)](https://github.com/redux-model/graphql/blob/master/LICENSE)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/redux-model/graphql/CI/master)](https://github.com/redux-model/graphql/actions)
[![Codecov](https://img.shields.io/codecov/c/github/redux-model/graphql)](https://codecov.io/gh/redux-model/graphql)


# 安装
```bash
yarn add @redux-model/graphql
```

# 注意事项
因为action本来就定义了参数，所以函数参数不再做类型约束。函数参数需遵循：`xxx_Int`, `yyy_String!`, `zzz_ObjInput`，以下划线`_`分割参数名和类型，这么做的好处是：

1. 能够自动收集参数到模板顶部，提高效率
2. 传递实参时，对类型一目了然，防止出错

# 基础用法
```typescript
import { Model } from '@redux-model/react';
import { types, graphql } from '@redux-model/graphql';

const getUserTpl = graphql.query({
  getUser: {
    id: types.number,   // number
    name: types.string, // string
    bankAccount: {     // object
      id: types.number,
      branch: types.string.number,   // string | number
    },
  }
});

// console.log(getUserTpl.toString());

// 生成模板：
// query GetUser {
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
    id: types.number,
    logs: types.fn(['page_Int', 'size_Int'], types.array({
      id: types.number,
      title: types.string,
    })),
  }
});

// 生成模板：
// query GetUser ($page: Int, $size: Int) {
//   getUser: {
//     id
//     logs (page: $page, size: $size) {
//       id
//       title
//     }
//   }
// }

// 在模型中使用
type Response = {
  data: typeof tpl.type;
};

type Data = Response['data'];

class TestModel extends Model<Data> {
  getUser = $api.action((page: number, size: number = 10) => {
    return this
      .post<Response>('/graphql')
      .graphql(tpl({
        page_Int: page,
        size_Int: size,
      }))
      .onSuccess((state, action) => {
        return action.response.data;
      });
  });

  protected initialState(): Data {
    return {};
  }
}
```

# 片段
```typescript
const fragment1 = graphql.fragment('User', {
  name: types.string,
});

const tpl = graphql.query({
  getUser: {
    id: types.number,
    ...fragment1,
  }
});

// 生成模板：
// query GetUser {
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
    id: types.number,
    ...types.on('User', {
      name: types.string,
    }),
    ...types.on(['Hero', 'Thief'], {
      age: types.number,
    }),
  }
});

// 生成模板：
// query GetUser {
//   getUser: {
//     id
//     ... on User {
//       name
//     }
//     ... on Hero {
//       age
//     }
//     ... on Thief {
//       age
//     }
//   }
// }
```

# 互斥内联片段
生成的模板和内联片段一样，但是在类型上是互斥的
```typescript
const tpl = graphql.query({
  getUser: {
    id: types.number,
    ...types.union(
      types.on('User', {
        kind: types.custom<'User'>(),
        name: types.string,
        age: types.number,
      }),
      types.on('Admin', {
        kind: types.custom<'Admin'>(),
        name1: types.string,
        age1: types.number,
      }),
    )
  }
});

// 生成模板：
// query GetUser {
//   getUser: {
//     id
//     ... on User {
//       kind
//       name
//       age
//     }
//     ... on Admin {
//       kind
//       name1
//       age1
//     }
//   }
// }
```

您可以通过判断来确定哪个字段存在

```typescript
if (getUser.kind === 'User') {
  // getUser.name
  // getUser.age
} else if (getUser.kind === 'Admin') {
  // getUser.name1
  // getUser.age1
}

if ('age' in getUser) {
  // getUser.name
  // getUser.age
} else if ('age1' in getUser) {
  // getUser.name1
  // getUser.age1
}
```

**⚠️注意：互斥内联片段无法收集函数参数名。暂无解决方案！！**

# 指令
```typescript
const tpl = graphql.query({
  getUser: {
    id: types.number.include('test_Boolean'),   // number | undefined
    logs: types.skip('other_Boolean').object({  // object | undefined
      id: types.number,
      title: types.string,
    }),
  }
});

// 生成模板：
// query GetUser ($test: Boolean, $other: Boolean) {
//   getUser: {
//     id @include(if: $test)
//     logs @skip(if: $other) {
//       id
//       title
//     }
//   }
// }
```
