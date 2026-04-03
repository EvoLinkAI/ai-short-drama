'use client'
import { useState, useEffect, useCallback } from 'react'
import { AppIcon } from '@/components/ui/icons'
import { apiFetch } from '@/lib/api-fetch'

interface Provider {
  id: string
  name: string
  baseUrl?: string
  apiKey?: string
  hidden?: boolean
}

type TestStatus = 'idle' | 'testing' | 'ok' | 'error'

export function EvolinkApiKeyCard() {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testMessage, setTestMessage] = useState('')

  // Load current config
  useEffect(() => {
    apiFetch('/api/user/api-config')
      .then((res) => res.json())
      .then((data) => {
        const allProviders: Provider[] = data.providers || []
        setProviders(allProviders)
        const evolink = allProviders.find((p) => p.id.toLowerCase().includes('evolink'))
        if (evolink?.apiKey) setApiKey(evolink.apiKey)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const saveKey = useCallback(
    async (key: string) => {
      setSaving(true)
      try {
        const updated = providers.map((p) =>
          p.id.toLowerCase().includes('evolink')
            ? { ...p, apiKey: key }
            : p,
        )
        // If evolink provider not found, append it
        const hasEvolink = updated.some((p) => p.id.toLowerCase().includes('evolink'))
        const finalProviders = hasEvolink
          ? updated
          : [...updated, { id: 'evolink', name: 'EvoLink', baseUrl: 'https://api.evolink.ai/v1', apiKey: key }]

        await apiFetch('/api/user/api-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providers: finalProviders }),
        })
        setProviders(finalProviders)
      } catch {
        // silent
      } finally {
        setSaving(false)
      }
    },
    [providers],
  )

  const testConnection = useCallback(async () => {
    setTestStatus('testing')
    setTestMessage('')
    try {
      const res = await apiFetch('/api/user/api-config/test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiType: 'evolink',
          apiKey,
          baseUrl: 'https://api.evolink.ai/v1',
        }),
      })
      const data = await res.json()
      if (res.ok && data.success !== false) {
        setTestStatus('ok')
        setTestMessage(data.message || 'Connection successful')
      } else {
        setTestStatus('error')
        setTestMessage(data.message || data.error || 'Connection failed')
      }
    } catch {
      setTestStatus('error')
      setTestMessage('Network error')
    }
  }, [apiKey])

  if (loading) {
    return (
      <div>
        <div className="h-4 w-48 bg-[#f5f5f5] rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-[#171717]">EvoLink API Key</h3>
        <p className="text-xs text-[#737373] mt-0.5">
          Connect your EvoLink account to access AI models for text, image, video, and voice generation.
        </p>
      </div>

      {/* API Key input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#171717]">API Key</label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onBlur={() => saveKey(apiKey)}
            placeholder="evo-..."
            className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 pr-10 text-sm text-[#171717] placeholder-[#a3a3a3] focus:outline-none focus:border-black transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#171717] transition-colors"
            aria-label={showKey ? 'Hide API key' : 'Show API key'}
          >
            <AppIcon name={showKey ? 'eyeOff' : 'eye'} size={16} />
          </button>
        </div>
        <a
          href="https://evolink.ai/dashboard/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[#525252] hover:text-[#171717] transition-colors"
        >
          <AppIcon name="externalLink" size={12} />
          Get API Key
        </a>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={testConnection}
          disabled={!apiKey.trim() || testStatus === 'testing'}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg disabled:opacity-40 hover:bg-[#171717] transition-colors"
        >
          {testStatus === 'testing' ? (
            <AppIcon name="loader" size={14} className="animate-spin" />
          ) : (
            <AppIcon name="unplug" size={14} />
          )}
          {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
        </button>

        {saving && (
          <span className="text-xs text-[#737373] flex items-center gap-1">
            <AppIcon name="loader" size={12} className="animate-spin" />
            Saving...
          </span>
        )}
      </div>

      {/* Status indicator */}
      {testStatus === 'ok' && (
        <div className="flex items-center gap-2 text-sm text-[#16a34a] bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg px-3 py-2">
          <AppIcon name="check" size={14} />
          {testMessage}
        </div>
      )}
      {testStatus === 'error' && (
        <div className="flex items-center gap-2 text-sm text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] rounded-lg px-3 py-2">
          <AppIcon name="alert" size={14} />
          {testMessage}
        </div>
      )}
    </div>
  )
}

export default EvolinkApiKeyCard
