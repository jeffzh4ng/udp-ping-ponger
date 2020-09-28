import dgram from 'dgram'
import * as uuid from 'uuid'

interface Message {
  uuid: string
  sentTimestamp?: number
  responseTimestamp?: number
}

const messages: Array<Message> = []

const client = dgram.createSocket('udp4')
client.on('message', (messageBuffer, rinfo) => {
  const receivedMessage = bufferToMessage(messageBuffer)
  const message = messages.find((message) => message.uuid === receivedMessage?.uuid)
  if (message) message.responseTimestamp = new Date().getSeconds()
})

const bufferToMessage = (messageBuffer: Buffer) => {
  try {
    return JSON.parse(messageBuffer.toString('utf-8'))
  } catch (error) {
    return null
  }
}

const sendMessages = async (times: number, host: string, port: number, timeout: number) => {
  for (let i = 0; i < times; i++) {
    const message = createMessage()
    await sendMessage(message, host, port)
    await wait(timeout)

    if (message.responseTimestamp) {
      console.log(
        // @ts-ignore
        `Response received after ${message.responseTimestamp - message.sentTimestamp} ms...`
      )
    } else {
      console.log(`No response received after ${timeout} ms...`)
    }
  }

  logStatistics(messages)
}

const createMessage = (): Message => ({ uuid: uuid.v4() })

const sendMessage = (message: any, host: string, port: number) => {
  messages.push(message)
  console.log(`Sending message #${messages.length}`)
  message.sentTimestamp = new Date().getSeconds()

  const messageBuffer = createMessageBuffer(message)

  return new Promise((resolve, reject) => {
    client.send(messageBuffer, port, host, (error, bytes) => {
      if (error) reject(error)

      resolve(bytes)
    })
  })
}

const createMessageBuffer = (message: any) => Buffer.from(JSON.stringify(message), 'utf-8')

const wait = (timeout: number) => new Promise((resolve) => setTimeout(resolve, timeout))

const logStatistics = (messages: Array<any>) => {
  const messagesSent = messages.length
  const messagesReceived = messages.filter((m) => m.responseTimestamp).length
  const messagesLost = messagesSent - messagesReceived

  console.log(`Total messages sent: ${messagesSent}`)
  console.log(`Total messages received: ${messagesReceived}`)
  console.log(
    `Total messages lost: ${messagesLost} / ${(
      (100 * messagesLost) /
      (messages.length || 1)
    ).toFixed(2)}%`
  )

  if (messagesReceived > 0) {
    console.log(
      `Average response interval:`,
      messages
        .filter((m) => m.responseTimestamp)
        .reduce((averageTime, message) => {
          averageTime += (message.responseTimestamp - message.sentTimestamp) / messagesReceived
          return averageTime
        }, 0) + ' ms'
    )
  }
}

const HOST = 'localhost'
const PORT = 3000

sendMessages(10, HOST, PORT, 1000)
