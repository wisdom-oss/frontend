ARG VOLTA_VERSION=2.0.1
ARG DUFS_VERSION=0.43.0


# build the app via volta to use the correct node version
FROM --platform=linux/amd64 debian:bookworm AS build-app
RUN apt update -y && apt upgrade -y
RUN apt install -y curl
WORKDIR /app

# install volta to install correct node version
RUN curl -o install-volta.sh -L --proto "=https" --tlsv1.2 -sSf https://get.volta.sh
ARG VOLTA_VERSION
ENV VOLTA_HOME="/.volta"
RUN bash install-volta.sh --version ${VOLTA_VERSION}
ENV PATH="$VOLTA_HOME/bin:$PATH"

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
FROM sigoden/dufs:v${DUFS_VERSION}
WORKDIR /wisdom-oss
COPY --from=build-app /app/dist/wisdom-oss/frontend/browser /wisdom-oss/app
EXPOSE 5000
ENTRYPOINT [ "dufs", "--render-spa", "-b0.0.0.0", "-p5000", "app" ]
