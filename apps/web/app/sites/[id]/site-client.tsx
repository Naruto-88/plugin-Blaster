"use client"
import { trpc } from '@/lib/trpc'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar, BarChart, Legend } from 'recharts'
import SiteForm from '@/components/SiteForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'

export default function SiteDetailClient({ siteId, initialName, initialUrl }: { siteId: string; initialName: string; initialUrl: string }) {
  const [tab, setTab] = useState<'core'|'plugins'|'logs'|'charts'>('plugins')
  const { data: detail } = trpc.sites.detail.useQuery({ id: siteId })
  const { data: history } = trpc.checks.history.useQuery({ siteId, limit: 20 })
  const { data: logs } = trpc.logs.list.useQuery({ siteId, page: 1, pageSize: 100 })
  const site = detail?.site
  const latest = detail?.latestCheck
  const utils = trpc.useUtils()
  const del = trpc.sites.remove.useMutation({ onSuccess: async ()=>{ await utils.sites.list.invalidate(); window.location.href = '/sites' } })
  const [editing, setEditing] = useState(false)
  const [checking, setChecking] = useState(false)
  const trigger = trpc.checks.trigger.useMutation()
  const [pluginSort, setPluginSort] = useState<'none'|'updatesFirst'|'uptodateFirst'>('none')
  const pluginUpdatesCount = (latest?.plugins?.filter((p: any) => p.updateAvailable).length) ?? 0
  const [confirmingUpdate, setConfirmingUpdate] = useState<null | { target: 'core' | 'all' | { plugin: string } }>(null)
  const [updatingCore, setUpdatingCore] = useState(false)
  const [updatingAll, setUpdatingAll] = useState(false)
  const [updatingPlugin, setUpdatingPlugin] = useState<string | null>(null)
  const updateCore = trpc.updates?.updateCore?.useMutation ? trpc.updates.updateCore.useMutation() : ({} as any)
  const updatePlugin = trpc.updates?.updatePlugin?.useMutation ? trpc.updates.updatePlugin.useMutation() : ({} as any)
  const updateAll = trpc.updates?.updateAll?.useMutation ? trpc.updates.updateAll.useMutation() : ({} as any)

  async function triggerAndPoll() {
    if (checking) return
    const prev = latest?.startedAt ? new Date(latest.startedAt).getTime() : 0
    setChecking(true)
    const queuePromise = trigger.mutateAsync({ siteId })
    const toastId = toast.loading('Checking in progress...')
    queuePromise.catch(() => {
      toast.error('Failed to queue', { id: toastId })
      setChecking(false)
    })
    // poll
    const start = Date.now()
    const timeout = 60_000
    async function loop() {
      await new Promise(r => setTimeout(r, 2000))
      const nd = await utils.sites.detail.fetch({ id: siteId })
      const started = nd?.latestCheck?.startedAt ? new Date(nd.latestCheck.startedAt).getTime() : 0
      if (started > prev) {
        await utils.sites.detail.invalidate({ id: siteId })
        toast.success('Check finished', { id: toastId })
        setChecking(false)
        return
      }
      if (Date.now() - start < timeout) return loop()
      // Keep toast, inform still running
      toast.message('Still running...')
      setChecking(false)
    }
    loop()
  }

  return (
    <>
    <div className="p-6 space-y-6">
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="font-semibold text-lg">{site?.name ?? initialName}</div>
        </div>
        <div className="text-sm text-zinc-500 mt-1">{site?.url ?? initialUrl}</div>
        <div className="mt-4 flex items-center gap-2">
          <a href="/sites" className="text-sm underline">← Back to Sites</a>
          <Tabs value={tab} onValueChange={(v)=>setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="plugins">
                Plugins
                {pluginUpdatesCount > 0 && (
                  <span className="ml-2 text-[10px] rounded-full bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 px-2 py-0.5">
                    {pluginUpdatesCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="core">Core</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="ml-auto flex items-center gap-2">
            {site?.url && (
              <a
                href={`${site.url.replace(/\/?$/, '/') }wp-admin/update-core.php`}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline"
                title="Open WordPress Updates page"
              >WP Updates</a>
            )}
            {latest && ((latest.core?.updateAvailable ?? false) || (latest.plugins?.some((p:any)=>p.updateAvailable) ?? false)) && (
              <Button onClick={() => setConfirmingUpdate({ target: 'all' })} className="text-sm" disabled={updatingAll}>
                {updatingAll ? 'Updating…' : 'Update All'}
              </Button>
            )}
            <a href={`/api/logs.csv?siteId=${siteId}`} className="text-sm underline">Export Logs CSV</a>
            <Button variant="outline" onClick={triggerAndPoll} disabled={checking} className="text-sm">
              {checking ? 'Checking...' : 'Trigger Check'}
            </Button>
            <Button variant="ghost" onClick={()=>setEditing(true)} className="text-sm">Edit</Button>
            <Button variant="destructive" onClick={()=>{ if (confirm('Delete this site?')) del.mutate({ id: siteId }) }} className="text-sm">Delete</Button>
          </div>
        </div>
      </div>

      <div className="card p-5 min-h-[300px]">
        <AnimatePresence mode="wait">
          {tab==='core' && (
            <motion.div key="core" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              {latest?.core ? (
                <div className="text-sm space-y-1">
                  <div>Current: {latest.core.currentVersion}</div>
                  <div>Latest: {latest.core.latestVersion}</div>
                  <div>Update Available: {latest.core.updateAvailable ? 'Yes' : 'No'}</div>
                  <div>Security: {latest.core.security ? 'Yes' : 'No'}</div>
                  {latest.core.updateAvailable && (
                    <div className="pt-2">
                      <Button size="sm" disabled={updatingCore} onClick={() => setConfirmingUpdate({ target: 'core' })}>
                        {updatingCore ? 'Updating…' : 'Update Core (remote)'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : <div className="text-sm text-zinc-500">No core data yet.</div>}
            </motion.div>
          )}
          {tab==='plugins' && (
            <motion.div key="plugins" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              {pluginUpdatesCount > 0 && (
                <div className="mb-2 text-xs text-amber-800 dark:text-amber-200">
                  {pluginUpdatesCount} plugin{pluginUpdatesCount===1?'':'s'} need update
                </div>
              )}
              <div className="max-h-[420px] overflow-auto pr-2 space-y-2">
                {/* Header */}
                <div className="grid grid-cols-[2fr_1fr_1fr] text-xs text-zinc-500 px-1">
                  <div>Name</div>
                  <div>Version</div>
                  <div className="text-right flex items-center justify-end gap-2">
                    <span>Status</span>
                    <button
                      type="button"
                      className="rounded-md border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      title="Toggle sort by update availability"
                      onClick={() => setPluginSort(prev => prev==='none' ? 'updatesFirst' : prev==='updatesFirst' ? 'uptodateFirst' : 'none')}
                    >
                      {pluginSort==='none' && 'Sort: default'}
                      {pluginSort==='updatesFirst' && 'Sort: updates ↑'}
                      {pluginSort==='uptodateFirst' && 'Sort: updates ↓'}
                    </button>
                  </div>
                </div>
                {(latest?.plugins ? [...latest.plugins] : []).sort((a:any,b:any)=>{
                  if (pluginSort==='none') return 0
                  const aHas = !!(a.security || a.updateAvailable)
                  const bHas = !!(b.security || b.updateAvailable)
                  if (aHas === bHas) return 0
                  if (pluginSort==='updatesFirst') return aHas ? -1 : 1
                  return aHas ? 1 : -1
                }).map((p:any) => (
                  <div
                    key={p.id}
                    className={`grid grid-cols-[2fr_1fr_1fr] items-center text-sm px-2 py-2 rounded-md border
                      ${p.security
                        ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/40'
                        : p.updateAvailable
                          ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/40'
                          : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900/30 dark:border-zinc-800'}
                    `}
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-zinc-500 truncate">{p.slug}</div>
                    </div>
                    <div className="text-xs">{p.currentVersion} → {p.latestVersion}</div>
                    <div className={`text-xs text-right ${p.security? 'text-red-500' : p.updateAvailable ? 'text-yellow-600' : 'text-zinc-500'}`}>
                      {p.updateAvailable ? (
                        <div className="flex items-center gap-2 justify-end">
                          <span className={p.security ? 'text-red-600' : 'text-amber-700 dark:text-amber-300'}>{p.security ? 'Security' : 'Update'}</span>
                          <Button
                            size="sm"
                            variant={p.security ? 'destructive' : 'outline'}
                            className={p.security ? '' : 'border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-200'}
                            disabled={updatingPlugin===p.slug}
                            onClick={() => setConfirmingUpdate({ target: { plugin: p.slug } })}
                          >
                            {updatingPlugin===p.slug ? 'Updating…' : 'Update'}
                          </Button>
                        </div>
                      ) : 'Up-to-date'}
                    </div>
                  </div>
                )) || <div className="text-sm text-zinc-500">No plugin data.</div>}
              </div>
            </motion.div>
          )}
          {tab==='logs' && (
            <motion.div key="logs" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <div className="space-y-2 max-h-[420px] overflow-auto pr-2">
                {logs?.items?.map(l => (
                  <div key={l.id} className="flex items-start gap-3 text-sm">
                    <span className={`mt-1 inline-flex h-2.5 w-2.5 rounded-full ${l.level==='error' ? 'bg-red-500' : l.level==='warn' ? 'bg-yellow-400' : 'bg-emerald-500'}`} />
                    <div>
                      <div className="text-xs text-zinc-500">{new Date(l.createdAt).toLocaleString()} - {l.level.toUpperCase()}</div>
                      <div>{l.message}</div>
                    </div>
                  </div>
                )) || <div className="text-sm text-zinc-500">No logs.</div>}
              </div>
            </motion.div>
          )}
          {tab==='charts' && (
            <motion.div key="charts" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              {history && history.length ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history}>
                        <XAxis dataKey={(d) => new Date(d.date).toLocaleDateString()} interval={Math.max(0, Math.floor(history.length/6)-1)} />
                        <YAxis allowDecimals={false} />
                        <Tooltip labelFormatter={(v) => String(v)} />
                        <Legend />
                        <Line type="monotone" dataKey="updateCount" stroke="#6d28d9" name="Updates" />
                        <Line type="monotone" dataKey="securityCount" stroke="#ef4444" name="Security" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={history}>
                        <XAxis dataKey={(d) => new Date(d.date).toLocaleDateString()} interval={Math.max(0, Math.floor(history.length/6)-1)} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="updateCount" fill="#60a5fa" name="Updates" />
                        <Bar dataKey="securityCount" fill="#f43f5e" name="Security" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : <div className="text-sm text-zinc-500">No history yet.</div>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    <Dialog open={editing} onOpenChange={(open) => setEditing(!!open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Site</DialogTitle>
        </DialogHeader>
        <SiteForm onDone={()=>setEditing(false)} initial={{ id: site?.id, name: site?.name || initialName, url: site?.url || initialUrl, authType: (site as any)?.authType || 'bearer_token', username: (site as any)?.username || '', tags: (site as any)?.tags || [] }} />
      </DialogContent>
    </Dialog>
    <Dialog open={!!confirmingUpdate} onOpenChange={(open) => { if (!open) setConfirmingUpdate(null) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Update</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>
            Please take a backup before running updates. For example, use “All‑in‑One WP Migration” to export your site.
          </p>
          <p>Proceed with the update?</p>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setConfirmingUpdate(null)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={async () => {
              try {
                if (confirmingUpdate?.target === 'core') {
                  setUpdatingCore(true)
                  const res = updateCore?.mutateAsync ? await updateCore.mutateAsync({ siteId }) : null
                  toast.success(res?.response?.updated ? 'Core updated' : 'Core update triggered')
                  await triggerAndPoll()
                  setUpdatingCore(false)
                } else if (confirmingUpdate?.target === 'all') {
                  setUpdatingAll(true)
                  const res = updateAll?.mutateAsync ? await updateAll.mutateAsync({ siteId }) : null
                  const cnt = res?.response?.result?.plugins ?? 0
                  toast.success(`Update all triggered${cnt?` (${cnt} plugins)`:''}`)
                  await triggerAndPoll()
                  setUpdatingAll(false)
                } else if (confirmingUpdate?.target && typeof confirmingUpdate.target === 'object') {
                  const slug = (confirmingUpdate.target as any).plugin
                  setUpdatingPlugin(slug)
                  const res = updatePlugin?.mutateAsync ? await updatePlugin.mutateAsync({ siteId, slug }) : null
                  toast.success(res?.response?.updated ? `Updated ${slug}` : `Triggered ${slug}`)
                  await triggerAndPoll()
                  setUpdatingPlugin(null)
                }
                toast.success('Update triggered')
                setConfirmingUpdate(null)
              } catch (e) {
                const msg = (e as any)?.message || 'Failed to trigger update'
                toast.error(msg)
                setUpdatingCore(false); setUpdatingAll(false); if (typeof confirmingUpdate?.target==='object') setUpdatingPlugin(null)
              }
            }}
          >
            Proceed
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}






