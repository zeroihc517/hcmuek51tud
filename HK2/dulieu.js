// dulieu.js
const START_DATE_WEEK_1 = new Date("2026-01-19");
const GAPS = [{ afterWeek: 3, gap: 3 }];

// Hàm bổ trợ để lấy link tự động dựa trên tên địa điểm
function getAutoLink(locationName, manualLink) {
    if (!locationName) return "#";
    const loc = locationName.toUpperCase();
    
    // Nếu có link thủ công (khác # và không trống) thì ưu tiên dùng link thủ công
    if (manualLink && manualLink !== "#" && manualLink !== "") return manualLink;

    // Nếu không có link thủ công, tra cứu theo từ khóa
    if (loc.includes("AN DƯƠNG VƯƠNG") || loc.includes("ADV")) return "https://maps.app.goo.gl/Q8dRKtTZcqGeuEmy5";
    if (loc.includes("LÊ VĂN SỸ") || loc.includes("LVS")) return "https://maps.app.goo.gl/7zCgiMmscdPFfCFv5";
    if (loc.includes("LẠC LONG QUÂN") || loc.includes("LLQ")) return "https://maps.app.goo.gl/oV1mXHYDuW44cGbN6";
    if (loc.includes("LÊ THỊ RIÊNG") || loc.includes("CVLTR")) return "https://maps.app.goo.gl/K7GzwaEcJwSb9dwGA";
    if (loc.includes("ONLINE") || loc.includes("HỌP")) return "#";
    
    return manualLink || "#";
}

function renderAll() {
    // --- 1. Tính toán ngày tháng ---
    let totalDaysOffset = (CURRENT_WEEK - 1) * 7;
    let totalGapWeeks = 0;
    GAPS.forEach(item => { if (CURRENT_WEEK > item.afterWeek) totalGapWeeks += item.gap; });
    totalDaysOffset += (totalGapWeeks * 7);

    const mondayDate = new Date(START_DATE_WEEK_1);
    mondayDate.setDate(mondayDate.getDate() + totalDaysOffset);
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(sundayDate.getDate() + 6);

    const formatFull = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const formatShort = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

    document.getElementById('week-title').innerText = "Tuần " + CURRENT_WEEK;
    document.querySelector('.subtitle').innerText = `(Áp dụng từ ngày ${formatFull(mondayDate)} đến ${formatFull(sundayDate)})`;

    // --- 2. Cập nhật Header ngày tháng ---
    document.querySelectorAll('#header-row th[data-thu]').forEach(th => {
        const thu = parseInt(th.getAttribute('data-thu'));
        const currentDay = new Date(mondayDate);
        currentDay.setDate(mondayDate.getDate() + (thu - 2)); 
        th.innerHTML = `Thứ ${thu} <span style="font-size: 13px; font-weight: 400; margin-left: 4px; opacity: 0.9;">(${formatShort(currentDay)})</span>`;
    });

    // --- 3. Vẽ bảng TKB ---
    const tbody = document.getElementById('tkb-body');
    const occupied = Array.from({ length: 20 }, () => Array(8).fill(false));
    let tableHtml = "";

    for (let i = 1; i <= 16; i++) {
        tableHtml += `<tr>`;
        if (i === 1) tableHtml += `<td rowspan="6" class="session-label">Sáng</td>`;
        if (i === 7) tableHtml += `<td rowspan="6" class="session-label">Chiều</td>`;
        if (i === 13) tableHtml += `<td rowspan="4" class="session-label">Tối</td>`;
        tableHtml += `<td class="col-tiet">${i}</td>`;

        for (let thu = 2; thu <= 7; thu++) {
            if (occupied[i][thu]) continue;
            const course = DATA_COURSES.find(c => c.day === thu && c.start === i && c.weeks.includes(CURRENT_WEEK));
            
            if (course) {
                const len = course.length || 1;
                for (let r = 0; r < len; r++) { if (i + r <= 16) occupied[i + r][thu] = true; }

                // TỰ ĐỘNG LẤY LINK VÀ MÀU
                const finalLink = getAutoLink(course.location, course.link);
                let autoColor = course.color;
                const locU = course.location.toUpperCase();
                if (locU.includes("AN DƯƠNG VƯƠNG") || locU.includes("ADV")) autoColor = "#e0f2fe";
                else if (locU.includes("LÊ VĂN SỸ") || locU.includes("LVS")) autoColor = "#e6f9ef";
                else if (locU.includes("LẠC LONG QUÂN") || locU.includes("LLQ")) autoColor = "#fff3e0";
                else if (locU.includes("LÊ THỊ RIÊNG") || locU.includes("CVLTR")) autoColor = "#fef9c3";
                else if (locU.includes("ONLINE") || locU.includes("HỌP")) autoColor = "#f3e8ff";

                tableHtml += `
                <td rowspan="${len}" class="td-subject" style="background:${autoColor || '#fff'}">
                    <div class="subject">
                        <div class="time">${course.time}</div>
                        <div style="font-weight:600;">
                            <a href="${finalLink}" target="_blank" style="color:#2563eb; text-decoration:none;">${course.location}</a>
                        </div>
                        <div style="margin: 4px 0;">${course.name}</div>
                        <span class="room">Phòng: ${course.room}</span><br>
                        <span class="teacher">GV: ${course.teacher || 'N/A'}</span>
                    </div>
                </td>`;
            } else {
                tableHtml += `<td></td>`;
            }
        }
        tableHtml += `</tr>`;
    }
    tbody.innerHTML = tableHtml;

    // --- 4. Vẽ Deadline ---
    const deadlineContainer = document.getElementById('deadline-container');
    const filteredDeadlines = DATA_DEADLINES.filter(d => d.weeks.includes(CURRENT_WEEK));
    let deadlineHtml = "";
    filteredDeadlines.forEach(item => {
        deadlineHtml += `<div class="online-card"><div class="icon-circle ${item.icon}">${item.emoji}</div><h3>${item.duration}</h3><p class="desc">${item.title}</p><span class="tag">${item.tag}</span></div>`;
    });
    deadlineContainer.innerHTML = deadlineHtml || "<p>Tuần này không có deadline.</p>";

    // --- 5. Vẽ Ghi chú địa điểm ---
    const noteContainer = document.getElementById('location-notes');
    if (noteContainer) {
        let noteHtml = "";
        DATA_LOCATIONS.forEach(loc => {
            noteHtml += `<li><span class="square" style="background:${loc.color};"></span><a href="${loc.link}" target="_blank">${loc.name}</a></li>`;
        });
        noteContainer.innerHTML = noteHtml;
    }
}

window.onload = renderAll;
