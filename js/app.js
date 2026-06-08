// ═══════════════════════════════════════
//   AHMED AI — Powered by Groq (Free!)
//   Model: Llama 3.3 70B
// ═══════════════════════════════════════

const API_URL = "/.netlify/functions/chat";

// ── STATE ──────────────────────────────
let chatHistory = [];
let currentMode = "chat";
let isListening = false;
let recognition = null;
let synthesis   = window.speechSynthesis;
let pendingImage   = null;
let savedNotes     = JSON.parse(localStorage.getItem("ahmed_notes") || "[]");

// ── MODE CONFIG ────────────────────────
const MODES = {
  chat:        { icon:"💬", label:"Chat Mode"          },
  study:       { icon:"📚", label:"Study Assistant"    },
  code:        { icon:"💻", label:"Code Assistant"     },
  research:    { icon:"🔬", label:"Research Mode"      },
  creative:    { icon:"✍️", label:"Creative Mode"     },
  translate:   { icon:"🌐", label:"Translate Mode"     },
  analyze:     { icon:"📊", label:"Analysis Mode"      },
  productivity:{ icon:"📋", label:"Productivity"       },
  media:       { icon:"🎬", label:"Media Assistant"    },
  gaming:      { icon:"🎮", label:"Gaming Assistant"   },
};

const SYSTEM_PROMPTS = {
  chat: `You are Ahmed AI, an advanced AI assistant. Always address the user as "Sir". Be friendly, intelligent, and professional. Auto-detect the language the user writes in and always respond in the same language. Keep responses helpful and clear. Use markdown formatting when it helps readability.`,

  study: `You are Ahmed AI in Study Mode. Address the user as "Sir". You are an expert tutor for all subjects — math, science, history, languages, programming, and more. Break down complex topics clearly with examples and step-by-step explanations. Detect the user's language and respond in it.`,

  code: `You are Ahmed AI in Code Assistant Mode. Address the user as "Sir". You are an expert in all programming languages: Python, JavaScript, TypeScript, React, Next.js, HTML/CSS, Java, C++, Kotlin, PHP, SQL, and more. Write clean, well-commented code. Debug carefully. Always use proper code blocks. Respond in the user's language.`,

  research: `You are Ahmed AI in Research Mode. Address the user as "Sir". Provide thorough, accurate research on any topic. Structure information with headings and bullet points. Present multiple perspectives, pros/cons, and clear conclusions. Detect and respond in the user's language.`,

  creative: `You are Ahmed AI in Creative Mode. Address the user as "Sir". Help with stories, scripts, poems, content ideas, YouTube titles/thumbnails, brainstorming, worldbuilding, and all creative tasks. Be imaginative and original. Respond in the user's language.`,

  translate: `You are Ahmed AI in Translation Mode. Address the user as "Sir". Expertly translate between any languages: Bengali, English, Hindi, Urdu, Arabic, Japanese, Korean, Chinese, French, German, Spanish, Portuguese, Russian, Turkish, Italian, Indonesian, Malay, Thai, Vietnamese, and more. Provide clean translations and explain nuances when helpful.`,

  analyze: `You are Ahmed AI in Analysis Mode. Address the user as "Sir". Analyze any text, code, or information provided. Identify key points, patterns, quality issues, and provide clear, actionable insights. Respond in the user's language.`,

  productivity: `You are Ahmed AI in Productivity Mode. Address the user as "Sir". Help with tasks, to-do lists, goals, daily planning, and time management. Create structured plans, prioritize effectively, and suggest practical productivity strategies. Respond in the user's language.`,

  media: `You are Ahmed AI in Media Assistant Mode. Address the user as "Sir". Provide expert guidance on photo editing (Snapseed, Lightroom, PicsArt), video editing (CapCut, VN, Premiere), YouTube optimization, Shorts/Reels strategy, and growing a digital presence. Respond in the user's language.`,

  gaming: `You are Ahmed AI in Gaming Assistant Mode. Address the user as "Sir". Help with game strategies, walkthroughs, tips, character builds, team compositions, game recommendations, and gaming setup advice. Cover mobile, PC, and console games. Respond in the user's language.`,
};

const QUICK_PROMPTS = {
  chat:        ["আমাকে কিছু interesting বলো", "তুমি কি কি করতে পারো?", "আমি bored", "আমাকে help করো"],
  study:       ["Math explain করো", "Science quiz দাও", "Homework help", "History বলো"],
  code:        ["Code review করো", "Bug fix করো", "Algorithm explain করো", "Function বানাও"],
  research:    ["Topic research করো", "দুটো জিনিস compare করো", "Summary দাও", "Deep dive করো"],
  creative:    ["Short story লেখো", "Story idea দাও", "Poem লেখো", "YouTube title ideas"],
  translate:   ["Bengali তে translate করো", "English এ translate করো", "Arabic তে translate করো", "Hindi তে translate করো"],
  analyze:     ["এই text analyze করো", "Key points বের করো", "Summarize করো", "Review করো"],
  productivity:["আমার দিন plan করো", "To-do list বানাও", "Goals set করো", "Tasks prioritize করো"],
  media:       ["Photo editing tips", "YouTube growth tips", "CapCut tutorial", "Thumbnail ideas"],
  gaming:      ["Game strategy দাও", "Best mobile games", "RPG build help", "Game recommend করো"],
};

// ── BOOT ───────────────────────────────
function boot() {
  const statusEl = document.getElementById("boot-status");
  const fillEl   = document.getElementById("boot-fill");
  const steps = [
    [15,  "Loading core systems..."],
    [35,  "Connecting to Groq AI..."],
    [60,  "Loading Llama 3.3 70B..."],
    [80,  "Calibrating language models..."],
    [95,  "Almost ready..."],
    [100, "All systems operational."],
  ];
  let i = 0;
  const tick = () => {
    if (i >= steps.length) {
      setTimeout(() => {
        document.getElementById("boot-screen").classList.add("hidden");
        document.getElementById("app").style.display = "flex";
        document.getElementById("app").style.flexDirection = "column";
        renderEmptyState();
        setTimeout(() => addAIMessage(
          "Hello Sir. Ahmed AI is online. All systems operational. Powered by Llama 3.3 70B via Groq. Ready to assist."
        ), 400);
      }, 400);
      return;
    }
    const [pct, msg] = steps[i];
    fillEl.style.width   = pct + "%";
    statusEl.textContent = msg;
    i++;
    setTimeout(tick, 320 + Math.random() * 180);
  };
  setTimeout(tick, 400);
}

// ── EMPTY STATE ────────────────────────
function renderEmptyState() {
  document.getElementById("messages").innerHTML = `
    <div class="empty-state">
      <div class="empty-core">
        <div class="e-ring"></div>
        <div class="e-ring"></div>
        <div class="e-core">A</div>
      </div>
      <div class="empty-title">AHMED AI</div>
      <div class="empty-sub">Powered by Llama 3.3 70B · Free · Ready</div>
      <div class="quick-prompts" id="qp-container"></div>
    </div>`;
  renderQuickPrompts();
}

function renderQuickPrompts() {
  const c = document.getElementById("qp-container");
  if (!c) return;
  (QUICK_PROMPTS[currentMode] || QUICK_PROMPTS.chat).forEach(p => {
    const btn = document.createElement("button");
    btn.className = "qp-btn";
    btn.textContent = p;
    btn.onclick = () => sendQuickPrompt(p);
    c.appendChild(btn);
  });
}

function sendQuickPrompt(text) {
  document.getElementById("user-input").value = text;
  handleSend();
}

// ── SEND MESSAGE ───────────────────────
async function handleSend() {
  const input = document.getElementById("user-input");
  const text  = input.value.trim();
  if (!text && !pendingImage) return;

  input.value = "";
  input.style.height = "";
  updateCharCount();

  // User bubble
  const userDiv = document.createElement("div");
  userDiv.className = "msg user";
  userDiv.innerHTML = `
    <div class="msg-avatar">👤</div>
    <div>
      ${pendingImage ? `<img class="msg-img" src="data:${pendingImage.mediaType};base64,${pendingImage.base64}" />` : ""}
      ${text ? `<div class="msg-bubble">${escapeHtml(text)}</div>` : ""}
      <div class="msg-time">${getTime()}</div>
    </div>`;
  document.getElementById("messages").appendChild(userDiv);

  // Build message for history
  // Note: Groq/Llama doesn't support image natively in free tier,
  // so if image is attached, describe it as text
  let historyContent = text;
  if (pendingImage) {
    historyContent = `[User attached an image]${text ? " — " + text : " — Please describe or analyze this image."}`;
    // For image analysis we still send the description prompt
  }

  pendingImage = null;
  clearAttachPreview();
  scrollBottom();

  chatHistory.push({ role: "user", content: historyContent });

  // Show typing
  document.getElementById("typing").style.display = "flex";
  document.getElementById("send-btn").disabled = true;
  scrollBottom();

  try {
    const res  = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system:   SYSTEM_PROMPTS[currentMode] || SYSTEM_PROMPTS.chat,
        messages: chatHistory,
      }),
    });

    const data  = await res.json();
    const reply = data.reply || data.error || "Sorry Sir, something went wrong. Please try again.";

    document.getElementById("typing").style.display = "none";
    addAIMessage(reply);
    chatHistory.push({ role: "assistant", content: reply });

    // Trim history to last 20 turns
    if (chatHistory.length > 40) chatHistory = chatHistory.slice(-40);

    speak(reply);
  } catch (err) {
    document.getElementById("typing").style.display = "none";
    addAIMessage("Sir, connection error. Please check your internet and try again.");
    console.error(err);
  }

  document.getElementById("send-btn").disabled = false;
}

function addAIMessage(text) {
  const msgs  = document.getElementById("messages");
  const empty = msgs.querySelector(".empty-state");
  if (empty) empty.remove();

  const div = document.createElement("div");
  div.className = "msg ai";
  div.innerHTML = `
    <div class="msg-avatar">A</div>
    <div>
      <div class="msg-bubble">${formatMarkdown(text)}</div>
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="msg-time">${getTime()}</div>
        <button class="tts-btn" onclick="speakText('${encodeURIComponent(text)}')">🔊</button>
      </div>
    </div>`;
  msgs.appendChild(div);
  scrollBottom();
}

// ── TTS ────────────────────────────────
function speak(text) {
  if (!synthesis) return;
  synthesis.cancel();
  const clean = text.replace(/[#*`_>\[\]()~]/g, "").substring(0, 400);
  const utt   = new SpeechSynthesisUtterance(clean);
  utt.rate  = 1.05;
  utt.pitch = 1;
  synthesis.speak(utt);
}
function speakText(encoded) {
  if (synthesis.speaking) { synthesis.cancel(); return; }
  speak(decodeURIComponent(encoded));
}

// ── VOICE INPUT ────────────────────────
function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  recognition = new SR();
  recognition.continuous     = false;
  recognition.interimResults = false;
  recognition.onresult = (e) => {
    document.getElementById("user-input").value = e.results[0][0].transcript;
    updateCharCount();
    stopListening();
    setTimeout(handleSend, 200);
  };
  recognition.onerror = stopListening;
  recognition.onend   = stopListening;
}

function toggleVoice() {
  if (!recognition) {
    addAIMessage("Sir, voice input requires Chrome browser.");
    return;
  }
  if (isListening) { stopListening(); return; }
  isListening = true;
  document.getElementById("voice-btn").classList.add("listening");
  recognition.lang = "bn-BD"; // default Bengali, auto-switches
  recognition.start();
}
function stopListening() {
  isListening = false;
  document.getElementById("voice-btn").classList.remove("listening");
  try { recognition.stop(); } catch(e) {}
}

// ── FILE ATTACH ────────────────────────
function handleFileAttach(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    addAIMessage("Sir, file size limit is 5MB."); return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const b64 = e.target.result.split(",")[1];
    if (file.type.startsWith("image/")) {
      pendingImage = { base64: b64, mediaType: file.type };
      showAttachPreview(e.target.result);
    } else {
      addAIMessage("Sir, please paste the text content from your file and I'll analyze it.");
    }
  };
  reader.readAsDataURL(file);
}

function showAttachPreview(src) {
  let p = document.getElementById("attach-preview");
  if (!p) {
    p = document.createElement("div");
    p.id = "attach-preview";
    p.style.cssText = "padding:6px 10px 0;display:flex;align-items:center;gap:8px;";
    document.querySelector(".input-area").insertBefore(p, document.querySelector(".input-row"));
  }
  p.innerHTML = `
    <img src="${src}" style="height:40px;width:40px;object-fit:cover;border-radius:8px;border:1px solid var(--border);" />
    <span style="font-size:12px;color:var(--text-sub);">Image attached</span>
    <button onclick="clearAttachPreview()" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:16px;">✕</button>`;
}
function clearAttachPreview() {
  const p = document.getElementById("attach-preview");
  if (p) p.remove();
  pendingImage = null;
}

// ── IMAGE MODAL ────────────────────────
function setupImgModal() {
  document.getElementById("img-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      window._imgModalData = { base64: ev.target.result.split(",")[1], mediaType: file.type };
      const prev = document.getElementById("img-preview");
      prev.src = ev.target.result;
      prev.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("img-analyze-btn").addEventListener("click", () => {
    if (!window._imgModalData) { alert("Please select an image."); return; }
    const q = document.getElementById("img-question").value.trim() || "Describe and analyze this image in detail.";
    document.getElementById("img-modal").style.display = "none";
    setMode("analyze");
    pendingImage = window._imgModalData;
    showAttachPreview(`data:${pendingImage.mediaType};base64,${pendingImage.base64}`);
    document.getElementById("user-input").value = q;
    window._imgModalData = null;
    document.getElementById("img-preview").style.display = "none";
    document.getElementById("img-question").value = "";
    handleSend();
  });
}

// ── NOTES ──────────────────────────────
function renderNotes() {
  const c = document.getElementById("saved-notes");
  if (!c) return;
  if (!savedNotes.length) {
    c.innerHTML = `<p style="color:var(--text-sub);font-size:13px;text-align:center;padding:10px;">No saved notes yet</p>`;
    return;
  }
  c.innerHTML = savedNotes.map((n, i) => `
    <div class="saved-note-item">
      <span>${n.substring(0,80)}${n.length>80?"…":""}</span>
      <button class="del-note" onclick="deleteNote(${i})">🗑️</button>
    </div>`).join("");
}
function deleteNote(i) {
  savedNotes.splice(i, 1);
  localStorage.setItem("ahmed_notes", JSON.stringify(savedNotes));
  renderNotes();
}

// ── MODE ───────────────────────────────
function setMode(mode) {
  currentMode = mode;
  const cfg   = MODES[mode] || MODES.chat;
  document.getElementById("mode-icon").textContent  = cfg.icon;
  document.getElementById("mode-label").textContent = cfg.label;
  document.querySelectorAll(".nav-item[data-mode]").forEach(n =>
    n.classList.toggle("active", n.dataset.mode === mode));
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("active");
  chatHistory = [];
  renderEmptyState();
  addAIMessage(`Ahmed AI switched to **${cfg.label}**. How can I assist you, Sir?`);
}

// ── UTILS ───────────────────────────────
function scrollBottom() {
  const ca = document.getElementById("chat-area");
  setTimeout(() => ca.scrollTop = ca.scrollHeight, 60);
}
function getTime() {
  return new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}
function escapeHtml(t) {
  return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function updateCharCount() {
  document.getElementById("char-count").textContent =
    document.getElementById("user-input").value.length + " / 4000";
}
function detectLang(t) {
  if (/[\u0980-\u09FF]/.test(t)) return "🇧🇩 Bengali";
  if (/[\u0600-\u06FF]/.test(t)) return "🇸🇦 Arabic";
  if (/[\u3040-\u30FF]/.test(t)) return "🇯🇵 Japanese";
  if (/[\uAC00-\uD7AF]/.test(t)) return "🇰🇷 Korean";
  if (/[\u4E00-\u9FFF]/.test(t)) return "🇨🇳 Chinese";
  if (/[\u0900-\u097F]/.test(t)) return "🇮🇳 Hindi";
  return "🌐 Auto-detect";
}
function formatMarkdown(t) {
  return t
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_,l,c) => `<pre><code>${c.trim()}</code></pre>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,    "<em>$1</em>")
    .replace(/^### (.+)$/gm,  "<h3>$1</h3>")
    .replace(/^## (.+)$/gm,   "<h3>$1</h3>")
    .replace(/^# (.+)$/gm,    "<h3>$1</h3>")
    .replace(/^[•\-\*] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
    .replace(/\n\n/g,"<br><br>").replace(/\n/g,"<br>");
}

// ── EVENTS ─────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  boot();
  initVoice();
  setupImgModal();

  const input = document.getElementById("user-input");

  input.addEventListener("input", () => {
    input.style.height = "";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
    updateCharCount();
    document.getElementById("lang-indicator").textContent = detectLang(input.value);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  document.getElementById("send-btn").addEventListener("click",  handleSend);
  document.getElementById("voice-btn").addEventListener("click", toggleVoice);

  // Sidebar
  document.getElementById("menu-btn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("overlay").classList.add("active");
  });
  document.getElementById("overlay").addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("overlay").classList.remove("active");
  });
  document.querySelectorAll(".nav-item[data-mode]").forEach(btn =>
    btn.addEventListener("click", () => setMode(btn.dataset.mode)));

  document.getElementById("clear-chat-btn").addEventListener("click", () => {
    chatHistory = [];
    renderEmptyState();
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("overlay").classList.remove("active");
  });

  // Attach
  document.getElementById("attach-btn").addEventListener("click", () =>
    document.getElementById("file-input").click());
  document.getElementById("file-input").addEventListener("change", (e) => {
    handleFileAttach(e.target.files[0]);
    e.target.value = "";
  });

  // Quick tools
  document.getElementById("qt-apps").addEventListener("click", () =>
    document.getElementById("apps-modal").style.display = "flex");
  document.getElementById("apps-close").addEventListener("click", () =>
    document.getElementById("apps-modal").style.display = "none");

  document.getElementById("qt-note").addEventListener("click", () => {
    renderNotes();
    document.getElementById("note-modal").style.display = "flex";
  });
  document.getElementById("note-close").addEventListener("click", () =>
    document.getElementById("note-modal").style.display = "none");
  document.getElementById("note-save").addEventListener("click", () => {
    const t = document.getElementById("note-text").value.trim();
    if (!t) return;
    savedNotes.unshift(t);
    localStorage.setItem("ahmed_notes", JSON.stringify(savedNotes));
    renderNotes();
    document.getElementById("note-text").value = "";
  });
  document.getElementById("note-send-ai").addEventListener("click", () => {
    const t = document.getElementById("note-text").value.trim();
    if (!t) return;
    document.getElementById("note-modal").style.display = "none";
    document.getElementById("user-input").value = t;
    handleSend();
  });

  document.getElementById("qt-analyze-img").addEventListener("click", () =>
    document.getElementById("img-modal").style.display = "flex");
  document.getElementById("img-close").addEventListener("click", () =>
    document.getElementById("img-modal").style.display = "none");

  document.getElementById("qt-translate").addEventListener("click", () => {
    setMode("translate");
    document.getElementById("user-input").focus();
  });

  // Modal backdrop close
  document.querySelectorAll(".modal").forEach(m =>
    m.addEventListener("click", (e) => { if (e.target === m) m.style.display = "none"; }));
});
