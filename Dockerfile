ARG VOLTA_VERSION=2.0.2
ARG DUFS_VERSION=0.43.0
ARG GIT_COMMIT_SHA


# build the app via volta to use the correct node version
FROM --platform=$BUILDPLATFORM debian:bookworm AS build-app
ARG VOLTA_VERSION
ARG GIT_COMMIT_SHA

RUN apt update -y && apt upgrade -y
RUN apt install -y curl
WORKDIR /app

# install volta to install correct node version
RUN curl -o install-volta.sh -L --proto "=https" --tlsv1.2 -sSf https://get.volta.sh
ENV VOLTA_HOME="/.volta"
RUN bash install-volta.sh --version ${VOLTA_VERSION}
ENV PATH="$VOLTA_HOME/bin:$PATH"

# install node
COPY --link package.json .
RUN volta run node --version
RUN volta run npm --version

# install dependencies
COPY --link package-lock.json .
COPY --link .npmrc .
# also include patches for install
COPY --link patches/ patches/
RUN volta run npm ci

# build the app
COPY --link . .
ENV GIT_COMMIT_SHA=${GIT_COMMIT_SHA}
RUN volta run npm run build


# host the app via the static file server
FROM sigoden/dufs:v${DUFS_VERSION}
WORKDIR /wisdom-oss
COPY --from=build-app /app/dist/wisdom-oss/frontend/browser /wisdom-oss/app
EXPOSE 5000
ENTRYPOINT [ "dufs", "--render-spa", "-b0.0.0.0", "-p5000", "app" ]
