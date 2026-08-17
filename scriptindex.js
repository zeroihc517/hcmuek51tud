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

    // Đã gỡ bỏ logic tự động ẩn các tiết buổi tối ở đây để xuất toàn bộ khung thời khóa biểu

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
        
        if (document.head.contains(tempStyle)) document.head.removeChild(tempStyle);
        tableBox.style.overflow = originalOverflow;
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}
// 1. Hàm bóc tách, loại bỏ các chữ "Kiểm tra", "Tiểu luận" để lấy tên gốc
function getBaseSubjectName(name) {
    if (!name) return "KHÁC";
    let cleanName = name.replace(/^([a-zA-Z0-9_\.]+)\s*-\s*/, '');
    let base = cleanName.toLowerCase()
        .replace(/\(.*?\)/g, "") 
        .replace(/(tiểu luận kết thúc học phần|tiểu luận|kiểm tra quá trình|kiểm tra giữa học phần|kiểm tra kết thúc học phần|kiểm tra|học bù|tự học)/g, "")
        .replace(/^[\s-:]+/, '').replace(/[\s-:]+$/, '').replace(/\s+/g, ' ').trim();
    if (base.endsWith("vecto")) { base = base.slice(0, -5) + "vector"; }
    return base.toUpperCase() || "KHÁC";
}

// 2. Phân loại hiển thị nhãn môn học
function getNoteFromSubject(mon) {
    let monLower = (mon || "").toLowerCase(); 
    if (monLower.includes('kiểm tra kết thúc học phần')) return `<span style="color: #dc2626; font-weight: bold;">Kiểm tra Cuối kỳ</span>`;
    if (monLower.includes('kiểm tra giữa học phần')) return `<span style="color: #dc2626; font-weight: bold;">Kiểm tra Giữa kỳ</span>`;
    if (monLower.includes('kiểm tra quá trình')) return `<span style="color: #dc2626; font-weight: bold;">Kiểm tra Quá Trình</span>`;
    if (monLower.includes('kiểm tra')) return `<span style="color: #dc2626; font-weight: bold;">Kiểm tra</span>`;
    if (monLower.includes('bù')) return `<span style="color: #d97706; font-weight: bold;">Học bù</span>`;
    if (monLower.includes('thực hành')) return `<span style="color: #16a34a; font-weight: bold;">Thực hành</span>`;
    return '<span class="text-muted" style="font-size: 13px;">Chính khóa</span>';
}
function processTKBData(data) {
    globalTkbData = data.map((row) => {
        let lastElement = row.pop(); 
        let actualRowIndex = -1;
        let isSystemFlag = false;

        if (typeof lastElement === 'string' && lastElement.startsWith('SYS_')) {
            isSystemFlag = true; actualRowIndex = lastElement; 
        } else {
            actualRowIndex = parseInt(lastElement) || -1;
        }

        // Tách mã HP triệt để khỏi Hình thức (Khắc phục lỗi mã HP dính ở cột Cơ sở)
        let extractedClassId = row[12] || ""; 
        let hinhThucRaw = row[4] || "";
        
        let match = hinhThucRaw.match(/#([a-zA-Z0-9_]+)/);
        if (match) {
            if (!extractedClassId) extractedClassId = match[1];
            hinhThucRaw = hinhThucRaw.replace(match[0], '').trim();
            row[4] = hinhThucRaw; 
        }

        if (isSystemFlag && !extractedClassId) {
            let parts = actualRowIndex.split('_'); 
            if (parts.length >= 2) extractedClassId = parts[1];
        }

        // Xử lý làm sạch tên môn học (Tách mã lớp nếu nó bị dính ở đầu tên)
        let tenMon = row[5] || "";
        // Bắt đầu bằng chữ/số dài 6-15 ký tự, nối với tên môn bằng khoảng trắng hoặc gạch ngang
        let prefixMatch = tenMon.match(/^([A-Za-z0-9]{6,15})\s*[-_:]*\s+(.*)/);
        // BẮT BUỘC PHẢI CHỨA SỐ mới được xem là mã HP
        if (prefixMatch && /\d/.test(prefixMatch[1])) {
            if (!extractedClassId) extractedClassId = prefixMatch[1];
            tenMon = prefixMatch[2]; 
        }

        return {
            thu: parseInt(row[0]) || 0, tietBd: parseInt(row[1]) || 0, soTiet: parseInt(row[2]) || 1,
            thoiGian: row[3] || "", hinhThuc: row[4] || "", mon: tenMon, phong: row[6] || "",     
            gv: row[7] || "", color: row[8] || "#e0f2fe", ngayBatDau: row[9] || "", ngayKetThuc: row[10] || "",
            ngayNgoaiLe: row[11] || "", sheetRowIndex: actualRowIndex, isSystem: isSystemFlag,
            classId: extractedClassId
        };
    }).filter(c => (c.thu >= 2 && c.thu <= 8 && c.tietBd >= 1) || (c.hinhThuc || '').toUpperCase().includes('VLE'));
    
    filterAndRenderTKB();
}
// BỘ CÔNG CỤ XỬ LÝ BẢNG TỔNG HỢP 
function getBaseSubjectName(name) {
    if (!name) return "KHÁC";
    
    let base = name.toLowerCase()
        .replace(/\(.*?\)/g, "") 
        .replace(/(tiểu luận kết thúc học phần|tiểu luận|kiểm tra quá trình|kiểm tra giữa học phần|kiểm tra kết thúc học phần|kiểm tra|học bù|tự học)/g, "")
        .replace(/^[\s-:]+/, '').replace(/[\s-:]+$/, '').replace(/\s+/g, ' ').trim();
        
    if (base.endsWith("vecto")) { base = base.slice(0, -5) + "vector"; }
    return base.toUpperCase() || "KHÁC";
}
function getNoteFromSubject(mon) {
    let monLower = (mon || "").toLowerCase(); 
    if (monLower.includes('kiểm tra kết thúc học phần')) return `<span style="color: #dc2626; font-weight: bold;">Kiểm tra Cuối kỳ</span>`;
    if (monLower.includes('kiểm tra giữa học phần')) return `<span style="color: #dc2626; font-weight: bold;">Kiểm tra Giữa kỳ</span>`;
    if (monLower.includes('kiểm tra quá trình')) return `<span style="color: #dc2626; font-weight: bold;">Kiểm tra Quá Trình</span>`;
    if (monLower.includes('kiểm tra')) return `<span style="color: #dc2626; font-weight: bold;">Kiểm tra</span>`;
    if (monLower.includes('bù')) return `<span style="color: #d97706; font-weight: bold;">Học bù</span>`;
    if (monLower.includes('thực hành')) return `<span style="color: #16a34a; font-weight: bold;">Thực hành</span>`;
    return '<span class="text-muted" style="font-size: 13px;">Chính khóa</span>';
}

function getAcademicTimeRange() {
    let selectedNH = $('#apiNamHoc').val();
    let selectedHK = $('#apiHocKy').val();
    let titleSuffix = '', startMonTime = null, endSunTime = null;

    if (selectedNH && selectedHK) {
        let config = globalConfigHK.find(item => item[0] === selectedNH && item[1] === selectedHK);
        if (config) {
            let sDate = parseDateString(config[2]);
            let numWeeks = parseInt(config[3]);
            let breakWeeks = (config[4] || "").split(',').map(w => parseInt(w.trim())).filter(w => !isNaN(w));
            if (sDate && numWeeks) {
                let startMon = getMondayOfDate(sDate);
                startMonTime = startMon.getTime();
                let acadWk = 1, calWk = 1;
                while (acadWk <= numWeeks && calWk <= 52) { if (!breakWeeks.includes(calWk)) { acadWk++; } calWk++; }
                let endSun = new Date(startMon);
                endSun.setDate(endSun.getDate() + ((calWk - 1) * 7) - 1);
                endSun.setHours(23, 59, 59, 999);
                endSunTime = endSun.getTime();
                titleSuffix = ` - ${selectedHK} (${selectedNH})`;
            }
        }
    }
    return { titleSuffix, startMonTime, endSunTime, selectedHK };
}

// 1. MỞ BẢNG TKB
function openBangTongHop() {
    let { titleSuffix, startMonTime, endSunTime, selectedHK } = getAcademicTimeRange();
    let tbody = document.getElementById('bangTongHopBody');
    document.getElementById('modalTongHopTitle').innerHTML = `<i class="fa-solid fa-list-check" style="margin-right: 8px;"></i>Bảng Tổng Hợp Lịch Học${titleSuffix}`;

    let filteredTkbData = globalTkbData.filter(c => {
        if (!startMonTime || !endSunTime) return true;
        let s = parseDateString(c.ngayBatDau); let cStartT = s ? s.getTime() : null;
        let e = parseDateString(c.ngayKetThuc); let cEndT = e ? e.getTime() : null;
        if (!cStartT && !cEndT) return true; 
        if (cStartT && cEndT) return cStartT <= endSunTime && cEndT >= startMonTime;
        if (cStartT) return cStartT <= endSunTime;
        if (cEndT) return cEndT >= startMonTime;
        return true;
    });

    // 1. Tạo tập hợp Tên & Mã lớp TKB để đối chiếu
    let tkbSubjectNames = new Set();
    let tkbClassIds = new Set();
    filteredTkbData.forEach(c => {
        tkbSubjectNames.add(getBaseSubjectName(c.mon));
        if (c.classId) tkbClassIds.add(String(c.classId).trim().toUpperCase());
    });

    // 2. Nhặt các VLE từ bảng Deadline đưa sang TKB nếu nó có buổi thi/lịch học trùng mã
    let vleFromDeadlines = [];
    (globalDeadlineData || []).forEach(d => {
        if ((d.tag || '').toUpperCase().includes('VLE')) {
            // Kiểm tra thời gian (chỉ lấy VLE thuộc khoảng thời gian đang lọc)
            let s = parseDateString(d.dateStart); let cStartT = s ? s.getTime() : null;
            let e = parseDateString(d.dateEnd); let cEndT = e ? e.getTime() : null;
            let inRange = true;
            if (startMonTime && endSunTime) {
                if (cStartT && cEndT) inRange = (cStartT <= endSunTime && cEndT >= startMonTime);
                else if (cStartT) inRange = (cStartT <= endSunTime);
                else if (cEndT) inRange = (cEndT >= startMonTime);
            }

            if (inRange) {
                let dTitle = d.title || "";
                let dClassId = "";
                // Tách mã lớp khỏi tên VLE (VD: 2511PSYC100115 - Tâm lý học đại cương)
                let prefixMatch = dTitle.match(/^([A-Za-z0-9]{6,15})\s*[-_:]*\s+(.*)/);
                if (prefixMatch && /\d/.test(prefixMatch[1])) {
                    dClassId = prefixMatch[1];
                    dTitle = prefixMatch[2]; // Tên sạch không có mã
                }
                let dBaseName = getBaseSubjectName(dTitle);

                // Nếu VLE này khớp với Tên môn hoặc Mã lớp đang có trong TKB
                if (tkbSubjectNames.has(dBaseName) || (dClassId && tkbClassIds.has(dClassId.toUpperCase()))) {
                    vleFromDeadlines.push({
                        mon: dTitle,
                        classId: dClassId,
                        hinhThuc: d.tag,
                        thu: 99, 
                        tietBd: 1, 
                        soTiet: 1,
                        thoiGian: "",
                        phong: "",
                        gv: "",
                        ngayBatDau: d.dateStart,
                        ngayKetThuc: d.dateEnd
                    });
                }
            }
        }
    });

    // 3. Gộp chung VLE (vừa nhặt) vào dữ liệu TKB
    let combinedTkbData = [...filteredTkbData, ...vleFromDeadlines];

    if (combinedTkbData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px; color: #6b7280;">Không có môn học nào trong ${selectedHK || 'khoảng thời gian này'}.</td></tr>`;
        document.getElementById('modalBangTongHop').style.display = 'flex'; return;
    }

    let groupedByMon = {};
    combinedTkbData.forEach(c => {
        let groupKey = getBaseSubjectName(c.mon);
        if (!groupedByMon[groupKey]) groupedByMon[groupKey] = [];
        groupedByMon[groupKey].push(c);
    });

    let html = ''; let groupIndex = 0;
    for (let key in groupedByMon) {
        let items = groupedByMon[key];
        let rowSpan = items.length;
        let groupBgColor = (groupIndex % 2 === 0) ? "#f8fafc" : "#ffffff";
        groupIndex++;

        let foundClassId = items.find(item => item.classId && String(item.classId).trim() !== "")?.classId;
        let baseNameDisplay = foundClassId ? `<span style="color: #475569; font-weight: 700;">${foundClassId}</span><br>${key}` : key;

        items.sort((a, b) => {
            let tA = parseDateString(a.ngayBatDau); tA = tA ? tA.getTime() : 0;
            let tB = parseDateString(b.ngayBatDau); tB = tB ? tB.getTime() : 0;
            if (tA !== tB) return tA - tB;
            if (a.thu !== b.thu) return a.thu - b.thu;
            return a.tietBd - b.tietBd;
        });

        items.forEach((c, index) => {
            let isVle = (c.hinhThuc || '').toUpperCase().includes('VLE');
            let thuText = isVle ? "-" : (c.thu === 8 ? "Chủ nhật" : (c.thu === 99 ? "-" : "Thứ " + c.thu));
            let tietText = isVle ? "VLE" : `Tiết ${c.tietBd} - ${c.tietBd + c.soTiet - 1}`;
            let thoiGianHienThi = isVle ? "-" : (c.thoiGian || '-');

            let dateDisplay = '-';
            if (c.ngayBatDau && c.ngayKetThuc) dateDisplay = (c.ngayBatDau === c.ngayKetThuc) ? c.ngayBatDau : `Từ ${c.ngayBatDau}<br>đến ${c.ngayKetThuc}`; 
            else if (c.ngayBatDau) dateDisplay = c.ngayBatDau; 
            else if (c.ngayKetThuc) dateDisplay = c.ngayKetThuc;

            let extractedLink = checkAndExtractUrl(c.hinhThuc || "");
            let displayHinhThuc = extractedLink ? (c.hinhThuc || "").replace(extractedLink, '').trim() : c.hinhThuc;
            if (!displayHinhThuc && extractedLink) displayHinhThuc = "Truy cập Link";
            let hinhThucHtml = extractedLink ? `<a href="${extractedLink}" target="_blank" style="color: #2563eb; font-weight: 600; text-decoration: none;">${displayHinhThuc} <i class="fa-solid fa-arrow-up-right-from-square ms-1" style="font-size: 11px;"></i></a>` : `<span style="font-weight: 600;">${displayHinhThuc || '-'}</span>`;

            html += `<tr style="background-color: ${groupBgColor}; ${index === rowSpan - 1 ? 'border-bottom: 2px solid #cbd5e1;' : ''}">`;
            if (index === 0) html += `<td rowspan="${rowSpan}" style="font-weight: 700; color: #0f4c81; text-align: left; vertical-align: middle; border-right: 1px solid #e5e7eb; border-left: 3px solid #0f4c81; padding-left: 20px; text-transform: uppercase;">${baseNameDisplay}</td>`;
            
            html += `
                <td style="border-right: 1px solid #e5e7eb;">${getNoteFromSubject(c.mon)}</td>
                <td style="border-right: 1px solid #e5e7eb;"><span style="font-weight: 700; color: #374151;">${thuText}</span><br><span style="font-size: 12px; color: #6b7280;">(${tietText})</span></td>
                <td style="border-right: 1px solid #e5e7eb;">${hinhThucHtml}</td>
                <td style="color: #dc2626; font-weight: bold; border-right: 1px solid #e5e7eb;">${thoiGianHienThi}</td>
                <td style="font-size: 13px; border-right: 1px solid #e5e7eb;">${dateDisplay}</td>
                <td style="font-weight: 600; border-right: 1px solid #e5e7eb;">${c.phong || '-'}</td>
                <td>${c.gv || '-'}</td>
            </tr>`;
        });
    }
    tbody.innerHTML = html;
    document.getElementById('modalBangTongHop').style.display = 'flex';
}

// 2. MỞ BẢNG DEADLINE
function openBangTongHopDeadline() {
    let { titleSuffix, startMonTime, endSunTime, selectedHK } = getAcademicTimeRange();
    let tbody = document.getElementById('bangTongHopDeadlineBody');
    document.getElementById('modalTongHopDeadlineTitle').innerHTML = `<i class="fa-solid fa-thumbtack" style="margin-right: 8px;"></i>Bảng Tổng Hợp Deadline${titleSuffix}`;

    let tkbSubjectNames = new Set();
    let tkbClassIds = new Set();
    
    globalTkbData.forEach(c => {
        if (!(c.hinhThuc || '').toUpperCase().includes('VLE')) {
            tkbSubjectNames.add(getBaseSubjectName(c.mon));
            if (c.classId) tkbClassIds.add(String(c.classId).trim().toUpperCase());
        }
    });

    let virtualVLEs = [];
    if (typeof globalTkbData !== 'undefined') {
        globalTkbData.forEach(c => {
            if ((c.hinhThuc || '').toUpperCase().includes('VLE')) {
                let baseName = getBaseSubjectName(c.mon);
                let cId = String(c.classId || "").trim().toUpperCase();
                
                let hasSameName = tkbSubjectNames.has(baseName);
                let hasSameClassId = (cId !== "" && tkbClassIds.has(cId));

                if (!hasSameName && !hasSameClassId) {
                    let durationStr = (c.ngayBatDau && c.ngayKetThuc && c.ngayBatDau !== c.ngayKetThuc) ? `Từ ${c.ngayBatDau} đến ${c.ngayKetThuc}` : (c.ngayBatDau || "Chưa rõ");
                    virtualVLEs.push({ title: c.mon, duration: durationStr, tag: c.hinhThuc, icon: "primary", dateStart: c.ngayBatDau || "", dateEnd: c.ngayKetThuc || "", isVirtualVLE: true });
                }
            }
        });
    }

    // Lọc Deadline: BỎ QUA các VLE đã được nhặt sang Bảng TKB ở hàm trên
    let filteredGlobalDeadlines = (globalDeadlineData || []).filter(d => {
        if ((d.tag || '').toUpperCase().includes('VLE')) {
            let dTitle = d.title || "";
            let dClassId = "";
            let prefixMatch = dTitle.match(/^([A-Za-z0-9]{6,15})\s*[-_:]*\s+(.*)/);
            if (prefixMatch && /\d/.test(prefixMatch[1])) {
                dClassId = prefixMatch[1];
                dTitle = prefixMatch[2];
            }
            let dBaseName = getBaseSubjectName(dTitle);
            
            // Nếu khớp mã hoặc tên -> Nó sẽ thuộc bảng TKB -> Ẩn nó ở bảng Deadline
            if (tkbSubjectNames.has(dBaseName) || (dClassId && tkbClassIds.has(dClassId.toUpperCase()))) {
                return false; 
            }
        }
        return true;
    });

    let combinedDeadlineData = [...filteredGlobalDeadlines, ...virtualVLEs];
    let filteredDeadlines = combinedDeadlineData.filter(d => {
        if (!startMonTime || !endSunTime) return true;
        let sDate = parseDateString(d.dateStart); let dStartTime = sDate ? sDate.getTime() : null;
        let eDate = parseDateString(d.dateEnd); let dEndTime = eDate ? eDate.getTime() : null;
        if (!dStartTime && !dEndTime) return true;
        if (dStartTime && dEndTime) return dStartTime <= endSunTime && dEndTime >= startMonTime;
        if (dStartTime) return dStartTime <= endSunTime;
        if (dEndTime) return dEndTime >= startMonTime;
        return true;
    });

    if (filteredDeadlines.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 40px; color: #6b7280;">Không có deadline nào trong ${selectedHK || 'khoảng thời gian này'}.</td></tr>`;
        document.getElementById('modalBangTongHopDeadline').style.display = 'flex'; return;
    }

    filteredDeadlines.sort((a, b) => {
        let sA = parseDateString(a.dateStart); let startA = sA ? sA.getTime() : 0;
        let sB = parseDateString(b.dateStart); let startB = sB ? sB.getTime() : 0;
        return startA - startB;
    });

    let html = '';
    filteredDeadlines.forEach(c => {
        let extLinkTitle = checkAndExtractUrl(c.title || "");
        let extLinkTag = checkAndExtractUrl(c.tag || "");
        let extLink = extLinkTitle || extLinkTag;
        
        let displayTitle = c.title || "";
        let displayTag = c.tag || "Khác";
        if (extLinkTitle) displayTitle = displayTitle.replace(extLinkTitle, '').trim();
        if (extLinkTag) displayTag = displayTag.replace(extLinkTag, '').trim();
        if (displayTag === "") displayTag = "Truy cập";

        let tagHtml = extLink ? `<a href="${extLink}" target="_blank" style="color: #2563eb; font-weight: 600; text-decoration: none;">${displayTag} <i class="fa-solid fa-arrow-up-right-from-square ms-1" style="font-size: 11px;"></i></a>` : `<span style="font-weight: 600; color: #374151;">${displayTag}</span>`;
        let badgeType = c.isVirtualVLE ? `<span style="background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold;">HỆ THỐNG VLE</span>` : `<span style="background: #fee2e2; color: #be123c; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold;">DEADLINE</span>`;

        html += `<tr style="border-bottom: 1px solid #e5e7eb;">
            <td>${badgeType}</td>
            <td style="text-align: left; font-weight: 700; color: #1f2937;">${displayTitle}</td>
            <td style="color: #dc2626; font-weight: bold;">${c.duration || '-'}</td>
            <td>${tagHtml}</td>
        </tr>`;
    });
    tbody.innerHTML = html;
    document.getElementById('modalBangTongHopDeadline').style.display = 'flex';
}

function closeBangTongHop(event) { if (event && event.target !== document.getElementById('modalBangTongHop')) return; document.getElementById('modalBangTongHop').style.display = 'none'; }
function closeBangTongHopDeadline(event) { if (event && event.target !== document.getElementById('modalBangTongHopDeadline')) return; document.getElementById('modalBangTongHopDeadline').style.display = 'none'; }