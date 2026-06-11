import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

// jsdom does not implement scrollIntoView — stub it globally
window.HTMLElement.prototype.scrollIntoView = vi.fn()
