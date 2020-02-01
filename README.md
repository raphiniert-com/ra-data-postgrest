# PostgREST Data Provider For React-Admin

PostgREST Data Provider for [react-admin](https://github.com/marmelab/react-admin), the frontend framework for building admin applications on top of REST/GraphQL services.

## Installation

```sh
npm install --save @raphiniert/ra-data-postgrest
```

## REST Dialect

This Data Provider fits REST APIs using simple GET parameters for filters and sorting. This is the dialect used for instance in [PostgREST](http://postgrest.org).

| Method             | API calls
|--------------------|----------------------------------------------------------------
| `getList`          | `GET http://my.api.url/posts?order=title.asc&offset=0&limit=24&filterField=eq.value`
| `getOne`           | `GET http://my.api.url/posts?id=eq.123`
| `getMany`          | `GET http://my.api.url/posts?id=in.(123,456,789)`
| `getManyReference` | `GET http://my.api.url/posts?author_id=eq.345`
| `create`           | `POST http://my.api.url/posts`
| `update`           | `PATCH http://my.api.url/posts?id=eq.123`
| `updateMany`       | `PATCH http://my.api.url/posts?id=in.(123,456,789)`
| `delete`           | `DELETE http://my.api.url/posts?id=eq.123`
| `deteleMany`       | `DELETE http://my.api.url/posts?id=in.(123,456,789)`

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
import React from 'react';
import { Admin, Resource } from 'react-admin';
import postgrestRestProvider from '@raphiniert/ra-data-postgrest';

import { PostList } from './posts';

const App = () => (
    <Admin dataProvider={postgrestRestProvider('http://path.to.my.api/')}>
        <Resource name="posts" list={PostList} />
    </Admin>
);

export default App;
```

### Adding Custom Headers

The provider function accepts an HTTP client function as second argument. By default, they use react-admin's `fetchUtils.fetchJson()` as HTTP client. It's similar to HTML5 `fetch()`, except it handles JSON decoding and HTTP error codes automatically.

That means that if you need to add custom headers to your requests, you just need to *wrap* the `fetchJson()` call inside your own function:

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
const dataProvider = postgrestRestProvider('http://localhost:3000', httpClient);

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
        token: 'SRTRDFVESGNJYTUKTYTHRG'
    };
    return fetchUtils.fetchJson(url, options);
};
```

Now all the requests to the REST API will contain the `Authorization: SRTRDFVESGNJYTUKTYTHRG` header.

### Using authProvider
This package also comes with an [authProvider](https://github.com/marmelab/react-admin/blob/master/docs/Authentication.md) for react-admin which enables you to enable authentification. The provider is designed to work together with [postgrest-starter-kit](https://github.com/subzerocloud/postgrest-starter-kit) and [subzero-starter-kit](https://github.com/subzerocloud/subzero-starter-kit). These starter kits send the JWT within a session cookie. The authProvider expects that. If you want to use postgREST without the starter kit you'll need to write your own. Feel free to contribute!

With one of the starter kits it is very easy to use the authProvider:
```jsx
// in src/App.js
import React from 'react';
import { Admin, Resource } from 'react-admin';
import postgrestRestProvider, { authProvider } from '@raphiniert/ra-data-postgrest';

import { PostList } from './posts';

const App = () => (
    <Admin dataProvider={postgrestRestProvider('http://path.to.my.api/')} 
           authProvider={authProvider}>
        <Resource name="posts" list={PostList} />
    </Admin>
);

export default App;
```

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


## License

This data provider is licensed under the MIT License and sponsored by [raphiniert.com](https://raphiniert.com).
