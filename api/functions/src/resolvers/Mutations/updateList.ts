import EmailTemplate = require('email-templates');
import * as fbAdmin from 'firebase-admin';
import { ForbiddenError } from 'apollo-server-express';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { Context } from '../../apolloServer';
import { firestore, listsCollRef } from '../../firebase';
import { ListDB, TodoDB, UserGQL, ListMemberInfoGQL, UserDB, Email, UID } from '../../schema';
import { pubsub, LIST_EVENTS } from '../Subscription';
import { authorize } from './auth';

interface UpdateListArgs {
  id: string;
  name?: string;
  order?: number;
  newMembers?: Email[];
}

const postmarkTransport = require('nodemailer-postmark-transport');
const transport = nodemailer.createTransport(
  postmarkTransport({
    auth: {
      apiKey: '1c36a2fb-83e9-4563-ad47-ffc33f535791', // TODO: envify this
    },
  }),
);

export default async function updateList(
  parent: any,
  args: UpdateListArgs,
  ctx: Context,
  info: any,
) {
  authorize(ctx);
  let members: (Email | UID)[] = [];
  let metadata = null;
  let filteredNewMembers: Email[] = [];
  try {
    // ====== BEGIN TRANSACTION =============================================
    const listUpdated = await firestore.runTransaction(async (tx) => {
      const current_uid = (ctx.user as fbAdmin.auth.DecodedIdToken).uid;
      const todoListDocRef = listsCollRef.doc(args.id);
      const todoListData = (await tx.get(todoListDocRef)).data() as ListDB;
      members = todoListData.members;
      if (!members.includes(current_uid as UID)) {
        // TODO: test this
        throw new ForbiddenError('Not authorized to touch anything in this list.');
      }
      let order = todoListData.member_info[current_uid].order;
      const membersGQL: ListMemberInfoGQL[] = await Promise.all(
        members.map(async (uid) => {
          const authUserRecord = await fbAdmin.auth().getUser(uid);
          const userDocSnapshot = await tx.get(firestore.collection('users').doc(uid));
          const dbUserRecord = userDocSnapshot.data() as UserDB;
          const user: UserGQL = {
            ...authUserRecord,
            ...dbUserRecord,
            id: userDocSnapshot.id,
          };
          return {
            ...todoListData.member_info[uid],
            user,
          };
        }),
      );
      const todosQuerySnapshot = await tx.get(todoListDocRef.collection('todos'));
      const todos = todosQuerySnapshot.docs.map((d) => ({
        ...(d.data() as TodoDB),
        id: d.id,
        list_id: args.id,
      }));
      const { name, order: newOrder, newMembers } = args;
      const updates: Partial<ListDB> = {};
      if (name) updates.name = name;
      if (newMembers) {
        // 1: add new members to pending_members
        const currentMemberEmails = membersGQL.map((m) => m.user.email as string);
        filteredNewMembers = newMembers.filter(
          (m) => !currentMemberEmails.includes(m) && !todoListData.pending_members.includes(m),
        );
        if (filteredNewMembers.length > 0) {
          updates.pending_members = todoListData.pending_members.concat(filteredNewMembers);
          // 2: for each one that has a user record, add this list to [user].pending_lists
          const dbUserDocSnapshots = await Promise.all(
            filteredNewMembers.map(async (email) => {
              try {
                const authUserRecord = await fbAdmin.auth().getUserByEmail(email);
                const dbUserDocSnapshot = await tx.get(
                  firestore.collection('users').doc(authUserRecord.uid),
                );
                return dbUserDocSnapshot;
              } catch (error) {
                // no user record found for this email
                return null;
              }
            }),
          );
          // TODO: handle list member deletion (both existing and pending)
          dbUserDocSnapshots.forEach((userDocSnapshot) => {
            if (userDocSnapshot) {
              const existingPendingLists = (userDocSnapshot.data() as UserDB).pending_lists;
              tx.set(
                userDocSnapshot.ref,
                { pending_lists: existingPendingLists.concat(todoListDocRef) },
                { merge: true },
              );
            }
          });
        }
      }
      if (newOrder) {
        order = newOrder;
        updates.member_info = {
          [current_uid]: {
            ...todoListData.member_info[current_uid],
            order: newOrder,
          },
        };
        let listsQuerySnapshot: FirebaseFirestore.QuerySnapshot;
        const prevOrder = todoListData.member_info[current_uid].order;
        metadata = { prevOrder };
        if (newOrder > prevOrder) {
          listsQuerySnapshot = await tx.get(
            listsCollRef.where('members', 'array-contains', current_uid),
          );
          listsQuerySnapshot.forEach((list) => {
            const ord = (list.data() as ListDB).member_info[current_uid].order;
            if (ord <= newOrder && ord > prevOrder) {
              const newOrd = ord - 1;
              tx.update(list.ref, `member_info.${current_uid}.order`, newOrd);
            }
          });
        } else {
          listsQuerySnapshot = await tx.get(
            listsCollRef.where('members', 'array-contains', current_uid),
          );
          listsQuerySnapshot.forEach((list) => {
            const ord = (list.data() as ListDB).member_info[current_uid].order;
            if (ord >= newOrder && ord < prevOrder) {
              const newOrd = ord + 1;
              tx.update(list.ref, `member_info.${current_uid}.order`, newOrd);
            }
          });
        }
      }
      tx.update(todoListDocRef, updates);
      const updatedListData = {
        ...todoListData,
        ...updates,
        members: membersGQL,
        todos,
        order,
        id: args.id,
      };
      if (filteredNewMembers.length > 0) {
        console.log('about ');
        const mail = new EmailTemplate({
          message: {
            from: 'info@productivize.net',
          },
          transport,
        });
        const currentUserAuthData = await fbAdmin.auth().getUser(current_uid);
        const currentUserDBData = (await firestore
          .collection('users')
          .doc(current_uid)
          .get()).data() as UserDB;
        filteredNewMembers.forEach(async (newMemberEmail) => {
          await mail.send({
            template: path.join(__dirname, '..', '..', 'emails', 'list-invite'),
            message: {
              to: newMemberEmail,
            },
            locals: {
              inviter: {
                email: currentUserAuthData.email,
                first_name: currentUserDBData.first_name,
                last_name: currentUserDBData.last_name,
              },
              list_name: updatedListData.name,
            },
          });
        });
      }
      return updatedListData;
    });
    // ====== END TRANSACTION ===============================================
    // TODO: handle addition of new members on FE
    pubsub.publish(LIST_EVENTS, {
      listUpdated,
      metadata,
      members,
    });
    console.log('listUpdated:', listUpdated);
    return listUpdated;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}
