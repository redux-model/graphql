import { Definition } from './types';

export const fragmentKey = '_###_fragment_';

export type FragmentMeta = {
  name: string;
  tmpName: string;
  on: string;
  inline: boolean;
  definition: Definition;
};

let fragmentKeyIndex = 0;

export const createFragmentKey = (on: string) => {
  return fragmentKey + on + '@' + ++fragmentKeyIndex;
};

export interface Option {
  on: string;
  name: string;
}

export const fragment = <T extends Record<string, Definition<K, V>>, K extends any, V extends any>(on: string | Option, definition: T): T => {
  const option: Option = typeof on === 'string' ? { name: '', on } : on;

  // @ts-ignore
  return {
    [createFragmentKey(option.on)]: <FragmentMeta>{
      on: option.on,
      name: option.name,
      tmpName: '',
      inline: false,
      definition: definition,
    }
  };
};
