# Railway's documented path for Playwright: the official image, maintained by the
# Playwright team and tested against each release. Chromium and every system library
# it needs are already present, so there is nothing to apt-get and nothing to drift.
#
# This Dockerfile is ONLY for this service. Mike still builds on Nixpacks and his
# build config is untouched — that separation is the whole point of running the
# browser as its own service.
#
# COPY paths are REPO-ROOT relative, because Railway clones the whole repo as the
# build context and is pointed here by the RAILWAY_DOCKERFILE_PATH service variable.
# That keeps the entire service definition in version control instead of in a
# dashboard setting. (Local `railway up` from the repo root is not an option — the
# repo carries large media assets and blows past the upload limit. Railway's own
# server-side clone has no such limit, which is why the GitHub source is the path.)
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
