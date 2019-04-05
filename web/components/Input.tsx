import React from "react";
import styled from "styled-components";

const StyledInput = styled.span`
  .input {
    border: none;
    color: #fff;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    padding: 8px;
  }

  .adornment {
    cursor: pointer;
  }
`;

interface Adornment {
  node: React.ReactNode;
  onClick: () => void;
}

export interface InputProps {
  adornmentStart?: Adornment;
  adornmentEnd?: Adornment;
  readOnly?: boolean;
  value?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // filter these out
  InputProps?: any;
  error?: any;
  helperText?: any;
}

export default function Input({
  adornmentStart,
  adornmentEnd,
  InputProps,
  error,
  helperText,
  ...props
}: InputProps) {
  return (
    <StyledInput>
      {adornmentStart && (
        <span className="adornment" onClick={adornmentStart.onClick}>
          {adornmentStart.node}
        </span>
      )}
      <input
        className={`input ${props.readOnly ? "readonly" : ""}`}
        {...props}
      />
      {adornmentEnd && (
        <span className="adornment" onClick={adornmentEnd.onClick}>
          {adornmentEnd.node}
        </span>
      )}
    </StyledInput>
  );
}
