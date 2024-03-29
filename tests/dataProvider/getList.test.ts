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
    ];

    cases.forEach(makeTestFromCase);
});
