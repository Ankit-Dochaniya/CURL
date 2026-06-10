const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak, UnderlineType
} = require('/home/claude/.npm-global/lib/node_modules/docx');
const fs = require('fs');

const CONTENT_WIDTH = 9360;
const COL1 = 2500;
const COL2 = CONTENT_WIDTH - COL1;

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 36, font: "Arial", color: "1A1A2E" })],
    spacing: { before: 360, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "4A90D9", space: 4 } }
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 28, font: "Arial", color: "2C3E70" })],
    spacing: { before: 280, after: 120 }
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: "34495E" })],
    spacing: { before: 200, after: 80 }
  });
}

function para(text, { bold = false, color = "222222", size = 22 } = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold, color, size, font: "Arial" })],
    spacing: { before: 60, after: 100 }
  });
}

function bullet(text, bold_prefix = "") {
  const children = bold_prefix
    ? [new TextRun({ text: bold_prefix, bold: true, size: 22, font: "Arial", color: "222222" }),
       new TextRun({ text, size: 22, font: "Arial", color: "222222" })]
    : [new TextRun({ text, size: 22, font: "Arial", color: "222222" })];
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children,
    spacing: { before: 40, after: 60 }
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: "222222" })],
    spacing: { before: 40, after: 60 }
  });
}

function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Courier New", size: 18, color: "C0392B", shading: { fill: "F8F8F8", type: ShadingType.CLEAR } })],
    spacing: { before: 40, after: 40 },
    indent: { left: 720 }
  });
}

function twoColTable(rows) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [COL1, COL2],
    rows: rows.map(([left, right, isHeader]) =>
      new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: COL1, type: WidthType.DXA },
            shading: { fill: isHeader ? "2C3E70" : "F0F4FF", type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [new Paragraph({ children: [new TextRun({ text: left, bold: isHeader, size: 20, font: "Arial", color: isHeader ? "FFFFFF" : "1A1A2E" })] })]
          }),
          new TableCell({
            borders,
            width: { size: COL2, type: WidthType.DXA },
            shading: { fill: isHeader ? "1A1A2E" : "FFFFFF", type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [new Paragraph({ children: [new TextRun({ text: right, bold: isHeader, size: 20, font: "Arial", color: isHeader ? "FFFFFF" : "333333" })] })]
          })
        ]
      })
    )
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function spacer() {
  return new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 80, after: 80 } });
}

function highlight(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Arial", color: "1A1A2E", italics: true })],
    spacing: { before: 80, after: 80 },
    indent: { left: 720, right: 720 },
    shading: { fill: "EBF5FB", type: ShadingType.CLEAR },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: "4A90D9", space: 8 } }
  });
}

const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 36, bold: true, font: "Arial" }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, font: "Arial" }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: "Arial" }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // ─── COVER ───
      new Paragraph({ children: [new TextRun({ text: "", size: 48 })], spacing: { before: 1440, after: 0 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "PDF FLIPBOOK WEBSITE", bold: true, size: 64, font: "Arial", color: "1A1A2E" })],
        spacing: { before: 0, after: 120 }
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Complete Technical Build Specification", size: 36, font: "Arial", color: "4A90D9", italics: true })],
        spacing: { before: 0, after: 480 }
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "4A90D9", space: 1 } },
        children: [new TextRun({ text: "", size: 22 })],
        spacing: { before: 0, after: 480 }
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "For AI Agents and Developers", size: 28, font: "Arial", color: "555555" })],
        spacing: { before: 0, after: 200 }
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Version 1.0  |  June 2026", size: 22, font: "Arial", color: "888888" })],
        spacing: { before: 0, after: 2880 }
      }),

      // Feature summary box
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "WHAT THIS DOCUMENT BUILDS", bold: true, size: 26, font: "Arial", color: "FFFFFF" })],
        shading: { fill: "2C3E70", type: ShadingType.CLEAR },
        spacing: { before: 160, after: 80 },
        indent: { left: 360, right: 360 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "A website where users upload any PDF and read it like a real physical book — pages lift and curl from the corner as you drag, exactly like Apple Books or FlipHTML5, complete with reading progress tracking and pace estimation.", size: 22, font: "Arial", color: "222222", italics: true })],
        spacing: { before: 80, after: 80 },
        indent: { left: 360, right: 360 },
        shading: { fill: "EBF5FB", type: ShadingType.CLEAR }
      }),
      new Paragraph({
        children: [new TextRun({ text: "", size: 22 })],
        shading: { fill: "EBF5FB", type: ShadingType.CLEAR },
        spacing: { before: 0, after: 160 },
        indent: { left: 360, right: 360 }
      }),

      pageBreak(),

      // ─── SECTION 1 ───
      h1("1. What Are We Building?"),
      para("This is a step-by-step guide to build a website from scratch. A website is a page that lives on the internet and can be opened by anyone with a web browser (like Chrome or Safari). Our website will do one thing: let people upload a PDF file and read it as if it were a real book, with realistic page-turning animations."),
      spacer(),
      h2("1.1 The Three Core Features"),
      spacer(),
      bullet("", "Realistic Page Curl Animation: "),
      para("When you hover near the bottom-right corner of a page, the corner lifts toward your cursor. When you drag it left, the page peels away like a real book, revealing the next page underneath. The fold line and curl shadow are calculated mathematically in real time.", { color: "444444" }),
      spacer(),
      bullet("", "Reading Progress Ring (Top-Right Corner): "),
      para('A circular ring shows "X% complete" — it fills up as you turn pages. On page 1 of 10 it shows 10%, on page 5 it shows 50%, and so on.', { color: "444444" }),
      spacer(),
      bullet("", "Reading Stats Bar (Bottom-Left Corner): "),
      para("Displays your reading pace in minutes-per-page and an estimated time to finish the book. These numbers update live as you read faster or slower.", { color: "444444" }),
      spacer(),

      h2("1.2 What the User Experiences (Step by Step)"),
      numbered("User visits your website URL in their browser"),
      numbered("They see a big upload area — drag a PDF onto it or click to browse"),
      numbered("The PDF loads and displays as a two-page open book"),
      numbered("Hovering the bottom-right corner makes the corner lift slightly"),
      numbered("Dragging left curls the page — the next page is revealed underneath"),
      numbered("Releasing the mouse completes the page turn with a smooth animation"),
      numbered("The progress ring and stats update after every turn"),
      numbered("User can also click Prev/Next buttons instead of dragging"),

      pageBreak(),

      // ─── SECTION 2 ───
      h1("2. Technology Stack — Every Tool Explained"),
      para("This section lists every technology you will use and explains exactly what it does. You do not need to know any of this in advance — just follow the instructions and install what is listed."),
      spacer(),

      h2("2.1 The Three Languages of the Web"),
      highlight("Every website in the world is built from three languages: HTML, CSS, and JavaScript. You need all three."),
      spacer(),
      twoColTable([
        ["Language", "What It Does", true],
        ["HTML", "Defines the structure — what elements exist on the page (buttons, containers, text)"],
        ["CSS", "Controls appearance — colors, sizes, fonts, layout"],
        ["JavaScript", "Adds behavior — what happens when you click, drag, or upload something"],
      ]),
      spacer(),
      para("Think of it this way: HTML is the skeleton, CSS is the skin and clothes, JavaScript is the muscles and brain."),

      spacer(),
      h2("2.2 Libraries (Pre-Written Code You Can Reuse)"),
      para("A library is a package of code someone else wrote that you can drop into your project. Instead of writing 2,000 lines of math for the page curl from scratch, you use a library that already solved it."),
      spacer(),
      twoColTable([
        ["Library", "Purpose + Where to Get It", true],
        ["pdf.js", "Converts each page of a PDF into an image your browser can display. Made by Mozilla (the Firefox team). Free. Load from: cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"],
        ["StPageFlip", "Handles all the page-curl math and animation. MIT license (free forever). Load from: unpkg.com/page-flip/dist/js/page-flip.browser.js"],
        ["No other libraries needed", "Everything else (progress ring, stats bar, upload area) is built with plain JavaScript + CSS"],
      ]),

      spacer(),
      h2("2.3 HTML Canvas"),
      para("Canvas is a built-in browser feature — no download needed. It is like a blank drawing board inside your webpage where JavaScript can draw shapes, images, gradients, and shadows in real time. The page curl is drawn onto a Canvas element 60 times per second as your cursor moves."),

      spacer(),
      h2("2.4 File Structure — What Files You Will Create"),
      spacer(),
      twoColTable([
        ["File Name", "What Goes In It", true],
        ["index.html", "The main HTML file — the only file users open in their browser"],
        ["style.css", "All visual styling — layout, colors, fonts, overlays"],
        ["app.js", "All JavaScript logic — PDF loading, flip engine, progress tracking, stats"],
        ["(Optional) server.js", "Only needed if you want to host the site on your own server (covered in Section 7)"],
      ]),

      pageBreak(),

      // ─── SECTION 3 ───
      h1("3. The Page Curl — How It Works (The Math)"),
      para("This is the most complex part. Understanding it is not required to build the site — StPageFlip does it for you — but this section explains what is happening under the hood so you can debug it if something looks wrong."),
      spacer(),

      h2("3.1 The Core Problem"),
      para("When you peel a page in a real book, the paper folds along a straight crease line. Everything to one side of the crease stays flat (the unturned part you can still read). Everything to the other side is the part that has lifted — it appears flipped and compressed as it curls."),
      spacer(),
      para("The goal is to simulate this in software. Three geometric problems must be solved every frame:"),

      spacer(),
      h2("3.2 Problem 1 — Finding the Fold Line"),
      highlight("The fold line is the perpendicular bisector of the segment from C (original corner) to F (where your cursor dragged the corner to)."),
      spacer(),
      code("C = original corner position (e.g., bottom-right of the page)"),
      code("F = position of your cursor / finger"),
      code("M = midpoint of C and F  =  (C + F) / 2"),
      code("fold line = the line through M, perpendicular to the segment CF"),
      spacer(),
      para("Perpendicular means at a 90-degree angle. This fold line is the crease — everything to the left stays flat, everything to the right gets reflected over it (the curled flap)."),

      spacer(),
      h2("3.3 Problem 2 — The Three Zones"),
      para("Once the fold line is calculated, the canvas is split into three zones, each drawn differently:"),
      spacer(),
      twoColTable([
        ["Zone", "What to Draw", true],
        ["Left of fold line (flat visible area)", "Draw the current page normally, clipped to this region"],
        ["Right of fold line (next page peeking through)", "Draw the NEXT page underneath — this is what you see being revealed"],
        ["The curled flap", "Reflect the current page's content across the fold line. Apply a gradient shadow (dark at the fold, lighter toward the tip) to simulate depth"],
      ]),
      spacer(),
      para("The canvas clip() API is used to draw each zone without it bleeding into the others."),

      spacer(),
      h2("3.4 Problem 3 — The Reflection Transform"),
      para("To draw the curled flap, the page content is reflected (mirrored) across the fold line. In the HTML Canvas 2D API, this is done with the transform() method."),
      spacer(),
      code("// Given fold line through point (px, py) with angle theta:"),
      code("ctx.translate(px, py)"),
      code("ctx.rotate(theta)"),
      code("ctx.scale(-1, 1)    // This is the mirror flip"),
      code("ctx.rotate(-theta)"),
      code("ctx.translate(-px, -py)"),
      code("// Now draw page content — it appears curled/flipped"),
      spacer(),

      h2("3.5 The Shadows"),
      para("Two gradients are drawn after the page to simulate lighting:"),
      bullet("", "Crease shadow: "),
      para("A narrow dark-to-transparent gradient along the fold line, simulating depth at the bend.", { color: "444444" }),
      bullet("", "Cast shadow: "),
      para("A wider gradient on the flat page behind the curl, simulating the curled page lifting off the surface.", { color: "444444" }),

      spacer(),
      h2("3.6 Animation States (How the Turn Completes Automatically)"),
      para("The flip engine has four states. When you release the mouse mid-turn, it automatically animates to completion:"),
      spacer(),
      twoColTable([
        ["State", "Description", true],
        ["IDLE / READ", "No interaction. Page is flat and still."],
        ["FOLD_CORNER", "Cursor is hovering near the corner. The corner lifts slightly to hint interactivity."],
        ["USER_FOLD", "User is actively dragging the corner. The curl follows the cursor in real time."],
        ["FLIPPING", "User released. The engine animates the fold point from the release position to beyond the left edge, completing the turn using an ease-in-out curve."],
      ]),

      pageBreak(),

      // ─── SECTION 4 ───
      h1("4. Reading Progress Features"),
      para("In addition to the page curl, the website displays two live stat overlays that update every time a page is turned."),
      spacer(),

      h2("4.1 Completion Ring (Top-Right Corner)"),
      h3("What it shows"),
      para("A circular SVG ring that fills clockwise as you progress through the book. Below it: \"X% complete\"."),
      spacer(),
      h3("How to calculate it"),
      code("completionPercent = Math.round((currentPage / totalPages) * 100)"),
      spacer(),
      h3("How to draw it with SVG"),
      code("<svg width='56' height='56'>"),
      code("  <!-- Background ring (grey) -->"),
      code("  <circle cx='28' cy='28' r='22' fill='none' stroke='#ddd' stroke-width='4'/>"),
      code("  <!-- Progress ring (blue) — stroke-dasharray controls how much is filled -->"),
      code("  <circle cx='28' cy='28' r='22' fill='none' stroke='#4A90D9' stroke-width='4'"),
      code("    stroke-dasharray='138.2'   <!-- circumference = 2 * pi * 22 = 138.2 -->"),
      code("    stroke-dashoffset='X'      <!-- X = 138.2 * (1 - completionPercent/100) -->"),
      code("    transform='rotate(-90 28 28)'/>  <!-- Start fill from top, not right -->"),
      code("</svg>"),
      spacer(),
      para("Every time the page turns, recalculate completionPercent and update stroke-dashoffset in JavaScript."),
      spacer(),

      h2("4.2 Reading Stats Bar (Bottom-Left Corner)"),
      h3("What it shows"),
      para("\"2 min/page  ·  10 min left\" — pace and estimated remaining time."),
      spacer(),
      h3("How to calculate pace"),
      code("// Record the timestamp every time the user turns a page"),
      code("pageTurnTimestamps.push(Date.now())"),
      code(""),
      code("// Calculate average time between page turns"),
      code("if (pageTurnTimestamps.length >= 2) {"),
      code("  const intervals = [];"),
      code("  for (let i = 1; i < pageTurnTimestamps.length; i++) {"),
      code("    intervals.push(pageTurnTimestamps[i] - pageTurnTimestamps[i-1]);"),
      code("  }"),
      code("  const avgMs = intervals.reduce((a,b) => a+b, 0) / intervals.length;"),
      code("  const minsPerPage = Math.round(avgMs / 60000);"),
      code("}"),
      spacer(),
      h3("How to calculate time remaining"),
      code("pagesLeft = totalPages - currentPage"),
      code("timeLeftMinutes = pagesLeft * minsPerPage"),
      spacer(),
      para("Default pace before enough data (first 2 pages): show 2 min/page as a sensible starting estimate."),

      pageBreak(),

      // ─── SECTION 5 ───
      h1("5. Complete Code — File by File"),
      para("This section gives you the complete structure of every file. An AI agent should generate each file exactly as described. The code uses StPageFlip to handle the flip geometry (no need to implement Problem 1-3 from Section 3 manually)."),
      spacer(),

      h2("5.1 index.html — Complete Structure"),
      highlight("This is the only file the user opens. It loads all libraries and references style.css and app.js."),
      spacer(),
      para("The <head> section must contain:", { bold: true }),
      bullet("The page title: \"PDF Flipbook\""),
      bullet("A link to style.css: <link rel='stylesheet' href='style.css'>"),
      bullet("pdf.js loaded from CDN: cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"),
      bullet("StPageFlip loaded from CDN: unpkg.com/page-flip/dist/js/page-flip.browser.js"),
      spacer(),
      para("The <body> section must contain these elements in order:", { bold: true }),
      numbered("A full-page upload zone div (id='upload-zone') containing: a file input (accept='.pdf'), a label with the text 'Drag your PDF here or click to upload'"),
      numbered("A book container div (id='book-container', hidden initially) containing: the StPageFlip target div (id='book')"),
      numbered("The progress ring div (id='progress-ring', positioned top-right) containing: an SVG element as described in Section 4.1, and a span showing the percentage text"),
      numbered("The stats bar div (id='stats-bar', positioned bottom-left) containing: a clock icon (Unicode: ⏱), a span for pace text, a dot separator, a span for time-remaining text"),
      numbered("Navigation controls div (id='nav-controls') containing: a Prev button (id='btn-prev'), a page counter span (id='page-counter'), a Next button (id='btn-next')"),
      numbered("A script tag loading app.js at the very end of <body>: <script src='app.js'></script>"),
      spacer(),

      h2("5.2 style.css — Complete Styling Rules"),
      spacer(),
      para("Global resets and base:", { bold: true }),
      code("* { margin: 0; padding: 0; box-sizing: border-box; }"),
      code("body { font-family: Arial, sans-serif; background: #1a1a2e; min-height: 100vh;"),
      code("       display: flex; flex-direction: column; align-items: center; justify-content: center; }"),
      spacer(),
      para("Upload zone:", { bold: true }),
      code("#upload-zone { width: 480px; padding: 60px; border: 2px dashed #4A90D9;"),
      code("  border-radius: 16px; text-align: center; color: #aaa; cursor: pointer; }"),
      code("#upload-zone:hover { border-color: #fff; color: #fff; }"),
      code("#upload-zone input[type=file] { display: none; }"),
      spacer(),
      para("Book container:", { bold: true }),
      code("#book-container { display: none; position: relative; }  /* shown via JS after PDF loads */"),
      code("#book { width: 900px; height: 600px; }  /* StPageFlip fills this */"),
      spacer(),
      para("Progress ring — positioned inside book container:", { bold: true }),
      code("#progress-ring { position: absolute; top: 12px; right: 12px;"),
      code("  background: rgba(0,0,0,0.55); border-radius: 50px;"),
      code("  padding: 6px 12px 6px 6px; display: flex; align-items: center;"),
      code("  gap: 6px; color: white; font-size: 13px; }"),
      spacer(),
      para("Stats bar — positioned inside book container:", { bold: true }),
      code("#stats-bar { position: absolute; bottom: 12px; left: 12px;"),
      code("  background: rgba(0,0,0,0.55); border-radius: 50px;"),
      code("  padding: 8px 16px; color: white; font-size: 13px; }"),
      spacer(),
      para("Navigation controls:", { bold: true }),
      code("#nav-controls { margin-top: 20px; display: flex; gap: 20px; align-items: center; color: white; }"),
      code("#nav-controls button { padding: 8px 24px; border-radius: 8px; border: none;"),
      code("  background: #4A90D9; color: white; cursor: pointer; font-size: 14px; }"),
      code("#nav-controls button:hover { background: #357ABD; }"),
      spacer(),

      h2("5.3 app.js — Complete Logic"),
      para("This file is the brain of the site. It must do the following things, in order:"),
      spacer(),
      h3("Step A: Set up variables"),
      code("let pageFlip;          // The StPageFlip instance"),
      code("let totalPages = 0;    // Total pages in the PDF"),
      code("let currentPage = 1;  // Current page number"),
      code("let pageTimes = [];    // Timestamps of each page turn"),
      code("let minsPerPage = 2;  // Default pace estimate"),
      spacer(),

      h3("Step B: Handle file upload"),
      para("Listen for changes on the file input. When a PDF is selected:"),
      numbered("Read the file as an ArrayBuffer using FileReader"),
      numbered("Pass it to pdf.js: pdfjsLib.getDocument({ data: arrayBuffer }).promise"),
      numbered("Store the total page count: pdf.numPages"),
      numbered("Render every page to a separate canvas, then export each as a PNG data URL"),
      numbered("Store all page images in an array: pageImages[]"),
      numbered("Hide the upload zone, show the book container"),
      numbered("Initialize StPageFlip and load the page images"),
      spacer(),

      h3("Step C: Render pages with pdf.js"),
      code("async function renderPage(pdf, pageNum) {"),
      code("  const page = await pdf.getPage(pageNum);"),
      code("  const scale = 1.5;  // Higher = better quality"),
      code("  const viewport = page.getViewport({ scale });"),
      code("  const canvas = document.createElement('canvas');"),
      code("  canvas.width = viewport.width;"),
      code("  canvas.height = viewport.height;"),
      code("  const ctx = canvas.getContext('2d');"),
      code("  await page.render({ canvasContext: ctx, viewport }).promise;"),
      code("  return canvas.toDataURL('image/png');"),
      code("}"),
      spacer(),

      h3("Step D: Initialize StPageFlip"),
      code("pageFlip = new St.PageFlip(document.getElementById('book'), {"),
      code("  width: 450,          // Width of ONE page (book shows two pages)"),
      code("  height: 600,         // Height of a page"),
      code("  showCover: true,     // First page is a standalone cover"),
      code("  mobileScrollSupport: false"),
      code("});"),
      code("pageFlip.loadFromImages(pageImages);  // Array of PNG data URLs"),
      spacer(),

      h3("Step E: Listen for page turns"),
      code("pageFlip.on('flip', (e) => {"),
      code("  currentPage = e.data + 1;  // StPageFlip uses 0-based index"),
      code("  pageTimes.push(Date.now());"),
      code("  updatePace();"),
      code("  updateProgressRing();"),
      code("  updateStatsBar();"),
      code("  document.getElementById('page-counter').textContent ="),
      code("    `Page ${currentPage} of ${totalPages}`;"),
      code("});"),
      spacer(),

      h3("Step F: Update progress ring"),
      code("function updateProgressRing() {"),
      code("  const pct = Math.round((currentPage / totalPages) * 100);"),
      code("  const circumference = 2 * Math.PI * 22;  // r=22"),
      code("  const offset = circumference * (1 - pct / 100);"),
      code("  document.querySelector('#progress-ring circle:last-child')"),
      code("    .setAttribute('stroke-dashoffset', offset);"),
      code("  document.getElementById('pct-text').textContent = pct + '% complete';"),
      code("}"),
      spacer(),

      h3("Step G: Update pace and stats"),
      code("function updatePace() {"),
      code("  if (pageTimes.length < 2) return;"),
      code("  const recent = pageTimes.slice(-5);  // Use last 5 turns for rolling average"),
      code("  let sum = 0;"),
      code("  for (let i = 1; i < recent.length; i++) sum += recent[i] - recent[i-1];"),
      code("  const avgMs = sum / (recent.length - 1);"),
      code("  minsPerPage = Math.max(1, Math.round(avgMs / 60000));"),
      code("}"),
      code(""),
      code("function updateStatsBar() {"),
      code("  const left = totalPages - currentPage;"),
      code("  const timeLeft = left * minsPerPage;"),
      code("  document.getElementById('pace-text').textContent = minsPerPage + ' min/page';"),
      code("  document.getElementById('time-left').textContent = timeLeft + ' min left';"),
      code("}"),
      spacer(),

      h3("Step H: Wire up Prev / Next buttons"),
      code("document.getElementById('btn-prev').onclick = () => pageFlip.flipPrev();"),
      code("document.getElementById('btn-next').onclick = () => pageFlip.flipNext();"),

      pageBreak(),

      // ─── SECTION 6 ───
      h1("6. Step-by-Step Build Instructions"),
      para("Follow these steps in order. Each step is one action to take."),
      spacer(),

      h2("Step 1 — Create Your Project Folder"),
      para("Make a new folder on your computer called 'flipbook'. Inside it, create three empty files:"),
      bullet("index.html"),
      bullet("style.css"),
      bullet("app.js"),
      spacer(),

      h2("Step 2 — Write index.html"),
      para("Open index.html in any text editor (Notepad, VS Code, or any AI coding tool). Paste in the full HTML structure described in Section 5.1. Make sure the CDN links for pdf.js and StPageFlip are in the <head>."),
      spacer(),

      h2("Step 3 — Write style.css"),
      para("Open style.css and paste in all the CSS rules from Section 5.2. The book is centered on a dark navy background. The overlays use semi-transparent dark pills."),
      spacer(),

      h2("Step 4 — Write app.js"),
      para("Open app.js and implement all of Steps A through H from Section 5.3. The most important parts are: the pdf.js rendering loop (Step C) and calling updateProgressRing + updateStatsBar inside the flip event listener (Step E)."),
      spacer(),

      h2("Step 5 — Test Locally"),
      para("Open index.html in Chrome. IMPORTANT: Because pdf.js uses web workers, you must serve the files from a local server — simply double-clicking index.html will give a CORS error. Run one of these commands in your project folder:"),
      spacer(),
      code("# If Python is installed:"),
      code("python -m http.server 8080"),
      code(""),
      code("# Then open: http://localhost:8080 in Chrome"),
      spacer(),
      para("Upload any PDF file. The pages should render and the curl should work. Turn a few pages and verify the progress ring fills and the stats update."),
      spacer(),

      h2("Step 6 — Deploy to the Internet"),
      para("To put the site online so anyone can access it, use one of these free hosting services:"),
      spacer(),
      twoColTable([
        ["Service", "How to Deploy", true],
        ["Netlify (Recommended)", "Go to netlify.com. Click 'Add new site' > 'Deploy manually'. Drag your entire flipbook folder onto the Netlify dashboard. Done — you get a live URL in 30 seconds."],
        ["GitHub Pages", "Create a free GitHub account. Create a new repository. Upload your 3 files. Go to repository Settings > Pages > Source: main branch. Your site is live at username.github.io/flipbook"],
        ["Vercel", "Go to vercel.com. Connect your GitHub account. Import the repository. Auto-deploys on every update."],
      ]),

      pageBreak(),

      // ─── SECTION 7 ───
      h1("7. Common Problems and How to Fix Them"),
      spacer(),
      twoColTable([
        ["Problem", "Cause and Fix", true],
        ["Blank page / CORS error when opening index.html directly", "You must use a local server. Run: python -m http.server 8080 and open http://localhost:8080"],
        ["PDF loads but pages are blurry", "Increase the scale value in renderPage() from 1.5 to 2.0 or 3.0. Higher scale = sharper but slower."],
        ["Page curl looks jerky or slow", "The canvas is repainting too slow. Reduce scale to 1.2 for faster rendering."],
        ["Completion ring doesn't update", "Check that updateProgressRing() is called inside the pageFlip.on('flip', ...) callback."],
        ["Stats show '0 min left' immediately", "The page timer needs at least 2 page turns to calculate pace. Make sure pageTimes.push() runs on every flip event."],
        ["StPageFlip shows images out of order", "pdf.js page rendering is async. Make sure you await every renderPage() call in order before calling loadFromImages()."],
        ["Mobile: dragging does not work", "Make sure touch events are enabled: add mobileScrollSupport: false to StPageFlip options and handle touchstart/touchmove/touchend events the same as mousedown/mousemove/mouseup."],
      ]),

      pageBreak(),

      // ─── SECTION 8 ───
      h1("8. Glossary — Every Technical Term Explained"),
      para("Reference this section when you encounter unfamiliar words."),
      spacer(),
      twoColTable([
        ["Term", "Plain English Explanation", true],
        ["HTML", "HyperText Markup Language. The language that defines what elements exist on a webpage."],
        ["CSS", "Cascading Style Sheets. The language that controls how elements look — colors, sizes, layout."],
        ["JavaScript (JS)", "A programming language that runs inside the browser and makes pages interactive."],
        ["PDF", "Portable Document Format. A file type that preserves exact layouts across all devices."],
        ["Canvas", "A rectangular drawing area built into browsers. JavaScript draws shapes and images on it."],
        ["CDN", "Content Delivery Network. A fast global server that hosts libraries so you don't have to."],
        ["DOM", "Document Object Model. The browser's live representation of your HTML, which JavaScript can modify."],
        ["ArrayBuffer", "Raw binary data in memory. pdf.js requires the PDF file as an ArrayBuffer to parse it."],
        ["DataURL", "A text string that encodes an image as Base64. Used to pass rendered PDF pages to StPageFlip."],
        ["Perpendicular Bisector", "A line that cuts a segment exactly in half at a 90-degree angle. This is the fold line."],
        ["Circumference", "The total length around a circle. For a circle of radius r: circumference = 2 * pi * r."],
        ["stroke-dashoffset", "An SVG property that controls how much of a circle outline is drawn. Used for the progress ring."],
        ["Ease-in-out", "An animation curve that starts slow, speeds up, then slows at the end — feels natural."],
        ["CORS", "Cross-Origin Resource Sharing. A browser security rule that blocks certain file reads unless served by a web server."],
        ["localhost", "A special address that refers to your own computer. http://localhost:8080 opens a server running on your machine."],
        ["Deploy", "Putting your website on the internet so others can visit it."],
        ["MIT License", "A software license that means: free to use, modify, and distribute for any purpose."],
      ]),

      pageBreak(),

      // ─── SECTION 9 ───
      h1("9. Quick Reference Card"),
      para("Print this page and keep it nearby while building."),
      spacer(),
      h2("CDN Links (paste into <head> of index.html)"),
      code("<!-- pdf.js -->"),
      code("<script src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'></script>"),
      code(""),
      code("<!-- StPageFlip -->"),
      code("<script src='https://unpkg.com/page-flip/dist/js/page-flip.browser.js'></script>"),
      spacer(),
      h2("Key Formulas"),
      twoColTable([
        ["What to Calculate", "Formula", true],
        ["Completion %", "Math.round((currentPage / totalPages) * 100)"],
        ["Progress ring fill", "strokeDashoffset = 138.2 * (1 - pct/100)   [for r=22]"],
        ["Average pace", "sum of (time between page turns) / number of intervals"],
        ["Time remaining", "pagesLeft * minsPerPage"],
        ["Fold line midpoint", "(C + F) / 2   where C = corner, F = cursor"],
        ["Reflection transform", "translate → rotate → scale(-1,1) → rotate back → translate back"],
      ]),
      spacer(),
      h2("Local Server Commands"),
      twoColTable([
        ["Tool", "Command", true],
        ["Python 3", "python -m http.server 8080"],
        ["Python 2", "python -m SimpleHTTPServer 8080"],
        ["Node.js (npx)", "npx serve ."],
        ["VS Code", "Install 'Live Server' extension, right-click index.html > Open with Live Server"],
      ]),
      spacer(),
      h2("Deployment Checklist"),
      bullet("index.html, style.css, app.js all present"),
      bullet("CDN links for pdf.js and StPageFlip are in <head>"),
      bullet("pageFlip.on('flip', ...) calls all three update functions"),
      bullet("Tested locally with python -m http.server before deploying"),
      bullet("Uploaded to Netlify / GitHub Pages / Vercel"),

      spacer(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: "4A90D9", space: 6 } },
        children: [new TextRun({ text: "End of Specification  |  Build something great.", size: 22, font: "Arial", color: "888888", italics: true })],
        spacing: { before: 360, after: 0 }
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/mnt/user-data/outputs/PDF_Flipbook_Build_Spec.docx', buffer);
  console.log('Done!');
}).catch(console.error);
