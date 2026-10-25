// @vitest-environment jsdom
// SPDX-License-Identifier: AGPL-3.0-only
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const capture = vi.hoisted(() => vi.fn());
vi.mock("@/lib/monitoring", () => ({ captureError: capture }));

import RouteError from "./error";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function boom(digest?: string) {
  const error = new Error("secret internal detail") as Error & { digest?: string };
  error.stack = "Error: secret internal detail\n    at SomeComponent (/src/app/secret.tsx:1:1)";
  error.digest = digest;
  return error;
}

describe("error.tsx", () => {
  it("calls retry (refetch), not reset, when Try again is pressed", () => {
    const retry = vi.fn();
    render(<RouteError error={boom("abc123")} retry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("reports the error once, with the digest and the route boundary", () => {
    const error = boom("abc123");
    const { rerender } = render(<RouteError error={error} retry={() => {}} />);
    rerender(<RouteError error={error} retry={() => {}} />);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith(error, { digest: "abc123", boundary: "route" });
  });

  it("shows the digest as a reference and never the message or the stack", () => {
    const { container } = render(<RouteError error={boom("abc123")} retry={() => {}} />);
    expect(screen.getByText("abc123")).toBeTruthy();
    expect(container.textContent).not.toContain("secret internal detail");
    expect(container.textContent).not.toContain("SomeComponent");
  });

  it("announces itself, moves the focus to the heading and offers a way home", () => {
    render(<RouteError error={boom()} retry={() => {}} />);
    expect(screen.getByRole("alert")).toBeTruthy();
    const heading = screen.getByRole("heading", { level: 1, name: "Something went wrong" });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByRole("link", { name: "Go to AnyPlay" }).getAttribute("href")).toBe("/");
    expect(screen.queryByText(/Reference/)).toBeNull();
  });
});
