import { describe, it, expect } from "vitest";
import { isPcOrLaptop } from "@/lib/device/isMobileDevice";

describe("isPcOrLaptop", () => {
  it("returns false for Android phones", () => {
    expect(
      isPcOrLaptop(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36",
        "Linux armv8l",
        5,
      ),
    ).toBe(false);
  });

  it("returns false for iPhone", () => {
    expect(
      isPcOrLaptop(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
        "iPhone",
        5,
      ),
    ).toBe(false);
  });

  it("returns false for iPad", () => {
    expect(isPcOrLaptop("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)", "MacIntel", 5)).toBe(
      false,
    );
  });

  it("returns true for Windows laptop", () => {
    expect(
      isPcOrLaptop(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Win32",
        0,
      ),
    ).toBe(true);
  });

  it("returns true for Mac laptop", () => {
    expect(
      isPcOrLaptop(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "MacIntel",
        0,
      ),
    ).toBe(true);
  });

  it("returns true for Linux desktop", () => {
    expect(
      isPcOrLaptop(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Linux x86_64",
        0,
      ),
    ).toBe(true);
  });
});
