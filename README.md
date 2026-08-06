<div align="center">

<img src="docs/assets/logo.png" alt="NetandPro Events" width="120" />

# NetandPro Events — API

**Backend REST de la plateforme de réservation de salles et de gestion d'événements de NetandPro Systems.**

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.1-000000?logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-7.9-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0.3-6BA539?logo=openapiinitiative&logoColor=white)](https://spec.openapis.org/oas/v3.0.3)

</div>

---

## Sommaire

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Pile technique](#pile-technique)
- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Base de données](#base-de-données)
  - [Schéma](#schéma)
  - [Migrations Prisma](#migrations-prisma)
  - [Seed](#seed)
  - [Migration depuis MySQL](#migration-depuis-mysql)
- [Documentation de l'API](#documentation-de-lapi)
- [Référence des endpoints](#référence-des-endpoints)
- [Authentification et rôles](#authentification-et-rôles)
- [Paramétrage métier](#paramétrage-métier)
- [Automatismes](#automatismes)
- [Journal d'audit](#journal-daudit)
- [Sauvegardes](#sauvegardes)
- [Scripts npm](#scripts-npm)
- [Structure du projet](#structure-du-projet)
- [Sécurité](#sécurité)
- [Intégration et déploiement continus](#intégration-et-déploiement-continus)
- [Dépannage](#dépannage)
- [Ressources externes](#ressources-externes)
- [Équipe](#équipe)
- [Licence](#licence)

---

## Aperçu

NetandPro Events est la plateforme événementielle de **NetandPro Systems** (Yaoundé, Cameroun). Elle couvre le cycle complet d'une prestation : un visiteur consulte les salles disponibles et dépose une demande depuis le site public, l'équipe la valide depuis une console d'administration, et les échanges avec le client — accusé de réception, confirmation, rappel, demande d'avis — partent automatiquement.

Ce dépôt contient **l'API REST seule**. L'interface React vit dans un dépôt distinct et consomme exclusivement les endpoints décrits ici : aucun accès direct à la base, aucune requête SQL côté client.

| Composant | Rôle |
|---|---|
| **NP-backendDev** *(ce dépôt)* | API REST, règles métier, accès aux données, envois d'emails |
| **NP-frontendDev** | Site public + console d'administration (React 19) |
| **netandpro-infrastructureDev** | Infrastructure as Code |

---

## Fonctionnalités

**Réservations**
- Dépôt de demande public, sans compte
- Validation par les paramètres : préavis minimum, durée maximale, jours de fermeture, fermetures exceptionnelles, chevauchement, battement entre événements, quota journalier par salle, capacité
- Liste d'attente proposée lorsqu'une salle est déjà prise
- Cycle de statut *En attente → Confirmé → Annulé*, avec calcul de la retenue d'acompte en cas d'annulation tardive

**Lieux**
- Arborescence à deux niveaux : sites (hôtels, centres de congrès, clubs) et salles rattachées
- Fiche détaillée par salle : capacité, surface, étage, dispositions, équipements, tarif journalier
- Taux d'occupation calculé sur le mois courant

**Relation client**
- Messagerie de contact avec historique des réponses
- Témoignages soumis publiquement, modérés avant publication, expirant automatiquement après trois mois

**Administration**
- Statistiques : volumétrie, taux de confirmation, préavis moyen, modes de paiement, services les plus demandés, occupation par site, meilleurs clients
- Back-office de paramétrage couvrant neuf rubriques
- Gestion des comptes, rôles et politiques de mot de passe
- Journal d'audit horodaté de toutes les écritures
- Sauvegardes de la base à la demande ou planifiées

---

## Pile technique

| Domaine | Choix | Version |
|---|---|---|
| Exécution | [Node.js](https://nodejs.org) | 20+ |
| Framework HTTP | [Express](https://expressjs.com) | 5.1 |
| Base de données | [PostgreSQL](https://www.postgresql.org/docs/16/index.html) | 16 |
| ORM | [Prisma](https://www.prisma.io/docs) | 7.9 |
| Pilote | [`@prisma/adapter-pg`](https://www.prisma.io/docs/orm/overview/databases/postgresql) + [`pg`](https://node-postgres.com) | 8.x |
| Authentification | [JSON Web Token](https://github.com/auth0/node-jsonwebtoken) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | — |
| Emails | [Nodemailer](https://nodemailer.com) | 7.x |
| Téléversement | [Multer](https://github.com/expressjs/multer) | 2.x |
| Sécurité HTTP | [Helmet](https://helmetjs.github.io) + [express-rate-limit](https://express-rate-limit.mintlify.app) | — |
| Documentation | [OpenAPI 3.0.3](https://spec.openapis.org/oas/v3.0.3) + [Swagger UI](https://swagger.io/tools/swagger-ui/) + [Redocly CLI](https://redocly.com/docs/cli/) | — |
| Conteneurisation | [Docker Compose](https://docs.docker.com/compose/) | — |

---

## Architecture

L'API suit une séparation en quatre couches. **Aucune requête SQL n'est écrite à la main** : tout accès aux données passe par Prisma.

```
   Client HTTP  (React, navigateur, curl)
        │
        ▼
┌────────────────────────────────────────────────────────┐
│  routes/          déclaration des chemins et des gardes │
│                   helmet · cors · rate-limit · JWT      │
│                   maintenanceMode · auditTrail          │
├────────────────────────────────────────────────────────┤
│  controllers/     validation d'entrée, codes HTTP,      │
│                   forme de la réponse JSON              │
├────────────────────────────────────────────────────────┤
│  services/        règles métier transverses             │
│                   settingsGuard · mailEvents            │
│                   mailScheduler · audit · backupService │
├────────────────────────────────────────────────────────┤
│  models/          accès aux données — Prisma uniquement │
├────────────────────────────────────────────────────────┤
│  config/prisma.js client unique, adaptateur pg          │
└────────────────────────────────────────────────────────┘
        │
        ▼
   PostgreSQL 16  (conteneur Docker, port 5434)
```

**Deux conventions volontaires**, documentées en tête de [`prisma/schema.prisma`](backend/prisma/schema.prisma) :

1. **Les champs Prisma portent le nom exact des colonnes** (`client_name`, et non `clientName`). Les contrôleurs renvoient les enregistrements tels quels et le frontend lit ces clés ; le camelCase aurait imposé une couche de traduction dans chaque endpoint.

2. **Les jeux de valeurs fermés sont du texte contraint par `CHECK`, non des `enum`.** Plusieurs valeurs contiennent espaces et accents — « En attente », « Club privé », « par jour » — que Prisma ne peut exprimer en identifiant d'enum sans `@map`. Or le client Prisma renvoie le *nom* de la valeur, pas sa correspondance en base : le frontend aurait reçu `EN_ATTENTE` au lieu de `En attente`. Les contraintes sont posées par la migration [`value_constraints`](backend/prisma/migrations).

---

## Démarrage rapide

### Prérequis

- [Node.js 20+](https://nodejs.org/en/download) et npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou un PostgreSQL 16 accessible)
- Un compte SMTP pour les envois d'emails — [mot de passe d'application Gmail](https://support.google.com/accounts/answer/185833) recommandé

### Installation

```bash
git clone https://github.com/Felix-TANZI/NP-backendDev.git
cd NP-backendDev

# 1. Base de données
docker compose up -d

# 2. Dépendances
cd backend
npm install

# 3. Configuration
cp .env.example .env      # puis renseigner JWT_SECRET, SMTP et SEED_*

# 4. Schéma + comptes d'administration
npm run db:deploy
npm run seed

# 5. Lancement
npm run dev
```

L'API écoute sur <http://localhost:5000>. Vérification :

```bash
curl http://localhost:5000/api/health
# {"status":"OK","message":"Backend NetandPro opérationnel"}
```

Au démarrage, la console affiche :

```
📘 Documentation API : /api/docs — env=development · sans authentification
🚀 Serveur backend démarré sur http://localhost:5000
✅ Connexion PostgreSQL réussie
```

---

## Variables d'environnement

Toutes se déclarent dans `backend/.env`. Le fichier n'est jamais versionné ; [`backend/.env.example`](backend/.env.example) en donne le gabarit.

### Serveur

| Variable | Défaut | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `production` |
| `PORT` | `5000` | Port d'écoute |
| `CORS_ORIGIN` | `http://localhost:3000` | Origines autorisées, séparées par des virgules |

### Base de données

| Variable | Description |
|---|---|
| `DATABASE_URL` | Chaîne PostgreSQL complète. Doit correspondre au service `db` de [`docker-compose.yml`](docker-compose.yml). |

```
DATABASE_URL="postgresql://netandpro:netandpro_dev@localhost:5434/netandpro?schema=public"
```

> Le port **5434** est délibéré : 5432 et 5433 sont fréquemment occupés par d'autres instances. Chaque projet a son conteneur et son volume.

### Authentification

| Variable | Défaut | Description |
|---|---|---|
| `JWT_SECRET` | — | **Obligatoire.** Clé de signature des jetons. |
| `JWT_EXPIRES_IN` | `24h` | Durée de validité |

### Emails

| Variable | Description |
|---|---|
| `EMAIL_USER`, `EMAIL_PASSWORD` | Identifiants SMTP de repli, si le back-office n'est pas renseigné |
| `EMAIL_RECEIVE` | Destinataire par défaut du formulaire de contact |

Les paramètres SMTP effectifs (`smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_from_name`, `smtp_reply_to`) se règlent **depuis le back-office**, rubrique *Notifications*, et priment sur ces variables.

### Comptes initiaux

| Variable | Défaut | Description |
|---|---|---|
| `SEED_ADMIN_EMAIL` | `admin@netandpro.cm` | Compte super administrateur |
| `SEED_ADMIN_PASSWORD` | — | **À renseigner.** |
| `SEED_ADMIN_NAME` | `Administrateur NetandPro` | Nom affiché |
| `SEED_SUPERVISOR_EMAIL` | `superviseur@netandpro.cm` | Compte superviseur |
| `SEED_SUPERVISOR_PASSWORD` | — | **À renseigner.** |
| `SEED_SUPERVISOR_NAME` | `Superviseur NetandPro` | Nom affiché |

### Sauvegardes

| Variable | Défaut | Description |
|---|---|---|
| `PG_CONTAINER` | `netandpro_postgres` | Conteneur dans lequel `pg_dump` est exécuté |
| `PG_DUMP_PATH` | *(vide)* | Chemin d'un `pg_dump` local ; prioritaire sur le conteneur |

### Documentation

| Variable | Défaut | Description |
|---|---|---|
| `ENABLE_API_DOCS` | `true` | Expose ou masque `/api/docs` |
| `API_DOCS_PATH` | `/api/docs` | Chemin de montage |
| `API_DOCS_USER`, `API_DOCS_PASSWORD` | — | Authentification *basic*, **obligatoire hors développement** |

### Héritage MySQL

`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL` ne servent plus qu'au script de migration ponctuel. **Aucun code applicatif ne s'y connecte.**

---

## Base de données

### Schéma

15 tables, décrites dans [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

| Domaine | Tables |
|---|---|
| **Comptes** | `users`, `password_reset_codes` |
| **Lieux & réservations** | `locations` *(auto-référencée)*, `events`, `testimonials` |
| **Messagerie** | `contact_messages`, `message_replies` |
| **Paramétrage** | `app_settings`, `business_hours`, `closures`, `service_catalog`, `email_templates` |
| **Journaux** | `audit_log`, `maintenance_log`, `email_log` |

```
users ──┬── created_by (auto-référence)
        ├── app_settings.updated_by
        ├── audit_log.user_id
        ├── maintenance_log.user_id
        ├── message_replies.admin_id
        └── testimonials.moderated_by

locations ──┬── parent_id (auto-référence, CASCADE)
            └── events.location_id ── testimonials.event_id

contact_messages ── message_replies.message_id (CASCADE)
```

### Migrations Prisma

Le schéma est versionné dans `backend/prisma/migrations/`. Depuis Prisma 7, l'URL de connexion ne figure plus dans `schema.prisma` : la CLI la lit dans [`prisma.config.js`](backend/prisma.config.js), l'application la transmet via un *driver adapter* ([`config/prisma.js`](backend/config/prisma.js)).

```bash
npm run db:migrate    # créer et appliquer une migration (développement)
npm run db:deploy     # appliquer les migrations existantes (production)
npm run db:generate   # régénérer le client après modification du schéma
npm run db:studio     # explorateur graphique — http://localhost:5555
```

> **En production, toujours `db:deploy`.** `db:migrate` compare le schéma à la base et peut proposer une réinitialisation.

### Seed

```bash
npm run seed
```

Crée un compte **super administrateur** et un compte **superviseur** à partir des variables `SEED_*`, avec `must_change_password = true`.

Le script est **idempotent** et **ne réécrit jamais** le mot de passe d'un compte existant : un administrateur ayant changé le sien depuis le back-office ne le verra pas réinitialisé au prochain déploiement.

### Migration depuis MySQL

Le projet reposait initialement sur MySQL 8. Le script de bascule est conservé pour la traçabilité et la reprise :

```bash
npm run db:transfer
```

Il lit MySQL en lecture seule, vide PostgreSQL et recopie les 15 tables. Trois précautions :

- **Les identifiants sont préservés**, et les séquences PostgreSQL recalées sur `max(id)` — sans quoi le prochain `INSERT` réutiliserait l'identifiant 1.
- **Les auto-références** (`users.created_by`, `locations.parent_id`) sont insérées à `NULL` puis rétablies en seconde passe : rien ne garantit qu'un parent précède son enfant.
- **Les conversions sont explicites** : `0/1` → booléen, `« 08:00:00 »` → `TIME`, chaînes → `DECIMAL`.

---

## Documentation de l'API

| Format | Adresse | Usage |
|---|---|---|
| **Swagger UI** | <http://localhost:5000/api/docs> | Exploration interactive, essais en direct |
| **Spécification OpenAPI** | [`backend/docs/openapi.yaml`](backend/docs/openapi.yaml) | Source de vérité, versionnée |

Hors développement, l'accès est protégé par authentification *basic* (`API_DOCS_USER` / `API_DOCS_PASSWORD`) et le mode « essayer » est désactivé.

Contrôle de cohérence entre le code et la documentation :

```bash
node scripts/check-api-docs.js
```

Le script compare les chemins déclarés dans `openapi.yaml` aux routes réellement montées par Express, et signale les divergences dans les deux sens.

> ℹ️ **État actuel** : la spécification décrit **20 opérations sur les 78 montées**. Elle est donc valide mais partielle — la compléter reste un chantier ouvert, et `check-api-docs.js` sort en erreur tant que l'écart subsiste.

Validation et prévisualisation avec [Redocly](https://redocly.com/docs/cli/) :

```bash
npx redocly lint docs/openapi.yaml
npx redocly preview-docs docs/openapi.yaml
```

---

## Référence des endpoints

🌐 public · 🔒 authentifié · 👑 super administrateur

### Authentification — `/api/auth`

| | Méthode | Chemin | Description |
|---|---|---|---|
| 🌐 | `POST` | `/login` | Connexion — renvoie le jeton et le profil |
| 🔒 | `GET` | `/verify` | Valide le jeton et rafraîchit le profil |
| 🔒 | `POST` | `/change-password` | Changement de mot de passe (+3 mois de validité) |
| 🌐 | `POST` | `/password/request-code` | Envoi d'un code à 6 chiffres |
| 🌐 | `POST` | `/password/verify-code` | Vérification du code |
| 🌐 | `POST` | `/password/reset` | Réinitialisation après vérification |

### Événements — `/api/events`

| | Méthode | Chemin | Description |
|---|---|---|---|
| 🌐 | `GET` | `/public` | Calendrier public, sans donnée identifiante |
| 🌐 | `GET` | `/availability?from&to` | Salles occupées sur une plage |
| 🌐 | `POST` | `/` | Dépôt d'une demande *(règles métier appliquées)* |
| 🔒 | `GET` | `/` | Liste complète |
| 🔒 | `GET` | `/calendar?from&to` | Calendrier d'administration |
| 🔒 | `GET` | `/:id` | Détail d'un dossier |
| 🔒 | `PUT` | `/:id` | Modification |
| 🔒 | `PATCH` | `/:id/status` | Changement de statut *(email + audit)* |
| 🔒 | `DELETE` | `/:id` | Suppression |

### Lieux — `/api/locations`

| | Méthode | Chemin | Description |
|---|---|---|---|
| 🌐 | `GET` | `/` | Liste plate des salles actives |
| 🌐 | `GET` | `/parents` | Sites racines |
| 🌐 | `GET` | `/children/:parentId` | Salles d'un site |
| 🔒 | `GET` | `/tree` | Arborescence + taux d'occupation |
| 🔒 | `GET` | `/:id` | Détail |
| 🔒 | `POST` `PUT` `DELETE` | `/`, `/:id` | Création, modification, archivage |

### Témoignages — `/api/testimonials`

| | Méthode | Chemin | Description |
|---|---|---|---|
| 🌐 | `GET` | `/` | Avis publiés, filtrés par note minimale |
| 🌐 | `POST` | `/` | Dépôt *(si le formulaire est ouvert)* |
| 🔒 | `GET` | `/admin`, `/admin/counts` | Modération |
| 🔒 | `PATCH` | `/admin/publish-all` | Publication en masse |
| 🔒 | `POST` | `/admin/clean` | Purge des avis expirés |
| 🔒 | `PATCH` | `/:id/status`, `/:id/flag` | Statut, mise en avant |
| 🔒 | `DELETE` | `/:id` | Suppression |

### Messagerie — `/api/contact-messages` 🔒

`GET /` · `GET /counts` · `GET /:id` · `PATCH /read-all` · `PATCH /:id/status` · `POST /:id/reply` · `DELETE /:id`

### Statistiques — `/api/stats` 🔒

`GET /` *(tableau de bord)* · `GET /overview?period=annee|semestre|trimestre`

### Comptes — `/api/users` 👑

`GET /` · `POST /` · `PATCH /:id` · `PATCH /:id/role` · `PATCH /:id/active` · `PATCH /:id/twofa` · `POST /:id/reset-password` · `DELETE /:id`

### Journal d'audit — `/api/audit` 👑

`GET /` · `GET /stats` · `GET /export` *(CSV)*

### Paramètres — `/api/settings`

| | Méthode | Chemin | Description |
|---|---|---|---|
| 🌐 | `GET` | `/public` | Configuration du site public |
| 👑 | `GET` `PATCH` | `/` | Lecture et écriture des paramètres |
| 👑 | `GET` | `/export` | Export JSON |
| 👑 | `POST` | `/reset/:group` | Réinitialisation d'une rubrique |
| 👑 | `POST` | `/branding/:kind` | Téléversement du logo ou du favicon |
| 👑 | `PUT` | `/hours` | Horaires d'exploitation |
| 👑 | `POST` `DELETE` | `/closures`, `/closures/:id` | Fermetures exceptionnelles |
| 👑 | `POST` `PATCH` `DELETE` | `/services`, `/services/:id` | Catalogue de prestations |
| 👑 | `GET` `PATCH` | `/templates/:key` | Modèles d'emails |
| 👑 | `POST` | `/test-email` | Envoi d'un email de test |
| 👑 | `GET` | `/verify-smtp` | Vérification SMTP sans envoi |
| 👑 | `GET` | `/health`, `/maintenance-log` | Santé et journal technique |
| 👑 | `POST` | `/backup`, `/clear-cache`, `/purge-logs`, `/purge-cancelled` | Maintenance |
| 👑 | `GET` | `/backups/:file` | Téléchargement d'une sauvegarde |

### Contact — `/api/email`

`POST /contact` 🌐 *(limité à 10 messages par heure et par IP)* · `GET /test`

---

## Authentification et rôles

Le jeton JWT est transmis par en-tête :

```http
Authorization: Bearer <token>
```

Il porte `{ id, email, role }`. **Le rôle y est signé** : `roleMiddleware` s'appuie dessus sans requête supplémentaire.

| Rôle | Portée |
|---|---|
| `super_admin` | Accès complet, dont comptes, paramètres et journal d'audit |
| `superviseur` | Réservations, lieux, messagerie, témoignages, statistiques |

**Politique de mot de passe**

- Validité de 3 mois ; l'expiration bloque la connexion et impose une réinitialisation
- Un compte suspendu (`is_active = false`) est refusé à la connexion
- Réinitialisation par code à 6 chiffres, valable 10 minutes, 5 tentatives maximum
- Les comptes créés par un administrateur ou par le seed portent `must_change_password`

---

## Paramétrage métier

Neuf rubriques pilotables depuis le back-office, sans redéploiement. Les valeurs sont mises en cache par processus et invalidées à chaque écriture.

| Rubrique | Contenu |
|---|---|
| `marque` | Nom, accroche, logo, favicon, couleur d'accent, devise, langue, fuseau |
| `contact` | Raison sociale, NIU, RCCM, adresse, téléphones, emails, réseaux sociaux |
| `resa` | Préavis, durée maximale, statut par défaut, confirmation automatique, liste d'attente, champs obligatoires, politique d'annulation |
| `horaires` | Ouverture hebdomadaire, battement, quota journalier |
| `services` | Catalogue, TVA, acompte, délai de paiement |
| `paiement` | Moyens acceptés, coordonnées bancaires, facturation |
| `notif` | SMTP, modèles, destinataires internes, rappels |
| `site` | Sections de la page d'accueil, bandeau, maintenance, avis affichés |
| `systeme` | Sauvegardes automatiques, rétention des journaux |

Les règles de réservation sont appliquées par [`services/settingsGuard.js`](backend/services/settingsGuard.js), qui contrôle dans cet ordre : préavis, durée, jour de fermeture, fermeture exceptionnelle, chevauchement, battement, quota journalier, capacité.

---

## Automatismes

[`services/mailScheduler.js`](backend/services/mailScheduler.js) tourne toutes les heures, première exécution 60 secondes après le démarrage.

| Automatisme | Déclencheur | Modèle |
|---|---|---|
| Accusé de réception | Dépôt d'une demande | `ack` |
| Confirmation | Passage à *Confirmé* | `confirm` |
| Annulation | Passage à *Annulé* | `cancel` |
| Rappel | `reminder_days` avant l'événement | `remind` |
| Demande d'avis | `review_request_days` après l'événement | `review` |
| Purge du journal d'audit | `log_retention_days` | — |

Chaque envoi est tracé dans `email_log`, ce qui rend le passage horaire **idempotent** : un même rappel ne part jamais deux fois.

Les modèles sont modifiables depuis le back-office et acceptent des variables : `{{client_name}}`, `{{event_title}}`, `{{location_name}}`, `{{date_start}}`, `{{date_end}}`, `{{attendees}}`, `{{status}}`, `{{cancel_policy}}`, `{{site_name}}`.

---

## Journal d'audit

Toute écriture authentifiée est consignée dans `audit_log`, selon deux mécanismes complémentaires :

1. **Traces explicites** — les contrôleurs sensibles enregistrent le détail des changements, valeur avant et après.
2. **Filet automatique** — le middleware `auditTrail` journalise toute requête d'écriture qu'un contrôleur n'aurait pas déjà tracée, en s'appuyant sur une table de règles chemin/méthode.

Chaque entrée retient l'acteur (**figé**, afin de survivre à la suppression du compte), l'adresse IP, l'agent utilisateur, la méthode, le chemin et le code HTTP. Huit catégories : `param`, `resa`, `moder`, `systeme`, `email`, `acces`, `contenu`, `users`.

Consultation réservée au super administrateur, avec export CSV.

---

## Sauvegardes

```bash
curl -X POST http://localhost:5000/api/settings/backup \
     -H "Authorization: Bearer <token>"
```

Les fichiers sont déposés dans `database/backups/`. Deux modes, dans cet ordre :

1. **`PG_DUMP_PATH` renseigné** → binaire local.
2. **Sinon** → `pg_dump` exécuté **dans le conteneur**. C'est le mode par défaut : le binaire y a nécessairement la même version que le serveur. Un `pg_dump` plus ancien que le serveur refuse de travailler — panne classique et déroutante.

Restauration :

```bash
docker exec -i netandpro_postgres \
  psql -U netandpro -d netandpro < database/backups/netandpro-<horodatage>.sql
```

---

## Scripts npm

Depuis `backend/` :

| Commande | Effet |
|---|---|
| `npm run dev` | Démarrage avec rechargement à chaud (nodemon) |
| `npm start` | Démarrage simple |
| `npm run db:migrate` | Crée et applique une migration *(développement)* |
| `npm run db:deploy` | Applique les migrations existantes *(production)* |
| `npm run db:generate` | Régénère le client Prisma |
| `npm run db:studio` | Explorateur graphique de la base |
| `npm run db:transfer` | Transfert MySQL → PostgreSQL |
| `npm run seed` | Crée les comptes d'administration |

Depuis la racine :

| Commande | Effet |
|---|---|
| `docker compose up -d` | Démarre PostgreSQL |
| `docker compose logs -f db` | Suit le journal de la base |
| `docker compose down` | Arrête *(les données survivent)* |
| `docker compose down -v` | Arrête **et efface** le volume |

---

## Structure du projet

```
NP-backendDev/
├── backend/
│   ├── config/
│   │   ├── prisma.js              client Prisma unique + adaptateur pg
│   │   └── database.js            pool MySQL — script de migration uniquement
│   ├── controllers/               10 contrôleurs
│   ├── middleware/
│   │   ├── authMiddleware.js      vérification du jeton
│   │   ├── roleMiddleware.js      requireSuperAdmin
│   │   ├── maintenanceMode.js     bascule du site public
│   │   ├── rateLimiter.js         connexion et formulaire de contact
│   │   └── validation.js
│   ├── models/                    8 modèles — accès Prisma
│   ├── routes/                    10 fichiers de routes
│   ├── services/
│   │   ├── settingsGuard.js       règles de réservation
│   │   ├── mailEvents.js          emails liés au cycle de vie
│   │   ├── mailScheduler.js       rappels et demandes d'avis
│   │   ├── audit.js               journal + filet automatique
│   │   ├── backupService.js       pg_dump, purges, statistiques
│   │   └── autoBackup.js          sauvegardes planifiées
│   ├── prisma/
│   │   ├── schema.prisma          15 modèles
│   │   ├── migrations/            migrations versionnées
│   │   └── seed.js
│   ├── scripts/
│   │   ├── check-api-docs.js      cohérence code ↔ documentation
│   │   └── migrate-mysql-to-postgres.js
│   ├── docs/
│   │   ├── openapi.yaml           spécification
│   │   └── swagger.js             montage de Swagger UI
│   ├── utils/mailer.js            transport, modèles, journal
│   ├── prisma.config.js           configuration CLI (Prisma 7)
│   └── server.js
├── database/
│   ├── backups/                   sauvegardes pg_dump
│   ├── migrations/                héritage MySQL (archive)
│   └── netandpro.sql              dump MySQL d'origine (archive)
├── docs/assets/                   ressources du README
├── uploads/branding/              logo et favicon téléversés
├── .github/workflows/             ci.yml · cd.yml
├── docker-compose.yml
└── Dockerfile
```

---

## Sécurité

| Mesure | Mise en œuvre |
|---|---|
| En-têtes HTTP | Helmet — CSP, HSTS, `X-Frame-Options`, `nosniff` |
| CORS | Origines déclarées explicitement, jamais `*` |
| Limitation de débit | 10 tentatives de connexion / 15 min · 10 messages de contact / heure |
| Mots de passe | bcrypt, coût 10 ; jamais renvoyés par l'API |
| Secrets | Masqués à la lecture ; un masque renvoyé n'écrase pas la valeur |
| Injection SQL | Écartée par construction — Prisma paramètre toutes les requêtes |
| Élévation de privilèges | Le statut d'un dossier créé publiquement provient des paramètres, jamais du corps de la requête |
| Traçabilité | Toute écriture authentifiée est journalisée avec IP et agent |
| Espace d'administration | `X-Robots-Tag: noindex, nofollow` |

**Avant toute mise en production**

- [ ] `JWT_SECRET` long et aléatoire, différent des autres environnements
- [ ] `SEED_*` renseignés, mots de passe changés à la première connexion
- [ ] `API_DOCS_USER` / `API_DOCS_PASSWORD` définis
- [ ] `CORS_ORIGIN` restreint aux domaines réels
- [ ] `NODE_ENV=production`
- [ ] Mot de passe PostgreSQL différent de la valeur de développement
- [ ] Sauvegardes automatiques activées et vérifiées

---

## Intégration et déploiement continus

Deux workflows GitHub Actions, dans [`.github/workflows/`](.github/workflows) :

| Workflow | Déclencheur | Rôle |
|---|---|---|
| [`ci.yml`](.github/workflows/ci.yml) | Pull request et push sur `main` | Installation, contrôles de qualité |
| [`cd.yml`](.github/workflows/cd.yml) | Push sur `main` | Déploiement AWS |

Le `Dockerfile` applique les migrations puis exécute le seed avant de démarrer — deux opérations idempotentes :

```dockerfile
CMD ["sh","-c","npx prisma migrate deploy && node prisma/seed.js && npm start"]
```

---

## Dépannage

**`❌ Erreur connexion PostgreSQL`**
Le conteneur est arrêté ou le port ne correspond pas.
```bash
docker compose ps          # doit afficher « healthy »
docker compose up -d
```

**`Can't reach database server`**
`DATABASE_URL` ne pointe pas sur le bon port. Le port hôte est **5434**, pas 5432.

**`prisma:error` dans la console, alors que tout fonctionne**
Prisma journalise l'erreur *avant* que le contrôleur ne la traite. Un doublon renvoyant correctement un `409` produit cette ligne. Se fier au code HTTP, pas au journal.

**`pg_dump: server version mismatch`**
Un `PG_DUMP_PATH` local plus ancien que le serveur. Retirer la variable pour repasser par le conteneur.

**`Unique constraint failed`**
Rejeu d'un identifiant existant : les séquences ne sont pas alignées. Après un import manuel, relancer `npm run db:transfer`, qui les recale.

**Le rôle n'apparaît pas dans l'interface**
Jeton émis avant l'ajout du rôle dans la charge utile. Se reconnecter.

**Les emails ne partent pas**
`GET /api/settings/verify-smtp` vérifie la connexion sans rien envoyer. Pour Gmail, un mot de passe d'application est requis, avec la validation en deux étapes activée.

---

## Ressources externes

**Cadre technique**
[Node.js](https://nodejs.org/docs/latest-v20.x/api/) · [Express 5](https://expressjs.com/en/5x/api.html) · [PostgreSQL 16](https://www.postgresql.org/docs/16/index.html) · [node-postgres](https://node-postgres.com)

**Prisma**
[Documentation](https://www.prisma.io/docs) · [Référence du schéma](https://www.prisma.io/docs/orm/reference/prisma-schema-reference) · [Référence du client](https://www.prisma.io/docs/orm/reference/prisma-client-reference) · [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate) · [Driver adapters](https://www.prisma.io/docs/orm/overview/databases/database-drivers) · [Prisma Studio](https://www.prisma.io/docs/orm/tools/prisma-studio)

**API et documentation**
[Spécification OpenAPI 3.0.3](https://spec.openapis.org/oas/v3.0.3) · [Swagger UI](https://swagger.io/tools/swagger-ui/) · [Redocly CLI](https://redocly.com/docs/cli/)

**Sécurité**
[Helmet](https://helmetjs.github.io) · [express-rate-limit](https://express-rate-limit.mintlify.app) · [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) · [OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)

**Outils**
[Nodemailer](https://nodemailer.com) · [Multer](https://github.com/expressjs/multer) · [Docker Compose](https://docs.docker.com/compose/) · [GitHub Actions](https://docs.github.com/actions)

---

## Équipe

<table>
  <tr>
    <td align="center" width="50%">
      <strong>Felix NZIKO</strong><br/>
      <sub>Développeur</sub><br/><br/>
      <a href="https://github.com/Felix-TANZI">
        <img src="https://img.shields.io/badge/GitHub-Felix--TANZI-181717?logo=github&logoColor=white" alt="GitHub" />
      </a><br/>
      <a href="https://www.linkedin.com/in/félix-tanzi">
        <img src="https://img.shields.io/badge/LinkedIn-félix--tanzi-0A66C2?logo=linkedin&logoColor=white" alt="LinkedIn" />
      </a>
    </td>
    <td align="center" width="50%">
      <strong>Ramses FOUDA</strong><br/>
      <sub>DevOps</sub><br/><br/>
      <sub>Infrastructure, CI/CD, déploiement</sub>
    </td>
  </tr>
</table>

---

## Licence

Distribué sous licence **ISC**. Projet développé pour **NetandPro Systems**, Yaoundé, Cameroun.

<div align="center">
<sub>Construit avec soin pour NetandPro Events.</sub>
</div>
