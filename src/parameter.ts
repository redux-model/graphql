import { ParseContext } from './parse';

export const parseParameter = (value: string) => {
  const match = value.match(/^([a-z0-9_]+)(?:\sas\s([a-z0-9_]+))?\s*:\s?(.+)$/i);

  if (!match) {
    throw new Error(`Parmeter ${value} is invalid, try to define it like: "a: Int", "b: String", "c as myAlias: Int" and so on.`);
  }

  const itemName = match[1];
  const alias = match[2];

  return {
    name: itemName,
    variable: alias || itemName,
    type: match[3],
  };
};

export const collectParams = (params: (string | undefined)[] | undefined, ctx: ParseContext) => {
  params && params.forEach((param) => {
    param && (~ctx.params.indexOf(param) || ctx.params.push(param));
  });
};
