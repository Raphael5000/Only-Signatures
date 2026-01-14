import React, { useState, useRef, useEffect } from 'react'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '../components/navigation-menu'
import { Button } from '../components/button'
import { Textarea } from '../components/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../components/card'
import { Label } from '../components/label'
import { Menu, X } from 'lucide-react'
import { Toaster } from '../components/sonner'
import { toast } from 'sonner'

function App() {
  const [signatureHtml, setSignatureHtml] = useState('')
  const [detectedFields, setDetectedFields] = useState([])
  const [originalHtml, setOriginalHtml] = useState('')
  const [outputHtml, setOutputHtml] = useState('')
  const [detectStatus, setDetectStatus] = useState('')
  const [noFieldsMsg, setNoFieldsMsg] = useState('')
  const [fieldValues, setFieldValues] = useState({})
  const [isGenerateDisabled, setIsGenerateDisabled] = useState(true)
  const [isCopyDisabled, setIsCopyDisabled] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const previewFrameRef = useRef(null)

  const resetUI = () => {
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
        setDetectStatus(`<strong>Found ${fields.length} field(s) using AI.</strong> Toggle fields on/off and edit values below, then click Generate.`)
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

  const handleFieldToggle = (key) => {
    setDetectedFields(prev => 
      prev.map(field => 
        field.key === key 
          ? { ...field, enabled: !field.enabled }
          : field
      )
    )
  }

  const handleGenerate = () => {
    if (!originalHtml) return

    let updatedHtml = originalHtml

    // Replace only enabled field values
    // Sort by length (longest first) to avoid partial replacements
    const enabledFields = detectedFields
      .filter(field => field.enabled !== false)
      .sort((a, b) => (b.originalValue?.length || 0) - (a.originalValue?.length || 0))

    enabledFields.forEach((field) => {
      const newValue = fieldValues[field.key] || field.originalValue
      if (!field.originalValue) return
      
      // Handle fields with replacementTargets (email, phone, social links)
      if (field.replacementTargets && Array.isArray(field.replacementTargets)) {
        // Replace all targets with the new value
        field.replacementTargets.forEach((target) => {
          updatedHtml = updatedHtml.split(target).join(newValue)
        })
        
        // For email: replace any remaining mailto: links with the original email
        if (field.key === "email") {
          // Replace mailto: links that contain the original email
          const emailRegex = new RegExp(`mailto:${field.originalValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
          updatedHtml = updatedHtml.replace(emailRegex, `mailto:${newValue}`)
        }
        
        // For phone: replace any remaining tel: links with the original phone
        if (field.key === "phone") {
          // Normalize phone for matching (remove formatting)
          const normalizePhone = (p) => p.replace(/[\s().-]/g, '')
          const normalizedOriginal = normalizePhone(field.originalValue)
          
          // Replace tel: links that match the original phone
          updatedHtml = updatedHtml.replace(/tel:([\d\s().+-]+)/gi, (match, telValue) => {
            if (normalizePhone(telValue.trim()) === normalizedOriginal) {
              return `tel:${newValue}`
            }
            return match
          })
        }
        
        // For social links: ensure href attributes are updated
        if (field.key && (field.key.includes('linkedin') || field.key.includes('twitter') || field.key.includes('facebook') || field.key.includes('instagram') || field.key.includes('youtube') || field.key.includes('github') || field.key.includes('social'))) {
          // Replace href attributes that contain the original URL
          const escapedOriginal = field.originalValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const hrefRegex = new RegExp(`href=["']${escapedOriginal}["']`, 'gi')
          updatedHtml = updatedHtml.replace(hrefRegex, `href="${newValue}"`)
        }
      } else {
        // Standard replacement for other fields
        updatedHtml = updatedHtml.split(field.originalValue).join(newValue)
      }
    })

    setOutputHtml(updatedHtml)
    setIsCopyDisabled(!updatedHtml.trim())
    updatePreview(updatedHtml)
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

    // Fallback: select the textarea and copy as text
    const textarea = document.getElementById("outputHtml")
    if (textarea) {
      textarea.focus()
      textarea.select()
      try {
        document.execCommand("copy")
        toast.success("Signature Copied", {
          description: "Paste it into your email client"
        })
      } catch (err) {
        console.error("Copy failed", err)
      } finally {
        window.getSelection().removeAllRanges()
      }
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
        previewFrameRef.current.style.height = Math.min(Math.max(height, 150), 400) + "px"
      } catch (e) {
        // ignore
      }
    }, 50)
  }

  useEffect(() => {
    updatePreview("")
  }, [])

  return (
    <div className="min-h-screen text-gray-900" style={{ backgroundColor: '#F7FAF9' }}>
      <header className="relative flex h-[68px] items-center justify-between px-6 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img 
            className="h-9 w-auto" 
            src="/Only Signautes Logo.svg" 
            alt="Only Signatures logo" 
          />
        </div>
        
        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink 
                href="#" 
                className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
              >
                Editor
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                href="#" 
                disabled
                className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
                style={{ opacity: 0.5 }}
              >
                Generator
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                href="#" 
                disabled
                className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
                style={{ opacity: 0.5 }}
              >
                Inspiration
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg md:hidden z-50">
            <nav className="flex flex-col py-2">
              <a
                href="#"
                className="px-6 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Editor
              </a>
              <a
                href="#"
                className="px-6 py-3 text-sm font-medium text-gray-500 opacity-50 cursor-not-allowed"
                onClick={(e) => e.preventDefault()}
              >
                Generator
              </a>
              <a
                href="#"
                className="px-6 py-3 text-sm font-medium text-gray-500 opacity-50 cursor-not-allowed"
                onClick={(e) => e.preventDefault()}
              >
                Inspiration
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Main Heading */}
        <div className="text-center mb-12">
          <h1 className="hivory-h1 mb-4">Create and edit your email signatures</h1>
          <p className="hivory-paragraph-medium text-gray-600">
            Paste your HTML email signature below to detect and edit fields
          </p>
        </div>

        {/* Step 1: Paste your HTML signature */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-semibold text-sm mt-1">
              1
            </div>
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="hivory-h5 mb-4">Paste your HTML email signature</h2>
              <Textarea 
                id="signatureInput"
                value={signatureHtml}
                onChange={(e) => setSignatureHtml(e.target.value)}
                className="w-full min-h-[160px] font-mono text-sm resize-y" 
                placeholder="Paste your HTML email signature here..."
              />
              <div className="flex flex-wrap gap-2 mt-4">
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
                  className="hivory-paragraph-small text-gray-500 mt-3"
                  dangerouslySetInnerHTML={{ __html: detectStatus }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Edit the detected fields */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-semibold text-sm mt-1">
              2
            </div>
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="hivory-h5">Edit the detected fields</h2>
                {detectedFields.length > 0 && (
                  <span className="inline-block text-[10px] px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold uppercase tracking-[0.03em]">
                    Auto-detected
                  </span>
                )}
              </div>
              {detectedFields.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 mb-3">
                    Toggle fields on/off to control which ones will be replaced. Unchecked fields will be left unchanged.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          <input
                            type="checkbox"
                            checked={field.enabled !== false}
                            onChange={() => handleFieldToggle(field.key)}
                            className="w-4 h-4 text-black border-gray-300 rounded focus:ring-2 focus:ring-black"
                            id={`field-${field.key}`}
                          />
                          <Label 
                            htmlFor={`field-${field.key}`}
                            className={`text-sm font-medium ${
                              field.enabled ? 'text-gray-700' : 'text-gray-500'
                            } cursor-pointer`}
                          >
                            {field.label}
                          </Label>
                        </div>
                        <input 
                          type="text" 
                          value={fieldValues[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          disabled={!field.enabled}
                          className={`w-full text-sm px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                            field.enabled 
                              ? 'border-gray-300 bg-white' 
                              : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                          }`}
                        />
                        <small className="block text-xs text-gray-500">
                          Original: <code className="font-mono">{escapeHtml(field.originalValue || "")}</code>
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="hivory-paragraph-small text-gray-500">
                    {noFieldsMsg || "No fields detected yet. Paste your HTML signature and click 'Find fields'."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Generate and preview updated signature */}
        <div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-semibold text-sm mt-1">
              3
            </div>
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="hivory-h5 mb-4">Generate and preview updated signature</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerateDisabled}
                  className="rounded-full"
                >
                  Generate
                </Button>
                <Button 
                  onClick={handleCopy}
                  disabled={isCopyDisabled}
                  variant="outline"
                  className="rounded-full"
                  type="button"
                >
                  Copy signature
                </Button>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Preview</Label>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <iframe 
                    ref={previewFrameRef}
                    title="Signature preview" 
                    className="w-full border-0 bg-white min-h-[150px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-center" style={{ color: '#6B7C75' }}>
            Copyright © 2026 - All rights reserved | A product by{' '}
            <a 
              href="https://www.hivory.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: '#6B7C75' }}
            >
              Hivory
            </a>
          </p>
        </div>
      </footer>
      <Toaster />
    </div>
  )
}

export default App
