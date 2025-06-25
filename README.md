---
# 🚀 Redis Cached Example Application
---

## 🧩 Tính năng chính

- ✅ CRUD User: tạo, lấy danh sách, lấy theo ID
- ⚡ Cache danh sách user với Redis
- 🔁 Tự động xóa cache khi dữ liệu thay đổi
- 📜 Logging với **Winston** & **Morgan**
- ⚙️ Cấu hình qua file `.env`
- 🐳 Hỗ trợ **Docker** & **Docker Compose**

---

## 🗂️ Cấu trúc thư mục

```
src/
|── controllers/     # Xử lý request/response
├── libs/            # Redis client, Logger config
├── prisma/          # Prisma Client setup
├── routes/          # Định nghĩa API routes
├── services/        # Business logic
├── types/           # Types & interfaces
prisma/
├── schema.prisma    # Prisma schema
├── migrations/      # Các file migration
Dockerfile
docker-compose.yml
```

---

## ⚙️ Cài đặt & chạy

### 1. Clone repo và cài dependencies:

```bash
git clone <repo-url> && cd redis-cached
npm install
```

### 2. Tạo file `.env` với cấu hình:

```
DATABASE_URL=postgresql://<user>:<pass>@<host>:<port>/<db>
REDIS_URL=redis://localhost:6379
```

### 3. Chạy migration & seed dữ liệu (tuỳ chọn):

```bash
npm run prisma:migrate
npx tsx user.ts
```

### 4. Chạy ứng dụng:

```bash
npm run dev
```

Hoặc sử dụng Docker Compose:

```bash
docker-compose up --build
```

---

## 📡 API Endpoints

| Method | Endpoint     | Mô tả                         |
| ------ | ------------ | ----------------------------- |
| GET    | `/users`     | Lấy danh sách user (có cache) |
| POST   | `/users`     | Tạo user mới                  |
| GET    | `/users/:id` | Lấy thông tin user theo ID    |

---

## 🔐 Lưu ý

- Redis chỉ là **cache tạm thời**, **không lưu trữ vĩnh viễn**
- Danh sách user trong cache sẽ **bị xóa khi có thay đổi dữ liệu**
- Có thể **mở rộng dễ dàng** với kiến trúc module-based

---

**Made by [Minh Hieu]**

---

Nếu bạn muốn tạo file `README.md` từ nội dung này hoặc cần bản tiếng Anh, mình có thể giúp!
