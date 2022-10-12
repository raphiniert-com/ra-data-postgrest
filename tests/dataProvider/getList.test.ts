import { makeTestFromCase, Case } from './helper';

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
            responseHeaders: {
                'content-range': '0-9/100',
            },
            expectedUrl: `/posts?order=id.asc&offset=0&limit=10`,
            expectedOptions: {
                headers: {
                    accept: 'application/json',
                    prefer: 'count=exact',
                },
            },
        },
        {
            test:
                'throws error when no content-range response header is present',
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
    ];

    cases.forEach(makeTestFromCase);
});
