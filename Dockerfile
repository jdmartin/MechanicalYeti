FROM cgr.dev/chainguard/node
ENV NODE_ENV=production

WORKDIR /app

COPY --chown=node:node . .

RUN npm install --omit-dev

COPY . /app

EXPOSE 5320

CMD [ "index.js" ]
