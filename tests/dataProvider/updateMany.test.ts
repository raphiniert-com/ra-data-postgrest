import { encodeId } from '../../src/urlBuilder';
import { makeTestFromCase, Case } from './helper';

describe('updateMany specific', () => {
    const method = 'updateMany';

    const cases: Case[] = [
        {
            test: 'Update multiple resources with compound primary key',
            method,
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
