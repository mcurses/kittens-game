import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PlaceholderImage } from "./PlaceholderImage";

afterEach(cleanup);

describe("PlaceholderImage", () => {
  it("renders the placeholder without an <img> when src is absent", () => {
    render(<PlaceholderImage variant="building" />);
    expect(screen.getByTestId("placeholder-image")).toBeTruthy();
    expect(screen.queryByTestId("placeholder-image-img")).toBeNull();
  });

  it("renders the <img> when src is provided", () => {
    render(<PlaceholderImage variant="building" src="/foo.webp" alt="foo" />);
    const img = screen.getByTestId("placeholder-image-img") as HTMLImageElement;
    expect(img.src).toContain("/foo.webp");
    expect(img.alt).toBe("foo");
  });

  it("falls back to placeholder when the image fails to load", () => {
    render(<PlaceholderImage variant="building" src="/missing.webp" />);
    const img = screen.getByTestId("placeholder-image-img");
    fireEvent.error(img);
    expect(screen.queryByTestId("placeholder-image-img")).toBeNull();
    expect(screen.getByTestId("placeholder-image")).toBeTruthy();
  });

  it("applies the variant modifier class", () => {
    const { rerender } = render(<PlaceholderImage variant="building" />);
    expect(screen.getByTestId("placeholder-image").className).toContain(
      "placeholder-image--building",
    );

    rerender(<PlaceholderImage variant="character" />);
    expect(screen.getByTestId("placeholder-image").className).toContain(
      "placeholder-image--character",
    );

    rerender(<PlaceholderImage variant="book" />);
    expect(screen.getByTestId("placeholder-image").className).toContain(
      "placeholder-image--book",
    );

    rerender(<PlaceholderImage variant="job" />);
    expect(screen.getByTestId("placeholder-image").className).toContain(
      "placeholder-image--job",
    );

    rerender(<PlaceholderImage variant="map" />);
    expect(screen.getByTestId("placeholder-image").className).toContain(
      "placeholder-image--map",
    );
  });

  it("exposes the variant as a data attribute (for CSS hooks)", () => {
    render(<PlaceholderImage variant="book" />);
    expect(screen.getByTestId("placeholder-image").getAttribute("data-variant")).toBe(
      "book",
    );
  });

  it("merges an extra className", () => {
    render(<PlaceholderImage variant="building" className="custom-class" />);
    expect(screen.getByTestId("placeholder-image").className).toContain("custom-class");
  });
});
