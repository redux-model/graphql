import { ParseContext } from './parse';

export const parseParameter = (value: string) => {
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

export const collectParams = (params: (string | undefined)[] | undefined, ctx: ParseContext) => {
  params && params.forEach((param) => {
    param && (~ctx.params.indexOf(param) || ctx.params.push(param));
  });
};
