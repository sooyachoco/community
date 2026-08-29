export async function onRequest(context) {
  const { request, env } = context;
  if (!env.DB) return new Response(JSON.stringify({ error: 'D1 binding DB가 없습니다.' }), { status: 500, headers: { 'content-type': 'application/json' } });
  const url = new URL(request.url);
  try {
    if (request.method === 'GET') {
      const author = url.searchParams.get('author');
      let result;
      if (author === '지연' || author === '승수') {
        result = await env.DB.prepare(`SELECT p.id,p.author,p.title,p.content,p.created_at,COUNT(c.id) AS comment_count FROM posts p LEFT JOIN comments c ON c.post_id=p.id WHERE p.author=? GROUP BY p.id ORDER BY p.created_at DESC`).bind(author).all();
      } else {
        result = await env.DB.prepare(`SELECT p.id,p.author,p.title,p.content,p.created_at,COUNT(c.id) AS comment_count FROM posts p LEFT JOIN comments c ON c.post_id=p.id GROUP BY p.id ORDER BY p.created_at DESC`).all();
      }
      return json(result.results || []);
    }
    if (request.method === 'POST') {
      const body = await request.json();
      const author = String(body.author || '').trim();
      const title = String(body.title || '').trim();
      const content = String(body.content || '').trim();
      if (!['지연','승수'].includes(author) || !title || !content) return json({ error: '입력값이 올바르지 않습니다.' }, 400);
      if (title.length > 100 || content.length > 5000) return json({ error: '글이 너무 깁니다.' }, 400);
      const r = await env.DB.prepare('INSERT INTO posts (author,title,content) VALUES (?,?,?)').bind(author,title,content).run();
      return json({ id: r.meta.last_row_id }, 201);
    }
    if (request.method === 'DELETE') {
      const id = Number(url.searchParams.get('id'));
      if (!Number.isInteger(id) || id < 1) return json({ error: '잘못된 글입니다.' }, 400);
      await env.DB.prepare('DELETE FROM posts WHERE id=?').bind(id).run();
      return json({ ok: true });
    }
    return json({ error: 'Method Not Allowed' }, 405);
  } catch (e) { return json({ error: '서버 오류', detail: String(e.message || e) }, 500); }
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
