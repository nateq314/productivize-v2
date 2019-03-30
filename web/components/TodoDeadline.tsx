import React, { useState } from "react";
import { DateTimePicker, MuiPickersUtilsProvider } from "material-ui-pickers";
import DateFnsUtils from "@date-io/date-fns";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core";
import styled from "styled-components";
import { Todo } from "./Main";

const StyledTodoDeadline = styled.div`
  [class*="MuiInputBase-root"] {
    color: #fff;
  }

  input {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 6px;
  }
`;

interface TodoDeadlineProps {
  todo: Todo;
}

export default function TodoDeadline({ todo }: TodoDeadlineProps) {
  const [pendingDeadline, setPendingDeadline] = useState(new Date());
  return (
    <StyledTodoDeadline>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        {/* <MuiThemeProvider theme={materialTheme}> */}
        <DateTimePicker
          value={pendingDeadline}
          onChange={setPendingDeadline}
          InputProps={{ disableUnderline: true }}
          variant="filled"
          margin="dense"
        />
        {/* </MuiThemeProvider> */}
      </MuiPickersUtilsProvider>
    </StyledTodoDeadline>
  );
}
