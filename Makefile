.PHONY: dev

dev:
	docker compose up -d
	pnpm dev
