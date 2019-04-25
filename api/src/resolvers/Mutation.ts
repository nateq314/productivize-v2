import * as fbAdmin from 'firebase-admin';
import * as fbClient from 'firebase';
import { ForbiddenError } from 'apollo-server-express';
import * as express from 'express';
import * as nodemailer from 'nodemailer';
import { Context } from '../apolloServer';
import { verifyIdToken, createUserSessionToken, verifyUserSessionToken } from '../firebase';
import {
  ListDB,
  ListGQL,
  TodoDB,
  TodoGQL,
  UserGQL,
  ListMemberInfoGQL,
  UserDB,
  Email,
  UID,
} from '../schema';
import { pubsub, LIST_EVENTS } from './Subscription';

const postmarkTransport = require('nodemailer-postmark-transport');

interface ILogin {
  idToken?: string;
  session?: string;
}

interface UpdateListArgs {
  id: string;
  name?: string;
  order?: number;
  newMembers?: Email[];
}

type TodoDateFields = 'added_on' | 'completed_on' | 'deadline' | 'remind_on';

function convertDateFieldsForPublishing(todo: TodoDB & { id: string; list_id: string }) {
  const converted: any = { ...todo };
  (['added_on', 'completed_on', 'deadline', 'remind_on'] as Array<TodoDateFields>).forEach(
    (field) => {
      const value = todo[field];
      if (value) {
        converted[field] =
          value instanceof Date ? value.toISOString() : value.toDate().toISOString();
      }
    },
  );
  return converted as TodoGQL;
}

const firestore = fbAdmin.firestore();
const listsCollRef = firestore.collection('lists');
const transport = nodemailer.createTransport(
  postmarkTransport({
    auth: {
      apiKey: '1c36a2fb-83e9-4563-ad47-ffc33f535791', // TODO: envify this
    },
  }),
);

export default {
  /**********************
   * CREATE A LIST
   *********************/
  async createList(parent: any, args: any, ctx: Context, info: any) {
    authorize(ctx);
    try {
      const current_uid = (ctx.user as fbAdmin.auth.DecodedIdToken).uid;
      // ====== BEGIN TRANSACTION =============================================
      const listCreated = await firestore.runTransaction(async (tx) => {
        const authUserRecord = await fbAdmin.auth().getUser(current_uid);
        const userDocSnapshot = await tx.get(firestore.collection('users').doc(current_uid));
        const dbUserRecord = userDocSnapshot.data() as UserDB;
        const user: UserGQL = {
          ...authUserRecord,
          ...dbUserRecord,
          id: userDocSnapshot.id,
        };
        const currUserLists = await tx.get(
          listsCollRef.where('members', 'array-contains', current_uid),
        );
        const newListDocRef = listsCollRef.doc();
        const order = currUserLists.size + 1;
        const newListData: ListDB = {
          name: args.name,
          members: [current_uid as UID],
          member_info: {
            [current_uid]: {
              is_admin: true,
              order,
            },
          },
          pending_members: [],
        };
        tx.create(newListDocRef, newListData);
        return {
          id: newListDocRef.id,
          members: [
            {
              is_admin: true,
              user,
            },
          ],
          name: newListData.name,
          order,
          todos: [],
        } as ListGQL;
      });
      // ====== END TRANSACTION ===============================================
      pubsub.publish(LIST_EVENTS, {
        listCreated,
        members: [current_uid],
      });
      console.log('listCreated:', listCreated);
      return listCreated;
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  },

  /**********************
   * DELETE A LIST
   *********************/
  async deleteList(parent: any, args: any, ctx: Context, info: any) {
    authorize(ctx);
    try {
      const current_uid = (ctx.user as fbAdmin.auth.DecodedIdToken).uid;
      const todoListDocRef = listsCollRef.doc(args.id);
      let members: string[] = [];
      // ====== BEGIN TRANSACTION =============================================
      const listDeleted = await firestore.runTransaction(async (tx) => {
        const deletedListData = (await tx.get(todoListDocRef)).data() as ListDB;
        members = deletedListData.members;
        if (!members.includes(current_uid)) {
          // TODO: test this
          throw new ForbiddenError('You are not authorized to touch this list.');
        }
        const membersGQL = await Promise.all(
          deletedListData.members.map(async (member_uid) => {
            const authUserRecord = await fbAdmin.auth().getUser(current_uid);
            const userDocSnapshot = await tx.get(firestore.collection('users').doc(member_uid));
            const dbUserRecord = userDocSnapshot.data() as UserDB;
            const user: UserGQL = {
              ...authUserRecord,
              ...dbUserRecord,
              id: userDocSnapshot.id,
            };
            return {
              ...deletedListData.member_info[member_uid],
              user,
            };
          }),
        );
        const higherOrderLists = await tx.get(
          listsCollRef.where(
            `member_info.${current_uid}.order`,
            '>',
            deletedListData.member_info[current_uid].order,
          ),
        );
        // First delete all the todos in the "todos" subcollection, if any.
        const todos = await todoListDocRef.collection('todos').listDocuments();
        todos.forEach((todo) => {
          tx.delete(todo);
        });
        // Then delete the list itself.
        tx.delete(todoListDocRef);
        higherOrderLists.forEach((list) => {
          const order = (list.data() as ListDB).member_info[current_uid].order;
          tx.update(list.ref, `member_info.${current_uid}.order`, order - 1);
        });
        return {
          ...deletedListData,
          id: todoListDocRef.id,
          members: membersGQL,
        } as Partial<ListGQL>;
      });
      // ====== END TRANSACTION ===============================================
      console.log('listDeleted:', listDeleted);
      pubsub.publish(LIST_EVENTS, {
        listDeleted,
        members,
      });
      return { success: true };
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  },

  /**********************
   * UPDATE A LIST
   *********************/
  async updateList(parent: any, args: UpdateListArgs, ctx: Context, info: any) {
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
          // 1: add new members to the list
          const currentMemberEmails = membersGQL.map((m) => m.user.email);
          filteredNewMembers = newMembers.filter(
            (m) => !currentMemberEmails.includes(m) && !todoListData.pending_members.includes(m),
          );
          if (filteredNewMembers.length > 0)
            updates.pending_members = todoListData.pending_members.concat(filteredNewMembers);
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
        await tx.update(todoListDocRef, updates);
        const updatedListData = {
          ...todoListData,
          ...updates,
          members: membersGQL,
          todos,
          order,
          id: args.id,
        };
        if (filteredNewMembers.length > 0) {
          // TODO: send a notification email to each address in filteredNewMembers
          filteredNewMembers.forEach(async (newMemberEmail) => {
            const mail = {
              from: 'info@productivize.net',
              to: newMemberEmail,
              subject: `Invitation to join list "${updatedListData.name}"`,
              text: '__text_format_goes_here__',
              html: '<h1>Hello Nathan</h1>',
            };
            try {
              const result = await transport.sendMail(mail);
              console.info(result);
            } catch (error) {
              console.error(error);
            }
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
  },

  /**********************
   * CREATE A TODO
   *********************/
  async createTodo(parent: any, args: any, ctx: Context, info: any) {
    authorize(ctx);
    try {
      let members: string[] = [];
      // ====== BEGIN TRANSACTION =============================================
      const todoCreated = await firestore.runTransaction(async (tx) => {
        const todoListDocRef = listsCollRef.doc(args.listId);
        const todosCollRef = todoListDocRef.collection('todos');
        const todoListDocSnapshot = await tx.get(todoListDocRef);
        members = (todoListDocSnapshot.data() as ListDB).members;
        const currTodosSnapshot = await tx.get(todosCollRef);
        const newTodoDocRef = todosCollRef.doc();
        const added_on = new Date();
        const newTodoData = {
          added_on,
          content: args.content,
          completed: false,
          completed_on: null,
          deadline: args.deadline || null,
          description: '',
          important: args.important,
          order: currTodosSnapshot.size + 1,
          remind_on: args.remind_on || null,
        };
        tx.create(newTodoDocRef, newTodoData);
        return {
          ...newTodoData,
          id: newTodoDocRef.id,
          list_id: args.listId,
        };
      });
      // ====== END TRANSACTION ===============================================
      pubsub.publish(LIST_EVENTS, {
        todoCreated: {
          ...todoCreated,
          added_on: todoCreated.added_on.toISOString(),
        },
        members,
      });
      return todoCreated;
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  },

  /**********************
   * DELETE A TODO
   *********************/
  async deleteTodo(parent: any, args: any, ctx: Context, info: any) {
    authorize(ctx);
    let members: string[] = [];
    try {
      // ====== BEGIN TRANSACTION =============================================
      const todoDeleted = await firestore.runTransaction(async (tx) => {
        const todoListDocRef = listsCollRef.doc(args.listId);
        const todoListDocSnapshot = await tx.get(todoListDocRef);
        members = (todoListDocSnapshot.data() as ListDB).members;
        if (!members.includes((ctx.user as fbAdmin.auth.DecodedIdToken).uid)) {
          // TODO: test this
          throw new ForbiddenError('Not authorized to touch anything in this list.');
        }
        const todoDocRef = todoListDocRef.collection('todos').doc(args.todoId);
        const deletedTodoData = (await tx.get(todoDocRef)).data() as TodoDB;

        const todosQuerySnapshot = await tx.get(
          todoListDocRef.collection('todos').where('order', '>', deletedTodoData.order),
        );

        tx.delete(todoDocRef);
        todosQuerySnapshot.forEach((todoDoc) => {
          const order = (todoDoc.data() as TodoDB).order;
          tx.update(todoDoc.ref, { order: order - 1 });
        });
        return {
          ...deletedTodoData,
          id: todoDocRef.id,
          list_id: args.listId,
        };
      });
      // ====== END TRANSACTION ===============================================

      pubsub.publish(LIST_EVENTS, {
        todoDeleted: convertDateFieldsForPublishing(todoDeleted),
        members,
      });
      return { success: true };
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  },

  /**********************
   * UPDATE A TODO
   *********************/
  async updateTodo(parent: any, args: any, ctx: Context, info: any) {
    // TODO: see if this can be merged with createTodo(), since Firestore's
    // set() method handles both creation and updating.
    authorize(ctx);
    try {
      let members: string[] = [];
      let destListMembers: string[] = [];
      let metadata: { [key: string]: any } | null = null;
      // ====== BEGIN TRANSACTION =============================================
      const todoUpdated = await firestore.runTransaction(async (tx) => {
        const sourceTodoListDocRef = listsCollRef.doc(args.listId);
        let destTodoListDocRef: FirebaseFirestore.DocumentReference = sourceTodoListDocRef;
        const sourceTodoListDocSnapshot = await tx.get(sourceTodoListDocRef);
        members = (sourceTodoListDocSnapshot.data() as ListDB).members;
        destListMembers = [...members];
        if (args.destListId) {
          destTodoListDocRef = listsCollRef.doc(args.destListId);
          destListMembers = ((await tx.get(destTodoListDocRef)).data() as ListDB).members;
        }
        const ctxUid = (ctx.user as fbAdmin.auth.DecodedIdToken).uid;
        if (!(members.includes(ctxUid) && destListMembers.includes(ctxUid))) {
          // TODO: test this
          throw new ForbiddenError('Not authorized to touch this data.');
        }
        const { content, order } = args;
        const sourceTodoDocRef = sourceTodoListDocRef.collection('todos').doc(args.todoId);
        let destTodoDocRef = sourceTodoDocRef;
        const todoData = (await tx.get(sourceTodoDocRef)).data() as TodoDB;
        const updates: any = { ...todoData };

        // TODO: find a better way to do this
        if (args.hasOwnProperty('completed')) {
          updates.completed = args.completed;
          if (args.completed) updates.completed_on = new Date();
          else updates.completed_on = null;
        }
        if (content) updates.content = content;
        if (args.hasOwnProperty('deadline')) updates.deadline = args.deadline;
        if (args.hasOwnProperty('description')) updates.description = args.description;
        if (args.hasOwnProperty('important')) updates.important = args.important;
        if (args.hasOwnProperty('remind_on')) updates.remind_on = args.remind_on;
        if (order) {
          updates.order = order;
          let todosQuerySnapshot: FirebaseFirestore.QuerySnapshot;
          let adjustment: -1 | 1;
          metadata = { prevOrder: todoData.order };
          if (args.destListId) {
            // TODO IS BEING MOVED TO ANOTHER LIST
            const sourceTodosQuerySnapshot = await tx.get(
              sourceTodoListDocRef.collection('todos').where('order', '>', todoData.order),
            );
            const destTodosQuerySnapshot = await tx.get(
              destTodoListDocRef.collection('todos').where('order', '>=', order),
            );
            sourceTodosQuerySnapshot.forEach((todo) => {
              // decrement source todos
              const newOrder = (todo.data() as TodoDB).order - 1;
              tx.update(todo.ref, { order: newOrder });
            });
            destTodosQuerySnapshot.forEach((todo) => {
              // increment destination todos
              const newOrder = (todo.data() as TodoDB).order + 1;
              tx.update(todo.ref, { order: newOrder });
            });
            await tx.delete(sourceTodoDocRef);
            destTodoDocRef = destTodoListDocRef.collection('todos').doc(args.todoId);
            metadata.prevListId = sourceTodoListDocRef.id;
          } else {
            // TODO IS CHANGING ORDER WITHIN THE SAME LIST
            if (order > todoData.order) {
              todosQuerySnapshot = await tx.get(
                sourceTodoListDocRef
                  .collection('todos')
                  .where('order', '<=', order)
                  .where('order', '>=', todoData.order),
              );
              adjustment = -1;
            } else {
              todosQuerySnapshot = await tx.get(
                sourceTodoListDocRef
                  .collection('todos')
                  .where('order', '>=', order)
                  .where('order', '<=', todoData.order),
              );
              adjustment = +1;
            }
            todosQuerySnapshot.forEach((todo) => {
              const newOrder = (todo.data() as TodoDB).order + adjustment;
              tx.update(todo.ref, { order: newOrder });
            });
          }
        }
        await tx.set(destTodoDocRef, updates);
        return {
          ...todoData,
          ...updates,
          id: destTodoDocRef.id,
          list_id: destTodoListDocRef.id,
        } as TodoDB & { id: string; list_id: string };
      });
      // ====== END TRANSACTION ===============================================
      pubsub.publish(LIST_EVENTS, {
        todoUpdated: convertDateFieldsForPublishing(todoUpdated),
        metadata,
        members: destListMembers,
      });
      return todoUpdated;
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  },

  async login(parent: any, args: ILogin, ctx: Context, info: any) {
    try {
      if (args.idToken && args.idToken !== 'undefined') {
        // User just logged in via email/password and either
        // 1: client is calling this in order to set a session cookie, API <-> CLIENT, or
        // 2: SSR backend is calling this in order to fetch the user object
        //    and set the session cookie, SSR <-> CLIENT
        const decodedIdToken = await verifyIdToken(args.idToken);
        const { uid } = decodedIdToken;
        if (!uid) {
          console.error('User is not registered');
          return {
            error: 'User is not registered',
          };
        }
        const authUserRecord = await fbAdmin.auth().getUser(uid);
        const userDocSnapshot = await firestore
          .collection('users')
          .doc(uid)
          .get();
        const dbUserRecord = userDocSnapshot.data() as UserDB;
        const user: UserGQL = {
          ...authUserRecord,
          ...dbUserRecord,
          id: uid,
        };
        const [sessionCookie, expiresIn] = await createUserSessionToken(args, decodedIdToken);
        const options: express.CookieOptions = {
          maxAge: expiresIn,
          httpOnly: true,
          secure: false, // TODO: set secure: true in production
        };
        ctx.res.cookie('session', sessionCookie, options);
        return { user };
      } else {
        // User is re-visiting the site and automatically reauthenticating using the
        // existing session cookie (SSR <-> CLIENT).
        const sessionCookie = args.session || '';
        if (sessionCookie) {
          try {
            const decodedClaims = await verifyUserSessionToken(sessionCookie);
            const userDocSnapshot = await firestore
              .collection('users')
              .doc(decodedClaims.uid)
              .get();
            const user = userDocSnapshot.data() as Partial<UserGQL>;
            user.id = userDocSnapshot.id;
            return { user };
          } catch (error) {
            // verifyUserSessionToken() will throw if the session cookie
            // is invalid or revoked.
            console.error(error);
            return {
              error: `Invalid login request: ${error}`,
            };
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
    return {
      error: 'Invalid login request',
    };
  },

  async logout(parent: any, args: any, ctx: Context, info: any) {
    const sessionCookie = ctx.req.cookies.session || '';
    if (sessionCookie) ctx.res.clearCookie('session');
    return {
      error: 'Session cookie is invalid, or no session to log out of',
    };
  },

  async register(parent: any, args: any, ctx: Context, info: any) {
    try {
      const { email, password, first_name, last_name } = args;
      const userRecord = await fbAdmin.auth().createUser({
        email,
        password,
      });
      // let writeResult: FirebaseFirestore.WriteResult;
      /* writeResult = */ await firestore
        .collection('users')
        .doc(userRecord.uid)
        .create({
          email,
          first_name,
          last_name,
        });
      /* writeResult = */ await listsCollRef.doc().create({
        name: 'MAIN',
        order: 1,
        members: [userRecord.uid],
        member_info: {
          [userRecord.uid]: {
            is_admin: true,
          },
        },
      });
      const customToken = await fbAdmin.auth().createCustomToken(userRecord.uid);
      const app = fbClient.initializeApp({
        apiKey: 'AIzaSyCsMTAxjQ15ylh3ORj8SF_k658fqDO0q3g',
        authDomain: 'focus-champion-231019.firebaseapp.com',
      });
      const userCredential = await app.auth().signInWithCustomToken(customToken);
      if (userCredential.user) {
        await userCredential.user.sendEmailVerification({
          url: 'http://localhost:4000/',
        });
        await app.auth().signOut();
        return { success: true };
      }
      return {
        success: false,
        message:
          'User object created in database but unable to send ' + 'user email verification message',
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: error.message,
      };
    }
  },
};

function authorize(ctx: Context) {
  if (!ctx.user) ctx.res.status(401).send('UNAUTHORIZED REQUEST');
}
