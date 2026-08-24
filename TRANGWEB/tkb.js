function loadTKBView() {
    document.title = "Thời gian biểu | Học nhóm APMA Khoa Toán";
    resetNavActive(); 
    $('#btnNavTKB').addClass('active'); 
    $('#tkbSection').removeClass('d-none');
    
    updateSystemUrl('view', 'tkb'); // Đổi URL thành ?view=tkb
    if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); }

    // Kiểm tra: Nếu dữ liệu đã tải ngầm xong thì lấy ra vẽ luôn (0 giây)
    if (typeof globalTkbData !== 'undefined' && globalTkbData.length > 0) {
        filterAndRenderTKB();
        renderTkbToolBar();
    } else {
        loadThoiGianBieu(); // Dự phòng mạng lag chưa tải xong
    }

    // Tương tự với Deadline
    if (typeof globalDeadlineData !== 'undefined' && globalDeadlineData.length > 0) {
        renderDeadlines();
        $('#deadlineBox').removeClass('d-none');
    } else {
        loadDeadlines();
    }
}
function loadThoiGianBieu() {
    $('.tkb-personal-toolbar').remove();
    if (!currentUser) {
        $('#tkb-body').html(`<tr><td colspan="8" style="text-align: center; padding: 60px; color: #6b7280;"><i class="fa-solid fa-lock fs-1 mb-3 text-secondary"></i><br><h6 class="fw-bold">Bạn chưa đăng nhập</h6><p class="mb-3">Vui lòng đăng nhập để xem và tự điều chỉnh lịch học thời gian biểu cá nhân.</p><button class="btn btn-primary fw-bold px-4" onclick="openAddTkbModal(true)">Đăng nhập / Đăng ký</button></td></tr>`);
        $('#deadlineBox').addClass('d-none'); return;
    }

    // ĐOẠN CODE PHÓNG TO HÌNH TAM GIÁC (ĐÃ ĐỔI COLSPAN=8 ĐỂ KHÔNG BỊ DƯ CỘT)
    let loadingHtml = `
    <tr>
        <td colspan="8" style="text-align: center; padding: 60px 20px; background: #f8fafc;">
            <div class="pro-triangle-loader mx-auto mb-4" style="width: 220px; height: 220px; position: relative;">
                <svg viewBox="0 0 200 200" width="100%" height="100%" style="overflow: visible;">
                    <polygon points="100,25 175,155 25,155" fill="none" stroke="#e2e8f0" stroke-width="3.5" stroke-linejoin="round"/>
                    <g class="pro-node" style="--i: 0; --c: #7dd3fc;"><circle cx="100" cy="25" r="18" /><text x="100" y="31">A</text></g>
                    <g class="pro-node" style="--i: 1; --c: #38bdf8;"><circle cx="137.5" cy="90" r="18" /><text x="137.5" y="96">P</text></g>
                    <g class="pro-node" style="--i: 2; --c: #0ea5e9;"><circle cx="175" cy="155" r="18" /><text x="175" y="161">C</text></g>
                    <g class="pro-node" style="--i: 3; --c: #0284c7;"><circle cx="100" cy="155" r="18" /><text x="100" y="161">N</text></g>
                    <g class="pro-node" style="--i: 4; --c: #0369a1;"><circle cx="25" cy="155" r="18" /><text x="25" y="161">B</text></g>
                    <g class="pro-node" style="--i: 5; --c: #0f4c81;"><circle cx="62.5" cy="90" r="18" /><text x="62.5" y="96">M</text></g>
                </svg>
            </div>
            <div class="fw-bold" style="font-size: 17px; color: #0f4c81; letter-spacing: 0.5px;">
                Đang đồng bộ Thời khóa biểu...
            </div>
            <div class="text-muted small mt-1">Vui lòng chờ trong giây lát</div>
        </td>
    </tr>`;
    
    $('#tkb-body').html(loadingHtml);
    
    // THÊM ĐOẠN NÀY: Ép hiển thị lại từ Thứ 2 đến Chủ Nhật (trọng số chia đều / 7) lúc đang load
    for (let thu = 2; thu <= 8; thu++) {
        $(`#th-day-${thu}`).show().css("width", "calc((100% - 60px) / 7)");
    }
    
    $.ajax({
        url: SCRIPT_URL + "?action=getTKBUser&mssv=" + currentUser.mssv + "&_=" + new Date().getTime(), 
        method: "GET", dataType: "json", cache: false,
        success: function(data) { processTKBData(data); renderTkbToolBar(); },
        error: function() { $('#tkb-body').html('<tr><td colspan="8" class="text-danger text-center">Lỗi khi tải dữ liệu TKB!</td></tr>'); }
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
    
    let selectedNH = $('#namHocSelect').val(); 
    let selectedHK = $('#hocKySelect').val();
    let selectedWeekVal = $('#weekSelect').val();

    let startMonTime = null; 
    let endSunTime = null;
    const getTimeFast = (dateStr) => { let d = parseDateString(dateStr); return d ? d.getTime() : null; };

    // 1. TÍNH TOÁN KHOẢNG THỜI GIAN THEO HỌC KỲ / TUẦN
    if (selectedWeekVal && selectedWeekVal !== "") {
        let weekStart = new Date(currentSelectedMonday); weekStart.setHours(0,0,0,0);
        let weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999);
        startMonTime = weekStart.getTime();
        endSunTime = weekEnd.getTime();
    } else if (selectedNH && selectedHK) {
        let config = globalConfigHK.find(item => item[0] === selectedNH && item[1] === selectedHK);
        if (config) {
            let sDate = parseDateString(config[2]); let numAcademicWeeks = parseInt(config[3]); let breakWeeks = (config[4] || "").split(',').map(w => parseInt(w.trim())).filter(w => !isNaN(w));
            if (sDate && numAcademicWeeks) {
                let startMon = getMondayOfDate(sDate); startMonTime = startMon.getTime();
                let acadWk = 1; let calWk = 1;
                while (acadWk <= numAcademicWeeks && calWk <= 52) { 
                    if (!breakWeeks.includes(calWk)) { acadWk++; } 
                    calWk++; 
                }
                let endSun = new Date(startMon); endSun.setDate(endSun.getDate() + ((calWk - 1) * 7) - 1); endSun.setHours(23, 59, 59, 999); endSunTime = endSun.getTime();
            }
        }
    }

    // --- BẮT ĐẦU THÊM MỚI: TẠO DEADLINE ẢO TỪ MÔN VLE TRONG TKB ---
    let virtualDeadlines = [];
    if (typeof globalTkbData !== 'undefined') {
        globalTkbData.forEach(c => {
            if ((c.hinhThuc || '').toUpperCase().includes('VLE')) {
                let durationStr = (c.ngayBatDau && c.ngayKetThuc && c.ngayBatDau !== c.ngayKetThuc) ? 
                                  `Từ ${c.ngayBatDau} đến ${c.ngayKetThuc}` : (c.ngayBatDau || "Chưa rõ");
                virtualDeadlines.push({
                    title: c.mon,
                    duration: durationStr,
                    tag: c.hinhThuc,
                    icon: "primary",
                    emoji: "🌐",
                    dateStart: c.ngayBatDau || "",
                    dateEnd: c.ngayKetThuc || "",
                    sheetRowIndex: c.sheetRowIndex,
                    isSystem: c.isSystem,
                    isVirtualVLE: true // Cờ nhận diện để ẩn nút Sửa/Xóa bên trong khung Deadline
                });
            }
        });
    }
    let combinedDeadlineData = [...globalDeadlineData, ...virtualDeadlines];
    // --- KẾT THÚC THÊM MỚI ---

   // LỌC DANH SÁCH DEADLINE THEO KHOẢNG THỜI GIAN ĐÃ XÁC ĐỊNH
    let filtered = combinedDeadlineData.filter(d => {
        // Nếu là môn VLE ảo mà không có ngày thì luôn hiển thị
        if (d.isVirtualVLE && (!d.dateStart || !d.dateEnd)) return true;

        if (!startMonTime || !endSunTime) return true;

        let sDate = getTimeFast(d.dateStart); 
        let eDate = getTimeFast(d.dateEnd);
        
        if (!sDate && !eDate) return true; 
        if (sDate && eDate) return sDate <= endSunTime && eDate >= startMonTime;
        if (sDate) return sDate <= endSunTime;
        if (eDate) return eDate >= startMonTime;
        return true;
    });

    if (filtered.length === 0) {
        let emptyMsg = (selectedNH && selectedHK) ? `Không có Deadline nào trong ${selectedHK} (${selectedNH})!` : "Không có Deadline nào!";
        container.innerHTML = `<div style='grid-column: 1 / -1; text-align:center; padding: 20px 0; color:#6b7280; font-weight:500;'><i class='fa-solid fa-mug-hot me-2'></i>${emptyMsg}</div>`; 
        return;
    }

    let completedList = getCompletedDeadlines();
    let nowTime = new Date().setHours(0, 0, 0, 0);

    // 3. SẮP XẾP ƯU TIÊN
    filtered.sort((a, b) => {
        let isDoneA = completedList.includes(getDlKey(a)) ? 1 : 0;
        let isDoneB = completedList.includes(getDlKey(b)) ? 1 : 0;
        if (isDoneA !== isDoneB) return isDoneA - isDoneB;

        let startA = getTimeFast(a.dateStart) || 0;
        let endA = getTimeFast(a.dateEnd) || startA;
        let startB = getTimeFast(b.dateStart) || 0;
        let endB = getTimeFast(b.dateEnd) || startB;

        let isHappeningA = (nowTime >= startA && nowTime <= endA) ? 1 : 0;
        let isHappeningB = (nowTime >= startB && nowTime <= endB) ? 1 : 0;
        if (isHappeningA !== isHappeningB) return isHappeningB - isHappeningA;

        return startA - startB;
    });

    // 4. HIỂN THỊ RA GIAO DIỆN
    container.innerHTML = filtered.map(item => {
        let isDone = completedList.includes(getDlKey(item));
        
        let extLinkTitle = checkAndExtractUrl(item.title);
        let extLinkTag = checkAndExtractUrl(item.tag);
        let extLink = extLinkTitle || extLinkTag;
        
        let displayTitle = item.title;
        let displayTag = item.tag;
        if (extLinkTitle) displayTitle = displayTitle.replace(extLinkTitle, '').trim();
        if (extLinkTag) displayTag = displayTag.replace(extLinkTag, '').trim();
        if (displayTag === "") displayTag = "Truy cập Liên kết";
        displayTitle = displayTitle.replace(/^([a-zA-Z0-9_\.]+)\s*-\s*/, '').trim();
        // --- CẬP NHẬT Ở ĐÂY: Ẩn thao tác nếu là VLE ---
       let actionButtons = '';
if (!item.isSystem) {
    if (item.isVirtualVLE) {
        actionButtons = `
            <div class="deadline-actions">
                <button class="btn-dl-act text-warning shadow-sm" onclick="event.stopPropagation(); openEditTkbModal('${item.sheetRowIndex}')" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-dl-act text-danger shadow-sm" onclick="event.stopPropagation(); promptDeletePersonalTkb('${item.sheetRowIndex}')" title="Xóa"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    } else {
        actionButtons = `
            <div class="deadline-actions">
                <button class="btn-dl-act text-warning shadow-sm" onclick="event.stopPropagation(); openEditDeadlineModal('${item.sheetRowIndex}')" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-dl-act text-danger shadow-sm" onclick="event.stopPropagation(); deletePersonalDeadline('${item.sheetRowIndex}')" title="Xóa"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    }
}
        
        let cardOnClick = extLink ? `onclick="window.open('${extLink}', '_blank')"` : "";
        let cardStyle = extLink ? "cursor: pointer; transition: 0.2s; border: 1px dashed var(--primary-color);" : "";
        
        let doneBtnHtml = `
            <button class="btn-dl-done ${isDone ? 'is-done' : ''}" onclick="toggleDeadlineComplete('${getDlKey(item)}', event)" title="Đánh dấu trạng thái">
                <i class="fa-solid ${isDone ? 'fa-circle-check' : 'fa-circle'} me-1"></i> ${isDone ? 'Đã xong' : 'Chưa xong'}
            </button>
        `;

        return `
            <div class="online-card ${isDone ? 'completed-dl' : ''}" ${cardOnClick} style="${cardStyle}" title="${extLink ? 'Bấm để mở liên kết' : ''}">
                ${doneBtnHtml}
                ${actionButtons}
                <div class="icon-circle ${item.icon}" style="margin-top: 15px;">${item.emoji || '📌'}</div>
                <h3 class="text-danger mb-2" style="font-size: 15px; font-weight: 800;">${item.duration}</h3>
                <p class="desc text-dark mb-3" style="font-size: 16px; font-weight: 600;">${displayTitle}</p>
                <span class="tag">${displayTag}</span>
            </div>
        `;
    }).join('');
}
function openAddDeadlineModal() {
    $('#dlModalTitle').html('<i class="fa-solid fa-plus me-2"></i>Thêm Deadline');
    $('#pDlRowIndex').val(''); 
    $('#pDlMaHP, #pDlTitle, #pDlTag, #pDlLink, #pDlEmoji, #pDlStartDate, #pDlEndDate').val(''); 
    $('#pDlIcon').val('fire');
    $('#deadlinePersonalModal').modal('show');
}

function openEditDeadlineModal(rowIndex) {
    let dl = globalDeadlineData.find(d => String(d.sheetRowIndex) === String(rowIndex)); 
    if(!dl) return;
    
    $('#dlModalTitle').html('<i class="fa-solid fa-pen me-2"></i>Sửa Deadline');
    $('#pDlRowIndex').val(rowIndex); 
    
    // Tách Mã HP nếu tiêu đề có dạng "MÃ_HP - Tiêu đề"
    let rawTitle = dl.title || "";
    let maHpMatch = rawTitle.match(/^([a-zA-Z0-9_\.]+)\s*-\s*(.*)$/);
    if (maHpMatch) {
        $('#pDlMaHP').val(maHpMatch[1]);
        $('#pDlTitle').val(maHpMatch[2]);
    } else {
        $('#pDlMaHP').val('');
        $('#pDlTitle').val(rawTitle);
    }
    
    // Bóc tách Hình thức và Link
    let rawTag = dl.tag || "";
    let extLink = checkAndExtractUrl(rawTag);
    let displayTag = rawTag;
    if (extLink) {
        displayTag = rawTag.replace(extLink, '').trim();
    }
    
    $('#pDlTag').val(displayTag);
    $('#pDlLink').val(extLink || '');
    
    $('#pDlIcon').val(dl.icon); 
    $('#pDlEmoji').val(dl.emoji); 
    $('#pDlStartDate').val(dl.dateStart); 
    $('#pDlEndDate').val(dl.dateEnd);
    $('#deadlinePersonalModal').modal('show');
}
function savePersonalDeadline() {
    let rowIndex = $('#pDlRowIndex').val(); 
    let startDate = $('#pDlStartDate').val().trim(); 
    let endDate = $('#pDlEndDate').val().trim();
    let maHpVal = $('#pDlMaHP').val().trim();
    let rawTitle = $('#pDlTitle').val().trim();

    if (!rawTitle || !startDate || !endDate) { 
        alert("Vui lòng nhập Tên công việc và Ngày bắt đầu/Kết thúc!"); 
        return; 
    }
    
    // Tự động ghép Mã lớp học phần vào trước Tên tiêu đề (VD: COMP1013 - Nộp bài tập C++)
    let cleanTitle = rawTitle.replace(/^([a-zA-Z0-9_\.]+)\s*-\s*/, '').trim();
    let finalTitle = maHpVal ? `${maHpVal} - ${cleanTitle}` : cleanTitle;

    let autoDuration = (startDate === endDate) ? startDate : "Từ " + startDate + " đến " + endDate;
    let isEditMode = (rowIndex !== null && rowIndex !== '');

    let finalTag = $('#pDlTag').val().trim();
    let linkVal = $('#pDlLink').val().trim();
    if (linkVal) {
        finalTag += " " + linkVal;
    }

    let payload = {
        action: isEditMode ? "editDeadlineUser" : "addDeadlineUser",
        rowIndex: rowIndex,
        mssv: currentUser.mssv,
        title: finalTitle,
        duration: autoDuration,
        tag: finalTag,
        icon: $('#pDlIcon').val(),
        emoji: $('#pDlEmoji').val().trim(),
        startDate: startDate,
        endDate: endDate
    };

    let btn = $('#btnSaveDeadline'); 
    btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...').prop('disabled', true);
    
    postToGAS(payload, function(res) { 
        alert(res); 
        $('#deadlinePersonalModal').modal('hide'); 
        btn.html('Lưu Deadline').prop('disabled', false); 
        loadDeadlines(); 
    }, function() { 
        alert("Giao tiếp máy chủ thất bại!"); 
        btn.html('Lưu Deadline').prop('disabled', false); 
    });
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
                <button class="btn btn-sm fw-bold d-inline-flex align-items-center gap-2" 
                        style="background-color: #ffffff; color: #0f172a; border: 1.5px solid #94a3b8; border-radius: 50px; padding: 6px 18px; font-size: 14px;" 
                        onclick="loadThoiGianBieu(); loadDeadlines();">
                    <i class="fa-solid fa-clock-rotate-left" style="color: #2563eb; font-size: 15px;"></i> Làm mới
                </button>
            </div>
            <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-sm text-white fw-bold" style="background-color: #0f4c81;" onclick="openSystemTkbModal()"><i class="fa-solid fa-cloud-arrow-down"></i> Đồng bộ học phần</button>
                <button class="btn btn-sm text-white fw-bold" style="background-color: #0f4c81;" onclick="openManageTkbListModal()"><i class="fa-solid fa-calendar-days text-info"></i> Lịch học</button>
                <button class="btn btn-sm text-white fw-bold" style="background-color: #dc2626;" onclick="openManageDeadlineListModal()"><i class="fa-solid fa-thumbtack text-warning"></i> Deadline</button>
                <button class="btn btn-sm text-white fw-bold" style="background-color: #0f4c81;" onclick="openAddTkbModal(false)"><i class="fa-solid fa-plus"></i> Thêm lịch mới</button>
                
                <!-- NÚT ĐẶT LỊCH HẸN VỪA ĐƯỢC THÊM VÀO -->
                <button class="btn btn-sm text-white fw-bold" style="background-color: #8b5cf6;" onclick="loadDatLichHenView()"><i class="fa-solid fa-calendar-check"></i> Đặt lịch hẹn</button>

                <button class="btn btn-sm text-white fw-bold" style="background-color: #16a34a;" onclick="openExportCalendarModal()"><i class="fa-solid fa-calendar-plus"></i> Xuất Google Lịch</button>
                <button class="btn btn-sm text-white fw-bold" style="background-color: #10b981;" onclick="exportHocNhomTKBToImage(event)">
                    <i class="fa-solid fa-camera"></i> Xuất Ảnh
                </button>
            </div>
        </div>`;
    $('.table-box').before(toolbarHtml);
}

function getBaseSubjectName(name) {
    if (!name) return "KHÁC";
    
    // ĐÃ THÊM: Loại bỏ phần "MÃ_HP - " ở đầu chuỗi (nếu có) trước khi xử lý tiếp
    let cleanName = name.replace(/^([a-zA-Z0-9_\.]+)\s*-\s*/, '');
    
    let base = cleanName.toLowerCase()
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

// ----------------------------------------------------
// HÀM 1: MỞ BẢNG TỔNG HỢP TKB (Sắp xếp theo Ngày thực tế diễn ra sớm nhất)
// ----------------------------------------------------
function openManageTkbListModal() {
    let selectedNH = $('#namHocSelect').val(); let selectedHK = $('#hocKySelect').val();
    let filteredTkbData = globalTkbData; let titleSuffix = '';
    let startMonTime = null; let endSunTime = null;
    const getTimeFast = (dateStr) => { let d = parseDateString(dateStr); return d ? d.getTime() : null; };

    // LẤY DANH SÁCH CHECKLIST DEADLINE
    let completedList = getCompletedDeadlines();

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

    let filteredTkbSubjectNames = new Set(filteredTkbData.map(c => getBaseSubjectName(c.mon)));

    let pseudoDeadlines = [];
    if (globalDeadlineData && globalDeadlineData.length > 0) {
        let vleDeadlines = globalDeadlineData.filter(d => {
            let searchStr = ((d.tag || "") + " " + (d.title || "")).toLowerCase();
            if (!(searchStr.includes('vle') || searchStr.includes('tiểu luận'))) return false;
            
            if (!filteredTkbSubjectNames.has(getBaseSubjectName(d.title))) return false;

            if (startMonTime && endSunTime) {
                let dStartTime = getTimeFast(d.dateStart); let dEndTime = getTimeFast(d.dateEnd);
                if (!dStartTime && !dEndTime) return true;
                if (dStartTime && dEndTime) return dStartTime <= endSunTime && dEndTime >= startMonTime;
                if (dStartTime) return dStartTime <= endSunTime;
                if (dEndTime) return dEndTime >= startMonTime;
                return true;
            } 
            return true;
        });
        
        pseudoDeadlines = vleDeadlines.map(d => ({ 
            isDeadline: true, 
            mon: d.title, 
            hinhThuc: d.tag || "VLE", 
            ngayBatDau: d.dateStart, 
            ngayKetThuc: d.dateEnd, 
            sheetRowIndex: d.sheetRowIndex, 
            thu: 99, 
            tietBd: 99, 
            soTiet: "-", 
            thoiGian: d.duration || "-", 
            phong: "-", 
            gv: "-" 
        }));
    }

    let combinedData = [...filteredTkbData, ...pseudoDeadlines];
    
    // THÊM NÚT "THÊM LỊCH MỚI" TRÊN TIÊU ĐỀ
    $('#manageTkbListModal .modal-title').html(`
        <span class="me-3"><i class="fa-solid fa-calendar-days me-2"></i>Bảng Tổng hợp Lịch học${titleSuffix}</span>
        <button class="btn btn-sm btn-light text-primary fw-bold" onclick="$('#manageTkbListModal').modal('hide'); setTimeout(() => openAddTkbModal(false), 400);"><i class="fa-solid fa-plus"></i> Thêm lịch mới</button>
    `);

    let tkbHtml = '';
    if (combinedData.length === 0) {
        let emptyMsg = (selectedNH && selectedHK) ? `Không có môn học/sự kiện nào trong ${selectedHK} năm học ${selectedNH}!` : "Chưa có môn học/sự kiện nào được tạo!";
        tkbHtml += `<tr><td colspan="9" class="text-center text-muted py-4 bg-white">${emptyMsg}</td></tr>`;
    } else {
        let groupedByMon = {};
        combinedData.forEach(c => {
            let groupKey = getBaseSubjectName(c.mon);
            if (!groupedByMon[groupKey]) { groupedByMon[groupKey] = []; }
            groupedByMon[groupKey].push(c);
        });

        let groupOrder = [];
        for (let key in groupedByMon) {
            let items = groupedByMon[key];
            let minTime = Number.MAX_SAFE_INTEGER;
            items.forEach(c => {
                let t = getTimeFast(c.ngayBatDau) || Number.MAX_SAFE_INTEGER;
                if (t < minTime) minTime = t;
            });
            groupOrder.push({ key: key, minTime: minTime });
        }

        groupOrder.sort((a, b) => a.minTime - b.minTime);

        let groupIndex = 0;
        // Trong vòng lặp render các nhóm môn học (groupOrder):
for (let g of groupOrder) {
    let key = g.key;
    let items = groupedByMon[key];
    let rowCount = items.length;
    let groupBgColor = (groupIndex % 2 === 0) ? "#dcfce7" : "#e0f2fe";
    groupIndex++;

    // Tự động tìm Mã lớp HP (classId) của môn học này trong nhóm (nếu có)
    let foundClassId = items.find(item => item.classId && String(item.classId).trim() !== "")?.classId;
    let baseNameDisplay = foundClassId ? `${foundClassId} - ${key}` : key;

    items.sort((a, b) => {
        let tA = getTimeFast(a.ngayBatDau) || 0;
        let tB = getTimeFast(b.ngayBatDau) || 0;
        if (tA !== tB) return tA - tB;
        if (a.isDeadline !== b.isDeadline) return a.isDeadline ? 1 : -1;
        if (a.thu !== b.thu) return a.thu - b.thu;
        return a.tietBd - b.tietBd;
    });

    items.forEach((c, index) => {
        let dateDisplay = '-';
        if (c.ngayBatDau && c.ngayKetThuc) { 
            dateDisplay = (c.ngayBatDau === c.ngayKetThuc) ? c.ngayBatDau : `Từ ${c.ngayBatDau}<br>đến ${c.ngayKetThuc}`; 
        } else if (c.ngayBatDau) { dateDisplay = c.ngayBatDau; } 
        else if (c.ngayKetThuc) { dateDisplay = c.ngayKetThuc; }

        let thuText = "";
        if (parseInt(c.thu) === 8) thuText = "Chủ nhật";
        else if (parseInt(c.thu) === 99) thuText = "-";
        else thuText = "Thứ " + c.thu;

        let rowBg = c.isDeadline ? "background-color: #fff5f6;" : `background-color: ${groupBgColor};`;
        let thoiGianHienThi = c.thoiGian || '-';
        if ((c.hinhThuc || "").toLowerCase().includes("vle")) {
            thoiGianHienThi = "";
        }

        let rawHinhThuc = c.hinhThuc || ""; 
        let extLink = checkAndExtractUrl(rawHinhThuc);
        let coSoDisplay = extLink ? rawHinhThuc.replace(extLink, '').trim() : rawHinhThuc.trim();
        
        if (coSoDisplay.toLowerCase().includes("tự học") || coSoDisplay === "") { 
            coSoDisplay = extLink ? "Truy cập" : "-"; 
        }

        let coSoHtml = extLink 
            ? `<a href="${extLink}" target="_blank" class="fw-bold text-decoration-underline" style="color: #0284c7;" title="Mở liên kết">${coSoDisplay} <i class="fa-solid fa-up-right-from-square ms-1" style="font-size: 11px;"></i></a>`
            : `<span class="fw-bold">${coSoDisplay}</span>`;

        tkbHtml += `<tr style="${rowBg}">`;
        
        // Ô Môn học hiển thị: Mã lớp HP - Tên môn (VD: MATH1234 - HÌNH HỌC VI PHÂN)
        if (index === 0) {
            tkbHtml += `<td rowspan="${rowCount}" class="text-start align-middle fw-bold text-primary" style="font-size: 14.5px; background-color: ${groupBgColor}; border-left: 3px solid var(--primary-color) !important;">${baseNameDisplay}</td>`;
        }
        
        if (c.isDeadline) {
            let isDone = completedList.includes(getDlKey(c));
            let doneBtnHtml = `<button class="btn btn-sm ${isDone ? 'btn-success' : 'btn-outline-secondary'} fw-bold" onclick="toggleDeadlineComplete('${getDlKey(c)}', event)"><i class="fa-solid ${isDone ? 'fa-check-double' : 'fa-square'}"></i> ${isDone ? 'Đã xong' : 'Chưa làm'}</button>`;

            tkbHtml += `
                <td class="text-center align-middle fw-bold text-dark">-</td>
                <td class="text-center align-middle"><span class="badge bg-danger">DEADLINE</span></td>
                <td class="text-center align-middle">${coSoHtml}</td>
                <td class="text-center fw-bold text-danger align-middle">${thoiGianHienThi}</td>
                <td class="text-center align-middle" style="font-size: 13.5px;">${dateDisplay}</td>
                <td class="text-center align-middle">${doneBtnHtml}</td>
                <td class="align-middle">-</td>
                <td class="text-center align-middle">
                    <button class="btn btn-sm btn-warning font-weight-bold py-1 px-2 me-1 mb-1" onclick="closeAndOpenEditDeadline('${c.sheetRowIndex}')"><i class="fa-solid fa-pen"></i> Sửa</button>
                    <button class="btn btn-sm btn-danger font-weight-bold py-1 px-2 me-1 mb-1" onclick="deletePersonalDeadline('${c.sheetRowIndex}')"><i class="fa-solid fa-trash"></i> Xóa</button>
                </td>
            </tr>`;
        } else {
            let noteBadge = getNoteFromSubject(c); 
            
            let phongDisplayHtml = c.phong || '-';
            if ((c.hinhThuc || '').toUpperCase().includes('VLE')) {
                let isDone = completedList.includes(getDlKey(c));
                phongDisplayHtml = `<button class="btn btn-sm ${isDone ? 'btn-success' : 'btn-outline-secondary'} fw-bold" onclick="toggleDeadlineComplete('${getDlKey(c)}', event)"><i class="fa-solid ${isDone ? 'fa-check-double' : 'fa-square'}"></i> ${isDone ? 'Đã xong' : 'Chưa làm'}</button>`;
            }

            tkbHtml += `
                <td class="text-center align-middle fw-bold text-dark">${thuText}</td>
                <td class="text-center align-middle">${noteBadge}</td>
                <td class="text-center align-middle">${coSoHtml}</td>
                <td class="text-center fw-bold text-danger align-middle">${thoiGianHienThi}</td>
                <td class="text-center align-middle" style="font-size: 13.5px;">${dateDisplay}</td>
                <td class="text-center align-middle">${phongDisplayHtml}</td>
                <td class="align-middle">${c.gv || '-'}</td>
                <td class="text-center align-middle">
                    <button class="btn btn-sm btn-warning font-weight-bold py-1 px-2 me-1 mb-1" onclick="closeAndOpenEditTkb('${c.sheetRowIndex}')"><i class="fa-solid fa-pen"></i> Sửa</button>
                    <button class="btn btn-sm btn-danger font-weight-bold py-1 px-2 me-1 mb-1" onclick="promptDeletePersonalTkb('${c.sheetRowIndex}')"><i class="fa-solid fa-trash"></i> Xóa</button>
                </td>
            </tr>`;
        }
    });
}
    }
    $('#tkbManagerListBody').html(tkbHtml);
    $('#manageTkbListModal').modal('show');
}

// ----------------------------------------------------
// HÀM 2: MỞ BẢNG TỔNG HỢP DEADLINE (Đã xóa cột Ngày diễn ra)
// ----------------------------------------------------
function openManageDeadlineListModal() {
    let selectedNH = $('#namHocSelect').val(); let selectedHK = $('#hocKySelect').val();
    let titleSuffix = '';
    let startMonTime = null; let endSunTime = null;
    let filteredTkbData = globalTkbData;
    const getTimeFast = (dateStr) => { let d = parseDateString(dateStr); return d ? d.getTime() : null; };

    let nowTime = new Date().setHours(0, 0, 0, 0); 
    let completedList = getCompletedDeadlines();

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
let tkbSubjectNames = new Set(filteredTkbData.map(c => getBaseSubjectName(c.mon)));
// Cập nhật tiêu đề bảng và chèn thêm nút Thêm Deadline mới
   $('#manageDeadlineListModal .modal-title').html(`
        <span class="me-3"><i class="fa-solid fa-thumbtack me-2"></i>Bảng Tổng hợp Deadline${titleSuffix}</span>
        <button class="btn btn-sm btn-light text-danger fw-bold" onclick="$('#manageDeadlineListModal').modal('hide'); setTimeout(() => openAddDeadlineModal(), 400);"><i class="fa-solid fa-plus"></i> Thêm Deadline mới</button>
    `);
    
    let dlHtml = '';
    let filteredDeadlines = [];

    // 1. Lấy danh sách tên các Deadline thật đã có (để check trùng)
    let existingDeadlineNames = (globalDeadlineData || []).map(d => getBaseSubjectName(d.title));

    // 2. Tạo Deadline ảo từ các môn VLE TỰ NHẬP trong TKB
    let virtualManualVLEs = [];
    if (typeof globalTkbData !== 'undefined') {
        globalTkbData.forEach(c => {
            if (!c.isSystem && (c.hinhThuc || '').toUpperCase().includes('VLE')) {
                // Chỉ hiển thị bên Deadline nếu CHƯA có học phần trùng tên
                if (!existingDeadlineNames.includes(getBaseSubjectName(c.mon))) {
                    let durationStr = (c.ngayBatDau && c.ngayKetThuc && c.ngayBatDau !== c.ngayKetThuc) ? 
                                      `Từ ${c.ngayBatDau} đến ${c.ngayKetThuc}` : (c.ngayBatDau || "Chưa rõ");
                    virtualManualVLEs.push({
                        title: c.mon,
                        duration: durationStr,
                        tag: c.hinhThuc,
                        icon: "primary",
                        emoji: "🌐",
                        dateStart: c.ngayBatDau || "",
                        dateEnd: c.ngayKetThuc || "",
                        sheetRowIndex: c.sheetRowIndex,
                        isSystem: c.isSystem,
                        isVirtualVLE: true // Gắn cờ để xử lý nút bấm
                    });
                }
            }
        });
    }

    // 3. Gộp data và tiến hành lọc theo thời gian
   let combinedDeadlineData = [...(globalDeadlineData || []), ...virtualManualVLEs];

    if (combinedDeadlineData.length > 0) {
        filteredDeadlines = combinedDeadlineData.filter(d => {
            let searchStr = ((d.tag || "") + " " + (d.title || "")).toLowerCase();
            
            // Ẩn VLE nếu là của HỆ THỐNG (VLE tự nhập sẽ được đi tiếp)
           // Ẩn VLE/Tiểu luận nếu môn này ĐÃ XUẤT HIỆN bên bảng TKB
if ((searchStr.includes('vle') || searchStr.includes('tiểu luận')) && tkbSubjectNames.has(getBaseSubjectName(d.title))) {
    return false;
}

            // ---> 2. THÊM ĐOẠN NÀY: Ẩn VLE/Tiểu luận nếu môn này ĐÃ XUẤT HIỆN bên bảng TKB <---
            if ((searchStr.includes('vle') || searchStr.includes('tiểu luận')) && tkbSubjectNames.has(getBaseSubjectName(d.title))) {
                return false;
            }

            if (startMonTime && endSunTime) {
                let dStartTime = getTimeFast(d.dateStart); 
                let dEndTime = getTimeFast(d.dateEnd);
                if (!dStartTime && !dEndTime) return true;
                if (dStartTime && dEndTime) return dStartTime <= endSunTime && dEndTime >= startMonTime;
                if (dStartTime) return dStartTime <= endSunTime;
                if (dEndTime) return dEndTime >= startMonTime;
                return true;
            } 
            return true;
        });
    }

    if (filteredDeadlines.length === 0) {
        let emptyMsg = (selectedNH && selectedHK) ? `Không có Deadline nào trong ${selectedHK} năm học ${selectedNH}!` : "Chưa có Deadline nào được tạo!";
        dlHtml += `<tr><td colspan="5" class="text-center text-muted py-4 bg-white">${emptyMsg}</td></tr>`;
    } else {
        // SẮP XẾP ƯU TIÊN: Đang diễn ra -> Chưa làm -> Đã xong
        filteredDeadlines.sort((a, b) => {
            let isDoneA = completedList.includes(getDlKey(a)) ? 1 : 0;
            let isDoneB = completedList.includes(getDlKey(b)) ? 1 : 0;

            // 1. Đã xong đẩy xuống cuối
            if (isDoneA !== isDoneB) return isDoneA - isDoneB;

            let startA = getTimeFast(a.dateStart) || 0;
            let endA = getTimeFast(a.dateEnd) || startA;
            let startB = getTimeFast(b.dateStart) || 0;
            let endB = getTimeFast(b.dateEnd) || startB;

            let isHappeningA = (nowTime >= startA && nowTime <= endA) ? 1 : 0;
            let isHappeningB = (nowTime >= startB && nowTime <= endB) ? 1 : 0;

            // 2. Đang diễn ra lên đầu
            if (isHappeningA !== isHappeningB) return isHappeningB - isHappeningA;

            return startA - startB;
        });

        filteredDeadlines.forEach(c => {
            let isDone = completedList.includes(getDlKey(c));
            let startT = getTimeFast(c.dateStart) || 0;
            let endT = getTimeFast(c.dateEnd) || startT;
            let isHappeningNow = (nowTime >= startT && nowTime <= endT);

            let rowBgColor = isDone ? "background-color: #f1f5f9 !important; opacity: 0.6;" : (isHappeningNow ? "background-color: #f0fdf4 !important;" : "background-color: #f8fafc !important;");
            let titleStyle = isDone ? "text-decoration: line-through; color: #64748b;" : "color: #1e293b;";
            let happeningBadge = (!isDone && isHappeningNow) ? `<span class="badge bg-success text-white mb-1"><i class="fa-solid fa-bolt"></i> Đang diễn ra</span><br>` : '';

            let extLinkTitle = checkAndExtractUrl(c.title || "");
            let extLinkTag = checkAndExtractUrl(c.tag || "");
            let extLink = extLinkTitle || extLinkTag;
            
            let displayTitle = c.title || "";
            let displayTag = c.tag || "Khác";
            
            if (extLinkTitle) displayTitle = displayTitle.replace(extLinkTitle, '').trim();
            if (extLinkTag) displayTag = displayTag.replace(extLinkTag, '').trim();
            if (displayTag === "") displayTag = "Truy cập";

            let tagHtml = extLink 
                ? `<a href="${extLink}" target="_blank" class="fw-bold text-decoration-underline" style="color: #0284c7;" title="Mở liên kết">${displayTag} <i class="fa-solid fa-up-right-from-square ms-1" style="font-size: 11px;"></i></a>` 
                : `<span class="fw-bold text-dark">${displayTag}</span>`;
		
            let actionButtonsHtml = '';
            if (c.isSystem) {
    actionButtonsHtml = `<span class="badge bg-secondary"><i class="fa-solid fa-lock"></i> Hệ thống</span>`;
} else if (c.isVirtualVLE) {
                // Nút sửa/xóa điều hướng về TKB cho VLE tự nhập
                actionButtonsHtml = `
                    <button class="btn btn-sm btn-warning font-weight-bold py-1 px-2 me-1 mb-1" onclick="closeAndOpenEditTkb('${c.sheetRowIndex}')"><i class="fa-solid fa-pen"></i> Sửa</button>
                    <button class="btn btn-sm btn-danger font-weight-bold py-1 px-2 me-1 mb-1" onclick="$('#manageDeadlineListModal').modal('hide'); setTimeout(() => { promptDeletePersonalTkb('${c.sheetRowIndex}'); }, 400);"><i class="fa-solid fa-trash"></i> Xóa</button>
                `;
            } else {
                // Nút sửa/xóa mặc định cho Deadline
                actionButtonsHtml = `
                    <button class="btn btn-sm btn-warning font-weight-bold py-1 px-2 me-1 mb-1" onclick="closeAndOpenEditDeadline('${c.sheetRowIndex}')"><i class="fa-solid fa-pen"></i> Sửa</button>
                    <button class="btn btn-sm btn-danger font-weight-bold py-1 px-2 me-1 mb-1" onclick="deletePersonalDeadline('${c.sheetRowIndex}')"><i class="fa-solid fa-trash"></i> Xóa</button>
                `;
            }

            dlHtml += `<tr>
                <td class="text-center align-middle" style="${rowBgColor}">
                    <button class="btn btn-sm ${isDone ? 'btn-success' : 'btn-outline-secondary'} fw-bold" onclick="toggleDeadlineComplete('${getDlKey(c)}', event)">
                        <i class="fa-solid ${isDone ? 'fa-check-double' : 'fa-square'}"></i> ${isDone ? 'Đã xong' : 'Chưa làm'}
                    </button>
                </td>
                <td class="text-start align-middle fw-bold" style="${rowBgColor} ${titleStyle}">${happeningBadge}${displayTitle}</td>
                <td class="text-center align-middle fw-bold text-danger" style="${rowBgColor}">${c.duration || '-'}</td>
                <td class="text-center align-middle" style="${rowBgColor}">${tagHtml}</td>
                <td class="text-center align-middle" style="${rowBgColor}">
                    ${actionButtonsHtml}
                </td>
            </tr>`;
        });
    }
    $('#deadlineManagerListBody').html(dlHtml);
    $('#manageDeadlineListModal').modal('show');
}

function closeAndOpenEditTkb(sheetRowIndex) { 
    $('#manageTkbListModal').modal('hide'); 
    setTimeout(() => { openEditTkbModal(sheetRowIndex); }, 400); 
}

function closeAndOpenEditDeadline(sheetRowIndex) { 
    $('#manageDeadlineListModal').modal('hide'); 
    setTimeout(() => { openEditDeadlineModal(sheetRowIndex); }, 400); 
}

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

        let extractedClassId = row[12] || ""; 
        let hinhThucRaw = row[4] || "";
        
        // BẢN VÁ CŨ: Cứu dữ liệu classId bị mất thông qua marker '#'
        if (!extractedClassId && hinhThucRaw.includes("#")) {
            let match = hinhThucRaw.match(/#([a-zA-Z0-9_]+)/);
            if (match) {
                extractedClassId = match[1];
                hinhThucRaw = hinhThucRaw.replace(match[0], '').trim();
                row[4] = hinhThucRaw; 
            }
        }

        // ---> THÊM MỚI Ở ĐÂY: Khôi phục classId cho học phần Hệ thống (SYS) <---
        if (isSystemFlag && !extractedClassId) {
            // actualRowIndex có dạng "SYS_MÃHP" (VD: SYS_COMP1013)
            let parts = actualRowIndex.split('_'); 
            if (parts.length >= 2) {
                extractedClassId = parts[1]; // Lấy phần MÃHP
            }
        }
        // -----------------------------------------------------------------------

        return {
            thu: parseInt(row[0]) || 0, tietBd: parseInt(row[1]) || 0, soTiet: parseInt(row[2]) || 1,
            thoiGian: row[3] || "", hinhThuc: row[4] || "", mon: row[5] || "", phong: row[6] || "",
            gv: row[7] || "", color: row[8] || "#e0f2fe", ngayBatDau: row[9] || "", ngayKetThuc: row[10] || "",
            ngayNgoaiLe: row[11] || "", classId: extractedClassId, sheetRowIndex: actualRowIndex, isSystem: isSystemFlag
        };
    }).filter(c => (c.thu >= 2 && c.thu <= 8 && c.tietBd >= 1) || (c.hinhThuc || '').toUpperCase().includes('VLE'));
    
    filterAndRenderTKB();
autoSyncTkbToGpa();
}
function openAddTkbModal(triggerAuthModal = false) {
    if (triggerAuthModal) { $('#userAuthModal').modal('show'); return; }
    $('#tkbModalTitle').html('<i class="fa-solid fa-calendar-plus me-2"></i>Thêm Lịch Học Cá Nhân');
    $('#pTkbRowIndex').val(''); 
    $('#pTkbMaHP, #pTkbMon, #pTkbPhong, #pTkbThoiGian, #pTkbGV, #pTkbNgayBD, #pTkbNgayKT, #pTkbHinhThuc, #pTkbLink, #pTkbNgoaiLe').val('');
    $('#pTkbThu').val(2); $('#pTkbTiet').val(1); $('#pTkbSoTiet').val(3); $('#pTkbColor').val('#e0f2fe');
    $('#pTkbMaHP, #pTkbThu, #pTkbTiet, #pTkbSoTiet, #pTkbPhong, #pTkbThoiGian, #pTkbGV, #pTkbNgayBD, #pTkbNgayKT, #pTkbHinhThuc, #pTkbLink').prop('readonly', false).css('background-color', '#fff');
    $('#tkbOverlapAlert').addClass('d-none');
    $('#tkbPersonalModal').modal('show');
}

function openEditTkbModal(sheetRowIndex) {
    let course = globalTkbData.find(c => String(c.sheetRowIndex) === String(sheetRowIndex)); if (!course) return;
    $('#tkbModalTitle').html('<i class="fa-solid fa-calendar-check me-2"></i>Chỉnh Sửa Lịch Học');
    $('#pTkbRowIndex').val(sheetRowIndex); 
    $('#pTkbMaHP').val(course.classId || ''); // Điền mã lớp HP đã có
    $('#pTkbThu').val(course.thu); $('#pTkbTiet').val(course.tietBd); $('#pTkbSoTiet').val(course.soTiet);
    $('#pTkbMon').val(course.mon); $('#pTkbPhong').val(course.phong); $('#pTkbThoiGian').val(course.thoiGian);
    
    let rawHinhThuc = course.hinhThuc || ""; let extLink = checkAndExtractUrl(rawHinhThuc); let displayHT = rawHinhThuc;
    if(extLink) { displayHT = rawHinhThuc.replace(extLink, '').trim(); }
    $('#pTkbHinhThuc').val(displayHT); $('#pTkbLink').val(extLink || '');
    $('#pTkbGV').val(course.gv); $('#pTkbColor').val(course.color);
    $('#pTkbNgayBD').val(course.ngayBatDau); $('#pTkbNgayKT').val(course.ngayKetThuc); $('#pTkbNgoaiLe').val(course.ngayNgoaiLe); 
    
    if (course.isSystem) {
        $('#pTkbMaHP, #pTkbThu, #pTkbTiet, #pTkbSoTiet, #pTkbPhong, #pTkbThoiGian, #pTkbGV, #pTkbNgayBD, #pTkbNgayKT, #pTkbHinhThuc, #pTkbLink').prop('readonly', true).css('background-color', '#e9ecef');
        $('#tkbOverlapAlert').removeClass('d-none');
        $('#tkbOverlapMessage').html('Học phần hệ thống: Chỉ được phép thêm tiền tố "Kiểm tra...", không thay đổi thời gian/phòng học.');
    } else {
        $('#pTkbMaHP, #pTkbThu, #pTkbTiet, #pTkbSoTiet, #pTkbPhong, #pTkbThoiGian, #pTkbGV, #pTkbNgayBD, #pTkbNgayKT, #pTkbHinhThuc, #pTkbLink').prop('readonly', false).css('background-color', '#fff');
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
        // Tìm lịch học gốc để lấy chính xác 'thu', phục vụ việc tính đúng targetDate
        let originalCourse = globalTkbData.find(c => String(c.sheetRowIndex) === targetRowIndex);
        let originalThu = originalCourse ? originalCourse.thu : (parseInt($('#pTkbThu').val()) || 2);
        
        // Bổ sung 'thu' vào biến pendingEventAction
        pendingEventAction = { type: 'edit', rowIndex: targetRowIndex, thu: originalThu };
        $('#eventScopeModal').modal('show');
    } else {
        pendingEventAction = { type: 'edit', scope: 'all' }; 
        executeSavePersonalTkb();
    }
}
function promptDeletePersonalTkb(sheetRowIndex) {
    let course = globalTkbData.find(c => String(c.sheetRowIndex) === String(sheetRowIndex));
    if (course && course.isSystem) { alert("Khóa bảo mật: Bạn không thể xóa học phần đã được đồng bộ từ hệ thống Đào tạo."); return; }
    
    // Xóa dòng cũ bị thiếu: pendingEventAction = { type: 'delete', rowIndex: sheetRowIndex };
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
    let maHpVal = $('#pTkbMaHP').val().trim();
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

    let finalHinhThuc = $('#pTkbHinhThuc').val().trim(); 
    let linkVal = $('#pTkbLink').val().trim();
    if (linkVal) finalHinhThuc += " " + linkVal;

    // Tự động đính kèm mã lớp HP vào cuối hình thức dưới dạng `#MA_HP`
    let cleanHinhThuc = finalHinhThuc.replace(/#[a-zA-Z0-9_]+/g, '').trim();
    if (maHpVal !== "") {
        finalHinhThuc = cleanHinhThuc + " #" + maHpVal;
    } else {
        finalHinhThuc = cleanHinhThuc;
    }

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
 if (loc.includes("NTD.PHU THO")) return "https://maps.app.goo.gl/2X5Xb5J5jW6Ytugp6";
    if (loc.includes("PHÂN HIỆU LONG AN") || loc.includes("PHLA")) return "https://maps.app.goo.gl/KNwjk6CUQZM44CZ16";
    return "#";
}

function renderTKBTable(courses) {
    const tbody = document.getElementById('tkb-body'); if (!tbody) return;
    const totalRows = 16; const occupied = Array.from({ length: totalRows + 1 }, () => Array(9).fill(false));
    
    // 1. Quét dữ liệu: Xác định các ngày trong tuần có sự kiện/lịch học
    let hasCourse = Array(9).fill(false);
    courses.forEach(c => {
        if (c.thu >= 2 && c.thu <= 8) hasCourse[c.thu] = true;
    });

    // 2. Xác định trọng số (độ rộng) và trạng thái ẩn của từng cột
    let hideDay = Array(9).fill(false);
    let weights = Array(9).fill(1); // Mặc định mỗi cột trọng số là 1 phần

    if (courses.length === 0) {
        // Mặc định lúc load (chưa có sự kiện nào) -> Hiện đều từ T2 đến Chủ Nhật (tất cả trọng số = 1)
    } else if (!hasCourse[8]) {
        // Trường hợp 1: Có sự kiện nhưng Chủ nhật trống -> Ẩn Chủ nhật, Thứ 2 - Thứ 7 chia đều
        hideDay[8] = true;
    } else {
        // Chủ nhật có sự kiện
        let hasEventMonToSat = false;
        for (let i = 2; i <= 7; i++) {
            if (hasCourse[i]) {
                hasEventMonToSat = true;
                break;
            }
        }

        if (!hasEventMonToSat) {
            // Trường hợp 3: Chủ nhật có sự kiện, Thứ 2 - Thứ 7 ĐỀU TRỐNG
            for (let i = 2; i <= 7; i++) weights[i] = 1; // Thu hẹp T2-T7
            weights[8] = 3; // Để Chủ nhật rộng ra (Gấp 3 lần ngày trống)
        } else {
            // Trường hợp 2: Chủ nhật có sự kiện, Thứ 2 - Thứ 7 có ngày trống
            for (let i = 2; i <= 8; i++) {
                if (hasCourse[i]) {
                    weights[i] = 2.5; // Ngày có sự kiện chiếm không gian rộng hơn
                } else {
                    weights[i] = 1; // Ngày trống thu hẹp lại
                }
            }
        }
    }

    // 3. Cập nhật thẻ <th> Header & Cân đối lại tỉ lệ width
    let totalWeight = 0;
    for (let thu = 2; thu <= 8; thu++) {
        if (!hideDay[thu]) totalWeight += weights[thu];
    }

    // Gán CSS Inline Width vào thẻ tiêu đề ngày, bảng table-layout: fixed sẽ tự ép các ô <td> ăn theo
    for (let thu = 2; thu <= 8; thu++) {
        if (hideDay[thu]) {
            $(`#th-day-${thu}`).hide();
        } else {
            let colWidth = `calc((100% - 60px) * ${weights[thu]} / ${totalWeight})`;
            $(`#th-day-${thu}`).show().css("width", colWidth);
        }
    }

    // 4. Render các dòng dữ liệu <tr> <td>
    let tableHtml = "";
    for (let i = 1; i <= totalRows; i++) {
        tableHtml += `<tr>`;
        tableHtml += `<td class="col-tiet">${i}</td>`;
        for (let thu = 2; thu <= 8; thu++) {
            // Nếu ngày bị ẩn thì bỏ qua không tạo thẻ <td>
            if (hideDay[thu]) continue; 

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
                else if (locU.includes("LÊ THỊ RIÊNG") || locU.includes("CVLTR") || locU.includes("NTD.PHU THO")) autoColor = "#fef9c3";
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
               <td rowspan="${len}" class="td-subject" style="background:${autoColor || '#fff'};">
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
            } else { 
                tableHtml += `<td class="day"></td>`; 
            }
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
	if ((c.hinhThuc || '').toUpperCase().includes('VLE')) return false;
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

  // =======================================================================
// MODULE ĐỒNG BỘ TKB HỆ THỐNG - BẢN FIX MỚI NHẤT
// =======================================================================
let globalSystemCourses = [];
let userRegisteredCourseIds = [];
let groupedSystemCourses = {};
let currentSysSubjectKey = "";

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
    // Đảm bảo bật Màn hình 1, ẩn Màn hình 2
    $('#sysScreen2').addClass('d-none');
    $('#sysFooterActions').addClass('d-none');
    $('#sysScreen1').removeClass('d-none');

    $('#systemTkbModal').modal('show');
    $('#systemSubjectsContainer').html('<tr><td colspan="3" class="text-center text-muted py-4"><i class="fa-solid fa-spinner fa-spin fs-3 mb-2"></i><br>Đang tải danh sách học phần...</td></tr>');
    
    $.ajax({
        url: SCRIPT_URL + "?action=getSystemTKBList&mssv=" + currentUser.mssv,
        method: "GET", 
        dataType: "json",
success: function(data) {
    globalSystemCourses = data.allCourses || [];
    // Ép kiểu tất cả ID về dạng String và xóa khoảng trắng thừa
    userRegisteredCourseIds = (data.registeredIds || []).map(id => String(id).trim());
    
    buildSystemFilters();

    let currentMainNH = $('#namHocSelect').val();
    let currentMainHK = $('#hocKySelect').val();
    
    if (currentMainNH) $('#sysNamHocFilter').val(currentMainNH);
    if (currentMainHK) $('#sysHocKyFilter').val(currentMainHK);

    renderSystemCoursesList();
        },
        error: function() {
            $('#systemSubjectsContainer').html('<tr><td colspan="3"><div class="alert alert-danger m-0 text-center">Lỗi khi tải dữ liệu hệ thống! Vui lòng thử lại sau.</div></td></tr>');
        }
    });
}

// HÀM RENDER MÀN HÌNH 1: DANH SÁCH MÔN HỌC (ĐÃ FIX LỖI MẤT BADGE KHI QUAY LẠI)
function renderSystemCoursesList() {
    let container = $('#systemSubjectsContainer');
    let filterNH = $('#sysNamHocFilter').val(); 
    let filterHK = $('#sysHocKyFilter').val();
    
    let filteredCourses = globalSystemCourses.filter(c => {
        let matchNH = filterNH === "" || c.namHoc === filterNH;
        let matchHK = filterHK === "" || c.hocKy === filterHK;
        return matchNH && matchHK;
    });

    if (filteredCourses.length === 0) {
        container.html(`<tr><td colspan="3" class="text-center text-muted py-5"><i class="fa-regular fa-folder-open fs-2 mb-2"></i><br>Hệ thống hiện chưa có môn học nào.</td></tr>`);
        return;
    }

let mergedClasses = {};
    
    filteredCourses.forEach(course => {
        let rawHt = course.hinhThuc || "";
        let extractedUrl = checkAndExtractUrl(rawHt);
        let cleanHt = extractedUrl ? rawHt.replace(extractedUrl, '').trim() : rawHt.trim();

        if (!mergedClasses[course.id]) {
            mergedClasses[course.id] = {
                id: course.id, mon: course.mon, gv: course.gv,
                phongList: [], thoiGianList: [], rawSchedules: [], hinhThucList: [], 
                thoiGianPhongList: [], // Danh sách chuỗi Thứ | Tiết | Phòng
                hinhThuc: "", ngayBatDau: course.ngayBatDau, ngayKetThuc: course.ngayKetThuc,
                ngayNgoaiLe: course.ngayNgoaiLe || "",
                ghiChu: course.ghiChu || ""
            };
            if (cleanHt) mergedClasses[course.id].hinhThucList.push(cleanHt);
        } else {
            let currentStart = parseDateString(mergedClasses[course.id].ngayBatDau);
            let currentEnd = parseDateString(mergedClasses[course.id].ngayKetThuc);
            let newStart = parseDateString(course.ngayBatDau);
            let newEnd = parseDateString(course.ngayKetThuc);
            if (newStart && (!currentStart || newStart < currentStart)) mergedClasses[course.id].ngayBatDau = course.ngayBatDau;
            if (newEnd && (!currentEnd || newEnd > currentEnd)) mergedClasses[course.id].ngayKetThuc = course.ngayKetThuc;
            
            if (cleanHt && !mergedClasses[course.id].hinhThucList.includes(cleanHt)) {
                mergedClasses[course.id].hinhThucList.push(cleanHt);
            }
        }

        let timeStr = (!course.thu || !course.tietBd || isNaN(course.tietBd)) 
            ? "Thời gian tự do (VLE)" 
            : `Thứ ${course.thu} (Tiết ${course.tietBd}-${course.tietBd + course.soTiet - 1})`;

        // --- ĐỊNH DẠNG: Thứ 2 | Tiết 1-3 | Phòng A.313 ---
       // Định dạng chuẩn: Thứ 2 | Tiết 1-3 | Phòng A.313
        let isVle = (!course.thu || !course.tietBd || isNaN(course.tietBd));
        let timeRoomStr = "";

        if (isVle) {
            timeRoomStr = course.phong ? `VLE ` : "Thời gian tự do (VLE)";
        } else {
            let thuStr = course.thu == 8 ? "Chủ nhật" : `Thứ ${course.thu}`;
            let tietEnd = parseInt(course.tietBd) + parseInt(course.soTiet || 1) - 1;
            let tietStr = `Tiết ${course.tietBd}-${tietEnd}`;
            let phongStr = course.phong ? `Phòng ${course.phong}` : "";

            // Ghép lại và ngăn cách bằng dấu gạch đứng " | "
            timeRoomStr = [thuStr, tietStr, phongStr].filter(Boolean).join(' | ');
        }

        if (!mergedClasses[course.id].thoiGianList.includes(timeStr)) {
            mergedClasses[course.id].thoiGianList.push(timeStr);
            mergedClasses[course.id].rawSchedules.push({ thu: course.thu, tietBd: course.tietBd, soTiet: course.soTiet });
        }
        if (!mergedClasses[course.id].phongList.includes(course.phong)) mergedClasses[course.id].phongList.push(course.phong);
        
        if (!mergedClasses[course.id].thoiGianPhongList.includes(timeRoomStr)) {
            mergedClasses[course.id].thoiGianPhongList.push(timeRoomStr);
        }
    });

    for (let id in mergedClasses) {
        let classObj = mergedClasses[id];
        let htList = classObj.hinhThucList;
        let hasNonVle = htList.some(ht => !ht.toUpperCase().includes('VLE'));
        if (hasNonVle) {
            htList = htList.filter(ht => !ht.toUpperCase().includes('VLE'));
        }
        classObj.hinhThuc = htList.join('<br>');
    }
    groupedSystemCourses = {};
    // ...
    for (let id in mergedClasses) {
        let c = mergedClasses[id];
        let subjectName = getBaseSubjectName(c.mon); 
        if (!groupedSystemCourses[subjectName]) {
            groupedSystemCourses[subjectName] = { displayName: c.mon, classes: [] };
        }
        groupedSystemCourses[subjectName].classes.push(c);
    }

    let html = '';
    let globalClaimedTkbRows = []; // BẢN VÁ: Lưu vết các dòng đã được nhận diện

    for (let key in groupedSystemCourses) {
        let subject = groupedSystemCourses[key];
        let syncedCount = 0; 
        let copiedCount = 0;

        subject.classes.forEach(c => {
            let cleanClassId = String(c.id).trim();

            if (userRegisteredCourseIds.some(id => String(id).trim() === cleanClassId)) {
                syncedCount++;
            } else {
                let isCopied = globalTkbData.some(tkb => {
                    if (tkb.isSystem) return false;
                    
                    let hasValidClassId = tkb.classId && String(tkb.classId).trim() !== "";
                    if (hasValidClassId) {
                        if (String(tkb.classId).trim() === cleanClassId) {
                            if (!globalClaimedTkbRows.includes(tkb.sheetRowIndex)) {
                                globalClaimedTkbRows.push(tkb.sheetRowIndex);
                                return true;
                            }
                        }
                        return false;
                    } else {
                        if (getBaseSubjectName(tkb.mon) === getBaseSubjectName(c.mon)) {
                            return c.rawSchedules.some(sch => {
                                let isVle = (c.hinhThuc || '').toUpperCase().includes('VLE');
                                let matchTime = isVle || (tkb.thu == sch.thu && tkb.tietBd == sch.tietBd && tkb.soTiet == sch.soTiet);
                                let matchDate = (tkb.ngayBatDau === c.ngayBatDau) && (tkb.ngayKetThuc === c.ngayKetThuc);
                                
                                // BẢN VÁ: Không bỏ qua check Giảng viên cho VLE nữa
                                let matchGv = true;
                                let tkbGv = String(tkb.gv || "").replace(/-/g, '').trim().toLowerCase();
                                let cGv = String(c.gv || "").replace(/-/g, '').trim().toLowerCase();
                                if (cGv !== "" && tkbGv !== "" && cGv !== tkbGv) matchGv = false;
                                
                                if (matchTime && matchDate && matchGv) {
                                    if (!globalClaimedTkbRows.includes(tkb.sheetRowIndex)) {
                                        globalClaimedTkbRows.push(tkb.sheetRowIndex);
                                        return true;
                                    }
                                }
                                return false;
                            });
                        }
                        return false;
                    }
                });
                if (isCopied) copiedCount++;
            }
        });

        let badgeHtml = '';
        if (syncedCount > 0) badgeHtml += `<span class="badge bg-primary ms-2" title="Đã đồng bộ"><i class="fa-solid fa-link"></i> ${syncedCount}</span>`;
        if (copiedCount > 0) badgeHtml += `<span class="badge bg-success ms-2" title="Đã sao chép"><i class="fa-solid fa-copy"></i> ${copiedCount}</span>`;

        html += `
        <tr style="cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''" onclick="openSubjectDetail('${key}')">
            <td class="text-start fw-bold text-primary align-middle" style="font-size: 15.5px; border-left: 4px solid #0f4c81;">
                <i class="fa-solid fa-folder-open me-2 text-warning"></i> ${subject.displayName} ${badgeHtml}
            </td>
            <td class="text-center align-middle"><span class="badge bg-secondary" style="font-size: 13.5px;">${subject.classes.length} lớp</span></td>
            <td class="text-center align-middle"><button class="btn btn-sm btn-light border text-primary fw-bold">Xem lớp <i class="fa-solid fa-chevron-right ms-1"></i></button></td>
        </tr>
        `;
    }
    
    container.html(html);
}

window.openSubjectDetail = function(subjectKey) {
    currentSysSubjectKey = subjectKey;
    let subject = groupedSystemCourses[subjectKey];
    $('#sysDetailSubjectName').html(`<i class="fa-solid fa-book-open me-2"></i> ${subject.displayName}`);
    
    let html = '';
    let localClaimedTkbRows = []; // BẢN VÁ: Tránh trùng lặp trong nội bộ Detail
    
    subject.classes.forEach(c => {
        let cleanClassId = String(c.id).trim();
        let isSynced = userRegisteredCourseIds.some(id => String(id).trim() === cleanClassId);
        
        let copiedRowIndices = [];
        c.rawSchedules.forEach(sch => {
            globalTkbData.forEach(tkb => {
                if (!tkb.isSystem) {
                    let hasValidClassId = tkb.classId && String(tkb.classId).trim() !== "";
                    
                    if (hasValidClassId) {
                        if (String(tkb.classId).trim() === cleanClassId) {
                            if (!copiedRowIndices.includes(tkb.sheetRowIndex) && !localClaimedTkbRows.includes(tkb.sheetRowIndex)) {
                                copiedRowIndices.push(tkb.sheetRowIndex);
                                localClaimedTkbRows.push(tkb.sheetRowIndex);
                            }
                        }
                    } else {
                        if (getBaseSubjectName(tkb.mon) === getBaseSubjectName(c.mon)) {
                            let isVle = (c.hinhThuc || '').toUpperCase().includes('VLE');
                            let matchTime = isVle || (tkb.thu == sch.thu && tkb.tietBd == sch.tietBd && tkb.soTiet == sch.soTiet);
                            let matchDate = (tkb.ngayBatDau === c.ngayBatDau) && (tkb.ngayKetThuc === c.ngayKetThuc);
                            
                            // BẢN VÁ
                            let matchGv = true;
                            let tkbGv = String(tkb.gv || "").replace(/-/g, '').trim().toLowerCase();
                            let cGv = String(c.gv || "").replace(/-/g, '').trim().toLowerCase();
                            if (cGv !== "" && tkbGv !== "" && cGv !== tkbGv) matchGv = false;
                            
                            if (matchTime && matchDate && matchGv) {
                                if (!copiedRowIndices.includes(tkb.sheetRowIndex) && !localClaimedTkbRows.includes(tkb.sheetRowIndex)) {
                                    copiedRowIndices.push(tkb.sheetRowIndex);
                                    localClaimedTkbRows.push(tkb.sheetRowIndex);
                                }
                            }
                        }
                    }
                }
            });
        });

        let isCopied = !isSynced && (copiedRowIndices.length > 0);
        let rowBg = (isSynced || isCopied) ? "background-color: #f8fafc;" : "background-color: #ffffff;";
       let dateDisplay = (c.ngayBatDau && c.ngayKetThuc) ? `<span style="font-weight: 500; color: #1e293b;">Từ ${c.ngayBatDau}</span><br>đến <span style="font-weight: 500; color: #1e293b;">${c.ngayKetThuc}</span>` : '-';
// --- XỬ LÝ NỘI DUNG CỘT GHI CHÚ ---
        let ghiChuParts = [];
        if (c.ngayNgoaiLe && c.ngayNgoaiLe.trim() !== "") {
            ghiChuParts.push(`<span class="text-danger fw-bold"><i class="fa-solid fa-calendar-xmark me-1"></i>Nghỉ: ${c.ngayNgoaiLe}</span>`);
        }
        if (c.ghiChu && c.ghiChu.trim() !== "") {
            ghiChuParts.push(`<span class="text-muted small">${c.ghiChu}</span>`);
        }
        let ghiChuDisplay = ghiChuParts.length > 0 ? ghiChuParts.join('<br>') : '-';
        let checkboxHtml = '';
        let statusHtml = '';

        if (isSynced) {
            checkboxHtml = `<i class="fa-solid fa-check text-primary fs-5"></i>`;
            statusHtml = `
                <span class="badge bg-primary mb-2 w-100 py-2"><i class="fa-solid fa-link"></i> Đã đồng bộ</span>
                <button class="btn btn-sm btn-outline-danger fw-bold w-100 shadow-sm" onclick="cancelSystemSyncDirect('${c.id}', event)"><i class="fa-solid fa-trash me-1"></i> Hủy</button>
            `;
        } else if (isCopied) {
            checkboxHtml = `<i class="fa-solid fa-check text-success fs-5"></i>`;
            statusHtml = `
                <span class="badge bg-success mb-2 w-100 py-2"><i class="fa-solid fa-copy"></i> Đã sao chép</span>
                <button class="btn btn-sm btn-outline-danger fw-bold w-100 shadow-sm" onclick="cancelPersonalCopyDirect('${copiedRowIndices.join(',')}', event)"><i class="fa-solid fa-trash me-1"></i> Hủy</button>
            `;
        } else {
            checkboxHtml = `<input class="form-check-input system-course-checkbox shadow-sm border-secondary" type="checkbox" value="${c.id}" style="width: 22px; height: 22px; cursor: pointer;" onclick="handleSelectClass('${c.id}', '${subjectKey}', event)">`;
            statusHtml = `<span class="text-muted small">Chưa đăng ký</span>`;
        }

      html += `
        <tr style="cursor: pointer; ${rowBg}" onclick="handleRowClick('${c.id}', '${subjectKey}', ${isSynced}, ${isCopied}, event)">
            <td class="text-center align-middle">${checkboxHtml}</td>
            <td class="text-center fw-bold text-secondary align-middle">${c.id}</td>
            <td class="text-center align-middle">${c.hinhThuc || '-'}</td>
            
            <!-- ĐÃ GỘP CỘT THỨ TIẾT VÀ PHÒNG -->
            <td class="text-center align-middle">
                <span style="font-size: 14.5px; font-weight: 500; color: #1e293b;">${c.thoiGianPhongList.join('<br>')}</span>
            </td>
            
            <td class="text-center text-warning-emphasis fw-bold align-middle">${c.gv || '-'}</td>
            <td class="text-center align-middle" style="font-size: 14.5px;">${dateDisplay}</td>
            <td class="text-center align-middle" style="font-size: 13px;">${ghiChuDisplay}</td>
            <td class="text-center align-middle">${statusHtml}</td>
        </tr>
        `;

    });

    $('#systemClassesContainer').html(html);
    
    $('#sysScreen1').addClass('d-none');
    $('#sysScreen2').removeClass('d-none');
    $('#sysFooterActions').removeClass('d-none');
    
    updateFooterActionButtons(subjectKey);
};

// 2. XỬ LÝ CLICK VÀO DÒNG ĐỂ TÍCH CHỌN LỚP
window.handleRowClick = function(classId, subjectKey, isSynced, isCopied, event) {
    if (isSynced || isCopied) return;
    
    let targetCheckbox = $(`.system-course-checkbox[value="${classId}"]`);
    if (targetCheckbox.length) {
        let currentChecked = targetCheckbox.is(':checked');
        if (!currentChecked) {
            handleSelectClass(classId, subjectKey, event);
        } else {
            targetCheckbox.prop('checked', false);
            updateFooterActionButtons(subjectKey);
        }
    }
};
// BIẾN LƯU VẾT XÁC NHẬN BỎ QUA CẢNH BÁO TRÙNG
let bypassOverlapCheck = false;

// 1. LOGIC CHỌN LỚP (CÓ CẢNH BÁO TRÙNG HỌC PHẦN)
window.handleSelectClass = function(newClassId, subjectKey, event) {
    if (event) event.stopPropagation();

    let subject = groupedSystemCourses[subjectKey];
    let newCourseObj = globalSystemCourses.find(c => c.id === newClassId);

    // Bỏ qua kiểm tra trùng nếu người dùng vừa chọn "Vẫn đăng ký"
    if (newCourseObj && subject && !bypassOverlapCheck) {
        let overlappedMon = checkClassOverlap(newCourseObj, subject.displayName);
        if (overlappedMon) {
            // Chuẩn bị thông báo trùng lịch
            let thuText = newCourseObj.thu === 8 ? "Chủ nhật" : "Thứ " + newCourseObj.thu;
            let tietText = `Tiết ${newCourseObj.tietBd}-${parseInt(newCourseObj.tietBd) + parseInt(newCourseObj.soTiet || 1) - 1}`;
            
            $('#overlapWarningMessage').html(`Lớp học <strong>(${newClassId})</strong> bị trùng lịch (${thuText}, ${tietText}) với học phần <strong class="text-danger">"${overlappedMon}"</strong> trong TKB cá nhân của bạn.`);

            // Nút 1: "Đã hiểu" -> Hủy tích chọn
            $('#btnCancelOverlapAction').off('click').on('click', function() {
                $(`.system-course-checkbox[value="${newClassId}"]`).prop('checked', false);
                updateFooterActionButtons(subjectKey);
            });

            // Nút 2: "Vẫn đăng ký" -> Tiếp tục giữ tích chọn
            $('#btnForceRegisterAction').off('click').on('click', function() {
                bypassOverlapCheck = true; // Bật cờ cho phép trùng
                $('#overlapWarningModal').modal('hide');
                
                // Tích chọn lớp
                $('.system-course-checkbox').prop('checked', false);
                $(`.system-course-checkbox[value="${newClassId}"]`).prop('checked', true);
                updateFooterActionButtons(subjectKey);
                
                // Reset cờ sau khi xử lý xong
                setTimeout(() => { bypassOverlapCheck = false; }, 1000);
            });

            $('#overlapWarningModal').modal('show');
            return;
        }
    }

    // Nếu không trùng lịch hoặc người dùng đã nhấn "Vẫn đăng ký"
    $('.system-course-checkbox').prop('checked', false);
    $(`.system-course-checkbox[value="${newClassId}"]`).prop('checked', true);
    updateFooterActionButtons(subjectKey);
};

// 4. HÀM CẬP NHẬT GIAO DIỆN NÚT CHÂN TRANG (TỰ ĐỔI THÀNH NÚT "CHUYỂN LỚP HỌC")
function updateFooterActionButtons(subjectKey) {
    let subject = groupedSystemCourses[subjectKey];
    if (!subject) return;

    let localClaimedTkbRows = []; // BẢN VÁ

    let existingSyncedClass = subject.classes.find(c => userRegisteredCourseIds.includes(String(c.id).trim()));
    let existingCopiedClass = subject.classes.find(c => {
        let copiedRowIndices = [];
        c.rawSchedules.forEach(sch => {
            globalTkbData.forEach(tkb => {
                if (!tkb.isSystem) {
                    let hasValidClassId = tkb.classId && String(tkb.classId).trim() !== "";
                    
                    if (hasValidClassId) {
                        if (String(tkb.classId).trim() === String(c.id).trim()) {
                            if (!copiedRowIndices.includes(tkb.sheetRowIndex) && !localClaimedTkbRows.includes(tkb.sheetRowIndex)) {
                                copiedRowIndices.push(tkb.sheetRowIndex);
                                localClaimedTkbRows.push(tkb.sheetRowIndex);
                            }
                        }
                    } else {
                        if (getBaseSubjectName(tkb.mon) === getBaseSubjectName(c.mon)) {
                            let isVle = (c.hinhThuc || '').toUpperCase().includes('VLE');
                            let matchTime = isVle || (tkb.thu == sch.thu && tkb.tietBd == sch.tietBd && tkb.soTiet == sch.soTiet);
                            let matchDate = (tkb.ngayBatDau === c.ngayBatDau) && (tkb.ngayKetThuc === c.ngayKetThuc);
                            
                            // BẢN VÁ
                            let matchGv = true;
                            let tkbGv = String(tkb.gv || "").replace(/-/g, '').trim().toLowerCase();
                            let cGv = String(c.gv || "").replace(/-/g, '').trim().toLowerCase();
                            if (cGv !== "" && tkbGv !== "" && cGv !== tkbGv) matchGv = false;
                            
                            if (matchTime && matchDate && matchGv) {
                                if (!copiedRowIndices.includes(tkb.sheetRowIndex) && !localClaimedTkbRows.includes(tkb.sheetRowIndex)) {
                                    copiedRowIndices.push(tkb.sheetRowIndex);
                                    localClaimedTkbRows.push(tkb.sheetRowIndex);
                                }
                            }
                        }
                    }
                }
            });
        });
        return copiedRowIndices.length > 0;
    });

    let existingRegisteredClass = existingSyncedClass || existingCopiedClass;
    let selectedCheckbox = $('.system-course-checkbox:checked');

    if (existingRegisteredClass && selectedCheckbox.length > 0 && selectedCheckbox.val() !== existingRegisteredClass.id) {
        let switchBtnHtml = `
            <button type="button" class="btn text-white px-4 fw-bold shadow-sm" style="background-color: #f97316;" onclick="saveSystemTkbSelection('switch_class')" id="btnSwitchClassMode">
                <i class="fa-solid fa-right-left me-2"></i> Chuyển sang lớp này
            </button>
        `;
        $('#sysFooterActions').html(switchBtnHtml);
    } else {
        let defaultBtnsHtml = `
            <button type="button" class="btn text-white px-3 fw-bold shadow-sm" style="background-color: #0f4c81;" onclick="saveSystemTkbSelection('personal')" id="btnSavePersonalTkbMode">
                <i class="fa-solid fa-copy me-1"></i> Sao chép (Cá nhân)
            </button>
            <button type="button" class="btn text-white px-3 fw-bold shadow-sm ${subject.classes.length === 1 ? '' : 'd-none'}" style="background-color: #0f4c81; border: 1px solid #ffffff;" onclick="saveSystemTkbSelection('system')" id="btnSaveSystemTkb">
                <i class="fa-solid fa-cloud-arrow-down me-1"></i> Đồng bộ (Hệ thống)
            </button>
        `;
        $('#sysFooterActions').html(defaultBtnsHtml);
    }
}

// HÀM QUAY TRỞ LẠI
window.backToSysScreen1 = function() {
    $('#sysScreen2').addClass('d-none');
    $('#sysScreen1').removeClass('d-none');
    $('#sysFooterActions').addClass('d-none');
    renderSystemCoursesList();
}

// HÀM KIỂM TRA TRÙNG LỊCH HỌC (LOẠI TRỪ LỚP VLE)
function checkClassOverlap(newClassObj, subjectDisplayName) {
    let isVle = (newClassObj.hinhThuc || '').toUpperCase().includes('VLE') || 
                (newClassObj.thoiGianList || []).some(t => t.includes('VLE'));
    
    // Nếu là môn VLE -> Ngoại lệ, không xét trùng lịch!
    if (isVle) return null;

    let newThu = parseInt(newClassObj.thu);
    let newTietBd = parseInt(newClassObj.tietBd);
    let newSoTiet = parseInt(newClassObj.soTiet || 1);
    let newTietKt = newTietBd + newSoTiet - 1;

    let newStartDate = parseDateString(newClassObj.ngayBatDau);
    let newEndDate = parseDateString(newClassObj.ngayKetThuc);

    let overlapCourseName = null;

    // Duyệt qua toàn bộ lịch học đang có trong TKB cá nhân
    globalTkbData.forEach(existingCourse => {
        // Bỏ qua chính môn đang xét trùng (đối với trường hợp chuyển lớp)
        if (getBaseSubjectName(existingCourse.mon) === getBaseSubjectName(subjectDisplayName)) return;
        
        // Bỏ qua các môn VLE trong TKB
        if ((existingCourse.hinhThuc || '').toUpperCase().includes('VLE')) return;

        // 1. Kiểm tra trùng Thứ
        if (existingCourse.thu === newThu) {
            let existingTietBd = parseInt(existingCourse.tietBd);
            let existingTietKt = existingTietBd + parseInt(existingCourse.soTiet || 1) - 1;

            // 2. Kiểm tra giao/trùng Tiết học
            let isTietOverlap = Math.max(newTietBd, existingTietBd) <= Math.min(newTietKt, existingTietKt);

            if (isTietOverlap) {
                // 3. Kiểm tra trùng khoảng Thời gian (Ngày Bắt đầu - Kết thúc)
                let isDateOverlap = true;
                if (newStartDate && newEndDate && existingCourse.ngayBatDau && existingCourse.ngayKetThuc) {
                    let exStartDate = parseDateString(existingCourse.ngayBatDau);
                    let exEndDate = parseDateString(existingCourse.ngayKetThuc);

                    if (exStartDate && exEndDate) {
                        isDateOverlap = (newStartDate <= exEndDate && newEndDate >= exStartDate);
                    }
                }

                if (isDateOverlap) {
                    overlapCourseName = existingCourse.mon;
                }
            }
        }
    });

    return overlapCourseName; // Trả về tên môn bị trùng (nếu có)
}
window.saveSystemTkbSelection = function(syncType = 'system') {
    let selectedIds = []; 
    $('.system-course-checkbox:checked').each(function() { selectedIds.push($(this).val()); });
    
    if (selectedIds.length === 0) {
        alert("Vui lòng tích chọn 1 lớp để tiếp tục!");
        return;
    }

    let selectedClassId = selectedIds[0];
    let subject = groupedSystemCourses[currentSysSubjectKey];

    function showRowLoadingState(classId) {
        let targetRow = $(`.system-course-checkbox[value="${classId}"]`).closest('tr');
        if (targetRow.length) {
            let statusCell = targetRow.find('td:last-child');
            statusCell.html(`
                <span class="badge bg-warning text-dark py-2 w-100 shadow-sm">
                    <i class="fa-solid fa-spinner fa-spin me-1"></i> Đang xử lý...
                </span>
            `);
        }
    }

    // ==========================================================
    // 1. CHẾ ĐỘ: CHUYỂN LỚP HỌC
    // ==========================================================
  // CẬP NHẬT TRONG saveSystemTkbSelection (Khối switch_class)
if (syncType === 'switch_class') {
    let existingSyncedClass = subject.classes.find(c => userRegisteredCourseIds.includes(String(c.id).trim()));
    let existingCopiedClass = subject.classes.find(c => {
        return globalTkbData.some(tkb => String(tkb.classId).trim() === String(c.id).trim() || 
           (!tkb.isSystem && getBaseSubjectName(tkb.mon) === getBaseSubjectName(c.mon)));
    });

    let oldClassId = existingSyncedClass ? existingSyncedClass.id : (existingCopiedClass ? existingCopiedClass.id : "");
    let msgHtml = `Bạn có chắc chắn muốn <strong class="text-danger">HỦY</strong> đăng ký lớp cũ <strong>(${oldClassId})</strong> và <strong class="text-success">CHUYỂN SANG</strong> lớp mới <strong>(${selectedClassId})</strong> không?`;
    $('#confirmSwitchMessage').html(msgHtml);

    $('#btnConfirmSwitchClassAction').off('click').on('click', function() {
        $('#confirmSwitchClassModal').modal('hide');
        showRowLoadingState(selectedClassId);

        let btn = $('#btnSwitchClassMode');
        if (btn.length) btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang chuyển lớp...').prop('disabled', true);

        if (existingSyncedClass) {
            // 1. NẾU LỚP CŨ LÀ ĐỒNG BỘ HỆ THỐNG -> LỚP MỚI CŨNG LÀ ĐỒNG BỘ
            userRegisteredCourseIds = userRegisteredCourseIds.filter(id => String(id).trim() !== String(existingSyncedClass.id).trim());
            if (!userRegisteredCourseIds.includes(String(selectedClassId).trim())) {
                userRegisteredCourseIds.push(String(selectedClassId).trim());
            }
            
            // XÓA NGAY lớp cũ khỏi bộ nhớ đệm (RAM) để tránh lỗi hiển thị "bóng ma"
            globalTkbData = globalTkbData.filter(tkb => !(tkb.isSystem && String(tkb.classId).trim() === String(existingSyncedClass.id).trim()));
            
            postToGAS({ action: "saveSystemTkbSelection", mssv: currentUser.mssv, courseIds: userRegisteredCourseIds.join(',') }, function() {
                loadThoiGianBieu(); 
                loadDeadlines();
                setTimeout(() => {
                    openSubjectDetail(currentSysSubjectKey);
                    alert("Đã chuyển lớp thành công (Trạng thái: Đã đồng bộ)!");
                }, 500);
            }, function() {
                alert("Lỗi kết nối máy chủ!");
                openSubjectDetail(currentSysSubjectKey);
            });
            
       } else if (existingCopiedClass) {
            let indicesToDelete = [];
            
            // QUÉT DỌN TRIỆT ĐỂ LỚP CŨ THEO TÊN MÔN
            globalTkbData.forEach(tkb => {
                let isTarget = !tkb.isSystem && getBaseSubjectName(tkb.mon) === getBaseSubjectName(subject.displayName);
                if (isTarget && tkb.sheetRowIndex && String(tkb.sheetRowIndex).indexOf("TEMP_") === -1) {
                    indicesToDelete.push(tkb.sheetRowIndex);
                }
            });

            let copyNewClassFunc = function() {
                let coursesToCopyRaw = globalSystemCourses.filter(c => String(c.id).trim() === String(selectedClassId).trim());
                if (coursesToCopyRaw.length > 0) {
                    let coursesToCopy = coursesToCopyRaw.map(newCourseObj => {
                        let isVle = (newCourseObj.hinhThuc || '').toUpperCase().includes('VLE');
                        let baseHinhThuc = newCourseObj.hinhThuc || (isVle ? "VLE" : "");
                        let cleanHinhThuc = baseHinhThuc.replace(/#[a-zA-Z0-9_]+/g, '').trim();
                        
                        return {
                            id: newCourseObj.id,
                            classId: newCourseObj.id,
                            mon: newCourseObj.mon,
                            thu: newCourseObj.thu || (isVle ? 99 : 2),
                            tietBd: newCourseObj.tietBd || (isVle ? 99 : 1),
                            soTiet: newCourseObj.soTiet || 1,
                            thoiGian: newCourseObj.thoiGian || (isVle ? "VLE" : ""),
                            hinhThuc: cleanHinhThuc + " #" + newCourseObj.id,
                            phong: newCourseObj.phong || (isVle ? "VLE" : ""),
                            gv: newCourseObj.gv || "",
                            color: newCourseObj.color || "#e0f2fe",
                            ngayBatDau: newCourseObj.ngayBatDau || "",
                            ngayKetThuc: newCourseObj.ngayKetThuc || "",
                            ngayNgoaiLe: newCourseObj.ngayNgoaiLe || ""
                        };
                    });

                    postToGAS({ action: "copySystemTkbToPersonal", mssv: currentUser.mssv, courses: coursesToCopy }, function(res) {
                        // BẮT BUỘC TẢI LẠI TRỰC TIẾP TỪ SERVER ĐỂ LẤY ID THẬT
                        $.ajax({
                            url: SCRIPT_URL + "?action=getTKBUser&mssv=" + currentUser.mssv,
                            method: "GET", dataType: "json", cache: false,
                            success: function(data) {
                                processTKBData(data);
				loadDeadlines();
                                openSubjectDetail(currentSysSubjectKey);
                                alert("Đã chuyển lớp thành công (Trạng thái: Đã sao chép)!");
                            }
                        });
                    }, function() {
                        alert("Lỗi kết nối máy chủ khi đăng ký lớp mới!");
                        openSubjectDetail(currentSysSubjectKey);
                    });
                }
            };

            if (indicesToDelete.length > 0) {
                postToGAS({ action: "deleteMultipleTKBRows", rowIndices: indicesToDelete.join(','), mssv: currentUser.mssv }, function() { copyNewClassFunc(); }, function() { copyNewClassFunc(); });
            } else { 
                copyNewClassFunc(); 
            }
        }
    });

    $('#confirmSwitchClassModal').modal('show');
    return;
}
    // ==========================================================
    // 2. CHẾ ĐỘ: ĐỒNG BỘ HỆ THỐNG
    // ==========================================================
    if (syncType === 'system') {
        let btn = $('#btnSaveSystemTkb'); 
        let originalText = btn.html();
        btn.html('<i class="fa-solid fa-spinner fa-spin me-1"></i> Đang xử lý...').prop('disabled', true);
        showRowLoadingState(selectedClassId);

        let newArray = [...userRegisteredCourseIds];
        selectedIds.forEach(id => { 
            let cleanId = String(id).trim();
            if(!newArray.includes(cleanId)) newArray.push(cleanId); 
        });

        postToGAS({ action: "saveSystemTkbSelection", mssv: currentUser.mssv, courseIds: newArray.join(',') }, function(res) {
            userRegisteredCourseIds = newArray; 
            btn.html(originalText).prop('disabled', false); 
            openSubjectDetail(currentSysSubjectKey);
            alert("Đã đồng bộ thành công!"); 
            loadThoiGianBieu(); loadDeadlines();
        }, function() {
            alert("Lỗi kết nối máy chủ!");
            btn.html(originalText).prop('disabled', false);
            openSubjectDetail(currentSysSubjectKey);
        });
    } 
   // ==========================================================
    // 3. CHẾ ĐỘ: SAO CHÉP (CÁ NHÂN) - ĐÃ FIX CHÍNH XÁC PHÂN BIỆT SAO CHÉP
    // ==========================================================
   else if (syncType === 'personal') {
        let btn = $('#btnSavePersonalTkbMode'); 
        let originalText = btn.html();
        btn.html('<i class="fa-solid fa-spinner fa-spin me-1"></i> Đang chép...').prop('disabled', true);
        showRowLoadingState(selectedClassId);

        let coursesToCopy = globalSystemCourses.filter(c => selectedIds.includes(String(c.id))).map(c => {
            let isVle = (c.hinhThuc || '').toUpperCase().includes('VLE');
            let baseHinhThuc = c.hinhThuc || (isVle ? "VLE" : "");
            let cleanHinhThuc = baseHinhThuc.replace(/#[a-zA-Z0-9_]+/g, '').trim();
            
            return {
                id: c.id, 
                classId: c.id,
                mon: c.mon,
                thu: c.thu || (isVle ? 99 : 2),
                tietBd: c.tietBd || (isVle ? 99 : 1),
                soTiet: c.soTiet || 1,
                thoiGian: c.thoiGian || (isVle ? "VLE" : ""),
                hinhThuc: cleanHinhThuc + " #" + c.id, 
                phong: c.phong || (isVle ? "VLE" : ""),
                gv: c.gv || "", color: c.color || "#e0f2fe",
                ngayBatDau: c.ngayBatDau || "", ngayKetThuc: c.ngayKetThuc || "", ngayNgoaiLe: c.ngayNgoaiLe || ""
            };
        });

        postToGAS({ action: "copySystemTkbToPersonal", mssv: currentUser.mssv, courses: coursesToCopy }, function(res) {
            // KHÔNG DÙNG TEMP_ NỮA, ÉP TẢI LẠI TỪ SERVER ĐỂ CÓ DATA THẬT
            $.ajax({
                url: SCRIPT_URL + "?action=getTKBUser&mssv=" + currentUser.mssv,
                method: "GET", dataType: "json", cache: false,
                success: function(data) {
                    processTKBData(data);
		loadDeadlines();
                    btn.html(originalText).prop('disabled', false);
                    openSubjectDetail(currentSysSubjectKey);
                    alert("Đã sao chép thành công!");
                }
            });
        }, function() {
            alert("Lỗi kết nối máy chủ!");
            btn.html(originalText).prop('disabled', false);
            openSubjectDetail(currentSysSubjectKey);
        });
    }
};

// 1. HỦY ĐỒNG BỘ HỆ THỐNG (DÙNG MODAL CHUYÊN NGHIỆP)
window.cancelSystemSyncDirect = function(courseId, event) {
    if (event) event.stopPropagation();
    
    $('#confirmCancelSyncMessage').html(`Bạn có chắc muốn <strong class="text-danger">HỦY ĐỒNG BỘ</strong> toàn bộ các buổi học của lớp <strong>(${courseId})</strong> khỏi Thời khóa biểu không?`);
    
    $('#btnConfirmCancelSyncAction').off('click').on('click', function() {
        $('#confirmCancelSyncModal').modal('hide');
        
        // Hiện Spinner Loading ở ô trạng thái dòng đó
        let targetRow = $(`.system-course-checkbox[value="${courseId}"]`).closest('tr');
        if (!targetRow.length) targetRow = $(`button[onclick*="${courseId}"]`).closest('tr');
        if (targetRow.length) {
            targetRow.find('td:last-child').html(`
                <span class="badge bg-warning text-dark py-2 w-100 shadow-sm">
                    <i class="fa-solid fa-spinner fa-spin me-1"></i> Đang hủy...
                </span>
            `);
        }

        userRegisteredCourseIds = userRegisteredCourseIds.filter(id => id !== courseId);
        
        postToGAS({ action: "saveSystemTkbSelection", mssv: currentUser.mssv, courseIds: userRegisteredCourseIds.join(',') }, function(res) {
            openSubjectDetail(currentSysSubjectKey);
            alert("Đã hủy đồng bộ!");
            loadThoiGianBieu();
            loadDeadlines();
        }, function() {
            alert("Lỗi kết nối máy chủ!"); 
            openSubjectDetail(currentSysSubjectKey);
        });
    });

    $('#confirmCancelSyncModal').modal('show');
};

// 2. HỦY SAO CHÉP CÁ NHÂN (DÙNG MODAL CHUYÊN NGHIỆP)
window.cancelPersonalCopyDirect = function(rowIndicesStr, event) {
    if (event) event.stopPropagation();
    
    let subjectObj = groupedSystemCourses[currentSysSubjectKey];
    let indicesToDelete = [];

    // QUÉT DỌN TRIỆT ĐỂ: Tìm TẤT CẢ các dòng sao chép cá nhân CÙNG TÊN MÔN
    if (subjectObj) {
        globalTkbData.forEach(tkb => {
            let isTarget = !tkb.isSystem && getBaseSubjectName(tkb.mon) === getBaseSubjectName(subjectObj.displayName);
            // Loại bỏ các dòng TEMP ảo trên RAM
            if (isTarget && tkb.sheetRowIndex && String(tkb.sheetRowIndex).indexOf("TEMP_") === -1) {
                indicesToDelete.push(tkb.sheetRowIndex);
            }
        });
    }

    if (indicesToDelete.length === 0 && rowIndicesStr) {
        indicesToDelete = rowIndicesStr.split(',').map(i => String(i).trim()).filter(i => i.indexOf("TEMP_") === -1 && i !== "");
    }

    if (indicesToDelete.length === 0) {
        alert("Dữ liệu đang được đồng bộ, vui lòng tải lại trang (F5) và thử lại!");
        return;
    }

    $('#confirmCancelSyncMessage').html(`Bạn có chắc muốn <strong class="text-danger">XÓA VĨNH VIỄN</strong> toàn bộ các buổi đã sao chép của môn <strong>${subjectObj ? subjectObj.displayName : ''}</strong> không?`);

    $('#btnConfirmCancelSyncAction').off('click').on('click', function() {
        $('#confirmCancelSyncModal').modal('hide');

        // Bật Spinner Loading trên giao diện
        let targetRows = $('.system-course-checkbox').closest('tr');
        targetRows.find('td:last-child').html(`
            <span class="badge bg-warning text-dark py-2 w-100 shadow-sm">
                <i class="fa-solid fa-spinner fa-spin me-1"></i> Đang xóa...
            </span>
        `);

        postToGAS({ 
            action: "deleteMultipleTKBRows", 
            rowIndices: indicesToDelete.join(','), 
            mssv: currentUser.mssv 
        }, function(res) {
            // ÉP TẢI LẠI TOÀN BỘ DATA TỪ GOOGLE SHEET CHỐNG LỖI BÓNG MA
            $.ajax({
                url: SCRIPT_URL + "?action=getTKBUser&mssv=" + currentUser.mssv,
                method: "GET", dataType: "json", cache: false,
                success: function(data) {
                    processTKBData(data);
		loadDeadlines();
                    openSubjectDetail(currentSysSubjectKey);
                    alert("Đã hủy lớp sao chép cá nhân thành công!");
                }
            });
        }, function() {
            alert("Lỗi kết nối máy chủ khi xóa!");
            openSubjectDetail(currentSysSubjectKey);
        });
    });

    $('#confirmCancelSyncModal').modal('show');
};
// Các hàm quản lý trạng thái Checklist Deadline
function getCompletedDeadlinesKey() {
    let mssv = currentUser ? currentUser.mssv : 'guest';
    return 'completed_deadlines_' + mssv;
}

function getCompletedDeadlines() {
    return JSON.parse(localStorage.getItem(getCompletedDeadlinesKey())) || [];
}

function toggleDeadlineComplete(sheetRowIndex, event) {
    if (event) event.stopPropagation();
    
    let completedList = getCompletedDeadlines();
    let strIdx = String(sheetRowIndex);
    let pos = completedList.indexOf(strIdx);
    
    if (pos > -1) {
        completedList.splice(pos, 1);
    } else {
        completedList.push(strIdx);
    }
    
    // 1. Lưu tạm ở Local Storage để giao diện cập nhật ngay lập tức mà không bị giật
    localStorage.setItem(getCompletedDeadlinesKey(), JSON.stringify(completedList));
    
    // 2. Cập nhật các UI đang mở
    renderDeadlines();
    if ($('#manageDeadlineListModal').is(':visible')) {
        openManageDeadlineListModal();
    }
    if ($('#manageTkbListModal').is(':visible')) {
        openManageTkbListModal();
    }

    // 3. ĐỒNG BỘ LÊN GOOGLE SHEETS BẰNG API MỚI
    if (currentUser && currentUser.mssv) {
        // Có thể chèn thêm nút loading tùy ý ở đây nếu cần UI/UX mượt hơn
        postToGAS({
            action: "saveCompletedDeadlines",
            mssv: currentUser.mssv,
            completedData: JSON.stringify(completedList)
        }, function(res) {
            console.log("Đồng bộ trạng thái Deadline thành công:", res);
        }, function() {
            console.error("Lỗi khi đồng bộ trạng thái Deadline lên máy chủ!");
        });
    }
}
// =========================================================================
// TÍNH NĂNG: ĐỒNG BỘ LỊCH & XUẤT THỜI KHÓA BIỂU SANG GOOGLE CALENDAR (.ICS)
// =========================================================================

// 1. Hàm lọc và vẽ danh sách Checkbox môn học dựa theo thời gian được chọn
window.renderSyncCourseList = function() {
    let option = $('input[name="exportDataOption"]:checked').val();
    let fromDateStr = $('#expFromDate').val();
    let toDateStr = $('#expToDate').val();

    if (!fromDateStr || !toDateStr) return;

    let fromDate = new Date(fromDateStr + "T00:00:00");
    let toDate = new Date(toDateStr + "T23:59:59");

    let html = '';
    let uniqueCourses = new Set();

    const parseDateFast = (dateStr) => {
        if (!dateStr || dateStr.trim() === "") return null;
        let parts = dateStr.split('/');
        if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
        return null;
    };

    if ((option === 'both' || option === 'tkb') && typeof globalTkbData !== 'undefined') {
        globalTkbData.forEach(c => {
            if ((c.hinhThuc || '').toUpperCase().includes('VLE')) return;

            let startRange = parseDateFast(c.ngayBatDau) || fromDate;
            let endRange = parseDateFast(c.ngayKetThuc) || toDate;

            if (startRange <= toDate && endRange >= fromDate && !uniqueCourses.has(c.mon)) {
                uniqueCourses.add(c.mon);
                html += `<div class="form-check mb-1"><input class="form-check-input sync-item-cb" type="checkbox" value="${c.mon}" id="cb_sync_tkb_${uniqueCourses.size}" checked><label class="form-check-label fw-bold text-dark" for="cb_sync_tkb_${uniqueCourses.size}">${c.mon}</label></div>`;
            }
        });
    }

    if ((option === 'both' || option === 'deadline') && typeof globalDeadlineData !== 'undefined') {
        globalDeadlineData.forEach(d => {
            let title = d.title ? d.title.replace(/(https?:\/\/[^\s]+)/g, '').trim() : 'Nhiệm vụ';
            let startRange = parseDateFast(d.dateStart);
            let endRange = parseDateFast(d.dateEnd) || startRange;

            let isOverlap = true;
            if (startRange && endRange) {
                isOverlap = (startRange <= toDate && endRange >= fromDate);
            }

            if (isOverlap && !uniqueCourses.has(title)) {
                uniqueCourses.add(title);
                html += `<div class="form-check mb-1"><input class="form-check-input sync-item-cb" type="checkbox" value="${title}" id="cb_sync_dl_${uniqueCourses.size}" checked><label class="form-check-label fw-bold text-danger" for="cb_sync_dl_${uniqueCourses.size}">[DL] ${title}</label></div>`;
            }
        });
    }

    if (html === '') html = '<div class="text-muted small text-center p-2">Không có môn học/sự kiện nào trong khoảng thời gian này.</div>';
    $('#syncCourseList').html(html);
    $('#btnToggleSelectAllSync').text("Bỏ chọn tất cả");
};

// 2. Mở Modal & Đăng ký sự kiện onChange
window.openExportCalendarModal = function() {
    if (!currentUser) { alert("Vui lòng đăng nhập để sử dụng tính năng xuất lịch!"); return; }

    let now = new Date();
    let defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let defaultEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 104); // Mặc định dự phòng

    // --- BẮT ĐẦU: LẤY THỜI GIAN THEO HỌC KỲ ĐANG ĐƯỢC CHỌN ---
    let selectedNH = $('#namHocSelect').val(); 
    let selectedHK = $('#hocKySelect').val();
    
    if (selectedNH && selectedHK && typeof globalConfigHK !== 'undefined') {
        let config = globalConfigHK.find(item => item[0] === selectedNH && item[1] === selectedHK);
        if (config) {
            let sDate = parseDateString(config[2]); // Lấy ngày bắt đầu từ cấu hình
            let numAcademicWeeks = parseInt(config[3]); // Số tuần học
            
            if (sDate && numAcademicWeeks) {
                // Tính tổng thời gian = (Số tuần học + Số tuần nghỉ lễ) * 7 ngày
                let breakWeeksCount = (config[4] || "").split(',').filter(w => w.trim() !== "").length;
                let totalDays = (numAcademicWeeks + breakWeeksCount) * 7;
                
                let eDate = new Date(sDate);
                eDate.setDate(eDate.getDate() + totalDays); // Tính ngày kết thúc

                if (now < sDate) {
                    // 1. Chưa tới kỳ: Lấy trọn vẹn từ ngày bắt đầu -> ngày kết thúc
                    defaultStart = new Date(sDate);
                    defaultEnd = new Date(eDate-1);
                } else if (now >= sDate && now <= eDate) {
                    // 2. Đang trong kỳ: Lấy từ hôm nay -> ngày kết thúc
                    defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    defaultEnd = new Date(eDate);
                } else {
                    // 3. Đã qua kỳ (Xem quá khứ): Lấy trọn vẹn từ ngày bắt đầu -> ngày kết thúc
                    defaultStart = new Date(sDate);
                    defaultEnd = new Date(eDate);
                }
            }
        }
    }
    // --- KẾT THÚC XỬ LÝ LẤY THỜI GIAN ---

    const formatISODate = (d) => { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

    $('#expFromDate').val(formatISODate(defaultStart));
    $('#expToDate').val(formatISODate(defaultEnd));

    $('#expFromDate, #expToDate').off('change').on('change', window.renderSyncCourseList);
    $('input[name="exportDataOption"]').off('change').on('change', window.renderSyncCourseList);

    window.renderSyncCourseList();
let isRootAdmin = (currentUser && String(currentUser.mssv).trim() === "51.01.108.008");
    
    let directSyncButtonHtml = '';
    if (isRootAdmin) {
        // Chỉ hiện nút này nếu là admin 51.01.108.008
        directSyncButtonHtml = `
            <button type="button" class="btn text-white fw-bold px-4 flex-grow-1" style="background-color: #16a34a; border-radius: 50px;" id="btnDirectSync" onclick="processDirectCalendarSync()">
                <i class="fa-brands fa-google me-2"></i> Sao chép trực tiếp qua Google
            </button>
        `;
    }

    // Tự động render lại phần chân Modal (.modal-footer) cho phù hợp với phân quyền
    let modalFooterHtml = `
        <button type="button" class="btn btn-light fw-bold px-4" data-bs-dismiss="modal" style="border-radius: 50px;">Hủy</button>
        ${directSyncButtonHtml}
        <button type="button" class="btn text-white fw-bold px-4 flex-grow-1" style="background-color: #0f4c81; border-radius: 50px;" onclick="processExportCalendar()">
            <i class="fa-solid fa-file-export me-2"></i> Tải File (.ics)
        </button>
    `;
    
    // Gắn vào phần footer của modal xuất lịch trong DOM
    $('#exportCalendarModal .modal-footer').html(modalFooterHtml);
    $('#exportCalendarModal').modal('show');
};

window.toggleSelectAllSyncItems = function() {
    let allChecked = $('.sync-item-cb:checked').length === $('.sync-item-cb').length;
    $('.sync-item-cb').prop('checked', !allChecked);
    $('#btnToggleSelectAllSync').text(allChecked ? "Chọn tất cả" : "Bỏ chọn tất cả");
};

function getSyncConfig() {
    let option = $('input[name="exportDataOption"]:checked').val();
    let fromDateStr = $('#expFromDate').val();
    let toDateStr = $('#expToDate').val();
    let selectedItems = [];
    $('.sync-item-cb:checked').each(function() { selectedItems.push($(this).val()); });
    return { option, fromDateStr, toDateStr, selectedItems };
}
// =========================================================================
// HÀM TÍNH TOÁN THỜI GIAN NHẮC NHỞ TỰ ĐỘNG THÔNG MINH THEO QUY ƯỚC MỚI
// =========================================================================
window.applySmartReminders = function(events) {
    let days = {};
    
    // Phân nhóm các sự kiện theo ngày
    events.forEach(evt => {
        if (evt.type === 'ALLDAY') {
            evt.remindersAbsolute = [new Date(evt.startDate.getTime() + 5.5 * 3600000)]; // 5:30 sáng
            evt.reminders = [-330];
            return; 
        }
        let dateKey = `${evt.start.getFullYear()}-${evt.start.getMonth() + 1}-${evt.start.getDate()}`;
        if (!days[dateKey]) days[dateKey] = [];
        days[dateKey].push(evt);
    });

    for (let key in days) {
        let dayEvts = days[key];
        dayEvts.sort((a, b) => a.start.getTime() - b.start.getTime());

        // Phân loại các ca học trong ngày
        let mornings = dayEvts.filter(e => e.start.getHours() < 12);
        let afternoons = dayEvts.filter(e => e.start.getHours() >= 12 && e.start.getHours() < 17);
        let evenings = dayEvts.filter(e => e.start.getHours() >= 17);

        let aftCa1 = afternoons.filter(e => e.start.getHours() < 15);
        let aftCa2 = afternoons.filter(e => e.start.getHours() >= 15);

        // =======================
        // LUẬT CHO BUỔI SÁNG
        // =======================
        if (mornings.length >= 2) {
            // Có từ 2 môn trở lên: Cả 2 môn đều thông báo lúc 7h tối hôm trước
            let prevDay7PM = new Date(mornings[0].start);
            prevDay7PM.setDate(prevDay7PM.getDate() - 1);
            prevDay7PM.setHours(19, 0, 0, 0);
            mornings.forEach(e => e.remindersAbsolute = [new Date(prevDay7PM)]);
        } else if (mornings.length === 1) {
            // Chỉ có 1 môn: Thông báo trước 30/60 phút tùy cơ sở
            let e = mornings[0];
            let loc = (e.location || "").toUpperCase();
            let isMain = loc.includes("AN DƯƠNG VƯƠNG") || loc.includes("ADV") || loc.includes("PHÂN HIỆU LONG AN") || loc.includes("PHLA");
            let offset = isMain ? 30 : 60;
            e.remindersAbsolute = [new Date(e.start.getTime() - offset * 60000)];
        }

        // =======================
        // LUẬT CHO BUỔI CHIỀU
        // =======================
        let aftSharedReminder = null;
        if (afternoons.length >= 2) {
            let mon1 = afternoons[0];
            let loc = (mon1.location || "").toUpperCase();
            let isMain = loc.includes("AN DƯƠNG VƯƠNG") || loc.includes("ADV") || loc.includes("PHÂN HIỆU LONG AN") || loc.includes("PHLA");

            if (isMain) {
                // Cơ sở chính: 30 phút trước khi sự kiện môn 1 bắt đầu
                aftSharedReminder = new Date(mon1.start.getTime() - 30 * 60000);
            } else {
                // Cơ sở khác: Phụ thuộc vào ca sáng
                if (mornings.length === 0) {
                    aftSharedReminder = new Date(mon1.start.getTime() - 60 * 60000);
                } else {
                    let lastMorning = mornings[mornings.length - 1];
                    // Kiểm tra nếu môn sáng kết thúc lúc 11h40 (>= 11h30 cho an toàn thực tế)
                    if (lastMorning.end.getHours() === 11 && lastMorning.end.getMinutes() >= 30) {
                        aftSharedReminder = new Date(mon1.start);
                        aftSharedReminder.setHours(11, 50, 0, 0);
                    } else {
                        // Môn sáng kết thúc trước 11h
                        aftSharedReminder = new Date(mon1.start.getTime() - 60 * 60000);
                    }
                }
            }
            // Gán chung thời điểm thông báo cho môn 1 và môn 2
            afternoons.forEach(e => { e.remindersAbsolute = [new Date(aftSharedReminder)]; });
        } else if (afternoons.length === 1) {
            // Chỉ học 1 môn chiều: Tính như luật 5-15 phút bình thường
            let e = afternoons[0];
            let loc = (e.location || "").toUpperCase();
            let isMain = loc.includes("AN DƯƠNG VƯƠNG") || loc.includes("ADV") || loc.includes("PHÂN HIỆU LONG AN") || loc.includes("PHLA");
            let offset = isMain ? 30 : 60;
            aftSharedReminder = new Date(e.start.getTime() - offset * 60000);
            e.remindersAbsolute = [new Date(aftSharedReminder)];
        }

        // =======================
        // LUẬT CHO BUỔI TỐI
        // =======================
        evenings.forEach(e => {
            e.remindersAbsolute = [];
            let fiveMinsBefore = new Date(e.start.getTime() - 5 * 60000);
            
            if (aftCa1.length > 0 && aftCa2.length > 0) {
                // Buổi chiều học cả 2 ca
                if (aftCa1[0].remindersAbsolute && aftCa1[0].remindersAbsolute.length > 0) {
                    e.remindersAbsolute.push(new Date(aftCa1[0].remindersAbsolute[0]));
                }
                e.remindersAbsolute.push(fiveMinsBefore);
            } else if (aftCa2.length > 0 && aftCa1.length === 0) {
                // Buổi chiều chỉ học ca 2
                if (aftCa2[0].remindersAbsolute && aftCa2[0].remindersAbsolute.length > 0) {
                    e.remindersAbsolute.push(new Date(aftCa2[0].remindersAbsolute[0]));
                }
                e.remindersAbsolute.push(fiveMinsBefore);
            } else {
                // Chiều chỉ học ca 1 (cách rất xa) hoặc không có học chiều
                e.remindersAbsolute.push(new Date(e.start.getTime() - 30 * 60000));
            }
        });
    }

    // Chuyển đổi Ngày Giờ tuyệt đối (Date) thành Số Phút (Số nguyên) cho API của Google Calendar
    events.forEach(evt => {
        if (evt.type !== 'ALLDAY') {
            evt.reminders = evt.remindersAbsolute.map(d => Math.round((evt.start.getTime() - d.getTime()) / 60000));
        }
    });
};

// 3. ĐỒNG BỘ TRỰC TIẾP (KÈM TÍNH TOÁN THÔNG BÁO THÔNG MINH)
window.processDirectCalendarSync = function() {
    let config = getSyncConfig();
    if (!config.fromDateStr || !config.toDateStr) { alert("Vui lòng chọn ngày bắt đầu và kết thúc!"); return; }
    if (config.selectedItems.length === 0) { alert("Vui lòng chọn ít nhất 1 học phần/deadline để đồng bộ!"); return; }

    let fromDate = new Date(config.fromDateStr + "T00:00:00");
    let toDate = new Date(config.toDateStr + "T23:59:59");
    if (fromDate > toDate) { alert("Ngày bắt đầu không được lớn hơn ngày kết thúc!"); return; }

    let events = [];

    // --- XỬ LÝ TKB ---
    if ((config.option === 'both' || config.option === 'tkb') && typeof globalTkbData !== 'undefined') {
        globalTkbData.forEach(c => {
            if (!config.selectedItems.includes(c.mon)) return; 
            if ((c.hinhThuc || '').toUpperCase().includes('VLE')) return; 

            let startRange = parseDateString(c.ngayBatDau) || fromDate;
            let endRange = parseDateString(c.ngayKetThuc) || toDate;
            let curDate = new Date(Math.max(fromDate.getTime(), startRange.getTime()));
            let lastDate = new Date(Math.min(toDate.getTime(), endRange.getTime()));

            let targetDayOfWeek = c.thu === 8 ? 0 : c.thu - 1; 
            let skipDates = (c.ngayNgoaiLe || "").split(',').map(d => d.trim());

            let sH = 7, sM = 0, eH = 9, eM = 30;
            if (c.thoiGian && c.thoiGian.includes('-')) {
                let isPM = /PM/i.test(c.thoiGian);
                let cleanTime = c.thoiGian.replace(/PM|AM/gi, '').replace(/[hgG]/g, ':').replace(/\s+/g, '');
                let times = cleanTime.split('-');
                const parseTimeStr = (tStr) => { let parts = tStr.split(':'); return [parseInt(parts[0]) || 0, parseInt(parts[1]) || 0]; };
                [sH, sM] = parseTimeStr(times[0]); [eH, eM] = parseTimeStr(times[1]);
                if (isPM || (sH >= 1 && sH <= 5)) sH += 12;
                if (isPM || (eH >= 1 && eH <= 5) || (eH < sH)) eH += 12;
            } else if (c.tietBd) {
                let startMinsTotal = 390 + (c.tietBd - 1) * 50; 
                let endMinsTotal = startMinsTotal + (c.soTiet || 1) * 50;
                sH = Math.floor(startMinsTotal / 60); sM = startMinsTotal % 60;
                eH = Math.floor(endMinsTotal / 60); eM = endMinsTotal % 60;
            }

            let validDates = [];
            while (curDate <= lastDate) {
                if (curDate.getDay() === targetDayOfWeek && !skipDates.includes(formatDateDDMMYYYY(curDate))) {
                    validDates.push(new Date(curDate));
                }
                curDate.setDate(curDate.getDate() + 1);
            }

            if (validDates.length > 0) {
                let groups = [];
                let currentGroup = [validDates[0]];

                for (let i = 1; i < validDates.length; i++) {
                    let prevDate = currentGroup[currentGroup.length - 1];
                    let currDate = validDates[i];
                    if (Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24)) === 7) currentGroup.push(currDate);
                    else { groups.push(currentGroup); currentGroup = [currDate]; }
                }
                groups.push(currentGroup);

                groups.forEach(group => {
                    let groupStart = group[0];
                    let startDT = new Date(groupStart); startDT.setHours(sH, sM, 0, 0);
                    let endDT = new Date(groupStart); endDT.setHours(eH, eM, 0, 0);

                    events.push({
                        type: group.length > 1 ? 'RECURRING' : 'TIMED',
                        title: c.mon, start: startDT, end: endDT, count: group.length,
                        location: c.phong ? `Phòng ${c.phong} (${c.hinhThuc || ''})` : (c.hinhThuc || ''),
                        description: `Giảng viên: ${c.gv || 'Chưa cập nhật'}\nHình thức: ${c.hinhThuc || ''}`
                    });
                });
            }
        });
    }

    // --- XỬ LÝ DEADLINE ---
    if ((config.option === 'both' || config.option === 'deadline') && typeof globalDeadlineData !== 'undefined') {
        globalDeadlineData.forEach(d => {
            let title = d.title ? d.title.replace(/(https?:\/\/[^\s]+)/g, '').trim() : 'Nhiệm vụ';
            if (!config.selectedItems.includes(title)) return; 

            let startDateObj = parseDateString(d.dateStart);
            let endDateObj = parseDateString(d.dateEnd) || startDateObj;

            if (startDateObj && endDateObj >= fromDate && startDateObj <= toDate) {
                events.push({
                    type: 'ALLDAY', title: title, startDate: startDateObj, endDate: endDateObj,
                    location: d.tag || '',
                    description: `Hạn chót: ${d.duration || d.dateStart}\nHình thức: ${d.tag || ''}`
                });
            }
        });
    }

  if (events.length === 0) { alert("Không tìm thấy sự kiện nào trong khoảng thời gian đã chọn!"); return; }

    // --- KHỐI TÍNH TOÁN THỜI GIAN NHẮC NHỞ TỰ ĐỘNG THÔNG MINH MỚI ---
    window.applySmartReminders(events);

    let btn = $('#btnDirectSync');
    let originalHtml = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang đồng bộ...').prop('disabled', true);

    postToGAS({ action: "syncToGoogleCalendar", events: events }, function(res) {
        alert(res); $('#exportCalendarModal').modal('hide'); btn.html(originalHtml).prop('disabled', false);
    }, function() {
        alert("Lỗi kết nối máy chủ! Không thể đồng bộ lịch."); btn.html(originalHtml).prop('disabled', false);
    });
};

// 4. XUẤT FILE .ICS
window.processExportCalendar = function() {
    let config = getSyncConfig();
    if (!config.fromDateStr || !config.toDateStr) { alert("Vui lòng chọn ngày bắt đầu và kết thúc!"); return; }
    if (config.selectedItems.length === 0) { alert("Vui lòng chọn ít nhất 1 học phần/deadline!"); return; }

    let fromDate = new Date(config.fromDateStr + "T00:00:00");
    let toDate = new Date(config.toDateStr + "T23:59:59");
    if (fromDate > toDate) { alert("Ngày bắt đầu không được lớn hơn ngày kết thúc!"); return; }

    let events = [];

    // TKB ICS
    if ((config.option === 'both' || config.option === 'tkb') && typeof globalTkbData !== 'undefined') {
        globalTkbData.forEach(c => {
            if (!config.selectedItems.includes(c.mon)) return;
            if ((c.hinhThuc || '').toUpperCase().includes('VLE')) return; 
            
            let startRange = parseDateString(c.ngayBatDau) || fromDate;
            let endRange = parseDateString(c.ngayKetThuc) || toDate;
            let curDate = new Date(Math.max(fromDate.getTime(), startRange.getTime()));
            let lastDate = new Date(Math.min(toDate.getTime(), endRange.getTime()));

            let targetDayOfWeek = c.thu === 8 ? 0 : c.thu - 1; 
            let skipDates = (c.ngayNgoaiLe || "").split(',').map(d => d.trim());

            let sH = 7, sM = 0, eH = 9, eM = 30;
            if (c.thoiGian && c.thoiGian.includes('-')) {
                let isPM = /PM/i.test(c.thoiGian);
                let cleanTime = c.thoiGian.replace(/PM|AM/gi, '').replace(/[hgG]/g, ':').replace(/\s+/g, '');
                let times = cleanTime.split('-');
                const parseTimeStr = (tStr) => { let parts = tStr.split(':'); return [parseInt(parts[0]) || 0, parseInt(parts[1]) || 0]; };
                [sH, sM] = parseTimeStr(times[0]); [eH, eM] = parseTimeStr(times[1]);
                if (isPM || (sH >= 1 && sH <= 5)) sH += 12;
                if (isPM || (eH >= 1 && eH <= 5) || (eH < sH)) eH += 12;
            } else if (c.tietBd) {
                let startMinsTotal = 390 + (c.tietBd - 1) * 50; 
                let endMinsTotal = startMinsTotal + (c.soTiet || 1) * 50;
                sH = Math.floor(startMinsTotal / 60); sM = startMinsTotal % 60;
                eH = Math.floor(endMinsTotal / 60); eM = endMinsTotal % 60;
            }

            let validDates = [];
            while (curDate <= lastDate) {
                if (curDate.getDay() === targetDayOfWeek && !skipDates.includes(formatDateDDMMYYYY(curDate))) {
                    validDates.push(new Date(curDate));
                }
                curDate.setDate(curDate.getDate() + 1);
            }

            if (validDates.length > 0) {
                let groups = [];
                let currentGroup = [validDates[0]];

                for (let i = 1; i < validDates.length; i++) {
                    let prevDate = currentGroup[currentGroup.length - 1];
                    let currDate = validDates[i];
                    if (Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24)) === 7) currentGroup.push(currDate);
                    else { groups.push(currentGroup); currentGroup = [currDate]; }
                }
                groups.push(currentGroup);

                groups.forEach(group => {
                    let groupStart = group[0];
                    let startDT = new Date(groupStart); startDT.setHours(sH, sM, 0, 0);
                    let endDT = new Date(groupStart); endDT.setHours(eH, eM, 0, 0);

                    events.push({
                        type: group.length > 1 ? 'RECURRING' : 'TIMED', 
                        title: c.mon, start: startDT, end: endDT, count: group.length,
                        location: c.phong ? `Phòng ${c.phong} (${c.hinhThuc || ''})` : (c.hinhThuc || ''),
                        description: `Giảng viên: ${c.gv || 'Chưa cập nhật'}\nHình thức: ${c.hinhThuc || ''}`
                    });
                });
            }
        });
    }

    // DEADLINE ICS
    if ((config.option === 'both' || config.option === 'deadline') && typeof globalDeadlineData !== 'undefined') {
        globalDeadlineData.forEach(d => {
            let title = d.title ? d.title.replace(/(https?:\/\/[^\s]+)/g, '').trim() : 'Nhiệm vụ';
            if (!config.selectedItems.includes(title)) return; 

            let startDateObj = parseDateString(d.dateStart);
            let endDateObj = parseDateString(d.dateEnd) || startDateObj;

            if (startDateObj && endDateObj >= fromDate && startDateObj <= toDate) {
                events.push({
                    type: 'ALLDAY', title: title, startDate: startDateObj, endDate: endDateObj,
                    location: d.tag || '',
                    description: `Hạn chót: ${d.duration || d.dateStart}\\nHình thức: ${d.tag || ''}`
                });
            }
        });
    }

    if (events.length === 0) { alert("Không tìm thấy dữ liệu để xuất!"); return; }

   // Tính toán Day Summary thông minh bằng thuật toán mới
    window.applySmartReminders(events);
    
    // Tạo ICS (Không cần truyền dayScheduleSummary nữa vì giờ đã lưu thẳng vào events)
    let icsContent = buildICSContent(events);

    let blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    let link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Lich_Hoc_Deadline_${currentUser.mssv}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    $('#exportCalendarModal').modal('hide');
};

// 5. XÂY DỰNG FILE .ICS KÈM THEO THÔNG BÁO TỰ ĐỘNG THÔNG MINH
window.buildICSContent = function(events) {
    let pad = (n) => String(n).padStart(2, '0');
    const formatLocalICS = (date) => { return date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate()) + 'T' + pad(date.getHours()) + pad(date.getMinutes()) + pad(date.getSeconds()); };
    const formatDateOnlyICS = (date) => { return date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate()); };

    const calculateTriggerOffset = (eventStartDT, alarmTargetDT) => {
        let diffMs = eventStartDT.getTime() - alarmTargetDT.getTime();
        if (diffMs <= 0) return "-PT0M"; 
        let diffMins = Math.floor(diffMs / (1000 * 60));
        let hours = Math.floor(diffMins / 60);
        let mins = diffMins % 60;
        let str = `-PT${hours}H`;
        if (mins > 0) str += `${mins}M`;
        return str;
    };

    let icsLines = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//HocNhomKhoaToan//VN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'X-WR-TIMEZONE:Asia/Ho_Chi_Minh', 'BEGIN:VTIMEZONE', 'TZID:Asia/Ho_Chi_Minh', 'BEGIN:STANDARD',
        'TZOFFSETFROM:+0700', 'TZOFFSETTO:+0700', 'TZNAME:+07', 'DTSTART:19700101T000000', 'END:STANDARD', 'END:VTIMEZONE'
    ];

    events.forEach((evt, idx) => {
        icsLines.push('BEGIN:VEVENT');
        icsLines.push(`UID:evt-${Date.now()}-${idx}@hocnhomtoan.edu.vn`);
        icsLines.push(`DTSTAMP:${formatLocalICS(new Date())}`);
        icsLines.push(`SUMMARY:${evt.title}`);
        if (evt.location) icsLines.push(`LOCATION:${evt.location}`);
        if (evt.description) icsLines.push(`DESCRIPTION:${evt.description}`);

        if (evt.type === 'ALLDAY') {
            let dtStartStr = formatDateOnlyICS(evt.startDate);
            let nextDayAfterEnd = new Date(evt.endDate);
            nextDayAfterEnd.setDate(nextDayAfterEnd.getDate() + 1);
            let dtEndStr = formatDateOnlyICS(nextDayAfterEnd);
            icsLines.push(`DTSTART;VALUE=DATE:${dtStartStr}`);
            icsLines.push(`DTEND;VALUE=DATE:${dtEndStr}`);

            icsLines.push('BEGIN:VALARM');
            icsLines.push('ACTION:DISPLAY');
            icsLines.push(`DESCRIPTION:Nhắc nhở Deadline: ${evt.title}`);
            icsLines.push('TRIGGER;RELATED=START:-PT5H30M'); // Báo trước mốc 0h là sai, vì là AllDay Event StartTime sẽ tính từ 00:00 -> Muốn nhắc 5:30 sáng thì PT5H30M
            icsLines.push('END:VALARM');

        } else {
            icsLines.push(`DTSTART;TZID=Asia/Ho_Chi_Minh:${formatLocalICS(evt.start)}`);
            icsLines.push(`DTEND;TZID=Asia/Ho_Chi_Minh:${formatLocalICS(evt.end)}`);
            if (evt.type === 'RECURRING') {
                icsLines.push(`RRULE:FREQ=WEEKLY;COUNT=${evt.count}`);
            }

            // Sinh mã VALARM dựa trên những mốc thời gian tuyệt đối đã được tính sẵn
            if (evt.remindersAbsolute && evt.remindersAbsolute.length > 0) {
                evt.remindersAbsolute.forEach((reminderDate) => {
                    icsLines.push('BEGIN:VALARM'); 
                    icsLines.push('ACTION:DISPLAY'); 
                    icsLines.push(`DESCRIPTION:Nhắc nhở lịch học: ${evt.title}`);
                    icsLines.push(`TRIGGER:${calculateTriggerOffset(evt.start, reminderDate)}`); 
                    icsLines.push('END:VALARM');
                });
            }
        }
        icsLines.push('END:VEVENT');
    });

    icsLines.push('END:VCALENDAR');
    return icsLines.join('\r\n');
};
window.exportHocNhomTKBToImage = function(event) {
    const tableBox = document.querySelector('.table-box');
    const weekSelect = document.getElementById('weekSelect');
    const namHocSelect = document.getElementById('namHocSelect');
    const hocKySelect = document.getElementById('hocKySelect');
    
    let weekText = "Tuan_Hoc_Nhom";
    let dateRangeText = "";
    
    // Lấy tên Năm học và Học kỳ hiện tại (kiểm tra chặt chẽ index và value rỗng)
    let namHocText = "...";
    if (namHocSelect && namHocSelect.selectedIndex !== -1 && namHocSelect.value !== "") {
        namHocText = namHocSelect.options[namHocSelect.selectedIndex].text;
    }

    let hocKyText = "...";
    if (hocKySelect && hocKySelect.selectedIndex !== -1 && hocKySelect.value !== "") {
        hocKyText = hocKySelect.options[hocKySelect.selectedIndex].text;
    }

    if (weekSelect && weekSelect.selectedIndex !== -1 && weekSelect.value !== "") {
        let rawText = weekSelect.options[weekSelect.selectedIndex].text;
        weekText = rawText.split('(')[0].trim().replace(/\s+/g, '_'); 
        
        // Trích xuất ngày từ chuỗi "Tuần X (DD/MM/YYYY - DD/MM/YYYY)"
        let match = rawText.match(/\((.*?)\)/);
        if (match) {
            dateRangeText = match[1];
        }
    }

    const btn = event.currentTarget || event.target;
    const originalText = btn.innerHTML;
    // Bật trạng thái "Đang xuất..."
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i>Đang xuất...';
    btn.disabled = true;

    // SỬ DỤNG SETTIMEOUT ĐỂ ÉP TRÌNH DUYỆT RENDER CHỮ TRƯỚC KHI CHỤP ẢNH
    setTimeout(() => {
        // 1. Tạo phần tử tiêu đề tạm thời
        const headerDiv = document.createElement('div');
        headerDiv.id = 'temp-export-header';
        headerDiv.style.textAlign = 'center';
        headerDiv.style.marginBottom = '25px'; // Tăng lề dưới cho thoáng
        headerDiv.style.fontFamily = "'Inter', sans-serif";

        // Dòng 1: Chữ to (28px), in đậm, màu xanh chủ đạo của trang (#0f4c81)
        let titleHtml = `<div style="font-size: 28px; font-weight: 900; margin-bottom: 8px; text-transform: uppercase; color: #0f4c81;">THỜI KHÓA BIỂU - ${hocKyText} - NĂM HỌC: ${namHocText}</div>`;
        
        // Dòng 2: Chữ màu đỏ (#dc2626), to (20px) nhưng nhỏ hơn dòng 1
        if (dateRangeText) {
            let dates = dateRangeText.split('-');
            if(dates.length === 2) {
                titleHtml += `<div style="font-size: 20px; font-weight: 700; color: #dc2626;">(Áp dụng từ ngày ${dates[0].trim()} đến ngày ${dates[1].trim()})</div>`;
            } else {
                titleHtml += `<div style="font-size: 20px; font-weight: 700; color: #dc2626;">(Áp dụng: ${dateRangeText})</div>`;
            }
        }
        
        headerDiv.innerHTML = titleHtml;
        
        // Chèn tiêu đề vào đầu khung table-box
        tableBox.insertBefore(headerDiv, tableBox.firstChild);

        // 2. Ép mỏng viền cực đại (0.15px) cho độ phân giải 4K/8K
        const tempStyle = document.createElement('style');
        tempStyle.innerHTML = `
            .sched td { border-width: 0.15px !important; }
            .sched th { border-right-width: 0.15px !important; }
        `;
        document.head.appendChild(tempStyle);

        // Lấy lại các style gốc
        const originalOverflow = tableBox.style.overflowX;
        const originalPadding = tableBox.style.padding;
        const originalBg = tableBox.style.backgroundColor;
        
        tableBox.style.overflowX = 'visible';
        tableBox.style.padding = '30px 20px'; // Thêm padding xung quanh khung chụp ảnh
        tableBox.style.backgroundColor = '#ffffff'; // Nền trắng nguyên khối

        // 3. TIẾN HÀNH CHỤP VỚI SCALE 6 (SIÊU NÉT 4K)
        html2canvas(tableBox, {
            scale: 6, // Hệ số phóng to 6 lần
            backgroundColor: "#ffffff",
            useCORS: true,
            logging: false
        }).then(canvas => {
            // 4. Dọn dẹp DOM (Xóa tiêu đề và khôi phục CSS)
            tableBox.removeChild(headerDiv);
            document.head.removeChild(tempStyle);
            tableBox.style.overflowX = originalOverflow;
            tableBox.style.padding = originalPadding;
            tableBox.style.backgroundColor = originalBg;
            
            const link = document.createElement('a');
            link.download = `TKB_APMA_${weekText}_4K.png`; 
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            
            btn.innerHTML = originalText;
            btn.disabled = false;
        }).catch(err => {
            console.error("Lỗi xuất ảnh:", err);
            alert("Có lỗi xảy ra khi xuất ảnh. Vui lòng tải lại trang và thử lại!");
            
            // Dọn dẹp nếu có lỗi
            if (document.getElementById('temp-export-header')) tableBox.removeChild(headerDiv);
            if (document.head.contains(tempStyle)) document.head.removeChild(tempStyle);
            tableBox.style.overflowX = originalOverflow;
            tableBox.style.padding = originalPadding;
            tableBox.style.backgroundColor = originalBg;
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    }, 100); 
};
let tokenClient;
let studentAccessToken = null;

// Khởi tạo OAuth 2.0 Client khi trang load xong
window.onload = function () {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', // Thay Client ID của bạn vào đây
    scope: 'https://www.googleapis.com/auth/calendar.events', // Quyền thao tác lịch
    callback: (tokenResponse) => {
      if (tokenResponse && tokenResponse.access_token) {
        studentAccessToken = tokenResponse.access_token;
        // Gọi hàm đồng bộ lịch của bạn với token của sinh viên
        syncToStudentCalendar(studentAccessToken); 
      }
    },
  });
};

// Hàm kích hoạt khi sinh viên bấm nút Đồng bộ
function handleSyncCalendarClick() {
  if (!studentAccessToken) {
    // Sẽ bật popup yêu cầu sinh viên đăng nhập và cấp quyền Google Calendar
    tokenClient.requestAccessToken();
  } else {
    syncToStudentCalendar(studentAccessToken);
  }
}

// Gửi token xuống Backend hoặc dùng trực tiếp fetch API để thêm lịch
function syncToStudentCalendar(token) {
  // Logic gọi API đến https://www.googleapis.com/calendar/v3/calendars/primary/events
  // Đính kèm header: Authorization: 'Bearer ' + token
  console.log("Đã lấy được token của SV, đang tiến hành đồng bộ...");
}