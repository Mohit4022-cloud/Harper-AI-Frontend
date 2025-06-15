#!/usr/bin/env node

const { io } = require('socket.io-client')
const { faker } = require('@faker-js/faker')

// Connect to WebSocket server
const socket = io('http://localhost:3001', {
  transports: ['websocket'],
})

// Test data generators
function generateContact() {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    company: faker.company.name(),
    status: faker.helpers.arrayElement(['active', 'inactive', 'pending']),
    tags: faker.helpers.arrayElements(['lead', 'customer', 'prospect', 'partner'], { min: 1, max: 3 }),
    score: faker.number.int({ min: 0, max: 100 }),
    lastContact: faker.date.recent({ days: 30 }).toISOString(),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
  }
}

function generateCallEvent() {
  const callId = faker.string.uuid()
  const contactId = faker.string.uuid()
  
  return {
    callId,
    contactId,
    type: faker.helpers.arrayElement(['inbound', 'outbound']),
    status: 'connected',
    duration: 0,
    startTime: new Date().toISOString(),
    participant: {
      name: faker.person.fullName(),
      phone: faker.phone.number(),
    },
    metrics: {
      sentiment: faker.helpers.arrayElement(['positive', 'neutral', 'negative']),
      talkTime: 0,
      silenceTime: 0,
    },
  }
}

function generateTranscriptEntry() {
  return {
    speaker: faker.helpers.arrayElement(['agent', 'customer']),
    text: faker.lorem.sentence(),
    timestamp: new Date().toISOString(),
    sentiment: faker.helpers.arrayElement(['positive', 'neutral', 'negative']),
    confidence: faker.number.float({ min: 0.8, max: 1, precision: 0.01 }),
  }
}

// Socket event handlers
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server')
  console.log('🚀 Starting development test simulation...\n')
})

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket server')
})

socket.on('error', (error) => {
  console.error('Socket error:', error)
})

// Test scenarios
async function runTests() {
  console.log('📞 Test 1: Simulating real-time contact updates')
  const contactInterval = setInterval(() => {
    const contact = generateContact()
    socket.emit('contact:update', contact)
    console.log(`  → Updated contact: ${contact.name} (${contact.status})`)
  }, 2000)

  setTimeout(() => {
    clearInterval(contactInterval)
    console.log('\n📞 Test 2: Simulating voice call with live transcript')
    
    const callEvent = generateCallEvent()
    socket.emit('call:start', callEvent)
    console.log(`  → Call started: ${callEvent.callId}`)
    
    // Simulate transcript updates
    let transcriptCount = 0
    const transcriptInterval = setInterval(() => {
      if (transcriptCount >= 10) {
        clearInterval(transcriptInterval)
        
        // End the call
        socket.emit('call:end', {
          ...callEvent,
          status: 'completed',
          duration: 45,
          endTime: new Date().toISOString(),
          recording: {
            url: 'https://example.com/recording.mp3',
            duration: 45,
          },
          summary: {
            keyPoints: [
              'Customer interested in premium plan',
              'Scheduled follow-up for next week',
              'Sent pricing information via email',
            ],
            nextSteps: ['Send contract', 'Schedule demo'],
            sentiment: 'positive',
          },
        })
        console.log(`  → Call ended: ${callEvent.callId} (45s duration)`)
        
        setTimeout(() => {
          runMetricsTest()
        }, 2000)
        return
      }
      
      const transcript = generateTranscriptEntry()
      socket.emit('call:transcript', {
        callId: callEvent.callId,
        entry: transcript,
      })
      console.log(`  → ${transcript.speaker}: "${transcript.text}"`)
      transcriptCount++
    }, 1500)
  }, 10000)
}

function runMetricsTest() {
  console.log('\n📊 Test 3: Simulating real-time metrics updates')
  
  const metricsInterval = setInterval(() => {
    const metrics = {
      totalCalls: faker.number.int({ min: 100, max: 500 }),
      activeCalls: faker.number.int({ min: 0, max: 20 }),
      avgCallDuration: faker.number.int({ min: 120, max: 300 }),
      conversionRate: faker.number.float({ min: 0.1, max: 0.3, precision: 0.01 }),
      totalContacts: faker.number.int({ min: 5000, max: 10000 }),
      contactsReached: faker.number.int({ min: 1000, max: 3000 }),
    }
    
    socket.emit('metrics:update', metrics)
    console.log(`  → Metrics: ${metrics.activeCalls} active calls, ${metrics.conversionRate * 100}% conversion`)
  }, 3000)
  
  setTimeout(() => {
    clearInterval(metricsInterval)
    console.log('\n✨ Test simulation complete!')
    console.log('💡 The WebSocket server will continue running. Press Ctrl+C to stop.\n')
  }, 15000)
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down test client...')
  socket.disconnect()
  process.exit(0)
})

// Start tests
runTests()