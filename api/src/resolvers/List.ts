import { TodoDB, ListDB, CombinedUserDB, UserDB } from '../schema';
import { auth, firestore, listsCollRef, usersCollRef } from '../firebase';

export default {
  admin: async ({ admin }: ListDB): Promise<CombinedUserDB> => {
    console.log('RESOLVER List.admin');
    const authUserRecord = await auth.getUser(admin);
    const dbUserRecord = (await usersCollRef.doc(admin).get()).data() as UserDB;
    return {
      ...authUserRecord,
      ...dbUserRecord,
    };
  },

  members: async ({ members }: ListDB): Promise<CombinedUserDB[]> => {
    console.log('RESOLVER List.members');
    const authUserRecords = await Promise.all(members.map((m) => auth.getUser(m)));
    const dbUserDocRefs = members.map((uid) => usersCollRef.doc(uid));
    const dbUserRecords = await firestore.getAll(...dbUserDocRefs);
    return authUserRecords.map((authUserRecord, idx) => ({
      ...authUserRecord,
      ...(dbUserRecords[idx].data() as UserDB),
    }));
  },

  order: ({ admin, member_info, order }: ListDB & { order?: number }) => {
    console.log('RESOLVER List.order');
    if (!order) return member_info[admin].order;
    return order;
  },

  todos: async ({ id }: ListDB & { id: string }) => {
    console.log('RESOLVER List.todos');
    const querySnapshot = await listsCollRef
      .doc(id)
      .collection('todos')
      .get();

    const todos = querySnapshot.docs.map((todoDoc) => ({
      ...(todoDoc.data() as TodoDB),
      list_id: id,
      id: todoDoc.id,
    }));

    return todos;
  },
};
