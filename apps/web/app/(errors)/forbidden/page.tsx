export const metadata = { title: 'Forbidden · WP Update Monitor' }

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="card p-10 text-center space-y-2">
        <div className="text-2xl font-semibold">403 – Forbidden</div>
        <div className="text-sm text-zinc-500">You don’t have permission to access this page.</div>
      </div>
    </div>
  )
}

