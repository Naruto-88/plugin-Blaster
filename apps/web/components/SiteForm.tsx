"use client"
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  url: z.string().url(),
  authType: z.enum(['app_password','bearer_token']),
  username: z.string().optional(),
  credential: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // UI-only flag: indicates a saved credential exists on the server
  hasCredential: z.boolean().optional(),
})

function TagChips({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (!v) return
    if (!value.includes(v)) onChange([...value, v])
    setInput('')
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 text-xs">
            {t}
            <button type="button" onClick={() => onChange(value.filter(x => x!==t))}>x</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter'){ e.preventDefault(); add() } }} className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2" placeholder="Add tag" />
        <button type="button" onClick={add} className="rounded-lg border px-3">Add</button>
      </div>
    </div>
  )
}

export default function SiteForm({ initial, onDone }: { initial?: Partial<z.infer<typeof schema>>; onDone?: () => void }) {
  const { register, handleSubmit, watch, setValue, getValues, formState: { isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? { name: '', url: '', authType: 'bearer_token', username: '', credential: '', tags: [], hasCredential: false }
  })
  const tags = watch('tags')
  const authType = watch('authType')
  const hasCredential = watch('hasCredential')
  const [showSecret, setShowSecret] = useState(false)
  const utils = trpc.useUtils()
  const create = trpc.sites.create.useMutation({
    onSuccess: async (res: any) => {
      await Promise.all([
        utils.sites.list.invalidate(),
        res?.id ? utils.sites.detail.invalidate({ id: res.id }) : Promise.resolve(),
      ])
      toast.success('Site created')
      onDone?.()
    },
  })
  const update = trpc.sites.update.useMutation({
    onSuccess: async (_res, variables) => {
      const id = (variables as any)?.id
      await Promise.all([
        utils.sites.list.invalidate(),
        id ? utils.sites.detail.invalidate({ id }) : Promise.resolve(),
      ])
      toast.success('Changes saved')
      onDone?.()
    },
  })
  const test = trpc.sites.testConnection.useMutation()

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      // Do not send UI-only field
      const { hasCredential: _uiHas, ...payload } = data as any
      if (payload.id) await update.mutateAsync(payload)
      else await create.mutateAsync(payload)
    } catch (e: any) {
      const raw = e?.message || ''
      const msg =
        raw.includes('FORBIDDEN') ? "You don't have permission to manage sites for this account. Ask an owner/admin."
        : raw.includes('NO_ACCOUNT') ? 'No account detected. Try refreshing, or contact support.'
        : raw.includes('SITE_LIMIT_REACHED') ? 'Site limit reached for your plan. Upgrade in Billing to add more.'
        : raw.includes('TRIAL_EXPIRED') ? 'Your trial has ended. Subscribe in Billing to continue.'
        : (raw.includes('URL_TAKEN') || raw.toLowerCase().includes('unique')) ? 'A site with this URL already exists. If this is unexpected, contact support.'
        : 'Could not save the site.'
      toast.error(msg, { description: raw && msg === 'Could not save the site.' ? raw : undefined })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label className="text-sm">Name</Label>
        <Input className="mt-1 w-full" {...register('name')} />
      </div>
      <div>
        <Label className="text-sm">URL</Label>
        <Input className="mt-1 w-full" {...register('url')} />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">Auth Type</Label>
          <select className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2" {...register('authType')}>
            <option value="bearer_token">Bearer Token</option>
            <option value="app_password">Application Password</option>
          </select>
        </div>
        {authType==='app_password' && (
          <div>
            <Label className="text-sm">Username</Label>
            <Input className="mt-1 w-full" {...register('username')} />
          </div>
        )}
      </div>
      <div>
        <Label className="text-sm">{authType==='bearer_token' ? 'Bearer Token' : 'App Password'}</Label>
        <div className="mt-1 w-full relative">
          <Input type={showSecret ? 'text' : 'password'} placeholder={(!getValues('credential') && hasCredential) ? '•••••••• (saved)' : ''} className="pr-10" {...register('credential')} />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-500" onClick={()=> setShowSecret(s=>!s)} aria-label={showSecret ? 'Hide' : 'Show'}>
            {showSecret ? '🙈' : '👁️'}
          </button>
        </div>
        {hasCredential && !getValues('credential') && (
          <div className="text-xs text-zinc-500 mt-1">A credential is already saved. Leave blank to keep it. Enter a new one to replace.</div>
        )}
      </div>
      <div>
        <Label className="text-sm">Tags</Label>
        <TagChips value={tags} onChange={(v) => setValue('tags', v)} />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (initial?.id ? 'Save Changes' : 'Create Site')}</Button>
        <Button variant="outline" type="button" onClick={async () => {
          const d = getValues() as any
          const p = test.mutateAsync({ url: d.url, authType: d.authType, username: d.username, credential: d.credential })
          toast.promise(p, { loading: 'Testing connection...', success: (r)=> r.ok ? `OK - ${r.plugins} plugins` : `Failed - ${r.error}`, error: 'Failed' })
        }}>Test Connection</Button>
        {test.isPending && <span className="text-sm text-zinc-500">Testing...</span>}
      </div>
    </form>
  )
}
