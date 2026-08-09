# syntax=docker/dockerfile:1.7
#
# Dockerfile générique pour les 4 applications Node.js du monorepo my_music :
#   - service principal        (contexte ".",                              START_FILE=server.js)
#   - microservice mail        (contexte "src/service_auxiliere/mail",      START_FILE=mail.js)
#   - microservice moment      (contexte "src/service_auxiliere/moment",    START_FILE=moment.js)
#   - microservice upload      (contexte "src/service_auxiliere/upload",    START_FILE=upload.js)
#
# Le build context Docker reste TOUJOURS la racine du repo (voir docker-compose.yml) :
# seul ARG APP_DIR change pour sélectionner le sous-dossier applicatif à embarquer.
# Cela permet de n'avoir qu'un seul Dockerfile et un seul .dockerignore.
#
# Choix de base image : Debian "bookworm-slim" (glibc) plutôt qu'Alpine (musl).
# bcrypt (dépendance native) publie des binaires précompilés pour glibc ; sur
# Alpine, npm doit recompiler bcrypt avec node-gyp/python/g++, ce qui casse
# fréquemment le build ou gonfle l'image. glibc évite ce souci de compatibilité.

ARG NODE_VERSION=20-bookworm-slim

########################################
# Étape 1 : installation des dépendances
########################################
FROM node:${NODE_VERSION} AS deps
ARG APP_DIR=.
WORKDIR /app

# Outils de compilation nécessaires si un module natif (ex: bcrypt) n'a pas
# de binaire précompilé pour l'architecture cible (ex: build multi-arch arm64).
# Ils ne sont installés que dans cette étape et n'atterrissent jamais dans
# l'image finale.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY ${APP_DIR}/package.json ${APP_DIR}/package-lock.json* ./
# "npm ls" fait échouer le build si node_modules est incomplet : npm a un bug
# connu ("Exit handler never called!") où "npm ci" peut rendre un exit code 0
# tout en n'ayant pas fini d'écrire node_modules (observé ici avec 4 builds
# npm ci lancés en parallèle par docker compose, probablement par contention
# CPU/IO). Sans cette vérification, l'image se construit "avec succès" mais
# le conteneur crashe au démarrage avec "Cannot find module 'xxx'".
#
# La boucle retente "npm ci" jusqu'à 3 fois : ce bug est intermittent (lié à
# la charge machine), donc une nouvelle tentative avec un node_modules propre
# suffit en général. On supprime node_modules entre chaque tentative pour ne
# pas repartir d'un état partiellement corrompu.
RUN for i in 1 2 3; do \
        rm -rf node_modules \
        && npm ci --omit=dev --no-audit --no-fund \
        && npm ls --omit=dev \
        && break; \
        echo "npm ci a échoué (tentative $i/3), nouvelle tentative..."; \
        [ "$i" = 3 ] && exit 1; \
    done \
    && npm cache clean --force

########################################
# Étape 2 : image d'exécution
########################################
FROM node:${NODE_VERSION} AS runtime
ARG APP_DIR=.
ARG START_FILE=server.js

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    START_FILE=${START_FILE}

# tini : init système correct pour PID 1 (propagation propre de SIGTERM/SIGINT,
# reap des processus zombies) -> attendu dans un environnement cloud-native
# (Docker/Kubernetes envoient SIGTERM lors d'un scale-down ou rolling update).
# wget : utilisé par les HEALTHCHECK des microservices.
RUN apt-get update \
    && apt-get install -y --no-install-recommends tini wget \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --home-dir /app --shell /usr/sbin/nologin app

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY ${APP_DIR} .

RUN mkdir -p /app/uploads && chown -R app:app /app
USER app

EXPOSE 3000

ENTRYPOINT ["tini", "--"]
CMD ["sh", "-c", "node $START_FILE"]
