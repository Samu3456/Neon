// Variables globales
let currentMode = null;
let currentChat = [];
let isSpeaking = false;
let isMuted = false;
let recognitionActive = false;

// Elementos del DOM
const startScreen = document.getElementById('start-screen');
const voiceScreen = document.getElementById('voice-screen');
const chatScreen = document.getElementById('chat-screen');
const voiceModeBtn = document.getElementById('voice-mode-btn');
const chatModeBtn = document.getElementById('chat-mode-btn');
const newVoiceChatBtn = document.getElementById('new-voice-chat-btn');
const newTextChatBtn = document.getElementById('new-text-chat-btn');
const backToMenuVoice = document.getElementById('back-to-menu-voice');
const backToMenuChat = document.getElementById('back-to-menu-chat');
const responseBox = document.getElementById('response-box');
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const activateBtn = document.getElementById('activate-btn');
const muteBtn = document.getElementById('mute-btn');
const waveElement = document.getElementById('wave');
const beepSound = document.getElementById('beep');

// Configuración de reconocimiento de voz
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = true;
recognition.interimResults = false;

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function () {
  window.speechSynthesis.cancel(); // Detener cualquier voz activa al cargar
  voiceModeBtn.addEventListener('click', () => showScreen('voice'));
  chatModeBtn.addEventListener('click', () => showScreen('chat'));
  backToMenuVoice.addEventListener('click', () => showScreen('start'));
  backToMenuChat.addEventListener('click', () => showScreen('start'));
  activateBtn.addEventListener('click', toggleVoiceRecognition);
  muteBtn.addEventListener('click', toggleMute);
  newVoiceChatBtn.addEventListener('click', startNewChat);
  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  newTextChatBtn.addEventListener('click', startNewChat);
  currentChat = [{ sender: 'neon', content: 'Hola, ¿en qué puedo ayudarte?', timestamp: new Date().toLocaleTimeString() }];
});

function showScreen(screenName) {
  window.speechSynthesis.cancel(); // Detener voz al cambiar pantalla
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  if (screenName === 'start') {
    startScreen.classList.add('active');
    return;
  }
  const screen = document.getElementById(`${screenName}-screen`);
  if (screen) {
    screen.classList.add('active');
    currentMode = screenName;
    if (screenName === 'voice') initVoiceMode();
    else if (screenName === 'chat') initChatMode();
  }
}

function initVoiceMode() {
  responseBox.textContent = "Di 'Hola NEON' para comenzar...";
  recognition.stop();
  recognitionActive = false;
  activateBtn.textContent = 'Activar Micro';
  waveElement.style.display = 'none';
}

function initChatMode() {
  chatInput.focus();
}

function toggleVoiceRecognition() {
  if (recognitionActive) {
    recognition.stop();
    recognitionActive = false;
    activateBtn.textContent = 'Activar Micro';
    waveElement.style.display = 'none';
  } else {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        recognition.start();
        recognitionActive = true;
        activateBtn.textContent = 'Escuchando...';
        waveElement.style.display = 'flex';
        beepSound.play();
        responseBox.textContent = "NEON está escuchando...";
      })
      .catch(err => {
        responseBox.textContent = "Error al acceder al micrófono: " + err.message;
      });
  }
}

function toggleMute() {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "Activar Micro" : "Silenciar Micro";
  muteBtn.style.borderColor = isMuted ? "#00f7ff" : "#ff5555";
  muteBtn.style.color = isMuted ? "#00f7ff" : "#ff5555";
  if (isMuted) {
    recognition.stop();
    waveElement.style.display = 'none';
  }
}

function speak(text) {
  if (isMuted) {
    showResponse(text);
    return;
  }
  window.speechSynthesis.cancel();
  isSpeaking = true;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.rate = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const spanishVoice = voices.find(v => v.lang.includes('es-')) || voices.find(v => v.lang.includes('ES'));
  if (spanishVoice) utterance.voice = spanishVoice;
  utterance.onend = () => {
    isSpeaking = false;
    if (!isMuted) {
      setTimeout(() => {
        recognition.start();
        waveElement.style.display = 'flex';
      }, 800);
    }
  };
  utterance.onerror = (e) => {
    console.error('Error al hablar:', e);
    isSpeaking = false;
    showResponse(text);
  };
  window.speechSynthesis.speak(utterance);
  showResponse(text);
}

function showResponse(text) {
  responseBox.textContent = text;
  responseBox.style.animation = 'none';
  void responseBox.offsetWidth;
  responseBox.style.animation = 'fadeIn 0.5s';
}

recognition.onresult = function (event) {
  if (isSpeaking) return;
  const text = event.results[event.results.length - 1][0].transcript;
  addInteraction('user', text);
  processCommand(text);
};

recognition.onerror = function (event) {
  console.error('Error de reconocimiento:', event.error);
  if (event.error === 'no-speech' || event.error === 'audio-capture') {
    setTimeout(() => recognition.start(), 1000);
  }
};

recognition.onend = function () {
  if (recognitionActive && !isSpeaking) {
    setTimeout(() => recognition.start(), 500);
  }
};

function processCommand(text) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("hola neon")) {
    const respuesta = "Hola, ¿en qué puedo ayudarte?";
    currentMode === 'voice' ? speak(respuesta) : addInteraction('neon', respuesta);
  } else if (lowerText.includes("clima en")) {
    const ciudad = text.split("clima en")[1].trim();
    obtenerClima(ciudad);
  } else if (lowerText.includes("wikipedia")) {
    const tema = text.split("wikipedia")[1].trim();
    buscarWikipedia(tema);
  } else if (lowerText.includes("país")) {
    const pais = text.split("país")[1].trim();
    infoPais(pais);
  } else if (lowerText.includes("spotify") || lowerText.includes("música")) {
    reproducirSpotify();
  } else {
    responderConGemini(text);
  }
}

function obtenerClima(ciudad) {
  const apiKey = "3bd5383af1192522a66d0442cf6d7270";
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${apiKey}&units=metric&lang=es`)
    .then(response => response.json())
    .then(data => {
      if (data.main) {
        const respuesta = `En ${ciudad} hay ${data.main.temp}°C. ${data.weather[0].description}.`;
        addInteraction('neon', respuesta);
      } else {
        addInteraction('neon', "No pude obtener el clima.");
      }
    })
    .catch(() => addInteraction('neon', "Error al conectar con el servicio del clima."));
}

function buscarWikipedia(termino) {
  fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(termino)}`)
    .then(response => response.json())
    .then(data => {
      const respuesta = data.extract || "No encontré información sobre eso.";
      addInteraction('neon', respuesta);
    })
    .catch(() => addInteraction('neon', "Error al conectar con Wikipedia."));
}

function infoPais(pais) {
  fetch(`https://api.api-ninjas.com/v1/country?name=${pais}`, {
    headers: { 'X-Api-Key': 'l1imI08+PMaD8AqoYaOw/Q==k13O3FCTT1uhvtH0' }
  })
    .then(response => response.json())
    .then(data => {
      if (data[0]) {
        const info = data[0];
        const respuesta = `País: ${info.name}. Población: ${info.population}, Capital: ${info.capital}, Moneda: ${info.currency.name}.`;
        addInteraction('neon', respuesta);
      } else {
        addInteraction('neon', "No encontré información del país.");
      }
    })
    .catch(() => addInteraction('neon', "Error al obtener información del país."));
}

function reproducirSpotify() {
  const respuesta = "Reproduciendo tu música favorita de Spotify.";
  addInteraction('neon', respuesta);
}

async function responderConGemini(mensaje) {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBKdds85h60TUKDNzJ1koCyWESncHrfXN8", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: mensaje }] }] })
    });
    const data = await response.json();
    const respuesta = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no entendí la respuesta de Gemini.";
    addInteraction('neon', respuesta);
  } catch (error) {
    console.error(error);
    addInteraction('neon', "Hubo un error al conectar con Gemini.");
  }
}

function sendMessage() {
  const message = chatInput.value.trim();
  if (message) {
    addInteraction('user', message);
    chatInput.value = '';
    processCommand(message);
  }
}

function addInteraction(sender, message) {
  currentChat.push({ sender, content: message, timestamp: new Date().toLocaleTimeString() });
  if (currentMode === 'voice') {
    if (sender === 'user') {
      showResponse(`Dijiste: ${message}`);
    } else {
      speak(message);
    }
  } else {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', `${sender}-message`);
    messageElement.textContent = `${sender === 'user' ? 'Tú' : 'NEON'}: ${message}`;
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
}

function startNewChat() {
  window.speechSynthesis.cancel(); // Detener voz al iniciar nuevo chat
  saveCurrentChat();
  currentChat = [];
  if (currentMode === 'voice') {
    responseBox.textContent = "Nuevo chat iniciado. Di 'Hola NEON' para comenzar.";
    recognition.stop();
    recognitionActive = false;
    activateBtn.textContent = 'Activar Micro';
    waveElement.style.display = 'none';
  } else {
    chatHistory.innerHTML = '<div class="neon-message">NEON: Nuevo chat iniciado. ¿En qué puedo ayudarte?</div>';
    currentChat.push({ sender: 'neon', content: 'Nuevo chat iniciado. ¿En qué puedo ayudarte?', timestamp: new Date().toLocaleTimeString() });
  }
}

function saveCurrentChat() {
  if (currentChat.length > 0) {
    const chatData = {
      date: new Date().toLocaleString(),
      mode: currentMode,
      messages: [...currentChat]
    };
    let savedChats = JSON.parse(localStorage.getItem('neonChats') || '[]');
    savedChats.push(chatData);
    localStorage.setItem('neonChats', JSON.stringify(savedChats));
  }
}
