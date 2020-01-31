import { stringify } from 'query-string';
import { fetchUtils, DataProvider } from 'ra-core';

/**
 * Maps react-admin queries to a subzero REST API
 *
 * This REST dialect uses postgrest syntax
 *
 * @see https://postgrest.org/en/v6.0/api.html#embedded-filters
 *
 * @example
 *
 * getList     => GET http://my.api.url/posts?order=title.asc&offset=0&limit=24&filterField=eq.value
 * getOne      => GET http://my.api.url/posts?id=eq.123
 * getMany     => GET http://my.api.url/posts?id=in.(123,456,789)
 * update      => PATCH http://my.api.url/posts?id=eq.123
 * create      => POST http://my.api.url/posts
 * delete      => DELETE http://my.api.url/posts?id=eq.123
 * deleteMany  => DELETE http://my.api.url/posts?id=in.(123,456,789)
 *
 * @example
 *
 * import React from 'react';
 * import { Admin, Resource } from 'react-admin';
 * import subzeroRestProvider from 'ra-data-subzero-rest';
 *
 * import { PostList } from './posts';
 *
 * const App = () => (
 *     <Admin dataProvider={subzeroRestProvider('http://path.to.my.api/')}>
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

    console.log(parsedFilter);

    const query = {
      order: `${field}.${order.toLowerCase()}`,
      offset: (page - 1) * perPage,
      limit: page * perPage - 1,
      // append filters
      ...parsedFilter
    };

    // add header that Content-Range is in returned header
    const options = {
      headers: new Headers({ Accept: 'application/json' })
    }
    options.headers.set('Prefer', 'count=exact');

    const url = `${apiUrl}/${resource}?${stringify(query)}`;

    return httpClient(url, options).then(({ headers, json }) => {
      if (!headers.has('content-range')) {
        throw new Error(
          'The Content-Range header is missing in the HTTP Response. The subzero REST data provider expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare Content-Range in the Access-Control-Expose-Headers header?'
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
      headers: new Headers({'accept': 'application/vnd.pgrst.object+json'}),
    }).then(({ json }) => ({
      data: json,
    })),

  getMany: (resource, params) => {
    const query = JSON.stringify(params.ids);

    const url = `${apiUrl}/${resource}?id=in.(${stringify(query)})`;
    return httpClient(url).then(({ json }) => ({ data: json }));
  },

  // TODO
  getManyReference: (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const query = {
      sort: JSON.stringify([field, order]),
      range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
      filter: JSON.stringify({
        ...params.filter,
        [params.target]: params.id,
      }),
    };
    const url = `${apiUrl}/${resource}?${stringify(query)}`;

    return httpClient(url).then(({ headers, json }) => {
      if (!headers.has('content-range')) {
        throw new Error(
          'The Content-Range header is missing in the HTTP Response. The simple REST data provider expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare Content-Range in the Access-Control-Expose-Headers header?'
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

  // TODO
  // simple-rest doesn't handle provide an updateMany route, so we fallback to calling update n times instead
  updateMany: (resource, params) =>
    Promise.all(
      params.ids.map(id =>
        httpClient(`${apiUrl}/${resource}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(params.data),
        })
      )
    ).then(responses => ({ data: responses.map(({ json }) => json.id) })),

  // TODO
  create: (resource, params) =>
    httpClient(`${apiUrl}/${resource}`, {
      method: 'POST',
      body: JSON.stringify(params.data),
    }).then(({ json }) => {
      console.log(json);

      return {
        data: { ...params.data, id: json.id },
      }
    }),

  // TODO
  delete: (resource, params) =>
    httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: 'DELETE',
    }).then(({ json }) => ({ data: json })),

  // TODO
  // simple-rest doesn't handle filters on DELETE route, so we fallback to calling DELETE n times instead
  deleteMany: (resource, params) =>
    Promise.all(
      params.ids.map(id =>
        httpClient(`${apiUrl}/${resource}/${id}`, {
          method: 'DELETE',
        })
      )
    ).then(responses => ({ data: responses.map(({ json }) => json.id) })),
});
