// API configuration for body parser limits
// This needs to be exported from each API route that needs custom limits

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
}

// Specific configurations for different types of uploads
export const imageUploadConfig = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
}

export const csvUploadConfig = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
}

export const documentUploadConfig = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
}
