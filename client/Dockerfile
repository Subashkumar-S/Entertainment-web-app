FROM node:20-alpine

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

# Vite inlines import.meta.env.VITE_* at BUILD time, so the API base must be set
# BEFORE `npm run build` — a runtime env var is ignored by the static `serve -s dist`.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist"]