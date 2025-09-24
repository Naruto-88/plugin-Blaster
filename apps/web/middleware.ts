export { default } from 'next-auth/middleware'

// Protect only app pages; leave custom API routes (like /api/debug) unguarded
export const config = {
  matcher: ['/sites/:path*', '/settings/:path*'],
}
