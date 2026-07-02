
       const sidebar = document.getElementById('sidebarMenu');
        const overlay = document.getElementById('sidebarOverlay');
        const btnToggle = document.getElementById('btnToggleMenu');
        function toggleMenu() { sidebar.classList.toggle('show'); overlay.classList.toggle('show'); }
        btnToggle.addEventListener('click', toggleMenu); overlay.addEventListener('click', toggleMenu);

        function resetNavActive() {
            $('.btn-course').removeClass('active'); $('#btnNavQA').removeClass('active'); $('#btnNavTKB').removeClass('active');
            $('#tongHopSection').addClass('d-none'); $('#courseSection').addClass('d-none');
            $('#qaSection').addClass('d-none'); $('#tkbSection').addClass('d-none');
        }

        function loadTongHopView() {
            document.title = "Tổng hợp Link | Học nhóm Năm 2 Khoa Toán";
			resetNavActive(); $('#btnNavTongHop').addClass('active'); $('#tongHopSection').removeClass('d-none');
            if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); }
        }
function pingOnlineStatus() {
            let savedUser = localStorage.getItem('currentUser');
            let mssvParam = "Khách"; 
            if (savedUser) {
                try {
                    let userObj = JSON.parse(savedUser);
                    mssvParam = userObj.mssv + "|" + userObj.name; 
                } catch(e) { mssvParam = "Khách"; }
            }
            if (mssvParam === "Khách" && currentUser && currentUser.mssv) { mssvParam = currentUser.mssv + "|" + currentUser.name; }

            $.ajax({ 
                url: SCRIPT_URL + "?action=pingPresence&uuid=" + sessionUUID + "&mssv=" + encodeURIComponent(mssvParam), 
                method: "GET", dataType: "json", cache: false,
                success: function(res) { 
                    if (res && res.list) { 
                        let currentIsAdmin = isAdmin || (currentUser && currentUser.mssv === "51.01.108.008");
                        let processedList = res.list.map(userStr => {
                            let str = String(userStr).trim();
                            if (str.toLowerCase() === "khách" || !str.includes("|")) return str;
                            let parts = str.split("|");
                            let userMssv = parts[0]; let userName = parts[1];
                            if (userMssv === "51.01.108.008") return '<span class="fw-bold" style="color: #facc15; text-transform: uppercase;"><i class="fa-solid fa-user-shield me-1"></i>Admin</span>';
                            if (currentIsAdmin) return userName + " (" + userMssv + ")";
                            return maskMSSV(userMssv);
                        });
                        let displayList = processedList.join(", ");
                        $('#footerOnlineStatus').html(`<i class="fa-solid fa-users me-2"></i> ${res.count} người: <strong>${displayList}</strong>`);
                    } 
                } 
            });
        }
function loadWebLinks() { 
    // 1. Hiển thị hiệu ứng "Đang tải dữ liệu..." thật xịn xò trước khi gọi dữ liệu
    $('#webLinksContainer').html(`
        <div class="col-12">
            <div class="pulse-loader py-5">
                <div class="spinner-modern"></div>
                <span class="text-muted fw-bold" style="font-size: 15px;">Đang tải danh sách liên kết...</span>
            </div>
        </div>
    `);

    // 2. Tiến hành lấy dữ liệu từ máy chủ
    $.ajax({ 
        url: SCRIPT_URL + "?action=getWebLinks", 
        method: "GET", 
        dataType: "json", 
        success: function(data) { 
            renderWebLinks(data); // Hàm này sẽ ghi đè cái Loading ở trên khi có dữ liệu
        },
        error: function() {
            // Hiển thị thông báo lỗi nếu rớt mạng
            $('#webLinksContainer').html(`
                <div class="col-12 text-center text-danger py-5">
                    <i class="fa-solid fa-triangle-exclamation fs-2 mb-3"></i><br>
                    <span class="fw-bold">Lỗi khi tải dữ liệu! Vui lòng thử lại sau.</span>
                </div>
            `);
        }
    }); 
}function renderWebLinks(data) { 
    if (!data || data.length === 0) { 
        $('#webLinksContainer').html('<div class="col-12 text-center text-muted py-5"><i class="fa-solid fa-link-slash fs-1 mb-3"></i><br>Chưa có đường link nào.</div>'); 
        return; 
    } 
    let html = ''; 
    data.forEach(row => { 
        let title = row[0] || 'Liên kết'; 
        let desc = row[1] || ''; 
        let url = row[2] || '#'; 
        let iconClass = row[3] || 'fa-solid fa-link'; 
        
        let badgeHtml = '';


        // Tự động kiểm tra: Nếu có ghi chú thì tạo thẻ p, không có thì để trống
        let descHtml = desc ? `<p class="card-desc">${desc}</p>` : '';

        html += `
        <div class="col-6 col-md-3 col-lg-3 mb-3"> 
            <a href="${url}" target="_blank" class="link-card-modern">
                ${badgeHtml}
                <div class="icon-box"><i class="${iconClass}"></i></div>
                <div class="card-text-wrapper">
                    <h5>${title}</h5>
                    ${descHtml} </div>
            </a>
        </div>`; 
    }); 
    $('#webLinksContainer').html(html); 
}
function renderSidebarCategories() {
    let optionsHtml = '';
    
    // 1. Cấu hình phân nhóm danh mục (Bạn tự thêm tên Sheet thực tế vào mảng tương ứng)
    const categoryGroups = {
	'HK2 - Năm 2': ["Độ đo và tích phân", "Toán rời rạc", "Lập trình Python", "Phương trình vi phân và đạo hàm riêng", "Lịch sử Đảng", "Trí tuệ nhân tạo"],
	'HK1 - Năm 2': ['Hình học vi phân', 'Cấu trúc đại số', 'Cấu trúc dữ liệu', 'Tư tưởng Hồ Chí Minh'], 
	'Năm 1': ["Năm 1"],
        'Khác': []
    };

    // Tạo object lưu trữ HTML tạm cho từng nhóm
    let groupHtml = {};
    for (const key in categoryGroups) { groupHtml[key] = ''; }
    groupHtml['Khác'] = '';

    globalCategories.forEach((name) => {
        let lowerName = name.trim().toLowerCase();
        
        // Bỏ qua các sheet dữ liệu hệ thống ẩn
        if (lowerName === 'deadlines_admin' || lowerName === 'tkb_admin' || lowerName === 'chathistory' || lowerName === 'userregisteredcourses') return; 

        if (lowerName !== 'thông báo') {
            if (lowerName === 'users' && !isAdmin) return;
            if (lowerName === 'cauhinhhocky' && !isAdmin) return; 
            if (lowerName === 'mastertkb' && !isAdmin) return; 

            // Cấu hình icon
            let icon = 'fa-folder-closed';
            if (lowerName === 'users') icon = 'fa-users-gear';
            if (lowerName === 'cauhinhhocky') icon = 'fa-calendar-check'; 
            if (lowerName === 'mastertkb') icon = 'fa-table-list'; 
            
            let btnHtml = `<button class="btn-course nav-hocphan" onclick="loadDataByHocPhan('${name}', this)"><i class="fa-solid ${icon}"></i> ${name}</button>`;

            // 2. Kiểm tra xem danh mục này thuộc nhóm nào
            let matchedGroup = 'Khác';
            for (const [groupName, subjects] of Object.entries(categoryGroups)) {
                // So sánh chữ thường để đảm bảo không bị lỗi viết hoa/thường
                if (subjects.some(sub => sub.toLowerCase() === lowerName)) {
                    matchedGroup = groupName;
                    break;
                }
            }
            
            // 3. Đưa HTML của nút vào nhóm tương ứng
            groupHtml[matchedGroup] += btnHtml;
        }
    });

    // 4. Lắp ráp HTML cuối cùng để hiển thị ra giao diện
for (const [groupName, html] of Object.entries(groupHtml)) {
    if (html !== '') { // Chỉ in ra những nhóm có chứa danh mục bên trong
        optionsHtml += `
            <div class="mt-2 mb-1 ps-1 text-uppercase fw-bold" style="font-size: 14px; color: var(--primary-color); letter-spacing: 0.5px; opacity: 1;">
                <i class="fa-solid fa-caret-right me-1" style="font-size: 11px;"></i> ${groupName}
            </div>
            <div class="course-list mb-2">${html}</div>
        `;
        }
    }

    // Đổ dữ liệu vào vùng chứa danh sách danh mục
    $('#dynamicCourseList').html(optionsHtml);
}

       

        function fetchAndRenderCategories() {
            $('#dynamicCourseList').html('<span class="text-muted small px-2">Đang tải danh sách...</span>');
            $.ajax({ url: SCRIPT_URL + "?action=getHocPhanList", method: "GET", dataType: "json",
                success: function(list) { globalCategories = list; renderSidebarCategories(); if ($('#manageCategoryModal').is(':visible')) { renderCategoryManager(); } }
            });
        }
function loadDataByHocPhan(sheetName, element) {
    if(!sheetName) return; 
    document.title = sheetName + " | Học nhóm Năm 2 Khoa Toán";
    currentSheetName = sheetName; resetNavActive(); if(element) $(element).addClass('active');
    $('#courseSection').removeClass('d-none'); $('#tableWrapper').addClass('d-none'); $('#swipeHint').addClass('d-none');
    $('#instructorArea').addClass('d-none').html(''); $('#loadingStatus').removeClass('d-none');
    
    if ($('#customViewWrapper').length > 0) $('#customViewWrapper').addClass('d-none');
    $('#examCardsContainer').addClass('d-none').html(''); 

    if (isAdmin) $('#adminAddRowArea').removeClass('d-none'); else $('#adminAddRowArea').addClass('d-none');
    if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); }
    
    $.ajax({ url: SCRIPT_URL + "?action=getHocPhanData&sheetName=" + encodeURIComponent(sheetName), method: "GET", dataType: "json",
        success: function(data) {
            if (!data || data.length === 0) { 
                currentSheetTotalRows = 1; 
                $('#sheetTableBody').html('<tr><td colspan="5" class="text-center py-5 text-muted"><i class="fa-regular fa-folder-open fs-1 mb-3 d-block"></i>Chưa có dữ liệu.</td></tr>'); 
                $('#loadingStatus').addClass('d-none'); $('#tableWrapper').removeClass('d-none'); $('#swipeHint').removeClass('d-none'); 
                return; 
            }
            
            currentSheetTotalRows = data.length; 

            // ==========================================
            // XỬ LÝ RIÊNG: GIAO DIỆN THÔNG BÁO 7 CỘT CHUYÊN NGHIỆP
            // ==========================================
 
            // ==========================================
            if (sheetName.toLowerCase() === 'thông báo') {
                let hocThuatHtml = ''; let renLuyenHtml = '';

                data.forEach((row, rowIndex) => {
                    if (rowIndex === 0) return; // Bỏ qua tiêu đề
                    
                    let c1 = String(row[0] || '').trim(); let c2 = String(row[1] || '').trim();
                    let c3 = String(row[2] || '').trim(); let c4 = String(row[3] || '').trim();
                    let c5 = String(row[4] || '').trim(); let c6 = String(row[5] || '').trim();
                    let c7 = String(row[6] || '').trim();

                    let isNew = /^new$/i.test(c1) || c1.toLowerCase().includes('new');
                    
                    // LỌC RÈN LUYỆN/HỌC THUẬT DỰA VÀO CỘT 7 (GHI CHÚ)
                    let isRenLuyen = c7.toLowerCase().includes('rèn luyện');

                    let typeClass = isRenLuyen ? 'rl' : 'ht';
                    let typeIcon = isRenLuyen ? '<i class="fa-solid fa-person-running"></i>' : '<i class="fa-solid fa-book-open-reader"></i>';
                    let typeText = isRenLuyen ? 'Rèn luyện' : 'Học thuật';

                    // Xử lý Ngày tháng
                    // Thay bằng đoạn này:
let dateDisplay = `<i class="fa-regular fa-calendar"></i> Ngày đăng: ${c4 || 'Gần đây'}`;
                    if (c5) dateDisplay += ` <span class="ms-2 d-none d-sm-inline" style="opacity: 0.7;"><i class="fa-solid fa-pen-to-square"></i> Ngày cập nhật: ${c5}</span>`;

                    // Xử lý Thu gọn nội dung nếu quá dài (hơn 150 ký tự)
                    let hasContent = c3.length > 0;
                    let isLongContent = c3.length > 150 || c3.split('\n').length > 3;
                    let summaryContent = isLongContent ? c3.substring(0, 0) + '------------' : c3;
                    let collapseId = `collapseTb_${rowIndex}`;

                    // Nút link đính kèm
                    let linkHtml = c6 ? `<a href="${c6}" target="_blank" class="btn btn-sm mt-3 fw-bold shadow-sm" style="background: #f1f5f9; color: var(--primary-color); border: 1px solid #cbd5e1;"><i class="fa-solid fa-link"></i> Xem liên kết đính kèm</a>` : '';
                    
                    // Ẩn Ghi chú nếu chỉ dùng để gõ từ khóa phân loại "Rèn luyện" hoặc "Học thuật"
                    let noteHtml = '';
                    if (c7 && c7.toLowerCase() !== 'rèn luyện' && c7.toLowerCase() !== 'học thuật') {
                        noteHtml = `<div class="mt-3 text-danger small fw-bold"><i class="fa-solid fa-triangle-exclamation"></i> Nguồn: ${c7}</div>`;
                    }

                    let adminHtml = '';
                    if (isAdmin) {
                        let sheetRowIndex = rowIndex + 1;
                        let ec1 = c1.replace(/'/g, "\\'"); let ec2 = c2.replace(/'/g, "\\'"); let ec3 = c3.replace(/'/g, "\\'"); let ec4 = c4.replace(/'/g, "\\'");
                        let ec5 = c5.replace(/'/g, "\\'"); let ec6 = c6.replace(/'/g, "\\'"); let ec7 = c7.replace(/'/g, "\\'");
                        adminHtml = `<div class="mt-4 pt-3 border-top d-flex flex-wrap gap-2">
                            <button class="btn btn-sm btn-outline-secondary py-1 px-2" title="Lên" onclick="moveRowItem(${sheetRowIndex}, 'up')"><i class="fa-solid fa-arrow-up"></i></button>
                            <button class="btn btn-sm btn-outline-secondary py-1 px-2" title="Xuống" onclick="moveRowItem(${sheetRowIndex}, 'down')"><i class="fa-solid fa-arrow-down"></i></button>
                            <button class="btn btn-sm btn-outline-success py-1 px-2 fw-bold" onclick="openInsertRowModal(${sheetRowIndex})"><i class="fa-solid fa-plus"></i> Chèn</button>
                            <button class="btn btn-sm btn-outline-warning py-1 px-2 fw-bold" onclick="openEditRowModal(${sheetRowIndex}, '${ec1}', '${ec2}', '${ec3}', '${ec4}', '${ec5}', '${ec6}', '${ec7}')"><i class="fa-solid fa-pen"></i> Sửa</button>
                            <button class="btn btn-sm btn-outline-danger py-1 px-2 fw-bold" onclick="deleteRowItem(${sheetRowIndex})"><i class="fa-solid fa-trash"></i> Xóa</button>
                        </div>`;
                    }

                    let badgeNew = isNew ? `<span class="tb-card-tag new me-2"><i class="fa-solid fa-bolt"></i> MỚI</span>` : '';

                    let cardHtml = `
                    <div class="tb-card-pro ${isNew ? 'is-new' : ''} ${typeClass}">
                        <div class="tb-card-header">
                            <div>
                                ${badgeNew}
                                <span class="tb-card-tag ${typeClass}">${typeIcon} ${typeText}</span>
                            </div>
                            <div class="tb-card-date">${dateDisplay}</div>
                        </div>
                        
                        <div class="tb-card-title">${c2}</div>
                        
                        ${hasContent ? `
                        <div class="tb-card-content">
                            ${isLongContent ? summaryContent : c3}
                        </div>
                        
                        ${isLongContent ? `
                            <div class="collapse" id="${collapseId}">
                                <div class="tb-card-content-full">${c3}</div>
                            </div>
                            <button class="btn btn-link p-0 text-decoration-none fw-bold mt-2" style="font-size: 14.5px;" data-bs-toggle="collapse" data-bs-target="#${collapseId}"
                                onclick="setTimeout(() => { this.innerHTML = this.getAttribute('aria-expanded') === 'true' ? '<i class=\\\'fa-solid fa-chevron-up\\\'></i> Thu gọn' : '<i class=\\\'fa-solid fa-chevron-down\\\'></i> Xem chi tiết'; }, 50);">
                                <i class="fa-solid fa-chevron-down"></i> Xem chi tiết
                            </button>
                        ` : ''}
                        ` : ''}

                        <div>${linkHtml}</div>
                        ${noteHtml}
                        ${adminHtml}
                    </div>`;

                    if (isRenLuyen) renLuyenHtml += cardHtml; else hocThuatHtml += cardHtml;
                });

                if (!hocThuatHtml) hocThuatHtml = '<div class="text-muted text-center py-4"><i class="fa-regular fa-folder-open fs-2 mb-2"></i><br>Chưa có thông báo học thuật</div>';
                if (!renLuyenHtml) renLuyenHtml = '<div class="text-muted text-center py-4"><i class="fa-regular fa-folder-open fs-2 mb-2"></i><br>Chưa có thông báo rèn luyện</div>';

                let customViewHtml = `
                <div class="row g-4 mt-2 mb-4">
                    <div class="col-12">
                        <div class="p-4 bg-white rounded-4 shadow-sm" style="border-top: 5px solid #0ea5e9;">
                            <h5 class="fw-bold mb-4" style="color: #0ea5e9; font-size: 18px; text-transform: uppercase;"><i class="fa-solid fa-book-open-reader me-2"></i>THÔNG BÁO HỌC THUẬT</h5>
                            ${hocThuatHtml}
                        </div>
                    </div>
                    <div class="col-12 mt-4">
                        <div class="p-4 bg-white rounded-4 shadow-sm" style="border-top: 5px solid #16a34a;">
                            <h5 class="fw-bold mb-4" style="color: #16a34a; font-size: 18px; text-transform: uppercase;"><i class="fa-solid fa-person-running me-2"></i>THÔNG BÁO RÈN LUYỆN</h5>
                            ${renLuyenHtml}
                        </div>
                    </div>
                </div>`;

                if ($('#customViewWrapper').length === 0) $('#tableWrapper').before('<div id="customViewWrapper" class="w-100"></div>');
                $('#customViewWrapper').html(customViewHtml).removeClass('d-none');
                $('#loadingStatus').addClass('d-none');
                return;
            }
              

            // ==========================================
            // KẾT THÚC THÔNG BÁO
            // ==========================================


            // DẠNG BẢNG THƯỜNG CHO CÁC HỌC PHẦN (Loop tự động tương thích 7 cột)
            let bodyHtml = ''; let headHtml = ''; let instructorInfos = [];
            let examCardsHtml = ''; let hasExamCards = false; 

            data.forEach((row, rowIndex) => {
                let fullRowText = row.join(" ").toLowerCase().replace(/\s+/g, ' '); 
                let firstCellTextRaw = String(row[0]).trim(); 
                let firstCellText = firstCellTextRaw.toLowerCase().replace(/\s+/g, '');
                
                if (rowIndex === 0) { 
                    row.forEach((cell) => { headHtml += `<th>${String(cell || '')}</th>`; });
                    if (isAdmin) headHtml += `<th style="width: 180px; min-width: 180px;">Thao tác</th>`; 
                    return; 
                }
                
                if (/mãhp|họcphần|gv\d|giảngviên|email|facebook|sốtínchỉ/.test(fullRowText.replace(/\s+/g, ''))) { 
                    let info = row.filter(cell => String(cell).trim() !== "").join(" <span class='mx-2 text-black-50'>|</span> "); 
                    if(info) instructorInfos.push(info); 
                    return; 
                }

                let isSpecialExam = /(đề thi thử|đề demo|minigame tuần)/i.test(fullRowText);
                if (isSpecialExam) {
                    hasExamCards = true; let titleText = String(row[1] || row[0]).trim(); 
                    let _extRegex = /(https?:\/\/[^\s]+)/g; let extMatch = row.join(" ").match(_extRegex); 
                    let linkUrl = '#'; let imageUrl = '';   
                    if (extMatch) {
                        linkUrl = extMatch[0]; 
                        if (extMatch.length > 1) {
                            imageUrl = extMatch[1];
                            if (imageUrl.includes("drive.google.com/file/d/")) {
                                let matchId = imageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                                if (matchId && matchId[1]) imageUrl = `https://drive.google.com/thumbnail?id=${matchId[1]}&sz=w800`;
                            }
                        }
                    }
                    let iconClass = fullRowText.includes("minigame") ? "fa-gamepad" : "fa-file-lines";
                    let imgDisplayHtml = imageUrl ? `<img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fa-solid ${iconClass}"></i>`;
                    examCardsHtml += `<div class="card-special-exam"><div class="card-exam-img">${imgDisplayHtml}</div><div class="card-exam-title">${titleText}</div><a href="${linkUrl}" target="_blank" class="card-exam-link">Chi tiết</a></div>`;
                    return; 
                }

                let isNewRow = /^new$/i.test(firstCellTextRaw) || firstCellTextRaw.toLowerCase().includes('new'); 
                let rowClass = 'grid-row'; let iconPrefix = '';
                if (isNewRow) { rowClass += ' row-new'; } 
                else if (/ngânhàng/.test(fullRowText.replace(/\s+/g, ''))) { rowClass += ' row-white'; iconPrefix = '<i class="fa-solid fa-box-archive me-2 text-secondary"></i>'; } 
                else if (/bàithi|kiểmtra|đềthi|lịchthi|phòngthi/.test(fullRowText.replace(/\s+/g, '')) || row.join(" ").toLowerCase().includes(' thi ')) { rowClass += ' row-exam'; iconPrefix = '<i class="fa-solid fa-triangle-exclamation me-2 text-danger"></i>'; } 
                else if (/chủđề|chương/.test(firstCellText)) { rowClass += ' row-topic'; } 
                else if (/bài/.test(firstCellText)) { rowClass += ' row-lesson'; iconPrefix = '<i class="fa-solid fa-folder-open me-2 text-success"></i>'; }
                
                bodyHtml += `<tr class="${rowClass}">`;
                row.forEach((cell, cellIndex) => {
                    let cellText = String(cell).trim();
                    if (cellIndex === 0 && isNewRow) cellText = cellText.replace(/new/i, '<span class="badge-new">Mới</span>');
                    let _urlRegex = /(https?:\/\/[^\s]+)/g; let _match = cellText.match(_urlRegex); let extractedUrl = _match ? _match[0] : null;
                    if (extractedUrl) { 
                        let label = cellText.replace(extractedUrl, '').trim() || "Truy cập"; 
                        bodyHtml += `<td><a href="${extractedUrl}" target="_blank" class="btn-portal-action"><i class="fa-solid fa-cloud-arrow-down"></i> ${label}</a></td>`; 
                    } else { 
                        if (cellText === "") bodyHtml += `<td></td>`; 
                        else bodyHtml += `<td>${cellIndex === 0 && !isNewRow ? iconPrefix + cellText : cellText}</td>`; 
                    }
                });

                if (isAdmin) {
                    let sheetRowIndex = rowIndex + 1; 
                    let escapedCells = row.map(c => String(c || '').replace(/'/g, "\\'"));
                    while(escapedCells.length < 7) escapedCells.push('');
                    bodyHtml += `<td><div class="d-flex flex-wrap gap-1">
                        <button class="btn btn-sm btn-outline-secondary py-1 px-2" title="Lên" onclick="moveRowItem(${sheetRowIndex}, 'up')"><i class="fa-solid fa-arrow-up"></i></button>
                        <button class="btn btn-sm btn-outline-secondary py-1 px-2" title="Xuống" onclick="moveRowItem(${sheetRowIndex}, 'down')"><i class="fa-solid fa-arrow-down"></i></button>
                        <button class="btn btn-sm btn-outline-success py-1 px-2" title="Chèn" onclick="openInsertRowModal(${sheetRowIndex})"><i class="fa-solid fa-plus"></i></button>
                        <button class="btn btn-sm btn-outline-warning py-1 px-2" title="Sửa" onclick="openEditRowModal(${sheetRowIndex}, '${escapedCells[0]}', '${escapedCells[1]}', '${escapedCells[2]}', '${escapedCells[3]}', '${escapedCells[4]}', '${escapedCells[5]}', '${escapedCells[6]}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger py-1 px-2" title="Xóa" onclick="deleteRowItem(${sheetRowIndex})"><i class="fa-solid fa-trash"></i></button>
                    </div></td>`;
                } 
                bodyHtml += '</tr>';
            });

            if (hasExamCards) $('#examCardsContainer').html(examCardsHtml).removeClass('d-none');
            if (instructorInfos.length > 0) { 
                let cardContent = `<div class="instructor-card"><h6 class="mb-4"><i class="fa-solid fa-chalkboard-user me-2"></i>Thông tin lớp học & Giảng viên phụ trách</h6><div class="row">`; 
                instructorInfos.forEach(info => { cardContent += `<div class="col-12 col-md-6 instructor-item"><i class="fa-solid fa-check"></i> <span>${info}</span></div>`; }); 
                cardContent += `</div></div>`; 
                $('#instructorArea').html(cardContent).removeClass('d-none'); 
            }
            $('#sheetTableHead').html(headHtml); $('#sheetTableBody').html(bodyHtml); 
            $('#loadingStatus').addClass('d-none'); $('#tableWrapper').removeClass('d-none'); $('#swipeHint').removeClass('d-none');
        },
        error: function() { $('#loadingStatus').html('<span class="text-danger fw-bold">Có lỗi xảy ra khi tải dữ liệu!</span>'); }
    });
}
function initGlobalApp() {
            $('.app-container, .mobile-header').css('display', '');
            setTimeout(pingOnlineStatus, 1000); setInterval(pingOnlineStatus, 25000);
            fetchSemesterConfig(); 
            loadDataByHocPhan('Thông báo', document.getElementById('btnNavThongBao')); 
            loadWebLinks(); checkNewQA(); fetchAndRenderCategories();
        }

        $(document).ready(function() {
            if (!currentUser) {
                let authModal = new bootstrap.Modal(document.getElementById('userAuthModal'), { backdrop: 'static', keyboard: false });
                $('#userAuthModal .btn-close').hide(); 
                renderSavedAccounts(); 
                authModal.show();
            } else { initGlobalApp(); }
        });


