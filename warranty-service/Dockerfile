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

# A REAL DISPLAY, not a disguise.
# Carrier's warranty lookup runs behind invisible reCAPTCHA and declines a headless
# browser — Chrome honestly reports itself as headless and Google refuses to issue the
# token, so the form never submits. The fix is not to lie about being headless; it is
# to genuinely not be. Xvfb gives the container a real X display, so Chrome runs headed
# exactly as it does on a desk. Nothing is masked and nothing is misrepresented.
RUN apt-get update \
 && apt-get install -y --no-install-recommends xvfb x11-utils tini \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    DISPLAY=:99 \
    PORT=3000

WORKDIR /app

COPY warranty-service/package.json ./
RUN npm install --omit=dev

COPY warranty-service/ ./

EXPOSE 3000
# Start the display ourselves and WAIT for it, then start the service. xvfb-run wrapping
# CMD did not boot in this image — the container never reached "listening on" and Mike's
# warranty went degraded. Doing it explicitly means the failure is visible in the log and
# the service still starts (headless) if the display cannot come up, instead of the whole
# container dying.
COPY warranty-service/start.sh /start.sh
RUN chmod +x /start.sh

# AN INIT PROCESS, OR THE SERVICE SLOWLY KILLS ITSELF.
#
# This is the root cause of the 53-hour outage on 2026-09-11..13. `start.sh` ends in
# `exec node index.js`, so **node becomes PID 1**. On Linux, PID 1 inherits the duty of
# reaping orphaned children, and node does not do it. Every Chromium we kill leaves its
# renderer, GPU, zygote and crashpad_handler children unreaped — each one a zombie
# holding a PID slot forever. They accumulate across every browser recycle until the
# container's pids cgroup is exhausted, at which point `spawn()` returns **EAGAIN** and
# no browser can ever start again.
#
# Nothing is killed and no signal is sent when that limit is hit, so the process does not
# crash — it degrades, answers HTTP normally, and fails every lookup. That is exactly what
# we saw: Trane/Goodman/Rheem/Mitsubishi dead for two days behind a service that looked up.
#
# tini reaps them. Both vendors document this as required, not optional:
#   Playwright — "Using --init Docker flag is recommended to avoid special treatment for
#                 processes with PID=1"   https://playwright.dev/docs/docker
#   Puppeteer  — "dumb-init is worth checking out if you're experiencing a lot of zombies
#                 Chrome processes sticking around"   https://pptr.dev/troubleshooting
#
# It goes in the IMAGE rather than a `docker run --init` flag because Railway controls the
# run command and we do not. `-g` forwards signals to the whole process group, which
# matters here because start.sh backgrounds Xvfb.
ENTRYPOINT ["/usr/bin/tini", "-g", "--"]
CMD ["/start.sh"]
