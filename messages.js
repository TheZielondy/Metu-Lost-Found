const POSTS_KEY = "metu_lostfound_posts";
const USER_KEY = "metu_lostfound_currentUser";
const MSG_PREFIX = "metu_lostfound_messages_";

function loadPosts() {
    const raw = localStorage.getItem(POSTS_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw) || []; } catch { return []; }
}

function loadCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

function loadMessages(postId) {
    const raw = localStorage.getItem(MSG_PREFIX + postId);
    if (!raw) return [];
    try { return JSON.parse(raw) || []; } catch { return []; }
}

function saveMessages(postId, msgs) {
    localStorage.setItem(MSG_PREFIX + postId, JSON.stringify(msgs));
}

function listConversationPostIds() {
    const ids = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith(MSG_PREFIX)) {
            const postId = Number(key.replace(MSG_PREFIX, ""));
            if (Number.isFinite(postId)) ids.push(postId);
        }
    }
    // newest activity first
    ids.sort((a, b) => {
        const aMsgs = loadMessages(a);
        const bMsgs = loadMessages(b);
        const aLast = aMsgs.length ? aMsgs[aMsgs.length - 1].timestamp : 0;
        const bLast = bMsgs.length ? bMsgs[bMsgs.length - 1].timestamp : 0;
        return bLast - aLast;
    });
    return ids;
}

function renderConversationList(posts, activePostId) {
    const container = document.getElementById("conv-list");
    if (!container) return;

    const ids = listConversationPostIds();
    if (ids.length === 0) {
        container.innerHTML = `<p class="muted small-text">No conversations yet.</p>`;
        return;
    }

    container.innerHTML = "";
    ids.forEach((postId) => {
        const post = posts.find(p => p.id === postId);
        const msgs = loadMessages(postId);
        const last = msgs.length ? msgs[msgs.length - 1] : null;

        const item = document.createElement("div");
        item.className = "messages-item" + (postId === activePostId ? " is-active" : "");
        item.dataset.postId = String(postId);

        const title = post ? post.title : `Post #${postId}`;
        const meta = last
            ? `${last.senderName} • ${new Date(last.timestamp).toLocaleString()}`
            : "No messages";

        item.innerHTML = `
            <div class="messages-item-title">${title}</div>
            <div class="messages-item-meta">${meta}</div>
        `;

        item.addEventListener("click", () => {
            window.location.hash = `post-${postId}`;
        });

        container.appendChild(item);
    });
}

function renderMessages(messages, currentUser) {
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

function setHeader(post) {
    const header = document.getElementById("conv-header");
    if (!header) return;

    if (!post) {
        header.innerHTML = `<div class="muted">Conversation</div>`;
        return;
    }

    header.innerHTML = `
        <div style="font-weight:700; margin-bottom:0.25rem;">${post.title}</div>
        <div class="muted small-text">
            <a href="post.html?id=${post.id}">Open post</a>
        </div>
    `;
}

function getActivePostIdFromHash() {
    const h = (window.location.hash || "").trim();
    if (!h.startsWith("#post-")) return null;
    const n = Number(h.replace("#post-", ""));
    return Number.isFinite(n) ? n : null;
}

document.addEventListener("DOMContentLoaded", () => {
    const posts = loadPosts();
    const currentUser = loadCurrentUser();

    const chatAuthHint = document.getElementById("chat-auth-hint");
    if (chatAuthHint) {
        chatAuthHint.style.display = currentUser ? "none" : "block";
    }

    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");

    function refresh() {
        const activePostId = getActivePostIdFromHash();
        renderConversationList(posts, activePostId || -1);

        if (!activePostId) {
            setHeader(null);
            renderMessages([], currentUser);
            return;
        }

        const post = posts.find(p => p.id === activePostId) || null;
        setHeader(post);

        const msgs = loadMessages(activePostId);
        renderMessages(msgs, currentUser);
    }

    window.addEventListener("hashchange", refresh);
    refresh();

    if (chatForm) {
        chatForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const activePostId = getActivePostIdFromHash();
            if (!activePostId) return;

            if (!currentUser) {
                alert("Please log in from the Home page to send messages.");
                return;
            }

            const text = (chatInput?.value || "").trim();
            if (!text) return;

            const msgs = loadMessages(activePostId);
            msgs.push({
                text,
                senderName: currentUser.name || "Student",
                senderEmail: currentUser.email || "",
                timestamp: Date.now()
            });

            saveMessages(activePostId, msgs);
            if (chatInput) chatInput.value = "";
            refresh();
        });
    }
});
