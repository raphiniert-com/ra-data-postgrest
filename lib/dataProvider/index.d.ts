import { fetchUtils, DataProvider } from 'ra-core';
declare const _default: (apiUrl: any, httpClient?: (url: any, options?: fetchUtils.Options) => Promise<{
    status: number;
    headers: Headers;
    body: string;
    json: any;
}>, defaultListOp?: string) => DataProvider;
export default _default;
