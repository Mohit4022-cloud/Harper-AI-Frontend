const http = require('http')

const options = {
  hostname: '0.0.0.0',
  port: process.env.PORT || 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 3000,
}

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0)
  } else {
    process.exit(1)
  }
})

req.on('error', () => {
  process.exit(1)
})

req.on('timeout', () => {
  req.destroy()
  process.exit(1)
})

req.end()