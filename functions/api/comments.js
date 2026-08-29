export async function onRequest(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: 'D1 binding DB가 없습니다.' }, 500);
  const url = new URL(request.url);
  try {
    if (request.method === 'GET') {
      const postId = Number(url.searchParams.get('post_id'));
      if (!Number.isInteger(postId) || postId < 1) return json({ error: 'post_id가 필요합니다.' }, 400);
      const r = await env.DB.prepare('SELECT id,post_id,author,content,created_at FROM comments WHERE post_id=? ORDER BY created_at ASC').bind(postId).all();
      return json(r.results || []);
    }
    if (request.method === 'POST') {
      const body = await request.json();
      const postId = Number(body.post_id);
      const author = String(body.author || '').trim();
      const content = String(body.content || '').trim();
      if (!Number.isInteger(postId) || postId < 1 || !['지연','승수'].includes(author) || !content) return json({ error: '입력값이 올바르지 않습니다.' }, 400);
      if (content.length > 1000) return json({ error: '댓글이 너무 깁니다.' }, 400);
      const exists = await env.DB.prepare('SELECT id FROM posts WHERE id=?').bind(postId).first();
      if (!exists) return json({ error: '글이 없습니다.' }, 404);
      const r = await env.DB.prepare('INSERT INTO comments (post_id,author,content) VALUES (?,?,?)').bind(postId,author,content).run();
      return json({ id: r.meta.last_row_id }, 201);
    }
    if (request.method === 'DELETE') {
      const id = Number(url.searchParams.get('id'));
      if (!Number.isInteger(id) || id < 1) return json({ error: '잘못된 댓글입니다.' }, 400);
      await env.DB.prepare('DELETE FROM comments WHERE id=?').bind(id).run();
      return json({ ok: true });
    }
    return json({ error: 'Method Not Allowed' }, 405);
  } catch (e) { return json({ error: '서버 오류', detail: String(e.message || e) }, 500); }
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
