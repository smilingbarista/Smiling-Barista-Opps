"use client";

import { TextareaHTMLAttributes, useEffect, useRef } from "react";

export function AutosizeTextarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function resize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => {
    if (ref.current) resize(ref.current);
  }, [props.value, props.defaultValue]);

  return (
    <textarea
      {...props}
      ref={ref}
      rows={1}
      onInput={(e) => {
        resize(e.currentTarget);
        props.onInput?.(e);
      }}
      className={`resize-none overflow-hidden ${props.className ?? ""}`}
    />
  );
}
