#!/usr/bin/env node
/**
 * Contrôle de cohérence entre la documentation et le code.
 *
 * Une spécification OpenAPI valide ne prouve rien. Le YAML reste
 * parfaitement conforme même s'il décrit des routes supprimées depuis
 * six mois, ou s'il ignore trois endpoints ajoutés la semaine dernière.
 * C'est ainsi qu'une documentation devient un mensonge : sans jamais
 * cesser d'être valide.
 *
 * Ce script compare donc deux sources :
 *
 *   - les chemins déclarés dans docs/openapi.yaml ;
 *   - les routes réellement montées par Express.
 *
 * Toute divergence, dans un sens comme dans l'autre, fait échouer la CI.
 *
 * Usage : node scripts/check-api-docs.js
 * Sortie : 0 si tout concorde, 1 sinon.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const BACKEND_DIR = path.join(__dirname, '..');
const SPEC_PATH = path.join(BACKEND_DIR, 'docs', 'openapi.yaml');
const SERVER_PATH = path.join(BACKEND_DIR, 'server.js');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

// Préfixe commun retiré de part et d'autre : les serveurs déclarés dans
// la spec incluent déjà « /api », les chemins n'en portent donc pas.
const API_PREFIX = '/api';

const problems = [];

/* ── Lecture de la spécification ──────────────────────────────────── */

function readSpec() {
    if (!fs.existsSync(SPEC_PATH)) {
        problems.push(`Fichier introuvable : ${path.relative(BACKEND_DIR, SPEC_PATH)}`);
        return null;
    }

    try {
        return yaml.load(fs.readFileSync(SPEC_PATH, 'utf8'));
    } catch (error) {
        problems.push(`openapi.yaml illisible : ${error.message}`);
        return null;
    }
}

function documentedOperations(spec) {
    const operations = new Set();

    for (const [route, item] of Object.entries(spec.paths || {})) {
        for (const method of Object.keys(item)) {
            if (HTTP_METHODS.includes(method)) {
                operations.add(`${method.toUpperCase()} ${route}`);
            }
        }
    }

    return operations;
}

/* ── Lecture des points de montage ────────────────────────────────── */

/**
 * Extrait de server.js la correspondance entre préfixe HTTP et fichier
 * de routes, en reliant `app.use('/api/x', yRoutes)` au `require`
 * correspondant.
 */
function readMounts(source) {
    const requires = {};

    const requirePattern =
        /(?:const|let|var)\s+(\w+)\s*=\s*require\(\s*['"](\.\/routes\/[\w.\-/]+)['"]\s*\)/g;

    for (const match of source.matchAll(requirePattern)) {
        requires[match[1]] = match[2];
    }

    const mounts = [];
    const usePattern = /app\.use\(\s*['"](\/api[\w\-/]*)['"]\s*,\s*(\w+)\s*\)/g;

    for (const match of source.matchAll(usePattern)) {
        const [, prefix, variable] = match;

        if (requires[variable]) {
            mounts.push({ prefix, file: requires[variable] });
        }
    }

    return mounts;
}

/**
 * Routes déclarées directement sur l'application, sans passer par un
 * routeur — typiquement /api/health.
 */
function readDirectRoutes(source) {
    const routes = [];
    const pattern = new RegExp(
        `app\\.(${HTTP_METHODS.join('|')})\\(\\s*['"](/api[\\w\\-/:]*)['"]`,
        'g'
    );

    for (const match of source.matchAll(pattern)) {
        routes.push({ method: match[1].toUpperCase(), route: match[2] });
    }

    return routes;
}

/* ── Introspection des routeurs ───────────────────────────────────── */

/**
 * Express nomme les paramètres `:id`, OpenAPI les note `{id}`.
 * On normalise vers la convention OpenAPI, et on retire le préfixe
 * commun ainsi que l'éventuelle barre oblique finale.
 */
function normalise(routePath) {
    let result = routePath.replace(/:(\w+)/g, '{$1}');

    if (result.startsWith(API_PREFIX)) {
        result = result.slice(API_PREFIX.length);
    }

    if (result.length > 1 && result.endsWith('/')) {
        result = result.slice(0, -1);
    }

    return result === '' ? '/' : result;
}

function routerOperations(mount) {
    const modulePath = path.join(BACKEND_DIR, mount.file);
    let router;

    try {
        router = require(modulePath);
    } catch (error) {
        problems.push(
            `Impossible de charger ${mount.file} : ${error.message}`
        );
        return [];
    }

    if (!router || !Array.isArray(router.stack)) {
        problems.push(
            `${mount.file} n'expose pas de routeur Express exploitable`
        );
        return [];
    }

    const operations = [];

    for (const layer of router.stack) {
        if (!layer.route) {
            continue;
        }

        const suffix = layer.route.path === '/' ? '' : layer.route.path;
        const full = normalise(`${mount.prefix}${suffix}`);

        for (const [method, enabled] of Object.entries(layer.route.methods)) {
            if (enabled && HTTP_METHODS.includes(method)) {
                operations.push(`${method.toUpperCase()} ${full}`);
            }
        }
    }

    return operations;
}

/* ── Comparaison ──────────────────────────────────────────────────── */

function compare(documented, implemented) {
    const missing = [...implemented].filter((op) => !documented.has(op)).sort();
    const obsolete = [...documented].filter((op) => !implemented.has(op)).sort();

    return { missing, obsolete };
}

function report(documented, implemented, missing, obsolete) {
    console.log('Cohérence documentation / code\n');
    console.log(`  Opérations documentées : ${documented.size}`);
    console.log(`  Opérations montées     : ${implemented.size}`);

    if (missing.length > 0) {
        console.log('\n Routes présentes dans le code, absentes de la documentation :');
        missing.forEach((op) => console.log(`     ${op}`));
    }

    if (obsolete.length > 0) {
        console.log('\n Routes documentées qui n\'existent plus dans le code :');
        obsolete.forEach((op) => console.log(`     ${op}`));
    }

    if (problems.length > 0) {
        console.log('\n Problèmes rencontrés :');
        problems.forEach((p) => console.log(`     ${p}`));
    }
}

function main() {
    const spec = readSpec();

    if (!spec) {
        problems.forEach((p) => console.error(` ${p}`));
        return 1;
    }

    if (!fs.existsSync(SERVER_PATH)) {
        console.error(' server.js introuvable');
        return 1;
    }

    const source = fs.readFileSync(SERVER_PATH, 'utf8');
    const mounts = readMounts(source);

    if (mounts.length === 0) {
        console.error(
            ' Aucun point de montage détecté dans server.js. ' +
            'Le motif attendu est : app.use(\'/api/xxx\', xxxRoutes)'
        );
        return 1;
    }

    const implemented = new Set();

    for (const { method, route } of readDirectRoutes(source)) {
        implemented.add(`${method} ${normalise(route)}`);
    }

    for (const mount of mounts) {
        routerOperations(mount).forEach((op) => implemented.add(op));
    }

    const documented = documentedOperations(spec);
    const { missing, obsolete } = compare(documented, implemented);

    report(documented, implemented, missing, obsolete);

    if (missing.length || obsolete.length || problems.length) {
        console.log(
            '\nLa documentation ne reflète plus le code. ' +
            'Mettez à jour docs/openapi.yaml.'
        );
        return 1;
    }

    console.log('\n Chaque route montée est documentée, et réciproquement.');
    return 0;
}

const code = main();

// Charger les routeurs ouvre le pool MySQL, qui maintient le processus
// en vie. Sortie explicite pour éviter que la CI ne reste suspendue.
process.exit(code);