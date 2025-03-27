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
