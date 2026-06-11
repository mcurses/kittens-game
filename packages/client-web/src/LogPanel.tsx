// LogPanel — dark terminal-style game event log
import type React from "react";
import { useEffect, useRef } from "react";

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
    <div data-testid="log-panel" style={{ display: "contents" }}>
      <div className="log-header">
        <span className="log-label">Log</span>
      </div>
      <ul ref={listRef} className="log-list" aria-label="Game log">
        {messages.length === 0 ? (
          <li className="log-empty">No messages yet.</li>
        ) : (
          messages.map((msg, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: log messages are append-only
            <li key={idx} className="log-entry" data-testid={`log-message-${idx}`}>
              {msg}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
