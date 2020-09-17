import { fragmentKey, FragmentMeta } from './fragment';
import { Base } from './types';

export type Definition<K, V> = Base<K, V> | {
  [key: string]: Definition<K, V> | undefined;
};

export interface ParseContext {
  args: string[];
  fragments: string[];
  fragmentObjs: FragmentMeta[];
  fragmentIndex: Record<string, number>;
  argAlias: Record<string, string>,
}

export const parse = (type: string, name: string | undefined, nodes: Definition<any, any>, ctx: ParseContext): string => {
  name = name || capitalize(Object.keys(nodes)[0] || type);

  const newNodes = cycleParse(nodes, ctx, -2);
  const argDict = ctx.args.map((key) => {
    const arg = parseParameter(key);
    ctx.argAlias[key] = arg.variable;

    return `$${arg.variable}: ${arg.type}`;
  }).filter(Boolean);

  const args = argDict.length ? ` (${argDict.join(', ')})` : '';
  const tpl = `${type} ${name}${args}${newNodes}${ctx.fragments.join('')}`;

  return tpl;
};

const cycleParse = (nodes: Definition<any, any>, ctx: ParseContext, space: number): any => {
  // types
  if (nodes instanceof Base) {
    // collect args to top
    if (nodes.totalArgs) {
      nodes.totalArgs.forEach((arg) => {
        if (!~ctx.args.indexOf(arg)) {
          ctx.args.push(arg);
        }
      });
    }

    // alias
    const realName = nodes.realName ? `: ${nodes.realName}` : '';
    // directives
    const include = nodes.includeData ? ` @include(if: $${parseParameter(nodes.includeData.arg).variable})` : '';
    const skip = nodes.skipData ? ` @skip(if: $${parseParameter(nodes.skipData.arg).variable})` : '';
    const prefix = `${realName}${include}${skip}`;

    // function
    if (nodes.fnArgs) {
      const args = nodes.fnArgs.map((key) => {
        const arg = parseParameter(key);
        return `${arg.name}: $${arg.variable}`;
      });

      return `${prefix} (${args.join(', ')})${cycleParse(nodes.returns!, ctx, space)}`;
    }

    // Object or Array
    if (nodes.returns) {
      return `${prefix}${cycleParse(nodes.returns, ctx, space)}`;
    }

    // normal string, number or boolean
    return prefix;
  }

  const newNodes = {};

  // object
  Object.keys(nodes).forEach((key) => {
    const node = nodes[key]!;

    // fragment
    if (key.indexOf(fragmentKey) === 0) {
      // @ts-ignore
      const fragment: FragmentMeta = node;

      if (fragment.inline) {
        const extraNodes = cycleParse(fragment.definition, ctx, space + 2);
        newNodes[key] = `... on ${fragment.on}${extraNodes}`;
      } else {
        if (!~ctx.fragmentObjs.indexOf(fragment)) {
          ctx.fragmentObjs.push(fragment);
          ctx.fragments.push(parseFragment(fragment, ctx));
        }
        newNodes[key] = `...${fragment.tmpName || key}`;
      }
    } else {
      newNodes[key] = cycleParse(node, ctx, space + 2);
    }
  });

  return parseObject(newNodes, space + 2);
};

const parseFragment = (fragment: FragmentMeta, ctx: ParseContext): string => {
  const on = fragment.on;
  const index = ctx.fragmentIndex[on] = ctx.fragmentIndex[on] === undefined ? 0 : ctx.fragmentIndex[on] + 1;
  const suffix = index === 0 ? '' : `_${index}`;
  fragment.tmpName = fragment.name || `${fragment.on}Fragment${suffix}`;

  return `\n\nfragment ${fragment.tmpName} on ${fragment.on}${cycleParse(fragment.definition, ctx, -2)}`;
};

const parseParameter = (value: string) => {
  let [alias, arg]: (string | undefined)[] = value.split(':');

  if (!arg) {
    arg = alias;
    alias = undefined;
  }

  const item = arg.split('_');

  if (item.length < 2) {
    throw new Error(`Parmeter ${value} is invalid, try to set it like: "a_Int", "b_String", "alias:c_Int" and so on.`);
  }

  const itemType = item.pop()!;
  const itemName = item.join('_');

  return {
    name: itemName,
    variable: alias || itemName,
    type: itemType,
  };
};

const parseObject = (nodes: Record<string, string>, space: number): string => {
  let tpl = ` {`;

  Object.keys(nodes).forEach((key) => {
    const node = nodes[key];

    if (node === '') {
      tpl += `\n${addSpace(space + 2)}${key}`;
      return;
    }

    if (~key.indexOf(fragmentKey)) {
      tpl += `\n${addSpace(space + 2)}${node}`;
      return;
    }

    tpl += `\n${addSpace(space + 2)}${key}${node}`;
  });

  tpl += `\n${addSpace(space)}}`;

  return tpl;
};

const preDefinedSpaces = [
  '',
  '  ',
  '    ',
  '      ',
  '        ',
  '          ',
  '            ',
  '              ',
  '                ',
  '                  ',
];

const addSpace = (length: number) => {
  return preDefinedSpaces[length / 2];
}

const capitalize = (value: string) => {
  return value.substr(0, 1).toUpperCase() + value.substr(1);
};
