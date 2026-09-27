const SUPABASE_URL = "https://wryobpgyzemubrucejif.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_X_l63BT4zYNy5yyd_0X2Iw_LHJNupcG";

const mobileAppUrl = "https://phonepc-six.vercel.app/"; 

const qrContainer = document.getElementById("qrcode");
const imgPreview = document.getElementById("img-preview");
const placeholderText = document.getElementById("placeholder-text");
const copyBtn = document.getElementById("copy-btn");
const toast = document.getElementById("toast");
const historyList = document.getElementById("history-list");
const clearAllBtn = document.getElementById("clear-all-btn");

let currentPhotoUrl = "";

new QRCode(qrContainer, {
  text: mobileAppUrl,
  width: 120,
  height: 120
});

async function fetchPhotoHistory() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/latest_photo?select=url&order=id.desc&limit=1`, {
      headers: { 
        'apikey': SUPABASE_ANON_KEY, 
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}` 
      }
    });

    if (!response.ok) {
      console.error("Error Status:", response.status);
      return;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      if(data[0].url !== currentPhotoUrl){
      currentPhotoUrl = data[0].url;
      displayReceivedImage(currentPhotoUrl);
    }
    renderHistory(data);
  }
  else {
    imgPreview.style.display = "none";
    placeholderText.style.display = "block";
    copyBtn.disabled = true;
    historyList.innerHTML = `<span style="font-size:11px; color:#64748b;">No history</span>`;
  }
  } catch (err) {
    console.error("Error fetching:", err);
  }
}

function renderHistory(photos){
  historyList.innerHTML="";
  
  photos.forEach(photo => {
    const item = document.createElement("div");
    item.className = "history-item";

    const img = document.createElement("img");
    img.src = photo.url;
    img.title = "Click to select and preview";
    img.onclick = () => {
      displayReceivedImage(photo.url);
    };
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-item-btn";
    deleteBtn.innerHTML = "X";
    deleteBtn.title = "Delete photo";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteSinglePhoto(photo.id);
    };
    item.appendChild(img);
    item.appendChild(deleteBtn);
    historyList.appendChild(item);
  });
}

function displayReceivedImage(imageUrl) {
  placeholderText.style.display = "none";
  imgPreview.src = imageUrl;
  imgPreview.style.display = "block";
  copyBtn.disabled = false;
}

async function copyImageToClipboard(imageUrl) {
  try {
    toast.textContent = "Copying...";

    // 1. Load image into an HTML Image Object
    const img = new Image();
    img.crossOrigin = "anonymous"; // Bypass CORS
    img.src = imageUrl;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    // 2. Draw image onto a hidden Canvas
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // 3. Convert Canvas to PNG Blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast.textContent = "Failed to process.";
        return;
      }

      // 4. Write pure PNG blob to System Clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]);

      toast.textContent = "Copied!";
      setTimeout(() => { toast.textContent = ""; }, 2500);
    }, "image/png");

  } catch (err) {
    console.error("Copy failed:", err);
    toast.textContent = "Error copying image.";
  }
}
async function deleteSinglePhoto(id) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/latest_photo?id=eq.${id}`, {
      method: 'DELETE',
      headers: { 
        'apikey': SUPABASE_ANON_KEY, 
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}` 
      }
    });
    fetchPhotoHistory();
  } catch (err) {
    console.error("Delete photo error:", err);
  }
}

// Clear whole history log from database
clearAllBtn.addEventListener("click", async () => {
  if (!confirm("Clear all photo history?")) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/latest_photo?id=gt.0`, {
      method: 'DELETE',
      headers: { 
        'apikey': SUPABASE_ANON_KEY, 
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}` 
      }
    });
    currentPhotoUrl = "";
    fetchPhotoHistory();
  } catch (err) {
    console.error("Clear history error:", err);
  }
});

copyBtn.addEventListener("click", () => {
  if (imgPreview.src) {
    copyImageToClipboard(imgPreview.src);
  }
});

// 1. Initial check when popup opens
fetchPhotoHistory();

// 2. Continuous check every 2 seconds for fresh photo updates
setInterval(fetchLatestPhoto, 2000);