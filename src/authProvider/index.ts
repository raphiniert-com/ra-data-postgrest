export default {
  login: ({ username, password }) => {
    const request = new Request('rest/rpc/login', {
      method: 'POST',
      body: JSON.stringify({ email: username, password }),
      headers: new Headers({
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.pgrst.object+json',
        'Prefer': 'return=representation'
      }),
    });
    return fetch(request)
      .then(response => {
        if (response.status < 200 || response.status >= 300) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then((data) => {
        localStorage.setItem('me', JSON.stringify(data));
      });
  },
  logout: (params) => {
    const request = new Request('rest/rpc/logout', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.pgrst.object+json',
        'Prefer': 'return=representation'
      }),
    });
    return fetch(request)
      .then(response => {
        if (response.status < 200 || response.status >= 300) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then((data) => {
        localStorage.removeItem('me');
      });
  },
  checkAuth: params => (localStorage.getItem('me') ? Promise.resolve() : Promise.reject()),
  checkError: error => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      return Promise.reject();
    }
    return Promise.resolve();
  },
  getPermissions: params => {
    const role = JSON.parse(localStorage.getItem('me'))?.role;
    return role ? Promise.resolve(role) : Promise.reject();
  },
};