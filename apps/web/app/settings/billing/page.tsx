"use client"
import { Suspense, useEffect, useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc'
import { useSearchParams } from 'next/navigation'

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingInner />
    </Suspense>
  )
}

function BillingInner() {
  const { data: account } = trpc.accounts.me.useQuery()
  const params = useSearchParams()
  const selected = (params.get('select') as 'starter'|'pro'|'enterprise'|null)
  const [plan, setPlan] = useState<'starter'|'pro'|'enterprise'>(selected || 'starter')
  useEffect(() => { if (selected) setPlan(selected) }, [selected])
  const [loading, setLoading] = useState(false)
  const auto = params.get('autocheckout') === '1'
  const startCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/paypal/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ plan }) })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        alert(json.error || 'Failed to start checkout')
      }
    } catch (e:any) {
      alert(e?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (auto) {
      startCheckout()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto])

  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold">Billing</h1>
        {account && (
          <div className="text-sm text-gray-700">
            <div>
              Current plan: <b className="capitalize">{String(account.plan)}</b>
              {account.plan === 'trial' && account.trialEndsAt && (
                <span className="ml-2 text-blue-800 bg-blue-100 px-2 py-0.5 rounded text-xs">
                  Trial ends {new Date(account.trialEndsAt as any).toLocaleDateString()}
                </span>
              )}
            </div>
            {account.paypalSubscriptionId && (
              <div className="mt-2 flex items-center gap-2">
                <span>Subscription ID: <code>{account.paypalSubscriptionId}</code></span>
                <button className="border rounded px-2 py-0.5" onClick={async ()=> {
                  if (!confirm('Cancel your subscription?')) return
                  const res = await fetch('/api/billing/paypal/cancel', { method: 'POST' })
                  const json = await res.json()
                  if (!res.ok) alert(json.error || 'Cancel failed');
                  else location.reload()
                }}>Cancel Subscription</button>
              </div>
            )}
          </div>
        )}
        {selected && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded p-3 text-sm">Selected plan: <b>{selected}</b>. Click Subscribe to activate after trial.</div>
        )}
        <div className="grid gap-3">
          <label className="flex items-center gap-2">Plan
            <select className="border rounded px-2 py-1 bg-white text-gray-900" value={plan} onChange={e=> setPlan(e.target.value as any)}>
              <option value="starter">Starter — $5/mo (was $19)</option>
              <option value="pro">Pro — $25/mo (was $79)</option>
              <option value="enterprise">Enterprise — $79/mo (was $199)</option>
            </select>
          </label>
          <div className="flex gap-3">
            <button disabled={loading} onClick={startCheckout} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">Subscribe with PayPal</button>
            <ManualPayment />
          </div>
        </div>
      </div>
    </div>
  )
}

function ManualPayment() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState<'starter'|'pro'|'enterprise'>('starter')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/manual/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, plan, notes }) })
      const json = await res.json()
      if (!res.ok) alert(json.error || 'Failed'); else { alert('Submitted. We will verify and activate shortly.'); setOpen(false) }
    } finally { setLoading(false) }
  }
  const paypalEmail = process.env.NEXT_PUBLIC_PAYPAL_RECEIVE_EMAIL || process.env.PAYPAL_RECEIVE_EMAIL
  const receiptEmail = process.env.NEXT_PUBLIC_RECEIPTS_EMAIL || process.env.RECEIPTS_EMAIL
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text) } catch {} }
  return (
    <>
      <button className="border rounded px-4 py-2" onClick={()=> setOpen(true)}>Manual Payment</button>
      {open && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
          <div className="bg-white text-gray-900 rounded-lg shadow-lg w-full max-w-sm p-4">
            <div className="text-lg font-semibold mb-2">Manual Payment</div>
            <div className="grid gap-2 text-sm">
              <div className="p-2 rounded bg-zinc-50 border">
                <div>Send your payment to our PayPal email:</div>
                <div className="mt-1 font-medium">{paypalEmail || 'your-paypal@example.com'}</div>
                <div className="mt-1 flex gap-2">
                  <a className="underline" target="_blank" rel="noreferrer" href={paypalEmail ? `mailto:${paypalEmail}` : '#'}>Open mail</a>
                  <button className="underline" onClick={()=> copy(paypalEmail || '')}>Copy</button>
                </div>
                <div className="mt-2">After you pay, send the receipt to:</div>
                <div className="font-medium">{receiptEmail || 'owner@example.com'}</div>
                <div className="mt-1 flex gap-2">
                  <a className="underline" target="_blank" rel="noreferrer" href={receiptEmail ? `mailto:${receiptEmail}` : '#'}>Email receipt</a>
                  <button className="underline" onClick={()=> copy(receiptEmail || '')}>Copy</button>
                </div>
              </div>
              <div className="h-px bg-zinc-200 my-2" />
              <label className="text-sm">Your email</label>
              <input className="border rounded px-2 py-1" value={email} onChange={e=> setEmail(e.target.value)} />
              <label className="text-sm">Plan</label>
              <select className="border rounded px-2 py-1" value={plan} onChange={e=> setPlan(e.target.value as any)}>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <label className="text-sm">Notes (transaction ID, receipt link)</label>
              <textarea className="border rounded px-2 py-1" rows={4} value={notes} onChange={e=> setNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="border rounded px-3 py-1" onClick={()=> setOpen(false)}>Cancel</button>
              <button disabled={loading} className="bg-black text-white rounded px-3 py-1 disabled:opacity-50" onClick={submit}>{loading ? 'Submitting…' : 'Submit'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
