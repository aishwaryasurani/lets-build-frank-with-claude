import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// Vitest only wires @testing-library's automatic cleanup when `test.globals`
// is on; this project imports test functions explicitly instead, so it must
// be done here.
afterEach(() => {
  cleanup();
});
