import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEmailAnalytics } from '@/hooks/useEmailAnalytics'

interface GeneratedEmail {
  contact: any
  email: {
    subject: string
    body: string
    personalizationNotes: string[]
  }
}

interface AnalyticsModalProps {
  emails: GeneratedEmail[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AnalyticsModal({ emails, open, onOpenChange }: AnalyticsModalProps) {
  const analytics = useEmailAnalytics(emails)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Email Generation Analytics</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Average Word Count</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analytics.avgWordCount}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Reading Level</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="text-lg">{analytics.readingLevel}</Badge>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Spam Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analytics.spamScore}%</p>
              <p className="text-xs text-muted-foreground">
                {analytics.spamScore < 30 ? 'Low risk' : 'Review recommended'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Personalization Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analytics.personalizationScore}/10</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Top Personalization Elements</h4>
          <div className="flex flex-wrap gap-2">
            {analytics.topPersonalizations.map((element, idx) => (
              <Badge key={idx} variant="secondary">{element}</Badge>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}