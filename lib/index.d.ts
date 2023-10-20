import { DataProvider } from 'ra-core';
import { PrimaryKey, PostgRestOperator } from './urlBuilder';
/**
 * Maps react-admin queries to a postgrest REST API
 *
 * This REST dialect uses postgrest syntax
 *
 * @see https://postgrest.org/en/stable/api.html#embedded-filters
 *
 * @example
 *
 * getList          => GET    http://my.api.url/posts?order=title.asc&offset=0&limit=24&filterField=eq.value
 * getOne           => GET    http://my.api.url/posts?id=eq.123
 * getMany          => GET    http://my.api.url/posts?id=in.(123,456,789)
 * getManyReference => GET    http://my.api.url/posts?author_id=eq.345
 * create           => POST   http://my.api.url/posts
 * update           => PATCH  http://my.api.url/posts?id=eq.123
 * updateMany       => PATCH  http://my.api.url/posts?id=in.(123,456,789)
 * delete           => DELETE http://my.api.url/posts?id=eq.123
 * deleteMany       => DELETE http://my.api.url/posts?id=in.(123,456,789)
 *
 * @example
 *
 * import * as React from 'react';
 * import { Admin, Resource, fetchUtils } from 'react-admin';
 * import postgrestRestProvider,
 *      { IDataProviderConfig,
 *        defaultPrimaryKeys,
 *        defaultSchema } from '@raphiniert/ra-data-postgrest';
 *
 * import { PostList } from './posts';
 *
 * const config: IDataProviderConfig = {
 *     apiUrl: 'http://path.to.my.api/',
 *     httpClient: fetchUtils.fetchJson,
 *     defaultListOp: 'eq',
 *     primaryKeys: defaultPrimaryKeys,
 *     schema: defaultSchema
 * }
 *
 * const App = () => (
 *     <Admin dataProvider={postgrestRestProvider(config)}>
 *         <Resource name="posts" list={PostList} />
 *     </Admin>
 * );
 *
 * export default App;
 */
export type MetaOption = string | undefined;
export declare const defaultPrimaryKeys: Map<string, PrimaryKey>;
export declare const defaultSchema: () => string;
export interface IDataProviderConfig {
    apiUrl: string;
    httpClient: (string: any, Options: any) => Promise<any>;
    defaultListOp: PostgRestOperator;
    primaryKeys: Map<string, PrimaryKey>;
    schema: () => string;
}
declare const _default: (config: IDataProviderConfig) => DataProvider;
export default _default;
