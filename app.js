let pageFlip;
let totalPages = 0;
let currentPage = 1;
let pageTimes = [];
let msPerPage = 0;
let pageImages = [];

// Initialize pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const uploadZone = document.querySelector('.upload-message');
const fileInput = document.getElementById('file-input');
const bookDiv = document.getElementById('book');

uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.style.borderColor = '#ccc'; });
uploadZone.addEventListener('dragleave', () => uploadZone.style.borderColor = '#555');
document.getElementById('upload-zone').addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
});

let pdfAspectRatio = 0.75; // default aspect ratio

function handleFile(file) {
    if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file.');
        return;
    }
    
    document.getElementById('upload-zone').innerHTML = '<div class="upload-message">Loading PDF... Please wait.</div>';
    
    const reader = new FileReader();
    reader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        try {
            const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
            totalPages = pdf.numPages;
            pageImages = [];
            
            // Get aspect ratio from the first page
            const firstPage = await pdf.getPage(1);
            const vp = firstPage.getViewport({ scale: 1 });
            pdfAspectRatio = vp.width / vp.height;
            
            // Calculate an optimal scale to generate high quality images
            // We want images around 1800px tall to avoid massive downscaling artifacts
            const targetHeight = 1800;
            const optimalScale = targetHeight / vp.height;
            
            for (let i = 1; i <= totalPages; i++) {
                document.getElementById('upload-zone').innerHTML = `<div class="upload-message">Rendering page ${i} of ${totalPages}...</div>`;
                const imgDataUrl = await renderPage(pdf, i, optimalScale);
                pageImages.push(imgDataUrl);
            }
            
            document.getElementById('upload-zone').style.display = 'none';
            document.getElementById('book-container').style.display = 'flex';
            document.getElementById('bottom-bar').style.display = 'flex';
            
            // Reset stats
            pageTimes = [];
            msPerPage = 0;
            currentPage = 1;
            
            initPageFlip();
            updateUI();
            
        } catch (err) {
            console.error(err);
            document.getElementById('upload-zone').innerHTML = '<div class="upload-message">Error loading PDF. Please try again.</div>';
        }
    };
    reader.readAsArrayBuffer(file);
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

function initPageFlip() {
    if (pageFlip) {
        try { pageFlip.destroy(); } catch (e) {}
    }
    
    // Completely wipe the wrapper to remove any extra elements StPageFlip created
    const wrapper = document.getElementById('flipbook-wrapper');
    wrapper.innerHTML = '<div id="book" style="box-shadow: 0 0 20px rgba(0,0,0,0.8);"></div>';
    const newBook = document.getElementById('book');
    
    // Populate the book with HTML elements containing images
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
        img.style.pointerEvents = 'none'; // prevent image dragging
        
        pageDiv.appendChild(img);
        newBook.appendChild(pageDiv);
    });

    // Set the base aspect ratio for StPageFlip.
    const baseHeight = 1000;
    const baseWidth = baseHeight * pdfAspectRatio;

    // Force 1-page portrait mode by constraining the wrapper width exactly
    const expectedWidth = wrapper.clientHeight * pdfAspectRatio;
    wrapper.style.width = expectedWidth + 'px';
    wrapper.style.height = '100%';

    pageFlip = new St.PageFlip(newBook, {
        width: baseWidth,
        height: baseHeight,
        size: "stretch",
        minWidth: 300,
        maxWidth: 3000,
        minHeight: 400,
        maxHeight: 3000,
        showCover: false, // 1-page view doesn't separate cover
        mobileScrollSupport: false,
        useMouseEvents: true,
        usePortrait: true, // MUST be true to allow 1-page portrait mode
        maxShadowOpacity: 0.15
    });
    
    // Pass the DOM elements to StPageFlip instead of the raw data URLs
    pageFlip.loadFromHTML(document.querySelectorAll('.my-page'));
    
    // Wait for flipbook to initialize before turning to the current page
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
            // Only track forward page turns
            pageTimes.push({ time: Date.now(), page: currentPage });
            calculatePace();
        }
        currentPage = newPage;
        updateUI();
    });
}

function calculatePace() {
    if (pageTimes.length < 2) return;
    const recent = pageTimes.slice(-10); // Last 10 turns
    let totalMs = 0;
    for (let i = 1; i < recent.length; i++) {
        totalMs += recent[i].time - recent[i-1].time;
    }
    msPerPage = totalMs / (recent.length - 1);
}

function updateUI() {
    if (totalPages === 0) return;
    
    // Progress
    const pct = Math.min(100, Math.round((currentPage / totalPages) * 100));
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('pct-text').textContent = pct + '%';
    document.getElementById('page-counter').textContent = `Page ${currentPage} of ${totalPages}`;
    
    // Pace
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

document.getElementById('btn-toggle-view').onclick = () => {
    if (totalPages === 0) {
        alert("Please upload a PDF first.");
        return;
    }
    isTwoPageView = !isTwoPageView;
    document.getElementById('btn-toggle-view').textContent = isTwoPageView ? "Switch to 1-Page View" : "Switch to 2-Page View";
    initPageFlip();
};
