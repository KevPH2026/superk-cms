import express from "express";
import { getDb } from "./db.js";
import slugify from "slugify";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static("public"));

// ─── REST API ───────────────────────────────────────────────

// List all posts (public - for superk.ai to fetch)
app.get("/api/posts", (req, res) => {
  const db = getDb();
  const { status, category } = req.query;
  
  let query = "SELECT * FROM posts";
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY published_at DESC, created_at DESC";

  const posts = db.prepare(query).all(...params);
  res.json(posts);
});

// Get single post
app.get("/api/posts/:slug", (req, res) => {
  const db = getDb();
  const post = db.prepare("SELECT * FROM posts WHERE slug = ?").get(req.params.slug);
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
});

// Create post
app.post("/api/posts", (req, res) => {
  const db = getDb();
  const { title, title_zh, slug, excerpt, content, content_zh, status, category, tags } = req.body;

  if (!title) return res.status(400).json({ error: "Title is required" });

  const finalSlug = slug || slugify(title, { lower: true, strict: true });
  const publishedAt = status === "published" ? new Date().toISOString() : null;

  try {
    const result = db.prepare(`
      INSERT INTO posts (title, title_zh, slug, excerpt, content, content_zh, status, category, tags, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, title_zh || "", finalSlug, excerpt || "", content || "", content_zh || "", status || "draft", category || "", tags || "", publishedAt);

    const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(post);
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      res.status(409).json({ error: "Slug already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update post
app.put("/api/posts/:id", (req, res) => {
  const db = getDb();
  const { title, title_zh, slug, excerpt, content, content_zh, status, category, tags } = req.body;
  const { id } = req.params;

  const existing = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Post not found" });

  const finalSlug = slug || existing.slug;
  const publishedAt = status === "published" && existing.status !== "published"
    ? new Date().toISOString()
    : existing.published_at;

  try {
    db.prepare(`
      UPDATE posts SET
        title = ?, title_zh = ?, slug = ?, excerpt = ?,
        content = ?, content_zh = ?, status = ?, category = ?, tags = ?,
        published_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(title, title_zh, finalSlug, excerpt, content, content_zh, status, category, tags, publishedAt, id);

    const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete post
app.delete("/api/posts/:id", (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// ─── Admin Auth (simple session) ────────────────────────────
const ADMIN_SESSION = { username: "admin", password: "superk2026" };

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_SESSION.username && password === ADMIN_SESSION.password) {
    res.json({ success: true, token: "superk-cms-token-123" });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// ─── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
🚀 Superk CMS running at http://localhost:${PORT}

📝 Admin panel: http://localhost:${PORT}/admin
📡 API base:    http://localhost:${PORT}/api
  `);
});
