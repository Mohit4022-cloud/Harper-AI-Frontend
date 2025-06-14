'use client'

import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  X, 
  ChevronDown, 
  Tag, 
  UserCheck, 
  Trash, 
  Archive,
  Mail,
  Edit,
  Target,
  Users,
} from 'lucide-react'

interface BulkActionsBarProps {
  selectedCount: number
  onClearSelection: () => void
  onBulkAction: (action: string) => void
}

export default function BulkActionsBar({ 
  selectedCount, 
  onClearSelection, 
  onBulkAction 
}: BulkActionsBarProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onClearSelection}
          className="hover:bg-blue-100"
        >
          <X className="h-4 w-4" />
        </Button>
        <span className="font-medium text-blue-900">
          {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white">
              <Tag className="h-4 w-4 mr-2" />
              Tags
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Tag Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onBulkAction('add-tags')}>
              Add Tags
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBulkAction('remove-tags')}>
              Remove Tags
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBulkAction('set-tags')}>
              Replace Tags
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white">
              <Edit className="h-4 w-4 mr-2" />
              Update
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Update Fields</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onBulkAction('update-status')}>
              Change Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBulkAction('update-assignee')}>
              <UserCheck className="h-4 w-4 mr-2" />
              Assign To
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBulkAction('score-leads')}>
              <Target className="h-4 w-4 mr-2" />
              Score Leads
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white">
              <Users className="h-4 w-4 mr-2" />
              Actions
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onBulkAction('send-email')}>
              <Mail className="h-4 w-4 mr-2" />
              Send Email Campaign
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBulkAction('add-to-segment')}>
              Add to Segment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBulkAction('remove-from-segment')}>
              Remove from Segment
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onBulkAction('archive')}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onBulkAction('delete')}
              className="text-red-600"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}