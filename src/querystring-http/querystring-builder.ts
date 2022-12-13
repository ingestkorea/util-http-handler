import { QueryParameterBag } from '../types';

// Encoding for RFC3986
const hexEncode = (c: string) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`;
const encodeRFC3986URIComponent = (uri: string): string => {
  return encodeURIComponent(uri).replace(/[!'()*]/g, hexEncode);
};

export const buildQueryString = (query: QueryParameterBag): string => {
  let init: string[] = [];
  const parts = Object.keys(query).sort().reduce((acc, key) => {
    const value = query[key];
    if (value || typeof value === 'string') {
      let part = [encodeRFC3986URIComponent(key), encodeRFC3986URIComponent(value)].join('=');
      acc.push(part);
      return acc;
    };
    return acc;
  }, init);

  return parts.join("&");
};
