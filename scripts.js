const socket = io('http://localhost:3000'); // You'll need a server for this

const messagesDiv = document.getElementById('messages');
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const fileUpload = document.getElementById('file-upload');
const deityChoice = document.getElementById('deity-choice');

// Local Storage for Username
usernameInput.value = localStorage.getItem('username') || '';
usernameInput.addEventListener('change', () => {
    localStorage.setItem('username', usernameInput.value);
});

// Socket Events
socket.on('message', (data) => {
    addMessage(data);
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) sendMessage();
});

function sendMessage() {
    const username = usernameInput.value.trim() || 'Mortal';
    const message = messageInput.value.trim();
    const deity = deityChoice.value;
    
    if (message || fileUpload.files.length) {
        const data = { username, message, deity, timestamp: Date.now() };
        
        if (fileUpload.files.length) {
            const file = fileUpload.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                data.file = { type: file.type, data: reader.result };
                socket.emit('message', data);
            };
            reader.readAsDataURL(file);
        } else {
            socket.emit('message', data);
        }
        
        messageInput.value = '';
        fileUpload.value = '';
    }
}

function addMessage(data) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    let content = `<strong>${data.deity.toUpperCase()} - ${data.username}</strong><br>${data.message}`;
    
    if (data.file) {
        if (data.file.type.includes('image')) {
            content += `<br><img src="${data.file.data}" alt="Uploaded Image">`;
        } else if (data.file.type.includes('pdf')) {
            content += `<br><embed src="${data.file.data}" type="application/pdf" width="300" height="400">`;
        }
    }
    
    messageElement.innerHTML = content;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Sacred Geometry
const canvas = document.getElementById('sacred-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function drawVesicaPiscis(x, y, radius) {
    ctx.beginPath();
    ctx.arc(x - radius/2, y, radius, 0, Math.PI * 2);
    ctx.arc(x + radius/2, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(218, 165, 32, 0.3)';
    ctx.stroke();
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawVesicaPiscis(canvas.width/2, canvas.height/2, 100);
    requestAnimationFrame(animate);
}

animate();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // Serve your static files

io.on('connection', (socket) => {
    console.log('New deity connected');
    
    socket.on('message', (data) => {
        io.emit('message', data);
    });
    
    socket.on('disconnect', () => {
        console.log('Deity departed');
    });
});

server.listen(3000, () => {
    console.log('Pantheon Chat running on port 3000');
});
// Moderation
socket.on('ban', (user) => {
    if (usernameInput.value === user) {
        alert('You have been banished from the Pantheon!');
        window.location.reload();
    }
});

// User List
const userList = new Set();
socket.on('userList', (users) => {
    userList.clear();
    users.forEach(u => userList.add(u));
});

// Profile Icons
const deityIcons = {
    zeus: '⚡',
    jupiter: '🦅',
    anubis: '🐺',
    ceridwen: '🍵'
};

function addMessage(data) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    le// God Powers
document.getElementById('lightning').addEventListener('click', () => {
    socket.emit('effect', 'lightning');
});

document.getElementById('heal').addEventListener('click', () => {
    socket.emit('effect', 'heal');
});

document.getElementById('ban').addEventListener('click', () => {
    const user = prompt('Who to banish?');
    if (user) socket.emit('ban', user);
});

socket.on('effect', (type) => {
    if (type === 'lightning') {
        createParticles(50, 'var(--sacred-blue)');
    } else if (type === 'heal') {
        createParticles(50, 'var(--welsh-green)');
    }
});

function createParticles(count, color) {
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.background = color;
        particle.style.left = `${Math.random() * window.innerWidth}px`;
        particle.style.top = `${Math.random() * window.innerHeight}px`;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 2000);
    }
}

// Enhanced Geometry
function drawMetatronsCube(x, y, radius) {
    drawVesicaPiscis(x, y, radius);
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const newX = x + Math.cos(angle) * radius * 2;
        const newY = y + Math.sin(angle) * radius * 2;
        drawVesicaPiscis(newX, newY, radius);
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMetatronsCube(canvas.width/2, canvas.height/2, 100);
    requestAnimationFrame(animate);
}t content = `<strong>${deityIcons[data.deity]} ${data.deity.toUpperCase()} - ${data.username}</strong><br>${data.message}`;
    // ... rest of the function remains same
}
