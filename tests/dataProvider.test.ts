import { makeTestFromCase, Case } from './helper';

const cases: Case[] = [
    {
        test: 'simple request',
        method: 'getOne',
        resource: 'Patient',
        params: {
            id: 2,
        },
        expectedUrl: `/Patient?id=eq.2`,
        expectedHeaders: {
            accept: 'application/vnd.pgrst.object+json',
        },
    },
    {
        test: 'simple request with sorting and pagination',
        method: 'getList',
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
        expectedHeaders: {
            Accept: 'application/json',
            Prefer: 'count=exact',
        },
    },
];

describe('urlBuilder', () => {
    cases.forEach(makeTestFromCase);
});
