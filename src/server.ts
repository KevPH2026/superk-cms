import express from "express";
import payload from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { Users } from "./collections/Users";
import { Posts } from "./collections/Posts";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Redirect root to admin
app.get("/", (_, res) => {
  res.redirect("/admin");
});

async function start() {
  // Initialize Payload
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || "superk-cms-dev-secret-change-me",
    email: {
      fromName: "Superk CMS",
      fromAddress: "noreply@superk.ai",
    },
    db: sqliteAdapter({
      client: {
        // Local SQLite file — zero config, zero cost
        url: "file:payload.db",
      },
    }),
    collections: [Users, Posts],
    admin: {
      user: Users.slug,
      meta: {
        title: "Superk CMS",
        description: "Blog CMS for superk.ai",
      },
    },
  });

  // Mount the Payload REST API
  app.use("/api", payload.rest);

  // Mount Payload's admin
  app.use(payload.admin);

  const port = process.env.PORT || 3001;
  app.listen(port, async () => {
    console.log(`
🚀 Superk CMS running at http://localhost:${port}/admin

📝 Admin panel: http://localhost:${port}/admin
🔌 API endpoint: http://localhost:${port}/api/posts
    `);
  });
}

start().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
