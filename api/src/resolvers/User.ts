import { CombinedUserDB, ListDB, UserDB } from '../schema';
import { listsCollRef } from '../firebase';
import { firestore } from 'firebase-admin';

export default {
  id: ({ uid }: CombinedUserDB) => {
    console.log('RESOLVER User.id');
    return uid;
  },

  list_invitations: async ({ list_invitations }: UserDB) => {
    console.log('RESOLVER User.list_invitations');
    if (list_invitations.length > 0) {
      // return an array of Lists
      const listRefs = list_invitations.map((list_id) => listsCollRef.doc(list_id));
      const listDocSnapshots = await firestore().getAll(...listRefs);
      const listsData = listDocSnapshots.map((l) => ({
        ...(l.data() as ListDB),
        id: l.id,
      }));
      return listsData;
    }
    return [];
  },

  list_memberships: async ({ lists }: UserDB) => {
    console.log('RESOLVER User.list_memberships');
    const listDocSnapshots = await firestore().getAll(...lists);
    const listsData = listDocSnapshots.map((l) => ({
      ...(l.data() as ListDB),
      id: l.id,
    }));
    return listsData;
  },
};
