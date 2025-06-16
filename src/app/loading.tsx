export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
        </div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Loading...</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please wait while we prepare your experience</p>
      </div>
    </div>
  )
}