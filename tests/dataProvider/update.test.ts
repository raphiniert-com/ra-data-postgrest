import qs from 'qs';
import { makeTestFromCase, Case } from './helper';
import dataProviderBuilder from '../../src';

describe('update specific', () => {
    const method = 'update';

    const cases: Case[] = [
        {
            test: 'Update resource with compound primary key',
            method,
            resource: 'contacts',
            params: {
                id: JSON.stringify([1, 'X']),
                data: { name: 'new name', unchanged: 'value' },
                previousData: { name: 'old name', unchanged: 'value' },
                meta: {},
            },
            expectedUrl: '/contacts?'.concat(
                qs.stringify({ and: '(id.eq.1,type.eq.X)' })
            ),
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

    it('should not fail when no changes are requested', async () => {
        const dataProvider = dataProviderBuilder({} as any);
        const { data } = await dataProvider.update('posts', {
            id: 123,
            data: { foo: 'bar' },
            previousData: { id: 123, foo: 'bar' },
        });
        expect(data).toEqual({ id: 123, foo: 'bar' });
    });
});
