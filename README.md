# PostgREST Data Provider For React-Admin
[![npm](https://img.shields.io/npm/v/@raphiniert/ra-data-postgrest.svg)](https://www.npmjs.com/package/@raphiniert/ra-data-postgrest)
[![npm downloads](https://img.shields.io/npm/dm/@raphiniert/ra-data-postgrest.svg)](https://www.npmjs.com/package/@raphiniert/ra-data-postgrest)
[![Coverage Status](https://coveralls.io/repos/github/raphiniert-com/ra-data-postgrest/badge.svg?branch=master)](https://coveralls.io/github/raphiniert-com/ra-data-postgrest?branch=master)
[![License: MIT](https://img.shields.io/gitlab/license/24181795)](https://github.com/raphiniert-com/ra-data-postgrest/blob/master/LICENSE)


PostgREST Data Provider for [react-admin](https://github.com/marmelab/react-admin), the frontend framework for building admin applications on top of REST/GraphQL services.

## Installation

```sh
npm install --save @raphiniert/ra-data-postgrest
```

**NOTE**: When using RA 3.x.x, use the data-provider 1.x.x. For RA >= 4.1.x use the data-provider starting from 1.2.x.

## REST Dialect

This Data Provider fits REST APIs using simple GET parameters for filters and sorting. This is the dialect used for instance in [PostgREST](http://postgrest.org).

| Method             | API calls                                                                            |
| ------------------ | ------------------------------------------------------------------------------------ |
| `getList`          | `GET http://my.api.url/posts?order=title.asc&offset=0&limit=24&filterField=eq.value` |
| `getOne`           | `GET http://my.api.url/posts?id=eq.123`                                              |
| `getMany`          | `GET http://my.api.url/posts?id=in.(123,456,789)`                                    |
| `getManyReference` | `GET http://my.api.url/posts?author_id=eq.345`                                       |
| `create`           | `POST http://my.api.url/posts`                                                       |
| `update`           | `PATCH http://my.api.url/posts?id=eq.123`                                            |
| `updateMany`       | `PATCH http://my.api.url/posts?id=in.(123,456,789)`                                  |
| `delete`           | `DELETE http://my.api.url/posts?id=eq.123`                                           |
| `deleteMany`       | `DELETE http://my.api.url/posts?id=in.(123,456,789)`                                 |

**Note**: The PostgREST data provider expects the API to include a `Content-Range` header in the response to `getList` calls. The value must be the total number of resources in the collection. This allows react-admin to know how many pages of resources there are in total, and build the pagination controls.

```
Content-Range: posts 0-24/319
```

If your API is on another domain as the JS code, you'll need to whitelist this header with an `Access-Control-Expose-Headers` [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) header.

```
Access-Control-Expose-Headers: Content-Range
```

## Usage

```jsx
// in src/App.js
import * as React from 'react';
import { Admin, Resource, fetchUtils } from 'react-admin';
import postgrestRestProvider, 
     { IDataProviderConfig, 
       defaultPrimaryKeys, 
       defaultSchema } from '@raphiniert/ra-data-postgrest';

import { PostList } from './posts';

const config: IDataProviderConfig = {
    apiUrl: 'http://path.to.my.api/',
    httpClient: fetchUtils.fetchJson,
    defaultListOp: 'eq',
    primaryKeys: defaultPrimaryKeys,
    schema: defaultSchema
}

const App = () => (
    <Admin dataProvider={postgrestRestProvider(config)}>
        <Resource name="posts" list={PostList} />
    </Admin>
);

export default App;
```

### Adding Custom Headers

The provider function accepts an HTTP client function as second argument. By default, they use react-admin's `fetchUtils.fetchJson()` as HTTP client. It's similar to HTML5 `fetch()`, except it handles JSON decoding and HTTP error codes automatically.

That means that if you need to add custom headers to your requests, you just need to _wrap_ the `fetchJson()` call inside your own function:

```jsx
import { fetchUtils, Admin, Resource } from 'react-admin';
import postgrestRestProvider from '@raphiniert/ra-data-postgrest';

const httpClient = (url, options = {}) => {
    if (!options.headers) {
        options.headers = new Headers({ Accept: 'application/json' });
    }
    // add your own headers here
    options.headers.set('X-Custom-Header', 'foobar');
    return fetchUtils.fetchJson(url, options);
};

const config: IDataProviderConfig = {
    ...
    httpClient: httpClient,
    ...
}

const dataProvider = postgrestRestProvider(config);

render(
    <Admin dataProvider={dataProvider} title="Example Admin">
        ...
    </Admin>,
    document.getElementById('root')
);
```

Now all the requests to the REST API will contain the `X-Custom-Header: foobar` header.

**Tip**: The most common usage of custom headers is for authentication. `fetchJson` has built-on support for the `Authorization` token header:

```js
const httpClient = (url, options = {}) => {
    options.user = {
        authenticated: true,
        token: 'SRTRDFVESGNJYTUKTYTHRG',
    };
    return fetchUtils.fetchJson(url, options);
};
```

Now all the requests to the REST API will contain the `Authorization: SRTRDFVESGNJYTUKTYTHRG` header.

### Special Filter Feature

As postgRest allows several comparators, e.g. `ilike`, `like`, `eq`...
The dataProvider is designed to enable you to specify the comparator in your react filter component:

```jsx
<Filter {...props}>
    <TextInput label="Search" source="post_title@ilike" alwaysOn />
    <TextInput label="Search" source="post_author" alwaysOn />
    // some more filters
</Filter>
```

One can simply append the comparator with an `@` to the source. In this example the field `post_title` would be filtered with `ilike` whereas `post_author` would be filtered using `eq` which is the default if no special comparator is specified.

#### RPC Functions

Given a RPC call as `GET /rpc/add_them?post_author=Herbert HTTP/1.1`, the dataProvider allows you to filter such endpoints. As they are no view, but a SQL procedure, several postgREST features do not apply. I.e. no comparators such as `ilike`, `like`, `eq` are applicable. Only the raw value without comparator needs to be send to the API. In order to realize this behavior, just add an "empty" comparator to the field, i.e. end `source` with an `@` as in the example:

```jsx
<Filter {...props}>
    <TextInput label="Search" source="post_author@" alwaysOn />
    // some more filters
</Filter>
```

### Compound primary keys

If one has data resources without primary keys named `id`, one will have to define this specifically. Also, if there is a primary key, which is defined over multiple columns:

```jsx
const config: IDataProviderConfig = {
    ...
    primaryKeys: new Map([
        ['some_table', ['custom_id']],
        ['another_table', ['first_column', 'second_column']],
    ]),
    ...
}

const dataProvider = postgrestRestProvider(config);
```

### Custom schema
PostgREST allows to [select and switch the database schema](https://postgrest.org/en/stable/api.html#switching-schemas) by setting a custom header. Thus, one way to use this function would be adding the custom header as a string while using react-admin hooks within `meta.schema` (compare to next section) or to set it up as function of `() => (string)` while using the data provider just component based. The latter can be done as follows and gives the opportunity to use some central storage (e.g. localStorage) which can be changed at multiple points of the application:
```jsx
const config: IDataProviderConfig = {
    ...
    schema: localStorage.getItem("schema") || "api",
    ...
}

const dataProvider = postgrestRestProvider(config);
```

### Passing extra headers via meta
Postgrest supports calling functions with a single JSON parameter by sending the header Prefer: params=single-object with your request according to its [docs](https://postgrest.org/en/stable/api.html#calling-functions-with-a-single-json-parameter).

Within the data provider one can add any kind of header to the request while calling react-admin hooks, e.g.:

```jsx
const [create, { isLoading, error }] = useCreate(
    'rpc/my-function',
    {
        data: { ... },
        meta: { headers: { Prefer: 'params=single-object' } },
    }
);
```

### Vertical filtering
Postgrest supports a feature of [Vertical Filtering (Columns)](https://postgrest.org/en/stable/api.html#vertical-filtering-columns). Within the react-admin hooks this feature can be used as in the following example:

```jsx
const { data, total, isLoading, error } = useGetList(
    'posts',
    { 
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'published_at', order: 'DESC' }
        meta: { columns: ['id', 'title'] }
    }
);
```

Further, one should be able to leverage this feature to rename columns:
```jsx
columns: ['id', 'somealias:title']
```
, to cast columns:
```jsx
columns: ['id::text', 'title']
```
and even get bits from a json or jsonb column"
```jsx
columns: ['id', 'json_data->>blood_type', 'json_data->phones']
```

**Note**: not working for `create` and `updateMany`.

## Developers notes

The current development of this library was done with node v19.10 and npm 8.19.3. In this version the unit tests and the development environment should work.

## License

This data provider is licensed under the MIT License and sponsored by [raphiniert.com](https://raphiniert.com).
