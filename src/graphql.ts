import { fragment } from './fragment';
import { Context, query } from './query';

const createContext = (type: string): typeof query => {
  return query.bind(<Context>{
    type: type,
  });
};

export const graphql = {
  query: createContext('query'),
  mutation: createContext('mutation'),
  subscription: createContext('subscription'),
  fragment: fragment,
}
