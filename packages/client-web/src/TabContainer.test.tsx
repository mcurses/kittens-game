import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TabContainer } from "./TabContainer.js";

// Mock all panels to keep tests simple
vi.mock("./ResourcePanel.js", () => ({
  ResourcePanel: () => <div data-testid="resource-panel">Resources</div>,
}));
vi.mock("./BuildingsPanel.js", () => ({
  BuildingsPanel: () => <div data-testid="buildings-panel">Buildings</div>,
}));
vi.mock("./JobsPanel.js", () => ({
  JobsPanel: () => <div data-testid="jobs-panel">Jobs</div>,
}));
vi.mock("./SciencePanel.js", () => ({
  SciencePanel: () => <div data-testid="science-panel">Science</div>,
}));
vi.mock("./WorkshopPanel.js", () => ({
  WorkshopPanel: () => <div data-testid="workshop-panel">Workshop</div>,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("TabContainer", () => {
  it("defaults to showing the Resources panel", () => {
    render(<TabContainer state={null} />);
    expect(screen.getByTestId("resource-panel")).toBeTruthy();
    expect(screen.queryByTestId("buildings-panel")).toBeNull();
  });

  it("renders tab buttons for all tabs", () => {
    render(<TabContainer state={null} />);
    expect(screen.getByRole("button", { name: /resources/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /buildings/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /jobs/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /science/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /workshop/i })).toBeTruthy();
  });

  it("switches to Buildings panel when Buildings tab clicked", () => {
    render(<TabContainer state={null} />);
    fireEvent.click(screen.getByRole("button", { name: /buildings/i }));
    expect(screen.getByTestId("buildings-panel")).toBeTruthy();
    expect(screen.queryByTestId("resource-panel")).toBeNull();
  });

  it("switches to Jobs panel when Jobs tab clicked", () => {
    render(<TabContainer state={null} />);
    fireEvent.click(screen.getByRole("button", { name: /jobs/i }));
    expect(screen.getByTestId("jobs-panel")).toBeTruthy();
  });

  it("switches to Science panel when Science tab clicked", () => {
    render(<TabContainer state={null} />);
    fireEvent.click(screen.getByRole("button", { name: /science/i }));
    expect(screen.getByTestId("science-panel")).toBeTruthy();
  });

  it("switches to Workshop panel when Workshop tab clicked", () => {
    render(<TabContainer state={null} />);
    fireEvent.click(screen.getByRole("button", { name: /workshop/i }));
    expect(screen.getByTestId("workshop-panel")).toBeTruthy();
  });

  it("switching back to Resources shows ResourcePanel", () => {
    render(<TabContainer state={null} />);
    fireEvent.click(screen.getByRole("button", { name: /buildings/i }));
    fireEvent.click(screen.getByRole("button", { name: /resources/i }));
    expect(screen.getByTestId("resource-panel")).toBeTruthy();
    expect(screen.queryByTestId("buildings-panel")).toBeNull();
  });

  it("active tab is visually distinguished", () => {
    render(<TabContainer state={null} />);
    const resourcesBtn = screen.getByRole("button", { name: /resources/i });
    expect(resourcesBtn.getAttribute("data-active")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /buildings/i }));
    const buildingsBtn = screen.getByRole("button", { name: /buildings/i });
    expect(buildingsBtn.getAttribute("data-active")).toBe("true");
    expect(screen.getByRole("button", { name: /resources/i }).getAttribute("data-active")).toBe("false");
  });
});
