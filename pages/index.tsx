// pages/index.tsx
import type { GetServerSideProps, NextPage } from 'next'
import { useState, useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────

type ViewType = 'broken' | 'login' | 'vault'
type VaultId = 1 | 2 | 3

interface VaultItem {
  _id: string
  title: string
  code: string
  imageId?: string | null
  createdAt: string
}

interface PageProps {
  initialView: ViewType
  vaultId: VaultId
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

function LoginPage({ onSuccess, vaultId }: { onSuccess: () => void; vaultId: VaultId }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const loginEndpoint = vaultId === 1 ? '/api/auth/login' : vaultId === 2 ? '/api/auth/login2' : '/api/auth/login3'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError(false)

    try {
      const res = await fetch(loginEndpoint, {
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

function VaultPage({ onLogout, vaultId }: { onLogout: () => void; vaultId: VaultId }) {
  const [items, setItems] = useState<VaultItem[]>([])
  const [images, setImages] = useState<Record<string, string>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [terminating, setTerminating] = useState(false)
  const [superTerminating, setSuperTerminating] = useState(false)
  const blobRefs = useRef<string[]>([])

  const itemsEndpoint = vaultId === 1 ? '/api/vault/items' : vaultId === 2 ? '/api/vault2/items' : '/api/vault3/items'
  const logoutEndpoint = vaultId === 1 ? '/api/auth/logout' : vaultId === 2 ? '/api/auth/logout2' : '/api/auth/logout3'

  const fetchItems = async () => {
    const res = await fetch(itemsEndpoint)
    if (res.ok) setItems(await res.json())
  }

  useEffect(() => {
    fetchItems()
    return () => {
      blobRefs.current.forEach(u => URL.revokeObjectURL(u))
    }
  }, [])

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

    const res = await fetch(itemsEndpoint, {
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
    const res = await fetch(`${itemsEndpoint}?id=${id}`, { method: 'DELETE' })
    if (res.ok) setItems(prev => prev.filter(i => i._id !== id))
  }

  const handleLogout = async () => {
    await fetch(logoutEndpoint, { method: 'POST' })
    onLogout()
  }

  const handleTerminateOthers = async () => {
    const confirmed = confirm('Terminate all other active sessions? Your current session will remain active.')
    if (!confirmed) return
    setTerminating(true)
    setStatus('Terminating...')
    try {
      const res = await fetch('/api/auth/terminate-others', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vault: vaultId }),
      })
      if (res.ok) {
        const data = await res.json()
        setStatus(data.terminated > 0
          ? `Terminated ${data.terminated} other session(s).`
          : 'No other sessions found.')
      } else {
        setStatus('Failed to terminate sessions.')
      }
    } catch {
      setStatus('Error.')
    } finally {
      setTerminating(false)
      setTimeout(() => setStatus(''), 3000)
    }
  }

  const handleSuperTerminate = async () => {
    const confirmed = confirm(
      '⚠️ SUPER TERMINATE: This will log out ALL sessions across ALL 3 vaults.\nYour own current session will remain active.\n\nAre you sure?'
    )
    if (!confirmed) return
    setSuperTerminating(true)
    setStatus('Super terminating...')
    try {
      const res = await fetch('/api/auth/super-terminate', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setStatus(data.terminated > 0
          ? `Super terminated ${data.terminated} session(s) across all vaults.`
          : 'No other sessions found anywhere.')
      } else {
        setStatus('Super terminate failed.')
      }
    } catch {
      setStatus('Error.')
    } finally {
      setSuperTerminating(false)
      setTimeout(() => setStatus(''), 4000)
    }
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
        {' '}
        <button
          onClick={handleTerminateOthers}
          disabled={terminating || superTerminating}
          style={{ ...btn, color: '#888', borderColor: '#888', fontSize: '12px' }}
        >
          {terminating ? '[ TERMINATING... ]' : '[ TERMINATE OTHER SESSIONS ]'}
        </button>
        {' '}
        <button
          onClick={handleSuperTerminate}
          disabled={superTerminating || terminating}
          style={{ ...btn, color: '#c00', borderColor: '#c00', fontSize: '12px' }}
        >
          {superTerminating ? '[ SUPER TERMINATING... ]' : '[ ⚡ SUPER TERMINATE ALL ]'}
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

      {/* ── PDF Link Option ── */}
      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          opacity: 0.5,
        }}
      >
        <a
          href="/api/pdf"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...btn,
            textDecoration: 'none',
            fontSize: '11px',
            color: '#000',
          }}
        >
          [ PDF ]
        </a>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────

const Home: NextPage<PageProps> = ({ initialView, vaultId }) => {
  const [view, setView] = useState<ViewType>(initialView)

  if (view === 'login') {
    return (
      <LoginPage
        vaultId={vaultId}
        onSuccess={() => setView('vault')}
      />
    )
  }

  if (view === 'vault') {
    return (
      <VaultPage
        vaultId={vaultId}
        onLogout={() => setView('broken')}
      />
    )
  }

  return <BrokenPage />
}

export default Home

// ─── Server-Side Props ────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const { getDb } = await import('../lib/db')
  const { sys, mode } = ctx.query

  // ── Helper: validate a session in any collection ──────────────
  async function checkSession(cookieName: string, collection: string): Promise<boolean> {
    const token = ctx.req.cookies?.[cookieName]
    if (!token) return false
    const db = await getDb()
    const session = await db.collection(collection).findOne({ token })
    if (!session || !session.active) return false
    if (new Date() > new Date(session.expiresAt)) return false
    return true
  }

  // sys must always be 'repair' — otherwise show broken page
  if (sys !== 'repair' || typeof mode !== 'string') {
    return { props: { initialView: 'broken', vaultId: 1 } }
  }

  // ── Vault 1 (?111) ───────────────────────────────────────────
  if (mode === process.env.SECRET_ACCESS_KEY) {
    const valid = await checkSession('vault_token', 'sessions')
    return { props: { initialView: valid ? 'vault' : 'login', vaultId: 1 } }
  }

  // ── Vault 2 (?222) ───────────────────────────────────────────
  if (mode === process.env.VAULT2_ACCESS_KEY) {
    const valid = await checkSession('vault2_token', 'sessions2')
    return { props: { initialView: valid ? 'vault' : 'login', vaultId: 2 } }
  }

  // ── Vault 3 (?333) ───────────────────────────────────────────
  if (mode === process.env.VAULT3_ACCESS_KEY) {
    const valid = await checkSession('vault3_token', 'sessions3')
    return { props: { initialView: valid ? 'vault' : 'login', vaultId: 3 } }
  }

  // ── Default: show broken page ─────────────────────────────────
  return { props: { initialView: 'broken', vaultId: 1 } }
}