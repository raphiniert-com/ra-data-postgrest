"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
            localStorage.setItem('me', JSON.stringify(data));
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
            localStorage.removeItem('me');
        });
    },
    checkAuth: function (params) { return (localStorage.getItem('me') ? Promise.resolve() : Promise.reject()); },
    checkError: function (error) {
        var status = error.status;
        if (status === 401 || status === 403) {
            localStorage.removeItem('me');
            return Promise.reject();
        }
        return Promise.resolve();
    },
    getPermissions: function (params) {
        var _a;
        var role = (_a = JSON.parse(localStorage.getItem('me'))) === null || _a === void 0 ? void 0 : _a.role;
        return role ? Promise.resolve(role) : Promise.reject();
    },
};
