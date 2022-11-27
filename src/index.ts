import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Comment, findComments, insertComment } from './models'

const app = new Hono<{ Bindings: { wind_comment: KVNamespace } }>()
app.use('*', cors())
app.get('/api/v1/:articleId/comments', async c => {
  const articleId = encodeURIComponent(c.req.param('articleId'))
  return c.json(await findComments(c.env.wind_comment, articleId))
})
app.post('/api/v1/:articleId/comment', async c => {
  const articleId = encodeURIComponent(c.req.param('articleId'))
  const comment = await c.req.json<Comment>()
  const parentId = c.req.query('parentId')
  await insertComment(c.env.wind_comment, articleId, comment, parentId)
  return c.newResponse(null, 204)
})

export default app
