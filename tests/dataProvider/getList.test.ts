import { makeTestFromCase, Case } from './helper';
import { PostgRestSortOrder } from '../../src/index';
import {
    PREFETCHED_TAGS,
    PREFETCHED_USERS,
    TODO_LIST,
    TODO_LIST_WITH_PREFETCHED_TAGS_USER,
} from '../fixtures';

describe('getList specific', () => {
    const method = 'getList';

    const cases: Case[] = [
        {
            test: 'simple request with sorting and pagination',
            method,
            resource: 'posts',
            params: {
                pagination: {
                    page: 1,
                    perPage: 10,
                },
                sort: {
                    field: 'id',
                    order: 'ASC',
                },
                filter: {},
            },
            expectedUrl: `/posts?offset=0&limit=10&order=id.asc`,
            expectedOptions: {
                headers: {
                    accept: 'application/json',
                    prefer: 'count=exact',
                },
            },
            httpClientResponseHeaders: {
                'content-range': '0-9/100',
            },
        },
        {
            test: 'throws error when no content-range response header is present',
            method,
            resource: 'posts',
            params: {
                pagination: {
                    page: 1,
                    perPage: 10,
                },
                sort: {
                    field: 'id',
                    order: 'ASC',
                },
                filter: {},
            },
            throws: /the content-range header is missing/i,
        },
        {
            test: 'should not remove the embedded data from the result nor add it to the meta',
            method,
            resource: 'todos',
            params: {
                pagination: {
                    page: 1,
                    perPage: 10,
                },
                sort: {
                    field: 'id',
                    order: 'DESC',
                },
                filter: {},
                meta: { embed: ['tags', 'users'] },
            },
            httpClientResponseBody: TODO_LIST_WITH_PREFETCHED_TAGS_USER,
            httpClientResponseHeaders: {
                'content-range': '0-9/100',
            },
            expectedUrl: `/todos?offset=0&limit=10&order=id.desc&select=%2A%2Ctags%28%2A%29%2Cusers%28%2A%29`,
            expectedOptions: {
                headers: {
                    accept: 'application/json',
                    prefer: 'count=exact',
                },
            },
            expectedResult: {
                data: TODO_LIST_WITH_PREFETCHED_TAGS_USER,
                total: 100,
                meta: undefined,
            },
        },
        {
            test: 'should remove the prefetched data from the result and add it to the meta',
            method,
            resource: 'todos',
            params: {
                pagination: {
                    page: 1,
                    perPage: 10,
                },
                sort: {
                    field: 'id',
                    order: 'DESC',
                },
                filter: {},
                meta: { prefetch: ['tags', 'users'] },
            },
            httpClientResponseBody: TODO_LIST_WITH_PREFETCHED_TAGS_USER,
            httpClientResponseHeaders: {
                'content-range': '0-9/100',
            },
            expectedUrl: `/todos?offset=0&limit=10&order=id.desc&select=%2A%2Ctags%28%2A%29%2Cusers%28%2A%29`,
            expectedOptions: {
                headers: {
                    accept: 'application/json',
                    prefer: 'count=exact',
                },
            },
            expectedResult: {
                data: TODO_LIST,
                total: 100,
                meta: {
                    prefetched: {
                        tags: PREFETCHED_TAGS,
                        users: PREFETCHED_USERS,
                    },
                },
            },
        },
    ];

    cases.forEach(makeTestFromCase);

    describe('meta', () => {
        describe('nullsfirst', () => {
            makeTestFromCase({
                test: 'nullsfirst true added in meta changes the sort order',
                method,
                resource: 'posts',
                params: {
                    pagination: {
                        page: 1,
                        perPage: 10,
                    },
                    sort: {
                        field: 'id',
                        order: 'ASC',
                    },
                    filter: {},
                    meta: { nullsfirst: true },
                },
                expectedUrl: `/posts?offset=0&limit=10&order=id.asc.nullsfirst`,
                expectedOptions: {
                    headers: {
                        accept: 'application/json',
                        prefer: 'count=exact',
                    },
                },
                httpClientResponseHeaders: {
                    'content-range': '0-9/100',
                },
            });
            makeTestFromCase({
                test: 'nullsfirst true added in meta is compatible with the default sort order',
                method,
                config: {
                    sortOrder:
                        PostgRestSortOrder.AscendingNullsFirstDescendingNullsFirst,
                },
                resource: 'posts',
                params: {
                    pagination: {
                        page: 1,
                        perPage: 10,
                    },
                    sort: {
                        field: 'id',
                        order: 'ASC',
                    },
                    filter: {},
                    meta: { nullsfirst: true },
                },
                expectedUrl: `/posts?offset=0&limit=10&order=id.asc.nullsfirst`,
                expectedOptions: {
                    headers: {
                        accept: 'application/json',
                        prefer: 'count=exact',
                    },
                },
                httpClientResponseHeaders: {
                    'content-range': '0-9/100',
                },
            });
            makeTestFromCase({
                test: 'nullsfirst true added in meta overrides the default sort order',
                method,
                config: {
                    sortOrder:
                        PostgRestSortOrder.AscendingNullsLastDescendingNullsFirst,
                },
                resource: 'posts',
                params: {
                    pagination: {
                        page: 1,
                        perPage: 10,
                    },
                    sort: {
                        field: 'id',
                        order: 'ASC',
                    },
                    filter: {},
                    meta: { nullsfirst: true },
                },
                expectedUrl: `/posts?offset=0&limit=10&order=id.asc.nullsfirst`,
                expectedOptions: {
                    headers: {
                        accept: 'application/json',
                        prefer: 'count=exact',
                    },
                },
                httpClientResponseHeaders: {
                    'content-range': '0-9/100',
                },
            });
            makeTestFromCase({
                test: 'nullsfirst false added in meta overrides the default sort order',
                method,
                config: {
                    sortOrder:
                        PostgRestSortOrder.AscendingNullsFirstDescendingNullsFirst,
                },
                resource: 'posts',
                params: {
                    pagination: {
                        page: 1,
                        perPage: 10,
                    },
                    sort: {
                        field: 'id',
                        order: 'ASC',
                    },
                    filter: {},
                    meta: { nullsfirst: false },
                },
                expectedUrl: `/posts?offset=0&limit=10&order=id.asc`,
                expectedOptions: {
                    headers: {
                        accept: 'application/json',
                        prefer: 'count=exact',
                    },
                },
                httpClientResponseHeaders: {
                    'content-range': '0-9/100',
                },
            });
        });

        describe('nullslast', () => {
            makeTestFromCase({
                test: 'nullslast true added in meta changes the sort order',
                method,
                resource: 'posts',
                params: {
                    pagination: {
                        page: 1,
                        perPage: 10,
                    },
                    sort: {
                        field: 'id',
                        order: 'DESC',
                    },
                    filter: {},
                    meta: { nullslast: true },
                },
                expectedUrl: `/posts?offset=0&limit=10&order=id.desc.nullslast`,
                expectedOptions: {
                    headers: {
                        accept: 'application/json',
                        prefer: 'count=exact',
                    },
                },
                httpClientResponseHeaders: {
                    'content-range': '0-9/100',
                },
            });
            makeTestFromCase({
                test: 'nullslast true added in meta is compatible with the default sort order',
                method,
                config: {
                    sortOrder:
                        PostgRestSortOrder.AscendingNullsLastDescendingNullsLast,
                },
                resource: 'posts',
                params: {
                    pagination: {
                        page: 1,
                        perPage: 10,
                    },
                    sort: {
                        field: 'id',
                        order: 'DESC',
                    },
                    filter: {},
                    meta: { nullslast: true },
                },
                expectedUrl: `/posts?offset=0&limit=10&order=id.desc.nullslast`,
                expectedOptions: {
                    headers: {
                        accept: 'application/json',
                        prefer: 'count=exact',
                    },
                },
                httpClientResponseHeaders: {
                    'content-range': '0-9/100',
                },
            });
            makeTestFromCase({
                test: 'nullslast true added in meta overrides the default sort order',
                method,
                config: {
                    sortOrder:
                        PostgRestSortOrder.AscendingNullsFirstDescendingNullsFirst,
                },
                resource: 'posts',
                params: {
                    pagination: {
                        page: 1,
                        perPage: 10,
                    },
                    sort: {
                        field: 'id',
                        order: 'DESC',
                    },
                    filter: {},
                    meta: { nullslast: true },
                },
                expectedUrl: `/posts?offset=0&limit=10&order=id.desc.nullslast`,
                expectedOptions: {
                    headers: {
                        accept: 'application/json',
                        prefer: 'count=exact',
                    },
                },
                httpClientResponseHeaders: {
                    'content-range': '0-9/100',
                },
            });
            makeTestFromCase({
                test: 'nullslast false added in meta overrides the default sort order',
                method,
                config: {
                    sortOrder:
                        PostgRestSortOrder.AscendingNullsLastDescendingNullsLast,
                },
                resource: 'posts',
                params: {
                    pagination: {
                        page: 1,
                        perPage: 10,
                    },
                    sort: {
                        field: 'id',
                        order: 'DESC',
                    },
                    filter: {},
                    meta: { nullslast: false },
                },
                expectedUrl: `/posts?offset=0&limit=10&order=id.desc`,
                expectedOptions: {
                    headers: {
                        accept: 'application/json',
                        prefer: 'count=exact',
                    },
                },
                httpClientResponseHeaders: {
                    'content-range': '0-9/100',
                },
            });
        });
    });
});
