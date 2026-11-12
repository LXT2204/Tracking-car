# Giai đoạn 1: dùng Node để build React thành HTML/CSS/JS tĩnh
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Vite "dán" địa chỉ API vào code lúc build, nên phải truyền vào từ đây
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Giai đoạn 2: chỉ giữ file đã build, phục vụ bằng nginx (image cuối không chứa Node)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
