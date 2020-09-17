import { fragment } from './fragment';
import { createContext } from './query';

export const graphql = {
  query: createContext('query'),
  mutation: createContext('mutation'),
  subscription: createContext('subscription'),
  fragment: fragment,
};
