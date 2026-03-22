/**
 * Cloudflare Worker - Serves articles from GitHub raw content
 * Point your tRPC API URL to this worker
 */

const GITHUB_RAW = 'https://raw.githubusercontent.com/KevPH2026/superk-cms/main';
const ARTICLES_URL = `${GITHUB_RAW}/articles.json`;

const HTML = `<!doctype html>
<html>
<head><meta charset="UTF-8"/><title>Articles API</title></head>
<body><pre id="data"></pre>
<script>
fetch('/articles.json')
  .then(r=>r.json())
  .then(d=>document.getElementById('data').textContent=JSON.stringify(d,null,2))
</script>
</body>
</html>`;

async function fetchArticles() {
  const res = await fetch(ARTICLES_URL, {
    headers: { 'Cache-Control': 'no-cache' }
  });
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`);
  return res.json();
}

async function handleRequest(request) {
  const url = new URL(request.url);

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  // Root - serve simple HTML
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // GET /articles.json → raw articles list
  if (url.pathname === '/articles.json' || url.pathname === '/api/articles') {
    try {
      const articles = await fetchArticles();
      return new Response(JSON.stringify(articles), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60',
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // GET /api/trpc/posts.list → tRPC-compatible response
  if (url.pathname === '/api/trpc/posts.list') {
    try {
      const articles = await fetchArticles();
      // Return tRPC JSON response format
      const trpcResponse = {
        result: {
          data: {
            json: articles,
            meta: {
              values: {
                // tell tRPC about date fields
              }
            }
          }
        }
      };
      return new Response(JSON.stringify(trpcResponse), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // GET /api/trpc/posts.bySlug?input=... → single article
  if (url.pathname === '/api/trpc/posts.bySlug') {
    try {
      const articles = await fetchArticles();
      const slug = url.searchParams.get('input');
      // input might be JSON: {"slug":"..."}
      let targetSlug = slug;
      try { targetSlug = JSON.parse(slug).slug; } catch {}
      const article = articles.find(a => a.slug === targetSlug);
      if (!article) {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ result: { data: { json: article } } }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Not found', { status: 404 });
}

export default {
  fetch: async (request, env, ctx) => {
    try {
      return await handleRequest(request);
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
