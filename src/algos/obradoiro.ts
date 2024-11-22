import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'
import { AlgoManager } from '../addn/algoManager'
import dotenv from 'dotenv'
import { Post } from '../db/schema'
import dbClient from '../db/dbClient'

dotenv.config()

// max 15 chars
export const shortname = 'obradoiro'

export const handler = async (ctx: AppContext, params: QueryParams) => {
  console.log('Handler invoked with params:', params)

  const builder = await dbClient.getLatestPostsForTag({
    tag: shortname,
    limit: params.limit,
    cursor: params.cursor,
  })

  console.log('Posts retrieved from dbClient:', builder)

  let feed = builder.map((row) => ({
    post: row.uri,
  }))

  console.log('Generated feed:', feed)

  let cursor: string | undefined
  const last = builder.at(-1)
  if (last) {
    cursor = `${new Date(last.indexedAt).getTime()}::${last.cid}`
    console.log('Generated cursor:', cursor)
  }

  return {
    cursor,
    feed,
  }
}

export class manager extends AlgoManager {
  public name: string = shortname

  public matchTerms: string[] = [
    '#obradoirocab',
    '#somosobra',
    'obradoiro cab',
    'moncho fernandez',
    'brad davison',
    'jake stephens',
    'sergi quintela',
    'oliver stevic',
    'tomeu rigo',
    'fontes do sar',
    'millan jimenez',
    'toms leimanis',
    'alex galán',
    'strahinja micovic',
    'nacho varela',
    'nacho arroyo',
    'alvaro muñoz',
    'primera feb',
  ]

  public re = new RegExp(
    `^(?!.*((plaza|praza) obradoiro?)).*(#?${this.matchTerms.join('|#?')})(es|s)?.*$`,
    'ims',
  );

  public async periodicTask() {
    console.log('Running periodicTask...')
    await this.db.removeTagFromOldPosts(
      this.name,
      new Date().getTime() - 7 * 24 * 60 * 60 * 1000,
    )
    console.log('Completed periodicTask for:', this.name)
  }

  public async filter_post(post: Post): Promise<Boolean> {
    console.log('Filtering post:', post)

    if (post.replyRoot !== null) {
      console.log('Post is a reply, skipping:', post.replyRoot)
      return false
    }
    if (this.agent === null) {
      console.log('Agent is null, starting...')
      await this.start()
    }
    if (this.agent === null) {
      console.log('Agent could not start, skipping post')
      return false
    }

    let match = false
    let matchString = ''

    if (post.embed?.images) {
      const imagesArr = post.embed.images
      imagesArr.forEach((image) => {
        matchString = `${matchString} ${image.alt}`.replace('\n', ' ')
      })
      console.log('Processed image alt text:', matchString)
    }

    if (post.embed?.alt) {
      matchString = `${matchString} ${post.embed.alt}`.replace('\n', ' ')
      console.log('Processed embed alt text:', matchString)
    }

    if (post.embed?.media?.alt) {
      matchString = `${matchString} ${post.embed?.media?.alt}`.replace(
        '\n',
        ' ',
      )
      console.log('Processed media alt text:', matchString)
    }

    matchString = `${post.text} ${matchString}`.replace('\n', ' ')
    console.log('Final match string:', matchString)

    if (matchString.match(this.re) !== null) {
      match = true
      console.log('Post matches the regex')
    } else {
      console.log('Post does not match the regex')
    }

    return match
  }
}
