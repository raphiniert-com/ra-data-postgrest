import { encodeId } from '../../src/urlBuilder';
import { makeTestFromCase, Case } from './helper';

describe('getOne specific', () => {
    const method = 'getOne';
    const expectedOptions = {
        headers: {
            accept: 'application/vnd.pgrst.object+json',
        },
    };

    const cases: Case[] = [
        {
            test: 'Update multiple resources with compound primary key',
            method: 'updateMany',
            resource: 'contacts',
            params: {
                ids: [JSON.stringify([1, 'X']), JSON.stringify([2, 'Y'])],
                data: { name: 'new name' },
                meta: {},
            },
            expectedUrl: '/contacts',
            expectedOptions: {
                method: 'PATCH',
                body: JSON.stringify([
                    { name: 'new name', id: 1, type: 'X' },
                    { name: 'new name', id: 2, type: 'Y' },
                ]),
                headers: {
                    prefer: 'return=representation',
                    'content-type': 'application/json',
                },
            },
        },
    ];

    cases.forEach(makeTestFromCase);
});
