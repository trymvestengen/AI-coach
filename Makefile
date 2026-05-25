.PHONY: dev test test-web test-api lint lint-web typecheck check format help

help:
	@echo "Available targets:"
	@echo "  make dev        Start api and web in parallel"
	@echo "  make test       Run all tests (web + api)"
	@echo "  make lint       Run linters"
	@echo "  make typecheck  Run typescript check"
	@echo "  make check      Run everything CI runs, locally"
	@echo "  make format     Run prettier --write on web"

dev:
	cd web && npm run dev:all

test: test-web test-api

test-web:
	cd web && npm run test

test-api:
	cd api && .venv/bin/pytest

lint: lint-web

lint-web:
	cd web && npm run lint

typecheck:
	cd web && npm run typecheck

check: lint typecheck test
	cd web && npm run build

format:
	cd web && npm run format
