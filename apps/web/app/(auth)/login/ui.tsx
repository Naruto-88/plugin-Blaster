"use client"
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signIn } from 'next-auth/react'

const schema = z.object({ email: z.string().email(), password: z.string().min(6) })

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setError(null)
    const result = await signIn('credentials', {
      redirect: false,
      email: data.email,
      password: data.password,
      callbackUrl: '/sites'
    })
    if (result?.ok) {
      window.location.href = result.url || '/sites'
    } else {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm">Email</label>
            <Input type="email" className="mt-1 w-full" {...register('email')} />
          </div>
          <div>
            <label className="text-sm">Password</label>
            <Input type="password" className="mt-1 w-full" {...register('password')} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button disabled={isSubmitting} className="w-full">{isSubmitting ? 'Signing in…' : 'Sign in'}</Button>
        </form>
      </motion.div>
    </div>
  )
}
