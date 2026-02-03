import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../components/button'
import { Textarea } from '../components/textarea'
import { Label } from '../components/label'
import { Input } from '../components/input'
import { Switch } from '../components/switch'
import PreviewWindow from '../components/preview-window'
import { Toaster } from '../components/sonner'
import { toast } from 'sonner'
import { Copy, RotateCcw } from 'lucide-react'

function Editor() {
  const [signatureHtml, setSignatureHtml] = useState('')
  const [detectedFields, setDetectedFields] = useState([])
  const [originalHtml, setOriginalHtml] = useState('')
  const [outputHtml, setOutputHtml] = useState('')
  const [detectStatus, setDetectStatus] = useState('')
  const [noFieldsMsg, setNoFieldsMsg] = useState('')
  const [fieldValues, setFieldValues] = useState({})
  const [isGenerateDisabled, setIsGenerateDisabled] = useState(true)
  const [isCopyDisabled, setIsCopyDisabled] = useState(true)
  const [isDetecting, setIsDetecting] = useState(false)
  const previewFrameRef = useRef(null)

  const resetUI = () => {
    setOriginalHtml('')
    setDetectedFields([])
    setDetectStatus('')
    setOutputHtml('')
    setNoFieldsMsg('')
    setFieldValues({})
    setIsGenerateDisabled(true)
    setIsCopyDisabled(true)
    updatePreview('')
  }

  const handleClear = () => {
    setSignatureHtml('')
    resetUI()
  }

  const escapeHtml = (str) => {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
  }

  const getTextNodes = (node) => {
    const textNodes = []
    function walk(n) {
      if (n.nodeType === Node.TEXT_NODE) {
        textNodes.push(n)
      } else {
        n.childNodes.forEach(walk)
      }
    }
    walk(node)
    return textNodes
  }

  const detectFieldsFromHtml = (html) => {
    const fields = []

    // Parse HTML
    const wrapperHtml = "<div>" + html + "</div>"
    let doc
    try {
      const parser = new DOMParser()
      doc = parser.parseFromString(wrapperHtml, "text/html")
    } catch (e) {
      doc = null
    }

    // Helper to extract text content (removing HTML tags)
    const getTextContent = (str) => {
      if (!doc) return str.replace(/<[^>]+>/g, '').trim()
      const temp = doc.createElement('div')
      temp.innerHTML = str
      return temp.textContent || temp.innerText || ''
    }

    // 1) Email - detect both displayed text and mailto: link
    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
    let emailValue = null
    const emailTextMatches = html.match(emailRegex) || []
    
    // Find mailto: links first (prioritize)
    if (doc) {
      const mailtoLinks = doc.querySelectorAll('a[href^="mailto:"]')
      if (mailtoLinks.length > 0) {
        emailValue = mailtoLinks[0].getAttribute('href').replace('mailto:', '').trim()
      }
    }
    
    // If no mailto link, use first email found in text
    if (!emailValue && emailTextMatches.length > 0) {
      emailValue = emailTextMatches[0]
    }
    
    if (emailValue) {
      // Collect all instances to replace (both text and mailto: links)
      const targetsToReplace = new Set()
      targetsToReplace.add(emailValue)
      targetsToReplace.add(`mailto:${emailValue}`)
      
      // Also add any other email matches that might be the same
      emailTextMatches.forEach(match => {
        if (match.toLowerCase() === emailValue.toLowerCase()) {
          targetsToReplace.add(match)
        }
      })
      
      fields.push({
        key: "email",
        label: "Email",
        originalValue: emailValue,
        suggestedValue: emailValue,
        enabled: true,
        replacementTargets: Array.from(targetsToReplace)
      })
    }

    // 2) Phone - detect both displayed text and tel: link
    const phoneRegex = /(\+?\d[\d\s().-]{7,}\d)/g
    let phoneValue = null
    const phoneTextMatches = html.match(phoneRegex) || []
    
    // Find tel: links first (prioritize)
    if (doc) {
      const telLinks = doc.querySelectorAll('a[href^="tel:"]')
      if (telLinks.length > 0) {
        phoneValue = telLinks[0].getAttribute('href').replace('tel:', '').trim()
      }
    }
    
    // If no tel link, use first phone found in text
    if (!phoneValue && phoneTextMatches.length > 0) {
      phoneValue = phoneTextMatches[0].trim()
    }
    
    if (phoneValue) {
      // Collect all instances to replace (both text and tel: links)
      const targetsToReplace = new Set()
      targetsToReplace.add(phoneValue)
      targetsToReplace.add(`tel:${phoneValue}`)
      
      // Also add any other phone matches that might be the same (normalize for comparison)
      const normalizePhone = (p) => p.replace(/[\s().-]/g, '')
      const normalizedPhoneValue = normalizePhone(phoneValue)
      
      phoneTextMatches.forEach(match => {
        const normalizedMatch = normalizePhone(match.trim())
        if (normalizedMatch === normalizedPhoneValue) {
          targetsToReplace.add(match.trim())
        }
      })
      
      fields.push({
        key: "phone",
        label: "Phone",
        originalValue: phoneValue,
        suggestedValue: phoneValue,
        enabled: true,
        replacementTargets: Array.from(targetsToReplace)
      })
    }

    // 3) Name - look for name patterns or first meaningful text
    let nameFound = false
    
    // Check for label patterns
    const namePatterns = [
      /(?:name|full\s*name|your\s*name)[\s:]*([^\n<]+)/i,
      /full\s*name/i,
      /your\s*name/i
    ]
    
    for (const pattern of namePatterns) {
      const match = html.match(pattern)
      if (match) {
        const nameValue = match[1] ? match[1].trim() : match[0].trim()
        if (nameValue && nameValue.length > 0) {
          fields.push({
            key: "name",
            label: "Name",
            originalValue: nameValue,
            suggestedValue: nameValue === match[0] ? "" : nameValue,
            enabled: true
          })
          nameFound = true
          break
        }
      }
    }

    // If no name found, try to detect from text nodes (first capitalized text that looks like a name)
    if (!nameFound && doc) {
      const textNodes = getTextNodes(doc.body)
        .map((n) => n.nodeValue.trim())
        .filter((t) => t.length >= 2 && t.length <= 50)
      
      for (const text of textNodes) {
        // Check if it looks like a name (starts with capital, has letters, not email/phone/url)
        if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(text) && 
            !emailRegex.test(text) && 
            !phoneRegex.test(text) &&
            !text.match(/https?:\/\/|www\./i)) {
          fields.push({
            key: "name",
            label: "Name",
            originalValue: text,
            suggestedValue: text,
            enabled: true
          })
          nameFound = true
          break
        }
      }
    }

    // 4) Position - look for position/title patterns
    const positionPatterns = [
      /(?:position|job\s*position|title|job\s*title|role)[\s:]*([^\n<]+)/i,
      /this\s*is\s*a\s*title/i,
      /your\s*position/i,
      /your\s*title/i
    ]
    
    for (const pattern of positionPatterns) {
      const match = html.match(pattern)
      if (match) {
        const positionValue = match[1] ? match[1].trim() : match[0].trim()
        if (positionValue && positionValue.length > 0) {
          fields.push({
            key: "position",
            label: "Position",
            originalValue: positionValue,
            suggestedValue: positionValue === match[0] ? "" : positionValue,
            enabled: true
          })
          break
        }
      }
    }

    // 5) Social Links - detect social media links
    const socialDomains = [
      'linkedin.com', 'twitter.com', 'x.com', 'facebook.com', 'instagram.com',
      'youtube.com', 'github.com', 'behance.net', 'dribbble.com', 'pinterest.com'
    ]
    
    if (doc) {
      const links = doc.querySelectorAll('a[href]')
      const socialLinks = []
      
      links.forEach((link) => {
        const href = link.getAttribute('href')
        if (href && href.startsWith('http')) {
          const url = new URL(href)
          const domain = url.hostname.replace('www.', '')
          if (socialDomains.some(social => domain.includes(social))) {
            socialLinks.push({
              href: href,
              text: link.textContent.trim() || href
            })
          }
        }
      })
      
      if (socialLinks.length > 0) {
        // Combine all social links into one field
        const allLinks = socialLinks.map(l => l.href).join(', ')
        fields.push({
          key: "socialLinks",
          label: "Social Links",
          originalValue: allLinks,
          suggestedValue: allLinks,
          enabled: true,
          // Store individual links for replacement
          replacementTargets: socialLinks.map(l => l.href)
        })
      }
    }

    // 6) Address - look for address patterns
    const addressPatterns = [
      /(?:address|location)[\s:]*([^\n<]+)/i
    ]
    
    for (const pattern of addressPatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        const addressValue = match[1].trim()
        if (addressValue && addressValue.length > 0) {
          fields.push({
            key: "address",
            label: "Address",
            originalValue: addressValue,
            suggestedValue: addressValue,
            enabled: true
          })
          break
        }
      }
    }

    return fields
  }

  const handleDetect = async () => {
    const html = signatureHtml.trim()
    resetUI()

    if (!html) {
      setDetectStatus("<strong>Nothing to scan.</strong> Paste your signature HTML first.")
      return
    }

    setIsDetecting(true)
    setDetectStatus("<strong>Analyzing signature with AI...</strong> This may take a few seconds.")
    setOriginalHtml(html)

    try {
      const response = await fetch('/api/detect-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || errorData.details || `Server error: ${response.status}`)
      }

      const data = await response.json()
      let fields = data.fields || []

      // Ensure all fields have unique keys (handle duplicates)
      const keyCounts = {}
      fields = fields.map((field, index) => {
        const baseKey = field.key || `field_${index}`
        let uniqueKey = baseKey
        let counter = 1
        
        // If key already exists, make it unique by appending a number
        while (keyCounts[uniqueKey]) {
          uniqueKey = `${baseKey}_${counter}`
          counter++
        }
        keyCounts[uniqueKey] = true
        
        return {
          ...field,
          key: uniqueKey,
          // Update label to show it's a duplicate if needed
          label: counter > 1 ? `${field.label || baseKey} ${counter - 1}` : (field.label || baseKey)
        }
      })

      setDetectedFields(fields)
      
      // Initialize field values
      const initialValues = {}
      fields.forEach(field => {
        initialValues[field.key] = field.suggestedValue || field.originalValue || ""
      })
      setFieldValues(initialValues)

      if (fields.length === 0) {
        setDetectStatus("<strong>No fields detected.</strong> The AI couldn't find any editable fields. You can still manually replace values later by editing the HTML.")
        setNoFieldsMsg("Tip: Make sure your signature contains clear fields like name, email, phone, position, etc.")
      } else {
        setDetectStatus(`<strong>Found ${fields.length} field(s) using AI.</strong> Toggle fields on/off and edit values below. Preview updates as you type.`)
        setIsGenerateDisabled(false)
      }
    } catch (error) {
      console.error('Error detecting fields:', error)
      setDetectStatus(`<strong>Error detecting fields.</strong> ${error.message || 'Please try again or check your connection.'}`)
      setNoFieldsMsg("If this persists, you can still manually edit the HTML.")
      toast.error("Detection Failed", {
        description: error.message || "Failed to detect fields. Please try again."
      })
    } finally {
      setIsDetecting(false)
    }
  }

  const handleFieldChange = (key, value) => {
    setFieldValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleFieldToggle = (key, nextEnabled) => {
    setDetectedFields(prev =>
      prev.map(field =>
        field.key === key 
          ? { 
              ...field, 
              enabled: typeof nextEnabled === 'boolean' 
                ? nextEnabled 
                : !(field.enabled !== false) 
            }
          : field
      )
    )
  }

  // Compute updated HTML from original + detected fields + current values (used for preview and copy)
  const computeUpdatedHtml = (html, fields, values) => {
    if (!html) return ''
    if (!fields || fields.length === 0) return html

    let updatedHtml = html
    const enabledFields = fields
      .filter((field) => field.enabled !== false)
      .sort((a, b) => (b.originalValue?.length || 0) - (a.originalValue?.length || 0))

    enabledFields.forEach((field) => {
      const newValue = values[field.key] ?? field.originalValue ?? ''
      if (field.originalValue == null) return

      if (field.replacementTargets && Array.isArray(field.replacementTargets)) {
        field.replacementTargets.forEach((target) => {
          updatedHtml = updatedHtml.split(target).join(newValue)
        })
        if (field.key === 'email') {
          const emailRegex = new RegExp(`mailto:${(field.originalValue || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
          updatedHtml = updatedHtml.replace(emailRegex, `mailto:${newValue}`)
        }
        if (field.key === 'phone') {
          const normalizePhone = (p) => String(p).replace(/[\s().-]/g, '')
          const normalizedOriginal = normalizePhone(field.originalValue)
          updatedHtml = updatedHtml.replace(/tel:([\d\s().+-]+)/gi, (match, telValue) => {
            if (normalizePhone(telValue.trim()) === normalizedOriginal) return `tel:${newValue}`
            return match
          })
        }
        if (field.key && (field.key.includes('linkedin') || field.key.includes('twitter') || field.key.includes('facebook') || field.key.includes('instagram') || field.key.includes('youtube') || field.key.includes('github') || field.key.includes('social'))) {
          const escapedOriginal = (field.originalValue || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const hrefRegex = new RegExp(`href=["']${escapedOriginal}["']`, 'gi')
          updatedHtml = updatedHtml.replace(hrefRegex, `href="${newValue}"`)
        }
      } else {
        updatedHtml = updatedHtml.split(field.originalValue).join(newValue)
      }
    })
    return updatedHtml
  }

  // Live preview: when originalHtml or fields/values change, update preview and outputHtml
  useEffect(() => {
    if (!originalHtml) return
    const computed = computeUpdatedHtml(originalHtml, detectedFields, fieldValues)
    setOutputHtml(computed)
    setIsCopyDisabled(!computed.trim())
    updatePreview(computed)
  }, [originalHtml, detectedFields, fieldValues])

  const handleGenerate = () => {
    if (!originalHtml) return
    const computed = computeUpdatedHtml(originalHtml, detectedFields, fieldValues)
    setOutputHtml(computed)
    setIsCopyDisabled(!computed.trim())
    updatePreview(computed)
  }

  const handleCopy = async () => {
    if (!outputHtml) return

    const html = outputHtml

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

    // Fallback: copy as plain text
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

    // Adjust iframe height to content (roughly)
    setTimeout(() => {
      try {
        const body = doc.body
        const height = body.scrollHeight || 150
        previewFrameRef.current.style.height = Math.min(Math.max(height, 150), 600) + "px"
      } catch (e) {
        // ignore
      }
    }, 50)
  }

  useEffect(() => {
    updatePreview("")
  }, [])

  return (
    <>
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-68px)]" style={{ backgroundColor: '#F7FAF9' }}>
        {/* Left Sidebar */}
        <div className="w-full md:w-96 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col md:h-[calc(100vh-68px)]">
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="hivory-h5 mb-6">Create your email signature</h2>

            {/* Paste HTML */}
            <div className="space-y-3 mb-6">
              <Textarea
                id="signatureInput"
                value={signatureHtml}
                onChange={(e) => setSignatureHtml(e.target.value)}
                className="w-full min-h-[120px] font-mono text-sm resize-y"
                placeholder="Paste your HTML email signature here..."
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleDetect}
                  className="rounded-full"
                  disabled={isDetecting}
                >
                  {isDetecting ? 'Detecting...' : 'Find fields'}
                </Button>
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="rounded-full"
                  type="button"
                >
                  Clear
                </Button>
              </div>
              {detectStatus && (
                <div
                  className="hivory-paragraph-small text-gray-500"
                  dangerouslySetInnerHTML={{ __html: detectStatus }}
                />
              )}
            </div>

            {/* Edit detected fields */}
            <div className="space-y-4">
              {detectedFields.length > 0 ? (
                <>
                  <p className="text-xs text-gray-500">
                    Toggle fields on/off to control which will be replaced.
                  </p>
                  <div className="space-y-3">
                    {detectedFields.map((field) => (
                      <div
                        key={field.key}
                        className={`space-y-2 p-3 rounded-md border ${
                          field.enabled
                            ? 'border-gray-300 bg-white'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`field-${field.key}`}
                            checked={field.enabled !== false}
                            onCheckedChange={(checked) => handleFieldToggle(field.key, checked)}
                          />
                          <Label
                            htmlFor={`field-${field.key}`}
                            className={`text-sm font-medium ${
                              field.enabled ? 'text-gray-700' : 'text-gray-500'
                            }`}
                          >
                            {field.label}
                          </Label>
                        </div>
                        <Input
                          type="text"
                          value={fieldValues[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          disabled={!field.enabled}
                          className={!field.enabled ? 'bg-gray-100 cursor-not-allowed' : ''}
                        />
                        <small className="block text-xs text-gray-500">
                          Original: <code className="font-mono">{escapeHtml(field.originalValue || '')}</code>
                        </small>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                noFieldsMsg ? (
                  <p className="hivory-paragraph-small text-gray-500">
                    {noFieldsMsg}
                  </p>
                ) : null
              )}
            </div>
          </div>

          {/* Bottom actions */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <Button
              onClick={handleGenerate}
              disabled={isGenerateDisabled}
              className="rounded-full w-full"
            >
              Generate
            </Button>
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 w-full">
          {/* Desktop: fixed-centered preview */}
          <div className="hidden md:flex h-[calc(100vh-68px)] items-center justify-center px-6">
            <div className="w-full max-w-[40rem]">
              <PreviewWindow
                footer={
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClear}
                      className="rounded-full"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Clear fields
                    </Button>
                    <Button
                      onClick={handleCopy}
                      disabled={isCopyDisabled}
                      className="rounded-full"
                    >
                      <Copy className="h-4 w-4" />
                      Copy signature
                    </Button>
                  </>
                }
              >
                <iframe
                  ref={previewFrameRef}
                  title="Signature preview"
                  className="w-full border-0 bg-white min-h-[200px] block"
                  style={{ maxHeight: '600px' }}
                />
              </PreviewWindow>
            </div>
          </div>
          {/* Mobile: stacked preview */}
          <div className="md:hidden px-6 py-6">
            <div className="w-full max-w-[40rem] mx-auto">
              <PreviewWindow
                footer={
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClear}
                      className="rounded-full"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Clear fields
                    </Button>
                    <Button
                      onClick={handleCopy}
                      disabled={isCopyDisabled}
                      className="rounded-full"
                    >
                      <Copy className="h-4 w-4" />
                      Copy signature
                    </Button>
                  </>
                }
              >
                <iframe
                  ref={previewFrameRef}
                  title="Signature preview"
                  className="w-full border-0 bg-white min-h-[200px] block"
                  style={{ maxHeight: '600px' }}
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

export default Editor

