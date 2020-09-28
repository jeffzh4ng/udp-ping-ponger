import dgram from 'dgram'

const server = dgram.createSocket('udp4')
server.bind(3000, () => {
  console.log('server listening on port 3000')

  server.on('message', (msg, rinfo) => {
    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`)

    server.send(msg, rinfo.port, 'localhost', (error, bytes) => {
      if (error) {
        console.log('Error while sending message to cloent:', error)
      } else {
        console.log(`Sent ${bytes} bytes to client.`)
      }
    })
  })

  server.on('error', (error) => {
    console.log('Error:', error)
    server.close()
  })
})
