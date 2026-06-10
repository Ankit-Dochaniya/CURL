let pageFlip;
let totalPages = 0;
let currentPage = 1;
let pageTimes = [];
let msPerPage = 0;
let pageImages = [];
let isTwoPageView = true;

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
            
            for (let i = 1; i <= totalPages; i++) {
                document.getElementById('upload-zone').innerHTML = `<div class="upload-message">Rendering page ${i} of ${totalPages}...</div>`;
                const imgDataUrl = await renderPage(pdf, i);
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

async function renderPage(pdf, pageNum) {
    const page = await pdf.getPage(pageNum);
    const scale = 2.0;  // Good quality
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/png');
}

function initPageFlip() {
    if (pageFlip) {
        pageFlip.destroy();
        bookDiv.innerHTML = '';
    }
    
    // In 2-page view, the book width is split across two pages. In 1-page, the book width is one page.
    // We adjust the StPageFlip width to make the book roughly the same size on screen.
    const pageWidth = isTwoPageView ? 450 : 600;
    const pageHeight = isTwoPageView ? 600 : 800;

    pageFlip = new St.PageFlip(bookDiv, {
        width: pageWidth,
        height: pageHeight,
        showCover: isTwoPageView, // Only separate cover in 2-page mode
        mobileScrollSupport: false,
        useMouseEvents: true,
        usePortrait: !isTwoPageView, // false means force 2-page. true means force 1-page
        maxShadowOpacity: 0.15
    });
    
    pageFlip.loadFromImages(pageImages);
    
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
    
    // If re-initializing, jump to current page
    if (currentPage > 1) {
        // If switching view modes, try to keep the same content visible
        pageFlip.turnToPage(currentPage - 1);
    }
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
