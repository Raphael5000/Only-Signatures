import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/card'
import { Input } from '../components/input'
import { Label } from '../components/label'
import { Button } from '../components/button'
import { Search, X } from 'lucide-react'

const DATA_URL = '/data/inspiration-signatures.json'

function filterSignatures(signatures, query) {
  if (!signatures?.length) return []
  const q = (query || '').trim().toLowerCase()
  if (!q) return signatures
  return signatures.filter((s) => {
    const title = (s.title || '').toLowerCase()
    const desc = (s.description || '').toLowerCase()
    const category = (s.category || '').toLowerCase()
    const tags = (s.tags || []).map((t) => t.toLowerCase())
    return (
      title.includes(q) ||
      desc.includes(q) ||
      category.includes(q) ||
      tags.some((t) => t.includes(q))
    )
  })
}

function SignaturePreview({ signatureHtml, className = '', thumbnail = false }) {
  const scale = thumbnail ? 0.48 : 1
  return (
    <div
      className={className}
      style={
        thumbnail
          ? {
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: `${100 / scale}%`,
              minHeight: `${220 / scale}px`,
            }
          : undefined
      }
    >
      <div
        className="bg-white p-4 min-h-[120px]"
        style={thumbnail ? { width: '320px' } : undefined}
        dangerouslySetInnerHTML={{ __html: signatureHtml }}
      />
    </div>
  )
}

function Inspiration() {
  const [signatures, setSignatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [detailSignature, setDetailSignature] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Could not load signatures')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setSignatures(data.signatures || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const filtered = filterSignatures(signatures, searchQuery)

  return (
    <div className="min-h-[calc(100vh-68px)] p-6" style={{ backgroundColor: '#F7FAF9' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inspiration</h1>
          <p className="text-gray-600">
            Browse signature styles to get ideas. Search by style, category or keyword. Click a tile to view full size.
          </p>
        </div>

        <div className="mb-6">
          <Label htmlFor="inspiration-search" className="sr-only">
            Search signatures
          </Label>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="inspiration-search"
              type="search"
              placeholder="Search by style, category or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading && (
          <div className="text-center py-12 text-gray-500">Loading signatures…</div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'No signatures match your search.' : 'No signatures yet.'}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((sig) => (
              <Card
                key={sig.id}
                className={`overflow-hidden bg-white transition-shadow ${
                  sig.signatureHtml
                    ? 'cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-gray-200'
                    : 'hover:shadow-md'
                }`}
                onClick={() => sig.signatureHtml && setDetailSignature(sig)}
              >
                <div className="aspect-[2/1] bg-gray-100 overflow-hidden flex items-center justify-center p-2">
                  {sig.signatureHtml ? (
                    <div className="w-full h-full overflow-hidden flex items-start justify-center bg-white rounded">
                      <SignaturePreview
                        signatureHtml={sig.signatureHtml}
                        thumbnail
                        className="origin-top"
                      />
                    </div>
                  ) : (
                    <img
                      src={sig.imageUrl}
                      alt=""
                      className="w-full h-full object-cover object-top"
                    />
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {sig.category && (
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {sig.category}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg">{sig.title}</CardTitle>
                  {sig.description && (
                    <CardDescription className="line-clamp-3">
                      {sig.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  {Array.isArray(sig.tags) && sig.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {sig.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {sig.signatureHtml && (
                    <p className="text-xs text-gray-500 mt-2">Click to view full signature</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Full-signature modal */}
      {detailSignature?.signatureHtml && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setDetailSignature(null)}
          role="dialog"
          aria-modal="true"
          aria-label="View signature"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">{detailSignature.title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetailSignature(null)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              <div
                className="bg-white border border-gray-200 rounded-lg p-6 inline-block min-w-0"
                dangerouslySetInnerHTML={{ __html: detailSignature.signatureHtml }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inspiration
