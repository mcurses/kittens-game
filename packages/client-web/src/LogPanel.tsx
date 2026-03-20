// LogPanel — displays recent game log messages
import React, { useEffect, useRef } from "react";

interface Props {
  messages: readonly string[];
}

export function LogPanel({ messages }: Props): React.ReactElement {
  const listRef = useRef<HTMLUListElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div data-testid="log-panel">
      <h2>Log</h2>
      {messages.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        <ul ref={listRef} style={{ maxHeight: "200px", overflowY: "auto" }}>
          {messages.map((msg, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: log messages are append-only
            <li key={idx} data-testid={`log-message-${idx}`}>
              {msg}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
