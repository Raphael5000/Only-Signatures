import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../components/button'
import { Label } from '../components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/card'
import { Toaster } from '../components/sonner'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'

// Employee data from the Excel file
const employees = [
  { fullName: "William Bird", jobTitle: "Director, Ashoka & Linc Fellow", cellphone: "082 887 1370", telephone: "011 788 1278", email: "williamb@mma.org.za" },
  { fullName: "Thandi Smith", jobTitle: "Head of Programmes", cellphone: "073 470 7306", telephone: "011 788 1278", email: "thandis@mma.org.za" },
  { fullName: "George Kalu", jobTitle: "HR & Capacity Development Manager", cellphone: "083 686 4699", telephone: "011 788 1278", email: "georgek@mma.org.za" },
  { fullName: "Nicky Mokoena", jobTitle: "Finance & Operations Manager", cellphone: "083 546 7148", telephone: "011 788 1278", email: "nickym@mma.org.za" },
  { fullName: "Noor Ahmad", jobTitle: "Communications Manager", cellphone: "079 363 2126", telephone: "011 788 1278", email: "noora@mma.org.za" },
  { fullName: "Kgothatso Baatile Mohlale", jobTitle: "Communications Coordinator - Design Lead", cellphone: "", telephone: "011 788 1278", email: "baatilem@mma.org.za" },
  { fullName: "Siphokazi Pikoko", jobTitle: "Communications Officer", cellphone: "", telephone: "011 788 1278", email: "siphokazip@mma.org.za" },
  { fullName: "Phakamila Madonsela", jobTitle: "Public & Media Skills Development Programme Manager", cellphone: "", telephone: "011 788 1278", email: "phakamilek@mma.org.za" },
  { fullName: "Tumelo Hlaka", jobTitle: "Project Coordinator: Public & Media Skills Development", cellphone: "072 049 9539", telephone: "011 788 1278", email: "tumeloh@mma.org.za" },
  { fullName: "Msizi Mzolo", jobTitle: "Project Coordinator: Policy Programme", cellphone: "071 890 9957", telephone: "011 788 1278", email: "msizim@mma.org.za" },
  { fullName: "Lister Namumba-Rikhotso", jobTitle: "Monitoring, Research, & Analysis Programme Manager", cellphone: "", telephone: "011 788 1278", email: "listerr@mma.org.za" },
  { fullName: "Musa Rikhotso", jobTitle: "Project Coordinator: Children's Programme", cellphone: "072 686 4391", telephone: "011 788 1278", email: "musar@mma.org.za" },
  { fullName: "Tinotenda Bangajena", jobTitle: "Research Support & Development Coordinator", cellphone: "", telephone: "011 788 1278", email: "tinotendab@mma.org.za" },
  { fullName: "Nthabiseng Mahlangu", jobTitle: "Project Administrator", cellphone: "071 303 2976", telephone: "011 788 1278", email: "nthabisengm@mma.org.za" },
  { fullName: "Stephanie Fitzpatrick", jobTitle: "Communications Mentor", cellphone: "", telephone: "011 788 1278", email: "stephanief@mma.org.za" },
  { fullName: "Jacques Ndong", jobTitle: "Project Coordinator: Policy Programme", cellphone: "073 854 1725", telephone: "011 788 1278", email: "jacquesn@mma.org.za" },
  { fullName: "Ntsako Manganyi", jobTitle: "Community Building & Engagement Programme Manager", cellphone: "083 626 4786", telephone: "011 788 1278", email: "ntsakom@mma.org.za" },
  { fullName: "Keamogetswe Sere", jobTitle: "Junior Data Scientist", cellphone: "", telephone: "011 788 1278", email: "keamos@mma.org.za" },
  { fullName: "Ntombifuthi Kubeka", jobTitle: "Project Coordinator: Research & Analysis", cellphone: "", telephone: "011 788 1278", email: "ntombik@mma.org.za" },
]

function generateSignature(employee) {
  const { fullName, jobTitle, cellphone, telephone, email } = employee
  
  // Format phone numbers
  const formattedCellphone = cellphone ? `(+27) ${cellphone.replace(/^0/, '')}` : ''
  const formattedTelephone = `(+27) ${telephone.replace(/^0/, '')}`
  
  // Build contact line - conditionally include cellphone
  let contactLine = ''
  if (cellphone) {
    contactLine = `<div><span style="font-weight:700;color:rgb(0,0,0)">C:</span>&nbsp;${formattedCellphone} |&nbsp;<span style="font-weight:700;color:rgb(0,0,0)">T:</span>&nbsp;${formattedTelephone}</div>`
  } else {
    contactLine = `<div><span style="font-weight:700;color:rgb(0,0,0)">T:</span>&nbsp;${formattedTelephone}</div>`
  }

  // Space before W only when cellphone exists
  const pipeBeforeW = cellphone ? '&nbsp;|&nbsp;' : '&nbsp;|'

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:13px;line-height:18px;color:rgb(68,68,68)"><tbody><tr><td style="padding:12px 0px"><table cellpadding="0" cellspacing="0" border="0" style="width:284.531px"><tbody><tr><td style="padding-right:14px;vertical-align:top"><div style="font-size:20px;font-weight:700;color:rgb(249,76,30);line-height:24px">${fullName}</div><div style="height:4px;line-height:4px">&nbsp;</div><div style="font-size:16px;font-weight:700;color:rgb(102,102,102);line-height:20px">${jobTitle}</div><div style="margin-top:10px;font-size:12px;line-height:18px">${contactLine}<div><span style="font-weight:700;color:rgb(0,0,0)">E:</span>&nbsp;<a href="mailto:${email}" style="color:rgb(68,68,68)" target="_blank">${email}</a>${pipeBeforeW}<span style="font-weight:700;color:rgb(0,0,0)">W:</span>&nbsp;<a href="https://www.moxiiafrica.org" style="color:rgb(68,68,68)" target="_blank">www.moxiiafrica.org</a></div></div><div style="margin-top:10px;font-size:12px;line-height:18px"><div>Suite 102, Art Centre 7</div><div>Parkhurst, Randburg, 2193, South Africa</div></div><div style="margin-top:16px"><img src="https://cdn.prod.website-files.com/68c9713ec8532533d3b4e006/6937f1d122a43ccdadb91593_Moxii%20Africa%20-%20Logo%20Horizontal%20-%20Red.png" alt="Moxii Africa Logo" style="display:block;height:80px;width:auto;border:0px"></div><div style="margin-top:8px;font-size:12px;line-height:18px;color:rgb(68,68,68)">Formerly Media Monitoring Africa</div><div style="margin-top:16px;font-size:12px;line-height:18px;font-weight:700">Connect with us</div><div style="margin-top:4px;font-size:12px;line-height:18px"><a href="https://www.facebook.com/mediamattersza" style="color:rgb(68,68,68)" target="_blank">Facebook</a>&nbsp;|&nbsp;<a href="https://www.youtube.com/channel/UCITuvEZEPVG_bhX66YRrWXQ" style="color:rgb(68,68,68)" target="_blank">YouTube</a>&nbsp;|&nbsp;<a href="https://x.com/MediaMattersZA" style="color:rgb(68,68,68)" target="_blank">X</a>&nbsp;|&nbsp;<a href="https://www.linkedin.com/company/media-monitoring-africa/?originalSubdomain=za" style="color:rgb(68,68,68)" target="_blank">LinkedIn</a>&nbsp;|&nbsp;<a href="https://www.instagram.com/mediamatters_za/" style="color:rgb(68,68,68)" target="_blank">Instagram</a></div></td></tr></tbody></table></td></tr></tbody></table>`
}

function MoxiiAfrica() {
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [copied, setCopied] = useState(false)
  const previewFrameRef = useRef(null)

  const currentEmployee = employees.find(e => e.fullName === selectedEmployee)
  const signatureHtml = currentEmployee ? generateSignature(currentEmployee) : ''

  const updatePreview = (html) => {
    if (!previewFrameRef.current) return
    
    const doc = previewFrameRef.current.contentDocument || previewFrameRef.current.contentWindow.document
    doc.open()
    if (!html) {
      doc.write("<!doctype html><html><head><meta charset='utf-8'></head><body style='font-family:system-ui; font-size:14px; color:#9ca3af; display:flex; align-items:center; justify-content:center; height:200px; text-align:center; padding:20px;'>Select an employee from the dropdown to preview their signature.</body></html>")
    } else {
      doc.write(
        "<!doctype html><html><head><meta charset='utf-8'></head><body style='padding:20px;'>" +
        html +
        "</body></html>"
      )
    }
    doc.close()

    // Adjust iframe height to content
    setTimeout(() => {
      try {
        const body = doc.body
        const height = body.scrollHeight || 200
        previewFrameRef.current.style.height = Math.min(Math.max(height, 200), 600) + "px"
      } catch (e) {
        // ignore
      }
    }, 50)
  }

  useEffect(() => {
    updatePreview(signatureHtml)
  }, [signatureHtml])

  useEffect(() => {
    updatePreview('')
  }, [])

  const handleCopy = async () => {
    if (!signatureHtml) return

    // Try to use Clipboard API with text/html for rich paste
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        const blob = new Blob([signatureHtml], { type: "text/html" })
        const data = [new ClipboardItem({ "text/html": blob })]
        await navigator.clipboard.write(data)
        setCopied(true)
        toast.success("Signature Copied", {
          description: "Paste it into your email client"
        })
        setTimeout(() => setCopied(false), 2000)
        return
      } catch (err) {
        console.warn("Rich clipboard failed, falling back to text-only copy.", err)
      }
    }

    // Fallback: copy as text
    try {
      await navigator.clipboard.writeText(signatureHtml)
      setCopied(true)
      toast.success("Signature Copied", {
        description: "Paste it into your email client"
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Copy failed", err)
      toast.error("Copy Failed", {
        description: "Please try selecting and copying manually"
      })
    }
  }

  return (
    <>
      <div className="min-h-[calc(100vh-68px)] p-6" style={{ backgroundColor: '#F7FAF9' }}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Moxii Africa</h1>
            <p className="text-gray-600">
              Select your name from the dropdown below to view and copy your email signature.
            </p>
          </div>

          {/* Main Card */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Email Signature Generator</CardTitle>
              <CardDescription>
                Choose an employee to generate their personalized email signature
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Employee Select */}
              <div className="space-y-2">
                <Label htmlFor="employee-select">Select Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="w-full md:w-96">
                    <SelectValue placeholder="Choose your name..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.email} value={employee.fullName}>
                        {employee.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Signature Preview</Label>
                  <Button
                    onClick={handleCopy}
                    disabled={!selectedEmployee}
                    variant={copied ? "default" : "outline"}
                    className="rounded-full"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Signature
                      </>
                    )}
                  </Button>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <iframe
                    ref={previewFrameRef}
                    title="Signature preview"
                    className="w-full border-0 bg-white min-h-[200px]"
                    style={{ maxHeight: '600px' }}
                  />
                </div>
              </div>

              {/* Selected Employee Info */}
              {currentEmployee && (
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div><span className="font-medium">Name:</span> {currentEmployee.fullName}</div>
                    <div><span className="font-medium">Title:</span> {currentEmployee.jobTitle}</div>
                    <div><span className="font-medium">Email:</span> {currentEmployee.email}</div>
                    <div><span className="font-medium">Telephone:</span> {currentEmployee.telephone}</div>
                    {currentEmployee.cellphone && (
                      <div><span className="font-medium">Cellphone:</span> {currentEmployee.cellphone}</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </>
  )
}

export default MoxiiAfrica
