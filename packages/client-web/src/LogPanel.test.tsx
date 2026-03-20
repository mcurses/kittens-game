import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { LogPanel } from "./LogPanel.js";

afterEach(() => {
  cleanup();
});

describe("LogPanel", () => {
  it("shows empty log when messages is empty", () => {
    render(<LogPanel messages={[]} />);
    expect(screen.getByTestId("log-panel")).toBeTruthy();
    expect(screen.getByText("No messages yet.")).toBeTruthy();
  });

  it("renders messages", () => {
    render(<LogPanel messages={["Hello world", "Catnip gathered"]} />);
    expect(screen.getByText("Hello world")).toBeTruthy();
    expect(screen.getByText("Catnip gathered")).toBeTruthy();
  });

  it("renders multiple messages as list items", () => {
    render(<LogPanel messages={["msg1", "msg2", "msg3"]} />);
    const items = screen.getAllByTestId(/^log-message-/);
    expect(items.length).toBe(3);
  });

  it("assigns testids to message items", () => {
    render(<LogPanel messages={["first", "second"]} />);
    expect(screen.getByTestId("log-message-0")).toBeTruthy();
    expect(screen.getByTestId("log-message-1")).toBeTruthy();
  });

  it("renders a single message without list structure issues", () => {
    render(<LogPanel messages={["Only message"]} />);
    expect(screen.getByText("Only message")).toBeTruthy();
  });
});
