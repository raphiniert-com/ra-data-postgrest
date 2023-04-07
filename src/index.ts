import { fetchUtils, DataProvider } from 'ra-core';
import {
    PrimaryKey,
    PostgRestOperator,
    getPrimaryKey,
    parseFilters,
    getOrderBy,
    dataWithId,
    getQuery,
    getKeyData,
    encodeId,
    decodeId,
    isCompoundKey,
} from './urlBuilder';
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
 * import { Admin, Resource } from 'react-admin';
 * import postgrestRestProvider from '@raphiniert/ra-data-postgrest';
 *
 * import { PostList } from './posts';
 *
 * const App = () => (
 *     <Admin dataProvider={postgrestRestProvider('http://path.to.my.api/')}>
 *         <Resource name="posts" list={PostList} />
 *     </Admin>
 * );
 *
 * export default App;
 */

const defaultPrimaryKeys = new Map<string, PrimaryKey>();

export default (
    apiUrl: string,
    httpClient = fetchUtils.fetchJson,
    defaultListOp: PostgRestOperator = 'eq',
    primaryKeys: Map<string, PrimaryKey> = defaultPrimaryKeys
): DataProvider => ({
    getList: (resource, params) => {
        const primaryKey = getPrimaryKey(resource, primaryKeys);

        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const parsedFilter = parseFilters(params.filter, defaultListOp);

        const query = {
            order: getOrderBy(field, order, primaryKey),
            offset: String((page - 1) * perPage),
            limit: String(perPage),
            // append filters
            ...parsedFilter,
        };

        // add header that Content-Range is in returned header
        const options = {
            headers: new Headers({
                Accept: 'application/json',
                Prefer: 'count=exact',
            }),
        };

        const url = `${apiUrl}/${resource}?${new URLSearchParams(query)}`;

        return httpClient(url, options).then(({ headers, json }) => {
            if (!headers.has('content-range')) {
                throw new Error(
                    `The Content-Range header is missing in the HTTP Response. The postgREST data provider expects 
          responses for lists of resources to contain this header with the total number of results to build 
          the pagination. If you are using CORS, did you declare Content-Range in the Access-Control-Expose-Headers header?`
                );
            }
            return {
                data: json.map(obj => dataWithId(obj, primaryKey)),
                total: parseInt(
                    headers.get('content-range').split('/').pop(),
                    10
                ),
            };
        });
    },

    getOne: (resource, params) => {
        const id = params.id;
        const primaryKey = getPrimaryKey(resource, primaryKeys);

        const query = getQuery(primaryKey, id, resource);

        const url = `${apiUrl}/${resource}?${query}`;

        return httpClient(url, {
            headers: new Headers({
                accept: 'application/vnd.pgrst.object+json',
            }),
        }).then(({ json }) => ({
            data: dataWithId(json, primaryKey),
        }));
    },

    getMany: (resource, params) => {
        const ids = params.ids;
        const primaryKey = getPrimaryKey(resource, primaryKeys);

        const query = getQuery(primaryKey, ids, resource);

        const url = `${apiUrl}/${resource}?${query}`;

        return httpClient(url).then(({ json }) => ({
            data: json.map(data => dataWithId(data, primaryKey)),
        }));
    },

    getManyReference: (resource, params) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const parsedFilter = parseFilters(params.filter, defaultListOp);
        const primaryKey = getPrimaryKey(resource, primaryKeys);

        const query = params.target
            ? {
                  [params.target]: `eq.${params.id}`,
                  order: getOrderBy(field, order, primaryKey),
                  offset: String((page - 1) * perPage),
                  limit: String(perPage),
                  ...parsedFilter,
              }
            : {
                  order: getOrderBy(field, order, primaryKey),
                  offset: String((page - 1) * perPage),
                  limit: String(perPage),
                  ...parsedFilter,
              };

        // add header that Content-Range is in returned header
        const options = {
            headers: new Headers({
                Accept: 'application/json',
                Prefer: 'count=exact',
            }),
        };

        const url = `${apiUrl}/${resource}?${new URLSearchParams(query)}`;

        return httpClient(url, options).then(({ headers, json }) => {
            if (!headers.has('content-range')) {
                throw new Error(
                    `The Content-Range header is missing in the HTTP Response. The postgREST data provider expects 
          responses for lists of resources to contain this header with the total number of results to build 
          the pagination. If you are using CORS, did you declare Content-Range in the Access-Control-Expose-Headers header?`
                );
            }
            return {
                data: json.map(data => dataWithId(data, primaryKey)),
                total: parseInt(
                    headers.get('content-range').split('/').pop(),
                    10
                ),
            };
        });
    },

    update: (resource, params) => {
        const { id, data } = params;
        const primaryKey = getPrimaryKey(resource, primaryKeys);

        const query = getQuery(primaryKey, id, resource);

        const primaryKeyData = getKeyData(primaryKey, data);

        const url = `${apiUrl}/${resource}?${query}`;

        const body = JSON.stringify({
            ...data,
            ...primaryKeyData,
        });

        return httpClient(url, {
            method: 'PATCH',
            headers: new Headers({
                Accept: 'application/vnd.pgrst.object+json',
                Prefer: 'return=representation',
                'Content-Type': 'application/json',
            }),
            body,
        }).then(({ json }) => ({ data: dataWithId(json, primaryKey) }));
    },

    updateMany: (resource, params) => {
        const ids = params.ids;
        const primaryKey = getPrimaryKey(resource, primaryKeys);

        const body = JSON.stringify(
            params.ids.map(id => {
                const { data } = params;
                const primaryKeyParams = decodeId(id, primaryKey);

                const primaryKeyData = {};
                if (isCompoundKey(primaryKey)) {
                    primaryKey.forEach((key, index) => {
                        primaryKeyData[key] = primaryKeyParams[index];
                    });
                } else {
                    primaryKeyData[primaryKey[0]] = primaryKeyParams[0];
                }

                return {
                    ...data,
                    ...primaryKeyData,
                };
            })
        );

        const url = `${apiUrl}/${resource}`;

        return httpClient(url, {
            method: 'PATCH',
            headers: new Headers({
                Prefer: 'return=representation',
                'Content-Type': 'application/json',
            }),
            body,
        }).then(({ json }) => ({
            data: json.map(data => encodeId(data, primaryKey)),
        }));
    },

    create: (resource, params) => {
        const primaryKey = getPrimaryKey(resource, primaryKeys);

        const url = `${apiUrl}/${resource}`;

        return httpClient(url, {
            method: 'POST',
            headers: new Headers({
                Accept: 'application/vnd.pgrst.object+json',
                Prefer: 'return=representation',
                'Content-Type': 'application/json',
            }),
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({
            data: {
                ...json,
                id: encodeId(json, primaryKey),
            },
        }));
    },

    delete: (resource, params) => {
        const id = params.id;
        const primaryKey = getPrimaryKey(resource, primaryKeys);

        const query = getQuery(primaryKey, id, resource);

        const url = `${apiUrl}/${resource}?${query}`;

        return httpClient(url, {
            method: 'DELETE',
            headers: new Headers({
                Accept: 'application/vnd.pgrst.object+json',
                Prefer: 'return=representation',
                'Content-Type': 'application/json',
            }),
        }).then(({ json }) => ({ data: dataWithId(json, primaryKey) }));
    },

    deleteMany: (resource, params) => {
        const ids = params.ids;
        const primaryKey = getPrimaryKey(resource, primaryKeys);

        const query = getQuery(primaryKey, ids, resource);

        const url = `${apiUrl}/${resource}?${query}`;

        return httpClient(url, {
            method: 'DELETE',
            headers: new Headers({
                Prefer: 'return=representation',
                'Content-Type': 'application/json',
            }),
        }).then(({ json }) => ({
            data: json.map(data => encodeId(data, primaryKey)),
        }));
    },
});
