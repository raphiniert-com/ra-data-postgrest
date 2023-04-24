import { enc } from '../urlBuilder/helper';
import { makeTestFromCase, Case } from './helper';

const customSchema = () => ('custom');

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
        expectedUrl: '/posts?offset=0&limit=10&order=title.desc',
        expectedOptions: {
            headers: {
                accept: 'application/json',
                prefer: 'count=exact',
                'accept-profile': 'custom',
            },
        },
        httpClientResponseHeaders: {
            'content-range': '0-9/100',
        },
        schema: customSchema,
    },
    {
        test: 'Read a single resource, by id',
        method: 'getOne',
        resource: 'posts',
        params: { id: 1, meta: { } },
        expectedUrl: '/posts?id=eq.1',
        expectedOptions: {
            headers: {
                accept: 'application/vnd.pgrst.object+json',
                'accept-profile': 'custom',
            },
        },
        schema: customSchema,
    },
    {
        test: 'Read a list of resource, by ids',
        method: 'getMany',
        resource: 'posts',
        params: { ids: [1, 2, 3], meta: {} },
        expectedUrl: `/posts?id=in.${enc('(1,2,3)')}`,
        expectedOptions: {
            headers: {
                'accept-profile': 'custom',
            },
        },
        schema: customSchema,
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
        expectedUrl:
            '/comments?post_id=eq.1&order=title.desc&offset=0&limit=10',
        expectedOptions: {
            headers: {
                accept: 'application/json',
                prefer: 'count=exact',
                'accept-profile': 'custom',
            },
        },
        httpClientResponseHeaders: {
            'content-range': '0-9/100',
        },
        schema: customSchema,
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
                'content-profile': 'custom',
            },
        },
        schema: customSchema,
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
                'content-profile': 'custom',
            },
        },
        schema: customSchema,
    },
    {
        test: 'Update multiple resources',
        method: 'updateMany',
        resource: 'posts',
        params: { ids: [1, 2, 3], data: { title: 'hello, world!' }, meta: {} },
        expectedUrl: '/posts',
        expectedOptions: {
            method: 'PATCH',
            // TODO: The id's in the body should actually be numbers!
            body: JSON.stringify([
                { title: 'hello, world!', id: '1' },
                { title: 'hello, world!', id: '2' },
                { title: 'hello, world!', id: '3' },
            ]),
            headers: {
                prefer: 'return=representation',
                'content-type': 'application/json',
                'content-profile': 'custom',
            },
        },
        schema: customSchema,
    },
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
                'content-profile': 'custom',
            },
        },
        schema: customSchema,
    },
    {
        test: 'Delete multiple resources',
        method: 'deleteMany',
        resource: 'posts',
        params: { ids: [1, 2, 3], meta: {} },
        expectedUrl: `/posts?id=in.${enc('(1,2,3)')}`,
        expectedOptions: {
            method: 'DELETE',
            headers: {
                prefer: 'return=representation',
                'content-type': 'application/json',
                'content-profile': 'custom',
            },
        },
        schema: customSchema,
    },
];

// input the custom schema using meta data
const customSchemaMeta = 'custom_meta';

const cases_meta: Case[] = [
    {
        test: '[meta] Search for resources',
        method: 'getList',
        resource: 'posts',
        params: {
            pagination: { page: 1, perPage: 10 },
            sort: { field: 'title', order: 'desc' },
            filter: {},
            meta: { schema: customSchemaMeta },
        },
        expectedUrl: '/posts?offset=0&limit=10&order=title.desc',
        expectedOptions: {
            headers: {
                accept: 'application/json',
                prefer: 'count=exact',
                'accept-profile': 'custom_meta',
            },
        },
        httpClientResponseHeaders: {
            'content-range': '0-9/100',
        },
        schema: customSchema,
    },
    {
        test: '[meta] Read a single resource, by id',
        method: 'getOne',
        resource: 'posts',
        params: { id: 1, meta: { schema: customSchemaMeta } },
        expectedUrl: '/posts?id=eq.1',
        expectedOptions: {
            headers: {
                accept: 'application/vnd.pgrst.object+json',
                'accept-profile': 'custom_meta',
            },
        },
        schema: customSchema,
    },
    {
        test: '[meta] Read a list of resource, by ids',
        method: 'getMany',
        resource: 'posts',
        params: { ids: [1, 2, 3], meta: { schema: customSchemaMeta } },
        expectedUrl: `/posts?id=in.${enc('(1,2,3)')}`,
        expectedOptions: {
            headers: {
                'accept-profile': 'custom_meta',
            },
        },
        schema: customSchema,
    },
    {
        test: '[meta] Read a list of resources related to another one',
        method: 'getManyReference',
        resource: 'comments',
        params: {
            target: 'post_id',
            id: 1,
            pagination: { page: 1, perPage: 10 },
            sort: { field: 'title', order: 'desc' },
            filter: {},
            meta: { schema: customSchemaMeta },
        },
        expectedUrl:
            '/comments?post_id=eq.1&order=title.desc&offset=0&limit=10',
        expectedOptions: {
            headers: {
                accept: 'application/json',
                prefer: 'count=exact',
                'accept-profile': 'custom_meta',
            },
        },
        httpClientResponseHeaders: {
            'content-range': '0-9/100',
        },
        schema: customSchema,
    },
    {
        test: '[meta] Create a single resource',
        method: 'create',
        resource: 'posts',
        params: { 
            data: { title: 'hello, world!' }, 
            meta: { schema: customSchemaMeta } 
        },
        expectedUrl: '/posts',
        expectedOptions: {
            method: 'POST',
            body: JSON.stringify({ title: 'hello, world!' }),
            headers: {
                accept: 'application/vnd.pgrst.object+json',
                prefer: 'return=representation',
                'content-type': 'application/json',
                'content-profile': 'custom_meta',
            },
        },
        schema: customSchema,
    },
    {
        test: '[meta] Update a single resource',
        method: 'update',
        resource: 'posts',
        params: {
            id: 1,
            data: { title: 'hello, world!' },
            previousData: { title: 'previous title' },
            meta: { schema: customSchemaMeta },
        },
        expectedUrl: '/posts?id=eq.1',
        expectedOptions: {
            method: 'PATCH',
            body: JSON.stringify({ title: 'hello, world!' }),
            headers: {
                accept: 'application/vnd.pgrst.object+json',
                prefer: 'return=representation',
                'content-type': 'application/json',
                'content-profile': 'custom_meta',
            },
        },
        schema: customSchema,
    },
    {
        test: '[meta] Update multiple resources',
        method: 'updateMany',
        resource: 'posts',
        params: { 
            ids: [1, 2, 3], 
            data: { title: 'hello, world!' }, 
            meta: { schema: customSchemaMeta } 
        },
        expectedUrl: '/posts',
        expectedOptions: {
            method: 'PATCH',
            // TODO: The id's in the body should actually be numbers!
            body: JSON.stringify([
                { title: 'hello, world!', id: '1' },
                { title: 'hello, world!', id: '2' },
                { title: 'hello, world!', id: '3' },
            ]),
            headers: {
                prefer: 'return=representation',
                'content-type': 'application/json',
                'content-profile': 'custom_meta',
            },
        },
        schema: customSchema,
    },
    {
        test: '[meta] Delete a single resource',
        method: 'delete',
        resource: 'posts',
        params: { 
            id: 1, 
            previousData: { title: 'previous title' }, 
            meta: { schema: customSchemaMeta }
        },
        expectedUrl: '/posts?id=eq.1',
        expectedOptions: {
            method: 'DELETE',
            headers: {
                accept: 'application/vnd.pgrst.object+json',
                prefer: 'return=representation',
                'content-type': 'application/json',
                'content-profile': 'custom_meta',
            },
        },
        schema: customSchema,
    },
    {
        test: '[meta] Delete multiple resources',
        method: 'deleteMany',
        resource: 'posts',
        params: { ids: [1, 2, 3], meta: { schema: customSchemaMeta } },
        expectedUrl: `/posts?id=in.${enc('(1,2,3)')}`,
        expectedOptions: {
            method: 'DELETE',
            headers: {
                prefer: 'return=representation',
                'content-type': 'application/json',
                'content-profile': 'custom_meta',
            },
        },
        schema: customSchema,
    },
];

describe('[custom schema] All methods and its basic signature', () => {
    cases.forEach(makeTestFromCase);
    cases_meta.forEach(makeTestFromCase);
});
