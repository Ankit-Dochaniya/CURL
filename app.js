import { supabase } from './supabase.js';

let currentUser = null;
let currentBookId = null;

// Flipbook State
let pageFlip;
let totalPages = 0;
let currentPage = 1;
let pageTimes = [];
let msPerPage = 0;
let pageImages = [];

// Initialize pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// --- UI Navigation ---
function showScreen(screenId) {
    document.querySelectorAll('.screen, #book-container, #bottom-bar').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active-screen');
    });
    const target = document.getElementById(screenId);
    if (target) {
        if(screenId === 'dashboard-screen' || screenId === 'auth-screen') {
            target.classList.add('active-screen');
            document.getElementById('top-bar').style.display = 'flex';
        } else if (screenId === 'book-container') {
            target.style.display = 'flex';
            document.getElementById('top-bar').style.display = 'none';
        } else {
            target.style.display = 'flex';
        }
    }
}

// --- Authentication ---
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authError = document.getElementById('auth-error');

document.getElementById('btn-login').addEventListener('click', async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail.value, password: authPassword.value });
    if (error) authError.textContent = error.message;
});

document.getElementById('btn-signup').addEventListener('click', async () => {
    const { error } = await supabase.auth.signUp({ 
        email: authEmail.value, 
        password: authPassword.value
    });
    if (error) authError.textContent = error.message;
    else authError.textContent = "Check your email for confirmation (if required), or try logging in!";
});

document.getElementById('btn-google').addEventListener('click', async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) authError.textContent = error.message;
});

document.getElementById('btn-logout').addEventListener('click', async () => {
    await supabase.auth.signOut();
});

supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
        const isFirstLogin = !currentUser;
        currentUser = session.user;
        
        let displayName = currentUser.user_metadata?.display_name;
        
        if (!displayName) {
            document.getElementById('name-modal').style.display = 'flex';
            displayName = currentUser.email.split('@')[0]; // fallback
        }
        
        document.getElementById('avatar-btn').textContent = displayName.charAt(0).toUpperCase();
        document.getElementById('profile-name').textContent = displayName;
        document.getElementById('user-profile').style.display = 'block';
        
        // Only force them to the dashboard if they just logged in or opened the app
        if (isFirstLogin) {
            showScreen('dashboard-screen');
            loadBooks();
        }
    } else {
        currentUser = null;
        document.getElementById('user-profile').style.display = 'none';
        showScreen('auth-screen');
    }
});

// Save Name Handler
document.getElementById('btn-save-name').addEventListener('click', async () => {
    const nameInput = document.getElementById('name-input');
    const newName = nameInput.value.trim();
    if (!newName) return;
    
    document.getElementById('btn-save-name').disabled = true;
    document.getElementById('btn-save-name').textContent = "Saving...";
    
    const { error } = await supabase.auth.updateUser({ data: { display_name: newName } });
    if (!error) {
        document.getElementById('avatar-btn').textContent = newName.charAt(0).toUpperCase();
        document.getElementById('profile-name').textContent = newName;
        document.getElementById('name-modal').style.display = 'none';
        if (currentUser) {
            currentUser.user_metadata = currentUser.user_metadata || {};
            currentUser.user_metadata.display_name = newName;
        }
    }
    
    document.getElementById('btn-save-name').disabled = false;
    document.getElementById('btn-save-name').textContent = "Save Name";
});

// Profile Dropdown Toggle
document.getElementById('avatar-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('profile-dropdown').classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('#user-profile')) {
        const dropdown = document.getElementById('profile-dropdown');
        if (dropdown) dropdown.classList.remove('show');
    }
});

// --- Dashboard & Uploading ---
const fileInput = document.getElementById('file-input');
const uploadTile = document.getElementById('upload-tile');
let pendingFile = null;

uploadTile.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        pendingFile = e.target.files[0];
        document.getElementById('rename-input').value = pendingFile.name.replace('.pdf', '');
        document.getElementById('rename-modal').style.display = 'flex';
    }
});

document.getElementById('btn-cancel-upload').addEventListener('click', () => {
    document.getElementById('rename-modal').style.display = 'none';
    pendingFile = null;
    fileInput.value = '';
});

document.getElementById('btn-confirm-upload').addEventListener('click', async () => {
    document.getElementById('rename-modal').style.display = 'none';
    if (!pendingFile || !currentUser) return;
    
    const title = document.getElementById('rename-input').value || pendingFile.name;
    const file = pendingFile;
    pendingFile = null;
    fileInput.value = '';
    
    document.getElementById('upload-zone').style.display = 'flex';
    document.getElementById('upload-status').textContent = 'Uploading...';
    
    try {
        const filePath = `${currentUser.id}/${Date.now()}_${file.name}`;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage.from('books').upload(filePath, file);
        if (uploadError) throw uploadError;
        
        // Get Public URL
        const { data: urlData } = supabase.storage.from('books').getPublicUrl(filePath);
        
        // Save to Supabase Database
        const { error: dbError } = await supabase.from('books').insert([{
            user_id: currentUser.id,
            title: title,
            file_url: urlData.publicUrl,
            storage_path: filePath,
            current_page: 1
        }]);
        
        if (dbError) throw dbError;
        
        document.getElementById('upload-zone').style.display = 'none';
        loadBooks();
    } catch (e) {
        console.error(e);
        document.getElementById('upload-status').textContent = 'Upload failed. Please try again.';
        setTimeout(() => document.getElementById('upload-zone').style.display = 'none', 4000);
    }
});

async function loadBooks() {
    if (!currentUser) return;
    const { data: books, error } = await supabase.from('books').select('*').eq('user_id', currentUser.id);
    if (error) {
        console.error("Error loading books. Make sure the 'books' table exists.", error);
        return;
    }
    
    const grid = document.getElementById('books-grid');
    Array.from(grid.children).forEach(child => {
        if (child.id !== 'upload-tile') child.remove();
    });
    
    books.forEach((book) => {
        const div = document.createElement('div');
        div.className = 'book-tile';
        div.innerHTML = `
            <div class="book-cover"><canvas id="cover-${book.id}" class="pdf-cover"></canvas></div>
            <div class="book-info">
                <div class="book-title" title="${book.title}">${book.title}</div>
                <button class="menu-btn">⋮</button>
                <div class="dropdown-menu">
                    <div class="dropdown-item rename-btn">Rename</div>
                    <div class="dropdown-item danger delete-btn">Delete</div>
                </div>
            </div>
        `;
        
        // Render Cover Asynchronously
        const canvas = div.querySelector(`#cover-${book.id}`);
        pdfjsLib.getDocument(book.file_url).promise.then(pdf => {
            return pdf.getPage(1);
        }).then(page => {
            const viewport = page.getViewport({ scale: 0.5 });
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            return page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
        }).catch(e => {
            console.error('Error rendering cover:', e);
            div.querySelector('.book-cover').innerHTML = '📖';
        });
        
        div.querySelector('.book-cover').addEventListener('click', () => openBook(book.id, book));
        div.querySelector('.book-title').addEventListener('click', () => openBook(book.id, book));
        
        const menuBtn = div.querySelector('.menu-btn');
        const dropdown = div.querySelector('.dropdown-menu');
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-menu').forEach(d => { if(d !== dropdown) d.classList.remove('show') });
            dropdown.classList.toggle('show');
        });
        
        div.querySelector('.delete-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            if(confirm('Delete this book?')) {
                await supabase.from('books').delete().eq('id', book.id);
                try { await supabase.storage.from('books').remove([book.storage_path]); } catch(e){}
                loadBooks();
            }
        });
        
        div.querySelector('.rename-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            const newTitle = prompt("New title:", book.title);
            if(newTitle && newTitle !== book.title) {
                await supabase.from('books').update({ title: newTitle }).eq('id', book.id);
                loadBooks();
            }
        });
        
        grid.appendChild(div);
    });
}

document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show'));
});

// --- Flipbook Rendering & Logic ---
let pdfAspectRatio = 0.75;

async function openBook(bookId, bookData) {
    try {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
            await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
            await docEl.webkitRequestFullscreen();
        } else if (docEl.msRequestFullscreen) {
            await docEl.msRequestFullscreen();
        }
    } catch (e) { console.error("Fullscreen error:", e); }

    currentBookId = bookId;
    currentPage = bookData.current_page || 1;
    
    document.getElementById('upload-zone').style.display = 'flex';
    document.getElementById('upload-status').textContent = `Downloading ${bookData.title}...`;
    
    try {
        const loadingTask = pdfjsLib.getDocument(bookData.file_url);
        const pdf = await loadingTask.promise;
        totalPages = pdf.numPages;
        pageImages = [];
        
        const firstPage = await pdf.getPage(1);
        const vp = firstPage.getViewport({ scale: 1 });
        pdfAspectRatio = vp.width / vp.height;
        const targetHeight = 1800;
        const optimalScale = targetHeight / vp.height;
        
        for (let i = 1; i <= totalPages; i++) {
            document.getElementById('upload-status').textContent = `Rendering page ${i} of ${totalPages}...`;
            const imgDataUrl = await renderPage(pdf, i, optimalScale);
            pageImages.push(imgDataUrl);
        }
        
        document.getElementById('upload-zone').style.display = 'none';
        showScreen('book-container');
        document.getElementById('bottom-bar').style.display = 'flex';
        
        pageTimes = [];
        msPerPage = 0;
        
        initPageFlip();
        updateUI();
        
    } catch(e) {
        console.error(e);
        document.getElementById('upload-status').textContent = 'Error loading PDF';
        setTimeout(() => document.getElementById('upload-zone').style.display = 'none', 3000);
    }
}

async function renderPage(pdf, pageNum, scale) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/png');
}

let uiInterval = null;

function initPageFlip() {
    if (pageFlip) {
        try { pageFlip.destroy(); } catch (e) {}
    }
    
    const wrapper = document.getElementById('flipbook-wrapper');
    wrapper.innerHTML = '<div id="book" style="box-shadow: 0 0 20px rgba(0,0,0,0.8);"></div>';
    const newBook = document.getElementById('book');
    
    pageImages.forEach((src) => {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'my-page';
        pageDiv.style.backgroundColor = 'white';
        
        const img = document.createElement('img');
        img.src = src;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.display = 'block';
        img.style.pointerEvents = 'none';
        
        pageDiv.appendChild(img);
        newBook.appendChild(pageDiv);
    });

function resizeBook() {
    if (!pageFlip) return;
    const container = document.getElementById('book-container');
    const containerHeight = container.clientHeight;
    const containerWidth = container.clientWidth;

    let expectedHeight = containerHeight - 40; 
    let expectedWidth = expectedHeight * pdfAspectRatio;

    if (expectedWidth > containerWidth - 60) {
        expectedWidth = containerWidth - 60;
        expectedHeight = expectedWidth / pdfAspectRatio;
    }

    let wrapper = document.getElementById('flipbook-wrapper');
    wrapper.style.width = expectedWidth + 'px';
    wrapper.style.height = expectedHeight + 'px';
    
    try {
        pageFlip.update();
    } catch(e){}
}

window.addEventListener('resize', () => {
    if (document.getElementById('book-container').style.display === 'flex') {
        resizeBook();
    }
});

    const container = document.getElementById('book-container');
    const containerHeight = container.clientHeight;
    const containerWidth = container.clientWidth;

    let expectedHeight = containerHeight - 40; 
    let expectedWidth = expectedHeight * pdfAspectRatio;

    if (expectedWidth > containerWidth - 60) {
        expectedWidth = containerWidth - 60;
        expectedHeight = expectedWidth / pdfAspectRatio;
    }

    pageFlip = new St.PageFlip(newBook, {
        width: expectedWidth,
        height: expectedHeight,
        size: "fixed",
        showCover: false, 
        mobileScrollSupport: false,
        useMouseEvents: true,
        usePortrait: true,
        maxShadowOpacity: 0.2
    });
    
    resizeBook();
    
    pageFlip.loadFromHTML(document.querySelectorAll('.my-page'));
    
    pageTimes = [{ time: Date.now(), page: 1 }];
    
    if (uiInterval) clearInterval(uiInterval);
    uiInterval = setInterval(updateUI, 60000);
    
    pageFlip.on('init', () => {
        if (currentPage > 1) {
            try {
                pageFlip.turnToPage(currentPage - 1);
            } catch (e) {
                console.error("Error turning page on init:", e);
            }
        }
    });
    
    pageFlip.on('flip', (e) => {
        const newPage = e.data + 1;
        if (newPage > currentPage && currentPage > 0) {
            pageTimes.push({ time: Date.now(), page: newPage });
        }
        currentPage = newPage;
        updateUI();
        saveProgress();
    });
}

function saveProgress() {
    if (currentBookId && currentUser) {
        supabase.from('books').update({ current_page: currentPage }).eq('id', currentBookId).then();
    }
}

function calculatePace() {
    if (pageTimes.length === 0) return;
    const recent = pageTimes.slice(-10);
    let totalMs = 0;
    for (let i = 1; i < recent.length; i++) {
        totalMs += recent[i].time - recent[i-1].time;
    }
    totalMs += Date.now() - recent[recent.length - 1].time;
    const pagesCounted = recent.length; 
    msPerPage = totalMs / pagesCounted;
}

function updateUI() {
    if (totalPages === 0) return;
    calculatePace();
    
    const pct = Math.min(100, Math.round((currentPage / totalPages) * 100));
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('pct-text').textContent = pct + '%';
    document.getElementById('page-counter').textContent = `Page ${currentPage} of ${totalPages}`;
    
    if (msPerPage === 0) {
        document.getElementById('pace-text').textContent = "Learning reading pace...";
        document.getElementById('time-left').textContent = "";
    } else {
        const secondsPerPage = Math.round(msPerPage / 1000);
        document.getElementById('pace-text').textContent = `Pace: ${secondsPerPage} sec/page`;
        const pagesLeft = totalPages - currentPage;
        const msLeft = pagesLeft * msPerPage;
        const minsLeft = Math.ceil(msLeft / 60000);
        if (minsLeft === 0) {
            document.getElementById('time-left').textContent = "Almost done";
        } else {
            document.getElementById('time-left').textContent = `${minsLeft} min left in book`;
        }
    }
}

document.getElementById('btn-prev').onclick = () => { if (pageFlip) pageFlip.flipPrev(); };
document.getElementById('btn-next').onclick = () => { if (pageFlip) pageFlip.flipNext(); };

// Close Book Handler
document.getElementById('btn-close-book').addEventListener('click', async () => {
    try {
        if (document.exitFullscreen && document.fullscreenElement) {
            await document.exitFullscreen();
        } else if (document.webkitExitFullscreen && document.webkitFullscreenElement) {
            await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen && document.msFullscreenElement) {
            await document.msExitFullscreen();
        }
    } catch (e) { console.error("Exit fullscreen error:", e); }
    
    showScreen('dashboard-screen');
    document.getElementById('bottom-bar').style.display = 'none';
    
    if (pageFlip) {
        pageFlip.destroy();
        pageFlip = null;
    }
    const bookEl = document.getElementById('book');
    if (bookEl) {
        bookEl.innerHTML = '';
    } else {
        document.getElementById('flipbook-wrapper').innerHTML = '<div id="book"></div>';
    }
    currentBookId = null;
});
