const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Store active connections with multiplexing channels
const connections = new Map();
let connectionIdCounter = 0;

// HTTP REST API endpoints
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        connections: connections.size,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.post('/api/broadcast', (req, res) => {
    const { message, channel = 'default' } = req.body;

    let sent = 0;
    connections.forEach((conn) => {
        if (conn.ws.readyState === WebSocket.OPEN) {
            conn.ws.send(JSON.stringify({
                type: 'broadcast',
                channel,
                message,
                timestamp: Date.now()
            }));
            sent++;
        }
    });

    res.json({ success: true, recipients: sent });
});

// WebSocket connection handler - implements multiplexing
wss.on('connection', (ws, req) => {
    const connectionId = ++connectionIdCounter;
    const clientIp = req.socket.remoteAddress;

    // Initialize connection with multiplexing support
    const connectionInfo = {
        id: connectionId,
        ws,
        ip: clientIp,
        channels: new Set(['default']), // Subscribed channels
        connectedAt: Date.now()
    };

    connections.set(connectionId, connectionInfo);

    console.log(`[WebSocket] Client ${connectionId} connected from ${clientIp}`);
    console.log(`[WebSocket] Total connections: ${connections.size}`);

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connection',
        connectionId,
        message: 'Connected to WebSocket server with multiplexing support',
        timestamp: Date.now()
    }));

    // Handle incoming messages with channel multiplexing
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log(`[WebSocket] Received from ${connectionId}:`, message);

            // Handle different message types (multiplexing logic)
            switch (message.type) {
                case 'subscribe':
                    // Subscribe to a channel
                    const conn = connections.get(connectionId);
                    if (conn) {
                        conn.channels.add(message.channel);
                        ws.send(JSON.stringify({
                            type: 'subscribed',
                            channel: message.channel,
                            timestamp: Date.now()
                        }));
                        console.log(`[Multiplexing] Client ${connectionId} subscribed to ${message.channel}. Active channels:`, Array.from(conn.channels));
                    }
                    break;

                case 'unsubscribe':
                    // Unsubscribe from a channel
                    const connUnsub = connections.get(connectionId);
                    if (connUnsub) {
                        connUnsub.channels.delete(message.channel);
                        ws.send(JSON.stringify({
                            type: 'unsubscribed',
                            channel: message.channel,
                            timestamp: Date.now()
                        }));
                        console.log(`[Multiplexing] Client ${connectionId} unsubscribed from ${message.channel}. Active channels:`, Array.from(connUnsub.channels));
                    }
                    break;

                case 'message':
                    // Send message to specific channel (multiplexing)
                    const channel = message.channel || 'default';
                    broadcastToChannel(channel, {
                        type: 'channel_message',
                        channel,
                        connectionId,
                        data: message.data,
                        timestamp: Date.now()
                    }); // Don't exclude sender - they should see their own messages
                    break;

                case 'direct':
                    // Direct message to specific connection
                    const targetConn = connections.get(message.targetId);
                    if (targetConn && targetConn.ws.readyState === WebSocket.OPEN) {
                        targetConn.ws.send(JSON.stringify({
                            type: 'direct_message',
                            from: connectionId,
                            data: message.data,
                            timestamp: Date.now()
                        }));
                    }
                    break;

                case 'ping':
                    // Heartbeat response
                    ws.send(JSON.stringify({
                        type: 'pong',
                        timestamp: Date.now()
                    }));
                    break;

                default:
                    // Echo back unknown messages
                    ws.send(JSON.stringify({
                        type: 'echo',
                        original: message,
                        timestamp: Date.now()
                    }));
            }
        } catch (error) {
            console.error(`[WebSocket] Error parsing message from ${connectionId}:`, error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format',
                timestamp: Date.now()
            }));
        }
    });

    // Handle connection close
    ws.on('close', () => {
        connections.delete(connectionId);
        console.log(`[WebSocket] Client ${connectionId} disconnected`);
        console.log(`[WebSocket] Total connections: ${connections.size}`);
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error(`[WebSocket] Error on connection ${connectionId}:`, error);
    });
});

// Broadcast to all connections subscribed to a channel (multiplexing)
function broadcastToChannel(channel, message, excludeId = null) {
    let sent = 0;
    let totalChecked = 0;
    connections.forEach((conn) => {
        totalChecked++;
        const isSubscribed = conn.channels.has(channel);
        const isNotExcluded = conn.id !== excludeId;
        const isOpen = conn.ws.readyState === WebSocket.OPEN;

        console.log(`[Multiplexing Debug] Checking connection ${conn.id}: subscribed=${isSubscribed}, notExcluded=${isNotExcluded}, open=${isOpen}, channels=[${Array.from(conn.channels).join(', ')}]`);

        if (isNotExcluded && isSubscribed && isOpen) {
            conn.ws.send(JSON.stringify(message));
            sent++;
        }
    });
    console.log(`[Multiplexing] Broadcast to channel '${channel}': ${sent} recipients (checked ${totalChecked} connections)`);
    return sent;
}

// Periodic connection health check
setInterval(() => {
    connections.forEach((conn) => {
        if (conn.ws.readyState === WebSocket.OPEN) {
            conn.ws.send(JSON.stringify({
                type: 'heartbeat',
                timestamp: Date.now()
            }));
        }
    });
}, 30000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Server] HTTP and WebSocket server running on port ${PORT}`);
    console.log(`[Server] WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`[Server] HTTP API: http://localhost:${PORT}/api/status`);
});