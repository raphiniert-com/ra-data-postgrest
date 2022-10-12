import { encodeId } from '../../src/urlBuilder';
import { makeTestFromCase, Case } from './helper';

describe('getOne specific', () => {
    const cases: Case[] = [
        {
            test: 'normal resource',
            method: 'getOne',
            resource: 'todos',
            params: {
                id: 2,
            },
            expectedUrl: `/todos?id=eq.2`,
            expectedOptions: {
                headers: {
                    accept: 'application/vnd.pgrst.object+json',
                },
            },
        },
        {
            test: 'normal resource with compound primary key',
            method: 'getOne',
            resource: 'contacts',
            params: {
                id: JSON.stringify([1, 'X']),
            },
            expectedUrl: `/contacts?and=(id.eq.1,type.eq.X)`,
            expectedOptions: {
                headers: {
                    accept: 'application/vnd.pgrst.object+json',
                },
            },
        },
        {
            test: 'rpc resource',
            method: 'getOne',
            resource: 'rpc/get_todo',
            params: {
                id: 2,
            },
            // TODO: I would actually expect `/rpc/get_todo?id=2`, wouldn't you?
            expectedUrl: `/rpc/get_todo?id=eq.2`,
            expectedOptions: {
                headers: {
                    accept: 'application/vnd.pgrst.object+json',
                },
            },
        },
        // TODO: Decide what to actually expect here!
        // {
        //     test: 'rpc resource with compound primary key',
        //     method: 'getOne',
        //     resource: 'rpc/get_contact',
        //     params: {
        //         id: JSON.stringify([1, 'X']),
        //     },
        //     expectedUrl: `/rpc/get_contact?and=(id.eq.1,type.eq.X)`,
        //     expectedOptions: {
        //         headers: {
        //             accept: 'application/vnd.pgrst.object+json',
        //         },
        //     },
        // },
    ];

    cases.forEach(makeTestFromCase);
});
