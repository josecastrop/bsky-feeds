import { AppContext } from '../config'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import * as obradoiro from './obradoiro'


type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

const algos = {
  [obradoiro.shortname]: {
    handler: <AlgoHandler>obradoiro.handler,
    manager: obradoiro.manager,
  },
}

export default algos
