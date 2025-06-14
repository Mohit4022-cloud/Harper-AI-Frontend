'use client'

import React, { useState } from 'react'
import Papa from 'papaparse'
import { Upload, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCallQueueStore } from '@/stores/callQueueStore'
import { useContactsStore } from '@/stores/contactsStore'
import { formatPhoneNumber, isValidE164 } from '@/lib/mockContacts'
import { cn } from '@/lib/utils'
import type { CreateContact } from '@/types/contact'

interface CSVRow {
  Name?: string
  Phone?: string
  Company?: string
  Title?: string
  Industry?: string
  Email?: string
  [key: string]: string | undefined
}

export function CSVUploader() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [preview, setPreview] = useState<CreateContact[]>([])
  const { setQueue, queue } = useCallQueueStore()
  const { addContact } = useContactsStore()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    setSuccess(null)
    setPreview([])

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const contacts: CreateContact[] = []
          const errors: string[] = []

          results.data.forEach((row, index) => {
            // Try different column name variations
            const name = row.Name || row.name || row['Full Name'] || row['full_name']
            const phone = row.Phone || row.phone || row['Phone Number'] || row['phone_number']
            const company = row.Company || row.company || row['Company Name'] || row['company_name']
            const title = row.Title || row.title || row['Job Title'] || row['job_title']
            const industry = row.Industry || row.industry || ''
            const email = row.Email || row.email || row['Email Address'] || row['email_address'] || ''

            if (!name || !phone) {
              errors.push(`Row ${index + 2}: Missing required fields (name or phone)`)
              return
            }

            const formattedPhone = formatPhoneNumber(phone)
            if (!isValidE164(formattedPhone)) {
              errors.push(`Row ${index + 2}: Invalid phone number format for ${name}`)
              return
            }

            // Validate email if provided
            if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
              errors.push(`Row ${index + 2}: Invalid email format for ${name}`)
              return
            }

            contacts.push({
              name,
              phone: formattedPhone,
              email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
              company: company || '',
              title: title || '',
              industry,
              status: 'prospect',
              leadScore: 50,
              notes: `Imported from CSV on ${new Date().toLocaleDateString()}`
            })
          })

          if (errors.length > 0) {
            setError(`Found ${errors.length} errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`)
          }

          if (contacts.length > 0) {
            setPreview(contacts.slice(0, 5))
            setSuccess(`Successfully parsed ${contacts.length} contacts`)
            // Store the full list for loading
            ;(window as any).__csvContacts = contacts
          } else {
            setError('No valid contacts found in the CSV file')
          }
        } catch (err) {
          setError(`Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}`)
        } finally {
          setIsUploading(false)
        }
      },
      error: (error) => {
        setError(`CSV parsing error: ${error.message}`)
        setIsUploading(false)
      },
    })
  }

  const loadContactsToQueue = async () => {
    const contacts = (window as any).__csvContacts as CreateContact[]
    if (contacts && contacts.length > 0) {
      setIsUploading(true)
      try {
        // Add contacts to the unified store
        const addedContacts = []
        for (const contact of contacts) {
          try {
            await addContact(contact)
            addedContacts.push(contact)
          } catch (err) {
            console.error(`Failed to add contact ${contact.name}:`, err)
          }
        }
        
        // Convert to queue format and add to call queue
        const queueContacts = addedContacts.map((c, idx) => ({
          id: `csv-${Date.now()}-${idx}`,
          name: c.name,
          company: c.company || '',
          title: c.title || '',
          phone: c.phone,
          email: c.email,
          industry: c.industry || '',
          lastCalled: undefined,
          callStatus: undefined as any,
          callDuration: undefined,
          notes: c.notes
        }))
        
        setQueue(queueContacts)
        setSuccess(`Added ${addedContacts.length} contacts and loaded to call queue`)
        
        // Clear the temporary storage
        delete (window as any).__csvContacts
        setPreview([])
      } catch (err) {
        setError(`Failed to load contacts: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const clearUpload = () => {
    setError(null)
    setSuccess(null)
    setPreview([])
    delete (window as any).__csvContacts
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Upload Contact List</CardTitle>
        <CardDescription>
          Upload a CSV file with columns: Name, Phone, Company, Title, Industry (optional), Email (optional)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* File Upload */}
          <div className="flex items-center gap-4">
            <label
              htmlFor="csv-upload"
              className={cn(
                "flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer",
                "hover:border-primary hover:bg-primary/5 transition-colors",
                isUploading && "opacity-50 cursor-not-allowed"
              )}
            >
              <Upload className="h-5 w-5" />
              <span>{isUploading ? 'Processing...' : 'Choose CSV File'}</span>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>

            {queue.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Current queue: {queue.length} contacts
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <pre className="whitespace-pre-wrap text-xs">{error}</pre>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Table */}
          {preview.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Preview (first 5 contacts):</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Name</th>
                      <th className="text-left py-2 px-3">Phone</th>
                      <th className="text-left py-2 px-3">Company</th>
                      <th className="text-left py-2 px-3">Title</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((contact, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 px-3">{contact.name}</td>
                        <td className="py-2 px-3 font-mono text-xs">{contact.phone}</td>
                        <td className="py-2 px-3">{contact.company}</td>
                        <td className="py-2 px-3">{contact.title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <Button onClick={loadContactsToQueue} size="sm" disabled={isUploading}>
                  {isUploading ? 'Loading...' : 'Add to Contacts & Call Queue'}
                </Button>
                <Button onClick={clearUpload} variant="outline" size="sm" disabled={isUploading}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* CSV Format Help */}
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Expected CSV format:</p>
            <code className="block bg-muted p-2 rounded">
              Name,Phone,Company,Title,Industry,Email<br />
              John Doe,+14155551234,Acme Corp,CEO,Technology,john@acme.com<br />
              Jane Smith,+14155555678,Beta Inc,CTO,Finance,jane@beta.com
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}