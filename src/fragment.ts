import { Template, TemplateObj } from './types';

export type FragmentMeta = {
  name: string;
  tmpName?: string;
  on: string;
  inline: boolean;
  template: Template;
  includeParam?: string;
  skipParam?: string;
};

const fragmentKey = '_#$_FRAGMENTS_$#_';
let fragmentKeyIndex = 0;

export const createFragmentKey = () => {
  return fragmentKey + '@' + ++fragmentKeyIndex;
};

export const isFragment = (key: string) => {
  return key.indexOf(fragmentKey) === 0;
};

export interface Option {
  on: string;
  name: string;
}

export const fragment = <T extends TemplateObj<K, V>, K extends any, V extends any>(on: string | Option, nodes: T): T => {
  const option: Option = typeof on === 'string' ? { name: '', on } : on;

  // @ts-ignore
  return {
    [createFragmentKey()]: <FragmentMeta>{
      on: option.on,
      name: option.name,
      inline: false,
      template: nodes,
    }
  };
};
