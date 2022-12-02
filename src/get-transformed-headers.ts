import { HeaderBag } from './types';
import { IncomingHttpHeaders } from "http";

export const getTransformedHeaders = (headers: IncomingHttpHeaders): HeaderBag => {
  const init: HeaderBag = {};
  const transformedHeaders = Object.keys(headers).reduce((acc, name) => {
    const headerValues = headers[name];
    if (!headerValues) return acc;

    acc[name] = Array.isArray(headerValues) ? headerValues.join(",") : headerValues
    return acc;
  }, init);
  return transformedHeaders;
};