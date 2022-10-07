import { makeTestFromCase, Case } from './helper';

const cases: Case[] = [
    {
        test: 'Search for resources',
        method: 'getList',
        resource: 'posts',
        params: {
            pagination: { page: 1, perPage: 10 },
            sort: { field: 'title', order: 'desc' },
            filter: {},
            meta: {},
        },
        responseHeaders: {
            'content-range': '0-9/100',
        },
        expectedUrl: '/posts?order=title.desc&offset=0&limit=10',
        expectedOptions: {
            headers: {
                accept: 'application/json',
                prefer: 'count=exact',
            },
        },
    },
    {
        test: 'Read a single resource, by id',
        method: 'getOne',
        resource: 'posts',
        params: { id: 1, meta: {} },
        expectedUrl: '/posts?id=eq.1',
        expectedOptions: {
            headers: {
                accept: 'application/vnd.pgrst.object+json',
            },
        },
    },
    {
        test: 'Read a list of resource, by ids',
        method: 'getMany',
        resource: 'posts',
        params: { ids: [1, 2, 3], meta: {} },
        expectedUrl: '/posts?id=in.%281%2C2%2C3%29',
    },
    {
        test: 'Read a list of resources related to another one',
        method: 'getManyReference',
        resource: 'comments',
        params: {
            target: 'post_id',
            id: 1,
            pagination: { page: 1, perPage: 10 },
            sort: { field: 'title', order: 'desc' },
            filter: {},
            meta: {},
        },
        responseHeaders: {
            'content-range': '0-9/100',
        },
        expectedUrl:
            '/comments?post_id=eq.1&order=title.desc&offset=0&limit=10',
        expectedOptions: {
            headers: {
                accept: 'application/json',
                prefer: 'count=exact',
            },
        },
    },
    {
        test: 'Create a single resource',
        method: 'create',
        resource: 'posts',
        params: { data: { title: 'hello, world!' }, meta: {} },
        expectedUrl: '/posts',
        expectedOptions: {
            method: 'POST',
            body: JSON.stringify({ title: 'hello, world!' }),
            headers: {
                accept: 'application/vnd.pgrst.object+json',
                prefer: 'return=representation',
                'content-type': 'application/json',
            },
        },
    },
    {
        test: 'Update a single resource',
        method: 'update',
        resource: 'posts',
        params: {
            id: 1,
            data: { title: 'hello, world!' },
            previousData: { title: 'previous title' },
            meta: {},
        },
        expectedUrl: '/posts?id=eq.1',
        expectedOptions: {
            method: 'PATCH',
            body: JSON.stringify({ title: 'hello, world!' }),
            headers: {
                accept: 'application/vnd.pgrst.object+json',
                prefer: 'return=representation',
                'content-type': 'application/json',
            },
        },
    },
    // TODO: fails because dataProvider expects data to be an array, but it should be an object
    // {
    //     test: 'Update multiple resources',
    //     method: 'updateMany',
    //     resource: 'posts',
    //     params: { ids: [1, 2, 3], data: { title: 'hello, world!' }, meta: {} },
    //     expectedUrl: '/posts?xxx',
    // },
    {
        test: 'Delete a single resource',
        method: 'delete',
        resource: 'posts',
        params: { id: 1, previousData: { title: 'previous title' }, meta: {} },
        expectedUrl: '/posts?id=eq.1',
        expectedOptions: {
            method: 'DELETE',
            headers: {
                accept: 'application/vnd.pgrst.object+json',
                prefer: 'return=representation',
                'content-type': 'application/json',
            },
        },
    },
    {
        test: 'Delete multiple resources',
        method: 'deleteMany',
        resource: 'posts',
        params: { ids: [1, 2, 3], meta: {} },
        expectedUrl: '/posts?id=in.%281%2C2%2C3%29',
        expectedOptions: {
            method: 'DELETE',
            headers: {
                prefer: 'return=representation',
                'content-type': 'application/json',
            },
        },
    },
];

describe('All methods and its basic signature', () => {
    cases.forEach(makeTestFromCase);
});
