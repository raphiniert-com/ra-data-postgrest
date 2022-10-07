import { fetchUtils } from 'ra-core';
import raPostgrestProvider from '../src/index';

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
            body: expectedBody,
            json: expectedJSON,
            headers: new Headers(expectedHeaders),
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

export type Case = {
    test: string;
    method: string;
    resource: string;
    params: Record<string, any>;
    responseHeaders?: Record<string, string>;
    expectedUrl: string;
    expectedHeaders: Record<string, string>;
};

export const makeTestFromCase = ({
    test,
    method,
    resource,
    params,
    responseHeaders,
    expectedUrl,
    expectedHeaders,
}: Case) => {
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
};
