# Builder Stage
FROM node:20 AS builder
WORKDIR /usr/app
COPY ./src ./
RUN npm install --omit=dev --no-audit --no-fund

# Final Stage
FROM node:20
WORKDIR /usr/app
COPY --from=builder /usr/app/ ./
EXPOSE 3000
CMD [ "npm", "run", "start" ]