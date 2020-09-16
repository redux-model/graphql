import { Definition } from './parse';

export const fragmentKey = '_###_fragment_';

export type FragmentMeta = {
  name: string;
  tmpName: string;
  on: string;
  inline: boolean;
  definition: Record<string, Definition<any, any>>;
};

let fragmentKeyIndex = 0;

export const createFragmentKey = (on: string) => {
  return fragmentKey + on + '@' + ++fragmentKeyIndex;
};

export const fragment = <T extends Record<string, Definition<K, V>>, K extends any, V extends any>(on: string | { name: string; on: string }, definition: T): T => {
  const meta: { on: string; name: string } = typeof on === 'string' ? {
    name: '',
    on,
  } : on;

  // @ts-ignore
  return {
    [createFragmentKey(meta.on)]: <FragmentMeta>{
      on: meta.on,
      name: meta.name,
      tmpName: '',
      inline: false,
      definition: definition,
    }
  };
};
