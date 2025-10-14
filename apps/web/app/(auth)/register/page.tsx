"use client"
import { signIn } from 'next-auth/react'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const params = useSearchParams()
  const fromPlan = (params.get('plan') as 'free'|'starter'|'pro'|'enterprise'|null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<'free'|'starter'|'pro'|'enterprise'>(fromPlan || 'free')
  useEffect(()=> { if (fromPlan) setPlan(fromPlan) }, [fromPlan])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, plan }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Registration failed')
      const callbackUrl = plan === 'free' ? '/sites' : `/settings/billing?select=${plan}&autocheckout=1`
      await signIn('credentials', { email, password, callbackUrl })
    } catch (e: any) {
      setError(e?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="border rounded p-6 w-full max-w-sm space-y-4 bg-white">
        <h1 className="text-xl font-semibold">Create your account</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="grid gap-2">
          <label className="text-sm">Email</label>
          <input className="border rounded px-3 py-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Password</label>
          <input className="border rounded px-3 py-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Choose your plan</label>
          <select className="border rounded px-3 py-2" value={plan} onChange={e=> setPlan(e.target.value as any)}>
            <option value="free">Free — Limited features</option>
            <option value="starter">Starter — $19/mo</option>
            <option value="pro">Pro — $79/mo</option>
            <option value="enterprise">Enterprise — $79/mo (was $199)</option>
          </select>
          <p className="text-xs text-gray-500">Pick Free to start on the free plan, or choose a paid plan. If you choose a paid plan, we’ll take you to Billing to subscribe (7‑day trial included).</p>
        </div>
        <button disabled={loading} className="bg-black text-white w-full py-2 rounded disabled:opacity-50">{loading ? 'Creating…' : 'Create account'}</button>
        <p className="text-xs text-gray-500">Includes a 7-day free trial with usage limits.</p>
      </form>
    </div>
  )
}
