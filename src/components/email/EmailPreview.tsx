import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface EmailPreviewProps {
  contact: any
  settings: any
}

export default function EmailPreview({ contact, settings }: EmailPreviewProps) {
  const [preview, setPreview] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate email generation for preview
    const generatePreview = async () => {
      setLoading(true)
      try {
        // In real implementation, this would call the API
        // For now, we'll create a mock preview
        const mockPreview = {
          subject: `${contact.name}, ${settings.subjectStyle === 'question' ? 'Quick question about' : 'Helping'} ${contact.company}`,
          body: `Hi ${contact.name?.split(' ')[0] || 'there'},\n\n` +
            `I noticed ${contact.company} is ${settings.focusAreas.includes('pain-points') ? 'likely facing challenges with' : 'growing in'} ` +
            `${contact.industry || 'your industry'}. ` +
            `${settings.tone === 'Professional' ? 'I wanted to reach out because' : 'Just reaching out as'} ` +
            `we've helped similar companies ${settings.includeFeatures.includes('social-proof') ? 'like yours' : ''} ` +
            `achieve significant results.\n\n` +
            `Would you be open to a ${settings.cta}?\n\n` +
            `Best regards,\n[Your Name]`,
          personalizationNotes: [
            'Company name',
            'Industry reference',
            'Pain point mention'
          ]
        }
        setPreview(mockPreview)
      } finally {
        setLoading(false)
      }
    }

    generatePreview()
  }, [contact, settings])

  if (loading) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-4 sticky top-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Email Preview
          <Badge variant="secondary">Sample</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Subject:</p>
          <p className="text-sm font-medium">{preview?.subject}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Body:</p>
          <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
            {preview?.body}
          </p>
        </div>
        {preview?.personalizationNotes.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Personalization:</p>
            <div className="flex flex-wrap gap-1">
              {preview.personalizationNotes.map((note: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {note}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}