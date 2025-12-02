.PHONY: install install-backend install-frontend migrate setup start start-backend start-frontend test test-backend test-frontend

# Backend variables
BACKEND_DIR = backend
POETRY = $(HOME)/.local/bin/poetry
PYTHON = python3

# Frontend variables
FRONTEND_DIR = frontend
# Source nvm and use node 18
NVM_SOURCE = . $(HOME)/.nvm/nvm.sh && nvm use 18

# Install dependencies for both backend and frontend
install: install-backend install-frontend

install-backend:
	cd $(BACKEND_DIR) && $(POETRY) install

install-frontend:
	cd $(FRONTEND_DIR) && $(NVM_SOURCE) && npm install

# Run database migrations
migrate:
	cd $(BACKEND_DIR) && $(POETRY) run python manage.py migrate

# Setup initial data
setup:
	cd $(BACKEND_DIR) && $(POETRY) run python manage.py setup_initial_data

# Start both backend and frontend concurrently
start:
	@echo "Starting backend and frontend..."
	@$(MAKE) -j 2 start-backend start-frontend

# Start backend server only
start-backend:
	cd $(BACKEND_DIR) && $(POETRY) run python manage.py runserver

# Start frontend server only
start-frontend:
	cd $(FRONTEND_DIR) && $(NVM_SOURCE) && npm run dev

# Run tests
test: test-backend test-frontend

test-backend:
	cd $(BACKEND_DIR) && $(POETRY) run python manage.py test

test-frontend:
	cd $(FRONTEND_DIR) && $(NVM_SOURCE) && npm test
