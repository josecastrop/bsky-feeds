import dotenv from 'dotenv'
import { AtpAgent, BlobRef } from '@atproto/api'
import fs from 'fs/promises'
import { ids } from '../src/lexicon/lexicons'

const run = async () => {
  dotenv.config()

  // YOUR bluesky handle
  const handle = `${process.env.FEEDGEN_HANDLE}`
  const password = `${process.env.FEEDGEN_PASSWORD}`

  console.log(`Using handle: ${handle}`)
  console.log(`Feedgen hostname: ${process.env.FEEDGEN_HOSTNAME || 'N/A'}`)

  const recordName = 'obradoiro'
  const displayName = 'Obradoiro CAB'
  const description =
    'Un feed donde encontrar información y aficionados del Obradoiro CAB. Escribe #ObradoiroCAB en tus mensajes para ser parte del feed.'
  const avatar: string = 'images/obradoiro.png'

  if (!process.env.FEEDGEN_SERVICE_DID && !process.env.FEEDGEN_HOSTNAME) {
    console.error('Missing hostname or service DID in .env file')
    throw new Error('Please provide a hostname in the .env file')
  }

  const feedGenDid =
    process.env.FEEDGEN_SERVICE_DID ?? `did:web:${process.env.FEEDGEN_HOSTNAME}`
  console.log(`Using feed generator DID: ${feedGenDid}`)

  const agent = new AtpAgent({ service: 'https://bsky.social' })

  try {
    console.log('Logging into Bluesky...')
    await agent.login({ identifier: handle, password: password })
    console.log('Login successful')
  } catch (err) {
    console.error('Login failed:', err)
    throw err
  }

  let avatarRef: BlobRef | undefined
  if (avatar) {
    try {
      console.log(`Reading avatar file: ${avatar}`)
      let encoding: string
      if (avatar.endsWith('png')) {
        encoding = 'image/png'
      } else if (avatar.endsWith('jpg') || avatar.endsWith('jpeg')) {
        encoding = 'image/jpeg'
      } else {
        throw new Error('Avatar file must be png or jpeg')
      }
      const img = await fs.readFile(avatar)
      console.log('Uploading avatar...')
      const blobRes = await agent.api.com.atproto.repo.uploadBlob(img, {
        encoding,
      })
      avatarRef = blobRes.data.blob
      console.log('Avatar uploaded successfully:', avatarRef)
    } catch (err) {
      console.error('Failed to upload avatar:', err)
      throw err
    }
  }

  try {
    console.log('Creating feed generator record...')
    const res = await agent.api.com.atproto.repo.putRecord({
      repo: agent.session?.did ?? '',
      collection: ids.AppBskyFeedGenerator,
      rkey: recordName,
      record: {
        did: feedGenDid,
        displayName: displayName,
        description: description,
        avatar: avatarRef,
        createdAt: new Date().toISOString(),
      },
    })

    console.log('Feed generator record created successfully:', res)
  } catch (err) {
    console.error('Failed to create feed generator record:', err)
    throw err
  }

  console.log('All done 🎉')
}

run()
