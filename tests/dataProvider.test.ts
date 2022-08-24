import { fetchUtils, SORT_ASC, SORT_DESC } from "ra-core";

import { SINGLE_TODO, TODO_LIST } from "./mockup.data";
import dataProvider from "../src/index";

type HTTPClientMock = typeof fetchUtils.fetchJson;

describe("test dataProvider", () => {
    const BASE_URL = "http://localhost:3000";

    test("minimal arguments for dataprovider", () => {
        const t = () => {
            dataProvider(BASE_URL)
                .getOne("Patient", { id: SINGLE_TODO.id })
                .then((response) => response != undefined);
        };
        expect(t).not.toThrow(TypeError);
    });

    describe("getList", () => {
        test("test page offset, sort and return value", () => {
            const httpClient = createHTTPClientMock(
                200,
                undefined,
                undefined,
                TODO_LIST
            );

        });
    });

    describe("getOne", () => {
        test("with Entity ID", () => {
            const httpClient = createHTTPClientMock(
                200,
                undefined,
                undefined,
                SINGLE_TODO
            );
        });


    });

});

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
