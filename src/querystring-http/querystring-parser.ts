import { QueryParameterBag } from "../types"

export const parseQueryString = (querystring: string): QueryParameterBag => {
  let init: QueryParameterBag = {};
  if (!querystring) return init;

  querystring = querystring.replace(/^\?/, "");
  const query = querystring.split("&").sort().reduce((acc, part) => {
    const [key, value = null] = part.split("=");
    if (!value) return acc;

    const resolvedKey = decodeURIComponent(key);
    const resolvedValue = decodeURIComponent(value);
    acc[resolvedKey] = resolvedValue;
    return acc;
  }, init);

  return query;
};
