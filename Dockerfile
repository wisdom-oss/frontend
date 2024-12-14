ARG VOLTA_TAG=v2.0.1
ARG DUFS_VERSION=0.43.0


# build the app via volta to use the correct node version
FROM rust:latest AS build-app
RUN apt update -y && apt upgrade -y
WORKDIR /app

# install volta directly from source
ARG VOLTA_TAG
RUN cargo install --git https://github.com/volta-cli/volta.git --tag $VOLTA_TAG --locked
ENV PATH="bin/volta/bin:$PATH"

# install node
COPY --link package.json .
RUN volta run node --version

# install dependencies
COPY --link package-lock.json .
RUN volta run npm ci

# build the app
COPY --link . .
RUN volta run npm run build

# host the app via the static file server
FROM sigoden/dufs
RUN apk upgrade --no-cache
WORKDIR /wisdom-oss
COPY --link --from=build-app /app/dist/wisdom-oss/frontend/browser /wisdom-oss/app
ENTRYPOINT [ "dufs", "app", "--render-index" ]
