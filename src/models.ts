export interface Comment {
  id: string
  avatar: string
  name: string
  email: string
  content: string
  date: number
  subComments: Array<Comment> | null
}

export function findComments(kv: KVNamespace, articleId: string) {
  return kv.get<Array<Comment>>(articleId, 'json')
}

export async function insertComment(kv: KVNamespace, articleId: string, newComment: Comment, parentId: string) {
  newComment.id = crypto.randomUUID()
  let comments = await kv.get<Array<Comment>>(articleId, 'json')
  if (comments === null) {
    newComment.subComments = new Array()
    comments = new Array(newComment)
  } else {
    if (parentId === undefined) {
      newComment.subComments = new Array()
      const oldCommentIndex = comments.findIndex(value => value.id === newComment.id)
      if (oldCommentIndex === -1) {
        comments.push(newComment)
      } else {
        comments[oldCommentIndex] = newComment
      }
    } else {
      const subComments = comments.find(value => value.id === parentId)!.subComments!
      console.log(subComments, parentId, comments)
      const oldSubCommentIndex = subComments.findIndex(value => value.id === newComment.id)
      if (oldSubCommentIndex === -1) {
        subComments.push(newComment)
      } else {
        subComments[oldSubCommentIndex] = newComment
      }
    }
  }
  await kv.put(articleId, JSON.stringify(comments))
}
