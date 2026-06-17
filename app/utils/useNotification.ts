"use client";

import { useState } from "react";

export function useNotification() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "success" | "error">("info");

  const notify = (
    msg: string,
    tp: "info" | "success" | "error" = "info"
  ) => {
    setMessage(msg);
    setType(tp);
    setVisible(true);
  };

  return {
    notify,
    visible,
    message,
    type,
    close: () => setVisible(false),
  };
}
