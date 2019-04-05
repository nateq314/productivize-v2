import * as fbAdmin from "firebase-admin";
import { ListGQL, Todo } from "../schema";

export default {
  async todos(list: ListGQL) {
    const querySnapshot = await fbAdmin
      .firestore()
      .collection("lists")
      .doc(list.id)
      .collection("todos")
      .get();

    const todos = querySnapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          list_id: list.id,
          id: doc.id
        } as Todo)
    );

    return todos;
  }
};
