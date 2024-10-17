// Broadcast a message to all connected clients
export function broadcast(message, wss) {
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(message)
    }
  }
}
