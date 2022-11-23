import { HeaderBag } from './types';
import { IncomingHttpHeaders } from "http";

export const getTransformedHeaders = (headers: IncomingHttpHeaders): HeaderBag => {
    const init: HeaderBag = {};
    const transformedHeaders = Object.keys(headers).reduce((acc, curr)=>{
        const headerName = curr;
        const headerValues = headers[headerName];
        if(!headerValues) return acc;
        
        acc[headerName] = Array.isArray(headerValues) ? headerValues.join(",") : headerValues
        return acc;
    }, init);
    return transformedHeaders;
};