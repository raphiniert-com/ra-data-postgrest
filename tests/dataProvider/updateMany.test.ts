import { encodeId } from '../../src/urlBuilder';
import { makeTestFromCase, Case } from './helper';
import qs from 'qs'

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
            expectedUrl: '/contacts?'.concat(qs.stringify({or: '(and(id.eq.1,type.eq.X),and(id.eq.2,type.eq.Y))'})),
            expectedOptions: {
                method: 'PATCH',
                body: JSON.stringify({ name: 'new name' }),
                headers: {
                    prefer: 'return=representation',
                    'content-type': 'application/json',
                },
            },
        },
    ];

    cases.forEach(makeTestFromCase);
});
