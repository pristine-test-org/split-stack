PYTHON ?= python3
VENV := backend/.venv
PY := $(CURDIR)/$(VENV)/bin/python

.PHONY: setup seed dev build start test

setup: ## install backend and frontend dependencies
	$(PYTHON) -m venv $(VENV)
	$(PY) -m pip install -q -r backend/requirements.txt
	cd frontend && npm ci

seed: ## reset the SQLite database with demo data
	cd backend && $(PY) seed.py

dev: ## API on :8000 with reload + Vite on :5173
	@trap 'kill 0' INT TERM; \
	(cd backend && $(PY) -m uvicorn app.main:app --reload --port 8000) & \
	(cd frontend && npm run dev) & \
	wait

build: ## build the SPA into frontend/dist
	cd frontend && npm run build

start: ## serve API + built SPA on :8000 (run build and seed first)
	cd backend && $(PY) -m uvicorn app.main:app --host 0.0.0.0 --port 8000

test:
	cd backend && $(PY) -m pytest -q
	cd frontend && npm run typecheck
