# Builder Stage
FROM node:16 AS builder
WORKDIR /usr/app
COPY ./src ./
RUN npm ci --only=production

# Final Stage
FROM node:16-alpine
ARG NODE_ENV
WORKDIR /usr/app
COPY --from=builder /usr/app/ ./
EXPOSE 3000
CMD [ "npm", "start" ]