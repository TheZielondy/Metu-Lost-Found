const POSTS_KEY = "metu_lostfound_posts";
const USER_KEY = "metu_lostfound_currentUser";
const MSG_PREFIX = "metu_lostfound_messages_";

// Fallback seed posts so opening post.html directly still works.
// Pins are randomized on first load.
const seedPosts = [
    {
        id: 1,
        type: "lost",
        title: "Lost: Black Wallet",
        category: "Accessories",
        campusArea: "Library",
        locationDetail: "Main Library 2nd floor, group study area",
        date: "2025-11-15",
        time: "Afternoon",
        description: "Black leather wallet with a few cards and student ID inside.",
        tags: ["wallet", "black", "id card"],
        imageUrl: "./images/post1.jpg",
        mapX: 0.5,
        mapY: 0.5,
        userName: "Ali K.",
        userDept: "CEIT",
        userEmail: "ali@example.com"
    },
    {
        id: 2,
        type: "found",
        title: "Found: Casio Calculator",
        category: "Electronics",
        campusArea: "Mühendislik",
        locationDetail: "EEE building 1st floor, corridor near E-107",
        date: "2025-11-14",
        time: "Morning",
        description: "Grey Casio calculator, looks like engineering model.",
        tags: ["calculator", "casio", "electronics"],
        imageUrl: "./images/post2.jpg",
        mapX: 0.5,
        mapY: 0.5,
        userName: "Ece Y.",
        userDept: "EEE",
        userEmail: "ece@example.com"
    }
];

function loadPosts() {
    const raw = localStorage.getItem(POSTS_KEY);
    if (!raw) {
        const seeded = seedPosts.map(p => {
            const rx = 0.15 + Math.random() * 0.70;
            const ry = 0.15 + Math.random() * 0.70;
            return { ...p, mapX: rx, mapY: ry };
        });
        localStorage.setItem(POSTS_KEY, JSON.stringify(seeded));
        return [...seeded];
    }
    try {
        return JSON.parse(raw) || [];
    } catch {
        return [];
    }
}

function loadCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function loadMessages(postId) {
    const raw = localStorage.getItem(MSG_PREFIX + postId);
    if (!raw) return [];
    try {
        return JSON.parse(raw) || [];
    } catch {
        return [];
    }
}

function saveMessages(postId, msgs) {
    localStorage.setItem(MSG_PREFIX + postId, JSON.stringify(msgs));
}

// ---- Map viewer ----
function renderMapViewer(post) {
    const mapImg = document.getElementById("map-viewer-image");
    const pin = document.getElementById("map-viewer-pin");
    const hint = document.getElementById("map-viewer-hint");
    if (!mapImg || !pin) return;

    function placePin(normX, normY) {
        const rect = mapImg.getBoundingClientRect();
        pin.style.left = `${normX * rect.width}px`;
        pin.style.top = `${normY * rect.height}px`;
        pin.style.display = "block";
    }

    const hasPin = post && Number.isFinite(post.mapX) && Number.isFinite(post.mapY);
    if (!hasPin) {
        pin.style.display = "none";
        if (hint) hint.textContent = "No pin location provided for this post.";
        return;
    }

    if (hint) hint.textContent = "Pinned location";
    // If image isn't loaded yet, wait for it before positioning
    if (!mapImg.complete) {
        mapImg.addEventListener("load", () => placePin(Number(post.mapX), Number(post.mapY)), { once: true });
    } else {
        placePin(Number(post.mapX), Number(post.mapY));
    }

    window.addEventListener("resize", () => {
        if (pin.style.display === "block") {
            placePin(Number(post.mapX), Number(post.mapY));
        }
    });
}

// ---- Render post detail ----
function renderPostDetail(post) {
    const card = document.getElementById("post-detail-card");
    if (!card) return;

    if (!post) {
        card.innerHTML = `<p class="muted">Post not found. It may have been deleted.</p>`;
        return;
    }

    const imgSrc = post.imageData || post.imageUrl || "";
    const hasImage = Boolean(imgSrc);

    card.innerHTML = `
        <div class="post-detail-header">
            <h1 class="post-detail-title">${post.title}</h1>
            <span class="post-badge ${post.type}">
                ${post.type.toUpperCase()}
            </span>
        </div>

        ${hasImage ? `<img class="post-thumb" src="${imgSrc}" alt="${post.title}" />` : ``}

        <div class="post-meta" style="margin-top: 0.75rem;">
            <span><strong>Category:</strong> ${post.category}</span>
            <span><strong>Campus area:</strong> ${post.campusArea}</span>
            <span><strong>Location:</strong> ${post.locationDetail}</span>
            <span><strong>Date:</strong> ${post.date}</span>
            <span><strong>Time:</strong> ${post.time}</span>
        </div>

        <p style="margin-top: 0.75rem; line-height: 1.5;">
            ${post.description}
        </p>

        <div class="post-tags" style="margin-top: 0.5rem;">
            ${(post.tags || []).map(t => `<span class="post-tag">${t}</span>`).join("")}
        </div>

        <div style="margin-top: 0.75rem; font-size: 0.85rem;">
            <strong>Posted by:</strong> ${post.userName} (${post.userDept || "Student"})<br>
            <span class="muted small-text">${post.userEmail || ""}</span>
        </div>
    `;
}

// ---- Render messages ----
function renderMessages(postId, messages, currentUser) {
    const container = document.getElementById("chat-messages");
    if (!container) return;

    container.innerHTML = "";

    if (messages.length === 0) {
        container.innerHTML = `<p class="muted small-text">No messages yet. Start the conversation!</p>`;
        return;
    }

    messages.forEach(msg => {
        const div = document.createElement("div");
        const isMe = currentUser && msg.senderEmail === currentUser.email;
        div.className = `chat-message ${isMe ? "me" : "other"}`;
        div.innerHTML = `
            <div>${msg.text}</div>
            <div class="chat-meta">
                ${msg.senderName} • ${new Date(msg.timestamp).toLocaleString()}
            </div>
        `;
        container.appendChild(div);
    });

    container.scrollTop = container.scrollHeight;
}

// ---- Init ----
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));
    const posts = loadPosts();
    const post = posts.find(p => Number(p.id) === id);
    const currentUser = loadCurrentUser();

    renderPostDetail(post);
    renderMapViewer(post);

    const messages = loadMessages(id);
    renderMessages(id, messages, currentUser);

    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");

    if (!chatForm || !chatInput) return;

    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!post) return;

        const text = chatInput.value.trim();
        if (!text) return;

        const userName = currentUser?.name || "Guest";
        const userEmail = currentUser?.email || "guest@example.com";

        const msgs = loadMessages(id);
        msgs.push({
            text,
            senderName: userName,
            senderEmail: userEmail,
            timestamp: Date.now()
        });
        saveMessages(id, msgs);
        renderMessages(id, msgs, currentUser);
        chatInput.value = "";
    });

    // Report button
    const reportBtn = document.getElementById("report-btn");
    if (reportBtn) {
        const reporter = currentUser?.email || "guest";
        const reportKey = `metu_lostfound_reported_${id}_${reporter}`;

        if (localStorage.getItem(reportKey) === "1") {
            reportBtn.disabled = true;
            reportBtn.textContent = "Reported";
        }

        reportBtn.addEventListener("click", () => {
            alert("We have received your report.");
            reportBtn.disabled = true;
            reportBtn.textContent = "Reported";
            localStorage.setItem(reportKey, "1");
        });
    }
});
