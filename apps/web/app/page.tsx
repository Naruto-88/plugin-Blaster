import React from 'react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <section className="mx-auto max-w-4xl text-center space-y-6 py-16">
        <h1 className="text-4xl font-bold">Monitor WordPress updates at scale</h1>
        <p className="text-gray-600">Track core and plugin updates across all your sites. Secure, fast, and designed for teams. Start your 7-day free trial.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/register" className="bg-black text-white px-5 py-2 rounded">Start Free Trial</Link>
          <Link href="/api/auth/signin" className="border px-5 py-2 rounded">Sign In</Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl py-10">
        <h2 className="text-2xl font-semibold text-center mb-6">Simple Pricing</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <PlanCard title="Free" price="$0" ctaHref="/register?plan=free" features={[
            'Up to 3 sites',
            '50 checks/day',
            '14-day history',
            '2 seats'
          ]} />
          <PlanCard title="Starter" priceHtml={<span><span className="line-through text-zinc-400 mr-1">$19</span><span className="font-bold">$5</span><span>/mo</span><span className="ml-2 text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded whitespace-nowrap inline-block">Limited-time</span></span>} ctaHref="/register?plan=starter" features={[
            'Up to 10 sites',
            '500 checks/day',
            '90-day history',
            '5 seats'
          ]} />
          <PlanCard title="Pro" priceHtml={<span><span className="line-through text-zinc-400 mr-1">$79</span><span className="font-bold">$25</span><span>/mo</span><span className="ml-2 text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded whitespace-nowrap inline-block">Limited-time</span></span>} ctaHref="/register?plan=pro" highlighted features={[
            'Up to 50 sites',
            '2,000 checks/day',
            '180-day history',
            '15 seats'
          ]} />
          <PlanCard title="Enterprise" priceHtml={<span><span className="line-through text-zinc-400 mr-1">$199</span><span className="font-bold">$79</span><span>/mo</span><span className="ml-2 text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded whitespace-nowrap inline-block">Limited-time</span></span>} ctaHref="/register?plan=enterprise" features={[
            'Unlimited sites',
            '10,000 checks/day',
            '1-year history',
            'SSO & custom SLA'
          ]} />
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">All plans start with a 7-day free trial. No credit card required.</p>
      </section>
    </main>
  )
}

function PlanCard({ title, price, priceHtml, features, ctaHref, highlighted }: { title: string; price?: string; priceHtml?: React.ReactNode; features: string[]; ctaHref: string; highlighted?: boolean }) {
  const wrapperClass = `rounded-xl border ${highlighted ? 'border-black' : 'border-zinc-200'} bg-white p-6 shadow-sm`
  return (
    <div className={wrapperClass}>
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="text-xl">{priceHtml ?? <span className="font-bold">{price}</span>}</div>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-gray-700">
        {features.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>
      <div className="mt-6">
        <Link href={ctaHref} className={`px-4 py-2 rounded ${highlighted ? 'bg-black text-white' : 'border'}`}>
          Get Started
        </Link>
      </div>
    </div>
  )
}

