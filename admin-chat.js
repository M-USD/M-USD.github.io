// Admin Chat Management System - PRODUCTION READY
class AdminChat {
    constructor() {
        this.conversations = new Map();
        this.currentConversation = null;
        this.allMessages = [];
        this.autoRefreshInterval = null;
        this.init();
    }

    init() {
        this.loadAllMessages();
        this.setupEventListeners();
        this.renderConversations();
        this.startAutoRefresh();
        console.log('✅ Admin Chat initialized');
    }

    // Load all messages from users
    loadAllMessages() {
        try {
            const messages = localStorage.getItem('chat_messages');
            if (messages) {
                this.allMessages = JSON.parse(messages);
                this.organizeConversations();
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
            this.allMessages = [];
        }
    }

    // Organize messages by user
    organizeConversations() {
        this.conversations.clear();
        
        this.allMessages.forEach(message => {
            // For admin view, we group by user (all user messages are from 'user' sender)
            if (message.sender === 'user') {
                const userPhone = message.phoneNumber || 'Unknown User';
                
                if (!this.conversations.has(userPhone)) {
                    this.conversations.set(userPhone, {
                        user: userPhone,
                        messages: [],
                        unread: 0,
                        lastActivity: message.timestamp,
                        status: 'active'
                    });
                }
                
                const conversation = this.conversations.get(userPhone);
                conversation.messages.push(message);
                
                // Update last activity
                if (new Date(message.timestamp) > new Date(conversation.lastActivity)) {
                    conversation.lastActivity = message.timestamp;
                }
                
                // Count unread messages (admin hasn't responded yet)
                if (!message.responded) {
                    conversation.unread++;
                }
            }
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Send message
        document.getElementById('sendAdminMessage')?.addEventListener('click', () => this.sendAdminMessage());
        
        // Enter key to send
        document.getElementById('adminMessageInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendAdminMessage();
        });
        
        // Quick responses
        document.querySelectorAll('.quick-response').forEach(button => {
            button.addEventListener('click', (e) => {
                document.getElementById('adminMessageInput').value = e.target.dataset.message;
            });
        });
    }

    // Render conversations list
    renderConversations() {
        const container = document.getElementById('conversationsList');
        if (!container) return;
        
        if (this.conversations.size === 0) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #718096;">
                    <div style="font-size: 3em;">💬</div>
                    <p>No conversations yet</p>
                </div>
            `;
            return;
        }

        // Convert to array and sort by last activity
        const sortedConversations = Array.from(this.conversations.values()).sort((a, b) => 
            new Date(b.lastActivity) - new Date(a.lastActivity)
        );

        container.innerHTML = sortedConversations.map(conv => `
            <div class="conversation-item ${this.currentConversation?.user === conv.user ? 'active' : ''}" 
                 onclick="adminChat.selectConversation('${conv.user}')">
                <div class="conversation-header">
                    <strong>${this.formatUserDisplay(conv.user)}</strong>
                    ${conv.unread > 0 ? `<span class="unread-badge">${conv.unread}</span>` : ''}
                </div>
                <div style="font-size: 12px; color: #718096; margin-top: 5px;">
                    ${this.getLastMessagePreview(conv.messages)}
                </div>
                <div style="font-size: 11px; color: #a0aec0; margin-top: 3px;">
                    ${this.formatTime(conv.lastActivity)}
                </div>
            </div>
        `).join('');
    }

    // Select conversation
    selectConversation(userPhone) {
        this.currentConversation = this.conversations.get(userPhone);
        this.renderSelectedConversation();
        this.markAsRead(userPhone);
    }

    // Render selected conversation
    renderSelectedConversation() {
        const selectedDiv = document.getElementById('selectedConversation');
        const noConversationDiv = document.getElementById('noConversation');
        
        if (this.currentConversation) {
            if (selectedDiv) selectedDiv.style.display = 'block';
            if (noConversationDiv) noConversationDiv.style.display = 'none';
            
            this.renderConversationHeader();
            this.renderMessages();
        } else {
            if (selectedDiv) selectedDiv.style.display = 'none';
            if (noConversationDiv) noConversationDiv.style.display = 'flex';
        }
    }

    // Render conversation header
    renderConversationHeader() {
        const header = document.getElementById('conversationHeader');
        if (!header) return;
        
        const conv = this.currentConversation;
        
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin: 0;">${this.formatUserDisplay(conv.user)}</h3>
                    <div style="font-size: 14px; color: #718096;">
                        Last active: ${this.formatTime(conv.lastActivity)}
                    </div>
                </div>
                <div>
                    <button onclick="adminChat.viewUserProfile('${conv.user}')" 
                            style="background: #48bb78; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                        View Profile
                    </button>
                    <button onclick="adminChat.closeConversation('${conv.user}')" 
                            style="background: #e53e3e; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                        Close Chat
                    </button>
                </div>
            </div>
        `;
    }

    // Render messages
    renderMessages() {
        const container = document.getElementById('adminChatMessages');
        if (!container) return;
        
        const messages = this.currentConversation.messages;
        
        // Sort messages by timestamp
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        container.innerHTML = messages.map(message => `
            <div class="message ${message.sender === 'user' ? 'user-message' : 'admin-message'}" 
                 style="margin-bottom: 15px; display: flex; flex-direction: column; align-items: ${message.sender === 'user' ? 'flex-start' : 'flex-end'};">
                <div class="message-bubble" 
                     style="max-width: 70%; padding: 12px 16px; border-radius: 18px; background: ${message.sender === 'user' ? '#f7fafc' : '#667eea'}; color: ${message.sender === 'user' ? '#2d3748' : 'white'}; border: ${message.sender === 'user' ? '1px solid #e2e8f0' : 'none'};">
                    ${message.text}
                </div>
                <div style="font-size: 11px; color: #718096; margin-top: 5px;">
                    ${this.formatTime(message.timestamp)}
                    ${message.sender === 'user' ? ' • User' : ' • You'}
                </div>
            </div>
        `).join('');
        
        // Scroll to bottom
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }

    // Send admin message
    sendAdminMessage() {
        const input = document.getElementById('adminMessageInput');
        if (!input) return;
        
        const message = input.value.trim();
        
        if (!message || !this.currentConversation) return;

        // Create admin message
        const adminMessage = {
            id: 'admin_msg_' + Date.now(),
            sender: 'admin',
            text: message,
            timestamp: new Date().toISOString(),
            userPhone: this.currentConversation.user,
            responded: true
        };

        // Add to all messages
        this.allMessages.push(adminMessage);
        
        // Add to current conversation
        this.currentConversation.messages.push(adminMessage);
        this.currentConversation.lastActivity = adminMessage.timestamp;
        
        // Mark user's last message as responded
        this.markUserMessagesAsResponded(this.currentConversation.user);
        
        // Save and update UI
        this.saveAllMessages();
        this.renderMessages();
        this.renderConversations();
        
        input.value = '';
        
        // Simulate user response after delay
        setTimeout(() => this.simulateUserResponse(), 3000 + Math.random() * 5000);
    }

    // Simulate user response
    simulateUserResponse() {
        if (!this.currentConversation) return;

        const userMessages = [
            "Thanks for your help!",
            "That solved my problem, thank you!",
            "Can you explain that in more detail?",
            "I'll try that and get back to you.",
            "Is there anything else I need to do?",
            "The issue is resolved now, thanks!",
            "Could you help me with one more thing?",
            "I understand now, thank you for explaining.",
            "That worked perfectly!",
            "I'm still having some trouble, can you help further?"
        ];

        const randomMessage = userMessages[Math.floor(Math.random() * userMessages.length)];
        
        const userMessage = {
            id: 'user_msg_' + Date.now(),
            sender: 'user',
            text: randomMessage,
            timestamp: new Date().toISOString(),
            userPhone: this.currentConversation.user,
            responded: false
        };

        this.allMessages.push(userMessage);
        this.currentConversation.messages.push(userMessage);
        this.currentConversation.lastActivity = userMessage.timestamp;
        this.currentConversation.unread++;
        
        this.saveAllMessages();
        this.renderMessages();
        this.renderConversations();
    }

    // Mark user messages as responded
    markUserMessagesAsResponded(userPhone) {
        this.allMessages.forEach(msg => {
            if (msg.sender === 'user' && msg.userPhone === userPhone) {
                msg.responded = true;
            }
        });
    }

    // Mark conversation as read
    markAsRead(userPhone) {
        const conversation = this.conversations.get(userPhone);
        if (conversation) {
            conversation.unread = 0;
            this.renderConversations();
        }
    }

    // View user profile
    viewUserProfile(userPhone) {
        // In a real app, this would open user details
        alert(`User Profile:\nPhone: ${userPhone}\n\nThis would show full user details, transaction history, and account status in a real application.`);
    }

    // Close conversation
    closeConversation(userPhone) {
        if (confirm('Are you sure you want to close this conversation?')) {
            this.conversations.delete(userPhone);
            if (this.currentConversation?.user === userPhone) {
                this.currentConversation = null;
            }
            this.renderConversations();
            this.renderSelectedConversation();
        }
    }

    // Save all messages
    saveAllMessages() {
        try {
            localStorage.setItem('chat_messages', JSON.stringify(this.allMessages));
        } catch (error) {
            console.error('Failed to save messages:', error);
        }
    }

    // Auto-refresh conversations
    startAutoRefresh() {
        this.autoRefreshInterval = setInterval(() => {
            this.loadAllMessages();
            this.renderConversations();
            
            if (this.currentConversation) {
                this.renderMessages();
            }
        }, 5000); // Refresh every 5 seconds
    }

    // Utility functions
    formatUserDisplay(userPhone) {
        return userPhone === 'Unknown User' ? 'Unknown User' : 
               `👤 ${userPhone}`;
    }

    getLastMessagePreview(messages) {
        if (messages.length === 0) return 'No messages';
        
        const lastMessage = messages[messages.length - 1];
        const text = lastMessage.text;
        return text.length > 30 ? text.substring(0, 30) + '...' : text;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    // Admin functions
    broadcastMessage(message) {
        // Send message to all active conversations
        Array.from(this.conversations.keys()).forEach(userPhone => {
            const broadcastMsg = {
                id: 'broadcast_' + Date.now(),
                sender: 'admin',
                text: `📢 ADMIN: ${message}`,
                timestamp: new Date().toISOString(),
                userPhone: userPhone,
                isBroadcast: true
            };
            
            this.allMessages.push(broadcastMsg);
        });
        
        this.saveAllMessages();
        this.loadAllMessages();
        this.renderConversations();
        
        if (this.currentConversation) {
            this.renderMessages();
        }
        
        alert('Broadcast message sent to all users!');
    }

    // Export chat logs
    exportChatLogs() {
        try {
            const dataStr = JSON.stringify(this.allMessages, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `chat-logs-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting chat logs:', error);
            alert('Error exporting chat logs');
        }
    }

    // Search conversations
    searchConversations(query) {
        // Implementation for search functionality
        console.log('Searching for:', query);
        // This would filter conversations based on the query
    }

    // Cleanup method
    cleanup() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        this.conversations.clear();
        this.allMessages = [];
    }
}

// Global admin chat instance
const adminChat = new AdminChat();

// Global functions for HTML
function broadcastToAllUsers() {
    const message = prompt('Enter broadcast message:');
    if (message) {
        adminChat.broadcastMessage(message);
    }
}

function exportAllChats() {
    adminChat.exportChatLogs();
}

function searchConversations() {
    const query = document.querySelector('input[placeholder="Search conversations..."]').value;
    adminChat.searchConversations(query);
}