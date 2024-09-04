import { fetchUtils } from 'ra-core';
import raPostgrestProvider, { IDataProviderConfig } from '../../src/index';
import { resourcePrimaryKeys } from '../fixtures';

type HTTPClientMock = typeof fetchUtils.fetchJson;
const BASE_URL = 'http://localhost:3000';

function createDataProviderMock(
    mockedResponseStatus: number,
    mockedResponseBody: string,
    mockedResponseJSON?: any,
    mockedResponseOptions?: Record<string, any>,
    mockedCustomSchema?: () => string,
    config?: Partial<IDataProviderConfig>
) {
    const httpClient = jest.fn((url, options) =>
        Promise.resolve({
            status: mockedResponseStatus,
            body: mockedResponseBody,
            json: mockedResponseJSON,
            headers: new Headers(mockedResponseOptions),
        })
    );

    const customSchema: () => string = mockedCustomSchema
        ? mockedCustomSchema
        : () => '';

    const dataProviderConfig: IDataProviderConfig = {
        apiUrl: BASE_URL,
        httpClient: httpClient,
        defaultListOp: 'eq',
        primaryKeys: resourcePrimaryKeys,
        schema: customSchema,
        ...config,
    };

    const dataProvider = raPostgrestProvider(dataProviderConfig);

    return { httpClient, dataProvider };
}

export type Case = {
    test: string;
    method: string;
    resource: string;
    params: Record<string, any>;
    httpClientResponseHeaders?: Record<string, string>;
    httpClientResponseBody?: any;
    expectedUrl?: string;
    expectedOptions?: Record<string, any>;
    expectedResult?: any;
    schema?: () => string;
    throws?: RegExp;
    config?: Partial<IDataProviderConfig>;
};

export const makeTestFromCase = ({
    test,
    method,
    resource,
    params,
    httpClientResponseHeaders,
    httpClientResponseBody = [],
    expectedUrl,
    expectedOptions,
    expectedResult,
    schema,
    throws,
    config,
}: Case) => {
    it(`${method} > ${test}`, async () => {
        const { httpClient, dataProvider } = createDataProviderMock(
            200,
            '',
            httpClientResponseBody,
            httpClientResponseHeaders,
            schema,
            config
        );

        let dataProviderResult;

        try {
            dataProviderResult = await dataProvider[method](resource, params);
        } catch (e) {
            if (throws) {
                expect(e.message).toMatch(throws);
            } else {
                throw e;
            }
            return; // when an error occurred, it's not useful to test url and options
        }

        const [actualUrl, actualOptions] = httpClient.mock.calls[0];

        expect(actualUrl).toBe(`${BASE_URL}${expectedUrl}`);

        if (
            actualOptions ||
            (expectedOptions && Object.keys(expectedOptions).length)
        ) {
            const { headers: actualHeaders, ...actualRestOptions } =
                actualOptions;

            // transform Headers to an object so it can be compared to the expectations (that is an object)
            const actualOptionsPreparedForTesting = {
                headers: Object.fromEntries(actualHeaders),
                ...actualRestOptions,
            };

            expect(actualOptionsPreparedForTesting).toStrictEqual(
                expectedOptions
            );
        }
        if (expectedResult) {
            expect(dataProviderResult).toStrictEqual(expectedResult);
        }
    });
};
