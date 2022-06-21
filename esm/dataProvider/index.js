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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { stringify } from 'query-string';
import { fetchUtils } from 'ra-core';
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
 * import postgrestRestProvider from '@promitheus/ra-data-postgrest';
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
        var values;
        if (operation.includes('like')) {
            // we split the search term in words
            values = filter[key].trim().split(' ');
        }
        else {
            values = [filter[key]];
        }
        values.forEach(function (value) {
            // if operator is intentionally blank, rpc syntax 
            var op = operation.includes('like') ? "".concat(operation, ".*").concat(value, "*") : operation.length == 0 ? "".concat(value) : "".concat(operation, ".").concat(value);
            if (result[splitKey[0]] === undefined) {
                // first operator for the key, we add it to the dict
                result[splitKey[0]] = op;
            }
            else {
                if (!Array.isArray(result[splitKey[0]])) {
                    // second operator, we transform to an array
                    result[splitKey[0]] = [result[splitKey[0]], op];
                }
                else {
                    // third and subsequent, we add to array
                    result[splitKey[0]].push(op);
                }
            }
        });
    });
    return result;
}
var getPrimaryKey = function (resource, primaryKeys) {
    return primaryKeys.get(resource) || ['id'];
};
var decodeId = function (id, primaryKey) {
    if (isCompoundKey(primaryKey)) {
        return JSON.parse(id.toString());
    }
    else {
        return [id.toString()];
    }
};
var encodeId = function (data, primaryKey) {
    if (isCompoundKey(primaryKey)) {
        return JSON.stringify(primaryKey.map(function (key) { return data[key]; }));
    }
    else {
        return data[primaryKey[0]];
    }
};
var dataWithId = function (data, primaryKey) {
    if (primaryKey === ['id']) {
        return data;
    }
    return Object.assign(data, {
        id: encodeId(data, primaryKey)
    });
};
var isCompoundKey = function (primaryKey) {
    return primaryKey.length > 1;
};
var getQuery = function (primaryKey, ids, resource) {
    var _a, _b;
    if (Array.isArray(ids) && ids.length > 1) {
        // no standardized query with multiple ids possible for rpc endpoints which are api-exposed database functions
        if (resource.startsWith('rpc/')) {
            console.error('PostgREST\'s rpc endpoints are not intended to be handled as views. Therefore, no query generation for multiple key values implemented!');
            return;
        }
        if (isCompoundKey(primaryKey)) {
            return "or=(\n          ".concat(ids.map(function (id) {
                var primaryKeyParams = decodeId(id, primaryKey);
                return "and(".concat(primaryKey.map(function (key, i) { return "".concat(key, ".eq.").concat(primaryKeyParams[i]); }).join(','), ")");
            }), "\n        )");
        }
        else {
            return stringify((_a = {}, _a[primaryKey[0]] = "in.(".concat(ids.join(','), ")"), _a));
        }
    }
    else {
        // if ids is one Identifier
        var id = ids.toString();
        var primaryKeyParams_1 = decodeId(id, primaryKey);
        if (isCompoundKey(primaryKey)) {
            if (resource.startsWith('rpc/'))
                return "".concat(primaryKey.map(function (key, i) { return "".concat(key, "=").concat(primaryKeyParams_1[i]); }).join('&'));
            else
                return "and=(".concat(primaryKey.map(function (key, i) { return "".concat(key, ".eq.").concat(primaryKeyParams_1[i]); }).join(','), ")");
        }
        else {
            return stringify((_b = {}, _b[primaryKey[0]] = "eq.".concat(id), _b));
        }
    }
};
var getKeyData = function (primaryKey, data) {
    var _a;
    if (isCompoundKey(primaryKey)) {
        return primaryKey.reduce(function (keyData, key) {
            var _a;
            return (__assign(__assign({}, keyData), (_a = {}, _a[key] = data[key], _a)));
        }, {});
    }
    else {
        return _a = {}, _a[primaryKey[0]] = data[primaryKey[0]], _a;
    }
};
var getOrderBy = function (field, order, primaryKey) {
    if (field == 'id') {
        return primaryKey.map(function (key) { return ("".concat(key, ".").concat(order.toLowerCase())); }).join(',');
    }
    else {
        return "".concat(field, ".").concat(order.toLowerCase());
    }
};
var defaultPrimaryKeys = new Map();
export default (function (apiUrl, httpClient, defaultListOp, primaryKeys) {
    if (httpClient === void 0) { httpClient = fetchUtils.fetchJson; }
    if (defaultListOp === void 0) { defaultListOp = 'eq'; }
    if (primaryKeys === void 0) { primaryKeys = defaultPrimaryKeys; }
    return ({
        getList: function (resource, params) {
            var primaryKey = getPrimaryKey(resource, primaryKeys);
            var _a = params.pagination, page = _a.page, perPage = _a.perPage;
            var _b = params.sort, field = _b.field, order = _b.order;
            var parsedFilter = parseFilters(params.filter, defaultListOp);
            var query = __assign({ order: getOrderBy(field, order, primaryKey), offset: (page - 1) * perPage, limit: perPage }, parsedFilter);
            // add header that Content-Range is in returned header
            var options = {
                headers: new Headers({
                    Accept: 'application/json',
                    Prefer: 'count=exact'
                })
            };
            var url = "".concat(apiUrl, "/").concat(resource, "?").concat(stringify(query));
            return httpClient(url, options).then(function (_a) {
                var headers = _a.headers, json = _a.json;
                if (!headers.has('content-range')) {
                    throw new Error("The Content-Range header is missing in the HTTP Response. The postgREST data provider expects \n          responses for lists of resources to contain this header with the total number of results to build \n          the pagination. If you are using CORS, did you declare Content-Range in the Access-Control-Expose-Headers header?");
                }
                return {
                    data: json.map(function (obj) { return dataWithId(obj, primaryKey); }),
                    total: parseInt(headers
                        .get('content-range')
                        .split('/')
                        .pop(), 10)
                };
            });
        },
        getOne: function (resource, params) {
            var id = params.id;
            var primaryKey = getPrimaryKey(resource, primaryKeys);
            var query = getQuery(primaryKey, id, resource);
            var url = "".concat(apiUrl, "/").concat(resource, "?").concat(query);
            return httpClient(url, {
                headers: new Headers({ 'accept': 'application/vnd.pgrst.object+json' }),
            }).then(function (_a) {
                var json = _a.json;
                return ({
                    data: dataWithId(json, primaryKey),
                });
            });
        },
        getMany: function (resource, params) {
            var ids = params.ids;
            var primaryKey = getPrimaryKey(resource, primaryKeys);
            var query = getQuery(primaryKey, ids, resource);
            var url = "".concat(apiUrl, "/").concat(resource, "?").concat(query);
            return httpClient(url).then(function (_a) {
                var json = _a.json;
                return ({ data: json.map(function (data) { return dataWithId(data, primaryKey); }) });
            });
        },
        getManyReference: function (resource, params) {
            var _a;
            var _b = params.pagination, page = _b.page, perPage = _b.perPage;
            var _c = params.sort, field = _c.field, order = _c.order;
            var parsedFilter = parseFilters(params.filter, defaultListOp);
            var primaryKey = getPrimaryKey(resource, primaryKeys);
            var query = params.target ? __assign((_a = {}, _a[params.target] = "eq.".concat(params.id), _a.order = getOrderBy(field, order, primaryKey), _a.offset = (page - 1) * perPage, _a.limit = perPage, _a), parsedFilter) : __assign({ order: getOrderBy(field, order, primaryKey), offset: (page - 1) * perPage, limit: perPage }, parsedFilter);
            // add header that Content-Range is in returned header
            var options = {
                headers: new Headers({
                    Accept: 'application/json',
                    Prefer: 'count=exact'
                })
            };
            var url = "".concat(apiUrl, "/").concat(resource, "?").concat(stringify(query));
            return httpClient(url, options).then(function (_a) {
                var headers = _a.headers, json = _a.json;
                if (!headers.has('content-range')) {
                    throw new Error("The Content-Range header is missing in the HTTP Response. The postgREST data provider expects \n          responses for lists of resources to contain this header with the total number of results to build \n          the pagination. If you are using CORS, did you declare Content-Range in the Access-Control-Expose-Headers header?");
                }
                return {
                    data: json.map(function (data) { return dataWithId(data, primaryKey); }),
                    total: parseInt(headers
                        .get('content-range')
                        .split('/')
                        .pop(), 10),
                };
            });
        },
        update: function (resource, params) {
            var id = params.id, data = params.data;
            var primaryKey = getPrimaryKey(resource, primaryKeys);
            var query = getQuery(primaryKey, id, resource);
            var primaryKeyData = getKeyData(primaryKey, data);
            var url = "".concat(apiUrl, "/").concat(resource, "?").concat(query);
            var body = JSON.stringify(__assign(__assign({}, data), primaryKeyData));
            return httpClient(url, {
                method: 'PATCH',
                headers: new Headers({
                    'Accept': 'application/vnd.pgrst.object+json',
                    'Prefer': 'return=representation',
                    'Content-Type': 'application/json'
                }),
                body: body,
            }).then(function (_a) {
                var json = _a.json;
                return ({ data: dataWithId(json, primaryKey) });
            });
        },
        updateMany: function (resource, params) {
            var ids = params.ids;
            var primaryKey = getPrimaryKey(resource, primaryKeys);
            var query = getQuery(primaryKey, ids, resource);
            var body = JSON.stringify(params.data.map(function (obj) {
                var id = obj.id, data = __rest(obj, ["id"]);
                var primaryKeyData = getKeyData(primaryKey, data);
                return __assign(__assign({}, data), primaryKeyData);
            }));
            var url = "".concat(apiUrl, "/").concat(resource, "?").concat(query);
            return httpClient(url, {
                method: 'PATCH',
                headers: new Headers({
                    'Prefer': 'return=representation',
                    'Content-Type': 'application/json',
                }),
                body: body,
            }).then(function (_a) {
                var json = _a.json;
                return ({
                    data: json.map(function (data) { return encodeId(data, primaryKey); })
                });
            });
        },
        create: function (resource, params) {
            var primaryKey = getPrimaryKey(resource, primaryKeys);
            var url = "".concat(apiUrl, "/").concat(resource);
            return httpClient(url, {
                method: 'POST',
                headers: new Headers({
                    'Accept': 'application/vnd.pgrst.object+json',
                    'Prefer': 'return=representation',
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify(params.data),
            }).then(function (_a) {
                var json = _a.json;
                return ({
                    data: __assign(__assign({}, params.data), { id: encodeId(json, primaryKey) })
                });
            });
        },
        delete: function (resource, params) {
            var id = params.id;
            var primaryKey = getPrimaryKey(resource, primaryKeys);
            var query = getQuery(primaryKey, id, resource);
            var url = "".concat(apiUrl, "/").concat(resource, "?").concat(query);
            return httpClient(url, {
                method: 'DELETE',
                headers: new Headers({
                    'Accept': 'application/vnd.pgrst.object+json',
                    'Prefer': 'return=representation',
                    'Content-Type': 'application/json'
                }),
            }).then(function (_a) {
                var json = _a.json;
                return ({ data: dataWithId(json, primaryKey) });
            });
        },
        deleteMany: function (resource, params) {
            var ids = params.ids;
            var primaryKey = getPrimaryKey(resource, primaryKeys);
            var query = getQuery(primaryKey, ids, resource);
            var url = "".concat(apiUrl, "/").concat(resource, "?").concat(query);
            return httpClient(url, {
                method: 'DELETE',
                headers: new Headers({
                    'Prefer': 'return=representation',
                    'Content-Type': 'application/json'
                }),
            }).then(function (_a) {
                var json = _a.json;
                return ({ data: json.map(function (data) { return encodeId(data, primaryKey); }) });
            });
        },
    });
});
