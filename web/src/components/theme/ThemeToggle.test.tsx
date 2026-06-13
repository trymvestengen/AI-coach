import { render, screen, fireEvent } from "@testing-library/react"
import { afterEach, expect, test } from "vitest"
import ThemeToggle from "./ThemeToggle"

afterEach(() => {
  document.documentElement.classList.remove("dark")
  localStorage.clear()
})

test("toggler .dark på html og persisterer", () => {
  render(<ThemeToggle />)
  const btn = screen.getByRole("button", { name: /tema/i })
  expect(document.documentElement.classList.contains("dark")).toBe(false)
  fireEvent.click(btn)
  expect(document.documentElement.classList.contains("dark")).toBe(true)
  expect(localStorage.getItem("forge-theme")).toBe("dark")
  fireEvent.click(btn)
  expect(document.documentElement.classList.contains("dark")).toBe(false)
  expect(localStorage.getItem("forge-theme")).toBe("light")
})
