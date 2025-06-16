'use client'

import { useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, Settings, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { HarperAIGeminiIntegration, ProcessingResult } from '@/lib/gemini/integration'
import Papa from 'papaparse'

const geminiIntegration = new HarperAIGeminiIntegration();

export default function ZoomInfoUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [customInstructions, setCustomInstructions] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<ProcessingResult[]>([])
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Check if API key is already set
  const checkApiKey = useCallback(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key')
    if (savedApiKey) {
      try {
        geminiIntegration.initialize(savedApiKey)
        return true
      } catch (error) {
        console.error('Invalid saved API key:', error)
        localStorage.removeItem('gemini_api_key')
        return false
      }
    }
    return false
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (uploadedFile && uploadedFile.type === 'text/csv') {
      setFile(uploadedFile)
      setError(null)
    } else {
      setError('Please upload a CSV file')
    }
  }

  const handleApiKeySave = () => {
    if (!apiKeyInput.trim()) {
      setError('Please enter a valid API key')
      return
    }

    try {
      geminiIntegration.initialize(apiKeyInput)
      localStorage.setItem('gemini_api_key', apiKeyInput)
      setShowApiKeyDialog(false)
      setApiKeyInput('')
      setError(null)
    } catch (error) {
      setError('Failed to initialize with API key')
    }
  }

  const processCSV = async () => {
    if (!file) {
      setError('Please upload a file first')
      return
    }

    if (!geminiIntegration.isReady() && !checkApiKey()) {
      setShowApiKeyDialog(true)
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const text = await file.text()
      
      Papa.parse(text, {
        header: true,
        complete: async (result) => {
          try {
            const processedResults = await geminiIntegration.processZoomInfoContacts(
              result.data,
              customInstructions
            )
            setResults(processedResults)
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Processing failed')
          } finally {
            setIsProcessing(false)
          }
        },
        error: (error: Error) => {
          setError(`CSV parsing error: ${error.message}`)
          setIsProcessing(false)
        }
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to read file')
      setIsProcessing(false)
    }
  }

  const exportResults = () => {
    const emailData = results
      .filter(r => r.status === 'QUALIFIED' && r.email)
      .map(r => ({
        name: r.contact.fullName,
        email: r.contact.email,
        company: r.contact.companyName,
        generatedEmail: r.email
      }))

    const csv = Papa.unparse(emailData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'generated_emails.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusIcon = (status: ProcessingResult['status']) => {
    switch (status) {
      case 'QUALIFIED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'NOT_QUALIFIED':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'ERROR':
        return <XCircle className="h-5 w-5 text-orange-500" />
    }
  }

  const getStatusColor = (status: ProcessingResult['status']) => {
    switch (status) {
      case 'QUALIFIED':
        return 'text-green-600'
      case 'NOT_QUALIFIED':
        return 'text-red-600'
      case 'ERROR':
        return 'text-orange-600'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            ZoomInfo CSV Upload
          </CardTitle>
          <CardDescription>
            Upload a ZoomInfo export CSV to generate personalized emails using Gemini AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key Setup Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiKeyDialog(true)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Setup Gemini API
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-upload">ZoomInfo CSV File</Label>
            <div className="flex items-center gap-4">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
              {file && (
                <span className="text-sm text-muted-foreground">
                  {file.name}
                </span>
              )}
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Custom Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              placeholder="Add any specific instructions for email generation..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={3}
              disabled={isProcessing}
            />
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Process Button */}
          <Button
            onClick={processCSV}
            disabled={!file || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing ZoomInfo Data...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Generate Emails
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Display */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Results</CardTitle>
            <CardDescription>
              {results.filter(r => r.status === 'QUALIFIED').length} qualified contacts out of {results.length} total
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={exportResults}
                variant="outline"
                disabled={results.filter(r => r.status === 'QUALIFIED').length === 0}
              >
                Export Qualified Emails
              </Button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{result.contact.fullName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.contact.jobTitle} at {result.contact.companyName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                        {result.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {result.status === 'NOT_QUALIFIED' && result.reasons && (
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">Disqualification reasons:</p>
                      <ul className="list-disc list-inside">
                        {result.reasons.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.status === 'QUALIFIED' && result.email && (
                    <div className="bg-muted p-3 rounded-md">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {result.email}
                      </pre>
                    </div>
                  )}

                  {result.status === 'ERROR' && result.error && (
                    <p className="text-sm text-red-600">Error: {result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Key Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setup Gemini API Key</DialogTitle>
            <DialogDescription>
              Enter your Gemini API key to enable email generation. 
              Get your key from{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google AI Studio
              </a>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your Gemini API key..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApiKeySave}>
              Save API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}