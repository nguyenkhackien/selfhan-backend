# NestJS Backend Base

Base backend NestJS hướng production, sử dụng PostgreSQL và TypeORM. Repository áp dụng cấu trúc module theo domain, validation đầu vào nghiêm ngặt, error response nhất quán, request correlation ID, logging có redaction, health checks, migration, unit test và integration-test runner.

## Stack

- Node.js 22+
- NestJS 11
- TypeScript strict
- PostgreSQL
- TypeORM 0.3
- Zod, class-validator, Jest, ESLint, Prettier

## Bắt đầu

```bash
npm install
cp .env.example .env
```

Điền `DATABASE_URL` trong `.env`, sau đó chạy:

```bash
npm run start:dev
```

Ứng dụng chạy mặc định tại `http://localhost:3000`.

## Environment

| Biến | Bắt buộc | Mô tả |
| --- | --- | --- |
| `NODE_ENV` | Có | `development`, `test` hoặc `production` |
| `PORT` | Có | Cổng HTTP, mặc định `3000` |
| `DATABASE_URL` | Có | PostgreSQL connection URL |

Environment được validate ngay khi ứng dụng khởi động. Không commit file `.env`.

## Endpoints nền tảng

Tất cả endpoint sử dụng prefix `/api/v1`.

| Endpoint | Mục đích |
| --- | --- |
| `GET /api/v1/health/live` | Liveness: process còn hoạt động |
| `GET /api/v1/health/ready` | Readiness: kiểm tra kết nối PostgreSQL |

Mỗi response trả header `x-request-id`. Error dùng envelope an toàn:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [],
    "requestId": "req_..."
  }
}
```

## Scripts

```bash
npm run start:dev        # Development server
npm run build            # Production build
npm run format           # Format source files
npm run format:check     # Check formatting
npm run lint             # ESLint
npm run typecheck        # TypeScript check
npm test                 # Unit tests
npm run test:integration # Integration tests
npm run test:cov         # Unit-test coverage
```

## Database và migration

TypeORM schema synchronization luôn tắt. Mọi thay đổi schema phải được đưa vào migration.

```bash
npm run migration:generate
npm run migration:status
npm run migration:run
npm run migration:revert
```

Các lệnh migration đọc `DATABASE_URL` từ environment. Không sửa migration đã chạy trên production.

## Cấu trúc thư mục

```text
src/
├── common/           # filters, middleware, pipes, shared types
├── config/           # validated environment configuration
├── infrastructure/   # database and logging adapters
└── modules/
    └── health/       # starter module
        ├── application/
        └── presentation/
```

Module business mới nên theo cấu trúc `presentation`, `application`, `domain`, và `infrastructure`. Controller chỉ xử lý HTTP; business logic nằm trong use case/domain service; TypeORM entity và repository adapter nằm ở infrastructure.

## Engineering guide

Đọc [AGENTS.md](AGENTS.md) và các quy ước trong [`.agent/`](.agent/) trước khi thay đổi source. Các quy tắc này bao gồm validation, authorization, transaction, migration, logging, testing và review checklist.
