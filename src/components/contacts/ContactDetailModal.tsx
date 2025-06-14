'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Mail, 
  Phone, 
  Building, 
  Linkedin, 
  Twitter, 
  Calendar, 
  MapPin,
  Edit,
  Activity,
  MessageSquare,
  FileText,
  Clock,
  Target,
  TrendingUp,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  title?: string | null
  department?: string | null
  company?: {
    id: string
    name: string
    domain?: string | null
    industry?: string | null
  } | null
  leadStatus: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'WON'
  leadScore: number
  assignedTo?: {
    id: string
    name: string
    email: string
    avatar?: string | null
  } | null
  tags: string[]
  createdAt: string
  lastContactedAt?: string | null
  linkedin?: string | null
  twitter?: string | null
  _count: {
    activities: number
    emails: number
    calls: number
    tasks: number
    notes: number
  }
}

interface ContactDetailModalProps {
  contact: Contact | null
  isOpen: boolean
  onClose: () => void
  onEdit: (contact: Contact) => void
}

const leadStatusConfig = {
  NEW: { label: 'New', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  CONTACTED: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-800', icon: Activity },
  QUALIFIED: { label: 'Qualified', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  LOST: { label: 'Lost', color: 'bg-red-100 text-red-800', icon: XCircle },
  WON: { label: 'Won', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
}

const getLeadScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 bg-green-50'
  if (score >= 60) return 'text-yellow-600 bg-yellow-50'
  if (score >= 40) return 'text-orange-600 bg-orange-50'
  return 'text-red-600 bg-red-50'
}

export default function ContactDetailModal({ 
  contact, 
  isOpen, 
  onClose, 
  onEdit 
}: ContactDetailModalProps) {
  if (!contact) return null

  const StatusIcon = leadStatusConfig[contact.leadStatus].icon

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {contact.firstName[0]}{contact.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {contact.firstName} {contact.lastName}
                </DialogTitle>
                <p className="text-gray-600 mt-1">{contact.email}</p>
                {contact.title && (
                  <p className="text-sm text-gray-500">
                    {contact.title}
                    {contact.department && ` • ${contact.department}`}
                  </p>
                )}
              </div>
            </div>
            <Button onClick={() => onEdit(contact)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Lead Status and Score */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Lead Status</p>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "font-medium text-sm px-3 py-1",
                          leadStatusConfig[contact.leadStatus].color
                        )}
                      >
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {leadStatusConfig[contact.leadStatus].label}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Lead Score</p>
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-md",
                        getLeadScoreColor(contact.leadScore)
                      )}>
                        <Target className="h-4 w-4" />
                        <span className="text-2xl font-bold">{contact.leadScore}</span>
                        <span className="text-sm">/100</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {contact.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{contact.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{contact.email}</p>
                    </div>
                  </div>

                  {contact.linkedin && (
                    <div className="flex items-center gap-3">
                      <Linkedin className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">LinkedIn</p>
                        <a 
                          href={contact.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline"
                        >
                          View Profile
                        </a>
                      </div>
                    </div>
                  )}

                  {contact.twitter && (
                    <div className="flex items-center gap-3">
                      <Twitter className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Twitter</p>
                        <p className="font-medium">@{contact.twitter}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            {contact.company && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Company</p>
                        <p className="font-medium">{contact.company.name}</p>
                      </div>
                    </div>

                    {contact.company.domain && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Domain</p>
                          <a 
                            href={`https://${contact.company.domain}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {contact.company.domain}
                          </a>
                        </div>
                      </div>
                    )}

                    {contact.company.industry && (
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Industry</p>
                          <p className="font-medium">{contact.company.industry}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {contact.assignedTo && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Assigned To</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={contact.assignedTo.avatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {contact.assignedTo.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-medium">{contact.assignedTo.name}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-medium">
                        {format(new Date(contact.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  {contact.lastContactedAt && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Last Contacted</p>
                        <p className="font-medium">
                          {format(new Date(contact.lastContactedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {contact.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{contact._count.activities}</p>
                    <p className="text-sm text-gray-600">Activities</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{contact._count.emails}</p>
                    <p className="text-sm text-gray-600">Emails</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Phone className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{contact._count.calls}</p>
                    <p className="text-sm text-gray-600">Calls</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{contact._count.notes}</p>
                    <p className="text-sm text-gray-600">Notes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500 text-center py-8">
                  Activity timeline coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500 text-center py-8">
                  Timeline view coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500 text-center py-8">
                  Notes section coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}