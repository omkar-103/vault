// pages/index.tsx
import type { GetServerSideProps, NextPage } from 'next'
import { useState, useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────

type ViewType = 'broken' | 'login' | 'vault'

interface VaultItem {
  _id: string
  title: string
  code: string
  imageId?: string | null
  createdAt: string
}

interface PageProps {
  initialView: ViewType
}

// ─── Shared Styles ────────────────────────────────────────────────

const MONO = '"Courier New", Courier, monospace'

const base: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: '14px',
  background: '#fff',
  color: '#000',
  margin: 0,
  padding: '28px',
  minHeight: '100vh',
}

const btn: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: '13px',
  background: 'transparent',
  border: '1px solid #000',
  cursor: 'pointer',
  padding: '2px 8px',
  color: '#000',
}

const input: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: '13px',
  border: 'none',
  borderBottom: '1px solid #666',
  outline: 'none',
  background: 'transparent',
  color: '#000',
}

// ─── Broken Page ──────────────────────────────────────────────────

function BrokenPage() {
  return (
    <div style={base}>
      <pre style={{ margin: 0 }}>{`SYSTEM ARCHIVE
Kernel Index: 0xF91A2
Module Deprecated

[ERR_0x004] Init sequence failed
[ERR_0x011] Cannot locate runtime module
[ERR_0x019] Heap allocation fault at 0x00000000

Status:       OFFLINE
Last sync:    --
Node uptime:  0s`}</pre>
    </div>
  )
}

// ─── Login Page ───────────────────────────────────────────────────

function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError(false)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        onSuccess()
      } else {
        setError(true)
        setPassword('')
      }
    } catch {
      setError(true)
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={base}>
      <pre style={{ margin: '0 0 16px 0' }}>{`SYSTEM ARCHIVE
Kernel Index: 0xF91A2

> Maintenance Authentication Required`}</pre>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <span>{'Password: '}</span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ ...input, minWidth: '220px' }}
            autoFocus
            autoComplete="off"
          />
        </div>
        <button type="submit" disabled={loading} style={btn}>
          {loading ? '> Processing...' : '> [ AUTHENTICATE ]'}
        </button>
        {error && (
          <pre style={{ margin: '12px 0 0', color: '#000' }}>
            {'[ERR] Authentication failed'}
          </pre>
        )}
      </form>
    </div>
  )
}

// ─── Vault Page ───────────────────────────────────────────────────

function VaultPage({ onLogout }: { onLogout: () => void }) {
  const [items, setItems] = useState<VaultItem[]>([])
  const [images, setImages] = useState<Record<string, string>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const blobRefs = useRef<string[]>([])

  useEffect(() => {
    fetchItems()
    return () => {
      blobRefs.current.forEach(u => URL.revokeObjectURL(u))
    }
  }, [])

  const fetchItems = async () => {
    const res = await fetch('/api/vault/items')
    if (res.ok) setItems(await res.json())
  }

  const copyCode = async (item: VaultItem) => {
    try {
      await navigator.clipboard.writeText(item.code)
    } catch {
      // Fallback for non-HTTPS dev environments
      const el = document.createElement('textarea')
      el.value = item.code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopiedId(item._id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const loadImage = async (imageId: string) => {
    if (images[imageId]) return
    setStatus('Loading image...')
    const res = await fetch(`/api/photo?id=${imageId}`)
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      blobRefs.current.push(url)
      setImages(prev => ({ ...prev, [imageId]: url }))
    }
    setStatus('')
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newCode.trim()) return
    setSaving(true)
    setStatus('Saving...')

    let imageId: string | null = null

    if (newFile) {
      const fd = new FormData()
      fd.append('image', newFile)
      const up = await fetch('/api/upload', { method: 'POST', body: fd })
      if (up.ok) imageId = (await up.json()).imageId
    }

    const res = await fetch('/api/vault/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), code: newCode, imageId }),
    })

    if (res.ok) {
      setNewTitle('')
      setNewCode('')
      setNewFile(null)
      setShowAdd(false)
      await fetchItems()
      setStatus('Saved.')
      setTimeout(() => setStatus(''), 2000)
    } else {
      setStatus('Save failed.')
    }

    setSaving(false)
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return
    const res = await fetch(`/api/vault/items?id=${id}`, { method: 'DELETE' })
    if (res.ok) setItems(prev => prev.filter(i => i._id !== id))
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    onLogout()
  }

  return (
    <div style={{ ...base, maxWidth: '860px' }}>
      {/* ── Header ── */}
      <pre style={{ margin: '0 0 6px' }}>{'VAULT SYSTEM — ACTIVE'}</pre>

      <div style={{ marginBottom: '6px' }}>
        <button onClick={handleLogout} style={btn}>[ LOGOUT ]</button>
        {' '}
        <button onClick={() => setShowAdd(s => !s)} style={btn}>
                    {showAdd ? '[ CANCEL ]' : '[ + ADD ITEM ]'}
        </button>
        {status && <span style={{ marginLeft: '14px', color: '#555' }}>{status}</span>}
      </div>

      <hr style={{ borderTop: '1px solid #000', margin: '12px 0' }} />

      {/* ── Add Item Form ── */}
      {showAdd && (
        <form onSubmit={handleAdd} style={{ marginBottom: '24px' }}>
          <pre style={{ margin: '0 0 8px' }}>{'> NEW ITEM'}</pre>
          <div style={{ marginBottom: '8px' }}>
            <span>{'TITLE:  '}</span>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              style={{ ...input, minWidth: '280px' }}
              placeholder="Item title"
              autoFocus
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ marginBottom: '4px' }}>CODE:</div>
            <textarea
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              style={{
                fontFamily: MONO,
                fontSize: '13px',
                width: '100%',
                minHeight: '140px',
                boxSizing: 'border-box',
                background: '#f8f8f8',
                border: '1px solid #999',
                padding: '8px',
                resize: 'vertical',
                color: '#000',
                outline: 'none',
              }}
              placeholder="Paste code here..."
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <span>{'IMAGE: '}</span>
            <input
              type="file"
              accept="image/*"
              style={{ fontFamily: MONO, fontSize: '13px' }}
              onChange={e => setNewFile(e.target.files?.[0] ?? null)}
            />
            {newFile && (
              <span style={{ marginLeft: '8px', color: '#555' }}>
                {newFile.name}
              </span>
            )}
          </div>
          <button type="submit" disabled={saving} style={btn}>
            {saving ? '> Storing...' : '> [ STORE ITEM ]'}
          </button>
        </form>
      )}

      {/* ── Vault Items ── */}
      {items.length === 0 && (
        <pre style={{ color: '#888' }}>{'[EMPTY] No vault items.'}</pre>
      )}

      {items.map(item => (
        <div
          key={item._id}
          style={{
            marginBottom: '28px',
            borderLeft: '3px solid #000',
            paddingLeft: '14px',
          }}
        >
          <pre style={{ margin: '0 0 6px', fontWeight: 'bold' }}>
            {`TITLE: ${item.title}`}
          </pre>

          <div style={{ marginBottom: '6px' }}>
            <button
              onClick={() => copyCode(item)}
              style={btn}
            >
              {copiedId === item._id ? '> [ COPIED ]' : '> [ COPY CODE ]'}
            </button>
            {' '}
            {item.imageId && (
              <button
                onClick={() => loadImage(item.imageId!)}
                style={btn}
              >
                {'> [ LOAD IMAGE ]'}
              </button>
            )}
            {' '}
            <button
              onClick={() => deleteItem(item._id)}
              style={{ ...btn, color: '#888', borderColor: '#888' }}
            >
              {'[ DELETE ]'}
            </button>
          </div>

          <pre
            style={{
              margin: '8px 0 0',
              background: '#f4f4f4',
              padding: '10px',
              overflowX: 'auto',
              border: '1px solid #ddd',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {item.code}
          </pre>

          {item.imageId && images[item.imageId] && (
            <div style={{ marginTop: '10px' }}>
              <img
                src={images[item.imageId]}
                alt={item.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '500px',
                  display: 'block',
                  border: '1px solid #ccc',
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────

const Home: NextPage<PageProps> = ({ initialView }) => {
  const [view, setView] = useState<ViewType>(initialView)

  if (view === 'login') {
    return (
      <LoginPage
        onSuccess={() => setView('vault')}
      />
    )
  }

  if (view === 'vault') {
    return (
      <VaultPage
        onLogout={() => setView('broken')}
      />
    )
  }

  return <BrokenPage />
}

export default Home

// ─── Server-Side Props ────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const { validateSession } = await import('../lib/session')

  const token = ctx.req.cookies?.['vault_token']

  // ── Already authenticated? Go straight to vault ──────────────
  if (token) {
    const valid = await validateSession(token)
    if (valid) {
      return { props: { initialView: 'vault' } }
    }
  }

  // ── Check for secret access URL ───────────────────────────────
  const { sys, mode, key } = ctx.query

  const isSecretUrl =
    sys === 'repair' &&
    mode === 'legacy' &&
    typeof key === 'string' &&
    key === process.env.SECRET_ACCESS_KEY

  if (isSecretUrl) {
    return { props: { initialView: 'login' } }
  }

  // ── Default: show broken page ─────────────────────────────────
  return { props: { initialView: 'broken' } }
}