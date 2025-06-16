import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Shuffle, Copy, Eye } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import EmailPreview from './EmailPreview'

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

interface EmailSettingsPanelProps {
  settings: EmailSettings
  onSettingsChange: (settings: EmailSettings) => void
  previewContact?: any
}

const TONES = ['Professional', 'Consultative', 'Direct', 'Friendly', 'Urgent']

export default function EmailSettingsPanel({ 
  settings, 
  onSettingsChange,
  previewContact 
}: EmailSettingsPanelProps) {
  const { toast } = useToast()
  const [showPreview, setShowPreview] = useState(false)

  const randomizeTone = () => {
    const currentIndex = TONES.indexOf(settings.tone)
    const newIndex = (currentIndex + 1) % TONES.length
    onSettingsChange({ ...settings, tone: TONES[newIndex] as any })
    toast({ title: "Tone Changed", description: `Set to ${TONES[newIndex]}` })
  }

  const copySettings = () => {
    navigator.clipboard.writeText(JSON.stringify(settings, null, 2))
    toast({ title: "Settings Copied", description: "Email settings copied to clipboard" })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure your email generation preferences</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={randomizeTone} title="Randomize tone">
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={copySettings} title="Copy settings">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tone</Label>
            <Select 
              value={settings.tone} 
              onValueChange={(value) => onSettingsChange({...settings, tone: value as any})}
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
              onValueChange={(value) => onSettingsChange({...settings, length: value as any})}
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
              onValueChange={(value) => onSettingsChange({...settings, subjectStyle: value as any})}
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
              onChange={(e) => onSettingsChange({...settings, cta: e.target.value})}
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
                        onSettingsChange({...settings, focusAreas: [...settings.focusAreas, area]})
                      } else {
                        onSettingsChange({...settings, focusAreas: settings.focusAreas.filter(a => a !== area)})
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
                        onSettingsChange({...settings, includeFeatures: [...settings.includeFeatures, feature]})
                      } else {
                        onSettingsChange({...settings, includeFeatures: settings.includeFeatures.filter(f => f !== feature)})
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
              onChange={(e) => onSettingsChange({...settings, customInstructions: e.target.value})}
              placeholder="Add any specific requirements..."
              rows={3}
            />
          </div>

          {previewContact && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          )}
        </CardContent>
      </Card>
      
      {showPreview && previewContact && (
        <EmailPreview 
          contact={previewContact}
          settings={settings}
        />
      )}
    </>
  )
}