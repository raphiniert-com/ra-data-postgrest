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
    PostgRestSortOrder,
} from './urlBuilder';
import qs from 'qs';
import { dequal as isEqual } from 'dequal';

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

export { PostgRestSortOrder };

export interface IDataProviderConfig {
    apiUrl: string;
    httpClient: (string, Options) => Promise<any>;
    defaultListOp: PostgRestOperator;
    sortOrder?: PostgRestSortOrder;
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
            query.order = getOrderBy(
                field,
                order,
                primaryKey,
                config.sortOrder
            );
            if (
                params.meta?.nullsfirst &&
                !query.order.includes('nullsfirst')
            ) {
                query.order = query.order.includes('nullslast')
                    ? query.order.replace('nullslast', 'nullsfirst')
                    : `${query.order}.nullsfirst`;
            }
            if (
                params.meta?.nullsfirst === false &&
                query.order.includes('nullsfirst')
            ) {
                query.order = query.order.replace('.nullsfirst', '');
            }
            if (params.meta?.nullslast && !query.order.includes('nullslast')) {
                query.order = query.order.includes('nullsfirst')
                    ? query.order.replace('nullsfirst', 'nullslast')
                    : `${query.order}.nullslast`;
            }
            if (
                params.meta?.nullslast === false &&
                query.order.includes('nullslast')
            ) {
                query.order = query.order.replace('.nullslast', '');
            }
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
            const data = json.map(obj => dataWithVirtualId(obj, primaryKey));
            const prefetched = getPrefetchedData(data, params.meta?.prefetch);
            return {
                data: removePrefetchedData(data, params.meta?.prefetch),
                total: parseInt(
                    headers.get('content-range').split('/').pop(),
                    10
                ),
                meta: params.meta?.prefetch ? { prefetched } : undefined,
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
            .then(({ json }) => {
                const data = dataWithVirtualId(json, primaryKey);
                const prefetched = getPrefetchedData(
                    data,
                    params.meta?.prefetch
                );
                return {
                    data: removePrefetchedData(data, params.meta?.prefetch),
                    meta: params.meta?.prefetch ? { prefetched } : undefined,
                };
            });
    },

    getMany: (resource, params: Partial<GetManyParams> = {}) => {
        const ids = params.ids;
        if (ids.length === 0) {
            return Promise.resolve({ data: [] });
        }
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
            .then(({ json }) => {
                const data = json.map(data =>
                    dataWithVirtualId(data, primaryKey)
                );
                const prefetched = getPrefetchedData(
                    data,
                    params.meta?.prefetch
                );
                return {
                    data: removePrefetchedData(data, params.meta?.prefetch),
                    meta: params.meta?.prefetch ? { prefetched } : undefined,
                };
            });
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
                  order: getOrderBy(field, order, primaryKey, config.sortOrder),
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
            const data = json.map(data => dataWithVirtualId(data, primaryKey));
            const prefetched = getPrefetchedData(data, params.meta?.prefetch);
            return {
                data: removePrefetchedData(data, params.meta?.prefetch),
                total: parseInt(
                    headers.get('content-range').split('/').pop(),
                    10
                ),
                meta: params.meta?.prefetch ? { prefetched } : undefined,
            };
        });
    },

    update: (resource, params: Partial<UpdateParams> = {}) => {
        const { id, data, meta, previousData } = params;
        const primaryKey = getPrimaryKey(resource, config.primaryKeys);
        const query = getQuery(primaryKey, id, resource, meta);
        const url = `${config.apiUrl}/${resource}?${qs.stringify(query)}`;
        const changedData = getChanges(data, previousData);
        if (Object.keys(changedData).length === 0) {
            return Promise.resolve({ data: { ...previousData } });
        }
        const metaSchema = params.meta?.schema;

        const body = JSON.stringify({
            ...dataWithoutVirtualId(
                removePrimaryKey(changedData, primaryKey),
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
            .then(({ json }) => {
                const data = dataWithVirtualId(json, primaryKey);
                const prefetched = getPrefetchedData(
                    data,
                    params.meta?.prefetch
                );
                return {
                    data: removePrefetchedData(data, params.meta?.prefetch),
                    meta: params.meta?.prefetch ? { prefetched } : undefined,
                };
            });
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
            .then(({ json }) => {
                const data = {
                    ...json,
                    id: encodeId(json, primaryKey),
                };
                const prefetched = getPrefetchedData(
                    data,
                    params.meta?.prefetch
                );
                return {
                    data: removePrefetchedData(data, params.meta?.prefetch),
                    meta: params.meta?.prefetch ? { prefetched } : undefined,
                };
            });
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
            .then(({ json }) => {
                const data = dataWithVirtualId(json, primaryKey);
                const prefetched = getPrefetchedData(
                    data,
                    params.meta?.prefetch
                );
                return {
                    data: removePrefetchedData(data, params.meta?.prefetch),
                    meta: params.meta?.prefetch ? { prefetched } : undefined,
                };
            });
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

const getChanges = (data: any, previousData: any) => {
    const changes = Object.keys(data).reduce((changes, key) => {
        if (!isEqual(data[key], previousData[key])) {
            changes[key] = data[key];
        }
        return changes;
    }, {});
    return changes;
};

/**
 * Extract embeds from Postgrest responses
 *
 * When calling Postgrest database.getOne('posts', 123, { embed: 'tags' }),
 * the Postgrest response adds a `tags` key to the response, containing the
 * related tags. Something like:
 *
 *     { id: 123, title: 'React-query in details', tags: [{ id: 1, name: 'react' }, { id: 1, name: 'query' }] }
 *
 * We want to copy all the embeds in a data object, that will later
 * be included into the response meta.prefetched key.
 *
 * @example getPrefetchedData({ id: 123, title: 'React-query in details', tags: [{ id: 1, name: 'react' }, { id: 1, name: 'query' }] }, ['tags'])
 * // {
 * //   tags: [{ id: 1, name: 'react' }, { id: 1, name: 'query' }]
 * // }
 */
const getPrefetchedData = (data, prefetchParam?: string[]) => {
    if (!prefetchParam) return undefined;
    const prefetched = {};
    const dataArray = Array.isArray(data) ? data : [data];
    prefetchParam.forEach(resource => {
        dataArray.forEach(record => {
            if (!prefetched[resource]) {
                prefetched[resource] = [];
            }
            const prefetchedData = Array.isArray(record[resource])
                ? record[resource]
                : [record[resource]];
            prefetchedData.forEach(prefetchedRecord => {
                if (
                    prefetched[resource].some(r => r.id === prefetchedRecord.id)
                ) {
                    // do not add the record if it's already there
                    return;
                }
                prefetched[resource].push(prefetchedRecord);
            });
        });
    });

    return prefetched;
};

/**
 * Remove embeds from Postgrest responses
 *
 * When calling Postgrest database.getOne('posts', 123, { embed: 'tags' }),
 * the Postgrest response adds a `post` key to the response, containing the
 * related post. Something like:
 *
 *     { id: 123, title: 'React-query in details', tags: [{ id: 1, name: 'react' }, { id: 1, name: 'query' }] }
 *
 * We want to remove all the embeds from the response.
 *
 * @example removePrefetchedData({ id: 123, title: 'React-query in details', tags: [{ id: 1, name: 'react' }, { id: 1, name: 'query' }] }, 'tags')
 * // { id: 123, title: 'React-query in details' }
 */
const removePrefetchedData = (data, prefetchParam?: string[]) => {
    if (!prefetchParam) return data;
    const dataArray = Array.isArray(data) ? data : [data];
    const newDataArray = dataArray.map(record => {
        const newRecord = {};
        for (const key in record) {
            if (!prefetchParam.includes(key)) {
                newRecord[key] = record[key];
            }
        }
        return newRecord;
    });
    return Array.isArray(data) ? newDataArray : newDataArray[0];
};
