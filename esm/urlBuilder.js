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
/**
 * List of all possible operators in PostgRest
 * (https://postgrest.org/en/stable/api.html#operators)
 */
var postgrestOperators = [
    'eq',
    'gt',
    'gte',
    'lt',
    'lte',
    'neq',
    'like',
    'ilike',
    'match',
    'imatch',
    'in',
    'is',
    'fts',
    'plfts',
    'phfts',
    'wfts',
    'cs',
    'cd',
    'ov',
    'sl',
    'sr',
    'nxr',
    'nxl',
    'adj',
    'not',
    'or',
    'and',
];
var isObject = function (obj) {
    return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
};
var resolveKeys = function (filter, keys) {
    var result = filter[keys[0]];
    for (var i = 1; i < keys.length; ++i) {
        result = result[keys[i]];
    }
    return result;
};
export var parseFilters = function (params, defaultListOp) {
    var filter = params.filter, _a = params.meta, meta = _a === void 0 ? {} : _a;
    var result = {};
    result.filter = {};
    Object.keys(filter).forEach(function (key) {
        // key: the name of the object key
        var keyArray = [key];
        var values;
        // in case of a nested object selection in a text field
        // RA returns object{ object } structure which is resolved here
        // see issue https://github.com/raphiniert-com/ra-data-postgrest/issues/58
        if (key.split('@')[0] !== '' && isObject(filter[key])) {
            var innerVal = filter[key];
            do {
                var inner = resolveKeys(filter, keyArray);
                var innerKey = Object.keys(inner)[0];
                keyArray.push(innerKey);
                innerVal = inner[innerKey];
            } while (isObject(innerVal));
            key = keyArray.join('.');
            values = [innerVal];
        }
        else {
            values = [filter[key]];
        }
        var splitKey = key.split('@');
        var operation = splitKey.length == 2
            ? splitKey[1]
            : defaultListOp;
        if (['like', 'ilike'].includes(operation)) {
            // we split the search term in words
            values = resolveKeys(filter, keyArray).trim().split(/\s+/);
        }
        // CASE: Logical operator
        else if (['or', 'and'].includes(operation)) {
            // we extract each value entries and make it dot separated string.
            var subFilter = parseFilters({ filter: resolveKeys(filter, keyArray) }, defaultListOp).filter;
            // something like { "age@lt": 18 } and { "age@gt": 21 }
            var filterExpressions_1 = [];
            Object.entries(subFilter).forEach(function (_a) {
                var op = _a[0], val = _a[1];
                if (Array.isArray(val))
                    filterExpressions_1.push.apply(filterExpressions_1, val.map(function (v) { return [op, v].join('.'); }));
                else
                    filterExpressions_1.push([op, val].join('.'));
            });
            // finally we flatten all as single string and enclose with bracket.
            values = ["(".concat(filterExpressions_1.join(','), ")")];
        }
        values.forEach(function (value) {
            var op = (function () {
                // if operator is intentionally blank, rpc syntax
                if (operation.length === 0)
                    return "".concat(value);
                if (operation.includes('like'))
                    return "".concat(operation, ".*").concat(value, "*");
                if (['and', 'or'].includes(operation))
                    return "".concat(value);
                if (['cs', 'cd'].includes(operation))
                    return "".concat(operation, ".{").concat(value, "}");
                return "".concat(operation, ".").concat(value);
            })();
            // If resulting filter doesn't contain the fieldname, then add it.
            if (result.filter[splitKey[0]] === undefined) {
                // first operator for the key,
                if (['and', 'or'].includes(operation)) {
                    result.filter[operation] = op;
                }
                else {
                    // we add it to the dict
                    result.filter[splitKey[0]] = op;
                }
            }
            else {
                if (!Array.isArray(result[splitKey[0]])) {
                    // second operator, we transform to an array
                    result.filter[splitKey[0]] = [
                        result.filter[splitKey[0]],
                        op,
                    ];
                }
                else {
                    // third and subsequent, we add to array
                    result.filter[splitKey[0]].push(op);
                }
            }
        });
    });
    if (meta === null || meta === void 0 ? void 0 : meta.columns) {
        result.select = Array.isArray(meta.columns)
            ? meta.columns.join(',')
            : meta.columns;
    }
    return result;
};
export var getPrimaryKey = function (resource, primaryKeys) {
    return primaryKeys.get(resource) || ['id'];
};
export var decodeId = function (id, primaryKey) {
    if (isCompoundKey(primaryKey)) {
        return JSON.parse(id.toString());
    }
    else {
        return [id.toString()];
    }
};
export var encodeId = function (data, primaryKey) {
    if (isCompoundKey(primaryKey)) {
        return JSON.stringify(primaryKey.map(function (key) { return data[key]; }));
    }
    else {
        return data[primaryKey[0]];
    }
};
export var removePrimaryKey = function (data, primaryKey) {
    var newData = __assign({}, data);
    primaryKey.forEach(function (key) { delete newData[key]; });
    return newData;
};
export var dataWithVirtualId = function (data, primaryKey) {
    if (primaryKey.length === 1 && primaryKey[0] === 'id') {
        return data;
    }
    return Object.assign(data, {
        id: encodeId(data, primaryKey),
    });
};
export var dataWithoutVirtualId = function (data, primaryKey) {
    if (primaryKey.length === 1 && primaryKey[0] === 'id') {
        return data;
    }
    var id = data.id, dataWithoutId = __rest(data, ["id"]);
    return dataWithoutId;
};
var isCompoundKey = function (primaryKey) {
    return primaryKey.length > 1;
};
export var getQuery = function (primaryKey, ids, resource, meta) {
    var _a, _b;
    if (meta === void 0) { meta = null; }
    var result = {};
    if (Array.isArray(ids) && ids.length > 1) {
        // no standardized query with multiple ids possible for rpc endpoints which are api-exposed database functions
        if (resource.startsWith('rpc/')) {
            console.error("PostgREST's rpc endpoints are not intended to be handled as views. Therefore, no query generation for multiple key values implemented!");
            return;
        }
        if (isCompoundKey(primaryKey)) {
            result = {
                or: "(".concat(ids.map(function (id) {
                    var primaryKeyParams = decodeId(id, primaryKey);
                    return "and(".concat(primaryKey
                        .map(function (key, i) { return "".concat(key, ".eq.").concat(primaryKeyParams[i]); })
                        .join(','), ")");
                }), ")"),
            };
        }
        else {
            result = (_a = {},
                _a[primaryKey[0]] = "in.(".concat(ids.join(','), ")"),
                _a);
        }
    }
    else if (ids) {
        // if ids is one Identifier
        var id = ids.toString();
        var primaryKeyParams_1 = decodeId(id, primaryKey);
        if (isCompoundKey(primaryKey)) {
            if (resource.startsWith('rpc/')) {
                result = {};
                primaryKey.map(function (key, i) {
                    return (result[key] = "".concat(primaryKeyParams_1[i]));
                });
            }
            else {
                result = {
                    and: "(".concat(primaryKey.map(function (key, i) {
                        return "".concat(key, ".eq.").concat(primaryKeyParams_1[i]);
                    }), ")"),
                };
            }
        }
        else {
            result = (_b = {},
                _b[primaryKey[0]] = "eq.".concat(id),
                _b);
        }
    }
    if (meta && meta.columns) {
        result.select = Array.isArray(meta.columns)
            ? meta.columns.join(',')
            : meta.columns;
    }
    return result;
};
export var getOrderBy = function (field, order, primaryKey) {
    if (field == 'id') {
        return primaryKey.map(function (key) { return "".concat(key, ".").concat(order.toLowerCase()); }).join(',');
    }
    else {
        return "".concat(field, ".").concat(order.toLowerCase());
    }
};
