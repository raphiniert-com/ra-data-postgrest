declare const _default: {
    login: ({ username, password }: {
        username: any;
        password: any;
    }) => Promise<void>;
    logout: (params: any) => Promise<void>;
    checkAuth: (params: any) => Promise<void>;
    checkError: (error: any) => Promise<void>;
    getPermissions: (params: any) => Promise<any>;
};
export default _default;
