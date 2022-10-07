import { fetchUtils } from 'ra-core';
import raPostgrestProvider from '../src/index';

type Case = {
    test: string;
    method: string;
    resource: string;
    params: Record<string, any>;
    responseHeaders?: Record<string, string>;
    expectedUrl: string;
    expectedHeaders: Record<string, string>;
};

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
    cases.forEach(
        ({
            test,
            method,
            resource,
            params,
            responseHeaders,
            expectedUrl,
            expectedHeaders,
        }) => {
            it(`${method} should build correct url for a ${test}`, async () => {
                const { httpClient, dataPovider } = createDataProviderMock(
                    200,
                    '',
                    [],
                    responseHeaders
                );

                await dataPovider[method](resource, params);

                expect(httpClient).toHaveBeenCalledWith(
                    `${BASE_URL}${expectedUrl}`,
                    makeHeaderExpectation(expectedHeaders)
                );
            });
        }
    );
});

type HTTPClientMock = typeof fetchUtils.fetchJson;
const BASE_URL = 'http://localhost:3000';

function createDataProviderMock(
    expectedStatus: number,
    expectedBody: string,
    expectedJSON?: any,
    expectedHeaders?: Record<string, string>
) {
    const httpClient = jest.fn(url =>
        Promise.resolve({
            status: expectedStatus,
            headers: new Headers(expectedHeaders),
            body: expectedBody,
            json: expectedJSON,
        })
    );
    const dataPovider = raPostgrestProvider(BASE_URL, httpClient);

    return { httpClient, dataPovider };
}

function makeHeaderExpectation(headers) {
    return {
        headers: new Headers(headers),
    };
}
