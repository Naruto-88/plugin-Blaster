"use client"
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { trpc } from '@/lib/trpc'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const schema = z.object({
  cron: z.string().min(5),
  webhookRate: z.coerce.number().min(1).max(1000),
  checksRate: z.coerce.number().min(1).max(1000),
  oldKeyB64: z.string().optional(),
  newKeyB64: z.string().optional(),
})

export default function SettingsUI() {
  const { data: settings, refetch } = trpc.settings.get.useQuery()
  const setSetting = trpc.settings.set.useMutation()
  const rotate = trpc.settings.rotateSecrets.useMutation()
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { cron: '0 */6 * * *', webhookRate: 60, checksRate: 30 } })

  useEffect(() => {
    if (settings) {
      reset({
        cron: settings['schedule.cron'] ?? '0 */6 * * *',
        webhookRate: settings['webhook.ratePerMinute'] ?? 60,
        checksRate: settings['checks.ratePerMinute'] ?? 30,
        oldKeyB64: '', newKeyB64: ''
      })
    }
  }, [settings])

  const onSubmit = async (data: z.infer<typeof schema>) => {
    const ops = [
      setSetting.mutateAsync({ key: 'schedule.cron', value: data.cron }),
      setSetting.mutateAsync({ key: 'webhook.ratePerMinute', value: data.webhookRate }),
      setSetting.mutateAsync({ key: 'checks.ratePerMinute', value: data.checksRate }),
    ]
    await toast.promise(Promise.all(ops), { loading: 'Saving…', success: 'Saved', error: 'Failed' })
    refetch()
  }

  const doRotate = async (d: z.infer<typeof schema>) => {
    if (!d.oldKeyB64 || !d.newKeyB64) return toast.error('Provide both keys')
    await toast.promise(rotate.mutateAsync({ oldKeyB64: d.oldKeyB64, newKeyB64: d.newKeyB64 }), { loading: 'Rotating…', success: 'Rotation completed', error: 'Failed' })
    reset({ ...d, oldKeyB64: '', newKeyB64: '' })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div className="text-lg font-semibold">Schedules & Rate Limits</div>
        <div>
          <Label>Default Cron (worker)</Label>
          <Input className="mt-1" placeholder="0 */6 * * *" {...register('cron')} />
          <div className="text-xs text-zinc-500 mt-1">For Vercel Cron, configure vercel.json; worker runs default unless customized.</div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Webhook Rate (per minute)</Label>
            <Input className="mt-1" type="number" {...register('webhookRate', { valueAsNumber: true })} />
          </div>
          <div>
            <Label>Checks Rate (per minute)</Label>
            <Input className="mt-1" type="number" {...register('checksRate', { valueAsNumber: true })} />
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>Save</Button>
      </form>

      <form onSubmit={handleSubmit(doRotate)} className="card p-6 space-y-4">
        <div className="text-lg font-semibold">Encryption Key Rotation</div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Old Key (base64)</Label>
            <Input className="mt-1" placeholder="base64:…" {...register('oldKeyB64')} />
          </div>
          <div>
            <Label>New Key (base64)</Label>
            <Input className="mt-1" placeholder="base64:…" {...register('newKeyB64')} />
          </div>
        </div>
        <Button type="submit" variant="destructive">Rotate Secrets</Button>
        <div className="text-xs text-zinc-500">After rotation, update `MASTER_ENCRYPTION_KEY` in all deployments.</div>
      </form>
    </div>
  )
}

