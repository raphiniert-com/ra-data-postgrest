import {
    DataProvider,
    GetListParams,
    GetOneParams,
    GetManyParams,
    GetManyReferenceParams,
    UpdateParams,
    UpdateManyParams,
    CreateParams,
    DeleteParams,
    DeleteManyParams,
} from 'ra-core';
import {
    PrimaryKey,
    PostgRestOperator,
    getPrimaryKey,
    parseFilters,
    getOrderBy,
    dataWithVirtualId,
    dataWithoutVirtualId,
    removePrimaryKey,
    getQuery,
    encodeId,
} from './urlBuilder';
import qs from 'qs';

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

export const defaultPrimaryKeys = new Map<string, PrimaryKey>();

export const defaultSchema = () => '';

export interface IDataProviderConfig {
    apiUrl: string;
    httpClient: (string, Options) => Promise<any>;
    defaultListOp: PostgRestOperator;
    primaryKeys: Map<string, PrimaryKey>;
    schema: () => string;
}

const useCustomSchema = (
    schema: () => string,
    metaSchema: MetaOption,
    method: string
) => {
    let funcHeaderSchema = schema;
    if (metaSchema !== undefined) {
        funcHeaderSchema = () => metaSchema;
    }

    if (funcHeaderSchema().length > 0) {
        let schemaHeader = '';
        if (['GET', 'HEAD'].includes(method)) {
            schemaHeader = 'Accept-Profile';
        } else if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
            schemaHeader = 'Content-Profile';
        } else return {};

        return { [schemaHeader]: funcHeaderSchema() };
    } else return {};
};

export default (config: IDataProviderConfig): DataProvider => ({
    getList: (resource, params: Partial<GetListParams> = {}) => {
        const primaryKey = getPrimaryKey(resource, config.primaryKeys);

        const { page, perPage } = params.pagination;
        const { field, order } = params.sort || {};
        const { filter, select } = parseFilters(params, config.defaultListOp);
        const metaSchema = params.meta?.schema;

        let query = {
            offset: String((page - 1) * perPage),
            limit: String(perPage),
            // append filters
            ...filter,
        };

        if (field) {
            query.order = getOrderBy(field, order, primaryKey);
        }

        if (select) {
            query.select = select;
        }

        // add header that Content-Range is in returned header
        const options = {
            headers: new Headers({
                Accept: 'application/json',
                Prefer: 'count=exact',
                ...(params.meta?.headers || {}),
                ...useCustomSchema(config.schema, metaSchema, 'GET'),
            }),
        };

        const url = `${config.apiUrl}/${resource}?${qs.stringify(query)}`;

        return config.httpClient(url, options).then(({ headers, json }) => {
            if (!headers.has('content-range')) {
                throw new Error(
                    `The Content-Range header is missing in the HTTP Response. The postgREST data provider expects 
          responses for lists of resources to contain this header with the total number of results to build 
          the pagination. If you are using CORS, did you declare Content-Range in the Access-Control-Expose-Headers header?`
                );
            }
            return {
                data: json.map(obj => dataWithVirtualId(obj, primaryKey)),
                total: parseInt(
                    headers.get('content-range').split('/').pop(),
                    10
                ),
            };
        });
    },

    getOne: (resource, params: Partial<GetOneParams> = {}) => {
        const { id, meta } = params;
        const primaryKey = getPrimaryKey(resource, config.primaryKeys);

        const query = getQuery(primaryKey, id, resource, meta);

        const url = `${config.apiUrl}/${resource}?${qs.stringify(query)}`;
        const metaSchema = params.meta?.schema;

        return config
            .httpClient(url, {
                headers: new Headers({
                    accept: 'application/vnd.pgrst.object+json',
                    ...(params.meta?.headers || {}),
                    ...useCustomSchema(config.schema, metaSchema, 'GET'),
                }),
            })
            .then(({ json }) => ({
                data: dataWithVirtualId(json, primaryKey),
            }));
    },

    getMany: (resource, params: Partial<GetManyParams> = {}) => {
        const ids = params.ids;
        const primaryKey = getPrimaryKey(resource, config.primaryKeys);

        const query = getQuery(primaryKey, ids, resource, params.meta);

        const url = `${config.apiUrl}/${resource}?${qs.stringify(query)}`;
        const metaSchema = params.meta?.schema;

        return config
            .httpClient(url, {
                headers: new Headers({
                    ...useCustomSchema(config.schema, metaSchema, 'GET'),
                }),
            })
            .then(({ json }) => ({
                data: json.map(data => dataWithVirtualId(data, primaryKey)),
            }));
    },

    getManyReference: (
        resource,
        params: Partial<GetManyReferenceParams> = {}
    ) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;

        const { filter, select } = parseFilters(params, config.defaultListOp);
        const primaryKey = getPrimaryKey(resource, config.primaryKeys);

        const metaSchema = params.meta?.schema;

        let query = params.target
            ? {
                  [params.target]: `eq.${params.id}`,
                  order: getOrderBy(field, order, primaryKey),
                  offset: String((page - 1) * perPage),
                  limit: String(perPage),
                  ...filter,
              }
            : {
                  order: getOrderBy(field, order, primaryKey),
                  offset: String((page - 1) * perPage),
                  limit: String(perPage),
                  ...filter,
              };

        if (select) {
            query.select = select;
        }

        // add header that Content-Range is in returned header
        const options = {
            headers: new Headers({
                Accept: 'application/json',
                Prefer: 'count=exact',
                ...(params.meta?.headers || {}),
                ...useCustomSchema(config.schema, metaSchema, 'GET'),
            }),
        };

        const url = `${config.apiUrl}/${resource}?${qs.stringify(query)}`;

        return config.httpClient(url, options).then(({ headers, json }) => {
            if (!headers.has('content-range')) {
                throw new Error(
                    `The Content-Range header is missing in the HTTP Response. The postgREST data provider expects 
          responses for lists of resources to contain this header with the total number of results to build 
          the pagination. If you are using CORS, did you declare Content-Range in the Access-Control-Expose-Headers header?`
                );
            }
            return {
                data: json.map(data => dataWithVirtualId(data, primaryKey)),
                total: parseInt(
                    headers.get('content-range').split('/').pop(),
                    10
                ),
            };
        });
    },

    update: (resource, params: Partial<UpdateParams> = {}) => {
        const { id, data, meta } = params;
        const primaryKey = getPrimaryKey(resource, config.primaryKeys);
        const query = getQuery(primaryKey, id, resource, meta);
        const url = `${config.apiUrl}/${resource}?${qs.stringify(query)}`;
        const metaSchema = params.meta?.schema;

        const body = JSON.stringify({
            ...dataWithoutVirtualId(
                removePrimaryKey(data, primaryKey),
                primaryKey
            ),
        });

        return config
            .httpClient(url, {
                method: 'PATCH',
                headers: new Headers({
                    Accept: 'application/vnd.pgrst.object+json',
                    Prefer: 'return=representation',
                    'Content-Type': 'application/json',
                    ...(params.meta?.headers || {}),
                    ...useCustomSchema(config.schema, metaSchema, 'PATCH'),
                }),
                body,
            })
            .then(({ json }) => ({
                data: dataWithVirtualId(json, primaryKey),
            }));
    },

    updateMany: (resource, params: Partial<UpdateManyParams> = {}) => {
        const { ids, meta, data } = params;
        const primaryKey = getPrimaryKey(resource, config.primaryKeys);
        const query = getQuery(primaryKey, ids, resource, meta);
        const url = `${config.apiUrl}/${resource}?${qs.stringify(query)}`;
        const body = JSON.stringify({
            ...dataWithoutVirtualId(
                removePrimaryKey(data, primaryKey),
                primaryKey
            ),
        });

        const metaSchema = params.meta?.schema;

        return config
            .httpClient(url, {
                method: 'PATCH',
                headers: new Headers({
                    Prefer: 'return=representation',
                    'Content-Type': 'application/json',
                    ...(params.meta?.headers || {}),
                    ...useCustomSchema(config.schema, metaSchema, 'PATCH'),
                }),
                body,
            })
            .then(({ json }) => ({
                data: json.map(data => encodeId(data, primaryKey)),
            }));
    },

    create: (resource, params: Partial<CreateParams> = {}) => {
        const { meta } = params;
        const primaryKey = getPrimaryKey(resource, config.primaryKeys);
        const query = getQuery(primaryKey, undefined, resource, meta);
        const queryStr = qs.stringify(query);
        const url = `${config.apiUrl}/${resource}${
            queryStr.length > 0 ? '?' : ''
        }${queryStr}`;
        const metaSchema = params.meta?.schema;

        return config
            .httpClient(url, {
                method: 'POST',
                headers: new Headers({
                    Accept: 'application/vnd.pgrst.object+json',
                    Prefer: 'return=representation',
                    'Content-Type': 'application/json',
                    ...(params.meta?.headers || {}),
                    ...useCustomSchema(config.schema, metaSchema, 'POST'),
                }),
                body: JSON.stringify(
                    dataWithoutVirtualId(params.data, primaryKey)
                ),
            })
            .then(({ json }) => ({
                data: {
                    ...json,
                    id: encodeId(json, primaryKey),
                },
            }));
    },

    delete: (resource, params: Partial<DeleteParams> = {}) => {
        const { id, meta } = params;
        const primaryKey = getPrimaryKey(resource, config.primaryKeys);

        const query = getQuery(primaryKey, id, resource, meta);

        const url = `${config.apiUrl}/${resource}?${qs.stringify(query)}`;
        const metaSchema = params.meta?.schema;

        return config
            .httpClient(url, {
                method: 'DELETE',
                headers: new Headers({
                    Accept: 'application/vnd.pgrst.object+json',
                    Prefer: 'return=representation',
                    'Content-Type': 'application/json',
                    ...(params.meta?.headers || {}),
                    ...useCustomSchema(config.schema, metaSchema, 'DELETE'),
                }),
            })
            .then(({ json }) => ({
                data: dataWithVirtualId(json, primaryKey),
            }));
    },

    deleteMany: (resource, params: Partial<DeleteManyParams> = {}) => {
        const { ids, meta } = params;
        const primaryKey = getPrimaryKey(resource, config.primaryKeys);

        const query = getQuery(primaryKey, ids, resource, meta);

        const url = `${config.apiUrl}/${resource}?${qs.stringify(query)}`;
        const metaSchema = params.meta?.schema;

        return config
            .httpClient(url, {
                method: 'DELETE',
                headers: new Headers({
                    Prefer: 'return=representation',
                    'Content-Type': 'application/json',
                    ...(params.meta?.headers || {}),
                    ...useCustomSchema(config.schema, metaSchema, 'DELETE'),
                }),
            })
            .then(({ json }) => ({
                data: json.map(data => encodeId(data, primaryKey)),
            }));
    },
});
