'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileText, AlertCircle } from 'lucide-react'

interface ImportContactsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ImportContactsModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: ImportContactsModalProps) {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [csvText, setCsvText] = useState('')
  const [mode, setMode] = useState<'file' | 'paste'>('file')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a CSV file',
          variant: 'destructive',
        })
        return
      }
      setFile(selectedFile)
    }
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row')
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const contacts = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const contact: any = {}

      headers.forEach((header, index) => {
        const value = values[index] || ''
        
        // Map common CSV headers to our schema
        switch (header) {
          case 'first name':
          case 'firstname':
          case 'fname':
            contact.firstName = value
            break
          case 'last name':
          case 'lastname':
          case 'lname':
            contact.lastName = value
            break
          case 'email':
          case 'email address':
            contact.email = value
            break
          case 'phone':
          case 'phone number':
          case 'telephone':
            contact.phone = value
            break
          case 'title':
          case 'job title':
          case 'position':
            contact.title = value
            break
          case 'company':
          case 'company name':
          case 'organization':
            contact.companyName = value
            break
          case 'department':
          case 'dept':
            contact.department = value
            break
          case 'linkedin':
          case 'linkedin url':
            contact.linkedin = value
            break
          case 'twitter':
          case 'twitter handle':
            contact.twitter = value
            break
          case 'tags':
            contact.tags = value ? value.split(';').map(t => t.trim()) : []
            break
        }
      })

      // Validate required fields
      if (!contact.firstName || !contact.lastName || !contact.email) {
        console.warn(`Skipping row ${i + 1}: missing required fields`)
        continue
      }

      contacts.push(contact)
    }

    return contacts
  }

  const handleImport = async () => {
    try {
      setLoading(true)
      
      let contacts: any[] = []
      
      if (mode === 'file' && file) {
        const text = await file.text()
        contacts = parseCSV(text)
      } else if (mode === 'paste' && csvText) {
        contacts = parseCSV(csvText)
      } else {
        throw new Error('Please provide CSV data')
      }

      if (contacts.length === 0) {
        throw new Error('No valid contacts found in CSV')
      }

      // Send to API
      const response = await fetch('/api/contacts/v2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts,
          skipDuplicates: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }

      const result = await response.json()
      
      toast({
        title: 'Import successful',
        description: `Imported ${result.results.created} contacts${result.results.skipped > 0 ? `, skipped ${result.results.skipped} duplicates` : ''}`,
      })
      
      onSuccess()
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import contacts',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === 'file' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('file')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
            <Button
              variant={mode === 'paste' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('paste')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Paste CSV
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              CSV must include: First Name, Last Name, and Email columns.
              Optional: Phone, Title, Company, Department, LinkedIn, Twitter, Tags.
            </AlertDescription>
          </Alert>

          {mode === 'file' ? (
            <div>
              <Label htmlFor="csvFile">Select CSV File</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-2"
              />
              {file && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          ) : (
            <div>
              <Label htmlFor="csvText">Paste CSV Data</Label>
              <Textarea
                id="csvText"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="First Name,Last Name,Email,Phone,Title,Company
John,Doe,john@example.com,+1234567890,CEO,Acme Corp
Jane,Smith,jane@example.com,+0987654321,CTO,Tech Inc"
                className="mt-2 font-mono text-sm"
                rows={10}
              />
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">CSV Format Example:</h4>
            <pre className="text-xs font-mono text-gray-600">
{`First Name,Last Name,Email,Phone,Title,Company,Department
John,Doe,john@example.com,+1234567890,CEO,Acme Corp,Executive
Jane,Smith,jane@example.com,+0987654321,CTO,Tech Inc,Technology`}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={loading || (mode === 'file' ? !file : !csvText)}
          >
            {loading ? 'Importing...' : 'Import Contacts'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}