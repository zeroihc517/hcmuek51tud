// Hàm chuyển đổi Tab duy nhất
function showTab(id, el) {
    // 1. Lưu ID tab vào bộ nhớ trình duyệt
    localStorage.setItem('activeTab', id);

    // 2. Chuyển đổi nội dung Tab
    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    // 3. Đồng bộ hiệu ứng Sidebar
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    
    // Nếu có 'el' (do nhấn chuột), dùng luôn. Nếu không (do load trang), đi tìm thẻ a có id đó.
    if (el) {
        el.classList.add('active');
    } else {
        const targetBtn = Array.from(document.querySelectorAll('.sidebar a'))
                               .find(a => a.getAttribute('onclick').includes(`'${id}'`));
        if (targetBtn) targetBtn.classList.add('active');
    }

    // Đóng sidebar nếu đang ở mobile
    document.querySelector('.sidebar').classList.remove('show');
}
function updateHocKy() {
    const hockySelect = document.getElementById('selectHocKy');
    const tuanSelect = document.getElementById('selectTuan');
    hockySelect.disabled = false;
    tuanSelect.disabled = true;
    tuanSelect.innerHTML = '<option value="">-- Chọn tuần --</option>';
}
function updateTuan() {
    const namHoc = document.getElementById('selectNamHoc').value;
    const hocKy = document.getElementById('selectHocKy').value;
    const tuanSelect = document.getElementById('selectTuan');
    tuanSelect.innerHTML = '<option value="">-- Chọn tuần --</option>';
    if (namHoc && hocKy && dataConfig[namHoc][hocKy]) {
        tuanSelect.disabled = false;
        dataConfig[namHoc][hocKy].forEach(item => {
            let opt = document.createElement('option');
            opt.value = item.value || item.val;
            opt.innerHTML = item.text;
            tuanSelect.appendChild(opt);
        });
    }
}
function displayIframe() {
    const val = document.getElementById('selectTuan').value;
    const iframe = document.getElementById('iframeTKB');
    const box = document.getElementById('boxTKB');
    if (val) { iframe.src = val; box.style.display = 'block'; }
    else { box.style.display = 'none'; }
}

function navTuan(step) {
    const select = document.getElementById('selectTuan');
    if (select.selectedIndex + step > 0 && select.selectedIndex + step < select.options.length) {
        select.selectedIndex += step;
        displayIframe();
    }
}
function toggleSidebar(){
    document.querySelector('.sidebar').classList.toggle('show');
}



function toggleSidebar() { document.querySelector('.sidebar').classList.toggle('show'); }

function updateHocKy() {
    const hk = document.getElementById('selectHocKy');
    const t = document.getElementById('selectTuan');
    hk.value = "";
    t.innerHTML = '<option value="">-- Chọn tuần --</option>';
    t.disabled = true;
}

function updateTuan() {
    const nam = document.getElementById('selectNamHoc').value;
    const hk = document.getElementById('selectHocKy').value;
    const tSel = document.getElementById('selectTuan');
    tSel.innerHTML = '<option value="">-- Chọn tuần --</option>';
    if (nam && hk && dataConfig[nam][hk]) {
        tSel.disabled = false;
        dataConfig[nam][hk].forEach(item => {
            let opt = document.createElement('option');
            opt.value = item.val;
            opt.innerHTML = item.text;
            tSel.appendChild(opt);
        });
    } else { tSel.disabled = true; }
}

function displayIframe() {
    const val = document.getElementById('selectTuan').value;
    const iframe = document.getElementById('iframeTKB');
    const box = document.getElementById('boxTKB');
    if (val) { iframe.src = val; box.style.display = 'block'; }
    else { box.style.display = 'none'; }
}

function navTuan(step) {
    const s = document.getElementById('selectTuan');
    if (s.selectedIndex + step > 0 && s.selectedIndex + step < s.options.length) {
        s.selectedIndex += step;
        displayIframe();
    }
}

function closeModal() {
    document.getElementById('modalTongHop').style.display = 'none';
    document.getElementById('iframeTongHop').src = '';
}
// Hàm đóng Modal
function closeModal() {
    document.getElementById('modalTongHop').style.display = 'none';
    document.getElementById('iframeTongHop').src = ''; // Xóa src để giải phóng bộ nhớ
}

// Đóng modal khi nhấn ra ngoài vùng trắng
window.onclick = function(event) {
    const modal = document.getElementById('modalTongHop');
    if (event.target == modal) {
        closeModal();
    }
}
function goToday() {
    const today = new Date();
    let fNam = "", fHK = "", fVal = "";

    for (const nam in dataConfig) {
        for (const hk in dataConfig[nam]) {
            for (const t of dataConfig[nam][hk]) {
                const m = t.text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                if (m) {
                    const start = new Date(m[3], m[2]-1, m[1]);
                    const end = new Date(start); end.setDate(start.getDate() + 7);
                    if (today >= start && today < end) { fNam=nam; fHK=hk; fVal=t.val; break; }
                }
            }
            if(fNam) break;
        }
        if(fNam) break;
    }

    if (fNam) {
        document.getElementById('selectNamHoc').value = fNam;
        document.getElementById('selectHocKy').value = fHK;
        updateTuan();
        document.getElementById('selectTuan').value = fVal;
        displayIframe();
    } else { alert("Không tìm thấy tuần hiện tại!"); }
}
window.onload = function() {
    // Lấy ID tab đã lưu, nếu chưa có thì mặc định là 'nentang'
    const savedTab = localStorage.getItem('activeTab') || 'nentang';
    
    // Gọi hàm hiển thị tab đó
    showTab(savedTab, null);
    
    // Tự động nhấn "Hiện tại" nếu bạn đang ở tab TKB để load dữ liệu mới nhất
    if (savedTab === 'hk2') {
        goToday();
    }
};
// Sự kiện chạy ngay khi trang web tải xong
window.addEventListener('DOMContentLoaded', () => {
    // Lấy tab đã lưu, nếu chưa có (lần đầu vào) thì mặc định là 'nentang'
    const savedTab = localStorage.getItem('activeTab') || 'nentang';
    
    // Gọi hàm hiển thị tab và đồng bộ sidebar
    showTab(savedTab, null);

    // Nếu là tab thời khóa biểu (hk2), tự động nhảy đến tuần hiện tại
    if (savedTab === 'hk2') {
        setTimeout(goToday, 100); // Delay một chút để dữ liệu kịp load
    }
});
function renderPlatforms() {
    const nentangGrid = document.querySelector('#nentang .platform-grid');
    const ungdungGrid = document.querySelector('#ungdung .platform-grid');

    if (nentangGrid && typeof nentangData !== 'undefined') {
        nentangGrid.innerHTML = nentangData.map(item => `
            <a href="${item.href}" target="_blank" class="platform-card">
                <div class="icon">${item.icon}</div>
                <h4>${item.title}</h4>
            </a>
        `).join('');
    }

    if (ungdungGrid && typeof ungdungData !== 'undefined') {
        ungdungGrid.innerHTML = ungdungData.map(item => `
            <a href="${item.href}" target="_blank" class="platform-card">
                <div class="icon">${item.icon}</div>
                <h4>${item.title}</h4>
            </a>
        `).join('');
    }
}
// Thêm vào cuối file scriptindex.js
function printTKB() {
    const iframe = document.getElementById('iframeTKB');
    
    // Kiểm tra xem iframe có đang hiển thị dữ liệu tuần nào không
    if (!iframe || !iframe.src || iframe.src === "about:blank" || document.getElementById('boxTKB').style.display === 'none') {
        alert("Vui lòng chọn một Tuần cụ thể trước khi in!");
        return;
    }

    try {
        // Thực hiện lệnh in trực tiếp nội dung bên trong iframe tuần học
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    } catch (e) {
        // Phòng trường hợp lỗi bảo mật cross-origin nếu cấu hình sai host
        alert("Không thể in trực tiếp. Bạn hãy click chuột phải vào bảng thời khóa biểu và chọn 'In' (Print).");
        console.error(e);
    }
}
// Gọi hàm khi trang tải xong
window.addEventListener('DOMContentLoaded', renderPlatforms);
function exportTKBToImage(event) {
    const tableBox = document.querySelector('.table-box');
    const weekSelect = document.getElementById('apiWeek');
    let weekText = "Tuan";
    
    if (weekSelect && weekSelect.selectedIndex > 0) {
        let rawText = weekSelect.options[weekSelect.selectedIndex].text;
        weekText = rawText.split('(')[0].trim().replace(/\s+/g, '_'); 
    }

    const btn = event.currentTarget || event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span> Đang xuất ảnh...';
    btn.disabled = true;

    // 1. Nhận diện và tạm ẩn buổi tối nếu trống (Tiết 13 -> 16)
    const rows = document.querySelectorAll('#tkb-body tr');
    let hasEveningClass = false;
    for (let i = 12; i < rows.length; i++) {
        if (rows[i] && rows[i].querySelector('.td-subject')) {
            hasEveningClass = true;
            break;
        }
    }

    const eveningRows = [];
    if (!hasEveningClass && rows.length >= 16) {
        for (let i = 12; i < rows.length; i++) {
            if (rows[i]) {
                eveningRows.push({
                    el: rows[i],
                    prevDisplay: rows[i].style.display
                });
                rows[i].style.display = 'none';
            }
        }
    }

    // 2. Ép mỏng viền xuống 0.3px (Phù hợp với Scale 4x)
    const tempStyle = document.createElement('style');
    tempStyle.innerHTML = `
        .sched td { border-width: 0.3px !important; }
        .sched th { border-right-width: 0.3px !important; }
    `;
    document.head.appendChild(tempStyle);

    const originalOverflow = tableBox.style.overflow;
    tableBox.style.overflow = 'visible';

    // 3. Chụp ảnh với Scale 4 (Siêu nét)
    html2canvas(tableBox, {
        scale: 4, // Đẩy lên 4x để chất lượng nét căng
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false
    }).then(canvas => {
        document.head.removeChild(tempStyle);
        eveningRows.forEach(item => item.el.style.display = item.prevDisplay);
        tableBox.style.overflow = originalOverflow;
        
        const link = document.createElement('a');
        link.download = `TKB_${weekText}.png`; 
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        
        btn.innerHTML = originalText;
        btn.disabled = false;
    }).catch(err => {
        console.error("Lỗi xuất ảnh:", err);
        alert("Có lỗi xảy ra khi xuất ảnh. Vui lòng thử lại!");
        
        document.head.removeChild(tempStyle);
        eveningRows.forEach(item => item.el.style.display = item.prevDisplay);
        tableBox.style.overflow = originalOverflow;
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}