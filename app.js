// ---- localStorage keys ----
const POSTS_KEY = "metu_lostfound_posts";
const USER_KEY = "metu_lostfound_currentUser";

let currentUser = null;

function isMetuEmail(email) {
    if (!email) return false;
    return String(email).trim().toLowerCase().endsWith("@metu.edu.tr");
}

// NOTE: Pins are randomized on first run.
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
        // Reference image placeholder (you will replace these files)
        imageUrl: "./images/post1.jpg",
        // Normalized map coordinates (0..1) - randomized on first run
        mapX: 0.52,
        mapY: 0.43,
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
        mapX: 0.61,
        mapY: 0.50,
        userName: "Ece Y.",
        userDept: "EEE",
        userEmail: "ece@example.com"
    }
];

// ---- Helpers: posts ----
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

function savePosts(posts) {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

// ---- Helper: user ----
function loadCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function saveCurrentUser(user) {
    if (!user) {
        localStorage.removeItem(USER_KEY);
        return;
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ---- Create post card ----
function createPostCard(post) {
    const card = document.createElement("article");
    card.className = "post-card";

    const imgSrc = post.imageData || post.imageUrl || "";
    const hasImage = Boolean(imgSrc);
    const hasPin = Number.isFinite(post.mapX) && Number.isFinite(post.mapY);

    card.innerHTML = `
        <div class="post-header">
            <h2 class="post-title">
                <a href="post.html?id=${post.id}">
                    ${post.title}
                </a>
            </h2>
            <span class="post-badge ${post.type}">
                ${post.type.toUpperCase()}
            </span>
        </div>

        ${hasImage ? `<img class="post-thumb" src="${imgSrc}" alt="${post.title}" />` : ``}

        <div class="post-meta">
            <span>${post.campusArea}</span>
            <span>${post.locationDetail}</span>
            <span>${post.date}, ${post.time}</span>
        </div>

        <p class="post-description">
            ${post.description}
        </p>

        <div class="post-tags">
            ${(post.tags || []).map(tag => `<span class="post-tag">${tag}</span>`).join("")}
        </div>

        <div class="post-footer">
            <div class="post-user">
                Posted by ${post.userName} (${post.userDept || "Student"})
            </div>
            <div style="display:flex; gap:0.4rem; align-items:center;">
                ${hasPin ? `<a href="post.html?id=${post.id}#map-viewer" class="btn-small" style="background:#6b7280;">View Pin</a>` : ``}
                <a href="post.html?id=${post.id}" class="btn-small">
                    View &amp; Message
                </a>
            </div>
        </div>
    `;

    return card;
}

// ---- Map picker on Create Post
function setupMapPicker() {
    const mapImg = document.getElementById("map-image");
    const pin = document.getElementById("map-pin");
    const inputX = document.getElementById("post-map-x");
    const inputY = document.getElementById("post-map-y");
    if (!mapImg || !pin || !inputX || !inputY) return;

    function placePin(normX, normY) {
        inputX.value = String(normX);
        inputY.value = String(normY);

        const rect = mapImg.getBoundingClientRect();
        pin.style.left = `${normX * rect.width}px`;
        pin.style.top = `${normY * rect.height}px`;
        pin.style.display = "block";
    }

    mapImg.addEventListener("click", (e) => {
        const rect = mapImg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const normX = Math.min(1, Math.max(0, x / rect.width));
        const normY = Math.min(1, Math.max(0, y / rect.height));
        placePin(normX, normY);
    });

    // resize pin
    window.addEventListener("resize", () => {
        const normX = Number(inputX.value);
        const normY = Number(inputY.value);
        if (Number.isFinite(normX) && Number.isFinite(normY) && pin.style.display === "block") {
            placePin(normX, normY);
        }
    });
}

function renderPosts() {
    const container = document.getElementById("posts-container");
    if (!container) return;

    const posts = loadPosts();
    const filterType = document.getElementById("filter-type").value;
    const searchQuery = document.getElementById("search-input").value.toLowerCase();

    container.innerHTML = "";

    const filtered = posts.filter(post => {
        const matchesType = filterType === "all" || post.type === filterType;
        const textToSearch =
            `${post.title} ${post.description} ${post.campusArea} ${post.locationDetail} ${(post.tags || []).join(" ")}`.toLowerCase();
        const matchesSearch = !searchQuery || textToSearch.includes(searchQuery);
        return matchesType && matchesSearch;
    });

    if (filtered.length === 0) {
        const msg = document.createElement("p");
        msg.className = "muted";
        msg.textContent = "No posts match your search yet.";
        container.appendChild(msg);
        return;
    }

    filtered.forEach(post => container.appendChild(createPostCard(post)));
}

// ---- Render "My Posts" in profile ----
function renderMyPosts() {
    const container = document.getElementById("my-posts-container");
    if (!container) return;

    const posts = loadPosts();
    container.innerHTML = "";

    if (!currentUser) {
        container.classList.add("empty-state");
        container.innerHTML = `<p class="muted">Login and create posts to see them here.</p>`;
        return;
    }

    const mine = posts.filter(p => p.userEmail === currentUser.email);

    if (mine.length === 0) {
        container.classList.add("empty-state");
        container.innerHTML = `<p class="muted">You have no posts yet.</p>`;
        return;
    }

    container.classList.remove("empty-state");
    mine.forEach(p => container.appendChild(createPostCard(p)));
}

// ---- SPA ----
function setupNavigation() {
    const navButtons = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll(".page-section");

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-target");
            sections.forEach(sec => {
                sec.classList.toggle("is-active", sec.id === targetId);
            });

            if (targetId === "home-section") renderPosts();
            if (targetId === "profile-section") renderMyPosts();
        });
    });
}

// ---- Auth ----
function setupAuthTabs() {
    const loginTab = document.getElementById("login-tab");
    const signupTab = document.getElementById("signup-tab");
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    loginTab.addEventListener("click", () => {
        loginTab.classList.add("is-active");
        signupTab.classList.remove("is-active");
        loginForm.classList.add("is-active");
        signupForm.classList.remove("is-active");
    });

    signupTab.addEventListener("click", () => {
        signupTab.classList.add("is-active");
        loginTab.classList.remove("is-active");
        signupForm.classList.add("is-active");
        loginForm.classList.remove("is-active");
    });
}

// ---- Auth  ----
function setupAuthForms() {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value; // not used

        if (!email || !password) {
            alert("Please enter email and password.");
            return;
        }

        
        if (!email.toLowerCase().endsWith("@metu.edu.tr")) {
            alert("Only @metu.edu.tr accounts can log in.");
            return;
        }

        // Front-end protection: allow METU emails only
        if (!isMetuEmail(email)) {
            alert("Only @metu.edu.tr accounts can log in .");
            return;
        }

        currentUser = {
            name: email.split("@")[0] || "User",
            email,
            department: "Student"
        };
        saveCurrentUser(currentUser);
        updateProfileUI();
        renderMyPosts();
        alert("Logged in .");
    });

    signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("signup-name").value;
        const email = document.getElementById("signup-email").value.trim();
        const dept = document.getElementById("signup-department").value;
        const password = document.getElementById("signup-password").value;
        const agree = document.getElementById("signup-agree").checked;

        if (!name || !email || !password || !agree) {
            alert("Please fill all required fields and accept the agreement.");
            return;
        }

        
        if (!email.toLowerCase().endsWith("@metu.edu.tr")) {
            alert("Sign up is restricted to @metu.edu.tr emails.");
            return;
        }

        // Front-end protection: allow METU emails only
        if (!isMetuEmail(email)) {
            alert("Sign up is restricted to @metu.edu.tr emails .");
            return;
        }

        currentUser = {
            name,
            email,
            department: dept || "Student"
        };
        saveCurrentUser(currentUser);
        updateProfileUI();
        renderMyPosts();
        alert("Account created . You are now logged in.");
    });
}

// ---- Profile UI ----
function updateProfileUI() {
    const nameEl = document.getElementById("profile-name");
    const emailEl = document.getElementById("profile-email");
    const deptEl = document.getElementById("profile-department");
    const initialsEl = document.getElementById("profile-initials");
    const editBtn = document.getElementById("profile-edit-btn");

    if (!nameEl) return; 

    if (!currentUser) {
        nameEl.textContent = "Guest User";
        emailEl.textContent = "Not logged in";
        deptEl.textContent = "Department: -";
        initialsEl.textContent = "GU";
        editBtn.disabled = true;
        return;
    }

    nameEl.textContent = currentUser.name;
    emailEl.textContent = currentUser.email;
    deptEl.textContent = `Department: ${currentUser.department}`;
    initialsEl.textContent = currentUser.name
        .split(" ")
        .map(p => p[0]?.toUpperCase())
        .join("")
        .slice(0, 2) || "ME";
    editBtn.disabled = false;
}

// ---- Filters ----
function setupFilters() {
    const typeSel = document.getElementById("filter-type");
    const searchInput = document.getElementById("search-input");
    if (typeSel) typeSel.addEventListener("change", renderPosts);
    if (searchInput) searchInput.addEventListener("input", renderPosts);
}

// ---- Create post form ----
function setupCreatePostForm() {
    const form = document.getElementById("create-post-form");
    if (!form) return;

    const panels = Array.from(document.querySelectorAll(".wizard-panel"));
    const steps = Array.from(document.querySelectorAll(".wizard-step"));

    function setStep(stepNum) {
        panels.forEach(p => p.classList.toggle("is-active", Number(p.dataset.step) === stepNum));
        steps.forEach(s => s.classList.toggle("is-active", Number(s.dataset.step) === stepNum));
    }

    function getVal(id) {
        const el = document.getElementById(id);
        return el ? el.value : "";
    }

    function requiredFilled(ids) {
        return ids.every(id => {
            const el = document.getElementById(id);
            if (!el) return false;
            if (el.type === "file") return true;
            return String(el.value || "").trim().length > 0;
        });
    }

    // Step buttons
    const next1 = document.getElementById("wizard-next-1");
    const next2 = document.getElementById("wizard-next-2");
    const next3 = document.getElementById("wizard-next-3");
    const prev2 = document.getElementById("wizard-prev-2");
    const prev3 = document.getElementById("wizard-prev-3");
    const prev4 = document.getElementById("wizard-prev-4");

    if (next1) next1.addEventListener("click", () => {
        if (!requiredFilled(["post-type", "post-title", "post-category"])) {
            alert("Please complete the required fields before continuing.");
            return;
        }
        setStep(2);
    });

    if (next2) next2.addEventListener("click", () => {
        if (!requiredFilled(["post-campus", "post-location-detail", "post-date", "post-time"])) {
            alert("Please complete the required fields before continuing.");
            return;
        }
        setStep(3);
    });

    if (next3) next3.addEventListener("click", () => {
        if (!requiredFilled(["post-description"])) {
            alert("Please complete the required fields before continuing.");
            return;
        }
        setStep(4);
    });

    if (prev2) prev2.addEventListener("click", () => setStep(1));
    if (prev3) prev3.addEventListener("click", () => setStep(2));
    if (prev4) prev4.addEventListener("click", () => setStep(3));

    // default
    setStep(1);

    function readImageAsDataUrl(file) {
        return new Promise((resolve) => {
            if (!file) return resolve(null);
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const type = getVal("post-type");
        const title = getVal("post-title").trim();
        const category = getVal("post-category");
        const campusArea = getVal("post-campus");
        const locationDetail = getVal("post-location-detail").trim();
        const date = getVal("post-date");
        const time = getVal("post-time").trim();
        const description = getVal("post-description").trim();
        const tagsRaw = getVal("post-tags").trim();

        const mapXRaw = getVal("post-map-x");
        const mapYRaw = getVal("post-map-y");
        const mapX = Number(mapXRaw);
        const mapY = Number(mapYRaw);

        if (!title || !locationDetail || !date || !time || !description) {
            alert("Please fill all required fields.");
            return;
        }

        if (!Number.isFinite(mapX) || !Number.isFinite(mapY)) {
            alert("Please pin a location on the map before submitting.");
            return;
        }

        const imageInput = document.getElementById("post-image");
        const file = imageInput && imageInput.files && imageInput.files[0] ? imageInput.files[0] : null;
        const imageData = await readImageAsDataUrl(file);

        const posts = loadPosts();
        const newId = posts.length ? Math.max(...posts.map(p => p.id)) + 1 : 1;

        const tags = tagsRaw
            ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean)
            : [];

        const posterName = currentUser?.name || "Anonymous";
        const posterDept = currentUser?.department || "Student";
        const posterEmail = currentUser?.email || "anonymous@example.com";

        const newPost = {
            id: newId,
            type,
            title,
            category,
            campusArea,
            locationDetail,
            date,
            time,
            description,
            tags,
            imageData: imageData || "",
            mapX,
            mapY,
            userName: posterName,
            userDept: posterDept,
            userEmail: posterEmail
        };

        posts.unshift(newPost);
        savePosts(posts);

        form.reset();

        // Clear map pin UI
        const pin = document.getElementById("map-pin");
        const inputX = document.getElementById("post-map-x");
        const inputY = document.getElementById("post-map-y");
        if (pin) pin.style.display = "none";
        if (inputX) inputX.value = "";
        if (inputY) inputY.value = "";

        alert("Post created!");

        // Switch to home and re-render
        const sections = document.querySelectorAll(".page-section");
        sections.forEach(sec => {
            sec.classList.toggle("is-active", sec.id === "home-section");
        });
        renderPosts();
        renderMyPosts();
        setStep(1);
    });
}

// ---- Init ----
document.addEventListener("DOMContentLoaded", () => {
    currentUser = loadCurrentUser();
    setupNavigation();
    setupAuthTabs();
    setupAuthForms();
    setupFilters();
    setupCreatePostForm();
    setupMapPicker();
    updateProfileUI();
    renderPosts();
    renderMyPosts();
});
