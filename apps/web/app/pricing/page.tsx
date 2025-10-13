import React from 'react'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/server/auth'

export default async function PricingPage() {
  const session = await getServerSession(authOptions)
  const loggedIn = !!session
  return (
    <main className="p-8">
      <section className="mx-auto max-w-5xl text-center">
        <h1 className="text-4xl font-bold mb-2">Pricing</h1>
        <p className="text-gray-600 mb-8">Start free. Upgrade any time. 7-day trial on paid plans.</p>
        <div className="grid md:grid-cols-4 gap-6">
          <Plan
            title="Free"
            price="$0"
            cta={loggedIn ? 'Use Free' : 'Get Started'}
            href={loggedIn ? '/sites' : '/register?plan=free'}
            features={['Up to 3 sites', '50 checks/day', '14-day history', '2 seats']}
          />
          <Plan
            title="Starter"
            price={
              <span>
                <span className="line-through text-zinc-400 mr-1">$19</span>
                <span className="font-bold">$5</span>
                <span>/mo</span>
                <span className="ml-2 text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded whitespace-nowrap inline-block">Limited-time</span>
              </span>
            }
            cta={loggedIn ? 'Subscribe Now' : 'Start Trial'}
            href={loggedIn ? '/settings/billing?select=starter&autocheckout=1' : '/register?plan=starter'}
            features={['Up to 10 sites', '500 checks/day', '90-day history', '5 seats']}
            highlight
          />
          <Plan
            title="Pro"
            price={
              <span>
                <span className="line-through text-zinc-400 mr-1">$79</span>
                <span className="font-bold">$25</span>
                <span>/mo</span>
                <span className="ml-2 text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded whitespace-nowrap inline-block">Limited-time</span>
              </span>
            }
            cta={loggedIn ? 'Subscribe Now' : 'Start Trial'}
            href={loggedIn ? '/settings/billing?select=pro&autocheckout=1' : '/register?plan=pro'}
            features={['Up to 50 sites', '2,000 checks/day', '180-day history', '15 seats']}
          />
          <Plan
            title="Enterprise"
            price={
              <span>
                <span className="line-through text-zinc-400 mr-1">$199</span>
                <span className="font-bold">$79</span>
                <span>/mo</span>
                <span className="ml-2 text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded whitespace-nowrap inline-block">Limited-time</span>
              </span>
            }
            cta={loggedIn ? 'Subscribe Now' : 'Start Trial'}
            href={loggedIn ? '/settings/billing?select=enterprise&autocheckout=1' : '/register?plan=enterprise'}
            features={['Unlimited sites', '10,000 checks/day', '1-year history', 'SSO & SLA']}
          />
        </div>
      </section>

      <section className="mx-auto max-w-4xl mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-center">Compare features</h2>
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 border text-left">Feature</th>
                <th className="p-2 border">Free</th>
                <th className="p-2 border">Starter</th>
                <th className="p-2 border">Pro</th>
                <th className="p-2 border">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Sites', '3', '10', '50', 'Unlimited'],
                ['Checks/day', '50', '500', '2,000', '10,000'],
                ['History', '14 days', '90 days', '180 days', '365 days'],
                ['Seats', '2', '5', '15', '100'],
                ['Support', 'Community', 'Standard', 'Priority', 'Dedicated'],
              ].map((row) => (
                <tr key={row[0]}>
                  <td className="p-2 border text-left">{row[0]}</td>
                  <td className="p-2 border text-center">{row[1]}</td>
                  <td className="p-2 border text-center">{row[2]}</td>
                  <td className="p-2 border text-center">{row[3]}</td>
                  <td className="p-2 border text-center">{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-3xl mt-12">
        <h2 className="text-2xl font-semibold mb-4 text-center">FAQs</h2>
        <div className="space-y-4">
          <Faq q="Do paid plans include a free trial?" a="Yes. Starter and Pro include a 7-day free trial. You can cancel any time." />
          <Faq q="Can I switch plans later?" a="Absolutely. Upgrade or downgrade at any time; limits adjust immediately." />
          <Faq q="What happens after the trial?" a="Your account remains active. Subscribe to continue paid features; otherwise you can switch to the Free plan." />
        </div>
      </section>
    </main>
  )
}

function Plan({ title, price, cta, href, features, highlight }: { title: string; price: React.ReactNode; cta: string; href: string; features: string[]; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border ${highlight ? 'border-black' : 'border-zinc-200'} bg-white p-6 shadow-sm`}>
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="text-xl">{price}</div>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        {features.map((f) => (<li key={f}>• {f}</li>))}
      </ul>
      <div className="mt-6">
        <Link href={href} className={`px-4 py-2 rounded ${highlight ? 'bg-black text-white' : 'border'}`}>{cta}</Link>
      </div>
    </div>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-white border rounded p-4">
      <div className="font-medium">{q}</div>
      <div className="text-sm text-gray-700">{a}</div>
    </div>
  )
}
