import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, createContext } from '@/server/trpc'

const handler = (req: Request) =>
  fetchRequestHandler({ endpoint: '/api/trpc', router: appRouter, req, createContext: () => createContext() })

export { handler as GET, handler as POST }
