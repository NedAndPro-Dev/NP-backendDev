const fs = require("fs");
const mysql = require("mysql2/promise");
const { spawn } = require("child_process");

async function waitDatabase() {

    while (true) {

        try {

            const connection = await mysql.createConnection({
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                ssl: false
            });

            console.log("✅ MySQL connecté");

            return connection;

        } catch (err) {

            console.log("⏳ Attente MySQL...");

            await new Promise(r => setTimeout(r,5000));

        }

    }

}

(async()=>{

    const connection = await waitDatabase();

    const [rows] = await connection.query(

        "SHOW TABLES LIKE 'testimonials'"

    );

    if(rows.length===0){

        console.log("📦 Import SQL...");

        const sql = fs.readFileSync(
            "/app/database/netandpro.sql",
            "utf8"
        );

        const statements = sql
            .split(/;\s*\n/)
            .map(s=>s.trim())
            .filter(Boolean);

        for(const statement of statements){

            await connection.query(statement);

        }

        console.log("✅ Import terminé");

    }else{

        console.log("✅ Base déjà initialisée");

    }

    await connection.end();

    console.log("🚀 Démarrage API");

    spawn("node",["server.js"],{

        cwd:"/app",

        stdio:"inherit"

    });

})();