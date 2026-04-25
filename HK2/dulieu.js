// ==========================================
// CẤU HÌNH TẠI ĐÂY
// ==========================================
const START_DATE_WEEK_1 = new Date("2026-01-19"); // Ngày Thứ 2 của Tuần 1

const GAPS = [
    { afterWeek: 3, gap: 3 } 
];
// ==========================================

function renderAll() {
    // 1. Tính toán ngày
    let totalDaysOffset = (CURRENT_WEEK - 1) * 7;
    let totalGapWeeks = 0;
    GAPS.forEach(item => { if (CURRENT_WEEK > item.afterWeek) totalGapWeeks += item.gap; });
    totalDaysOffset += (totalGapWeeks * 7);

    const mondayDate = new Date(START_DATE_WEEK_1);
    mondayDate.setDate(mondayDate.getDate() + totalDaysOffset);
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(sundayDate.getDate() + 6);

    const formatFull = (date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    const formatShortYear = (date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
    const formatShort = (date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

    document.title = `TKB (${formatShortYear(mondayDate)}-${formatShortYear(sundayDate)})`; 
    document.getElementById('week-title').innerText = "Tuần " + CURRENT_WEEK;
    document.querySelector('.subtitle').innerText = `(Áp dụng từ ngày ${formatFull(mondayDate)} đến ${formatFull(sundayDate)})`;

    // 2. Cập nhật ngày vào Header
    document.querySelectorAll('#header-row th[data-thu]').forEach(th => {
        const thu = parseInt(th.getAttribute('data-thu'));
        const currentDay = new Date(mondayDate);
        currentDay.setDate(mondayDate.getDate() + (thu - 2)); 
        th.innerHTML = `Thứ ${thu} <span style="font-size: 13px; font-weight: 400; margin-left: 4px; opacity: 0.9;">(${formatShort(currentDay)})</span>`;
    });

    // 3. Vẽ bảng TKB (CHỖ QUAN TRỌNG NHẤT)
    const tbody = document.getElementById('tkb-body');
    const occupied = Array.from({ length: 18 }, () => Array(8).fill(false));
    let tableHtml = "";

    for (let tiet = 1; tiet <= 16; tiet++) {
        tableHtml += `<tr>`;
        if (tiet === 1) tableHtml += `<td rowspan="6" class="session-label">Sáng</td>`;
        if (tiet === 7) tableHtml += `<td rowspan="6" class="session-label">Chiều</td>`;
        if (tiet === 13) tableHtml += `<td rowspan="4" class="session-label">Tối</td>`;
        tableHtml += `<td class="col-tiet">${tiet}</td>`;

        for (let thu = 2; thu <= 7; thu++) {
            if (occupied[tiet][thu]) continue;

            const course = typeof DATA_COURSES !== 'undefined' ? DATA_COURSES.find(c => c.day === thu && c.start === tiet && c.weeks.includes(CURRENT_WEEK)) : null;
            
            if (course) {
                // --- LOGIC TỰ ĐỘNG CẬP NHẬT MÀU SẮC ---
                let autoColor = course.color;
                const loc = course.location.toUpperCase();
                if (loc.includes("AN DƯƠNG VƯƠNG") || loc.includes("ADV")) autoColor = "#e0f2fe";
                else if (loc.includes("LÊ VĂN SỸ") || loc.includes("LVS")) autoColor = "#e6f9ef";
                else if (loc.includes("LẠC LONG QUÂN") || loc.includes("LLQ")) autoColor = "#fff3e0";
                else if (loc.includes("LÊ THỊ RIÊNG") || loc.includes("CVLTR")) autoColor = "#fef9c3";
                else if (loc.includes("ONLINE") || loc.includes("HỌP")) autoColor = "#f3e8ff";

                for (let i = 0; i < course.length; i++) { if (tiet + i <= 16) occupied[tiet + i][thu] = true; }
                
                tableHtml += `
                <td rowspan="${course.length}" class="td-subject" style="background:${autoColor}">
                    <div class="subject" style="background:transparent;">
                        <div class="time">${course.time}</div>
                        <div style="font-weight:600;">
                            <a href="${course.link}" target="_blank" style="color:#2563eb; text-decoration:none;">${course.location}</a>
                        </div>
                        ${course.name}<br>
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

    // 4. Vẽ Deadline
    const deadlineContainer = document.getElementById('deadline-container');
    if (typeof DATA_DEADLINES !== 'undefined') {
        const filteredDeadlines = DATA_DEADLINES.filter(d => d.weeks.includes(CURRENT_WEEK));
        let deadlineHtml = "";
        filteredDeadlines.forEach(item => {
            deadlineHtml += `<div class="online-card"><div class="icon-circle ${item.icon}">${item.emoji}</div><h3>${item.duration}</h3><p class="desc">${item.title}</p><span class="tag">${item.tag}</span></div>`;
        });
        deadlineContainer.innerHTML = deadlineHtml || "<p style='text-align:center; width:100%; color:#666;'>Tuần này không có deadline nào.</p>";
    }
}

window.onload = renderAll;
