FROM node:lts-alpine
WORKDIR /app
COPY . .
RUN yarn install
# 'yarn --production' deletes all devDependencies.
# Delete the cache because we don't need it in production.
ENV PORT="3000" \
  NODE_ENV="production" \
  UI_SERVICE_NAME="foo"
RUN yarn build && yarn --production && yarn cache clean
EXPOSE 3000
# not port 80 because this is probably going to be behind
# a load balancer of some sort
CMD ["yarn", "start"]