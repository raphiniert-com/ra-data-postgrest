import { fetchUtils, DataProvider } from 'ra-core';
declare type PrimaryKey = Array<string>;
declare const _default: (apiUrl: any, httpClient?: (url: any, options?: fetchUtils.Options) => Promise<{
    status: number;
    headers: Headers;
    body: string;
    json: any;
}>, defaultListOp?: string, primaryKeys?: Map<string, PrimaryKey>) => DataProvider;
export default _default;
