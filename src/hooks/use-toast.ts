import * as React from "react"

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

interface ToastContextType {
  toasts: Toast[]
  toast: (toast: Omit<Toast, "id">) => void
  dismiss: (toastId?: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Simple toast implementation for now
const toast = (props: Omit<Toast, "id">) => {
  if (typeof window !== 'undefined') {
    console.log('Toast:', props)
  }
}

const dismiss = (toastId?: string) => {
  if (typeof window !== 'undefined') {
    console.log('Dismiss toast:', toastId)
  }
}

// Export a simple implementation
export { toast, dismiss }