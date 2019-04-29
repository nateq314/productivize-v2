import EmailTemplate = require('email-templates');
import * as fbAdmin from 'firebase-admin';
import { ForbiddenError } from 'apollo-server-express';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { Context } from '../../apolloServer';
import { firestore, listsCollRef, auth } from '../../firebase';
import { ListDB, UserDB, Email, UID } from '../../schema';
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
  console.log('RESOLVER updateList()');
  authorize(ctx);
  let members: UID[] = [];
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
      const { name, order: newOrder, newMembers } = args;
      const updates: Partial<ListDB> = {};

      /**
       * NAME
       */
      if (name) updates.name = name;

      /**
       * PENDING MEMBERS
       */
      if (newMembers) {
        // 1: add new members to pending_members
        const memberUserRecords = await Promise.all(members.map((uid) => auth.getUser(uid)));
        const memberEmails = memberUserRecords.map((m) => m.email);
        filteredNewMembers = newMembers.filter(
          (m) => !memberEmails.includes(m) && !todoListData.pending_members.includes(m),
        );
        if (filteredNewMembers.length > 0) {
          updates.pending_members = todoListData.pending_members.concat(filteredNewMembers);
          // 2: for each one that has a user record, add this list to [user].list_invitations
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
              const existingPendingLists = (userDocSnapshot.data() as UserDB).list_invitations;
              tx.set(
                userDocSnapshot.ref,
                { list_invitations: existingPendingLists.concat(args.id) },
                { merge: true },
              );
            }
          });
        }
      }

      /**
       * ORDER
       */
      if (newOrder) {
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

      /**
       * Do the update.
       */
      tx.update(todoListDocRef, updates);
      const updatedListData = {
        ...todoListData,
        ...updates,
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
