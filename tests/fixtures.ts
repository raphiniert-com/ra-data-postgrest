import { PrimaryKey } from '../src/urlBuilder';

export const primaryKeySingle: PrimaryKey = ['id'];
export const primaryKeyCompound: PrimaryKey = ['id', 'type'];
export const resourcePimaryKeys = new Map<string, PrimaryKey>();
resourcePimaryKeys.set('contacts', primaryKeyCompound);
resourcePimaryKeys.set('licenses', ['license_id']);

export const SINGLE_TODO = {
    id: 2,
    todo: 'item_2',
    private: true,
    mine: false,
    user_id: 3,
};

export const TODO_LIST = [
    {
        id: 1,
        todo: 'item_1',
        private: false,
        mine: true,
        user_id: 1,
    },
    {
        id: 2,
        todo: 'item_2',
        private: true,
        mine: false,
        user_id: 3,
    },
    {
        id: 3,
        todo: 'item_3',
        private: false,
        mine: false,
        user_id: 2,
    },
    {
        id: 4,
        todo: 'item_4',
        private: true,
        mine: true,
        user_id: 1,
    },
    {
        id: 5,
        todo: 'item_5',
        private: true,
        mine: false,
        user_id: 3,
    },
    {
        id: 6,
        todo: 'item_6',
        private: false,
        mine: false,
        user_id: 2,
    },
];

export const SINGLE_CONTACT = {
    id: 1,
    type: 'X',
    labels: ['A', 'B'],
};

export const CONTACT_LIST = [
    { ...SINGLE_CONTACT },
    {
        id: 2,
        type: 'Y',
        labels: ['A', 'C'],
    },
];

export const SINGLE_LICENSE = {
    license_id: '000aba4f-3011-4059-a7c1-7462dd053862',
    user_id: 1,
};

export const LICENSE_LIST = [
    { ...SINGLE_LICENSE },
    {
        license_id: '111f688f-9863-4bf0-a885-ffd4d38d6ece',
        user_id: 2,
    },
];
