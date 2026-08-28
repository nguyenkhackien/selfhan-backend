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

## Chạy bằng Docker

Cài Docker Desktop, sau đó tạo file local từ mẫu:

```bash
cp .env.example .env
# Thay các placeholder secret bằng giá trị sinh ngẫu nhiên.
docker compose up --build
```

Stack khởi động PostgreSQL, chạy migration và seed demo một lần, rồi mở API tại
`http://localhost:3000/api/v1`. Để xoá cả database local:

```bash
docker compose down -v
```

`DATABASE_URL` trong `.env` dùng `localhost` cho chạy NestJS trực tiếp. Compose
tự đổi hostname sang service `db` bên trong network Docker.

## Environment

| Biến                    | Bắt buộc | Mô tả                                             |
| ----------------------- | -------- | ------------------------------------------------- |
| `NODE_ENV`              | Có       | `development`, `test` hoặc `production`           |
| `PORT`                  | Có       | Cổng HTTP, mặc định `3000`                        |
| `DATABASE_URL`          | Có       | PostgreSQL connection URL                         |
| `JWT_ACCESS_SECRET`     | Có       | Secret tối thiểu 32 ký tự để ký access token      |
| `JWT_ACCESS_EXPIRATION` | Không    | Thời hạn access token, mặc định `15m`             |
| `FRONTEND_ORIGIN`       | Có       | Origin frontend được phép gửi cookie credentialed |
| `POSTGRES_DB`           | Compose  | Tên database PostgreSQL local                     |
| `POSTGRES_USER`         | Compose  | Tài khoản PostgreSQL local                        |
| `POSTGRES_PASSWORD`     | Compose  | Mật khẩu PostgreSQL local                         |

Environment được validate ngay khi ứng dụng khởi động. Không commit file `.env`.

## Endpoints nền tảng

Tất cả endpoint sử dụng prefix `/api/v1`.

| Endpoint                                          | Mục đích                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| `GET /api/v1/health/live`                         | Liveness: process còn hoạt động                                            |
| `GET /api/v1/health/ready`                        | Readiness: kiểm tra kết nối PostgreSQL                                     |
| `POST /api/v1/auth/register`                      | Tạo learner và trả access token + refresh cookie                           |
| `POST /api/v1/auth/login`                         | Đăng nhập và xoay refresh cookie                                           |
| `POST /api/v1/auth/refresh`                       | Đổi refresh cookie lấy access token mới                                    |
| `POST /api/v1/auth/logout`                        | Thu hồi refresh session nếu có và xoá cookie                               |
| `GET /api/v1/auth/me`                             | Lấy profile bằng Bearer access token                                       |
| `GET /api/v1/levels`                              | Danh sách Level đã publish theo thứ tự                                     |
| `GET /api/v1/levels/:slug`                        | Level và Unit đã publish                                                   |
| `GET /api/v1/units/:slug`                         | Unit và Lesson đã publish                                                  |
| `GET /api/v1/lessons/:slug`                       | Lesson với từ vựng, ví dụ và ngữ pháp đã publish                           |
| `GET /api/v1/hsk/bands`                           | Bảy băng hiển thị HSK cùng số lượng từ đã nhập                             |
| `GET /api/v1/hsk/vocabulary`                      | Trang từ HSK công khai, lọc theo băng/truy vấn/cursor                      |
| `GET /api/v1/hsk/vocabulary/:id`                  | Một từ HSK cùng các nghĩa tiếng Việt theo thứ tự nguồn                     |
| `GET /api/v1/lessons/:id/quizzes`                 | Quiz đã publish của bài học, cần Bearer token                              |
| `GET /api/v1/units/:id/quizzes`                   | Quiz tổng ôn đã publish của chủ đề, cần Bearer token                       |
| `GET /api/v1/quizzes/:id`                         | Prompt/options quiz; không trả đáp án đúng                                 |
| `POST /api/v1/quizzes/:id/attempts`               | Nộp lựa chọn để server chấm và lưu kết quả                                 |
| `GET, POST /api/v1/lessons/:id/progress`          | Đọc/cập nhật phần đã học và completion dẫn xuất                            |
| `GET /api/v1/dashboard`, `GET /api/v1/statistics` | Tổng quan tiến độ và thống kê learner                                      |
| `GET /api/v1/reviews/due`, `POST /api/v1/reviews` | Hàng đợi và kết quả ôn SRS                                                 |
| `PUT, DELETE /api/v1/vocabulary/:id/tags/:tag`    | Gắn hoặc bỏ nhãn `favorite`/`difficult`                                    |
| `/api/v1/admin/:resource`                         | CRUD role-admin cho curriculum và quiz; archive qua `POST .../:id/archive` |

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
npm run seed:demo        # Seed curriculum demo, chỉ development/test
npm run hsk:build        # Build snapshot HSK đã khoá checksum từ source cache local
npm run hsk:import       # Import snapshot HSK vào PostgreSQL, có thể chạy lặp lại
```

## Dữ liệu HSK cục bộ

Snapshot HSK 3.0 nằm tại data/hsk/hsk-3.0-vi.json; ứng dụng không cần gọi API
dịch thuật hay từ điển bên ngoài khi chạy. Các nguồn, giấy phép, thay đổi chuẩn
hoá và lệnh rebuild được ghi trong
[data/hsk/DATA_LICENSE.md](data/hsk/DATA_LICENSE.md).

Trước khi import, chạy migration rồi dùng lệnh import:

```bash
npm run migration:run
npm run hsk:import
```

Importer chia dữ liệu thành transaction nhỏ và upsert theo băng HSK + chữ
giản thể, vì vậy có thể chạy lại snapshot mà không tạo bản ghi trùng. Các mục
thiếu nghĩa tiếng Việt hoặc âm Hán Việt được giữ lại với trạng thái
needs_review; xem data/hsk/review-report.json để rà soát.

## Đọc từ vựng HSK

Ba endpoint HSK là công khai và chỉ đọc: `/hsk/bands`,
`/hsk/vocabulary`, và `/hsk/vocabulary/:id`. Danh sách nhận `band` từ `1` đến
`7` (7 hiển thị là HSK 7–9), `query` dài tối đa 100 ký tự, `cursor` opaque và
`limit` từ 1 đến 50; mặc định là 24. Kết quả giữ thứ tự nguồn và trả
`nextCursor` khi còn trang tiếp theo. Các route này chỉ đọc bảng HSK cục bộ,
không gọi dịch vụ từ điển hay dịch thuật bên ngoài.

## Database và migration

TypeORM schema synchronization luôn tắt. Mọi thay đổi schema phải được đưa vào migration.

```bash
npm run migration:generate
npm run migration:status
npm run migration:run
npm run migration:revert
npm run seed:demo
```

Các lệnh migration đọc `DATABASE_URL` từ environment. Không sửa migration đã chạy trên production.
`seed:demo` bị từ chối khi `NODE_ENV=production`, có thể chạy lặp lại và chỉ
ghi dữ liệu tiếng Trung/Vietnamese do dự án tự biên soạn.

## Authentication và content foundation

Mọi route đều nằm dưới `/api/v1`. Access token gửi bằng header
`Authorization: Bearer <token>`. Refresh token là chuỗi ngẫu nhiên, chỉ được
lưu dạng hash ở database và được gửi trong cookie `selfhan_refresh` có
`HttpOnly`, `SameSite=Strict`, path `/api/v1/auth`; cookie chỉ có cờ `Secure`
khi production. Request/response đầy đủ được đề xuất tại
[`source-trust/specs/001-chinese-learning-mvp/contracts/api-v1.md`](../source-trust/specs/001-chinese-learning-mvp/contracts/api-v1.md).

## Learning state và quản trị nội dung

Quiz, completion bài học, dashboard, SRS, tags và thống kê đều cần Bearer
access token. Server tự lấy người học từ token, tự chấm đáp án, và không bao
giờ gửi `isCorrect` trước lúc nộp quiz. Queue SRS nhận `limit` 1–50 và cursor
opaque. Tài khoản `admin` có thể quản lý `levels`, `units`, `lessons`,
`vocabulary`, `grammar-points`, `quizzes`, `quiz-questions`, và `quiz-options`.
Quiz phải được tạo ở trạng thái `draft`, hoàn thiện câu hỏi/đáp án, rồi mới
chuyển `status` sang `published`.

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
