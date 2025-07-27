# BaseBadge Makefile
# Common development tasks

.PHONY: help install run test clean docker-build docker-run docker-stop lint format

# Default target
help:
	@echo "BaseBadge Development Commands"
	@echo "=============================="
	@echo "install     - Install dependencies"
	@echo "run         - Run development server"
	@echo "test        - Run tests"
	@echo "clean       - Clean cache and temporary files"
	@echo "docker-build- Build Docker image"
	@echo "docker-run  - Run with Docker Compose"
	@echo "docker-stop - Stop Docker containers"
	@echo "lint        - Run linting checks"
	@echo "format      - Format code with black"

# Install dependencies
install:
	@echo "Installing dependencies..."
	pip install -r backend/requirements.txt

# Run development server
run:
	@echo "Starting development server..."
	cd backend && uvicorn backend.backend:app --reload --host 0.0.0.0 --port 8000

# Run tests
test:
	@echo "Running tests..."
	cd backend && python -m pytest tests/ -v

# Clean cache and temporary files
clean:
	@echo "Cleaning cache and temporary files..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	find . -type f -name ".coverage" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +

# Docker commands
docker-build:
	@echo "Building Docker image..."
	docker build -t basebadge .

docker-run:
	@echo "Starting services with Docker Compose..."
	docker-compose up -d

docker-stop:
	@echo "Stopping Docker containers..."
	docker-compose down

# Code quality
lint:
	@echo "Running linting checks..."
	cd backend && flake8 . --max-line-length=88 --extend-ignore=E203,W503

format:
	@echo "Formatting code with black..."
	cd backend && black . --line-length=88

# Development setup
setup: install
	@echo "Setting up development environment..."
	@if [ ! -f .env ]; then \
		echo "Creating .env file from template..."; \
		cp env.example .env; \
		echo "Please edit .env with your API keys"; \
	else \
		echo ".env file already exists"; \
	fi

# Production deployment
deploy: docker-build docker-run
	@echo "Deployment completed!"

# Health check
health:
	@echo "Checking API health..."
	curl -f http://localhost:8000/ping || echo "API is not responding" 