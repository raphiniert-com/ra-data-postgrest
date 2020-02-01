"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jwt_decode_1 = __importDefault(require("jwt-decode"));
exports.default = {
    login: function (_a) {
        var username = _a.username, password = _a.password;
        var request = new Request('rest/rpc/login', {
            method: 'POST',
            body: JSON.stringify({ email: username, password: password }),
            headers: new Headers({
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.pgrst.object+json',
                'Prefer': 'return=representation'
            }),
        });
        return fetch(request)
            .then(function (response) {
            if (response.status < 200 || response.status >= 300) {
                throw new Error(response.statusText);
            }
            return response.json();
        })
            .then(function (data) {
            localStorage.setItem('token', data.token);
        });
    },
    logout: function (params) {
        var request = new Request('rest/rpc/logout', {
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.pgrst.object+json',
                'Prefer': 'return=representation'
            }),
        });
        return fetch(request)
            .then(function (response) {
            if (response.status < 200 || response.status >= 300) {
                throw new Error(response.statusText);
            }
            return response.json();
        })
            .then(function (data) {
            localStorage.removeItem('token');
        });
    },
    checkAuth: function (params) { var _a; return (((_a = jwt_decode_1.default(localStorage.getItem('token'))) === null || _a === void 0 ? void 0 : _a.role) ? Promise.resolve() : Promise.reject()); },
    checkError: function (error) {
        var status = error.status;
        if (status === 401 || status === 403) {
            localStorage.removeItem('token');
            return Promise.reject();
        }
        return Promise.resolve();
    },
    getPermissions: function (params) {
        var _a;
        var role = (_a = jwt_decode_1.default(localStorage.getItem('token'))) === null || _a === void 0 ? void 0 : _a.role;
        return role ? Promise.resolve(role) : Promise.reject();
    },
};
