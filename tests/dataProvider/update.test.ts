import { encodeId } from '../../src/urlBuilder';
import { makeTestFromCase, Case } from './helper';

describe('update specific', () => {
    const method = 'update';

    const cases: Case[] = [
        {
            test: 'Update resource with compound primary key',
            method,
            resource: 'contacts',
            params: {
                id: JSON.stringify([1, 'X']),
                data: { name: 'new name' },
                meta: {},
            },
            expectedUrl: '/contacts?and=(id.eq.1,type.eq.X)',
            expectedOptions: {
                method: 'PATCH',
                body: JSON.stringify({ name: 'new name' }),
                headers: {
                    accept: 'application/vnd.pgrst.object+json',
                    prefer: 'return=representation',
                    'content-type': 'application/json',
                },
            },
        },
    ];

    cases.forEach(makeTestFromCase);
});
