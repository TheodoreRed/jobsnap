import { app } from '@azure/functions'

import { okResponse } from '../utils/response'

app.http('helloWorld', {
  route: 'hello/world',
  methods: ['GET'],
  authLevel: 'function',
  handler: async (req, ctx) => {
    ctx.info('helloWorld invoked')

    return okResponse({ message: 'Hello, world!' })
  },
})
