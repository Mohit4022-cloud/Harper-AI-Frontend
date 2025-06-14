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
import { Mail, Upload, Download, Users, Sparkles, Send, FileText, AlertCircle, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useContactsStore } from '@/stores/contactsStore'
import { ScrollArea } from '@/components/ui/scroll-area'

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
  const [activeTab, setActiveTab] = useState('upload')
  const [csvData, setCsvData] = useState<any[]>([])
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [contactSearch, setContactSearch] = useState('')
  
  const [settings, setSettings] = useState<EmailSettings>({
    tone: 'Professional',
    length: 'medium',
    subjectStyle: 'benefit',
    cta: '15-minute call',
    focusAreas: ['pain-points'],
    personalizationDepth: 3,
    includeFeatures: ['company-news', 'industry-insights'],
    customInstructions: ''
  })

  // Load contacts on mount
  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    contact.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
    (contact.company?.toLowerCase().includes(contactSearch.toLowerCase()) || false)
  )

  const toggleContactSelection = (contactId: string) => {
    setSelectedContactIds(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const selectAllContacts = () => {
    if (selectedContactIds.length === filteredContacts.length) {
      setSelectedContactIds([])
    } else {
      setSelectedContactIds(filteredContacts.map(c => c.id))
    }
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
        return
      }

      const contacts = await parseCSV(text)
      setCsvData(contacts)
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
      // Get selected contacts data if using existing contacts
      const selectedContactsData = activeTab === 'contacts' 
        ? contacts.filter(c => selectedContactIds.includes(c.id)).map(c => ({
            name: c.name,
            email: c.email,
            company: c.company || '',
            title: c.title || '',
            industry: c.industry || '',
            phone: c.phone
          }))
        : undefined

      const response = await fetch('/api/email/personalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.email}`
        },
        body: JSON.stringify({
          contactIds: activeTab === 'contacts' ? selectedContactIds : undefined,
          contactsData: activeTab === 'contacts' ? selectedContactsData : undefined,
          csvData: activeTab === 'upload' ? csvData : undefined,
          settings,
          enableEnrichment: settings.includeFeatures.includes('company-news')
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate emails')
      }

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

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">AI Email Personalization</h1>
        <p className="text-muted-foreground">Generate hyper-personalized cold emails at scale</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure your email generation preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tone</Label>
                <Select 
                  value={settings.tone} 
                  onValueChange={(value) => setSettings({...settings, tone: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Consultative">Consultative</SelectItem>
                    <SelectItem value="Direct">Direct</SelectItem>
                    <SelectItem value="Friendly">Friendly</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Length</Label>
                <Select 
                  value={settings.length} 
                  onValueChange={(value) => setSettings({...settings, length: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (Under 100 words)</SelectItem>
                    <SelectItem value="medium">Medium (100-150 words)</SelectItem>
                    <SelectItem value="long">Long (150-200 words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Subject Style</Label>
                <Select 
                  value={settings.subjectStyle} 
                  onValueChange={(value) => setSettings({...settings, subjectStyle: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="benefit">Benefit-focused</SelectItem>
                    <SelectItem value="company-specific">Company-specific</SelectItem>
                    <SelectItem value="statistic">Statistic/Data</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Call to Action</Label>
                <Input 
                  value={settings.cta}
                  onChange={(e) => setSettings({...settings, cta: e.target.value})}
                  placeholder="e.g., 15-minute call"
                />
              </div>

              <div>
                <Label>Focus Areas</Label>
                <div className="space-y-2 mt-2">
                  {['pain-points', 'benefits', 'social-proof', 'urgency'].map(area => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox 
                        checked={settings.focusAreas.includes(area)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSettings({...settings, focusAreas: [...settings.focusAreas, area]})
                          } else {
                            setSettings({...settings, focusAreas: settings.focusAreas.filter(a => a !== area)})
                          }
                        }}
                      />
                      <Label className="capitalize">{area.replace('-', ' ')}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Include Features</Label>
                <div className="space-y-2 mt-2">
                  {['company-news', 'industry-insights', 'role-challenges'].map(feature => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox 
                        checked={settings.includeFeatures.includes(feature)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSettings({...settings, includeFeatures: [...settings.includeFeatures, feature]})
                          } else {
                            setSettings({...settings, includeFeatures: settings.includeFeatures.filter(f => f !== feature)})
                          }
                        }}
                      />
                      <Label className="capitalize">{feature.replace('-', ' ')}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Custom Instructions</Label>
                <Textarea 
                  value={settings.customInstructions}
                  onChange={(e) => setSettings({...settings, customInstructions: e.target.value})}
                  placeholder="Add any specific requirements..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
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
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload CSV</TabsTrigger>
                  <TabsTrigger value="contacts">Existing Contacts</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-4">
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
                  </div>
                  
                  {csvData.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Loaded Contacts</span>
                        <Badge>{csvData.length} contacts</Badge>
                      </div>
                      <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-1">
                        {csvData.slice(0, 5).map((contact, idx) => (
                          <div key={idx} className="text-sm">
                            {contact.name || `${contact.firstName} ${contact.lastName}`} - {contact.email}
                          </div>
                        ))}
                        {csvData.length > 5 && (
                          <div className="text-sm text-muted-foreground">
                            ... and {csvData.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="contacts" className="space-y-4">
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
                                  {contact.email} • {contact.company || 'No company'}
                                </p>
                              </div>
                              {contact.leadScore && (
                                <Badge variant="outline" className="text-xs">
                                  Score: {contact.leadScore}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={generateEmails}
                  disabled={isGenerating || (activeTab === 'upload' ? csvData.length === 0 : selectedContactIds.length === 0)}
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
                  <Button onClick={exportEmails} variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
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
    </div>
  )
}