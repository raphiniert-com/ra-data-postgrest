import { encodeId } from '../../src/urlBuilder';
import { qs } from '../urlBuilder/helper';
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
            test: 'normal resource',
            method,
            resource: 'todos',
            params: {
                id: 2,
            },
            expectedUrl: `/todos?id=eq.2`,
            expectedOptions,
        },
        {
            test: 'normal resource with compound primary key',
            method,
            resource: 'contacts',
            params: {
                id: JSON.stringify([1, 'X']),
            },
            expectedUrl: `/contacts?${qs({ and: '(id.eq.1,type.eq.X)' })}`,
            expectedOptions,
        },
        {
            test: 'rpc resource',
            method,
            resource: 'rpc/get_todo',
            params: {
                id: 2,
            },
            // TODO: I would actually expect `/rpc/get_todo?id=2`, wouldn't you?
            expectedUrl: `/rpc/get_todo?id=eq.2`,
            expectedOptions,
        },
        // TODO: Decide what to actually expect here!
        // {
        //     test: 'rpc resource with compound primary key',
        //     method,
        //     resource: 'rpc/get_contact',
        //     params: {
        //         id: JSON.stringify([1, 'X']),
        //     },
        //     expectedUrl: `/rpc/get_contact?and=(id.eq.1,type.eq.X)`,
        //     expectedOptions,
        // },
    ];

    cases.forEach(makeTestFromCase);
});
