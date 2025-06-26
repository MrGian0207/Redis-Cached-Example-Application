# Sử dụng image Node.js LTS
FROM node:18-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy package.json và yarn.lock
COPY package*.json ./
COPY yarn.lock ./

# Copy prisma/ trước để postinstall không lỗi
COPY prisma ./prisma

# Cài đặt dependencies
RUN yarn install --frozen-lockfile

# Copy mã nguồn
COPY src ./src
COPY tsconfig.json ./

# Build ứng dụng TypeScript
RUN yarn build

# Kiểm tra xem build có thành công không
RUN ls -la build/ && test -f build/index.js

# Expose port ứng dụng
EXPOSE 3000

# Khởi động ứng dụng
CMD ["yarn", "run", "start"]