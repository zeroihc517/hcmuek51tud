function loadTKBView() {
	document.title = "Thời gian biểu | Học nhóm Năm 2 Khoa Toán";
    resetNavActive(); $('#btnNavTKB').addClass('active'); $('#tkbSection').removeClass('d-none');
    if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); }
    loadThoiGianBieu(); loadDeadlines();
}

function loadThoiGianBieu() {
    $('.tkb-personal-toolbar').remove();
    if (!currentUser) {
        $('#tkb-body').html(`<tr><td colspan="9" style="text-align: center; padding: 60px; color: #6b7280;"><i class="fa-solid fa-lock fs-1 mb-3 text-secondary"></i><br><h6 class="fw-bold">Bạn chưa đăng nhập</h6><p class="mb-3">Vui lòng đăng nhập để xem và tự điều chỉnh lịch học thời gian biểu cá nhân.</p><button class="btn btn-primary fw-bold px-4" onclick="openAddTkbModal(true)">Đăng nhập / Đăng ký</button></td></tr>`);
        $('#deadlineBox').addClass('d-none'); return;
    }

    $('#tkb-body').html('<tr><td colspan="9" style="text-align: center; padding: 60px; color: #6b7280;"><i class="fa-solid fa-spinner fa-spin fs-3 mb-3"></i><br>Đang tải TKB của '+ currentUser.name +'...</td></tr>');
    
    $.ajax({
        url: SCRIPT_URL + "?action=getTKBUser&mssv=" + currentUser.mssv + "&_=" + new Date().getTime(), 
        method: "GET", dataType: "json", cache: false,
        success: function(data) { processTKBData(data); renderTkbToolBar(); },
        error: function() { $('#tkb-body').html('<tr><td colspan="9" class="text-danger text-center">Lỗi khi tải dữ liệu TKB!</td></tr>'); }
    });
}

function loadDeadlines() {
    $('#deadlineBox').removeClass('d-none');
    $('#deadline-container').html('<div class="w-100 text-center text-muted" style="grid-column: 1/-1"><i class="fa-solid fa-spinner fa-spin me-2"></i> Đang tải dữ liệu Deadline...</div>');

    $.ajax({
        url: SCRIPT_URL + "?action=getDeadlinesUser&mssv=" + currentUser.mssv + "&_=" + new Date().getTime(),
        method: "GET", dataType: "json", cache: false,
        success: function(data) {
            globalDeadlineData = data.map(r => {
                let rIndex = r[8];
                let actualRowIndex = -1;
                let isSystemFlag = false;

                if (typeof rIndex === 'string' && rIndex.startsWith('SYS_')) {
                    isSystemFlag = true;
                    actualRowIndex = rIndex; 
                } else {
                    actualRowIndex = parseInt(rIndex) || -1;
                }

                return {
                    title: r[1], duration: r[2], tag: r[3], icon: r[4], emoji: r[5],
                    dateStart: r[6] || "", dateEnd: r[7] || "", 
                    sheetRowIndex: actualRowIndex, isSystem: isSystemFlag
                };
            });
            renderDeadlines(); 
        },
        error: function() {
            $('#deadline-container').html('<div class="w-100 text-center text-danger" style="grid-column: 1/-1">Lỗi khi tải Deadline!</div>');
        }
    });
}

function renderDeadlines() {
    const container = document.getElementById('deadline-container');
    if (!container) return;
    
    let weekStart = new Date(currentSelectedMonday); weekStart.setHours(0,0,0,0);
    let weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999);

    let filtered = globalDeadlineData.filter(d => {
        let sDate = parseDateString(d.dateStart); 
        let eDate = parseDateString(d.dateEnd);
        if(!sDate || !eDate) return true; 
        return sDate <= weekEnd && eDate >= weekStart;
    });

    if(filtered.length === 0) {
        container.innerHTML = "<div style='grid-column: 1 / -1; text-align:center; padding: 20px 0; color:#6b7280; font-weight:500;'><i class='fa-solid fa-mug-hot me-2'></i>Tuần này không có Deadline. Bạn có thể thư giãn!</div>"; 
        return;
    }

    container.innerHTML = filtered.map(item => {
        let actionButtons = item.isSystem ? '' : `
            <div class="deadline-actions">
                <button class="btn-dl-act text-warning shadow-sm" onclick="openEditDeadlineModal('${item.sheetRowIndex}')" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-dl-act text-danger shadow-sm" onclick="deletePersonalDeadline('${item.sheetRowIndex}')" title="Xóa"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        
        return `
            <div class="online-card">
                ${actionButtons}
                <div class="icon-circle ${item.icon}">${item.emoji || '📌'}</div>
                <h3 class="text-danger mb-2" style="font-size: 15px; font-weight: 800;">${item.duration}</h3>
                <p class="desc text-dark mb-3" style="font-size: 16px; font-weight: 600;">${item.title}</p>
                <span class="tag">${item.tag}</span>
            </div>
        `;
    }).join('');
}

function openAddDeadlineModal() {
    $('#dlModalTitle').html('<i class="fa-solid fa-plus me-2"></i>Thêm Deadline');
    $('#pDlRowIndex').val(''); $('#pDlTitle, #pDlTag, #pDlEmoji, #pDlStartDate, #pDlEndDate').val(''); $('#pDlIcon').val('fire');
    $('#deadlinePersonalModal').modal('show');
}

function openEditDeadlineModal(rowIndex) {
    let dl = globalDeadlineData.find(d => String(d.sheetRowIndex) === String(rowIndex)); if(!dl) return;
    $('#dlModalTitle').html('<i class="fa-solid fa-pen me-2"></i>Sửa Deadline');
    $('#pDlRowIndex').val(rowIndex); $('#pDlTitle').val(dl.title); $('#pDlTag').val(dl.tag);
    $('#pDlIcon').val(dl.icon); $('#pDlEmoji').val(dl.emoji); $('#pDlStartDate').val(dl.dateStart); $('#pDlEndDate').val(dl.dateEnd);
    $('#deadlinePersonalModal').modal('show');
}

function savePersonalDeadline() {
    let rowIndex = $('#pDlRowIndex').val(); let startDate = $('#pDlStartDate').val().trim(); let endDate = $('#pDlEndDate').val().trim();
    if(!$('#pDlTitle').val() || !startDate || !endDate) { alert("Vui lòng nhập Tên công việc và Ngày bắt đầu/Kết thúc!"); return; }
    let autoDuration = "Từ " + startDate + " đến " + endDate;
    // Tìm đoạn cấu hình payload trong hàm executeSavePersonalTkb():
let payload = {
    action: "editTKBUser",
    rowIndex: pendingEventAction.rowIndex,
    mssv: currentUser.mssv,
    thu: $('#editTkbThu').val(),
    tietBd: parseInt($('#editTkbTietBd').val()),
    soTiet: parseInt($('#editTkbSoTiet').val()),
    thoiGian: $('#editTkbThoiGian').val(),
    hinhThuc: $('#editTkbHinhThuc').val(),
    mon: $('#editTkbMon').val(),
    phong: $('#editTkbPhong').val(),
    gv: $('#editTkbGv').val(),
    color: $('#editTkbColor').val(),
    ngayBatDau: $('#editTkbNgayBatDau').val(),
    ngayKetThuc: $('#editTkbNgayKetThuc').val(),
    ngayNgoaiLe: $('#editTkbNgayNgoaiLe').val(),
    editScope: pendingEventAction.scope,
    // ĐẢM BẢO DÒNG NÀY: Truyền chuẩn chuỗi ngày của sự kiện được click
    targetDate: pendingEventAction.targetDate 
};
    let btn = $('#btnSaveDeadline'); btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...').prop('disabled', true);
    postToGAS(payload, function(res) { alert(res); $('#deadlinePersonalModal').modal('hide'); btn.html('Lưu Deadline').prop('disabled', false); loadDeadlines(); }, function() { alert("Giao tiếp máy chủ thất bại!"); btn.html('Lưu Deadline').prop('disabled', false); });
}

function deletePersonalDeadline(sheetRowIndex) {
    if(!confirm("Bạn có chắc chắn muốn xóa deadline cá nhân này không?")) return;
    postToGAS({ action: "deleteDeadlineUser", rowIndex: sheetRowIndex, mssv: currentUser.mssv }, function(res) {
        alert(res); loadDeadlines();
    }, function() { alert("Lỗi khi kết nối yêu cầu xóa bỏ deadline!"); });
}

function renderTkbToolBar() {
    $('.tkb-personal-toolbar').remove(); 
    let toolbarHtml = `
        <div class="tkb-personal-toolbar d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 p-3 bg-white rounded border shadow-sm">
            <div>
                <span class="badge bg-primary fs-6 me-2"><i class="fa-solid fa-user"></i> ${currentUser.name} (${currentUser.mssv})</span>
                <button class="btn btn-sm btn-outline-secondary font-weight-bold" onclick="openChangePasswordModal()"><i class="fa-solid fa-key text-warning"></i> Đổi mật khẩu</button>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-sm text-white fw-bold" style="background-color: #0f4c81;" onclick="openSystemTkbModal()"><i class="fa-solid fa-cloud-arrow-down"></i> Đồng bộ học phần</button>
                <button class="btn btn-sm text-white fw-bold" style="background-color: #0f4c81;" onclick="openManageTkbListModal()"><i class="fa-solid fa-list-check text-info"></i> Tổng hợp TKB</button>
                <button class="btn btn-sm text-white fw-bold" style="background-color: #0f4c81;" onclick="openAddTkbModal(false)"><i class="fa-solid fa-plus"></i> Thêm lịch mới</button>
                <button class="btn btn-sm btn-outline-danger fw-bold" onclick="logoutStudent()"><i class="fa-solid fa-right-from-bracket"></i> Đăng xuất</button>
            </div>
        </div>`;
    $('.table-box').before(toolbarHtml);
}

function getBaseSubjectName(name) {
    if (!name) return "KHÁC";
    let base = name.toLowerCase()
        .replace(/\(.*?\)/g, "") 
        .replace(/(tiểu luận kết thúc học phần|tiểu luận|kiểm tra quá trình|kiểm tra giữa học phần|kiểm tra kết thúc học phần|kiểm tra|học bù|tự học)/g, "")
        .replace(/^[\s-:]+/, '').replace(/[\s-:]+$/, '').replace(/\s+/g, ' ').trim();
    if (base.endsWith("vecto")) { base = base.slice(0, -5) + "vector"; }
    return base.toUpperCase() || "KHÁC";
}

function getNoteFromSubject(c) {
    let monLower = (c.mon || "").toLowerCase(); let phongLower = (c.phong || "").toLowerCase(); let hinhThucLower = (c.hinhThuc || "").toLowerCase();
    let dateMatch = (c.mon || "").match(/\d{1,2}\/\d{1,2}/);
    let dateStr = dateMatch ? ` <br><small class="text-muted">(${dateMatch[0]})</small>` : '';
    if (phongLower.includes('tự học') || hinhThucLower.includes('tự học')) return `<span class="fw-bold" style="color: #9333ea;">Tự học${dateStr}</span>`;
    if (monLower.includes('kiểm tra kết thúc học phần')) return `<span class="fw-bold" style="color: #dc2626;">Kiểm tra Kết thúc học phần${dateStr}</span>`;
    if (monLower.includes('kiểm tra giữa học phần')) return `<span class="fw-bold" style="color: #dc2626;">Kiểm tra Giữa học phần${dateStr}</span>`;
    if (monLower.includes('kiểm tra quá trình')) return `<span class="fw-bold" style="color: #dc2626;">Kiểm tra Quá Trình${dateStr}</span>`;
    if (monLower.includes('kiểm tra')) return `<span class="fw-bold" style="color: #dc2626;">Kiểm tra${dateStr}</span>`;
    if (monLower.includes('bù')) return `<span class="fw-bold" style="color: #d97706;">Học bù${dateStr}</span>`;
    if (monLower.includes('thực hành')) return `<span class="fw-bold" style="color: #16a34a;">Thực hành${dateStr}</span>`;
    if (monLower.includes('bài tập')) return `<span class="fw-bold" style="color: #2563eb;">Bài tập${dateStr}</span>`;
    return '<span class="text-muted small">Chính khóa</span>';
}

function openManageTkbListModal() {
    let html = ''; let selectedNH = $('#namHocSelect').val(); let selectedHK = $('#hocKySelect').val();
    let filteredTkbData = globalTkbData; let titleSuffix = '';
    let startMonTime = null; let endSunTime = null;
    const getTimeFast = (dateStr) => { let d = parseDateString(dateStr); return d ? d.getTime() : null; };

    if (selectedNH && selectedHK) {
        let config = globalConfigHK.find(item => item[0] === selectedNH && item[1] === selectedHK);
        if (config) {
            let sDate = parseDateString(config[2]); let numAcademicWeeks = parseInt(config[3]); let breakWeeks = (config[4] || "").split(',').map(w => parseInt(w.trim())).filter(w => !isNaN(w));
            if (sDate && numAcademicWeeks) {
                let startMon = getMondayOfDate(sDate); startMonTime = startMon.getTime();
                let acadWk = 1; let calWk = 1;
                while (acadWk <= numAcademicWeeks && calWk <= 52) { if (!breakWeeks.includes(calWk)) { acadWk++; } calWk++; }
                let endSun = new Date(startMon); endSun.setDate(endSun.getDate() + ((calWk - 1) * 7) - 1); endSun.setHours(23, 59, 59, 999); endSunTime = endSun.getTime();
                filteredTkbData = globalTkbData.filter(c => {
                    let cStartTime = getTimeFast(c.ngayBatDau); let cEndTime = getTimeFast(c.ngayKetThuc);
                    if (!cStartTime && !cEndTime) return true; 
                    if (cStartTime && cEndTime) return cStartTime <= endSunTime && cEndTime >= startMonTime;
                    if (cStartTime) return cStartTime <= endSunTime;
                    if (cEndTime) return cEndTime >= startMonTime;
                    return true;
                });
                titleSuffix = ` - ${selectedHK} (${selectedNH})`;
            }
        }
    }

    $('#manageTkbListModal .modal-title').html(`<i class="fa-solid fa-list-check me-2"></i>Bảng danh sách Lịch học & Deadline${titleSuffix}`);

    let pseudoDeadlines = [];
    if (globalDeadlineData && globalDeadlineData.length > 0) {
        let filteredDeadlines = globalDeadlineData.filter(d => {
            let searchStr = ((d.tag || "") + " " + (d.title || "")).toLowerCase();
            if (!(searchStr.includes('vle') || searchStr.includes('tiểu luận'))) return false;
            if (startMonTime && endSunTime) {
                let dStartTime = getTimeFast(d.dateStart); let dEndTime = getTimeFast(d.dateEnd);
                if (!dStartTime && !dEndTime) return true;
                if (dStartTime && dEndTime) return dStartTime <= endSunTime && dEndTime >= startMonTime;
                if (dStartTime) return dStartTime <= endSunTime;
                if (dEndTime) return dEndTime >= startMonTime;
                return true;
            } return true;
        });
        pseudoDeadlines = filteredDeadlines.map(d => ({ isDeadline: true, mon: d.title, hinhThuc: d.tag || "VLE", ngayBatDau: d.dateStart, ngayKetThuc: d.dateEnd, sheetRowIndex: d.sheetRowIndex, thu: "-", tietBd: "-", soTiet: "-", thoiGian: "-", phong: "-", gv: "-" }));
    }

    let combinedData = [...filteredTkbData, ...pseudoDeadlines];

    if (combinedData.length === 0) {
        let emptyMsg = (selectedNH && selectedHK) ? `Không có môn học/deadline nào trong ${selectedHK} năm học ${selectedNH}!` : "Chưa có môn học lịch trình cá nhân nào được tạo!";
        html += `<tr><td colspan="9" class="text-center text-muted py-4 bg-white">${emptyMsg}</td></tr>`;
    } else {
        let groupedData = {};
        combinedData.forEach(c => { let baseName = getBaseSubjectName(c.mon); if (!groupedData[baseName]) { groupedData[baseName] = []; } groupedData[baseName].push(c); });
        for (let baseName in groupedData) {
            let groupItems = groupedData[baseName]; let rowCount = groupItems.length;
            groupItems.sort((a, b) => (a.isDeadline === b.isDeadline) ? 0 : a.isDeadline ? 1 : -1);
            groupItems.forEach((c, index) => {
                let dateDisplay = '-';
                if (c.ngayBatDau && c.ngayKetThuc) { 
                    dateDisplay = (c.ngayBatDau === c.ngayKetThuc) ? c.ngayBatDau : `Từ ${c.ngayBatDau}<br>đến ${c.ngayKetThuc}`; 
                }
                else if (c.ngayBatDau) { dateDisplay = c.ngayBatDau; } 
                else if (c.ngayKetThuc) { dateDisplay = c.ngayKetThuc; }

                let rowBg = c.isDeadline ? 'background-color: #fff5f6;' : 'background-color: #fff;';
                html += `<tr style="${rowBg}">`;
                if (index === 0) { html += `<td rowspan="${rowCount}" class="fw-bold text-dark ps-3 border-start border-3 align-middle" style="border-left-color: var(--primary-color) !important; background-color: #fff;">${baseName}</td>`; }
                if (c.isDeadline) {
                    html += `<td class="text-center align-middle"><span class="badge bg-danger">DEADLINE</span><br></td><td class="text-center align-middle">-</td><td class="text-center align-middle fw-bold text-danger">${c.hinhThuc}</td><td class="text-center fw-bold text-secondary align-middle">-</td><td class="text-center align-middle" style="font-size: 13.5px;">${dateDisplay}</td><td class="text-center align-middle">-</td><td class="align-middle">-</td><td class="text-center align-middle"><button class="btn btn-sm btn-warning font-weight-bold py-1 px-2 me-1 mb-1" onclick="closeAndOpenEditDeadline(${c.sheetRowIndex})"><i class="fa-solid fa-pen"></i> Sửa</button><button class="btn btn-sm btn-danger font-weight-bold py-1 px-2 mb-1" onclick="deletePersonalDeadline(${c.sheetRowIndex})"><i class="fa-solid fa-trash"></i> Xóa</button></td>`;
                } else {
                    let thuText = c.thu === 8 ? "Chủ nhật" : "Thứ " + c.thu; let noteBadge = getNoteFromSubject(c); 
                    let rawHinhThuc = c.hinhThuc || ""; let extLink = checkAndExtractUrl(rawHinhThuc);
                    let coSoDisplay = extLink ? rawHinhThuc.replace(extLink, '').trim() : rawHinhThuc.trim();
                    if (coSoDisplay.toLowerCase().includes("tự học") || coSoDisplay === "") { coSoDisplay = ""; }
                    html += `<td class="text-center align-middle">${noteBadge}</td><td class="text-center align-middle">${thuText}</td><td class="text-center align-middle fw-bold">${coSoDisplay}</td><td class="text-center fw-bold text-danger align-middle">${c.thoiGian || '-'}</td><td class="text-center align-middle" style="font-size: 13.5px;">${dateDisplay}</td><td class="text-center align-middle">${c.phong || '-'}</td><td class="align-middle">${c.gv || '-'}</td><td class="text-center align-middle"><button class="btn btn-sm btn-warning font-weight-bold py-1 px-2 me-1 mb-1" onclick="closeAndOpenEditTkb('${c.sheetRowIndex}')"><i class="fa-solid fa-pen"></i> Sửa</button><button class="btn btn-sm btn-danger font-weight-bold py-1 px-2 mb-1" onclick="promptDeletePersonalTkb('${c.sheetRowIndex}')"><i class="fa-solid fa-trash"></i> Xóa</button></td>`;
                }
                html += `</tr>`;
            });
        }
    }
    $('#tkbManagerListBody').html(html); $('#manageTkbListModal').modal('show');
}       

function closeAndOpenEditTkb(sheetRowIndex) { $('#manageTkbListModal').modal('hide'); setTimeout(() => { openEditTkbModal(sheetRowIndex); }, 400); }

function checkAndExtractUrl(text) { 
    let urlRegex = /(https?:\/\/[^\s]+)/g; let match = text.match(urlRegex); return match ? match[0] : null; 
}

function processTKBData(data) {
    globalTkbData = data.map((row) => {
        let lastElement = row.pop(); 
        let actualRowIndex = -1;
        let isSystemFlag = false;

        if (typeof lastElement === 'string' && lastElement.startsWith('SYS_')) {
            isSystemFlag = true;
            actualRowIndex = lastElement; 
        } else {
            actualRowIndex = parseInt(lastElement) || -1;
        }

        return {
            thu: parseInt(row[0]) || 0, tietBd: parseInt(row[1]) || 0, soTiet: parseInt(row[2]) || 1,
            thoiGian: row[3] || "", hinhThuc: row[4] || "", mon: row[5] || "", phong: row[6] || "",
            gv: row[7] || "", color: row[8] || "#e0f2fe", ngayBatDau: row[9] || "", ngayKetThuc: row[10] || "",
            ngayNgoaiLe: row[11] || "", sheetRowIndex: actualRowIndex, isSystem: isSystemFlag
        };
    }).filter(c => c.thu >= 2 && c.thu <= 8 && c.tietBd >= 1);
    
    filterAndRenderTKB();
}

function openAddTkbModal(triggerAuthModal = false) {
    if (triggerAuthModal) { $('#userAuthModal').modal('show'); return; }
    $('#tkbModalTitle').html('<i class="fa-solid fa-calendar-plus me-2"></i>Thêm Lịch Học Cá Nhân');
    $('#pTkbRowIndex').val(''); 
    $('#pTkbMon, #pTkbPhong, #pTkbThoiGian, #pTkbGV, #pTkbNgayBD, #pTkbNgayKT, #pTkbHinhThuc, #pTkbLink, #pTkbNgoaiLe').val('');
    $('#pTkbThu').val(2); $('#pTkbTiet').val(1); $('#pTkbSoTiet').val(3); $('#pTkbColor').val('#e0f2fe');
    $('#pTkbThu, #pTkbTiet, #pTkbSoTiet, #pTkbPhong, #pTkbThoiGian, #pTkbGV, #pTkbNgayBD, #pTkbNgayKT, #pTkbHinhThuc, #pTkbLink').prop('readonly', false).css('background-color', '#fff');
    $('#tkbOverlapAlert').addClass('d-none');
    $('#tkbPersonalModal').modal('show');
}

function openEditTkbModal(sheetRowIndex) {
    let course = globalTkbData.find(c => String(c.sheetRowIndex) === String(sheetRowIndex)); if (!course) return;
    $('#tkbModalTitle').html('<i class="fa-solid fa-calendar-check me-2"></i>Chỉnh Sửa Lịch Học');
    $('#pTkbRowIndex').val(sheetRowIndex); 
    $('#pTkbThu').val(course.thu); $('#pTkbTiet').val(course.tietBd); $('#pTkbSoTiet').val(course.soTiet);
    $('#pTkbMon').val(course.mon); $('#pTkbPhong').val(course.phong); $('#pTkbThoiGian').val(course.thoiGian);
    
    let rawHinhThuc = course.hinhThuc || ""; let extLink = checkAndExtractUrl(rawHinhThuc); let displayHT = rawHinhThuc;
    if(extLink) { displayHT = rawHinhThuc.replace(extLink, '').trim(); }
    $('#pTkbHinhThuc').val(displayHT); $('#pTkbLink').val(extLink || '');
    $('#pTkbGV').val(course.gv); $('#pTkbColor').val(course.color);
    $('#pTkbNgayBD').val(course.ngayBatDau); $('#pTkbNgayKT').val(course.ngayKetThuc); $('#pTkbNgoaiLe').val(course.ngayNgoaiLe); 
    
    if (course.isSystem) {
        $('#pTkbThu, #pTkbTiet, #pTkbSoTiet, #pTkbPhong, #pTkbThoiGian, #pTkbGV, #pTkbNgayBD, #pTkbNgayKT, #pTkbHinhThuc, #pTkbLink').prop('readonly', true).css('background-color', '#e9ecef');
        $('#tkbOverlapAlert').removeClass('d-none');
        $('#tkbOverlapMessage').html('Học phần hệ thống: Chỉ được phép thêm tiền tố "Kiểm tra...", không thay đổi thời gian/phòng học.');
    } else {
        $('#pTkbThu, #pTkbTiet, #pTkbSoTiet, #pTkbPhong, #pTkbThoiGian, #pTkbGV, #pTkbNgayBD, #pTkbNgayKT, #pTkbHinhThuc, #pTkbLink').prop('readonly', false).css('background-color', '#fff');
        $('#tkbOverlapAlert').addClass('d-none');
    }
    
    $('#tkbPersonalModal').modal('show');
}
// Ví dụ trong hàm xử lý nút "Chỉ sự kiện này" hoặc khi chuẩn bị gửi data:
function getCorrectLocalDateString(dateInput) {
    // Nếu dateInput là đối tượng Date, chuyển về dạng YYYY-MM-DD theo giờ địa phương
    if (dateInput instanceof Date) {
        let tzoffset = dateInput.getTimezoneOffset() * 60000; // độ lệch múi giờ tính bằng ms
        let localISOTime = (new Date(dateInput.getTime() - tzoffset)).toISOString().slice(0, 10);
        return localISOTime;
    }
    return dateInput; // Nếu đã là chuỗi "YYYY-MM-DD" thì giữ nguyên
}

// Khi người dùng chọn "Chỉ sự kiện này", hãy gán lại ngày chuẩn:
pendingEventAction.date = getCorrectLocalDateString(pendingEventAction.date);
function promptSavePersonalTkb() {
    let targetRowIndex = $('#pTkbRowIndex').val().trim();
    if (targetRowIndex !== '') {
        pendingEventAction = { type: 'edit' };
        $('#eventScopeModal').modal('show');
    } else {
        pendingEventAction = { type: 'edit', scope: 'all' }; 
        executeSavePersonalTkb();
    }
}

function promptDeletePersonalTkb(sheetRowIndex) {
    let course = globalTkbData.find(c => String(c.sheetRowIndex) === String(sheetRowIndex));
    if (course && course.isSystem) { alert("Khóa bảo mật: Bạn không thể xóa học phần đã được đồng bộ từ hệ thống Đào tạo."); return; }
    pendingEventAction = { type: 'delete', rowIndex: sheetRowIndex };
   pendingEventAction = { type: 'delete', rowIndex: sheetRowIndex, thu: course.thu };
    $('#eventScopeModal').modal('show');
}

function submitEventScope(scope) {
    $('#eventScopeModal').modal('hide');
    pendingEventAction.scope = scope;
    let selectedDateStr = formatDateDDMMYYYY(currentSelectedMonday); 
    pendingEventAction.targetDate = selectedDateStr;

if (scope === 'single' || scope === 'future') {
        // Tính toán ngày chính xác của sự kiện dựa vào "thu" của sự kiện đó
        let eventDate = new Date(currentSelectedMonday); 
        // course.thu có giá trị từ 2 (Thứ 2) đến 8 (Chủ nhật)
        let dayDiff = pendingEventAction.thu - 2; 
        eventDate.setDate(eventDate.getDate() + dayDiff);
        
        pendingEventAction.targetDate = formatDateDDMMYYYY(eventDate); 
    } else {
        pendingEventAction.targetDate = formatDateDDMMYYYY(currentSelectedMonday); 
    }

    if (pendingEventAction.type === 'edit') {
        executeSavePersonalTkb();
    } else if (pendingEventAction.type === 'delete') {
        executeDeletePersonalTkb();
    }
}

function executeSavePersonalTkb() {
    let targetRowIndex = $('#pTkbRowIndex').val().trim(); let isEditMode = targetRowIndex !== '';
    let thuVal = parseInt($('#pTkbThu').val()); let tietBdVal = parseInt($('#pTkbTiet').val()); let soTietVal = parseInt($('#pTkbSoTiet').val()); let monVal = $('#pTkbMon').val().trim();
    let ngayBdRaw = $('#pTkbNgayBD').val().trim(); let ngayKtRaw = $('#pTkbNgayKT').val().trim();
    if(!thuVal || !tietBdVal || !monVal) { alert("Vui lòng nhập đầy đủ Thứ, Tiết và Tên môn học!"); return; }

    let tietKtVal = tietBdVal + soTietVal - 1; let isOverlap = false; let overlapCourseName = "";
    let newStartDate = parseDateString(ngayBdRaw); let newEndDate = parseDateString(ngayKtRaw);

    globalTkbData.forEach(course => {
        if (isEditMode && String(course.sheetRowIndex) === String(targetRowIndex)) return;
        if (!course.mon) return;
        if (course.thu === thuVal) {
            let isTietOverlap = Math.max(tietBdVal, course.tietBd) <= Math.min(tietKtVal, course.tietBd + course.soTiet - 1);
            if (isTietOverlap) {
                let isChecking = monVal.toLowerCase().includes("kiểm tra"); let isExistingChecking = course.mon.toLowerCase().includes("kiểm tra");
                if (isChecking !== isExistingChecking && getBaseSubjectName(monVal) === getBaseSubjectName(course.mon)) return; 
                
                let isDateOverlap = true;
                if (newStartDate && newEndDate && course.ngayBatDau && course.ngayKetThuc) {
                    let existingStartDate = parseDateString(course.ngayBatDau); let existingEndDate = parseDateString(course.ngayKetThuc);
                    let currentExceptions = $('#pTkbNgoaiLe').val().split(',').map(d => d.trim());
                    let existingExceptions = (course.ngayNgoaiLe || "").split(',').map(d => d.trim());
                    let d = new Date(Math.max(newStartDate, existingStartDate)); let end = new Date(Math.min(newEndDate, existingEndDate));
                    let foundOverlap = false;
                    while (d <= end) {
                        if (d.getDay() === (thuVal === 8 ? 0 : thuVal - 1)) {
                            let dateStr = formatDateDDMMYYYY(d);
                            if (!currentExceptions.includes(dateStr) && !existingExceptions.includes(dateStr)) { foundOverlap = true; break; }
                        }
                        d.setDate(d.getDate() + 1);
                    }
                    isDateOverlap = foundOverlap;
                }
                if (isDateOverlap) { isOverlap = true; overlapCourseName = course.mon; }
            }
        }
    });

    if (isOverlap) {
        let thuText = thuVal === 8 ? "Chủ nhật" : "Thứ " + thuVal;
        $('#tkbOverlapMessage').html(`<b>Lỗi:</b> Lịch bị trùng tiết với môn <b>"${overlapCourseName}"</b> (${thuText}). Vui lòng chọn thời gian khác.`);
        $('#tkbOverlapAlert').removeClass('d-none');
        alert(`Lỗi: Trùng lịch với môn ${overlapCourseName}! Không thể lưu.`); return; 
    }

    let finalHinhThuc = $('#pTkbHinhThuc').val().trim(); let linkVal = $('#pTkbLink').val().trim();
    if (linkVal) finalHinhThuc += " " + linkVal;

    let pData = {
        action: isEditMode ? "editTKBUser" : "addTKBUser", 
        rowIndex: targetRowIndex, mssv: currentUser.mssv, thu: thuVal, tietBd: tietBdVal, soTiet: soTietVal, thoiGian: $('#pTkbThoiGian').val(), 
        hinhThuc: finalHinhThuc, mon: monVal, phong: $('#pTkbPhong').val(), gv: $('#pTkbGV').val(), color: $('#pTkbColor').val(),
        ngayBatDau: ngayBdRaw, ngayKetThuc: ngayKtRaw, ngayNgoaiLe: $('#pTkbNgoaiLe').val(),
        editScope: pendingEventAction.scope || "all", 
        targetDate: pendingEventAction.targetDate || ""
    };

    let btn = $('#btnSavePersonalTkb'); btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...').prop('disabled', true);
    postToGAS(pData, function(res) { 
        alert(res); $('#tkbPersonalModal').modal('hide'); btn.html('Lưu thông tin').prop('disabled', false); 
        loadThoiGianBieu(); if($('#manageTkbListModal').is(':visible')) { $('#manageTkbListModal').modal('hide'); }
    }, function() { alert("Giao tiếp máy chủ thất bại!"); btn.html('Lưu thông tin').prop('disabled', false); });
}

function executeDeletePersonalTkb() {
    let sheetRowIndex = pendingEventAction.rowIndex;
    postToGAS({ 
        action: "deleteTKBUser", 
        rowIndex: sheetRowIndex, 
        mssv: currentUser.mssv,
        deleteScope: pendingEventAction.scope || "all",
        targetDate: pendingEventAction.targetDate || "" 
    }, function(res) {
        alert(res); loadThoiGianBieu();
        if($('#manageTkbListModal').is(':visible')) { setTimeout(() => { openManageTkbListModal(); }, 600); }
    }, function() { alert("Lỗi khi kết nối yêu cầu xóa bỏ lịch!"); });
}

$('#tkbPersonalModal').on('show.bs.modal', function () { $('#tkbOverlapAlert').addClass('d-none'); });

function getAutoLink(locationName, customLink) {
    if (customLink && customLink.trim() !== "") return customLink;
    if (!locationName) return "#";
    const loc = locationName.toUpperCase();
    if (loc.includes("AN DƯƠNG VƯƠNG") || loc.includes("ADV")) return "https://maps.app.goo.gl/Q8dRKtTZcqGeuEmy5";
    if (loc.includes("LÊ VĂN SỸ") || loc.includes("LVS")) return "https://maps.app.goo.gl/7zCgiMmscdPFfCFv5";
    if (loc.includes("LẠC LONG QUÂN") || loc.includes("LLQ")) return "https://maps.app.goo.gl/oV1mXHYDuW44cGbN6";
    if (loc.includes("LÊ THỊ RIÊNG") || loc.includes("CVLTR")) return "https://maps.app.goo.gl/K7GzwaEcJwSb9dwGA";
    if (loc.includes("PHÂN HIỆU LONG AN") || loc.includes("PHLA")) return "https://maps.app.goo.gl/KNwjk6CUQZM44CZ16";
    return "#";
}

function renderTKBTable(courses) {
    const tbody = document.getElementById('tkb-body'); if (!tbody) return;
    const totalRows = 16; const occupied = Array.from({ length: totalRows + 1 }, () => Array(9).fill(false));
    let tableHtml = "";
    for (let i = 1; i <= totalRows; i++) {
        tableHtml += `<tr>`;
        if (i === 1) tableHtml += `<td rowspan="6" class="col-tiet" style="font-weight: bold; text-transform: uppercase;">Sáng</td>`;
        if (i === 7) tableHtml += `<td rowspan="6" class="col-tiet" style="font-weight: bold; text-transform: uppercase;">Chiều</td>`;
        if (i === 13) tableHtml += `<td rowspan="4" class="col-tiet" style="font-weight: bold; text-transform: uppercase;">Tối</td>`;
        tableHtml += `<td class="col-tiet">${i}</td>`;
        for (let thu = 2; thu <= 8; thu++) {
            if (occupied[i][thu]) continue; 
            const course = courses.find(c => c.thu === thu && c.tietBd === i);
            if (course) {
                const len = course.soTiet;
                for (let r = 0; r < len; r++) { if (i + r <= totalRows) occupied[i + r][thu] = true; }
                
                let rawHinhThuc = course.hinhThuc || ""; let customLink = checkAndExtractUrl(rawHinhThuc); let displayHinhThuc = rawHinhThuc;
                if(customLink) displayHinhThuc = rawHinhThuc.replace(customLink, '').trim();

                let autoColor = course.color; const locU = displayHinhThuc.toUpperCase();
                if (locU.includes("AN DƯƠNG VƯƠNG") || locU.includes("ADV")) autoColor = "#e0f2fe";
                else if (locU.includes("LÊ VĂN SỸ") || locU.includes("LVS")) autoColor = "#e6f9ef";
                else if (locU.includes("LẠC LONG QUÂN") || locU.includes("LLQ")) autoColor = "#fff3e0";
                else if (locU.includes("LÊ THỊ RIÊNG") || locU.includes("CVLTR")) autoColor = "#fef9c3";
                else if (locU.includes("ONLINE") || locU.includes("HỌP")) autoColor = "#f3e8ff";
                else if (locU.includes("PHÂN HIỆU LONG AN") || locU.includes("PHLA")) autoColor = "#fff5fb";

                const finalLink = getAutoLink(displayHinhThuc, customLink);
                let monDisplay = course.mon;
                let examTypes = ["Kiểm tra Quá trình", "Kiểm tra Giữa học phần", "Kiểm tra Kết thúc học phần"];
                for (let type of examTypes) {
                    let regex = new RegExp(`^(${type})\\s*[-:]?\\s*`, "i");
                    if (regex.test(monDisplay)) {
                        let subjectName = monDisplay.replace(regex, "").trim();
                        monDisplay = `<b>${type}</b><br>${subjectName}`; break; 
                    }
                }                        
                tableHtml += `
               <td rowspan="${len}" class="td-subject" style="background:${autoColor || '#fff'}">
                    <div class="tkb-actions">
                        <button class="btn-tkb-act text-warning" onclick="openEditTkbModal('${course.sheetRowIndex}')" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-tkb-act text-danger" onclick="promptDeletePersonalTkb('${course.sheetRowIndex}')" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    <div class="subject">
                        ${course.thoiGian ? `<div class="time">${course.thoiGian}</div>` : ''}
                        <div style="font-weight:600;"><a href="${finalLink}" target="_blank" style="color:#2563eb; text-decoration:none;">${displayHinhThuc || "Truy cập"}</a></div>
                        <div>${monDisplay}</div>
                        ${course.phong ? `<span class="room">Phòng: ${course.phong}</span><br>` : ''}
                        ${course.gv ? `<span class="teacher">GV: ${course.gv}</span>` : ''}
                    </div>
                </td>`;
            } else { tableHtml += `<td class="day"></td>`; }
        }
        tableHtml += `</tr>`;
    }
    tbody.innerHTML = tableHtml;
}

function fetchSemesterConfig() {
    $.ajax({
        url: SCRIPT_URL + "?action=getConfigHocKy",
        method: "GET", dataType: "json",
        success: function(data) { globalConfigHK = data; buildNamHocDropdown(); jumpToCurrentWeek(); }
    });
}

function buildNamHocDropdown() {
    let namHocs = [...new Set(globalConfigHK.map(item => item[0]))];
    let html = '<option value="">-- Chọn năm học --</option>';
    namHocs.forEach(nh => html += `<option value="${nh}">${nh}</option>`);
    $('#namHocSelect').html(html);
}

function onNamHocChange() {
    let selectedNH = $('#namHocSelect').val();
    let hks = globalConfigHK.filter(item => item[0] === selectedNH).map(item => item[1]);
    let html = '<option value="">-- Chọn học kỳ --</option>';
    hks.forEach(hk => html += `<option value="${hk}">${hk}</option>`);
    $('#hocKySelect').html(html).val('');
    $('#weekSelect').html('<option value="">-- Chọn tuần --</option>').val('');
}

function onHocKyChange() {
    let selectedNH = $('#namHocSelect').val(); 
    let selectedHK = $('#hocKySelect').val();
    let config = globalConfigHK.find(item => item[0] === selectedNH && item[1] === selectedHK);
    let html = '<option value="">-- Chọn tuần --</option>';
    if (config) {
        let startDate = parseDateString(config[2]); let numAcademicWeeks = parseInt(config[3]); let breakWeeks = (config[4] || "").split(',').map(w => parseInt(w.trim())).filter(w => !isNaN(w));
        if (startDate && numAcademicWeeks) {
            let startMonday = getMondayOfDate(startDate); let academicWk = 1; let calendarWk = 1; 
            while (academicWk <= numAcademicWeeks && calendarWk <= 52) {
                let m = new Date(startMonday); m.setDate(m.getDate() + ((calendarWk - 1) * 7));
                let s = new Date(m); s.setDate(s.getDate() + 6);
                let format = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                if (breakWeeks.includes(calendarWk)) {
                    html += `<option value="${m.getTime()}" data-is-break="true" style="color: red; font-weight: bold;">Tuần Nghỉ Lễ (${format(m)} - ${format(s)})</option>`;
                } else {
                    html += `<option value="${m.getTime()}" data-is-break="false">Tuần ${academicWk} (${format(m)} - ${format(s)})</option>`;
                    academicWk++; 
                }
                calendarWk++; 
            }
        }
    }
    $('#weekSelect').html(html);
    if ($('#weekSelect option').length > 1) { $('#weekSelect').prop('selectedIndex', 1); onWeekChange(); }
}

function onWeekChange() {
    let val = $('#weekSelect').val();
    if (val) {
        currentSelectedMonday = new Date(parseInt(val));
        updateTableHeaders(); filterAndRenderTKB(); renderDeadlines(); 
    }
}

let globalConfigHK = [];
let currentSelectedMonday = new Date();

function getMondayOfDate(d) {
    d = new Date(d); var day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6 : 1);
    return new Date(d.setHours(0,0,0,0));
}

function updateTableHeaders() {
    for (let i = 2; i <= 8; i++) {
        let d = new Date(currentSelectedMonday); d.setDate(d.getDate() + (i - 2));
        let thName = i === 8 ? "Chủ nhật" : "Thứ " + i;
        $(`#th-day-${i}`).html(`${thName} <br><small style="font-weight: normal; color: #bae6fd;">(${formatShort(d)})</small>`);
    }
}

function changeWeekBtn(delta) {
    let select = document.getElementById('weekSelect');
    if(select.selectedIndex === 0 && select.options.length > 1) { select.selectedIndex = 1; } 
    else { let newIndex = select.selectedIndex + delta; if (newIndex >= 1 && newIndex < select.options.length) { select.selectedIndex = newIndex; } }
    onWeekChange();
}

function jumpToCurrentWeek() {
    let todayTime = new Date().getTime(); let found = false; let targetNH = "", targetHK = "", targetWeekSelectValue = "";
    for (let conf of globalConfigHK) {
        let sDate = parseDateString(conf[2]); let numAcademicWeeks = parseInt(conf[3]); let breakWeeks = (conf[4] || "").split(',').map(w => parseInt(w.trim())).filter(w => !isNaN(w));
        if (sDate && numAcademicWeeks) {
            let startMon = getMondayOfDate(sDate); let acadWk = 1; let calWk = 1;
            while (acadWk <= numAcademicWeeks && calWk <= 52) {
                let m = new Date(startMon); m.setDate(m.getDate() + ((calWk - 1) * 7));
                let nextM = new Date(m); nextM.setDate(nextM.getDate() + 7);
                if (todayTime >= m.getTime() && todayTime < nextM.getTime()) { targetNH = conf[0]; targetHK = conf[1]; found = true; targetWeekSelectValue = m.getTime().toString(); break; }
                if (!breakWeeks.includes(calWk)) { acadWk++; } calWk++;
            }
            if (found) break;
        }
    }
    if (found) {
        $('#namHocSelect').val(targetNH); onNamHocChange(); $('#hocKySelect').val(targetHK); onHocKyChange(); $('#weekSelect').val(targetWeekSelectValue); onWeekChange();
    } else {
        $('#namHocSelect').val(''); $('#hocKySelect').html('<option value="">-- Chọn học kỳ --</option>'); $('#weekSelect').html('<option value="">-- Chọn tuần --</option>');
        currentSelectedMonday = getMondayOfDate(new Date()); updateTableHeaders(); filterAndRenderTKB(); renderDeadlines();
    }
}

function filterAndRenderTKB() {
    let isBreakWeek = $('#weekSelect').find(':selected').data('is-break') === true;
    let filteredData = globalTkbData.filter(c => {
        if (c.thu < 2 || c.thu > 8 || c.tietBd < 1) return false;
        let classDateInThisWeek = new Date(currentSelectedMonday); classDateInThisWeek.setDate(classDateInThisWeek.getDate() + (c.thu - 2));
        let isRecurring = true; 
        if (c.ngayBatDau && c.ngayKetThuc) {
            let s = parseDateString(c.ngayBatDau); let e = parseDateString(c.ngayKetThuc);
            if (s && e) { let diffDays = (e - s) / (1000 * 60 * 60 * 24); if (diffDays <= 7) isRecurring = false; }
        }
        if (isBreakWeek && isRecurring) return false;
        if (c.ngayBatDau && c.ngayKetThuc) {
            let startDate = parseDateString(c.ngayBatDau); let endDate = parseDateString(c.ngayKetThuc);
            if (startDate && endDate) { if (classDateInThisWeek < startDate || classDateInThisWeek > endDate) return false; }
        } 
        if (c.ngayNgoaiLe && c.ngayNgoaiLe.trim() !== "") {
            let skipDates = c.ngayNgoaiLe.split(',').map(d => d.trim()); 
            let formattedClassDate = formatDateDDMMYYYY(classDateInThisWeek);
            if (skipDates.includes(formattedClassDate)) return false; 
        }
        return true; 
    }); 
    renderTKBTable(filteredData);
}

let globalSystemCourses = [];
let userRegisteredCourseIds = [];

function buildSystemFilters() {
    let nHocs = [...new Set(globalConfigHK.map(item => item[0]))];
    let hKys = [...new Set(globalConfigHK.map(item => item[1]))];
    
    let nhHtml = '<option value="">-- Tất cả năm học --</option>'; 
    nHocs.forEach(nh => nhHtml += `<option value="${nh}">${nh}</option>`); 
    $('#sysNamHocFilter').html(nhHtml);
    
    let hkHtml = '<option value="">-- Tất cả học kỳ --</option>'; 
    hKys.forEach(hk => hkHtml += `<option value="${hk}">${hk}</option>`); 
    $('#sysHocKyFilter').html(hkHtml);
}

function openSystemTkbModal() {
    $('#systemTkbModal').modal('show');
    $('#systemCoursesContainer').html('<tr><td colspan="8" class="text-center text-muted py-4"><i class="fa-solid fa-spinner fa-spin fs-3 mb-2"></i><br>Đang tải danh sách học phần...</td></tr>');
    
    $.ajax({
        url: SCRIPT_URL + "?action=getSystemTKBList&mssv=" + currentUser.mssv,
        method: "GET", 
        dataType: "json",
        success: function(data) {
            globalSystemCourses = data.allCourses || [];
            userRegisteredCourseIds = data.registeredIds || [];
            
            buildSystemFilters();

            let currentMainNH = $('#namHocSelect').val();
            let currentMainHK = $('#hocKySelect').val();
            
            if (currentMainNH) $('#sysNamHocFilter').val(currentMainNH);
            if (currentMainHK) $('#sysHocKyFilter').val(currentMainHK);

            renderSystemCoursesList();
        },
        error: function() {
            $('#systemCoursesContainer').html('<tr><td colspan="8"><div class="alert alert-danger m-0 text-center">Lỗi khi tải dữ liệu hệ thống! Vui lòng thử lại sau.</div></td></tr>');
        }
    });
}

function renderSystemCoursesList() {
    let container = $('#systemCoursesContainer');
    let filterNH = $('#sysNamHocFilter').val(); 
    let filterHK = $('#sysHocKyFilter').val();
    
    let filteredCourses = globalSystemCourses.filter(c => {
        let matchNH = filterNH === "" || c.namHoc === filterNH;
        let matchHK = filterHK === "" || c.hocKy === filterHK;
        return matchNH && matchHK;
    });

    if (filteredCourses.length === 0) {
        let msg = (filterNH && filterHK) 
            ? `Không có học phần hệ thống nào được mở trong <b>${filterHK} (${filterNH})</b>.` 
            : `Hệ thống hiện chưa có môn học nào.`;
        container.html(`<tr><td colspan="8" class="text-center text-muted py-5"><i class="fa-regular fa-folder-open fs-2 mb-2"></i><br>${msg}</td></tr>`);
        return;
    }

    let groupedCourses = {};
    filteredCourses.forEach(course => {
        if (!groupedCourses[course.id]) {
            groupedCourses[course.id] = {
                id: course.id, mon: course.mon, gv: course.gv,
                phongList: [], thoiGianList: [], 
                hinhThuc: course.hinhThuc, ngayBatDau: course.ngayBatDau, ngayKetThuc: course.ngayKetThuc
            };
        }
        let timeStr = `Thứ ${course.thu} (Tiết ${course.tietBd}-${course.tietBd + course.soTiet - 1})`;
        if (!groupedCourses[course.id].thoiGianList.includes(timeStr)) {
            groupedCourses[course.id].thoiGianList.push(timeStr);
        }
        if (!groupedCourses[course.id].phongList.includes(course.phong)) {
            groupedCourses[course.id].phongList.push(course.phong);
        }
    });

    let html = '';
    for (let id in groupedCourses) {
        let c = groupedCourses[id];
        let isChecked = userRegisteredCourseIds.includes(id) ? 'checked' : '';
        let dateDisplay = (c.ngayBatDau && c.ngayKetThuc) ? `<span class="fw-bold text-dark">${c.ngayBatDau}</span> đến <span class="fw-bold text-dark">${c.ngayKetThuc}</span>` : '-';

        html += `
        <tr style="cursor: pointer; transition: background 0.2s;" onclick="$(this).find('.system-course-checkbox').prop('checked', function(i, v) { return !v; });">
            <td class="text-center" style="background-color: #f8fafc;">
                <input class="form-check-input system-course-checkbox shadow-sm border-secondary" type="checkbox" value="${c.id}" ${isChecked} style="width: 20px; height: 20px; cursor: pointer;" onclick="event.stopPropagation();">
            </td>
            <td class="text-center fw-bold text-secondary">${c.id}</td>
            <td class="fw-bold" style="color: var(--primary-color);">${c.mon}</td>
            <td class="text-center">${c.hinhThuc || '-'}</td>
            <td class="text-center fw-bold text-success">${c.phongList.join(', ')}</td>
            <td class="text-center">
                <small class="fw-bold text-muted">${c.thoiGianList.join('<br>')}</small>
            </td>
            <td class="text-center text-warning-emphasis fw-bold">${c.gv || '-'}</td>
            <td class="text-center" style="font-size: 13px;">${dateDisplay}</td>
        </tr>
        `;
    }
    container.html(html);
}

function saveSystemTkbSelection() {
    let selectedIds = []; $('.system-course-checkbox:checked').each(function() { selectedIds.push($(this).val()); });
    let btn = $('#btnSaveSystemTkb'); btn.html('<i class="fa-solid fa-spinner fa-spin me-1"></i> Đang xử lý...').prop('disabled', true);
    postToGAS({ action: "saveSystemTkbSelection", mssv: currentUser.mssv, courseIds: selectedIds.join(',') }, function(res) {
        alert("Đã đồng bộ lịch học thành công!"); $('#systemTkbModal').modal('hide'); btn.html('Đồng bộ lịch học').prop('disabled', false); loadThoiGianBieu();
    }, function() { alert("Giao tiếp máy chủ thất bại! Không thể lưu thiết lập."); btn.html('Đồng bộ lịch học').prop('disabled', false); });
}
