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
        let isDoneA = completedList.includes(String(a.sheetRowIndex)) ? 1 : 0;
        let isDoneB = completedList.includes(String(b.sheetRowIndex)) ? 1 : 0;
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
        let isDone = completedList.includes(String(item.sheetRowIndex));
        
        let extLinkTitle = checkAndExtractUrl(item.title);
        let extLinkTag = checkAndExtractUrl(item.tag);
        let extLink = extLinkTitle || extLinkTag;
        
        let displayTitle = item.title;
        let displayTag = item.tag;
        if (extLinkTitle) displayTitle = displayTitle.replace(extLinkTitle, '').trim();
        if (extLinkTag) displayTag = displayTag.replace(extLinkTag, '').trim();
        if (displayTag === "") displayTag = "Truy cập Liên kết";
        
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
            <button class="btn-dl-done ${isDone ? 'is-done' : ''}" onclick="toggleDeadlineComplete('${item.sheetRowIndex}', event)" title="Đánh dấu trạng thái">
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
    $('#pDlTitle, #pDlTag, #pDlLink, #pDlEmoji, #pDlStartDate, #pDlEndDate').val(''); 
    $('#pDlIcon').val('fire');
    $('#deadlinePersonalModal').modal('show');
}

function openEditDeadlineModal(rowIndex) {
    let dl = globalDeadlineData.find(d => String(d.sheetRowIndex) === String(rowIndex)); 
    if(!dl) return;
    
    $('#dlModalTitle').html('<i class="fa-solid fa-pen me-2"></i>Sửa Deadline');
    $('#pDlRowIndex').val(rowIndex); 
    $('#pDlTitle').val(dl.title);
    
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
    let title = $('#pDlTitle').val().trim();

    if (!title || !startDate || !endDate) { 
        alert("Vui lòng nhập Tên công việc và Ngày bắt đầu/Kết thúc!"); 
        return; 
    }
    
    let autoDuration = (startDate === endDate) ? startDate : "Từ " + startDate + " đến " + endDate;
    let isEditMode = (rowIndex !== null && rowIndex !== '');

    // Ghép Hình thức và Link lại
    let finalTag = $('#pDlTag').val().trim();
    let linkVal = $('#pDlLink').val().trim();
    if (linkVal) {
        finalTag += " " + linkVal;
    }

    let payload = {
        action: isEditMode ? "editDeadlineUser" : "addDeadlineUser",
        rowIndex: rowIndex,
        mssv: currentUser.mssv,
        title: title,
        duration: autoDuration,
        tag: finalTag, // Truyền biến đã ghép vào đây
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
                <span class="badge bg-primary fs-6 me-2"><i class="fa-solid fa-user"></i> ${currentUser.name} (${currentUser.mssv})</span>
            </div>
            <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-sm text-white fw-bold" style="background-color: #0f4c81;" onclick="openSystemTkbModal()"><i class="fa-solid fa-cloud-arrow-down"></i> Đồng bộ học phần</button>
                <button class="btn btn-sm text-white fw-bold" style="background-color: #0f4c81;" onclick="openManageTkbListModal()"><i class="fa-solid fa-calendar-days text-info"></i> Lịch học</button>
                <button class="btn btn-sm text-white fw-bold" style="background-color: #dc2626;" onclick="openManageDeadlineListModal()"><i class="fa-solid fa-thumbtack text-warning"></i> Deadline</button>
                <button class="btn btn-sm text-white fw-bold" style="background-color: #0f4c81;" onclick="openAddTkbModal(false)"><i class="fa-solid fa-plus"></i> Thêm lịch mới</button>
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
        for (let g of groupOrder) {
            let key = g.key;
            let items = groupedByMon[key];
            let rowCount = items.length;
            let baseNameDisplay = key;
            let groupBgColor = (groupIndex % 2 === 0) ? "#dcfce7" : "#e0f2fe";
            groupIndex++;

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
                if (index === 0) {
                    tkbHtml += `<td rowspan="${rowCount}" class="text-start align-middle fw-bold text-primary" style="font-size: 15px; background-color: ${groupBgColor}; border-left: 3px solid var(--primary-color) !important;">${baseNameDisplay}</td>`;
                }
                
                if (c.isDeadline) {
                    // XỬ LÝ NÚT CHECKLIST "ĐÃ XONG" CHO CỘT PHÒNG
                    let isDone = completedList.includes(String(c.sheetRowIndex));
                    let doneBtnHtml = `<button class="btn btn-sm ${isDone ? 'btn-success' : 'btn-outline-secondary'} fw-bold" onclick="toggleDeadlineComplete('${c.sheetRowIndex}', event)"><i class="fa-solid ${isDone ? 'fa-check-double' : 'fa-square'}"></i> ${isDone ? 'Đã xong' : 'Chưa làm'}</button>`;

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
                            <button class="btn btn-sm btn-danger font-weight-bold py-1 px-2 mb-1" onclick="deletePersonalDeadline('${c.sheetRowIndex}')"><i class="fa-solid fa-trash"></i> Xóa</button>
                        </td>
                    </tr>`;
                } else {
                    let noteBadge = getNoteFromSubject(c); 
                    
                    tkbHtml += `
                        <td class="text-center align-middle fw-bold text-dark">${thuText}</td>
                        <td class="text-center align-middle">${noteBadge}</td>
                        <td class="text-center align-middle">${coSoHtml}</td>
                        <td class="text-center fw-bold text-danger align-middle">${thoiGianHienThi}</td>
                        <td class="text-center align-middle" style="font-size: 13.5px;">${dateDisplay}</td>
                        <td class="text-center align-middle">${c.phong || '-'}</td>
                        <td class="align-middle">${c.gv || '-'}</td>
                        <td class="text-center align-middle">
                            <button class="btn btn-sm btn-warning font-weight-bold py-1 px-2 me-1 mb-1" onclick="closeAndOpenEditTkb('${c.sheetRowIndex}')"><i class="fa-solid fa-pen"></i> Sửa</button>
                            <button class="btn btn-sm btn-danger font-weight-bold py-1 px-2 mb-1" onclick="promptDeletePersonalTkb('${c.sheetRowIndex}')"><i class="fa-solid fa-trash"></i> Xóa</button>
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

    let filteredTkbSubjectNames = new Set(filteredTkbData.map(c => getBaseSubjectName(c.mon)));

  let dlHtml = '';
    let filteredDeadlines = [];

    // 1. Tạo danh sách Deadline ảo từ các môn VLE cá nhân VÀ hệ thống trong TKB
    let virtualVleDeadlines = globalTkbData.filter(c => (c.hinhThuc || '').toUpperCase().includes('VLE')).map(c => ({
        title: c.mon,
        duration: (c.ngayBatDau && c.ngayKetThuc && c.ngayBatDau !== c.ngayKetThuc) ? `Từ ${c.ngayBatDau} đến ${c.ngayKetThuc}` : (c.ngayBatDau || "Chưa rõ"),
        tag: c.hinhThuc,
        dateStart: c.ngayBatDau || "", 
        dateEnd: c.ngayKetThuc || "",
        sheetRowIndex: c.sheetRowIndex, 
        isSystem: c.isSystem, // <-- Nhận diện chuẩn xác môn hệ thống
        isVirtualVLE: true
    }));

    // 2. Gộp chung Deadline gốc (từ data sheet) với VLE ảo
    let combinedDeadlines = [...globalDeadlineData, ...virtualVleDeadlines];

    // 3. Tiến hành lọc danh sách
    if (combinedDeadlines && combinedDeadlines.length > 0) {
        filteredDeadlines = combinedDeadlines.filter(d => {
            let searchStr = ((d.tag || "") + " " + (d.title || "")).toLowerCase();
            let isVle = searchStr.includes('vle') || searchStr.includes('tiểu luận');
            
            // ẨN môn VLE gốc (môn mà hệ thống load về nhưng bạn không đăng ký)
            if (isVle && !d.isVirtualVLE && d.isSystem) return false;

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
    }
    if (filteredDeadlines.length === 0) {
        let emptyMsg = (selectedNH && selectedHK) ? `Không có Deadline nào trong ${selectedHK} năm học ${selectedNH}!` : "Chưa có Deadline nào được tạo!";
        dlHtml += `<tr><td colspan="5" class="text-center text-muted py-4 bg-white">${emptyMsg}</td></tr>`;
    } else {
        // SẮP XẾP ƯU TIÊN: Đang diễn ra -> Chưa làm -> Đã xong
        filteredDeadlines.sort((a, b) => {
            let isDoneA = completedList.includes(String(a.sheetRowIndex)) ? 1 : 0;
            let isDoneB = completedList.includes(String(b.sheetRowIndex)) ? 1 : 0;

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
            let isDone = completedList.includes(String(c.sheetRowIndex));
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

            dlHtml += `<tr>
                <td class="text-center align-middle" style="${rowBgColor}">
                    <button class="btn btn-sm ${isDone ? 'btn-success' : 'btn-outline-secondary'} fw-bold" onclick="toggleDeadlineComplete('${c.sheetRowIndex}', event)">
                        <i class="fa-solid ${isDone ? 'fa-check-double' : 'fa-square'}"></i> ${isDone ? 'Đã xong' : 'Chưa làm'}
                    </button>
                </td>
                <td class="text-start align-middle fw-bold" style="${rowBgColor} ${titleStyle}">${happeningBadge}${displayTitle}</td>
                <td class="text-center align-middle fw-bold text-danger" style="${rowBgColor}">${c.duration || '-'}</td>
                <td class="text-center align-middle" style="${rowBgColor}">${tagHtml}</td>
                <td class="text-center align-middle" style="${rowBgColor}">
                    <button class="btn btn-sm btn-warning font-weight-bold py-1 px-2 me-1 mb-1" onclick="closeAndOpenEditDeadline('${c.sheetRowIndex}')"><i class="fa-solid fa-pen"></i> Sửa</button>
                    <button class="btn btn-sm btn-danger font-weight-bold py-1 px-2 mb-1" onclick="deletePersonalDeadline('${c.sheetRowIndex}')"><i class="fa-solid fa-trash"></i> Xóa</button>
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

        return {
            thu: parseInt(row[0]) || 0, tietBd: parseInt(row[1]) || 0, soTiet: parseInt(row[2]) || 1,
            thoiGian: row[3] || "", hinhThuc: row[4] || "", mon: row[5] || "", phong: row[6] || "",
            gv: row[7] || "", color: row[8] || "#e0f2fe", ngayBatDau: row[9] || "", ngayKetThuc: row[10] || "",
            ngayNgoaiLe: row[11] || "", sheetRowIndex: actualRowIndex, isSystem: isSystemFlag
        };
    // BỔ SUNG Ở ĐÂY: Cho phép giữ lại nếu là môn VLE
    }).filter(c => (c.thu >= 2 && c.thu <= 8 && c.tietBd >= 1) || (c.hinhThuc || '').toUpperCase().includes('VLE'));
    
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
            userRegisteredCourseIds = data.registeredIds || [];
            
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

// 1. HÀM TẠO MÀN HÌNH 1 (DANH SÁCH MÔN)
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
        if (!mergedClasses[course.id]) {
            mergedClasses[course.id] = {
                id: course.id, mon: course.mon, gv: course.gv,
                phongList: [], thoiGianList: [], rawSchedules: [],
                hinhThuc: course.hinhThuc, ngayBatDau: course.ngayBatDau, ngayKetThuc: course.ngayKetThuc
            };
        } else {
            let currentStart = parseDateString(mergedClasses[course.id].ngayBatDau);
            let currentEnd = parseDateString(mergedClasses[course.id].ngayKetThuc);
            let newStart = parseDateString(course.ngayBatDau);
            let newEnd = parseDateString(course.ngayKetThuc);
            if (newStart && (!currentStart || newStart < currentStart)) mergedClasses[course.id].ngayBatDau = course.ngayBatDau;
            if (newEnd && (!currentEnd || newEnd > currentEnd)) mergedClasses[course.id].ngayKetThuc = course.ngayKetThuc;
        }
       // Bắt lỗi nếu môn VLE không có Thứ và Tiết
        let timeStr = "";
        if (!course.thu || !course.tietBd || isNaN(course.tietBd)) {
            timeStr = "Thời gian tự do (VLE)";
        } else {
            timeStr = `Thứ ${course.thu} (Tiết ${course.tietBd}-${course.tietBd + course.soTiet - 1})`;
        }
        
        if (!mergedClasses[course.id].thoiGianList.includes(timeStr)) {
            mergedClasses[course.id].thoiGianList.push(timeStr);
            mergedClasses[course.id].rawSchedules.push({ thu: course.thu, tietBd: course.tietBd, soTiet: course.soTiet });
        }
        if (!mergedClasses[course.id].phongList.includes(course.phong)) mergedClasses[course.id].phongList.push(course.phong);
    });

    groupedSystemCourses = {};
    for (let id in mergedClasses) {
        let c = mergedClasses[id];
        let subjectName = getBaseSubjectName(c.mon); 
        if (!groupedSystemCourses[subjectName]) {
            groupedSystemCourses[subjectName] = { displayName: c.mon, classes: [] };
        }
        groupedSystemCourses[subjectName].classes.push(c);
    }

    let html = '';
    for (let key in groupedSystemCourses) {
        let subject = groupedSystemCourses[key];
        
        let syncedCount = 0; let copiedCount = 0;
        subject.classes.forEach(c => {
            if (userRegisteredCourseIds.includes(c.id)) syncedCount++;
            let isCopied = false;
c.rawSchedules.forEach(sch => {
    let hasCopy = globalTkbData.some(tkb => {
        if (tkb.isSystem || getBaseSubjectName(tkb.mon) !== getBaseSubjectName(c.mon)) return false;
        let isVle = (c.hinhThuc || '').toUpperCase().includes('VLE');
        return isVle || (tkb.thu == sch.thu && tkb.tietBd == sch.tietBd);
    });
    if (hasCopy) isCopied = true;
});
            if (isCopied) copiedCount++;
        });

        let badgeHtml = '';
        if (syncedCount > 0) badgeHtml += `<span class="badge bg-primary ms-2"><i class="fa-solid fa-link"></i> ${syncedCount}</span>`;
        if (copiedCount > 0) badgeHtml += `<span class="badge bg-success ms-2"><i class="fa-solid fa-copy"></i> ${copiedCount}</span>`;

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

// 2. HÀM MỞ MÀN HÌNH 2 (CHI TIẾT CÁC LỚP)
window.openSubjectDetail = function(subjectKey) {
    currentSysSubjectKey = subjectKey;
    let subject = groupedSystemCourses[subjectKey];
    $('#sysDetailSubjectName').html(`<i class="fa-solid fa-book-open me-2"></i> ${subject.displayName}`);
    
    let html = '';
    subject.classes.forEach(c => {
        let isSynced = userRegisteredCourseIds.includes(c.id);
        
       let copiedRowIndices = [];
        c.rawSchedules.forEach(sch => {
            globalTkbData.forEach(tkb => {
                if (!tkb.isSystem && getBaseSubjectName(tkb.mon) === getBaseSubjectName(c.mon)) {
                    // NẾU LÀ VLE THÌ BỎ QUA KIỂM TRA THỨ & TIẾT
                    let isVle = (c.hinhThuc || '').toUpperCase().includes('VLE');
                    if (isVle || (tkb.thu == sch.thu && tkb.tietBd == sch.tietBd)) {
                        if (!copiedRowIndices.includes(tkb.sheetRowIndex)) copiedRowIndices.push(tkb.sheetRowIndex);
                    }
                }
            });
        });
        let isCopied = copiedRowIndices.length > 0;
        let rowBg = (isSynced || isCopied) ? "background-color: #f8fafc;" : "background-color: #ffffff;";
        let dateDisplay = (c.ngayBatDau && c.ngayKetThuc) ? `<span class="fw-bold text-dark">${c.ngayBatDau}</span><br>đến <span class="fw-bold text-dark">${c.ngayKetThuc}</span>` : '-';

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
            checkboxHtml = `<input class="form-check-input system-course-checkbox shadow-sm border-secondary" type="checkbox" value="${c.id}" style="width: 22px; height: 22px; cursor: pointer;" onclick="event.stopPropagation();">`;
            statusHtml = `<span class="text-muted small">Chưa đăng ký</span>`;
        }

        html += `
        <tr style="cursor: pointer; ${rowBg}" onclick="if(!${isSynced} && !${isCopied}) $(this).find('.system-course-checkbox').prop('checked', function(i, v) { return !v; });">
            <td class="text-center align-middle">${checkboxHtml}</td>
            <td class="text-center fw-bold text-secondary align-middle">${c.id}</td>
            <td class="text-center align-middle">${c.hinhThuc || '-'}</td>
            <td class="text-center fw-bold text-success align-middle">${c.phongList.join(', ')}</td>
            <td class="text-center align-middle">
                <small class="fw-bold text-muted">${c.thoiGianList.join('<br>')}</small>
            </td>
            <td class="text-center text-warning-emphasis fw-bold align-middle">${c.gv || '-'}</td>
            <td class="text-center align-middle" style="font-size: 13px;">${dateDisplay}</td>
            <td class="text-center align-middle">${statusHtml}</td>
        </tr>
        `;
    });

    $('#systemClassesContainer').html(html);
    
    $('#sysScreen1').addClass('d-none');
    $('#sysScreen2').removeClass('d-none');
    $('#sysFooterActions').removeClass('d-none');
	if (subject.classes.length === 1) {
        // Nếu chỉ có 1 lớp -> Hiện nút Đồng bộ (Hệ thống)
        $('#btnSaveSystemTkb').removeClass('d-none');
    } else {
        // Nếu có nhiều hơn 1 lớp -> Ẩn nút Đồng bộ (Hệ thống), chỉ cho phép copy
        $('#btnSaveSystemTkb').addClass('d-none');
    }
}

// HÀM QUAY TRỞ LẠI
window.backToSysScreen1 = function() {
    $('#sysScreen2').addClass('d-none');
    $('#sysScreen1').removeClass('d-none');
    $('#sysFooterActions').addClass('d-none');
    renderSystemCoursesList();
}



// 1. HÀM LƯU ĐĂNG KÝ / SAO CHÉP (CẬP NHẬT TRẠNG THÁI TỨC THÌ)
// HÀM LƯU TÍCH CHỌN VÀ CẬP NHẬT TRẠNG THÁI NGAY LẬP TỨC
window.saveSystemTkbSelection = function(syncType = 'system') {
    let selectedIds = []; 
    $('.system-course-checkbox:checked').each(function() { selectedIds.push($(this).val()); });
    
    if (selectedIds.length === 0) {
        alert("Vui lòng tích chọn ít nhất 1 lớp chưa đăng ký để tiếp tục!");
        return;
    }

    if (syncType === 'system') {
        let btn = $('#btnSaveSystemTkb'); 
        let originalText = btn.html();
        btn.html('<i class="fa-solid fa-spinner fa-spin me-1"></i> Đang xử lý...').prop('disabled', true);
        
        let newArray = [...userRegisteredCourseIds];
        selectedIds.forEach(id => { if(!newArray.includes(id)) newArray.push(id); });

        postToGAS({ action: "saveSystemTkbSelection", mssv: currentUser.mssv, courseIds: newArray.join(',') }, function(res) {
            alert("Đã đồng bộ thành công! Các học phần VLE sẽ tự động xuất hiện ở bảng Deadline."); 
            userRegisteredCourseIds = newArray; 
            btn.html(originalText).prop('disabled', false); 
            
            $.ajax({
                url: SCRIPT_URL + "?action=getTKBUser&mssv=" + currentUser.mssv + "&_=" + new Date().getTime(),
                method: "GET", dataType: "json", cache: false,
                success: function(data) {
                    processTKBData(data); 
                    openSubjectDetail(currentSysSubjectKey); 
                    loadThoiGianBieu(); 
                    loadDeadlines();
                }
            });
        }, function() { 
            alert("Giao tiếp máy chủ thất bại!"); 
            btn.html(originalText).prop('disabled', false); 
        });
        
    } else if (syncType === 'personal') {
        let btn = $('#btnSavePersonalTkbMode'); 
        let originalText = btn.html();
        btn.html('<i class="fa-solid fa-spinner fa-spin me-1"></i> Đang chép...').prop('disabled', true);
        
        // Chuẩn hóa dữ liệu môn VLE trước khi gửi về Google Sheets
        let coursesToCopy = globalSystemCourses.filter(c => selectedIds.includes(c.id)).map(c => {
            let isVle = (c.hinhThuc || '').toUpperCase().includes('VLE') || (c.thoiGianList || []).some(t => t.includes('VLE'));
            return {
                id: c.id,
                mon: c.mon,
                thu: c.thu || (isVle ? 99 : 2),
                tietBd: c.tietBd || (isVle ? 99 : 1),
                soTiet: c.soTiet || 1,
                thoiGian: c.thoiGian || "VLE",
                hinhThuc: "VLE", // Ép cứng chữ VLE để bộ lọc đếm ngược nhận diện
                phong: c.phong || "VLE",
                gv: c.gv || "",
                color: c.color || "#e0f2fe",
                ngayBatDau: c.ngayBatDau || "",
                ngayKetThuc: c.ngayKetThuc || "",
                ngayNgoaiLe: c.ngayNgoaiLe || ""
            };
        });
        
        postToGAS({ action: "copySystemTkbToPersonal", mssv: currentUser.mssv, courses: coursesToCopy }, function(res) {
            alert("Đã sao chép thành công! Môn VLE sẽ tự động xuất hiện ở bảng Deadline.");
            btn.html(originalText).prop('disabled', false);
            
            $.ajax({
                url: SCRIPT_URL + "?action=getTKBUser&mssv=" + currentUser.mssv + "&_=" + new Date().getTime(),
                method: "GET", dataType: "json", cache: false,
                success: function(data) {
                    processTKBData(data); 
                    if (typeof currentSysSubjectKey !== 'undefined' && currentSysSubjectKey) {
                        openSubjectDetail(currentSysSubjectKey); 
                    }
                    loadThoiGianBieu(); 
                    loadDeadlines();
                }
            });
        }, function() {
            alert("Lỗi kết nối máy chủ! Sao chép thất bại.");
            btn.html(originalText).prop('disabled', false);
        });
    }
};
// 1. HỦY ĐỒNG BỘ HỆ THỐNG
window.cancelSystemSyncDirect = function(courseId, event) {
    event.stopPropagation();
    if(!confirm("Bạn có chắc muốn Hủy đồng bộ toàn bộ các buổi học của lớp này khỏi lịch?")) return;
    
    userRegisteredCourseIds = userRegisteredCourseIds.filter(id => id !== courseId);
    let btnText = $(event.target).html();
    $(event.target).html('<i class="fa-solid fa-spinner fa-spin"></i>').prop('disabled', true);
    
    postToGAS({ action: "saveSystemTkbSelection", mssv: currentUser.mssv, courseIds: userRegisteredCourseIds.join(',') }, function(res) {
        alert("Đã hủy đồng bộ toàn bộ các buổi!");
        loadThoiGianBieu();
        loadDeadlines(); // <--- BỔ SUNG DÒNG NÀY ĐỂ RENDER LẠI BANG DEADLINE
        openSubjectDetail(currentSysSubjectKey);
    }, function() {
        alert("Lỗi kết nối máy chủ!"); 
        $(event.target).html(btnText).prop('disabled', false);
    });
};

// 2. HỦY SAO CHÉP CÁ NHÂN
window.cancelPersonalCopyDirect = function(rowIndicesStr, event) {
    event.stopPropagation();
    if(!confirm("Bạn có chắc muốn Xóa vĩnh viễn toàn bộ các buổi đã sao chép của lớp này?")) return;
    
    let subjectObj = groupedSystemCourses[currentSysSubjectKey];
    let indicesToDelete = [];

    if (subjectObj) {
        globalTkbData.forEach(tkb => {
            if (!tkb.isSystem && getBaseSubjectName(tkb.mon) === getBaseSubjectName(subjectObj.displayName)) {
                if (tkb.sheetRowIndex && !indicesToDelete.includes(tkb.sheetRowIndex)) {
                    indicesToDelete.push(tkb.sheetRowIndex);
                }
            }
        });
    }

    if (indicesToDelete.length === 0 && rowIndicesStr) {
        indicesToDelete = rowIndicesStr.split(',').map(i => i.trim()).filter(Boolean);
    }

    if (indicesToDelete.length === 0) {
        alert("Không tìm thấy dữ liệu lịch học để xóa!");
        return;
    }

    let $btn = $(event.target).closest('button');
    let originalHtml = $btn.html();
    $btn.html('<i class="fa-solid fa-spinner fa-spin"></i>').prop('disabled', true);

    postToGAS({ 
        action: "deleteMultipleTKBRows", 
        rowIndices: indicesToDelete.join(','), 
        mssv: currentUser.mssv 
    }, function(res) {
        alert(res);
        
        // Tải lại dữ liệu TKB & Deadline mới nhất từ Server
        $.ajax({
            url: SCRIPT_URL + "?action=getTKBUser&mssv=" + currentUser.mssv + "&_=" + new Date().getTime(),
            method: "GET", dataType: "json", cache: false,
            success: function(data) {
                processTKBData(data);
                openSubjectDetail(currentSysSubjectKey);
                loadThoiGianBieu(); 
                loadDeadlines(); // <--- BỔ SUNG DÒNG NÀY ĐỂ LOAD LẠI BẢNG DEADLINE
            }
        });
    }, function() {
        alert("Lỗi kết nối máy chủ khi xóa!");
        $btn.html(originalHtml).prop('disabled', false);
    });
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
