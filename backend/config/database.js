const mysql = require("mysql2/promise");

const useSSL = process.env.DB_SSL === "true";

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then((connection) => {
        console.log("✅ Connexion MySQL réussie");
        connection.release();
    })
    .catch((err) => {
        console.error("❌ Erreur connexion MySQL:", err.message);
    });

module.exports = pool;