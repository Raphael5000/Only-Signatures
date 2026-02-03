import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../components/button'
import { Input } from '../components/input'
import { Label } from '../components/label'
import PreviewWindow from '../components/preview-window'
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
import { Copy, Check, Plus, X, Users, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

// Initial employee data from the Excel file
const initialEmployees = [
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

const NAME_COLORS = [
  { label: 'Red', value: '#F94C1E', logoUrl: 'https://cdn.prod.website-files.com/68c9713ec8532533d3b4e006/6937f1d122a43ccdadb91593_Moxii%20Africa%20-%20Logo%20Horizontal%20-%20Red.png' },
  { label: 'Blue', value: '#4A54E0', logoUrl: 'https://cdn.prod.website-files.com/68c9713ec8532533d3b4e006/6981aa20f34450498b20a5cb_Moxii%20Africa%20-%20Blue.png' },
  { label: 'Violet', value: '#A952FF', logoUrl: 'https://cdn.prod.website-files.com/68c9713ec8532533d3b4e006/6981aa206e8ea46ef5de4b54_Moxii%20Africa%20-%20Violet.png' },
  { label: 'Turquoise', value: '#32B281', logoUrl: 'https://cdn.prod.website-files.com/68c9713ec8532533d3b4e006/6981aa20a0c351e665e3d3dc_Moxii%20Africa%20-%20Turquise.png' },
  { label: 'Navy', value: '#1F053D', logoUrl: 'https://cdn.prod.website-files.com/68c9713ec8532533d3b4e006/6981aa202c7cd82b5425c4ca_Moxii%20Africa%20-%20Navy.png' },
]

const defaultColor = NAME_COLORS[0]

// Plain-text version for clipboard (Apple Mail and other clients use this)
function htmlToPlainText(html) {
  if (!html) return ''
  const div = typeof document !== 'undefined' ? document.createElement('div') : null
  if (!div) return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  div.innerHTML = html
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim()
}

// Wrap in minimal document so Apple Mail and others accept the paste
function wrapHtmlForClipboard(html) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`
}

function generateSignature(employee, nameColor = defaultColor.value, logoUrl = defaultColor.logoUrl) {
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

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:13px;line-height:18px;color:rgb(68,68,68)"><tbody><tr><td style="padding:12px 0px"><table cellpadding="0" cellspacing="0" border="0" style="width:284.531px"><tbody><tr><td style="padding-right:14px;vertical-align:top"><div style="font-size:20px;font-weight:700;color:${nameColor};line-height:24px">${fullName}</div><div style="height:4px;line-height:4px">&nbsp;</div><div style="font-size:16px;font-weight:700;color:rgb(102,102,102);line-height:20px">${jobTitle}</div><div style="margin-top:10px;font-size:12px;line-height:18px">${contactLine}<div><span style="font-weight:700;color:rgb(0,0,0)">E:</span>&nbsp;<a href="mailto:${email}" style="color:rgb(68,68,68)" target="_blank">${email}</a>&nbsp;|&nbsp;<span style="font-weight:700;color:rgb(0,0,0)">W:</span>&nbsp;<a href="https://www.moxiiafrica.org" style="color:rgb(68,68,68)" target="_blank">www.moxiiafrica.org</a></div></div><div style="margin-top:10px;font-size:12px;line-height:18px"><div>Suite 102, Art Centre 7</div><div>Parkhurst, Randburg, 2193, South Africa</div></div><div style="margin-top:16px"><img src="${logoUrl}" alt="Moxii Africa Logo" style="display:block;height:80px;width:auto;border:0px"></div><div style="margin-top:8px;font-size:12px;line-height:18px;font-weight:700;color:rgb(68,68,68)">Formerly Media Monitoring Africa</div><div style="margin-top:16px;font-size:12px;line-height:18px;font-weight:700">Connect with us</div><div style="margin-top:4px;font-size:12px;line-height:18px"><a href="https://www.facebook.com/mediamattersza" style="color:rgb(68,68,68)" target="_blank">Facebook</a>&nbsp;|&nbsp;<a href="https://www.youtube.com/channel/UCITuvEZEPVG_bhX66YRrWXQ" style="color:rgb(68,68,68)" target="_blank">YouTube</a>&nbsp;|&nbsp;<a href="https://x.com/MediaMattersZA" style="color:rgb(68,68,68)" target="_blank">X</a>&nbsp;|&nbsp;<a href="https://www.linkedin.com/company/media-monitoring-africa/?originalSubdomain=za" style="color:rgb(68,68,68)" target="_blank">LinkedIn</a>&nbsp;|&nbsp;<a href="https://www.instagram.com/mediamatters_za/" style="color:rgb(68,68,68)" target="_blank">Instagram</a></div></td></tr></tbody></table></td></tr></tbody></table>`
}

function MoxiiAfrica() {
  const [employees, setEmployees] = useState(initialEmployees)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [nameColor, setNameColor] = useState('#F94C1E')
  const [copied, setCopied] = useState(false)
  const [copyingForAppleMail, setCopyingForAppleMail] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showManageEmployees, setShowManageEmployees] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    jobTitle: '',
    cellphone: '',
    telephone: '011 788 1278',
    email: ''
  })
  const previewFrameRef = useRef(null)

  const currentEmployee = employees.find(e => e.fullName === selectedEmployee)
  const selectedColorOption = NAME_COLORS.find(c => c.value === nameColor) || defaultColor
  const signatureHtml = currentEmployee ? generateSignature(currentEmployee, nameColor, selectedColorOption.logoUrl) : ''

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
        previewFrameRef.current.style.height = Math.max(height, 200) + "px"
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

  const writeToClipboard = async (html, showSuccess = true) => {
    const wrapped = wrapHtmlForClipboard(html)
    const plain = htmlToPlainText(html)
    if (navigator.clipboard && window.ClipboardItem) {
      const items = {
        "text/html": new Blob([wrapped], { type: "text/html; charset=utf-8" }),
        "text/plain": new Blob([plain], { type: "text/plain; charset=utf-8" }),
      }
      await navigator.clipboard.write([new ClipboardItem(items)])
    } else {
      await navigator.clipboard.writeText(plain)
    }
    setCopied(true)
    if (showSuccess) {
      toast.success("Signature Copied", {
        description: "Paste into your email (e.g. Cmd+V in Mail)"
      })
    }
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopy = async () => {
    if (!signatureHtml) return
    try {
      await writeToClipboard(signatureHtml)
    } catch (err) {
      console.warn("Clipboard failed, falling back to text.", err)
      try {
        await navigator.clipboard.writeText(htmlToPlainText(signatureHtml))
        setCopied(true)
        toast.success("Signature Copied (plain text)", {
          description: "Paste into your email client"
        })
        setTimeout(() => setCopied(false), 2000)
      } catch (e) {
        toast.error("Copy Failed", {
          description: "Please try selecting and copying manually"
        })
      }
    }
  }

  const handleCopyForAppleMail = async () => {
    if (!signatureHtml || !selectedColorOption?.logoUrl) {
      handleCopy()
      return
    }
    setCopyingForAppleMail(true)
    try {
      const res = await fetch(selectedColorOption.logoUrl, { mode: "cors" })
      if (!res.ok) throw new Error("Fetch failed")
      const blob = await res.blob()
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      const htmlWithEmbeddedLogo = signatureHtml.replace(
        /<img[^>]+src="[^"]*"[^>]*>/i,
        () => `<img src="${base64}" alt="Moxii Africa Logo" style="display:block;height:80px;width:auto;border:0px">`
      )
      await writeToClipboard(htmlWithEmbeddedLogo)
      toast.success("Copied for Apple Mail", {
        description: "Paste in Mail (Cmd+V). Image is embedded."
      })
    } catch (err) {
      console.warn("Could not embed logo for Apple Mail, copying standard HTML.", err)
      await writeToClipboard(signatureHtml, false)
      toast.info("Tip for Apple Mail", {
        description: "Use Chrome to copy, or Mail → Preferences → Signatures → + and paste here"
        + (err?.message ? " (image will load from link)." : ".")
      })
    } finally {
      setCopyingForAppleMail(false)
    }
  }

  const handleAddEmployee = (e) => {
    e.preventDefault()
    
    // Validate required fields
    if (!newEmployee.fullName || !newEmployee.jobTitle || !newEmployee.telephone || !newEmployee.email) {
      toast.error("Missing Information", {
        description: "Please fill in all required fields"
      })
      return
    }

    // Check for duplicate
    if (employees.some(emp => emp.email === newEmployee.email)) {
      toast.error("Employee Exists", {
        description: "An employee with this email already exists"
      })
      return
    }

    // Add to list
    setEmployees([...employees, { ...newEmployee }])
    
    // Reset form and close
    setNewEmployee({
      fullName: '',
      jobTitle: '',
      cellphone: '',
      telephone: '011 788 1278',
      email: ''
    })
    setShowAddForm(false)
    
    // Auto-select the new employee
    setSelectedEmployee(newEmployee.fullName)
    
    toast.success("Employee Added", {
      description: `${newEmployee.fullName} has been added to the list`
    })
  }

  const handleDeleteEmployee = (email) => {
    const employeeToDelete = employees.find(emp => emp.email === email)
    if (!employeeToDelete) return

    // If the deleted employee was selected, clear selection
    if (selectedEmployee === employeeToDelete.fullName) {
      setSelectedEmployee('')
    }

    setEmployees(employees.filter(emp => emp.email !== email))
    
    toast.success("Employee Removed", {
      description: `${employeeToDelete.fullName} has been removed from the list`
    })
  }

  const renderPreviewFooter = () => (
    <>
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
      <Button
        onClick={handleCopyForAppleMail}
        disabled={!selectedEmployee || copyingForAppleMail}
        variant="outline"
        className="rounded-full"
      >
        {copyingForAppleMail ? (
          <>Preparing…</>
        ) : (
          <>Copy for Apple Mail</>
        )}
      </Button>
    </>
  )

  return (
    <>
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-68px)]" style={{ backgroundColor: '#F7FAF9' }}>
        {/* Left column */}
        <div className="w-full md:w-96 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col md:h-[calc(100vh-68px)]">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Moxii Africa</h1>
              <p className="text-sm text-gray-600 mt-2">
                Select your name below to view and copy your email signature.
              </p>
            </div>

            {/* Select employee */}
            <div className="space-y-2">
              <Label htmlFor="employee-select">Select Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-full">
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

            {/* Name color */}
            <div className="space-y-2">
              <Label htmlFor="name-color">Color</Label>
              <Select value={nameColor} onValueChange={setNameColor}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a color..." />
                </SelectTrigger>
                <SelectContent>
                  {NAME_COLORS.map(({ label, value }) => (
                    <SelectItem key={value} value={value}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-4 w-4 rounded-full border border-gray-300 shrink-0"
                          style={{ backgroundColor: value }}
                        />
                        {label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Manage employees */}
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowManageEmployees(!showManageEmployees)
                  if (showAddForm) setShowAddForm(false)
                }}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Users className="h-4 w-4" />
                Manage employees ({employees.length})
                {showManageEmployees ? (
                  <ChevronUp className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                )}
              </Button>
              {showManageEmployees && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-4">Manage Employees</h3>
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-gray-500 border-b">
                        <tr>
                          <th className="pb-2 font-medium">Name</th>
                          <th className="pb-2 font-medium hidden md:table-cell">Title</th>
                          <th className="pb-2 font-medium hidden lg:table-cell">Email</th>
                          <th className="pb-2 font-medium w-20 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {employees.map((employee) => (
                          <tr key={employee.email} className="hover:bg-gray-100">
                            <td className="py-2 pr-2">
                              <div className="font-medium text-gray-900">{employee.fullName}</div>
                              <div className="text-gray-500 md:hidden text-xs">{employee.jobTitle}</div>
                            </td>
                            <td className="py-2 pr-2 hidden md:table-cell text-gray-600 truncate max-w-[160px]">
                              {employee.jobTitle}
                            </td>
                            <td className="py-2 pr-2 hidden lg:table-cell text-gray-600">
                              {employee.email}
                            </td>
                            <td className="py-2 text-right">
                              <Button
                                onClick={() => handleDeleteEmployee(employee.email)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {employees.length === 0 && (
                    <p className="text-center text-gray-500 py-4 text-sm">No employees added yet.</p>
                  )}
                </div>
              )}
            </div>

            {/* Add employee */}
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowAddForm(!showAddForm)
                  if (showManageEmployees) setShowManageEmployees(false)
                }}
                variant={showAddForm ? "outline" : "default"}
                className="w-full justify-start gap-2"
              >
                {showAddForm ? (
                  <>
                    <X className="h-4 w-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add employee
                  </>
                )}
              </Button>
              {showAddForm && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
                  <h3 className="font-medium text-gray-900">Add New Employee</h3>
                  <form onSubmit={handleAddEmployee} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={newEmployee.fullName}
                        onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title *</Label>
                      <Input
                        id="jobTitle"
                        value={newEmployee.jobTitle}
                        onChange={(e) => setNewEmployee({ ...newEmployee, jobTitle: e.target.value })}
                        placeholder="Project Manager"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newEmployee.email}
                        onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                        placeholder="johnd@mma.org.za"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telephone">Telephone *</Label>
                      <Input
                        id="telephone"
                        value={newEmployee.telephone}
                        onChange={(e) => setNewEmployee({ ...newEmployee, telephone: e.target.value })}
                        placeholder="011 788 1278"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cellphone">Cellphone (Optional)</Label>
                      <Input
                        id="cellphone"
                        value={newEmployee.cellphone}
                        onChange={(e) => setNewEmployee({ ...newEmployee, cellphone: e.target.value })}
                        placeholder="082 123 4567"
                      />
                    </div>
                    <Button type="submit" className="w-full justify-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Employee
                    </Button>
                  </form>
                </div>
              )}

              {/* Selected Employee Info */}
              {currentEmployee && (
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 border border-gray-200 space-y-2">
                  <div><span className="font-medium">Name:</span> {currentEmployee.fullName}</div>
                  <div><span className="font-medium">Title:</span> {currentEmployee.jobTitle}</div>
                  <div><span className="font-medium">Email:</span> {currentEmployee.email}</div>
                  <div><span className="font-medium">Telephone:</span> {currentEmployee.telephone}</div>
                  {currentEmployee.cellphone && (
                    <div><span className="font-medium">Cellphone:</span> {currentEmployee.cellphone}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column preview */}
        <div className="flex-1 w-full">
          <div className="flex h-full w-full items-start justify-center px-6 py-6 md:h-[calc(100vh-68px)] md:items-center">
            <div className="w-full max-w-[40rem]">
              <PreviewWindow footer={renderPreviewFooter()}>
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

export default MoxiiAfrica
