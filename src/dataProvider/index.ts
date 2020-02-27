import { stringify } from 'query-string';
import { fetchUtils, DataProvider } from 'ra-core';

/**
 * Maps react-admin queries to a postgrest REST API
 *
 * This REST dialect uses postgrest syntax
 *
 * @see https://postgrest.org/en/v6.0/api.html#embedded-filters
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
 * import React from 'react';
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
function parseFilters(filter, defaultListOp) {
  let result = {};
  Object.keys(filter).forEach(function (key) {
    // key: the name of the object key

    const splitKey = key.split('@');
    const operation = splitKey.length == 2 ? splitKey[1] : defaultListOp;

    const value = filter[key];

    result[splitKey[0]] =
      operation.includes('like') ? `${operation}.*${value}*` : `${operation}.${value}`;
  });

  return result;
}

export default (apiUrl, httpClient = fetchUtils.fetchJson, defaultListOp = 'eq'): DataProvider => ({
  getList: (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const parsedFilter = parseFilters(params.filter, defaultListOp);

    const query = {
      order: `${field}.${order.toLowerCase()}`,
      offset: (page - 1) * perPage,
      limit: page * perPage - 1,
      // append filters
      ...parsedFilter
    };

    // add header that Content-Range is in returned header
    const options = {
      headers: new Headers({
        Accept: 'application/json',
        Prefer: 'count=exact'
      })
    }

    const url = `${apiUrl}/${resource}?${stringify(query)}`;

    return httpClient(url, options).then(({ headers, json }) => {
      if (!headers.has('content-range')) {
        throw new Error(
          `The Content-Range header is missing in the HTTP Response. The postgREST data provider expects 
          responses for lists of resources to contain this header with the total number of results to build 
          the pagination. If you are using CORS, did you declare Content-Range in the Access-Control-Expose-Headers header?`
        );
      }
      return {
        data: json,
        total: parseInt(
          headers
            .get('content-range')
            .split('/')
            .pop(),
          10
        )
      };
    });
  },

  getOne: (resource, params) =>
    httpClient(`${apiUrl}/${resource}?id=eq.${params.id}`, {
      headers: new Headers({ 'accept': 'application/vnd.pgrst.object+json' }),
    }).then(({ json }) => ({
      data: json,
    })),

  getMany: (resource, params) => {
    const ids = params.ids.join(",");
    const url = `${apiUrl}/${resource}?id=in.(${ids})`;

    return httpClient(url).then(({ json }) => ({ data: json }));
  },

  getManyReference: (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const parsedFilter = parseFilters(params.filter, defaultListOp);

    const query = {
      [params.target]: `eq.${params.id}`,
      order: `${field}.${order.toLowerCase()}`,
      offset: (page - 1) * perPage,
      limit: page * perPage - 1,
      ...parsedFilter,
    };

    // add header that Content-Range is in returned header
    const options = {
      headers: new Headers({
        Accept: 'application/json',
        Prefer: 'count=exact'
      })
    }

    const url = `${apiUrl}/${resource}?${stringify(query)}`;

    return httpClient(url, options).then(({ headers, json }) => {
      if (!headers.has('content-range')) {
        throw new Error(
          `The Content-Range header is missing in the HTTP Response. The postgREST data provider expects 
          responses for lists of resources to contain this header with the total number of results to build 
          the pagination. If you are using CORS, did you declare Content-Range in the Access-Control-Expose-Headers header?`
        );
      }
      return {
        data: json,
        total: parseInt(
          headers
            .get('content-range')
            .split('/')
            .pop(),
          10
        ),
      };
    });
  },

  update: (resource, params) =>
    httpClient(`${apiUrl}/${resource}?id=eq.${params.id}`, {
      method: 'PATCH',
      headers: new Headers({
        'Accept': 'application/vnd.pgrst.object+json',
        'Prefer': 'return=representation',
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(params.data),
    }).then(({ json }) => ({ data: json })),

  updateMany: (resource, params) =>
    httpClient(`${apiUrl}/${resource}?id=in.(${params.ids.join(',')})`, {
      method: 'PATCH',
      headers: new Headers({
        'Prefer': 'return=representation',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(params.data),
    }).then(({ json }) => ({ data: json.map(data => data.id) })),

  create: (resource, params) =>
    httpClient(`${apiUrl}/${resource}`, {
      method: 'POST',
      headers: new Headers({
        'Accept': 'application/vnd.pgrst.object+json',
        'Prefer': 'return=representation',
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(params.data),
    }).then(({ json }) => {
      console.log(json);

      return {
        data: { ...params.data, id: json.id },
      }
    }),

  delete: (resource, params) =>
    httpClient(`${apiUrl}/${resource}?id=eq.${params.id}`, {
      method: 'DELETE',
      headers: new Headers({
        'Accept': 'application/vnd.pgrst.object+json',
        'Prefer': 'return=representation',
        'Content-Type': 'application/json'
      }),
    }).then(({ json }) => ({ data: json })),

  deleteMany: (resource, params) =>
    httpClient(`${apiUrl}/${resource}?id=in.(${params.ids.join(',')})`, {
      method: 'DELETE',
      headers: new Headers({
        'Prefer': 'return=representation',
        'Content-Type': 'application/json'
      }),
    }).then(({ json }) => ({ data: json.json().map(data => data.id) })),
});
