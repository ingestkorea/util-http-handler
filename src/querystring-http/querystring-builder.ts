import { QueryParameterBag } from "../types";

// Encoding for RFC3986
const hexEncode = (c: string) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`;
const encodeRFC3986URIComponent = (uri: string): string => {
  return encodeURIComponent(uri).replace(/[!'()*]/g, hexEncode);
};

export const buildQueryString = (query: QueryParameterBag): string => {
  const init: string[] = [];
  const parts = Object.keys(query)
    .sort()
    .reduce((acc, key) => {
      const queryKey = encodeRFC3986URIComponent(key);
      const queryValue = query[key];

      if (Array.isArray(queryValue)) {
        const sortedValues = queryValue.sort();
        const parts = sortedValues.map((value) => [queryKey, encodeRFC3986URIComponent(value)].join("="));
        acc.push(...parts);
      } else if (queryValue || typeof queryValue === "string") {
        const part = [queryKey, encodeRFC3986URIComponent(queryValue)].join("=");
        acc.push(part);
      } else {
        acc.push(queryKey);
      }

      return acc;
    }, init);
  return parts.join("&");
};
