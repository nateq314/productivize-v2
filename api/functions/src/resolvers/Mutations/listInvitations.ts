import { ForbiddenError, ApolloError } from 'apollo-server-express';
import { Context } from '../../apolloServer';
import { authorize } from './auth';
import { usersCollRef, firestore, listsCollRef } from '../../firebase';
import { auth } from 'firebase-admin';
import { UserDB, ListDB, UID } from '../../schema';
import { pubsub, USER_EVENTS, LIST_EVENTS } from '../Subscription';

interface ListInvitationResponse {
  list_id: string;
}

export async function acceptListInvitation(
  parent: any,
  args: ListInvitationResponse,
  ctx: Context,
  info: any,
) {
  console.log('RESOLVER acceptListInvitation()');
  authorize(ctx);
  const { email: current_email, uid: current_uid } = ctx.user as auth.DecodedIdToken & {
    email: string;
  };
  const { list_id } = args;
  try {
    let acceptanceIsValid = false;
    const targetListDocRef = listsCollRef.doc(list_id);
    await firestore.runTransaction(async (tx) => {
      const userDocRef = usersCollRef.doc(current_uid);
      const { list_invitations, lists } = (await tx.get(userDocRef)).data() as UserDB;
      if (list_invitations.includes(list_id)) {
        acceptanceIsValid = true;
        const targetListData = (await tx.get(targetListDocRef)).data() as ListDB;
        tx
          // LIST:
          // 1) add current_uid to list.members[]
          // 2) add a [current_uid] property to list.member_info
          // 3) remove user.email from pending_members
          .set(
            targetListDocRef,
            {
              members: targetListData.members.concat(current_uid as UID),
              member_info: {
                ...targetListData.member_info,
                [current_uid]: { order: lists.length + 1 },
              },
              pending_members: targetListData.pending_members.filter(
                (email) => email !== current_email,
              ),
            },
            { merge: true },
          )
          // USER:
          // 1) add list_id to user.lists
          // 2) remove the list invitation from user.list_invitations
          .set(
            userDocRef,
            {
              lists: lists.concat(targetListDocRef),
              list_invitations: list_invitations.filter(
                (invitedListID) => invitedListID !== list_id,
              ),
            },
            { merge: true },
          );
      }
    });
    if (acceptanceIsValid) {
      const listInvitationAccepted = (await targetListDocRef.get()).data() as ListDB;
      // 4) publish two separate events for USER and LIST
      pubsub.publish(LIST_EVENTS, {
        // TODO: handle on FE
        listInvitationAccepted,
        // send to all members
        members: listInvitationAccepted.members,
      });
      pubsub.publish(USER_EVENTS, {
        listInvitationAccepted,
        // only send to user who accepted the invitation
        members: [current_uid],
      });
      // 5) return result
      return listInvitationAccepted; // TODO: handle on FE
    }
    throw new ForbiddenError(
      'Cannot join requested list, because there is no outstanding invitation to join it.',
    );
  } catch (error) {
    console.error(error);
    throw new ApolloError(error.message);
  }
}

export async function rejectListInvitation(
  parent: any,
  args: ListInvitationResponse,
  ctx: Context,
  info: any,
) {
  console.log('RESOLVER acceptListInvitation()');
  authorize(ctx);
  // TODO: fill this in
}
