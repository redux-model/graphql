import { isFragment } from './fragment';
import { parseParameter } from './parameter';

export const renderObject = (nodes: Record<string, string>, space: number): string => {
  let tpl = ` {`;

  Object.keys(nodes).forEach((key) => {
    const node = nodes[key];

    if (node === '') {
      tpl += `\n${renderSpace(space + 2)}${key}`;
      return;
    }

    if (isFragment(key)) {
      tpl += `\n${renderSpace(space + 2)}${node}`;
      return;
    }

    tpl += `\n${renderSpace(space + 2)}${key}${node}`;
  });

  tpl += `\n${renderSpace(space)}}`;

  return tpl;
};

export const renderDirectives = (includeParam?: string, skipParam?: string): string => {
  const include = includeParam ? ` @include(if: $${parseParameter(includeParam).variable})` : '';
  const skip = skipParam ? ` @skip(if: $${parseParameter(skipParam).variable})` : '';

  return include + skip;
};

const spaces = [
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

export const renderSpace = (length: number) => {
  return spaces[length / 2] || '';
}
