import { fragmentKey, FragmentMeta } from './fragment';
import { Definition, Types } from './types';

export interface ParseContext {
  params: string[];
  fragmentStrs: string[];
  fragmentObjs: FragmentMeta[];
  fragmentIndex: Record<string, number>;
  paramAlias: Record<string, string>,
}

export const parse = (type: string, name: string | undefined, nodes: Definition, ctx: ParseContext): string => {
  name = name || capitalize(Object.keys(nodes)[0] || type);

  const body = cycleParse(nodes, ctx, -2);
  const params = ctx.params.map((key) => {
    const param = parseParameter(key);
    ctx.paramAlias[key] = param.variable;

    return `$${param.variable}: ${param.type}`;
  });
  const paramStr = params.length ? ` (${params.join(', ')})` : '';

  return `${type} ${name}${paramStr}${body}${ctx.fragmentStrs.join('')}`;
};

const cycleParse = (nodes: Definition, ctx: ParseContext, space: number): string => {
  if (nodes instanceof Types) {
    // collect args to top
    if (nodes.totalParams) {
      nodes.totalParams.forEach((arg) => {
        ~ctx.params.indexOf(arg) || ctx.params.push(arg);
      });
    }

    // alias
    const realName = nodes.realName ? `: ${nodes.realName}` : '';
    // directives
    const include = nodes.includeParam ? ` @include(if: $${parseParameter(nodes.includeParam).variable})` : '';
    const skip = nodes.skipParam ? ` @skip(if: $${parseParameter(nodes.skipParam).variable})` : '';
    const prefix = `${realName}${include}${skip}`;

    // function
    if (nodes.fnParams) {
      const params = nodes.fnParams.map((key) => {
        const param = parseParameter(key);
        return `${param.name}: $${param.variable}`;
      }).join(', ');

      return `${realName} (${params})${include}${skip}${cycleParse(nodes.returns!, ctx, space)}`;
    }

    // Object or Array
    if (nodes.returns) {
      return `${prefix}${cycleParse(nodes.returns, ctx, space)}`;
    }

    // string, number or boolean
    return prefix;
  }

  const newNodes: Record<string, string> = {};

  // object
  Object.keys(nodes).forEach((key) => {
    const node = nodes[key]!;

    // fragment
    if (key.indexOf(fragmentKey) === 0) {
      // @ts-ignore
      const fragment: FragmentMeta = node;

      if (fragment.inline) {
        newNodes[key] = `... on ${fragment.on}${cycleParse(fragment.definition, ctx, space + 2)}`;
      } else {
        if (!~ctx.fragmentObjs.indexOf(fragment)) {
          ctx.fragmentObjs.push(fragment);
          ctx.fragmentStrs.push(parseFragment(fragment, ctx));
        }
        newNodes[key] = `...${fragment.tmpName}`;
      }
    } else {
      newNodes[key] = cycleParse(node, ctx, space + 2);
    }
  });

  return render(newNodes, space + 2);
};

const parseFragment = (fragment: FragmentMeta, ctx: ParseContext): string => {
  const on = fragment.on;
  const index = ctx.fragmentIndex[on] = ctx.fragmentIndex[on] === undefined ? 0 : ctx.fragmentIndex[on] + 1;
  const suffix = index === 0 ? '' : `_${index}`;
  fragment.tmpName = fragment.name || `${fragment.on}Fragment${suffix}`;

  return `\n\nfragment ${fragment.tmpName} on ${fragment.on}${cycleParse(fragment.definition, ctx, -2)}`;
};

const parseParameter = (value: string) => {
  const alias_param = value.split(':');
  const param = alias_param.pop()!;
  const alias = alias_param.pop();

  const item = param.split('_');

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

const render = (nodes: Record<string, string>, space: number): string => {
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
  return preDefinedSpaces[length / 2] || '';
}

const capitalize = (value: string) => {
  return value.substr(0, 1).toUpperCase() + value.substr(1);
};
