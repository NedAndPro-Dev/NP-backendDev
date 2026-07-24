/**
 * Documentation OpenAPI — NetandPro Events
 * ════════════════════════════════════════════════════════════════════
 *
 * La documentation d'une API décrit ses opérations d'administration, ses
 * schémas et ses règles de validation. C'est un outil de travail, et
 * accessoirement une carte offerte à qui voudrait l'attaquer. Ce module
 * est donc conçu pour échouer du côté fermé.
 *
 * Comportement par environnement
 * ──────────────────────────────
 *
 *   development  ouverte, exécution active, tous les serveurs listés
 *   staging      Basic Auth obligatoire, exécution active, staging seul
 *   production   Basic Auth obligatoire, exécution DÉSACTIVÉE, prod seule
 *
 * Trois principes appliqués :
 *
 *   1. Échec fermé. Hors développement, si les identifiants Basic Auth
 *      manquent, la documentation n'est pas montée du tout. Une doc
 *      absente vaut mieux qu'une doc ouverte.
 *
 *   2. Pas d'exécution en production. `supportedSubmitMethods: []`
 *      retire la possibilité d'émettre des requêtes, pour toutes les
 *      méthodes. Sans cela, la page serait une console d'administration
 *      branchée sur les données réelles.
 *
 *   3. Un déploiement ne montre que son propre serveur. Le sélecteur de
 *      staging ne doit pas proposer la production : le « Try it out » y
 *      étant actif, la confusion aurait des conséquences réelles.
 *
 * Variables d'environnement
 * ─────────────────────────
 *
 *   NODE_ENV            development | staging | production
 *   ENABLE_API_DOCS     'true' | 'false'  (défaut : true si development)
 *   API_DOCS_PATH       chemin de montage (défaut : /api/docs)
 *   API_DOCS_USER       identifiant Basic Auth
 *   API_DOCS_PASSWORD   mot de passe Basic Auth
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');
const rateLimit = require('express-rate-limit');

const SPEC_PATH = path.join(__dirname, 'openapi.yaml');
const THEME_DIR = path.join(__dirname, 'theme');
const ASSETS_DIR = path.join(__dirname, 'assets');

const ENVIRONMENTS = {
    development: { label: 'LOCAL', color: '#10b981', allowExecution: true, requireAuth: false },
    staging: { label: 'STAGING', color: '#f59e0b', allowExecution: true, requireAuth: true },
    production: { label: 'PRODUCTION', color: '#ef4444', allowExecution: false, requireAuth: true }
};

const UNKNOWN_ENV = {
    label: 'INCONNU',
    color: '#94a3b8',
    allowExecution: false,
    requireAuth: true
};

/**
 * Un NODE_ENV non reconnu est traité comme le cas le plus restrictif :
 * authentification exigée, exécution coupée. Une faute de frappe dans la
 * définition de tâche ECS ne doit pas ouvrir la documentation.
 */
function currentEnvironment() {
    const name = process.env.NODE_ENV || 'unknown';
    return { name, ...(ENVIRONMENTS[name] || UNKNOWN_ENV) };
}

function docsEnabled(env) {
    const flag = process.env.ENABLE_API_DOCS;

    if (flag !== undefined) {
        return flag.toLowerCase() === 'true';
    }

    return env.name === 'development';
}

/**
 * Comparaison à temps constant.
 *
 * Une comparaison naïve s'arrête au premier caractère différent : le
 * temps de réponse trahit alors le nombre de caractères corrects, ce qui
 * permet de reconstituer le secret octet par octet. On hache d'abord
 * pour travailler sur des longueurs égales — `timingSafeEqual` exige des
 * tampons de même taille et lèverait sinon une exception révélant la
 * longueur attendue.
 */
function safeEqual(a, b) {
    const ha = crypto.createHash('sha256').update(String(a)).digest();
    const hb = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
}

function requestAuthentication(res) {
    res.set('WWW-Authenticate', 'Basic realm="NetandPro API docs", charset="UTF-8"');
    return res.status(401).json({
        success: false,
        message: 'Authentification requise'
    });
}

function basicAuthGuard(req, res, next) {
    const user = process.env.API_DOCS_USER;
    const password = process.env.API_DOCS_PASSWORD;

    if (!user || !password) {
        return next();
    }

    const header = req.headers.authorization || '';

    if (!header.startsWith('Basic ')) {
        return requestAuthentication(res);
    }

    let decoded;

    try {
        decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    } catch {
        return requestAuthentication(res);
    }

    const separator = decoded.indexOf(':');

    if (separator === -1) {
        return requestAuthentication(res);
    }

    const providedUser = decoded.slice(0, separator);
    const providedPassword = decoded.slice(separator + 1);

    // Les deux comparaisons sont évaluées systématiquement : un court-circuit
    // sur l'identifiant rendrait le temps de réponse dépendant de sa validité.
    const userOk = safeEqual(providedUser, user);
    const passwordOk = safeEqual(providedPassword, password);

    if (!userOk || !passwordOk) {
        return requestAuthentication(res);
    }

    return next();
}

/**
 * Limitation contre le forçage brut des identifiants Basic Auth.
 *
 * Dépend de `app.set('trust proxy', 1)` pour compter par visiteur réel
 * derrière l'ALB, sans quoi toutes les requêtes partagent le compteur de
 * l'équilibreur.
 */
const docsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Trop de requêtes vers la documentation. Réessayez plus tard.'
    }
});

function securityHeaders(req, res, next) {
    // helmet bloquerait les styles et scripts en ligne de Swagger UI ainsi
    // que les polices Google. On assouplit sur cette route uniquement,
    // jamais sur la politique globale de l'application.
    res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "object-src 'none'",
        "img-src 'self' data:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "script-src 'self' 'unsafe-inline'",
        "connect-src 'self'"
    ].join('; '));

    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
}

function environmentBadgeCss(env) {
    return `
        .swagger-ui .topbar .topbar-wrapper::after {
            content: '${env.label}';
            margin-left: auto;
            padding: 0.3rem 0.8rem;
            border-radius: 999px;
            font-family: 'JetBrains Mono', Consolas, monospace;
            font-size: 0.68rem;
            font-weight: 600;
            letter-spacing: 1px;
            color: ${env.color};
            background: ${env.color}1f;
            border: 1px solid ${env.color}59;
        }
    `;
}

/**
 * Ne conserve que les serveurs correspondant à l'environnement courant.
 * En développement, tous restent disponibles.
 */
function filterServers(spec, env) {
    if (env.name === 'development' || !Array.isArray(spec.servers)) {
        return spec;
    }

    const matching = spec.servers.filter((s) => s['x-environment'] === env.name);

    return {
        ...spec,
        servers: matching.length > 0 ? matching : spec.servers
    };
}

function loadSpec() {
    const spec = yaml.load(fs.readFileSync(SPEC_PATH, 'utf8'));

    if (!spec || !spec.openapi || !spec.paths) {
        throw new Error('openapi.yaml invalide : champ "openapi" ou "paths" manquant');
    }

    return spec;
}

/**
 * Monte la documentation. Ne fait rien si l'environnement l'interdit.
 *
 * @param {import('express').Application} app
 */
function mountApiDocs(app) {
    const env = currentEnvironment();
    const docsPath = process.env.API_DOCS_PATH || '/api/docs';

    if (!docsEnabled(env)) {
        console.log(`📕 Documentation API désactivée (NODE_ENV=${env.name})`);
        return;
    }

    const hasCredentials = Boolean(process.env.API_DOCS_USER && process.env.API_DOCS_PASSWORD);

    if (env.requireAuth && !hasCredentials) {
        console.error(
            `❌ Documentation API NON montée : NODE_ENV=${env.name} exige ` +
            'API_DOCS_USER et API_DOCS_PASSWORD. Définissez-les, ou posez ' +
            'ENABLE_API_DOCS=false pour assumer la désactivation.'
        );
        return;
    }

    let spec;

    try {
        spec = filterServers(loadSpec(), env);
    } catch (error) {
        console.error('❌ Documentation API non montée :', error.message);
        return;
    }

    const router = express.Router();

    router.use(securityHeaders);
    router.use(docsLimiter);
    router.use(basicAuthGuard);

    // Ressources statiques, déclarées avant swaggerUi.serve qui capte la
    // racine du routeur.
    router.use('/theme', express.static(THEME_DIR, { maxAge: '1h' }));
    router.use('/assets', express.static(ASSETS_DIR, { maxAge: '1d' }));

    router.get('/openapi.json', (req, res) => {
        res.setHeader('Cache-Control', 'no-store');
        res.json(spec);
    });

    router.use(
        '/',
        swaggerUi.serve,
        swaggerUi.setup(spec, {
            customSiteTitle: 'NetandPro Events — Documentation API',
            customfavIcon: `${docsPath}/assets/logo.png`,
            customCssUrl: `${docsPath}/theme/swagger-theme.css`,
            customCss: environmentBadgeCss(env),
            swaggerOptions: {
                // Liste vide : « Try it out » disparaît pour toutes les
                // méthodes. C'est le véritable interrupteur, tryItOutEnabled
                // ne faisant que régler l'état initial du bouton.
                supportedSubmitMethods: env.allowExecution
                    ? ['get', 'post', 'put', 'patch', 'delete']
                    : [],
                tryItOutEnabled: env.allowExecution,
                // Le jeton n'est conservé que là où il sert à exécuter.
                persistAuthorization: env.allowExecution,
                displayRequestDuration: true,
                docExpansion: 'none',
                filter: true,
                defaultModelsExpandDepth: 1
            }
        })
    );

    app.use(docsPath, router);

    const details = [
        `env=${env.name}`,
        hasCredentials ? 'Basic Auth' : 'sans authentification',
        env.allowExecution ? 'exécution active' : 'exécution désactivée',
        `${spec.servers.length} serveur(s)`
    ].join(' · ');

    console.log(`📘 Documentation API : ${docsPath} — ${details}`);
}

module.exports = { mountApiDocs };