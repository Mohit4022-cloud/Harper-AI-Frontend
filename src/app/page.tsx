// This is the root page that redirects to marketing or dashboard
import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redirect to marketing page - the marketing page will handle auth redirect if needed
  redirect('/(marketing)')
}