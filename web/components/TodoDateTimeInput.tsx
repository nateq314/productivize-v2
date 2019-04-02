import React from "react";
import { Mutation, MutationFn, OperationVariables } from "react-apollo";
import {
  DatePicker,
  DateTimePicker,
  MuiPickersUtilsProvider
} from "material-ui-pickers";
import DateFnsUtils from "@date-io/date-fns";
import { Todo } from "./Main";
import Input, { InputProps } from "./Input";
import { UPDATE_TODO } from "../other/queries";

interface TodoDateTimeInputProps {
  field: "deadline" | "remind_on";
  placeholder: string;
  selectedListId: string;
  todo: Todo;
  includeTime?: boolean;
}

export default function TodoDateTimeInput({
  field,
  includeTime,
  placeholder,
  selectedListId,
  todo
}: TodoDateTimeInputProps) {
  const Picker = includeTime ? DateTimePicker : DatePicker;
  return (
    <Mutation mutation={UPDATE_TODO}>
      {(updateTodo: MutationFn<any, OperationVariables>) => {
        return (
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <Picker
              placeholder={placeholder}
              value={todo[field]}
              onChange={(newDateTime: Date) => {
                updateTodo({
                  variables: {
                    listId: selectedListId,
                    todoId: todo.id,
                    [field]: newDateTime
                  },
                  optimisticResponse: {
                    __typename: "Mutation",
                    updateTodo: {
                      ...todo,
                      [field]: newDateTime
                    }
                  }
                });
              }}
              TextFieldComponent={(props: InputProps) => (
                <Input
                  {...props}
                  adornmentEnd={{
                    node: "x",
                    onClick: () => {
                      updateTodo({
                        variables: {
                          listId: selectedListId,
                          todoId: todo.id,
                          [field]: null
                        },
                        optimisticResponse: {
                          __typename: "Mutation",
                          updateTodo: {
                            ...todo,
                            [field]: null
                          }
                        }
                      });
                    }
                  }}
                />
              )}
            />
          </MuiPickersUtilsProvider>
        );
      }}
    </Mutation>
  );
}
