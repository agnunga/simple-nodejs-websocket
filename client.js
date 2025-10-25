const WebSocket = require('ws');
const readline = require('readline');

class MultiplexedWebSocketClient {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.connectionId = null;
        this.subscribedChannels = new Set(['default']);
        this.messageHandlers = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect() {
        return new Promise((resolve, reject) => {
            console.log(`[Client] Connecting to ${this.url}...`);

            this.ws = new WebSocket(this.url);

            this.ws.on('open', () => {
                console.log('[Client] Connected to WebSocket server');
                this.reconnectAttempts = 0;
                resolve();
            });

            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('[Client] Error parsing message:', error);
                }
            });

            this.ws.on('close', () => {
                console.log('[Client] Connection closed');
                this.attemptReconnect();
            });

            this.ws.on('error', (error) => {
                console.error('[Client] WebSocket error:', error.message);
                reject(error);
            });
        });
    }

    handleMessage(message) {
        console.log(`[Client] Received:`, message);

        // Store connection ID when first connected
        if (message.type === 'connection') {
            this.connectionId = message.connectionId;
            console.log(`[Client] Assigned connection ID: ${this.connectionId}`);
        }

        // Handle different message types
        switch (message.type) {
            case 'channel_message':
                console.log(`[Channel: ${message.channel}] Message from connection ${message.connectionId}:`, message.data);
                break;
            case 'direct_message':
                console.log(`[Direct] Message from connection ${message.from}:`, message.data);
                break;
            case 'subscribed':
                console.log(`[Multiplexing] Successfully subscribed to channel: ${message.channel}`);
                break;
            case 'unsubscribed':
                console.log(`[Multiplexing] Successfully unsubscribed from channel: ${message.channel}`);
                break;
            case 'broadcast':
                console.log(`[Broadcast on ${message.channel}]:`, message.message);
                break;
            case 'heartbeat':
                // Silent heartbeat
                break;
            case 'pong':
                console.log('[Client] Pong received');
                break;
        }

        // Call registered handlers
        if (this.messageHandlers.has(message.type)) {
            this.messageHandlers.get(message.type)(message);
        }
    }

    // Multiplexing: Subscribe to a channel
    subscribe(channel) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.subscribedChannels.add(channel);
            this.send({
                type: 'subscribe',
                channel
            });
        }
    }

    // Multiplexing: Unsubscribe from a channel
    unsubscribe(channel) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.subscribedChannels.delete(channel);
            this.send({
                type: 'unsubscribe',
                channel
            });
        }
    }

    // Send message to a specific channel
    sendToChannel(channel, data) {
        this.send({
            type: 'message',
            channel,
            data
        });
    }

    // Send direct message to another connection
    sendDirect(targetId, data) {
        this.send({
            type: 'direct',
            targetId,
            data
        });
    }

    // Send ping
    ping() {
        this.send({
            type: 'ping'
        });
    }

    // Generic send method
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            console.log('[Client] Sent:', message);
        } else {
            console.error('[Client] Cannot send - not connected');
        }
    }

    // Register message handler
    onMessage(type, handler) {
        this.messageHandlers.set(type, handler);
    }

    // Reconnection logic
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
            console.log(`[Client] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
                this.connect().catch(() => {});
            }, delay);
        } else {
            console.log('[Client] Max reconnection attempts reached');
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Interactive CLI for testing
async function startInteractiveCLI() {
    const client = new MultiplexedWebSocketClient('ws://localhost:3000');

    try {
        await client.connect();

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('\n=== WebSocket Client CLI ===');
        console.log('Commands:');
        console.log('  subscribe <channel>     - Subscribe to a channel');
        console.log('  unsubscribe <channel>   - Unsubscribe from a channel');
        console.log('  send <channel> <msg>    - Send message to channel');
        console.log('  direct <id> <msg>       - Send direct message');
        console.log('  ping                    - Send ping to server');
        console.log('  quit                    - Exit\n');

        rl.on('line', (line) => {
            const parts = line.trim().split(' ');
            const command = parts[0];

            switch (command) {
                case 'subscribe':
                    if (parts[1]) client.subscribe(parts[1]);
                    break;
                case 'unsubscribe':
                    if (parts[1]) client.unsubscribe(parts[1]);
                    break;
                case 'send':
                    if (parts[1] && parts[2]) {
                        client.sendToChannel(parts[1], parts.slice(2).join(' '));
                    }
                    break;
                case 'direct':
                    if (parts[1] && parts[2]) {
                        client.sendDirect(parseInt(parts[1]), parts.slice(2).join(' '));
                    }
                    break;
                case 'ping':
                    client.ping();
                    break;
                case 'quit':
                    client.disconnect();
                    rl.close();
                    process.exit(0);
                    break;
            }
        });

    } catch (error) {
        console.error('[Client] Failed to connect:', error);
    }
}

// Run if executed directly
if (require.main === module) {
    startInteractiveCLI();
}

module.exports = MultiplexedWebSocketClient;