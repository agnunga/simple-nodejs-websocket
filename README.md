# WebSocket Multiplexing Application

A complete NodeJS application demonstrating WebSocket communication with channel multiplexing, featuring both a CLI client and a modern web interface.

## 🚀 Features

- ✅ **Asynchronous WebSocket Server** using NodeJS and Express
- ✅ **CLI Client** with interactive command interface
- ✅ **Modern Web Interface** with real-time updates
- ✅ **Channel Multiplexing** - multiple logical channels over one connection
- ✅ **HTTP REST API** for server status and broadcasting
- ✅ **Bi-directional Communication** with WebSockets
- ✅ **Auto-reconnection** with exponential backoff
- ✅ **Real-time Statistics** and message logging
- ✅ **Responsive UI/UX** with animations and modern design

## 📁 Project Structure

```
project/
├── server.js           # WebSocket server with multiplexing
├── client.js           # CLI client application
├── package.json        # Dependencies and scripts
├── public/
│   └── index.html      # Web interface dashboard
└── README.md          # This file
```

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)

## 🔧 Installation

1. **Create project directory**:
```bash
mkdir websocket-multiplexing
cd websocket-multiplexing
```

2. **Create the files**:
    - Create `server.js` (copy from Server artifact)
    - Create `client.js` (copy from Client artifact)
    - Create `package.json` (copy from Package Configuration artifact)
    - Create `public/index.html` (copy from Web Interface artifact)

3. **Install dependencies**:
```bash
npm install
```

This will install:
- `express` - Web server framework
- `ws` - WebSocket implementation

## 🎮 Usage

### Starting the Server

```bash
npm start
```

The server will start on port 3000 and provide:
- **WebSocket endpoint**: `ws://localhost:3000`
- **Web interface**: `http://localhost:3000`
- **API endpoint**: `http://localhost:3000/api/status`

You should see:
```
[Server] HTTP and WebSocket server running on port 3000
[Server] WebSocket endpoint: ws://localhost:3000
[Server] HTTP API: http://localhost:3000/api/status
```

### Using the Web Interface

1. Open your browser to `http://localhost:3000`
2. The dashboard will automatically connect via WebSocket
3. You'll see your connection ID and status in the header

**Features**:
- **Subscribe to channels**: Enter a channel name and click "Subscribe"
- **Send messages**: Select a channel, type a message, and click "Send to Channel"
- **Test latency**: Click "Ping Server" to measure round-trip time
- **View statistics**: Monitor messages, channels, and uptime
- **Real-time logs**: See all incoming/outgoing messages

### Using the CLI Client

In a **new terminal** (keep server running):

```bash
npm run client
```

**Available commands**:
```
subscribe <channel>     - Subscribe to a channel
unsubscribe <channel>   - Unsubscribe from a channel
send <channel> <msg>    - Send message to channel
direct <id> <msg>       - Send direct message to connection ID
ping                    - Test connection latency
quit                    - Exit the client
```

**Example session**:
```bash
# Subscribe to a gaming channel
subscribe gaming

# Send a message to the gaming channel
send gaming Anyone want to play?

# Subscribe to alerts
subscribe alerts

# Send direct message to connection #2
direct 2 Hey there!

# Test latency
ping

# Exit
quit
```

## 🔌 API Endpoints

### GET /api/status

Check server status and connection count.

**Request**:
```bash
curl http://localhost:3000/api/status
```

**Response**:
```json
{
  "status": "online",
  "connections": 3,
  "uptime": 1234.56,
  "timestamp": "2025-10-25T12:00:00.000Z"
}
```

### POST /api/broadcast

Broadcast a message to all clients on a specific channel.

**Request**:
```bash
curl -X POST http://localhost:3000/api/broadcast \
  -H "Content-Type: application/json" \
  -d '{"channel": "alerts", "message": "Server maintenance in 10 minutes"}'
```

**Response**:
```json
{
  "success": true,
  "recipients": 5
}
```

## 🔀 Understanding Multiplexing

**Multiplexing** allows multiple logical communication channels over a single WebSocket connection:

### Without Multiplexing
- Need separate connections for chat, notifications, updates, etc.
- More resource usage (memory, CPU, network)
- More complex connection management

### With Multiplexing
- One WebSocket connection handles all channels
- Efficient resource utilization
- Simplified connection management
- Messages tagged with channel identifiers

### Message Structure

All messages follow this format:
```javascript
{
  type: 'message',      // Message type
  channel: 'chat',      // Target channel
  data: 'Hello!',       // Actual content
  timestamp: 1698249600 // Unix timestamp
}
```

### Channel Operations

**Subscribe**:
```javascript
{
  type: 'subscribe',
  channel: 'notifications'
}
```

**Send to Channel**:
```javascript
{
  type: 'message',
  channel: 'chat',
  data: 'Your message here'
}
```

**Direct Message** (bypasses channels):
```javascript
{
  type: 'direct',
  targetId: 2,
  data: 'Private message'
}
```

## 🧪 Testing the Application

### Test 1: Multiple Browser Tabs

1. Open `http://localhost:3000` in 3 different tabs
2. Subscribe each tab to different channels:
    - Tab 1: `general`, `announcements`
    - Tab 2: `general`, `support`
    - Tab 3: `announcements`, `support`
3. Send messages to each channel
4. Observe that only subscribed tabs receive messages

### Test 2: CLI + Web Interface

1. Start server: `npm start`
2. Open web interface: `http://localhost:3000`
3. Start CLI client: `npm run client`
4. Subscribe both to a common channel (e.g., `gaming`)
5. Send messages from CLI: `send gaming Hello from CLI!`
6. See the message appear in the web interface
7. Send from web interface and see it in CLI

### Test 3: Load Testing

1. Open multiple CLI clients (4-5 terminals)
2. Subscribe all to a common channel
3. Send rapid messages
4. Monitor server console for multiplexing logs
5. Check web interface statistics

## 🎨 UI/UX Features

The web interface implements modern design principles:

- **Gradient backgrounds** for visual appeal
- **Real-time animations** when messages arrive
- **Color-coded message types** for easy scanning
- **Responsive design** works on mobile and desktop
- **Smooth transitions** and hover effects
- **Status indicators** with pulse animation
- **Auto-scrolling logs** for latest messages
- **Keyboard shortcuts** (Enter to send)
- **Loading states** and connection feedback

## 🔧 Configuration

### Change Server Port

Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3000; // Change 3000 to your port
```

Or use environment variable:
```bash
PORT=8080 npm start
```

### Adjust Reconnection Settings

Edit `client.js`:
```javascript
this.maxReconnectAttempts = 5;  // Max retry attempts
```

### Modify Heartbeat Interval

Edit `server.js`:
```javascript
setInterval(() => {
  // Send heartbeat
}, 30000);  // Change 30000 (30 seconds)
```

## 📊 Monitoring

### Server Logs

Watch console output for:
- `[WebSocket] Client X connected` - New connection
- `[Multiplexing] Client X subscribed to Y` - Channel subscription
- `[Multiplexing] Broadcast to channel 'X': N recipients` - Message routing

### Web Interface Statistics

Real-time metrics display:
- **Messages Received** - Total incoming messages
- **Active Channels** - Number of subscribed channels
- **Messages Sent** - Total outgoing messages
- **Connection Time** - Session duration

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000 (Linux/Mac)
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

### WebSocket Connection Failed
- Check if server is running
- Verify firewall allows port 3000
- Check browser console for errors
- Try using `http://localhost:3000` instead of `127.0.0.1`

### Client Can't Connect
- Ensure server started successfully
- Check network connectivity
- Verify WebSocket URL in code matches server

## 🚀 Production Deployment

For production use, consider:

1. **Use WSS (WebSocket Secure)** with TLS/SSL
2. **Add authentication** for channel access
3. **Implement rate limiting** to prevent abuse
4. **Add message validation** and sanitization
5. **Use a reverse proxy** (nginx) for load balancing
6. **Enable logging** to files
7. **Add monitoring** (Prometheus, Grafana)
8. **Use PM2** or similar for process management

## 📚 Learning Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [WebSocket Protocol (RFC 6455)](https://tools.ietf.org/html/rfc6455)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [ws Library](https://github.com/websockets/ws)

## 📝 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

This is an educational project demonstrating WebSocket multiplexing concepts. Feel free to extend it with additional features!

## ✨ Next Steps

Try adding:
- User authentication and authorization
- Message persistence (database)
- File upload support
- Video/audio streaming channels
- Channel access control
- Message encryption
- Typing indicators
- Read receipts
- User presence tracking

---

**Built with ❤️ using Node.js, Express, WebSockets, and modern JavaScript**