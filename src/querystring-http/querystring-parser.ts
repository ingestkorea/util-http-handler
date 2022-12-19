import { QueryParameterBag } from "../types"

export const parseQueryString = (querystring: string): QueryParameterBag => {
  const init: QueryParameterBag = {};
  if (!querystring) return init;

  querystring = querystring.replace(/^\?/, "")
  const query = querystring.split("&").sort().reduce((acc, part) => {
    const [qsKey, qsValue = null] = part.split("=");

    const key = decodeURIComponent(qsKey);
    const value = qsValue ? decodeURIComponent(qsValue) : qsValue;

    if (!(key in acc)) {
      acc[key] = value;
    } else if (Array.isArray(acc[key])) {
      (acc[key] as string[]).push(value as string);
    } else {
      acc[key] = [acc[key] as string, value as string];
    };

    return acc;
  }, init);

  return query;
};
