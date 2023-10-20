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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSchema = exports.defaultPrimaryKeys = void 0;
var urlBuilder_1 = require("./urlBuilder");
var qs_1 = __importDefault(require("qs"));
exports.defaultPrimaryKeys = new Map();
var defaultSchema = function () { return ''; };
exports.defaultSchema = defaultSchema;
var useCustomSchema = function (schema, metaSchema, method) {
    var _a;
    var funcHeaderSchema = schema;
    if (metaSchema !== undefined) {
        funcHeaderSchema = function () { return metaSchema; };
    }
    if (funcHeaderSchema().length > 0) {
        var schemaHeader = '';
        if (['GET', 'HEAD'].includes(method)) {
            schemaHeader = 'Accept-Profile';
        }
        else if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
            schemaHeader = 'Content-Profile';
        }
        else
            return {};
        return _a = {}, _a[schemaHeader] = funcHeaderSchema(), _a;
    }
    else
        return {};
};
exports.default = (function (config) { return ({
    getList: function (resource, params) {
        var _a, _b;
        if (params === void 0) { params = {}; }
        var primaryKey = (0, urlBuilder_1.getPrimaryKey)(resource, config.primaryKeys);
        var _c = params.pagination, page = _c.page, perPage = _c.perPage;
        var _d = params.sort || {}, field = _d.field, order = _d.order;
        var _e = (0, urlBuilder_1.parseFilters)(params, config.defaultListOp), filter = _e.filter, select = _e.select;
        var metaSchema = (_a = params.meta) === null || _a === void 0 ? void 0 : _a.schema;
        var query = __assign({ offset: String((page - 1) * perPage), limit: String(perPage) }, filter);
        if (field) {
            query.order = (0, urlBuilder_1.getOrderBy)(field, order, primaryKey);
        }
        if (select) {
            query.select = select;
        }
        // add header that Content-Range is in returned header
        var options = {
            headers: new Headers(__assign(__assign({ Accept: 'application/json', Prefer: 'count=exact' }, (((_b = params.meta) === null || _b === void 0 ? void 0 : _b.headers) || {})), useCustomSchema(config.schema, metaSchema, 'GET'))),
        };
        var url = "".concat(config.apiUrl, "/").concat(resource, "?").concat(qs_1.default.stringify(query));
        return config.httpClient(url, options).then(function (_a) {
            var headers = _a.headers, json = _a.json;
            if (!headers.has('content-range')) {
                throw new Error("The Content-Range header is missing in the HTTP Response. The postgREST data provider expects \n          responses for lists of resources to contain this header with the total number of results to build \n          the pagination. If you are using CORS, did you declare Content-Range in the Access-Control-Expose-Headers header?");
            }
            return {
                data: json.map(function (obj) { return (0, urlBuilder_1.dataWithVirtualId)(obj, primaryKey); }),
                total: parseInt(headers.get('content-range').split('/').pop(), 10),
            };
        });
    },
    getOne: function (resource, params) {
        var _a, _b;
        if (params === void 0) { params = {}; }
        var id = params.id, meta = params.meta;
        var primaryKey = (0, urlBuilder_1.getPrimaryKey)(resource, config.primaryKeys);
        var query = (0, urlBuilder_1.getQuery)(primaryKey, id, resource, meta);
        var url = "".concat(config.apiUrl, "/").concat(resource, "?").concat(qs_1.default.stringify(query));
        var metaSchema = (_a = params.meta) === null || _a === void 0 ? void 0 : _a.schema;
        return config
            .httpClient(url, {
            headers: new Headers(__assign(__assign({ accept: 'application/vnd.pgrst.object+json' }, (((_b = params.meta) === null || _b === void 0 ? void 0 : _b.headers) || {})), useCustomSchema(config.schema, metaSchema, 'GET'))),
        })
            .then(function (_a) {
            var json = _a.json;
            return ({
                data: (0, urlBuilder_1.dataWithVirtualId)(json, primaryKey),
            });
        });
    },
    getMany: function (resource, params) {
        var _a;
        if (params === void 0) { params = {}; }
        var ids = params.ids;
        var primaryKey = (0, urlBuilder_1.getPrimaryKey)(resource, config.primaryKeys);
        var query = (0, urlBuilder_1.getQuery)(primaryKey, ids, resource, params.meta);
        var url = "".concat(config.apiUrl, "/").concat(resource, "?").concat(qs_1.default.stringify(query));
        var metaSchema = (_a = params.meta) === null || _a === void 0 ? void 0 : _a.schema;
        return config
            .httpClient(url, {
            headers: new Headers(__assign({}, useCustomSchema(config.schema, metaSchema, 'GET'))),
        })
            .then(function (_a) {
            var json = _a.json;
            return ({
                data: json.map(function (data) { return (0, urlBuilder_1.dataWithVirtualId)(data, primaryKey); }),
            });
        });
    },
    getManyReference: function (resource, params) {
        var _a;
        var _b, _c;
        if (params === void 0) { params = {}; }
        var _d = params.pagination, page = _d.page, perPage = _d.perPage;
        var _e = params.sort, field = _e.field, order = _e.order;
        var _f = (0, urlBuilder_1.parseFilters)(params, config.defaultListOp), filter = _f.filter, select = _f.select;
        var primaryKey = (0, urlBuilder_1.getPrimaryKey)(resource, config.primaryKeys);
        var metaSchema = (_b = params.meta) === null || _b === void 0 ? void 0 : _b.schema;
        var query = params.target
            ? __assign((_a = {}, _a[params.target] = "eq.".concat(params.id), _a.order = (0, urlBuilder_1.getOrderBy)(field, order, primaryKey), _a.offset = String((page - 1) * perPage), _a.limit = String(perPage), _a), filter) : __assign({ order: (0, urlBuilder_1.getOrderBy)(field, order, primaryKey), offset: String((page - 1) * perPage), limit: String(perPage) }, filter);
        if (select) {
            query.select = select;
        }
        // add header that Content-Range is in returned header
        var options = {
            headers: new Headers(__assign(__assign({ Accept: 'application/json', Prefer: 'count=exact' }, (((_c = params.meta) === null || _c === void 0 ? void 0 : _c.headers) || {})), useCustomSchema(config.schema, metaSchema, 'GET'))),
        };
        var url = "".concat(config.apiUrl, "/").concat(resource, "?").concat(qs_1.default.stringify(query));
        return config.httpClient(url, options).then(function (_a) {
            var headers = _a.headers, json = _a.json;
            if (!headers.has('content-range')) {
                throw new Error("The Content-Range header is missing in the HTTP Response. The postgREST data provider expects \n          responses for lists of resources to contain this header with the total number of results to build \n          the pagination. If you are using CORS, did you declare Content-Range in the Access-Control-Expose-Headers header?");
            }
            return {
                data: json.map(function (data) { return (0, urlBuilder_1.dataWithVirtualId)(data, primaryKey); }),
                total: parseInt(headers.get('content-range').split('/').pop(), 10),
            };
        });
    },
    update: function (resource, params) {
        var _a, _b;
        if (params === void 0) { params = {}; }
        var id = params.id, data = params.data, meta = params.meta;
        var primaryKey = (0, urlBuilder_1.getPrimaryKey)(resource, config.primaryKeys);
        var query = (0, urlBuilder_1.getQuery)(primaryKey, id, resource, meta);
        var url = "".concat(config.apiUrl, "/").concat(resource, "?").concat(qs_1.default.stringify(query));
        var metaSchema = (_a = params.meta) === null || _a === void 0 ? void 0 : _a.schema;
        var body = JSON.stringify(__assign({}, (0, urlBuilder_1.dataWithoutVirtualId)((0, urlBuilder_1.removePrimaryKey)(data, primaryKey), primaryKey)));
        return config
            .httpClient(url, {
            method: 'PATCH',
            headers: new Headers(__assign(__assign({ Accept: 'application/vnd.pgrst.object+json', Prefer: 'return=representation', 'Content-Type': 'application/json' }, (((_b = params.meta) === null || _b === void 0 ? void 0 : _b.headers) || {})), useCustomSchema(config.schema, metaSchema, 'PATCH'))),
            body: body,
        })
            .then(function (_a) {
            var json = _a.json;
            return ({ data: (0, urlBuilder_1.dataWithVirtualId)(json, primaryKey) });
        });
    },
    updateMany: function (resource, params) {
        var _a, _b;
        if (params === void 0) { params = {}; }
        var ids = params.ids, meta = params.meta, data = params.data;
        var primaryKey = (0, urlBuilder_1.getPrimaryKey)(resource, config.primaryKeys);
        var query = (0, urlBuilder_1.getQuery)(primaryKey, ids, resource, meta);
        var url = "".concat(config.apiUrl, "/").concat(resource, "?").concat(qs_1.default.stringify(query));
        var body = JSON.stringify(__assign({}, (0, urlBuilder_1.dataWithoutVirtualId)((0, urlBuilder_1.removePrimaryKey)(data, primaryKey), primaryKey)));
        var metaSchema = (_a = params.meta) === null || _a === void 0 ? void 0 : _a.schema;
        return config
            .httpClient(url, {
            method: 'PATCH',
            headers: new Headers(__assign(__assign({ Prefer: 'return=representation', 'Content-Type': 'application/json' }, (((_b = params.meta) === null || _b === void 0 ? void 0 : _b.headers) || {})), useCustomSchema(config.schema, metaSchema, 'PATCH'))),
            body: body,
        })
            .then(function (_a) {
            var json = _a.json;
            return ({
                data: json.map(function (data) { return (0, urlBuilder_1.encodeId)(data, primaryKey); }),
            });
        });
    },
    create: function (resource, params) {
        var _a, _b;
        if (params === void 0) { params = {}; }
        var meta = params.meta;
        var primaryKey = (0, urlBuilder_1.getPrimaryKey)(resource, config.primaryKeys);
        var query = (0, urlBuilder_1.getQuery)(primaryKey, undefined, resource, meta);
        var queryStr = qs_1.default.stringify(query);
        var url = "".concat(config.apiUrl, "/").concat(resource).concat(queryStr.length > 0 ? '?' : '').concat(queryStr);
        var metaSchema = (_a = params.meta) === null || _a === void 0 ? void 0 : _a.schema;
        return config
            .httpClient(url, {
            method: 'POST',
            headers: new Headers(__assign(__assign({ Accept: 'application/vnd.pgrst.object+json', Prefer: 'return=representation', 'Content-Type': 'application/json' }, (((_b = params.meta) === null || _b === void 0 ? void 0 : _b.headers) || {})), useCustomSchema(config.schema, metaSchema, 'POST'))),
            body: JSON.stringify((0, urlBuilder_1.dataWithoutVirtualId)(params.data, primaryKey)),
        })
            .then(function (_a) {
            var json = _a.json;
            return ({
                data: __assign(__assign({}, json), { id: (0, urlBuilder_1.encodeId)(json, primaryKey) }),
            });
        });
    },
    delete: function (resource, params) {
        var _a, _b;
        if (params === void 0) { params = {}; }
        var id = params.id, meta = params.meta;
        var primaryKey = (0, urlBuilder_1.getPrimaryKey)(resource, config.primaryKeys);
        var query = (0, urlBuilder_1.getQuery)(primaryKey, id, resource, meta);
        var url = "".concat(config.apiUrl, "/").concat(resource, "?").concat(qs_1.default.stringify(query));
        var metaSchema = (_a = params.meta) === null || _a === void 0 ? void 0 : _a.schema;
        return config
            .httpClient(url, {
            method: 'DELETE',
            headers: new Headers(__assign(__assign({ Accept: 'application/vnd.pgrst.object+json', Prefer: 'return=representation', 'Content-Type': 'application/json' }, (((_b = params.meta) === null || _b === void 0 ? void 0 : _b.headers) || {})), useCustomSchema(config.schema, metaSchema, 'DELETE'))),
        })
            .then(function (_a) {
            var json = _a.json;
            return ({ data: (0, urlBuilder_1.dataWithVirtualId)(json, primaryKey) });
        });
    },
    deleteMany: function (resource, params) {
        var _a, _b;
        if (params === void 0) { params = {}; }
        var ids = params.ids, meta = params.meta;
        var primaryKey = (0, urlBuilder_1.getPrimaryKey)(resource, config.primaryKeys);
        var query = (0, urlBuilder_1.getQuery)(primaryKey, ids, resource, meta);
        var url = "".concat(config.apiUrl, "/").concat(resource, "?").concat(qs_1.default.stringify(query));
        var metaSchema = (_a = params.meta) === null || _a === void 0 ? void 0 : _a.schema;
        return config
            .httpClient(url, {
            method: 'DELETE',
            headers: new Headers(__assign(__assign({ Prefer: 'return=representation', 'Content-Type': 'application/json' }, (((_b = params.meta) === null || _b === void 0 ? void 0 : _b.headers) || {})), useCustomSchema(config.schema, metaSchema, 'DELETE'))),
        })
            .then(function (_a) {
            var json = _a.json;
            return ({
                data: json.map(function (data) { return (0, urlBuilder_1.encodeId)(data, primaryKey); }),
            });
        });
    },
}); });
