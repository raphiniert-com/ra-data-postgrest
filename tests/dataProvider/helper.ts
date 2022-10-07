import { fetchUtils } from 'ra-core';
import raPostgrestProvider from '../../src/index';

type HTTPClientMock = typeof fetchUtils.fetchJson;
const BASE_URL = 'http://localhost:3000';

function createDataProviderMock(
    expectedStatus: number,
    expectedBody: string,
    expectedJSON?: any,
    expectedOptions?: Record<string, any>
) {
    const httpClient = jest.fn((url, options) =>
        Promise.resolve({
            status: expectedStatus,
            body: expectedBody,
            json: expectedJSON,
            headers: new Headers(expectedOptions),
        })
    );
    const dataPovider = raPostgrestProvider(BASE_URL, httpClient);

    return { httpClient, dataPovider };
}

export type Case = {
    test: string;
    method: string;
    resource: string;
    params: Record<string, any>;
    responseHeaders?: Record<string, string>;
    expectedUrl: string;
    expectedOptions?: Record<string, any>;
};

export const makeTestFromCase = ({
    test,
    method,
    resource,
    params,
    responseHeaders,
    expectedUrl,
    expectedOptions,
}: Case) => {
    it(`${method} > ${test}`, async () => {
        const { httpClient, dataPovider } = createDataProviderMock(
            200,
            '',
            [],
            responseHeaders
        );

        await dataPovider[method](resource, params);

        const [actualUrl, actualOptions] = httpClient.mock.calls[0];

        expect(actualUrl).toBe(`${BASE_URL}${expectedUrl}`);

        if (
            actualOptions ||
            (expectedOptions && Object.keys(expectedOptions).length)
        ) {
            const {
                headers: actualHeaders,
                ...actualRestOptions
            } = actualOptions;

            // transform Headers to an object so it can be compared to the expectations (that is an object)
            const actualOptionsPreparedForTesting = {
                headers: Object.fromEntries(actualHeaders),
                ...actualRestOptions,
            };

            expect(actualOptionsPreparedForTesting).toStrictEqual(
                expectedOptions
            );
        }
    });
};
