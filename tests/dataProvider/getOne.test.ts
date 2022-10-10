import { makeTestFromCase, Case } from './helper';

describe('getOne specific', () => {
    const cases: Case[] = [
        {
            test: 'simple request',
            method: 'getOne',
            resource: 'Patient',
            params: {
                id: 2,
            },
            expectedUrl: `/Patient?id=eq.2`,
            expectedOptions: {
                headers: {
                    accept: 'application/vnd.pgrst.object+json',
                },
            },
        },
    ];

    cases.forEach(makeTestFromCase);
});
