-- Tạo enum (giữ nguyên)
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR', 'SUPPORT');

CREATE TYPE "UserStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'PENDING_VERIFICATION'
);

-- Sửa phần ALTER TABLE
ALTER TABLE "User"
ADD COLUMN "address" VARCHAR(500),
ADD COLUMN "avatar" VARCHAR(255),
ADD COLUMN "bio" TEXT,
ADD COLUMN "birthdate" DATE,
ADD COLUMN "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastLogin" TIMESTAMPTZ,
ADD COLUMN "password" VARCHAR(255), -- Bỏ NOT NULL tạm thời
ADD COLUMN "phone" VARCHAR(20),
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "updatedAt" TIMESTAMPTZ;

-- Bỏ NOT NULL tạm thời
-- Cập nhật giá trị cho các bản ghi hiện có
UPDATE "User"
SET
  "password" = 'temp_password_needs_reset',
  "updatedAt" = CURRENT_TIMESTAMP;

-- Chuyển cột thành bắt buộc sau khi đã có giá trị
ALTER TABLE "User"
ALTER COLUMN "password"
SET
  NOT NULL,
ALTER COLUMN "updatedAt"
SET
  NOT NULL;