// dulieu.js - Phiên bản tối ưu: Tự động Link & Màu sắc
// ==========================================
// CẤU HÌNH TẠI ĐÂY
// ==========================================
const START_DATE_WEEK_1 = new Date("2025-09-08"); 
const GAPS = [{ afterWeek: 17, gap: 1 }];

// --- HÀM BỔ TRỢ: TỰ ĐỘNG LẤY LINK THEO TỪ KHÓA ---
function getAutoLink(locationName, manualLink) {
    if (!locationName) return "#";
    const loc = locationName.toUpperCase();
    
    // Nếu đã có link thủ công hợp lệ thì ưu tiên dùng link đó
    if (manualLink && manualLink !== "#" && manualLink !== "" && manualLink !== "Đang cập nhật") {
        return manualLink;
    }

    // Tra cứu link theo từ khóa địa điểm
    if (loc.includes("AN DƯƠNG VƯƠNG") || loc.includes("ADV")) return "https://maps.app.goo.gl/Q8dRKtTZcqGeuEmy5";
    if (loc.includes("LÊ VĂN SỸ") || loc.includes("LVS")) return "https://maps.app.goo.gl/7zCgiMmscdPFfCFv5";
    if (loc.includes("LẠC LONG QUÂN") || loc.includes("LLQ")) return "https://maps.app.goo.gl/oV1mXHYDuW44cGbN6";
    if (loc.includes("LÊ THỊ RIÊNG") || loc.includes("CVLTR")) return "https://maps.app.goo.gl/K7GzwaEcJwSb9dwGA";
    if (loc.includes("ONLINE") || loc.includes("HỌP")) return "#";
    
    return "#";
}

function renderAll() {
    // 1. Tính toán ngày tháng
    let totalDaysOffset = (CURRENT_WEEK - 1) * 7;
    let totalGapWeeks = 0;
    GAPS.forEach(item => { if (CURRENT_WEEK > item.afterWeek) totalGapWeeks += item.gap; });
    totalDaysOffset += (totalGapWeeks * 7);

    const mondayDate = new Date(START_DATE_WEEK_1);
    mondayDate.setDate(mondayDate.getDate() + totalDaysOffset);
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(sundayDate.getDate() + 6);

    const formatFull = (date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    const formatShort = (date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

    document.getElementById('week-title').innerText = "Tuần " + CURRENT_WEEK;
    document.querySelector('.subtitle').innerText = `(Áp dụng từ ngày ${formatFull(mondayDate)} đến ${formatFull(sundayDate)})`;

    // 2. Cập nhật ngày vào Header
    document.querySelectorAll('#header-row th[data-thu]').forEach(th => {
        const thu = parseInt(th.getAttribute('data-thu'));
        const currentDay = new Date(mondayDate);
        currentDay.setDate(mondayDate.getDate() + (thu - 2)); 
        th.innerHTML = `Thứ ${thu} <span style="font-size: 13px; font-weight: 400; margin-left: 4px; opacity: 0.9;">(${formatShort(currentDay)})</span>`;
    });

    // 3. Vẽ bảng TKB
    const tbody = document.getElementById('tkb-body');
    if (!tbody) return;

    const isExam = (typeof IS_EXAM_PAGE !== 'undefined' && IS_EXAM_PAGE === true);
    const totalRows = isExam ? 4 : 16;
    const occupied = Array.from({ length: 25 }, () => Array(8).fill(false));
    let tableHtml = "";

    for (let i = 1; i <= totalRows; i++) {
        tableHtml += `<tr>`;
        if (isExam) {
            if (i === 1) tableHtml += `<td rowspan="2" class="session-label">Sáng</td>`;
            if (i === 3) tableHtml += `<td rowspan="2" class="session-label">Chiều</td>`;
        } else {
            if (i === 1) tableHtml += `<td rowspan="6" class="session-label">Sáng</td>`;
            if (i === 7) tableHtml += `<td rowspan="6" class="session-label">Chiều</td>`;
            if (i === 13) tableHtml += `<td rowspan="4" class="session-label">Tối</td>`;
        }
        tableHtml += `<td class="col-tiet">${i}</td>`;

        for (let thu = 2; thu <= 7; thu++) {
            if (occupied[i][thu]) continue;
            const course = DATA_COURSES.find(c => c.day === thu && c.start === i && c.weeks.includes(CURRENT_WEEK));
            
            if (course) {
                const len = course.length || 1;
                for (let r = 0; r < len; r++) { if (i + r <= 20) occupied[i + r][thu] = true; }

                // --- TỰ ĐỘNG XỬ LÝ MÀU & LINK ---
               // --- TỰ ĐỘNG XỬ LÝ MÀU & LINK ---
let autoColor = course.color;
const locU = (course.location || "").toUpperCase();

// Xác định màu sắc dựa trên location
if (locU.includes("AN DƯƠNG VƯƠNG") || locU.includes("ADV")) autoColor = "#e0f2fe";
else if (locU.includes("LÊ VĂN SỸ") || locU.includes("LVS")) autoColor = "#e6f9ef";
else if (locU.includes("LẠC LONG QUÂN") || locU.includes("LLQ")) autoColor = "#fff3e0";
else if (locU.includes("LÊ THỊ RIÊNG") || locU.includes("CVLTR")) autoColor = "#fef9c3";
else if (locU.includes("ONLINE") || locU.includes("HỌP")) autoColor = "#f3e8ff";

// Xử lý hiển thị địa điểm/link
let locationHtml = "";
if (course.subLocations && Array.isArray(course.subLocations)) {
    // Nếu có nhiều địa điểm (như môn Giải tích vectơ tuần 9)
    locationHtml = course.subLocations.map(loc => 
        `<div style="margin-bottom: 4px;">
            <a href="${loc.link}" target="_blank" style="color:#2563eb; text-decoration:none; font-weight:600;">📍 ${loc.label}</a>
        </div>`
    ).join('');
} else {
    // Hiển thị 1 địa điểm như bình thường
    const finalLink = getAutoLink(course.location, course.link);
    locationHtml = `
        <div style="font-weight:600; margin-bottom: 4px;">
            <a href="${finalLink}" target="_blank" style="color:#2563eb; text-decoration:none;">${course.location}</a>
        </div>`;
}

tableHtml += `
<td rowspan="${len}" class="td-subject" style="background:${autoColor || '#fff'}">
    <div class="subject">
        <div class="time">${course.time}</div>
        ${locationHtml}
        <div style="${isExam ? 'font-weight:700;' : ''}">${course.name}</div>
        <span class="room">Phòng: ${course.room}</span><br>
        ${!isExam ? `<span class="teacher">GV: ${course.teacher || 'N/A'}</span>` : ''}
    </div>
</td>`;
            } else { tableHtml += `<td></td>`; }
        }
        tableHtml += `</tr>`;
    }
    tbody.innerHTML = tableHtml;

    // 4. Vẽ Deadline & Ghi chú
    renderDeadlines();
    renderLocationNotes();
}

function renderDeadlines() {
    const container = document.getElementById('deadline-container');
    if (!container || typeof DATA_DEADLINES === 'undefined') return;
    const filtered = DATA_DEADLINES.filter(d => d.weeks.includes(CURRENT_WEEK));
    container.innerHTML = filtered.map(item => `
        <div class="online-card">
            <div class="icon-circle ${item.icon}">${item.emoji}</div>
            <h3>${item.duration}</h3>
            <p class="desc">${item.title}</p>
            <span class="tag">${item.tag}</span>
        </div>`).join('') || "<p style='text-align:center; width:100%; color:#666;'>Tuần này không có deadline.</p>";
}

function renderLocationNotes() {
    const noteList = document.getElementById('location-notes');
    if (!noteList || typeof DATA_LOCATIONS === 'undefined') return;
    noteList.innerHTML = DATA_LOCATIONS.map(loc => `
        <li>
            <span class="square" style="background:${loc.color};"></span>
            ${loc.link !== "#" ? `<a href="${loc.link}" target="_blank">${loc.name}</a>` : loc.name}
        </li>`).join('');
}

window.onload = renderAll;
