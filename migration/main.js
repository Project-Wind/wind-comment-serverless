import WorkersKVREST from '@sagi.io/workers-kv'
import { randomUUID } from 'crypto'
import sqlite3 from 'sqlite3'
import config from './config.js'

const db = new sqlite3.Database(config.databasePath)
const oldData = await readFromOld(db)
db.close()
oldData.forEach(comment =>
  comment.articleTitle = encodeURIComponent(
    `${config.urlPrefix}/${Buffer.from(comment.article_id, 'base64').toString()}/`
  )
)
const newData = new Map()
oldData
  .filter(comment => comment.parent_id === 0)
  .forEach((comment) => {
    if (!newData.has(comment.articleTitle)) {
      newData.set(comment.articleTitle, new Array())
    }
    newData.get(comment.articleTitle).push({
      id: comment.id,
      avatar: comment.avatar,
      name: comment.name,
      email: comment.email,
      content: comment.content,
      date: Date.parse(comment.date),
      subComments: new Array(),
    })
  })
oldData.filter(comment => comment.parent_id !== 0).forEach((comment) => {
  newData
    .get(comment.articleTitle)
    .find(parent => parent.id === comment.parent_id)
    .subComments.push({
      id: comment.id,
      avatar: comment.avatar,
      name: comment.name,
      email: comment.email,
      content: comment.content,
      date: Date.parse(comment.date),
      subComments: null,
    })
})
newData.forEach(comments =>
  comments.forEach(comment =>
    comment.id = randomUUID()
  )
)

const kv = new WorkersKVREST(config)
kv.put = put
const keys = (await kv.listAllKeys()).result.map(value => value.name)
newData.forEach(async (value, key) => {
  if (keys.includes(key)) {
    const comments = JSON.parse(await kv.readKey({ key: encodeURIComponent(key) }))
    await kv.put(key, JSON.stringify(comments.concat(value)),
    )
  } else {
    await kv.put(key, JSON.stringify(value))
  }
})

async function readFromOld(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all('SELECT * FROM comments', (err, rows) => {
        if (err != null) {
          reject(err)
        }
        resolve(rows)
      })
    })
  })
}

async function put(key, value) {
  const options = {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${config.cfAuthToken}`,
    },
    body: value,
  }
  await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.cfAccountId}/storage/kv/namespaces/${config.namespaceId}/values/${encodeURIComponent(key)}`, options)
}
