import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../components/button'
import { Input } from '../components/input'
import { Textarea } from '../components/textarea'
import { Label } from '../components/label'
import PreviewWindow from '../components/preview-window'
import { Toaster } from '../components/sonner'
import { toast } from 'sonner'
import { Send, Copy, Loader2 } from 'lucide-react'

function Generator() {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    contactNumber: '',
    emailAddress: '',
    website: '',
    socialLinks: '',
    logo: ''
  })
  const [chatPrompt, setChatPrompt] = useState('')
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopyDisabled, setIsCopyDisabled] = useState(true)
  const previewFrameRef = useRef(null)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGeneratedHtml('')
    setIsCopyDisabled(true)

    try {
      const response = await fetch('/api/generate-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userPrompt: chatPrompt
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || errorData.details || `Server error: ${response.status}`)
      }

      const data = await response.json()
      const html = data.html || data.signature || ''
      
      if (!html) {
        throw new Error('No HTML signature was generated')
      }

      setGeneratedHtml(html)
      setIsCopyDisabled(false)
      updatePreview(html)
      toast.success("Signature Generated", {
        description: "Your email signature has been created"
      })
    } catch (error) {
      console.error('Error generating signature:', error)
      toast.error("Generation Failed", {
        description: error.message || "Failed to generate signature. Please try again."
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedHtml) return

    const html = generatedHtml

    // Try to use Clipboard API with text/html for rich paste
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        const blob = new Blob([html], { type: "text/html" })
        const data = [new ClipboardItem({ "text/html": blob })]
        await navigator.clipboard.write(data)
        toast.success("Signature Copied", {
          description: "Paste it into your email client"
        })
        return
      } catch (err) {
        console.warn("Rich clipboard failed, falling back to text-only copy.", err)
      }
    }

    // Fallback: copy as text
    try {
      await navigator.clipboard.writeText(html)
      toast.success("Signature Copied", {
        description: "Paste it into your email client"
      })
    } catch (err) {
      console.error("Copy failed", err)
      toast.error("Copy Failed", {
        description: "Please try selecting and copying manually"
      })
    }
  }

  const updatePreview = (html) => {
    if (!previewFrameRef.current) return
    
    const doc = previewFrameRef.current.contentDocument || previewFrameRef.current.contentWindow.document
    doc.open()
    if (!html) {
      doc.write("<!doctype html><html><head><meta charset='utf-8'></head><body style='font-family:system-ui; font-size:12px; color:#9ca3af; display:flex; align-items:center; justify-content:center; height:120px;'>Signature preview will appear here after you generate it.</body></html>")
    } else {
      doc.write(
        "<!doctype html><html><head><meta charset='utf-8'></head><body>" +
        html +
        "</body></html>"
      )
    }
    doc.close()

    // Adjust iframe height to content
    setTimeout(() => {
      try {
        const body = doc.body
        const height = body.scrollHeight || 150
        previewFrameRef.current.style.height = Math.max(height, 150) + "px"
      } catch (e) {
        // ignore
      }
    }, 50)
  }

  useEffect(() => {
    updatePreview("")
  }, [])

  useEffect(() => {
    if (generatedHtml) {
      updatePreview(generatedHtml)
    }
  }, [generatedHtml])

  const handleChatSubmit = (e) => {
    e.preventDefault()
    if (chatPrompt.trim() && !isGenerating) {
      handleGenerate()
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-68px)]" style={{ backgroundColor: '#F7FAF9' }}>
        {/* Left Sidebar */}
        <div className="w-full md:w-96 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col md:h-[calc(100vh-68px)]">
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="hivory-h5 mb-6">Your Information</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                  Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="position" className="text-sm font-medium text-gray-700 mb-2 block">
                  Position
                </Label>
                <Input
                  id="position"
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="Senior Developer"
                />
              </div>

              <div>
                <Label htmlFor="contactNumber" className="text-sm font-medium text-gray-700 mb-2 block">
                  Contact Number
                </Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="emailAddress" className="text-sm font-medium text-gray-700 mb-2 block">
                  Email Address *
                </Label>
                <Input
                  id="emailAddress"
                  type="email"
                  value={formData.emailAddress}
                  onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Label htmlFor="website" className="text-sm font-medium text-gray-700 mb-2 block">
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="socialLinks" className="text-sm font-medium text-gray-700 mb-2 block">
                  Social Links
                </Label>
                <Textarea
                  id="socialLinks"
                  value={formData.socialLinks}
                  onChange={(e) => handleInputChange('socialLinks', e.target.value)}
                  className="w-full min-h-[80px] text-sm resize-y"
                  placeholder="LinkedIn: https://linkedin.com/in/johndoe&#10;Twitter: https://twitter.com/johndoe&#10;GitHub: https://github.com/johndoe"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter one link per line (e.g., LinkedIn: https://...)
                </p>
              </div>

              <div>
                <Label htmlFor="logo" className="text-sm font-medium text-gray-700 mb-2 block">
                  Logo URL
                </Label>
                <Input
                  id="logo"
                  type="url"
                  value={formData.logo}
                  onChange={(e) => handleInputChange('logo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a URL to your logo image
                </p>
              </div>
            </div>
          </div>

          {/* Chat Input at Bottom */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <form onSubmit={handleChatSubmit}>
              <Label htmlFor="chatPrompt" className="text-sm font-medium text-gray-700 mb-2 block">
                Additional Instructions (Optional)
              </Label>
              <div className="flex gap-2 items-start">
                <Textarea
                  id="chatPrompt"
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                  className="flex-1 min-h-[60px] text-sm resize-none"
                  placeholder="E.g., Make it modern and minimalist, use blue colors, include a banner..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleChatSubmit(e)
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={isGenerating || !formData.name || !formData.emailAddress}
                  className="rounded-full h-auto px-4 py-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Press Cmd/Ctrl + Enter to generate
              </p>
            </form>
          </div>
        </div>

        {/* Main Preview Area - single iframe; centering matches Editor (fixed height + flex center on desktop) */}
        <div className="flex-1 w-full flex flex-col">
          <div className="flex-1 flex md:items-center md:justify-center px-6 py-6 md:py-0 min-h-0">
            <div className="w-full max-w-[40rem]">
              <p className="hivory-paragraph-medium text-gray-600 mb-6 text-center md:text-left">
                Fill in your information and let AI create a world-class email signature
              </p>
              <PreviewWindow
                footer={
                  <Button
                    onClick={handleCopy}
                    disabled={isCopyDisabled}
                    className="rounded-full"
                  >
                    <Copy className="h-4 w-4" />
                    Copy signature
                  </Button>
                }
              >
                <iframe
                  ref={previewFrameRef}
                  title="Signature preview"
                  className="w-full border-0 bg-white min-h-[200px]"
                />
              </PreviewWindow>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  )
}

export default Generator

