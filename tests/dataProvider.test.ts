import { fetchUtils } from 'ra-core';
import raPostgrestProvider from '../src/index';

describe('getOne', () => {
    it('should build correct url for a simple getOne request', async () => {
        const { httpClient, dataPovider } = createDataProviderMock();

        await dataPovider.getOne('Patient', { id: 2 });

        expect(httpClient).toHaveBeenCalledWith(
            `${BASE_URL}/Patient?id=eq.2`,
            makeHeaderExpectation({
                accept: 'application/vnd.pgrst.object+json',
            })
        );
    });
});

type HTTPClientMock = typeof fetchUtils.fetchJson;
const BASE_URL = 'http://localhost:3000';

function createDataProviderMock() {
    const httpClient: HTTPClientMock = jest.fn(() => Promise.resolve({}));
    const dataPovider = raPostgrestProvider(BASE_URL, httpClient);

    return { httpClient, dataPovider };
}

function makeHeaderExpectation(headers) {
    return {
        headers: new Headers(headers),
    };
}

/**
 * Helper method for creating a jest function which mocks a HTTP client.
 */
function createHTTPClientMock(
    expectedStatus: number,
    expectedHeaders?: Headers,
    expectedBody?: string,
    expectedJSON?: any
): HTTPClientMock {
    return jest.fn(() =>
        Promise.resolve({
            status: expectedStatus,
            headers: expectedHeaders,
            body: expectedBody,
            json: expectedJSON,
        })
    );
}
