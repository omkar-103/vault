// pages/index.tsx
import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────

type ViewType = 'broken' | 'login' | 'vault'
type VaultId = 1 | 2 | 3 | 4 | 5

interface VaultItem {
  _id: string
  title: string
  code: string
  imageId?: string | null
  fileId?: string | null
  externalUrl?: string | null
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

  const loginEndpoint = 
    vaultId === 1 ? '/api/auth/login' : 
    vaultId === 2 ? '/api/auth/login2' : 
    vaultId === 3 ? '/api/auth/login3' : 
    vaultId === 4 ? '/api/auth/login4' : 
                    '/api/auth/login5'

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
    <div style={base} className={vaultId === 4 || vaultId === 3 || vaultId === 5 ? "vault-dark-container" : ""}>
      {(vaultId === 4 || vaultId === 3 || vaultId === 5) && (
        <style>{`
          html, body { background-color: #000 !important; }
          .vault-dark-container { background-color: #000 !important; color: #fff !important; min-height: 100vh; box-sizing: border-box; }
          .vault-dark-container button { color: #fff !important; border-color: #fff !important; }
          .vault-dark-container button:disabled { color: #666 !important; border-color: #666 !important; }
          .vault-dark-container input { color: #fff !important; border-bottom-color: #fff !important; background: transparent !important; }
          .vault-dark-container pre { color: #fff !important; }
        `}</style>
      )}
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
  const [showPdf, setShowPdf] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchCount, setSearchCount] = useState<number | null>(null)
  const [isSearchingPdf, setIsSearchingPdf] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'file' | 'code'>(vaultId === 5 ? 'file' : 'code')
  const blobRefs = useRef<string[]>([])

  const itemsEndpoint = 
    vaultId === 1 ? '/api/vault/items' : 
    vaultId === 2 ? '/api/vault2/items' : 
    vaultId === 3 ? '/api/vault3/items' : 
    vaultId === 4 ? '/api/vault4/items' : 
                    '/api/vault5/items'
  const logoutEndpoint = 
    vaultId === 1 ? '/api/auth/logout' : 
    vaultId === 2 ? '/api/auth/logout2' : 
    vaultId === 3 ? '/api/auth/logout3' : 
    vaultId === 4 ? '/api/auth/logout4' : 
                    '/api/auth/logout5'

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

  // Auto-submit the hidden secure form when the PDF frame mounts or search updates
  useEffect(() => {
    if (showPdf) {
        const form = document.getElementById('secure-pdf-form') as HTMLFormElement | null;
        if (form) form.submit();
    }
  }, [showPdf, iframeKey]);

  // Keyboard shortcut to close the secure document securely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPdf) {
        setShowPdf(false);
        setSearchCount(null);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPdf]);

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
    if (!newTitle.trim()) return
    if (activeTab === 'code' && !newCode.trim()) return
    if (activeTab === 'file' && !newFile) return

    setSaving(true)
    setStatus('Saving...')
    setUploadProgress(0)

    try {
      let imageId: string | null = null
      let fileId: string | null = null

      if (newFile) {
        const formData = new FormData()
        const uploadUrl = vaultId === 5 ? '/api/vault5/upload' : '/api/upload'
        formData.append(vaultId === 5 ? 'file' : 'image', newFile)

        const uploadedId = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', uploadUrl)
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100)
              setUploadProgress(percent)
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const res = JSON.parse(xhr.responseText)
              resolve(res.fileId || res.imageId)
            } else {
              reject(new Error('Upload failed'))
            }
          }

          xhr.onerror = () => reject(new Error('Network error'))
          xhr.send(formData)
        })

        if (vaultId === 5) fileId = uploadedId
        else imageId = uploadedId
      }

      setUploadProgress(null)
      setStatus('Finalizing...')

      const res = await fetch(itemsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            title: newTitle.trim(), 
            code: activeTab === 'code' ? newCode : '', 
            imageId,
            fileId
        }),
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
    } catch (err) {
      console.error(err)
      setStatus('Error occurred.')
    } finally {
      setSaving(false)
      setUploadProgress(null)
    }
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
      '⚠️ SUPER TERMINATE: This will log out ALL sessions across ALL 4 vaults.\nYour own current session will remain active.\n\nAre you sure?'
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
    <div style={{ ...base, maxWidth: '860px' }} className={vaultId === 4 || vaultId === 3 || vaultId === 5 ? "vault-dark-container" : ""}>
      {(vaultId === 4 || vaultId === 3 || vaultId === 5) && (
        <style>{`
          html, body { background-color: #000 !important; }
          .vault-dark-container { background-color: #000 !important; color: #fff !important; min-height: 100vh; box-sizing: border-box; }
          .vault-dark-container button, .vault-dark-container a.btn-link { color: #fff !important; border-color: #fff !important; }
          .vault-dark-container button:disabled { color: #666 !important; border-color: #666 !important; }
          .vault-dark-container input, .vault-dark-container textarea { color: #fff !important; border-color: #fff !important; background: #111 !important; }
          .vault-dark-container hr { border-top-color: #fff !important; }
          .vault-dark-container .vault-item { border-left-color: #fff !important; }
          .vault-dark-container pre { color: #fff !important; }
          .vault-dark-container pre.vault-code { background: #000 !important; color: #ccc !important; border-color: #333 !important; }
          .vault-dark-container pre.vault-code::selection { background: rgba(50, 151, 253, 0.5) !important; color: #fff !important; }
        `}</style>
      )}
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
          <pre style={{ margin: '0 0 8px' }}>{`> NEW ${activeTab === 'file' ? 'FILE ASSET' : 'VAULT DATA'}`}</pre>
          
          {vaultId === 5 && (
            <div style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setActiveTab('file')}
                style={{ ...btn, background: activeTab === 'file' ? '#333' : 'transparent', color: activeTab === 'file' ? '#fff' : 'inherit' }}
              >
                [ SECTION 1: HIGH END FILES ]
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab('code')}
                style={{ ...btn, background: activeTab === 'code' ? '#333' : 'transparent', color: activeTab === 'code' ? '#fff' : 'inherit' }}
              >
                [ SECTION 2: VAULT STORE ]
              </button>
            </div>
          )}

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

          {activeTab === 'code' && (
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
                  background: (vaultId === 4 || vaultId === 3 || vaultId === 5) ? '#111' : '#f8f8f8',
                  border: '1px solid #999',
                  padding: '8px',
                  resize: 'vertical',
                  color: (vaultId === 4 || vaultId === 3 || vaultId === 5) ? '#fff' : '#000',
                  outline: 'none',
                }}
                placeholder="Paste code here..."
              />
            </div>
          )}

          {activeTab === 'file' && (
            <div style={{ marginBottom: '10px' }}>
              <span>{'FILE:   '}</span>
              <input
                type="file"
                accept="*"
                style={{ fontFamily: MONO, fontSize: '13px' }}
                onChange={e => setNewFile(e.target.files?.[0] ?? null)}
              />
              {newFile && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#aaa' }}>
                  {newFile.name} ({(newFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          )}

          {vaultId !== 5 && activeTab === 'code' && (
             <div style={{ marginBottom: '10px' }}>
                <span>{'IMAGE: '}</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ fontFamily: MONO, fontSize: '13px' }}
                  onChange={e => setNewFile(e.target.files?.[0] ?? null)}
                />
             </div>
          )}

          {uploadProgress !== null && (
            <div style={{ margin: '14px 0', width: '100%', background: '#222', height: '4px' }}>
                <div style={{ width: `${uploadProgress}%`, background: '#fff', height: '100%', transition: 'width 0.2s' }} />
                <div style={{ fontSize: '10px', marginTop: '4px', fontFamily: MONO }}>UPLOAD PROGRESS: {uploadProgress}%</div>
            </div>
          )}

          <button type="submit" disabled={saving} style={btn}>
            {saving ? '> Processing...' : `> [ STORE ${activeTab === 'file' ? 'FILE' : 'ITEM'} ]`}
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
          className="vault-item"
          style={{
            marginBottom: '28px',
            borderLeft: '3px solid #000',
            paddingLeft: '14px',
          }}
        >
          <div style={{ 
            margin: '0 0 6px',
            fontWeight: 'bold',
            fontFamily: MONO,
            fontSize: '14px',
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word',
            overflowWrap: 'anywhere'
          }}>
            {`TITLE: ${item.title}`}
          </div>

          <div style={{ marginBottom: '6px' }}>
            {item.code && (
              <button
                onClick={() => copyCode(item)}
                style={btn}
              >
                {copiedId === item._id ? '> [ COPIED ]' : '> [ COPY CODE ]'}
              </button>
            )}
            {item.code && (item.imageId || item.fileId) && ' '}
            {item.imageId && (
              <button
                onClick={() => loadImage(item.imageId!)}
                style={btn}
              >
                {'> [ LOAD IMAGE ]'}
              </button>
            )}
            {item.imageId && item.fileId && ' '}
            {item.fileId && (
              <a
                href={`/api/photo?id=${item.fileId}`}
                download
                className="btn-link"
                style={{ ...btn, textDecoration: 'none', display: 'inline-block' }}
              >
                {'> [ DOWNLOAD FILE ]'}
              </a>
            )}
            {item.externalUrl && (
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-link"
                style={{ ...btn, textDecoration: 'none', display: 'inline-block' }}
              >
                {'> [ DOWNLOAD FROM DRIVE ]'}
              </a>
            )}
            {' '}
            <button
              onClick={() => deleteItem(item._id)}
              style={{ ...btn, color: '#888', borderColor: '#888' }}
            >
              {'[ DELETE ]'}
            </button>
          </div>

          {item.code && (
            <pre
              className="vault-code"
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
          )}

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

      {/* ── PDF Link Option (Vault 2 Only) ── */}
      {vaultId === 2 && (
        <div
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            opacity: 0.5,
          }}
        >
          <button
            onClick={() => {
              setSearchQuery('');
              setShowPdf(true);
            }}
            style={{
              ...btn,
              fontSize: '11px',
              color: '#000',
            }}
          >
            [ PDF ]
          </button>
        </div>
      )}

      {/* ── PDF Popup Sub-System ── */}
      {showPdf && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div style={{
             width: '90%', 
             maxWidth: '1200px', 
             display: 'flex', 
             justifyContent: 'space-between', 
             alignItems: 'center',
             marginBottom: '8px'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontFamily: MONO, fontSize: '13px' }}>SEARCH PDF:</span>
              <input
                type="text"
                placeholder="Enter word..."
                disabled={isSearchingPdf}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.trim();
                    
                    if (!val) {
                      setSearchQuery('');
                      setSearchCount(null);
                      setIframeKey(k => k + 1); // Triggers re-render/re-submit without fragment
                      return;
                    }
                    
                    setIsSearchingPdf(true);
                    setSearchQuery(val);
                    
                    try {
                        const res = await fetch('/api/pdf-search', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query: val })
                        });
                        
                        if (res.ok) {
                            const data = await res.json();
                            setSearchCount(data.count);
                        }
                    } catch {
                        setSearchCount(null)
                    }

                    // Incrementing the key completely unmounts and remounts the iframe,
                    // which runs useEffect and violently pushes a fresh POST with the new #hash.
                    setIframeKey(k => k + 1);
                    setIsSearchingPdf(false);
                  }
                }}
                style={{
                  ...input,
                  background: '#111',
                  color: isSearchingPdf ? '#555' : '#fff',
                  borderBottom: '1px solid #555',
                  padding: '4px 8px',
                  width: '200px'
                }}
              />
              <span style={{ color: '#aaa', fontFamily: MONO, fontSize: '11px' }}>
                {isSearchingPdf ? 'Searching...' : searchCount !== null ? `(${searchCount} found)` : '(Press Enter)'}
              </span>
            </div>

            <button
              onClick={() => {
                setShowPdf(false);
                setSearchCount(null);
                setSearchQuery('');
              }}
              style={{
                ...btn, 
                background: '#fff', 
                fontWeight: 'bold',
                padding: '6px 12px'
              }}
            >
              [ CLOSE FILE ]
            </button>
          </div>
          
          <form 
            id="secure-pdf-form" 
            target="secure-pdf-frame" 
            action={`/api/pdf${searchQuery ? `#search=${encodeURIComponent(searchQuery)}` : ''}`}
            method="POST" 
            style={{ display: 'none' }} 
          />
          <iframe
            key={iframeKey}
            name="secure-pdf-frame"
            id="secure-pdf-frame"
            title="Secure Document Viewer"
            style={{
              width: '90%',
              maxWidth: '1200px',
              height: '85vh',
              border: '1px solid #fff',
              background: '#000',
            }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────

const Home: NextPage<PageProps> = ({ initialView, vaultId }) => {
  const [view, setView] = useState<ViewType>(initialView)

  useEffect(() => {
    // SECURITY FIX: Hide the sys/mode URL query parameters from the address bar, 
    // so network admins casually looking at the screen, local browser history, 
    // etc., will only see '/' in history, removing any traces.
    // It keeps your 111, 222, 333 functionality perfectly identical.
    if (window.location.search) {
      window.history.replaceState(null, '', window.location.pathname)
    }

    // ── GHOST PANIC PROTOCOL ──
    // Detects emergency hotkeys. If pressed, instantly self-destructs the UI
    // and permanently invalidates the server session cookie in the background.
    const handlePanic = (e: KeyboardEvent) => {
      const isShiftZ = e.shiftKey && e.key.toLowerCase() === 'z';
      const isAltX = e.altKey && e.key.toLowerCase() === 'x';
      
      if (isShiftZ || isAltX) {
        // 1. Instantly hide all visual vault data by crashing to broken page
        setView('broken');
        
        // 2. Eradicate the secure server session so a browser refresh won't restore access
        const logoutEndpoint = 
          vaultId === 1 ? '/api/auth/logout' : 
          vaultId === 2 ? '/api/auth/logout2' : 
          vaultId === 3 ? '/api/auth/logout3' :
          vaultId === 4 ? '/api/auth/logout4' :
                          '/api/auth/logout5';
                          
        fetch(logoutEndpoint, { method: 'POST' }).catch(() => {});
      }
    };

    window.addEventListener('keydown', handlePanic);
    return () => window.removeEventListener('keydown', handlePanic);
  }, [vaultId])

  if (view === 'login') {
    return (
      <>
        <Head><title>503 Service Unavailable</title></Head>
        <LoginPage
          vaultId={vaultId}
          onSuccess={() => setView('vault')}
        />
      </>
    )
  }

  if (view === 'vault') {
    return (
      <>
        <Head><title>503 Service Unavailable</title></Head>
        <VaultPage
          vaultId={vaultId}
          onLogout={() => setView('broken')}
        />
      </>
    )
  }

  return (
    <>
      <Head><title>503 Service Unavailable</title></Head>
      <BrokenPage />
    </>
  )
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

  // ── Vault 3 (?333) SHORT URL ──────────────────────────────────
  if (ctx.resolvedUrl?.includes(process.env.VAULT3_ACCESS_KEY || '?333')) {
    const valid = await checkSession('vault3_token', 'sessions3')
    return { props: { initialView: valid ? 'vault' : 'login', vaultId: 3 } }
  }

  // ── Vault 4 (?444) SHORT URL ──────────────────────────────────
  if (ctx.resolvedUrl?.includes(process.env.VAULT4_ACCESS_KEY || '?444')) {
    const valid = await checkSession('vault4_token', 'sessions4')
    return { props: { initialView: valid ? 'vault' : 'login', vaultId: 4 } }
  }

  // ── Vault 5 (?555) SHORT URL ──────────────────────────────────
  if (ctx.resolvedUrl?.includes(process.env.VAULT5_ACCESS_KEY || '?555')) {
    const valid = await checkSession('vault5_token', 'sessions5')
    return { props: { initialView: valid ? 'vault' : 'login', vaultId: 5 } }
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

  // ── Default: show broken page ─────────────────────────────────
  return { props: { initialView: 'broken', vaultId: 1 } }
}