import { FragmentMeta, isFragment } from './fragment';
import { collectParams, parseParameter } from './parameter';
import { renderObject, renderDirectives } from './render';
import { Template, TemplateObj, Types } from './types';

export interface ParseContext {
  params: string[];
  fragmentStrs: string[];
  fragmentObjs: FragmentMeta[];
  fragmentIndex: Record<string, number>;
}

export const parse = (type: string, name: string | undefined, nodes: TemplateObj, ctx: ParseContext): string => {
  if (!name) {
    const firstName = Object.keys(nodes)[0];
    name = firstName.substr(0, 1).toUpperCase() + firstName.substr(1);
  }

  const body = cycleParse(nodes, ctx, -2);
  const params = ctx.params.map((key) => {
    const param = parseParameter(key);

    return `$${param.variable}: ${param.type}`;
  });
  const paramStr = params.length ? ` (${params.join(', ')})` : '';

  return `${type} ${name}${paramStr}${body}${ctx.fragmentStrs.join('')}`;
};

const cycleParse = (nodes: Template, ctx: ParseContext, space: number): string => {
  if (nodes instanceof Types) {
    collectParams(nodes.totalParams, ctx);

    const realName = nodes.realName ? `: ${nodes.realName}` : '';
    const directives = renderDirectives(nodes.includeParam, nodes.skipParam);

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

  const stringNodes: Record<string, string> = {};

  // object
  Object.keys(nodes).forEach((key) => {
    const node = nodes[key]!;

    // fragment
    if (isFragment(key)) {
      // @ts-ignore
      const fragment: FragmentMeta = node;
      const directives = renderDirectives(fragment.includeParam, fragment.skipParam);

      collectParams([fragment.includeParam, fragment.skipParam], ctx);

      if (fragment.inline) {
        stringNodes[key] = `... on ${fragment.on}${directives}${cycleParse(fragment.template, ctx, space + 2)}`;
      } else {
        parseFragment(fragment, ctx);
        stringNodes[key] = `...${fragment.tmpName}${directives}`;
      }
    } else {
      stringNodes[key] = cycleParse(node, ctx, space + 2);
    }
  });

  return renderObject(stringNodes, space + 2);
};

const parseFragment = (fragment: FragmentMeta, ctx: ParseContext): void => {
  const fragmentObjs = ctx.fragmentObjs;

  if (~fragmentObjs.indexOf(fragment)) {
    return;
  }

  const { on, template, name } = fragment;
  const indexes = ctx.fragmentIndex;

  indexes[on] = indexes[on] === undefined ? 0 : indexes[on] + 1;
  const tmpName = fragment.tmpName = name || `${on}Fragment${indexes[on] === 0 ? '' : `_${indexes[on]}`}`;

  fragmentObjs.push(fragment);
  ctx.fragmentStrs.push(
    `\n\nfragment ${tmpName} on ${on}${cycleParse(template, ctx, -2)}`
  );
};
