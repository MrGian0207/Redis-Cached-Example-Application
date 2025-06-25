# Sử dụng image Node.js LTS
FROM node:18-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Build ứng dụng TypeScript (nếu cần)
RUN npm run build

# Expose port ứng dụng
EXPOSE 3000

# Lệnh khởi động ứng dụng
CMD ["npm", "run", "start"]
