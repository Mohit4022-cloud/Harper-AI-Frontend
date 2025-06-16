'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { parseCSV, validateCSVStructure } from '@/lib/utils/csvParser'
import { 
  Mail, Upload, Download, Users, Sparkles, Send, FileText, AlertCircle, Search, TestTube,
  RotateCcw, Save, HelpCircle, Eye, Shuffle, Copy, Filter, Plus, Calendar, BarChart3, FileDown 
} from 'lucide-react'
import { useAuthStore } from '@/store/slices/authStore'
import { useContactsStore } from '@/store/slices/contactsStore'
import { useEmailStore } from '@/store/slices/emailStore'
import { useEmailPresets } from '@/hooks/useEmailPresets'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import ZoomInfoUploader from '@/components/email/ZoomInfoUploader'
import EmailSettingsPanel from '@/components/email/EmailSettingsPanel'
import EmailPreview from '@/components/email/EmailPreview'
import ContactFilters from '@/components/email/ContactFilters'
import AddContactModal from '@/components/email/AddContactModal'
import AnalyticsModal from '@/components/email/AnalyticsModal'
import { faker } from '@faker-js/faker'

interface EmailSettings {
  tone: 'Professional' | 'Consultative' | 'Direct' | 'Friendly' | 'Urgent'
  length: 'short' | 'medium' | 'long'
  subjectStyle: 'question' | 'benefit' | 'company-specific' | 'statistic' | 'personal'
  cta: string
  focusAreas: string[]
  personalizationDepth: number
  includeFeatures: string[]
  customInstructions?: string
}

interface GeneratedEmail {
  contact: any
  email: {
    subject: string
    body: string
    personalizationNotes: string[]
  }
  enrichedData?: any
  savedEmailId?: string
}

export default function EmailPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const { contacts, loading, loadContacts } = useContactsStore()
  const { settings: emailSettings, updateSettings, resetSettings } = useEmailStore()
  const { savePreset, loadPreset, presets } = useEmailPresets()
  
  const [activeTab, setActiveTab] = useState('upload')
  const [csvData, setCsvData] = useState<any[]>([])
  const [csvErrors, setCsvErrors] = useState<any[]>([])
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [selectedCsvIndices, setSelectedCsvIndices] = useState<number[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [contactSearch, setContactSearch] = useState('')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [sendMode, setSendMode] = useState('now')
  const [contactFilters, setContactFilters] = useState<any>({})
  
  const [settings, setSettings] = useState<EmailSettings>(emailSettings)

  // Load contacts on mount
  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  // Sync local settings with store
  useEffect(() => {
    updateSettings(settings)
  }, [settings, updateSettings])

  // Filter contacts based on search and filters
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      contact.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
      (contact.company?.toLowerCase().includes(contactSearch.toLowerCase()) || false)
    
    const matchesFilters = Object.entries(contactFilters).every(([key, value]) => {
      if (!value) return true
      const contactValue = contact[key as keyof typeof contact]
      return contactValue?.toString().toLowerCase().includes(value.toString().toLowerCase())
    })
    
    return matchesSearch && matchesFilters
  })

  const toggleContactSelection = (contactId: string) => {
    setSelectedContactIds(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const toggleCsvSelection = (index: number) => {
    setSelectedCsvIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const selectAllContacts = () => {
    if (selectedContactIds.length === filteredContacts.length) {
      setSelectedContactIds([])
    } else {
      setSelectedContactIds(filteredContacts.map(c => c.id))
    }
  }

  const selectAllCsv = () => {
    if (selectedCsvIndices.length === csvData.length) {
      setSelectedCsvIndices([])
    } else {
      setSelectedCsvIndices(csvData.map((_, idx) => idx))
    }
  }

  const handleReset = () => {
    resetSettings()
    setSettings(emailSettings)
    setCsvData([])
    setCsvErrors([])
    setSelectedContactIds([])
    setSelectedCsvIndices([])
    setGeneratedEmails([])
    toast({ title: "Reset Complete", description: "All settings and selections cleared" })
  }

  const handleSavePreset = async () => {
    const name = prompt('Enter preset name:')
    if (name) {
      await savePreset(name, settings)
      toast({ title: "Preset Saved", description: `Saved as "${name}"` })
    }
  }

  const generateTestData = () => {
    const testContacts = Array.from({ length: 50 }, () => ({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      company: faker.company.name(),
      title: faker.person.jobTitle(),
      industry: faker.helpers.arrayElement(['SaaS', 'FinTech', 'Healthcare', 'E-commerce', 'MarTech', 'EdTech']),
      phone: faker.phone.number(),
      website: faker.internet.url(),
      linkedinUrl: `https://linkedin.com/in/${faker.internet.userName()}`,
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      companySize: faker.helpers.arrayElement(['1-10', '11-50', '51-200', '201-500', '500+']),
      revenue: faker.helpers.arrayElement(['$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M+']),
      lastContactDate: faker.date.recent({ days: 90 }).toISOString()
    }))
    
    setCsvData(testContacts)
    toast({
      title: "Test Data Generated",
      description: `Generated ${testContacts.length} test contacts for testing`
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const validation = validateCSVStructure(text)
      
      if (!validation.isValid) {
        toast({
          title: "Invalid CSV",
          description: validation.errors.join(', '),
          variant: "destructive"
        })
        setCsvErrors(validation.errors.map((error, idx) => ({
          row: idx + 1,
          error,
          data: {}
        })))
        return
      }

      const contacts = await parseCSV(text)
      setCsvData(contacts)
      setCsvErrors([])
      toast({
        title: "CSV Uploaded",
        description: `${contacts.length} contacts loaded successfully`
      })
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to parse CSV',
        variant: "destructive"
      })
    }
  }

  const hasSelectedContacts = () => {
    if (activeTab === 'upload') return selectedCsvIndices.length > 0
    if (activeTab === 'contacts') return selectedContactIds.length > 0
    return false
  }

  const generateSingleEmail = async (contact: any) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate emails",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/email/personalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.email}`
        },
        body: JSON.stringify({
          csvData: [contact],
          settings,
          enableEnrichment: settings.includeFeatures.includes('company-news')
        })
      })

      const data = await response.json()
      if (data.success && data.results.length > 0) {
        setGeneratedEmails(prev => [...prev, ...data.results])
        toast({
          title: "Email Generated",
          description: `Personalized email created for ${contact.name}`
        })
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate email for this contact",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const generateEmails = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate emails",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    setErrors([])

    try {
      // Get selected contacts based on active tab
      let contactsToProcess = []
      
      if (activeTab === 'upload') {
        contactsToProcess = csvData.filter((_, idx) => selectedCsvIndices.includes(idx))
      } else if (activeTab === 'contacts') {
        contactsToProcess = contacts.filter(c => selectedContactIds.includes(c.id))
      }

      const response = await fetch('/api/email/personalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.email}`
        },
        body: JSON.stringify({
          csvData: contactsToProcess,
          settings,
          enableEnrichment: settings.includeFeatures.includes('company-news'),
          sendMode
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setGeneratedEmails(data.results)
        if (data.errors?.length > 0) {
          setErrors(data.errors.map((e: any) => `${e.contact}: ${e.error}`))
        }
        toast({
          title: "Emails Generated",
          description: `Successfully generated ${data.results.length} personalized emails`
        })
        
        // Show analytics after generation
        setShowAnalytics(true)
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Failed to generate emails',
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadTemplate = () => {
    const template = 'name,email,company,title,industry,website,linkedinUrl\n' +
      '"John Doe","john@example.com","Acme Corp","VP Sales","SaaS","https://acme.com","https://linkedin.com/in/johndoe"'
    
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'email-contacts-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadErrors = () => {
    const errorCsv = [
      ['row', 'error', 'name', 'email', 'company'].join(','),
      ...csvErrors.map(err => [
        err.row,
        err.error,
        err.data.name || '',
        err.data.email || '',
        err.data.company || ''
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([errorCsv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'csv-errors.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToCRM = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to export to CRM",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/integrations/crm/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.email}`
        },
        body: JSON.stringify({
          emails: generatedEmails,
          crmType: 'hubspot', // or from user settings
          campaignName: `Email Campaign ${new Date().toISOString()}`
        })
      })

      if (response.ok) {
        toast({
          title: "Export Successful",
          description: "Emails exported to CRM"
        })
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export to CRM",
        variant: "destructive"
      })
    }
  }

  const exportEmails = () => {
    if (generatedEmails.length === 0) return

    const csvContent = [
      ['Name', 'Email', 'Company', 'Subject', 'Body', 'Personalization Notes'].join(','),
      ...generatedEmails.map(item => [
        item.contact.name,
        item.contact.email,
        item.contact.company,
        `"${item.email.subject.replace(/"/g, '""')}"`,
        `"${item.email.body.replace(/"/g, '""')}"`,
        `"${item.email.personalizationNotes.join('; ').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `generated-emails-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleAddContact = (contact: any) => {
    setCsvData(prev => [...prev, contact])
  }

  const getPreviewContact = () => {
    if (activeTab === 'upload' && csvData.length > 0) {
      return csvData[0]
    }
    if (activeTab === 'contacts' && filteredContacts.length > 0) {
      return filteredContacts[0]
    }
    return null
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">AI Email Personalization</h1>
          <p className="text-muted-foreground">Generate hyper-personalized cold emails at scale</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={handleSavePreset}>
            <Save className="h-4 w-4 mr-1" />
            Save Preset
          </Button>
          <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <HelpCircle className="h-4 w-4 mr-1" />
                Help
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Email Generation Guide</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="font-semibold">CSV Format</h4>
                  <p className="text-sm text-muted-foreground">
                    Required columns: name, email, company, title
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Optional: industry, website, linkedinUrl, phone
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Best Practices</h4>
                  <ul className="text-sm text-muted-foreground list-disc pl-5">
                    <li>Use professional tone for B2B outreach</li>
                    <li>Keep emails under 150 words</li>
                    <li>Include specific company pain points</li>
                    <li>Personalize with recent company news</li>
                    <li>End with a clear call-to-action</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">Keyboard Shortcuts</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><kbd>Ctrl+R</kbd> - Reset page</li>
                    <li><kbd>Ctrl+S</kbd> - Save preset</li>
                    <li><kbd>Ctrl+G</kbd> - Generate emails</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-1">
          <EmailSettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
            previewContact={getPreviewContact()}
          />
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Recipients</CardTitle>
              <CardDescription>Choose contacts from your database or upload a CSV</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload">Upload CSV</TabsTrigger>
                  <TabsTrigger value="contacts">Existing Contacts</TabsTrigger>
                  <TabsTrigger value="zoominfo">ZoomInfo + Gemini</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-4">
                  {csvErrors.length > 0 && (
                    <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
                      <span className="text-sm text-destructive">
                        {csvErrors.length} rows failed validation
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={downloadErrors}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download Errors
                      </Button>
                    </div>
                  )}
                  
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <Label htmlFor="csv-upload" className="cursor-pointer">
                      <span className="text-primary hover:underline">Upload CSV file</span>
                      <Input 
                        id="csv-upload"
                        type="file" 
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </Label>
                    <p className="text-sm text-muted-foreground mt-2">
                      CSV must include: name, email, company, title
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <span className="text-sm text-muted-foreground">or</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={generateTestData}
                        className="gap-2"
                      >
                        <TestTube className="h-4 w-4" />
                        Generate Test Data
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={downloadTemplate}
                        className="gap-2"
                      >
                        <FileDown className="h-4 w-4" />
                        Template CSV
                      </Button>
                    </div>
                  </div>
                  
                  {csvData.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Loaded Contacts</span>
                        <div className="flex gap-2 items-center">
                          <Badge>{selectedCsvIndices.length} selected</Badge>
                          <Badge variant="outline">{csvData.length} total</Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={selectAllCsv}
                          >
                            {selectedCsvIndices.length === csvData.length ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                      </div>
                      <ScrollArea className="h-64 border rounded-lg">
                        <div className="p-2 space-y-1">
                          {csvData.map((contact, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center space-x-3 p-2 hover:bg-muted rounded cursor-pointer"
                              onClick={() => toggleCsvSelection(idx)}
                            >
                              <Checkbox 
                                checked={selectedCsvIndices.includes(idx)}
                                onCheckedChange={() => toggleCsvSelection(idx)}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{contact.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {contact.email} • {contact.company} • {contact.title || 'No title'}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  generateSingleEmail(contact)
                                }}
                                disabled={isGenerating}
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                Generate
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="contacts" className="space-y-4">
                  <div className="flex gap-2">
                    <ContactFilters 
                      onFilterChange={setContactFilters}
                      className="flex-1"
                    />
                    <AddContactModal 
                      onAdd={handleAddContact}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Contact
                        </Button>
                      }
                    />
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search contacts..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Contact List */}
                  {loading && contacts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading contacts...
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="mx-auto h-12 w-12 mb-4" />
                      <p>No contacts found</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => router.push('/contacts')}
                      >
                        Add Contacts
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {selectedContactIds.length} of {filteredContacts.length} selected
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={selectAllContacts}
                        >
                          {selectedContactIds.length === filteredContacts.length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                      
                      <ScrollArea className="h-64 border rounded-lg">
                        <div className="p-2 space-y-1">
                          {filteredContacts.map((contact) => (
                            <div 
                              key={contact.id}
                              className="flex items-center space-x-3 p-2 hover:bg-muted rounded cursor-pointer"
                              onClick={() => toggleContactSelection(contact.id)}
                            >
                              <Checkbox 
                                checked={selectedContactIds.includes(contact.id)}
                                onCheckedChange={() => toggleContactSelection(contact.id)}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{contact.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {contact.email} • {contact.company || 'No company'} • {contact.title || 'No title'}
                                </p>
                              </div>
                              {contact.leadScore && (
                                <Badge variant="outline" className="text-xs">
                                  Score: {contact.leadScore}
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  generateSingleEmail(contact)
                                }}
                                disabled={isGenerating}
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                Generate
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="zoominfo" className="space-y-4">
                  <ZoomInfoUploader />
                </TabsContent>
              </Tabs>

              {activeTab !== 'zoominfo' && (
                <div className="mt-6 flex justify-between">
                  <div className="flex gap-2">
                    <Select value={sendMode} onValueChange={setSendMode}>
                      <SelectTrigger className="w-[180px]">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="now">Send Now</SelectItem>
                        <SelectItem value="schedule">Schedule in Outreach</SelectItem>
                        <SelectItem value="sfdc">Schedule in Salesforce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={generateEmails}
                    disabled={isGenerating || !hasSelectedContacts()}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <>Generating...</>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Emails
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {generatedEmails.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generated Emails</CardTitle>
                    <CardDescription>Review and export your personalized emails</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={exportToCRM} variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Export to CRM
                    </Button>
                    <Button onClick={() => setShowAnalytics(true)} variant="outline" className="gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Analytics
                    </Button>
                    <Button onClick={exportEmails} variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {errors.length > 0 && (
                  <div className="mb-4 p-3 bg-destructive/10 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive mb-1">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Some emails failed to generate:</span>
                    </div>
                    <div className="text-sm space-y-1">
                      {errors.map((error, idx) => (
                        <div key={idx}>{error}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {generatedEmails.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{item.contact.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.contact.email} • {item.contact.company}
                          </p>
                        </div>
                        <Badge variant="outline">
                          <Mail className="h-3 w-3 mr-1" />
                          Email {idx + 1}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Subject:</p>
                          <p className="text-sm bg-muted p-2 rounded">{item.email.subject}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">Body:</p>
                          <div className="text-sm bg-muted p-2 rounded whitespace-pre-wrap">
                            {item.email.body}
                          </div>
                        </div>

                        {item.email.personalizationNotes.length > 0 && (
                          <div>
                            <p className="text-sm font-medium">Personalization:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.email.personalizationNotes.map((note, noteIdx) => (
                                <Badge key={noteIdx} variant="secondary" className="text-xs">
                                  {note}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Analytics Modal */}
      <AnalyticsModal 
        emails={generatedEmails}
        open={showAnalytics}
        onOpenChange={setShowAnalytics}
      />
    </div>
  )
}