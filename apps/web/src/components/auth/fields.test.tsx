// @vitest-environment jsdom
// SPDX-License-Identifier: AGPL-3.0-only
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeField, TextField } from "./fields";

afterEach(cleanup);

describe("CodeField", () => {
  it("is busy, not disabled, so the focus and the keyboard stay", () => {
    render(<CodeField value="" onChange={() => {}} disabled />);
    const input = screen.getByLabelText("Code");
    expect((input as HTMLInputElement).disabled).toBe(false);
    expect(input.getAttribute("aria-disabled")).toBe("true");
    expect(input.getAttribute("aria-busy")).toBe("true");
  });

  it("takes no typing while busy and digits only otherwise", () => {
    const onChange = vi.fn();
    const { rerender } = render(<CodeField value="" onChange={onChange} disabled />);
    fireEvent.change(screen.getByLabelText("Code"), { target: { value: "123456" } });
    expect(onChange).not.toHaveBeenCalled();
    rerender(<CodeField value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Code"), { target: { value: "12a3-4" } });
    expect(onChange).toHaveBeenCalledWith("1234");
  });

  it("keeps an empty alert in the page and fills it with the problem, which also names the field", () => {
    const { rerender } = render(<CodeField value="" onChange={() => {}} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe("");
    expect(screen.getByLabelText("Code").getAttribute("aria-describedby")).toBeNull();
    rerender(<CodeField value="" onChange={() => {}} error="That code is wrong." />);
    expect(screen.getByRole("alert")).toBe(alert);
    expect(alert.textContent).toBe("That code is wrong.");
    expect(screen.getByLabelText("Code").getAttribute("aria-describedby")).toBe(alert.id);
  });

  it("puts the focus back on the field when a problem appears", () => {
    const { rerender } = render(<CodeField value="" onChange={() => {}} />);
    expect(document.activeElement).toBe(document.body);
    rerender(<CodeField value="" onChange={() => {}} error="That code is wrong." />);
    expect(document.activeElement).toBe(screen.getByLabelText("Code"));
  });
});

describe("TextField", () => {
  it("announces its problem through an alert", () => {
    render(<TextField label="E-mail address" error="Enter your e-mail address." />);
    expect(screen.getByRole("alert").textContent).toBe("Enter your e-mail address.");
  });
});
