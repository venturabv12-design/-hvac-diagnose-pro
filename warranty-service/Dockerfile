# Railway's documented path for Playwright: the official image, maintained by the
# Playwright team and tested against each release. Chromium and every system library
# it needs are already present, so there is nothing to apt-get and nothing to drift.
#
# This Dockerfile is ONLY for this service. Mike still builds on Nixpacks and his
# build config is untouched — that separation is the whole point of running the
# browser as its own service.
#
# Paths are repo-root relative on purpose. The service is pointed here with the
# RAILWAY_DOCKERFILE_PATH service variable rather than a dashboard Root Directory
# setting, which keeps the entire service definition in version control.
FROM mcr.microsoft.com/playwright:v1.52.0-noble

ENV NODE_ENV=production \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PORT=3000

WORKDIR /app

COPY warranty-service/package.json ./
RUN npm install --omit=dev

COPY warranty-service/ ./

EXPOSE 3000
CMD ["node", "index.js"]
