import { FragmentMeta, isFragment } from './fragment';
import { Template, TemplateObj, Types } from './types';

export interface ParseContext {
  params: string[];
  fragmentStrs: string[];
  fragmentObjs: FragmentMeta[];
  fragmentIndex: Record<string, number>;
  paramAlias: Record<string, string>,
}

export const parse = (type: string, name: string | undefined, nodes: TemplateObj, ctx: ParseContext): string => {
  name = name || capitalize(Object.keys(nodes)[0]);

  const body = cycleParse(nodes, ctx, -2);
  const params = ctx.params.map((key) => {
    const param = parseParameter(key);
    ctx.paramAlias[key] = param.variable;

    return `$${param.variable}: ${param.type}`;
  });
  const paramStr = params.length ? ` (${params.join(', ')})` : '';

  return `${type} ${name}${paramStr}${body}${ctx.fragmentStrs.join('')}`;
};

const cycleParse = (nodes: Template, ctx: ParseContext, space: number): string => {
  if (nodes instanceof Types) {
    collectParams(nodes.totalParams, ctx);

    const realName = nodes.realName ? `: ${nodes.realName}` : '';
    const directives = renderInclude(nodes.includeParam) + renderSkip(nodes.skipParam);

    // function
    if (nodes.fnParams) {
      const params = nodes.fnParams.map((key) => {
        const param = parseParameter(key);
        return `${param.name}: $${param.variable}`;
      }).join(', ');

      return `${realName} (${params})${directives}${cycleParse(nodes.returns!, ctx, space)}`;
    }

    // Object or Array
    if (nodes.returns) {
      return `${realName}${directives}${cycleParse(nodes.returns, ctx, space)}`;
    }

    // string, number or boolean
    return realName + directives;
  }

  const newNodes: Record<string, string> = {};

  // object
  Object.keys(nodes).forEach((key) => {
    const node = nodes[key]!;

    // fragment
    if (isFragment(key)) {
      // @ts-ignore
      const fragment: FragmentMeta = node;
      const directives = renderInclude(fragment.includeParam) + renderSkip(fragment.skipParam);

      collectParams([fragment.includeParam, fragment.skipParam], ctx);

      if (fragment.inline) {
        newNodes[key] = `... on ${fragment.on}${directives}${cycleParse(fragment.template, ctx, space + 2)}`;
      } else {
        if (!~ctx.fragmentObjs.indexOf(fragment)) {
          ctx.fragmentObjs.push(fragment);
          ctx.fragmentStrs.push(parseFragment(fragment, ctx));
        }
        newNodes[key] = `...${fragment.tmpName}${directives}`;
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

  return `\n\nfragment ${fragment.tmpName} on ${fragment.on}${cycleParse(fragment.template, ctx, -2)}`;
};

const parseParameter = (value: string) => {
  const alias_param = value.split(':');
  const param = alias_param.pop()!;
  const alias = alias_param.pop();

  const item = param.split('_');

  if (item.length < 2) {
    throw new Error(`Parmeter ${value} is invalid, try to define it like: "a_Int", "b_String", "alias:c_Int" and so on.`);
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

    if (isFragment(key)) {
      tpl += `\n${addSpace(space + 2)}${node}`;
      return;
    }

    tpl += `\n${addSpace(space + 2)}${key}${node}`;
  });

  tpl += `\n${addSpace(space)}}`;

  return tpl;
};

const renderInclude = (param?: string) => {
  return param ? ` @include(if: $${parseParameter(param).variable})` : '';
};

const renderSkip = (param?: string) => {
  return param ? ` @skip(if: $${parseParameter(param).variable})` : '';
};

const collectParams = (params: (string | undefined)[] | undefined, ctx: ParseContext) => {
  params && params.forEach((param) => {
    param && (~ctx.params.indexOf(param) || ctx.params.push(param));
  });
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
