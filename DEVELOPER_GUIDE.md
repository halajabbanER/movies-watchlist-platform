# Developer Guide

## Current Architecture

- **Backend:** Spring Boot 3.5.16, Java 21, Maven.
- **Database:** MySQL 8.4, database `movies`, user `movies`, password `movies` for local development.
- **Server-rendered UI:** Thymeleaf page at `/`.
- **Dynamic UI:** React + Vite in `frontend/`.
- **Containers:** Docker Compose manages the app and MySQL services. The Dev Container attaches to the app service.

## Important Files

- `docker-compose.yml`: local application and MySQL services.
- `.devcontainer/devcontainer.json`: development container, extensions, Node.js, and forwarded ports.
- `pom.xml`: Spring Boot dependencies and MySQL driver.
- `src/main/resources/application.properties`: datasource and JPA configuration.
- `src/main/resources/templates/index.html`: Thymeleaf server-rendered page.
- `frontend/`: React/Vite frontend source.

## Development Workflow

1. Start Docker Compose with `docker compose up -d`.
2. Confirm the app and MySQL containers are healthy with `docker compose ps`.
3. Use `docker compose logs -f app` when diagnosing Spring Boot startup.
4. Run backend verification with `docker compose exec app mvn clean verify`.
5. Run React locally from `frontend/` with `npm run dev`.
6. Build React with `npm run build` before testing the `/app/` path through Spring Boot.

## Frontend Build Note

The `/app/` path is served by Spring Boot only after the React frontend is built:

```bash
cd frontend
npm install
npm run build
```

The Vite build output is written to `src/main/resources/static/app/`.

## Project Status

No business-domain implementation has been added yet. The repository currently contains the development environment, the Spring Boot health endpoint, a Thymeleaf landing page, and the initial React/Vite structure.
