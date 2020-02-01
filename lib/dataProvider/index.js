"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var query_string_1 = require("query-string");
var ra_core_1 = require("ra-core");
/**
 * Maps react-admin queries to a postgrest REST API
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
    var result = {};
    Object.keys(filter).forEach(function (key) {
        // key: the name of the object key
        var splitKey = key.split('@');
        var operation = splitKey.length == 2 ? splitKey[1] : defaultListOp;
        var value = filter[key];
        result[splitKey[0]] =
            operation.includes('like') ? operation + ".*" + value + "*" : operation + "." + value;
    });
    return result;
}
exports.default = (function (apiUrl, httpClient, defaultListOp) {
    if (httpClient === void 0) { httpClient = ra_core_1.fetchUtils.fetchJson; }
    if (defaultListOp === void 0) { defaultListOp = 'eq'; }
    return ({
        getList: function (resource, params) {
            var _a = params.pagination, page = _a.page, perPage = _a.perPage;
            var _b = params.sort, field = _b.field, order = _b.order;
            var parsedFilter = parseFilters(params.filter, defaultListOp);
            var query = __assign({ order: field + "." + order.toLowerCase(), offset: (page - 1) * perPage, limit: page * perPage - 1 }, parsedFilter);
            // add header that Content-Range is in returned header
            var options = {
                headers: new Headers({
                    Accept: 'application/json',
                    Prefer: 'count=exact'
                })
            };
            var url = apiUrl + "/" + resource + "?" + query_string_1.stringify(query);
            return httpClient(url, options).then(function (_a) {
                var headers = _a.headers, json = _a.json;
                if (!headers.has('content-range')) {
                    throw new Error("The Content-Range header is missing in the HTTP Response. The postgREST data provider expects \n          responses for lists of resources to contain this header with the total number of results to build \n          the pagination. If you are using CORS, did you declare Content-Range in the Access-Control-Expose-Headers header?");
                }
                return {
                    data: json,
                    total: parseInt(headers
                        .get('content-range')
                        .split('/')
                        .pop(), 10)
                };
            });
        },
        getOne: function (resource, params) {
            return httpClient(apiUrl + "/" + resource + "?id=eq." + params.id, {
                headers: new Headers({ 'accept': 'application/vnd.pgrst.object+json' }),
            }).then(function (_a) {
                var json = _a.json;
                return ({
                    data: json,
                });
            });
        },
        getMany: function (resource, params) {
            var query = JSON.stringify(params.ids);
            var url = apiUrl + "/" + resource + "?id=in.(" + query_string_1.stringify(query) + ")";
            return httpClient(url).then(function (_a) {
                var json = _a.json;
                return ({ data: json });
            });
        },
        getManyReference: function (resource, params) {
            var _a;
            var _b = params.pagination, page = _b.page, perPage = _b.perPage;
            var _c = params.sort, field = _c.field, order = _c.order;
            var parsedFilter = parseFilters(params.filter, defaultListOp);
            var query = __assign((_a = {}, _a[params.target] = "eq." + params.id, _a.order = field + "." + order.toLowerCase(), _a.offset = (page - 1) * perPage, _a.limit = page * perPage - 1, _a), parsedFilter);
            // add header that Content-Range is in returned header
            var options = {
                headers: new Headers({
                    Accept: 'application/json',
                    Prefer: 'count=exact'
                })
            };
            var url = apiUrl + "/" + resource + "?" + query_string_1.stringify(query);
            return httpClient(url, options).then(function (_a) {
                var headers = _a.headers, json = _a.json;
                if (!headers.has('content-range')) {
                    throw new Error("The Content-Range header is missing in the HTTP Response. The postgREST data provider expects \n          responses for lists of resources to contain this header with the total number of results to build \n          the pagination. If you are using CORS, did you declare Content-Range in the Access-Control-Expose-Headers header?");
                }
                return {
                    data: json,
                    total: parseInt(headers
                        .get('content-range')
                        .split('/')
                        .pop(), 10),
                };
            });
        },
        update: function (resource, params) {
            return httpClient(apiUrl + "/" + resource + "?id=eq." + params.id, {
                method: 'PATCH',
                headers: new Headers({
                    'Accept': 'application/vnd.pgrst.object+json',
                    'Prefer': 'return=representation',
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify(params.data),
            }).then(function (_a) {
                var json = _a.json;
                return ({ data: json });
            });
        },
        updateMany: function (resource, params) {
            return httpClient(apiUrl + "/" + resource + "?id=in.(" + params.ids.join(',') + ")", {
                method: 'PATCH',
                headers: new Headers({
                    'Prefer': 'return=representation',
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify(params.data),
            }).then(function (_a) {
                var json = _a.json;
                return ({ data: json.map(function (data) { return data.id; }) });
            });
        },
        create: function (resource, params) {
            return httpClient(apiUrl + "/" + resource, {
                method: 'POST',
                headers: new Headers({
                    'Accept': 'application/vnd.pgrst.object+json',
                    'Prefer': 'return=representation',
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify(params.data),
            }).then(function (_a) {
                var json = _a.json;
                console.log(json);
                return {
                    data: __assign(__assign({}, params.data), { id: json.id }),
                };
            });
        },
        delete: function (resource, params) {
            return httpClient(apiUrl + "/" + resource + "?id=eq." + params.id, {
                method: 'DELETE',
                headers: new Headers({
                    'Accept': 'application/vnd.pgrst.object+json',
                    'Prefer': 'return=representation',
                    'Content-Type': 'application/json'
                }),
            }).then(function (_a) {
                var json = _a.json;
                return ({ data: json });
            });
        },
        deleteMany: function (resource, params) {
            return httpClient(apiUrl + "/" + resource + "?id=in.(" + params.ids.join(',') + ")", {
                method: 'DELETE',
                headers: new Headers({
                    'Prefer': 'return=representation',
                    'Content-Type': 'application/json'
                }),
            }).then(function (_a) {
                var json = _a.json;
                return ({ data: json.json().map(function (data) { return data.id; }) });
            });
        },
    });
});
