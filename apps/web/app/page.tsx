'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, ArrowRight, Shield, Zap, Globe, BarChart3 } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
}

export default function HomePage() {
  return (
    <main className="min-h-screen hero-gradient selection:bg-zinc-200 dark:selection:bg-zinc-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Now with Redis-powered concurrent checks
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-7xl font-bold tracking-tight gradient-text mb-8"
            >
              Monitor WordPress <br className="hidden md:block" /> updates at scale
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="mx-auto max-w-2xl text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed"
            >
              The enterprise-ready dashboard to track core and plugin updates across your entire fleet. Secure, blazing fast, and designed for high-performance teams.
            </motion.p>
            
            <motion.div 
              variants={itemVariants} 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link 
                href="/register" 
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                Start 7-day Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/api/auth/signin" 
                className="w-full sm:w-auto px-8 py-4 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors font-semibold"
              >
                Sign In
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 lg:px-8 border-y border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureItem 
              icon={<Shield className="w-6 h-6" />}
              title="Secure by Design"
              description="AES-GCM encryption for all your site credentials. We prioritize security above everything."
            />
            <FeatureItem 
              icon={<Zap className="w-6 h-6" />}
              title="Blazing Performance"
              description="Redis-backed concurrent checks ensure your dashboard updates in real-time."
            />
            <FeatureItem 
              icon={<BarChart3 className="w-6 h-6" />}
              title="Deep Insights"
              description="Comprehensive historical data and update logs for every site in your portfolio."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-zinc-600 dark:text-zinc-400">Choose the plan that fits your agency's scale.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <PlanCard 
              title="Free" 
              price="$0" 
              ctaHref="/register?plan=free" 
              features={[
                'Up to 3 sites',
                '50 checks/day',
                '14-day history',
                '2 seats'
              ]} 
            />
            <PlanCard 
              title="Starter" 
              price="$5"
              originalPrice="$19"
              isPromo
              ctaHref="/register?plan=starter" 
              features={[
                'Up to 10 sites',
                '500 checks/day',
                '90-day history',
                '5 seats'
              ]} 
            />
            <PlanCard 
              title="Pro" 
              price="$25"
              originalPrice="$79"
              isPromo
              highlighted 
              ctaHref="/register?plan=pro" 
              features={[
                'Up to 50 sites',
                '2,000 checks/day',
                '180-day history',
                '15 seats'
              ]} 
            />
            <PlanCard 
              title="Enterprise" 
              price="$79"
              originalPrice="$199"
              isPromo
              ctaHref="/register?plan=enterprise" 
              features={[
                'Unlimited sites',
                '10,000 checks/day',
                '1-year history',
                'SSO & custom SLA'
              ]} 
            />
          </div>
          <p className="text-center text-sm text-zinc-500 mt-12">All plans start with a 7-day free trial. No credit card required.</p>
        </div>
      </section>
    </main>
  )
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{description}</p>
    </div>
  )
}

function PlanCard({ title, price, originalPrice, features, ctaHref, highlighted, isPromo }: { title: string; price: string; originalPrice?: string; features: string[]; ctaHref: string; highlighted?: boolean; isPromo?: boolean }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`relative flex flex-col p-8 rounded-3xl border ${highlighted ? 'border-zinc-900 dark:border-white ring-1 ring-zinc-900 dark:ring-white' : 'border-zinc-200 dark:border-zinc-800'} glass transition-shadow hover:shadow-xl`}
    >
      {highlighted && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold rounded-full uppercase tracking-widest">
          Most Popular
        </span>
      )}
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-zinc-600 dark:text-zinc-400 mb-2">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-zinc-500">/mo</span>
          {isPromo && originalPrice && (
            <span className="text-sm line-through text-zinc-400">{originalPrice}</span>
          )}
        </div>
      </div>

      <ul className="flex-1 space-y-4 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-300">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <Link 
        href={ctaHref} 
        className={`w-full py-3 rounded-xl font-bold text-center transition-all ${highlighted ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
      >
        Get Started
      </Link>
    </motion.div>
  )
}

