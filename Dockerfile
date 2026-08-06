FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci --omit=dev

# Le schéma doit être copié avant `prisma generate` : le client est produit
# à partir de ce fichier, pas du code applicatif.
COPY backend/prisma ./prisma
COPY backend/prisma.config.js ./

RUN npx prisma generate

COPY backend/ .

ENV NODE_ENV=production

EXPOSE 5000

# Au démarrage : les migrations en attente sont appliquées, puis le seed
# garantit l'existence des deux comptes d'administration. Les deux
# opérations sont idempotentes — un redémarrage ne duplique rien.
#
# `migrate deploy` (et non `migrate dev`) : en production on applique les
# migrations existantes, on n'en génère jamais de nouvelles.
CMD ["sh","-c","npx prisma migrate deploy && node prisma/seed.js && npm start"]
