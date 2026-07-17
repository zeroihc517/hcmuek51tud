
       const sidebar = document.getElementById('sidebarMenu');
        const overlay = document.getElementById('sidebarOverlay');
        const btnToggle = document.getElementById('btnToggleMenu');
        function toggleMenu() { sidebar.classList.toggle('show'); overlay.classList.toggle('show'); }
        btnToggle.addEventListener('click', toggleMenu); overlay.addEventListener('click', toggleMenu);

function resetNavActive() {
    $('.btn-course').removeClass('active'); 
    $('#btnNavQA').removeClass('active'); 
    $('#btnNavTKB').removeClass('active');
    $('#btnNavShareCode').removeClass('active');
    $('#btnNavGPA').removeClass('active');
    
    $('#tongHopSection').addClass('d-none'); 
    $('#courseSection').addClass('d-none');
    $('#qaSection').addClass('d-none'); 
    $('#tkbSection').addClass('d-none');
    $('#shareCodeSection').addClass('d-none'); 
    $('#gpaSection').addClass('d-none');
    $('#profileSection').addClass('d-none'); // <--- Ẩn trang hồ sơ
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
		if (savedUser) {
        try {
            let userObj = JSON.parse(savedUser);
            // Kiểm tra MSSV đúng với admin
            if (userObj.mssv === "51.01.108.008") {
                $('#gpaNavContainer').removeClass('d-none');
            } else {
                $('#gpaNavContainer').addClass('d-none');
            }
        } catch(e) {
            $('#gpaNavContainer').addClass('d-none');
        }
    } else {
        // Chưa đăng nhập thì ẩn
        $('#gpaNavContainer').addClass('d-none');
    }
$(document).ready(function() {
    checkGPAAccessPermission();
});
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
}
function renderWebLinks(data) { 
    if (!data && currentUser?.mssv !== "51.01.108.008") { 
        $('#webLinksContainer').html('<div class="col-12 text-center text-muted py-5"><i class="fa-solid fa-link-slash fs-1 mb-3"></i><br>Chưa có đường link nào.</div>'); 
        return; 
    } 
    
    let html = ''; 

    // TIÊM TRỰC TIẾP CÁC CARD DÀNH RIÊNG CHO ADMIN
  if (currentUser && currentUser.mssv === "51.01.108.008") {
        html += `
        <div class="col mb-3">
            <a href="https://docs.google.com/spreadsheets/d/13bQ6y0fn8n9Ah4OKQeQ9xOVJxXXnXRLjaIxTQPx-eGo/edit?usp=sharing" target="_blank" class="link-card-modern" style="border-bottom: 4px solid #16a34a; background: #f8fafc;">
                <div class="link-card-badge bg-danger shadow-sm">ADMIN ONLY</div>
                <div class="icon-box"><i class="fa-solid fa-database" style="color: #16a34a;"></i></div>
                <div class="card-text-wrapper">
                    <h5>Cơ sở dữ liệu</h5>
                    <p class="card-desc">Quản lý hệ thống toàn diện</p>
                </div>
            </a>
        </div>
        <div class="col mb-3">
            <a href="https://teams.cloud.microsoft/l/team/19%3AG3AZ0si8ueyRMaXW3zI-siWOxk1cyIA9Aol3zliL8Sw1%40thread.tacv2/conversations?groupId=d88461ae-d3dd-44d2-aae0-e8d021da1e68&tenantId=b1a9fdc0-1d56-4c3d-a481-809fff8a26db" target="_blank" class="link-card-modern" style="border-bottom: 4px solid #464eb8; background: #f8fafc;">
                <div class="link-card-badge bg-danger shadow-sm">ADMIN ONLY</div>
                <div class="icon-box"><i class="fa-brands fa-microsoft" style="color: #464eb8;"></i></div>
                <div class="card-text-wrapper">
                    <h5>MS Teams</h5>
                    <p class="card-desc">Không gian làm việc quản trị</p>
                </div>
            </a>
        </div>`;
    }

    // Hiển thị các link khác (nếu có) từ hệ thống cho tất cả mọi người
    if (data && data.length > 0) {
        data.forEach(row => { 
            let title = row[0] || 'Liên kết'; 
            let desc = row[1] || ''; 
            let url = row[2] || '#'; 
            let iconClass = row[3] || 'fa-solid fa-link'; 
            
            let descHtml = desc ? `<p class="card-desc">${desc}</p>` : '';

            html += `
            <div class="col mb-3"> 
                <a href="${url}" target="_blank" class="link-card-modern" style="border-bottom: 4px solid var(--primary-color);">
                    <div class="icon-box"><i class="${iconClass}" style="color: var(--primary-color);"></i></div>
                    <div class="card-text-wrapper">
                        <h5>${title}</h5>
                        ${descHtml} 
                    </div>
                </a>
            </div>`;
        });
    }
    
    $('#webLinksContainer').html(html); 
}
function renderSidebarCategories() {
    let optionsHtml = '';
    
    // 1. Cấu hình phân nhóm danh mục (Bạn tự thêm tên Sheet thực tế vào mảng tương ứng)
    const categoryGroups = {
	'HK1 - Năm 2': ['Hình học vi phân', 'Cấu trúc đại số', 'Cấu trúc dữ liệu', 'Tư tưởng Hồ Chí Minh'], 
	'Năm 1': ["Năm 1", "Đại số tuyến tính"],
	'HK2 - Năm 2': ["Độ đo và tích phân", "Toán rời rạc", "Lập trình Python", "Phương trình vi phân và đạo hàm riêng", "Trí tuệ nhân tạo", "Lịch sử Đảng"],
    'Khác': [],
    };

    // Tạo object lưu trữ HTML tạm cho từng nhóm
    let groupHtml = {};
    for (const key in categoryGroups) { groupHtml[key] = ''; }
    groupHtml['Khác'] = '';

    globalCategories.forEach((name) => {
        let lowerName = name.trim().toLowerCase();
        
        // Bỏ qua các sheet dữ liệu hệ thống ẩn
if (lowerName === 'deadlines_admin' || lowerName === 'tkb_admin' || lowerName === 'khaosat' || lowerName === 'userregisteredcourses' || lowerName === 'mastertkb' || lowerName === 'gpa_data' || lowerName === 'sharecode') return;

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
    currentSheetName = sheetName; 
    resetNavActive(); 
    if(element) $(element).addClass('active');
    
    // Reset giao diện trước khi tải
    $('#courseSection').removeClass('d-none'); 
    $('#tableWrapper').addClass('d-none'); 
    $('#swipeHint').addClass('d-none');
    $('#instructorArea').addClass('d-none').html(''); 
    $('#loadingStatus').removeClass('d-none');
    
    if ($('#customViewWrapper').length > 0) $('#customViewWrapper').addClass('d-none');
    $('#examCardsContainer').addClass('d-none').html(''); 

    // Hiển thị form thêm dữ liệu nếu là Admin
    if (isAdmin) $('#adminAddRowArea').removeClass('d-none'); 
    else $('#adminAddRowArea').addClass('d-none');
    
    // Đóng sidebar trên mobile
    if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); }
    
    $.ajax({ 
        url: SCRIPT_URL + "?action=getHocPhanData&sheetName=" + encodeURIComponent(sheetName), 
        method: "GET", 
        dataType: "json",
        success: function(data) {
            if (!data || data.length === 0) { 
                currentSheetTotalRows = 1; 
                $('#sheetTableBody').html('<tr><td colspan="5" class="text-center py-5 text-muted"><i class="fa-regular fa-folder-open fs-1 mb-3 d-block"></i>Chưa có dữ liệu.</td></tr>'); 
                $('#loadingStatus').addClass('d-none'); $('#tableWrapper').removeClass('d-none'); $('#swipeHint').removeClass('d-none'); 
                return; 
            }
            
            currentSheetTotalRows = data.length; 

            // ==========================================
            // XỬ LÝ RIÊNG: GIAO DIỆN THÔNG BÁO (HỌC THUẬT & RÈN LUYỆN)
            // ==========================================
            if (sheetName.toLowerCase() === 'thông báo') {
              let mainHtml = `
<div class="tb-list-container shadow-sm mb-4">
    <div class="tb-header-blue">
        <div class="d-flex align-items-center"><i class="fa-solid fa-globe me-2"></i> Tin tức - Thông báo mới</div>
        <div class="ms-auto d-flex gap-2">
            <input type="text" id="tbSearchInput" class="form-control form-control-sm border-0" placeholder="Tìm kiếm thông báo..." style="width: 220px; border-radius: 4px;" onkeyup="if(event.key === 'Enter') searchThongBao()">
            <button class="btn btn-sm text-white fw-bold px-3" style="background: #e61d4a; border-radius: 4px;" onclick="searchThongBao()">Tìm kiếm</button>
        </div>
    </div>
    
    <div class="tb-list-body">
        <!-- KHU VỰC THÔNG BÁO HỆ THỐNG NẰM TRÊN CÙNG -->
        <div id="tbItemsHeThong" class="mb-4"></div>

        <div class="row g-4">
            <div class="col-md-6 tb-section-block" id="tbSectionHocThuat">
                <div class="tb-section-heading ht border-bottom pb-2 mb-3"><i class="fa-solid fa-book-open-reader me-2"></i> Không gian học thuật & Nghiên cứu khoa học</div>
                <div class="tb-section-items" id="tbItemsHocThuat"></div>
            </div>
            
            <div class="col-md-6 tb-section-block" id="tbSectionRenLuyen">
                <div class="tb-section-heading rl border-bottom pb-2 mb-3"><i class="fa-solid fa-person-running me-2"></i> Hoạt động Rèn luyện</div>
                <div class="tb-section-items" id="tbItemsRenLuyen"></div>
            </div>
        </div>
    </div>
</div>
`;

               let detailData = [];
let hocThuatItemsHtml = '';
let renLuyenItemsHtml = '';
let heThongItemsHtml = ''; // Biến mới chứa HTML cho Hệ thống

data.forEach((row, rowIndex) => {
    if (rowIndex === 0) return; 
    
    let c1 = String(row[0] || '').trim();
    let c2 = String(row[1] || '').trim();
    let c3 = String(row[2] || '').trim();
    let c4_raw = String(row[3] || '').trim(); 
    let c5 = String(row[4] || '').trim();
    let c6 = String(row[5] || '').trim();
    let c7 = String(row[6] || '').trim();
    let c7_raw = c7; 

    // Logic Hẹn giờ đăng bài (Ngày X) giữ nguyên...
    let publishDate = null;
    let c4_display = c4_raw; 
    let dateMatch = c4_raw.match(/(?:(\d{1,2}):(\d{2}))?\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
        let hour = dateMatch[1] ? parseInt(dateMatch[1]) : 0;
        let minute = dateMatch[2] ? parseInt(dateMatch[2]) : 0;
        let day = parseInt(dateMatch[3]);
        let month = parseInt(dateMatch[4]) - 1;
        let year = parseInt(dateMatch[5]);
        publishDate = new Date(year, month, day, hour, minute, 0);
        c4_display = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
    }

    let now = new Date(); 
    if (publishDate && publishDate > now && !isAdmin) {
        return; 
    }
    
    let c4 = c4_display; 
    let isNew = /^new$/i.test(c1) || c1.toLowerCase().includes('new');
    
    // TÍNH NĂNG MỚI: Nhận diện Thông báo Hệ thống và Rèn luyện
    let isHeThong = c7_raw.toLowerCase().includes('hệ thống');
    let isRenLuyen = c7_raw.toLowerCase().includes('rèn luyện');
    
 // 1. Dùng cho ĐỒNG HỒ ĐẾM NGƯỢC: CHỈ quét lấy từ Nội dung (c3)
    let deadlineTime = extractDeadline(c3);

    // 2. Dùng để ẨN THÔNG BÁO: CHỈ quét lấy từ Ghi chú (c7)
    let hideTime = extractDeadline(c7_raw);

    // KIỂM TRA ĐIỀU KIỆN ẨN: Nếu cột Ghi chú có hẹn giờ và đã lố giờ -> Ẩn hoàn toàn (trừ Admin)
    if (hideTime && now.getTime() > hideTime && !isAdmin) {
        return; 
    }

    // 3. Dọn dẹp chữ "Hết hạn..." ở cột Ghi chú để giao diện sạch đẹp
    c7 = c7.replace(/Hết hạn(?: lúc \d{1,2}:\d{2})? (?:Ngày )?\d{1,2}\/\d{1,2}\/\d{4}/ig, '').trim();

    if (isHeThong) {
        c7 = c7.replace(/hệ thống/ig, '').trim();
    } else if (isRenLuyen) {
        c7 = c7.replace(/rèn luyện/ig, '').trim();
    }
    
    // Xóa các dấu câu dư thừa ở đầu và cuối chuỗi sau khi cắt chữ
    c7 = c7.replace(/^[:\-,\s|]+/, '').replace(/[:\-,\s|]+$/, '').trim();
    
    detailData[rowIndex] = { c1, c2, c3, c4, c5, c6, c7, isNew };

    // Khởi tạo dateDisplay, countdownHtml, adminHtml giữ nguyên như cũ...
    let dateDisplay = `
    <div class="d-inline-flex gap-2 flex-wrap">
        <span class="tb-date-text"><i class="fa-regular fa-calendar"></i> Ngày đăng: ${c4 || 'Gần đây'}</span>
        ${c5 ? `<span class="tb-date-text text-success"><i class="fa-solid fa-clock-rotate-left"></i> Ngày cập nhật: ${c5}</span>` : ''}
    </div>`;

    let badgeHtml = isNew ? `<div class="tb-badge-new">Mới</div>` : '';
    let countdownHtml = '';
    if (deadlineTime) {
        countdownHtml = `
        <div class="tb-countdown tb-countdown-list" data-deadline="${deadlineTime}">
            <i class="fa-solid fa-spinner fa-spin"></i> Đang tính toán...
        </div>`;
    }

    let adminHtml = '';
    if (isAdmin) {
        let sheetRowIndex = rowIndex + 1;
        const escapeJS = (str) => String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, "\\n").replace(/\r/g, "");
        let ec1 = escapeJS(c1); let ec2 = escapeJS(c2); let ec3 = escapeJS(c3); 
        let ec4 = escapeJS(c4); let ec5 = escapeJS(c5); let ec6 = escapeJS(c6); let ec7 = escapeJS(c7_raw);
        
        adminHtml = `
        <div class="mt-2" onclick="event.stopPropagation();">
            <button class="btn btn-sm btn-outline-secondary py-0 px-2" title="Lên" onclick="moveRowItem(${sheetRowIndex}, 'up')"><i class="fa-solid fa-arrow-up"></i></button>
            <button class="btn btn-sm btn-outline-secondary py-0 px-2" title="Xuống" onclick="moveRowItem(${sheetRowIndex}, 'down')"><i class="fa-solid fa-arrow-down"></i></button>
            <button class="btn btn-sm btn-outline-success py-0 px-2 fw-bold" onclick="openInsertRowModal(${sheetRowIndex})"><i class="fa-solid fa-plus"></i></button>
            <button class="btn btn-sm btn-outline-warning py-0 px-2 fw-bold" onclick="openEditRowModal(${sheetRowIndex}, '${ec1}', '${ec2}', '${ec3}', '${ec4}', '${ec5}', '${ec6}', '${ec7}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm btn-outline-danger py-0 px-2 fw-bold" onclick="deleteRowItem(${sheetRowIndex})"><i class="fa-solid fa-trash"></i></button>
        </div>`;
    }

    // Phân luồng HTML: Hệ thống (Banner) vs Thông thường (Item List)
    if (isHeThong) {
        heThongItemsHtml += `
        <div class="alert alert-warning shadow-sm border-warning border-start border-4 mb-3 position-relative" role="alert" style="border-radius: 8px; cursor: pointer; background: #fffbeb;" onclick="viewThongBaoDetail(${rowIndex})">
            <div class="d-flex align-items-start gap-3">
                <i class="fa-solid fa-bullhorn text-warning fs-3 mt-1"></i>
                <div class="flex-grow-1">
                    <div class="fw-bold text-dark mb-1" style="font-size: 16.5px;">[THÔNG BÁO HỆ THỐNG] ${c2} ${badgeHtml}</div>
                    <div class="tb-item-dates d-flex align-items-center flex-wrap gap-3" style="font-size: 13px;">
                        ${dateDisplay}
                        ${countdownHtml}
                    </div>
                </div>
            </div>
            ${isAdmin ? `<div class="mt-2 text-end">${adminHtml}</div>` : ''}
        </div>`;
    } else {
        let itemHtml = `
        <div class="tb-list-item" onclick="viewThongBaoDetail(${rowIndex})">
            <div class="tb-icon-wrapper">
                <i class="fa-solid fa-bell"></i>
                ${badgeHtml}
            </div>
            <div class="tb-item-info">
                <div class="tb-item-title" style="font-size: 17px; font-weight: 600;">${c2}</div>
                <div class="tb-item-dates d-flex align-items-center flex-wrap gap-3" style="font-size: 13px;">
                    ${dateDisplay}
                    ${countdownHtml}
                </div>
                ${adminHtml}
            </div>
        </div>`;
        
        if (isRenLuyen) renLuyenItemsHtml += itemHtml;
        else hocThuatItemsHtml += itemHtml;
    }
});

                if (!hocThuatItemsHtml) hocThuatItemsHtml = '<div class="text-muted text-center py-4">Chưa có thông báo học thuật nào.</div>';
                if (!renLuyenItemsHtml) renLuyenItemsHtml = '<div class="text-muted text-center py-4">Chưa có hoạt động rèn luyện nào.</div>';

                window.thongBaoData = detailData;

                let detailHtml = `
                <div id="tbDetailContainer" class="d-none">
                    <div class="tb-detail-box shadow-sm">
                        <div class="tb-header-blue" style="cursor: pointer;" onclick="backToThongBaoList()">
                            <i class="fa-solid fa-arrow-left me-2"></i> Trở lại <span class="mx-2">|</span> <i class="fa-solid fa-globe me-2"></i> Tin tức - Thông báo chi tiết
                        </div>
                        <div class="tb-detail-body" id="tbDetailContent"></div>
                    </div>
                </div>
                `;

                if (!window.tbDetailFunctionsInjected) {
                    window.viewThongBaoDetail = function(index) {
                        let data = window.thongBaoData[index];
                        if(!data) return;
                        
                        let dateDisplay = `<span class="tb-date-text"><i class="fa-regular fa-calendar text-primary"></i> Ngày đăng: ${data.c4 || 'Gần đây'}</span>`;
                        if (data.c5) dateDisplay += `<span class="tb-date-text"><i class="fa-solid fa-clock-rotate-left text-success"></i> Ngày cập nhật: ${data.c5}</span>`;

                        let linkHtml = data.c6 ? `<div class="mt-4"><a href="${data.c6}" target="_blank" class="btn fw-bold text-white shadow-sm px-4" style="background: #0f4c81; border-radius: 8px;"><i class="fa-solid fa-link me-2"></i>Truy cập liên kết đính kèm</a></div>` : '';
                        let noteHtml = data.c7 ? `<div class="mt-4 p-3 border-start border-4 border-warning rounded text-dark" style="background: #fffbeb;"><strong><i class="fa-solid fa-paperclip me-1"></i> Ghi chú:</strong> ${data.c7}</div>` : '';
let detailDeadlineTime = extractDeadline(data.c3) || extractDeadline(data.c7);
let detailCountdownHtml = '';
if (detailDeadlineTime) {
    detailCountdownHtml = `
    <div class="tb-countdown" data-deadline="${detailDeadlineTime}" style="font-size: 14px; padding: 6px 14px; border-width: 2px;">
        <i class="fa-solid fa-spinner fa-spin"></i> Đang tính toán...
    </div>`;
}

                       // Xử lý xuống dòng và tự động chuyển đổi [IMG] thành hình ảnh (kèm hiệu ứng bo góc, đổ bóng mượt mà)
// Xử lý xuống dòng
// Xử lý xuống dòng
let processedContent = data.c3.replace(/\n/g, '<br>');

// 1. Tự động nhận diện Link thành chữ gạch chân (Bảo vệ an toàn cho cú pháp [IMG])
processedContent = processedContent.replace(/(\[IMG(?:=.*?)?\].*?\[\/IMG\])|(https?:\/\/[^\s<]+)/gi, function(match, isImg, isUrl) {
    if (isImg) {
        return isImg; // Nếu là thẻ hình ảnh [IMG] thì giữ nguyên không đụng tới
    }
    if (isUrl) {
        // Cắt bỏ dấu câu (chấm, phẩy...) ở cuối link nếu người dùng lỡ gõ dính vào
        let cleanUrl = isUrl.replace(/[.,;!?]+$/, ''); 
        let trailing = isUrl.slice(cleanUrl.length);
        
        // Tạo chữ gạch chân đơn giản, màu xanh lam nhạt cho hài hòa giao diện
        return `<a href="${cleanUrl}" target="_blank" style="color: #0284c7; text-decoration: underline; font-weight: 600;">${cleanUrl}</a>${trailing}`;
    }
    return match;
});

// 2. Xử lý ảnh có kích thước tùy chỉnh (Ví dụ: [IMG=500px]link[/IMG] hoặc [IMG=50%]link[/IMG])
processedContent = processedContent.replace(/\[IMG=(.*?)\](.*?)\[\/IMG\]/gi, '<div class="text-center my-3"><a href="$2" target="_blank" title="Bấm để xem ảnh gốc"><img src="$2" style="width: $1; max-width: 100%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); object-fit: contain;"></a></div>');

// 3. Xử lý ảnh mặc định to full màn hình (Ví dụ: [IMG]link[/IMG])
processedContent = processedContent.replace(/\[IMG\](.*?)\[\/IMG\]/gi, '<div class="text-center my-3"><a href="$1" target="_blank" title="Bấm để xem ảnh gốc"><img src="$1" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);"></a></div>');

let html = `
<div class="tb-detail-title-small" style="font-size: 22px; font-weight: bold;">${data.c2}</div>
    <div class="tb-detail-dates mb-2 d-flex align-items-center flex-wrap gap-3" style="font-size: 15px; padding-bottom: 8px; border-bottom: none;">
        ${dateDisplay}
        ${detailCountdownHtml}
    </div>
    <div class="tb-detail-main-content" style="font-size: 18px; line-height: 1.6; border-top: 2px solid #f3f4f6; padding-top: 16px;">
        ${processedContent}
    </div>
    ${noteHtml}
    ${linkHtml}
`;                        
$('#tbDetailContent').html(html);
                        $('#tbMainView').addClass('d-none');
                        $('#tbDetailContainer').removeClass('d-none');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
			applyKaTeX('tbDetailContent');
                    };

                    window.backToThongBaoList = function() {
                        $('#tbDetailContainer').addClass('d-none');
                        $('#tbMainView').removeClass('d-none');
                    };

                    window.searchThongBao = function() {
                        let keyword = $('#tbSearchInput').val().toLowerCase().trim();
                        $('.tb-list-item').each(function() {
                            let textContent = $(this).text().toLowerCase();
                            if (textContent.includes(keyword)) {
                                $(this).removeClass('d-none');
                            } else {
                                $(this).addClass('d-none');
                            }
                        });

                        // Tự động ẩn danh mục nếu không tìm thấy item nào phù hợp bên trong
                        ['HocThuat', 'RenLuyen'].forEach(type => {
                            let visibleCount = $(`#tbItems${type} .tb-list-item:not(.d-none)`).length;
                            if (visibleCount === 0 && keyword !== '') {
                                $(`#tbSection${type}`).addClass('d-none');
                            } else {
                                $(`#tbSection${type}`).removeClass('d-none');
                            }
                        });
                    };

                    window.tbDetailFunctionsInjected = true;
                }

                let customViewHtml = `
                <div class="row g-4 mt-2 mb-4">
                    <div class="col-12" id="tbMainView">
                        ${mainHtml}
                    </div>
                    <div class="col-12">
                        ${detailHtml}
                    </div>
                </div>
                `;

                if ($('#customViewWrapper').length === 0) $('#tableWrapper').before('<div id="customViewWrapper" class="w-100"></div>');
                $('#customViewWrapper').html(customViewHtml).removeClass('d-none');
                if (heThongItemsHtml === '') {
    $('#tbItemsHeThong').addClass('d-none');
} else {
    $('#tbItemsHeThong').removeClass('d-none');
}
$('#tbItemsHeThong').html(heThongItemsHtml);
$('#tbItemsHocThuat').html(hocThuatItemsHtml);
$('#tbItemsRenLuyen').html(renLuyenItemsHtml);

applyKaTeX('customViewWrapper');
$('#loadingStatus').addClass('d-none');
                return;
            }

            // ==========================================
            // XỬ LÝ CHO CÁC HỌC PHẦN BÌNH THƯỜNG (BẢNG 7 CỘT)
            // ==========================================
            let bodyHtml = ''; let headHtml = ''; let instructorInfos = [];
            let examCardsHtml = ''; let hasExamCards = false; 

            data.forEach((row, rowIndex) => {
                let fullRowText = row.join(" ").toLowerCase().replace(/\s+/g, ' '); 
                let firstCellTextRaw = String(row[0]).trim(); 
                let firstCellText = firstCellTextRaw.toLowerCase().replace(/\s+/g, '');
                
                // Xử lý tiêu đề cột
                if (rowIndex === 0) { 
                    row.forEach((cell) => { headHtml += `<th>${String(cell || '')}</th>`; });
                    if (isAdmin) headHtml += `<th style="width: 180px; min-width: 180px;">Thao tác</th>`; 
                    return; 
                }
                
                // Trích xuất thông tin giảng viên
                if (/mãhp|họcphần|gv\d|giảngviên|email|facebook|sốtínchỉ/.test(fullRowText.replace(/\s+/g, ''))) { 
                    let info = row.filter(cell => String(cell).trim() !== "").join(" <span class='mx-2 text-black-50'>|</span> "); 
                    if(info) instructorInfos.push(info); 
                    return; 
                }

                // Trích xuất thẻ bài kiểm tra/minigame
               // Trích xuất thẻ bài kiểm tra/minigame
// Trích xuất thẻ bài kiểm tra/minigame
// Trích xuất thẻ bài kiểm tra/minigame
let isSpecialExam = /(đề thi thử|đề demo|minigame tuần|minigame hè|minigame số)/i.test(fullRowText);
if (isSpecialExam) {
    hasExamCards = true; 
    let titleText = String(row[1] || row[0]).trim(); 
    let _extRegex = /(https?:\/\/[^\s]+)/g; 
    let extMatch = row.join(" ").match(_extRegex); 
    let linkUrl = '#'; 
    let imageUrl = '';   
    
    if (extMatch) {
        linkUrl = extMatch[0]; 
        if (extMatch.length > 1) {
            imageUrl = extMatch[1];
            if (imageUrl.includes("drive.google.com/file/d/")) {
                let matchId = imageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                if (matchId && matchId[1]) imageUrl = `https://drive.google.com/thumbnail?id=${matchId[1]}&sz=w400`; // Thu nhỏ dung lượng thumbnail
            }
        }
    }
    
    // Khung chứa ảnh nhỏ gọn, chuyên trị ảnh tròn
    let imgDisplayHtml = '';
    if (imageUrl) {
        imgDisplayHtml = `
            <div class="card-minigame-img">
                <img src="${imageUrl}">
            </div>`;
    } else {
        let iconClass = fullRowText.includes("minigame") ? "fa-gamepad" : "fa-file-lines";
        imgDisplayHtml = `
            <div class="card-minigame-img default-icon">
                <i class="fa-solid ${iconClass}"></i>
            </div>`;
    }

    // Thẻ Minigame khôi phục lại viền đỏ bo tròn
    examCardsHtml += `
        <a href="${linkUrl}" target="_blank" class="card-minigame-box" title="${titleText}">
            ${imgDisplayHtml}
            <div class="card-minigame-title">${titleText}</div>
        </a>`;
    return; 
}
                // Định dạng hàng (màu sắc, icon)
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

                // Render nút Admin
                if (isAdmin) {
                    let sheetRowIndex = rowIndex + 1; 
                  let escapedCells = row.map(c => String(c || '').replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, "\\n").replace(/\r/g, ""));
                    while(escapedCells.length < 7) escapedCells.push(''); // Đảm bảo đủ 7 cột
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

            // Gắn dữ liệu vào DOM
            if (hasExamCards) $('#examCardsContainer').html(examCardsHtml).removeClass('d-none');
            if (instructorInfos.length > 0) { 
                let cardContent = `<div class="instructor-card"><h6 class="mb-4"><i class="fa-solid fa-chalkboard-user me-2"></i>Thông tin lớp học & Giảng viên phụ trách</h6><div class="row">`; 
                instructorInfos.forEach(info => { cardContent += `<div class="col-12 col-md-6 instructor-item"><i class="fa-solid fa-check"></i> <span>${info}</span></div>`; }); 
                cardContent += `</div></div>`; 
                $('#instructorArea').html(cardContent).removeClass('d-none'); 
            }
            
            $('#sheetTableHead').html(headHtml); 
            $('#sheetTableBody').html(bodyHtml); 
            $('#loadingStatus').addClass('d-none'); 
            $('#tableWrapper').removeClass('d-none'); 
            $('#swipeHint').removeClass('d-none');
applyKaTeX('instructorArea');    // Quét phần thông tin giảng viên (nếu có công thức)
            applyKaTeX('tableWrapper');      // Quét toàn bộ nội dung trong bảng 7 cột
            if (hasExamCards) applyKaTeX('examCardsContainer');
        },
        error: function() { 
            $('#loadingStatus').html('<span class="text-danger fw-bold">Có lỗi xảy ra khi tải dữ liệu!</span>'); 
        }
    });
}


function initGlobalApp() {
    $('.app-container, .mobile-header').css('display', '');
    setTimeout(pingOnlineStatus, 1000); 
    setInterval(pingOnlineStatus, 25000);
    
    // --- THÊM MỚI TỪ ĐÂY ---
    // Gọi ngầm kiểm tra dữ liệu Q&A mỗi 12 giây (12000 ms)
// Thay thế đoạn setInterval kiểm tra QA ngầm thành như sau:
setInterval(function() {
    if (!$('#qaSection').hasClass('d-none')) {
        silentCheckNewQA();
    } else {
        checkNewQA(); 
    }
}, 5000); // Rút ngắn xuống 5 giây để load nhanh như web Real-time
    // --- KẾT THÚC THÊM MỚI ---

    fetchSemesterConfig(); 
    loadDataByHocPhan('Thông báo', document.getElementById('btnNavThongBao')); 
    loadWebLinks(); 
    checkNewQA(); 
    fetchAndRenderCategories();
    renderUserInfo();
    
    if (currentUser && currentUser.mssv === "51.01.108.008") {
        $('#adminDatabaseLink').removeClass('d-none');
    } else {
        $('#adminDatabaseLink').addClass('d-none');
    }
}
        $(document).ready(function() {
            if (!currentUser) {
                let authModal = new bootstrap.Modal(document.getElementById('userAuthModal'), { backdrop: 'static', keyboard: false });
                $('#userAuthModal .btn-close').hide(); 
                renderSavedAccounts(); 
                authModal.show();
            } else { initGlobalApp(); }
        });

// ==========================================
// TÍNH NĂNG TÍNH ĐIỂM GPA (BẢN CHUẨN CUỐI CÙNG)
// ==========================================
let myGPADataset = JSON.parse(localStorage.getItem('myGPADataset')) || [];
function loadGPAView() {
    document.title = "Tính điểm GPA | Học nhóm Năm 2 Khoa Toán";
    resetNavActive(); 
    $('#btnNavGPA').addClass('active'); 
    $('#gpaSection').removeClass('d-none');
    if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); }
    
    if (currentUser) {
        $('#gpaCourseList').html('<div class="text-center text-muted py-5"><i class="fa-solid fa-spinner fa-spin fs-2 mb-2"></i><br>Đang đồng bộ dữ liệu điểm và cấu hình...</div>');
        
        // 1. Gọi lấy cấu hình Song ngành từ Server trước
        $.ajax({
            url: SCRIPT_URL + "?action=getGPAConfig&mssv=" + currentUser.mssv,
            method: "GET", 
            dataType: "json",
            success: function(configRes) {
                if (configRes && configRes !== "") {
                    try {
                        let parsedConfig = typeof configRes === 'string' ? JSON.parse(configRes) : configRes;
                        // Chỉ cập nhật nếu có dữ liệu hợp lệ
                        if (parsedConfig && parsedConfig.name1) {
                            gpaConfig = parsedConfig;
                            localStorage.setItem('gpaConfig', JSON.stringify(gpaConfig));
                        }
                    } catch(e) { console.error("Lỗi đọc cấu hình GPA:", e); }
                }
            },
            complete: function() {
                // 2. Sau khi đã cập nhật cấu hình xong, tiến hành tải danh sách môn học
                $.ajax({
                    url: SCRIPT_URL + "?action=getGPAUser&mssv=" + currentUser.mssv,
                    method: "GET", dataType: "json",
                    success: function(res) {
                        try {
                            myGPADataset = typeof res === 'string' ? JSON.parse(res) : res;
                            if(!Array.isArray(myGPADataset)) myGPADataset = [];
                        } catch(e) { myGPADataset = []; }
                        renderGPAList(false); 
                    },
                    error: function() {
                        myGPADataset = JSON.parse(localStorage.getItem('myGPADataset_' + currentUser.mssv)) || [];
                        renderGPAList(false);
                    }
                });
            }
        });
    } else {
        myGPADataset = JSON.parse(localStorage.getItem('myGPADataset_guest')) || [];
        renderGPAList(false);
    }
}
const originalResetNav = resetNavActive;
resetNavActive = function() {
    originalResetNav();
    $('#btnNavGPA').removeClass('active');
    $('#gpaSection').addClass('d-none');
};

function convertGradeToSystem(score10, type) {
    // FIX: Làm tròn chính xác đến 1 chữ số thập phân trước khi đối chiếu
   let roundedScore = parseFloat((Math.round((score10 + Number.EPSILON) * 100) / 100).toFixed(1));
    
    let scale4 = 0, letter = "F";
    if (roundedScore >= 8.5) { scale4 = 4.0; letter = "A"; }
    else if (roundedScore >= 7.8) { scale4 = 3.5; letter = "B+"; }
    else if (roundedScore >= 7.0) { scale4 = 3.0; letter = "B"; }
    else if (roundedScore >= 6.3) { scale4 = 2.5; letter = "C+"; }
    else if (roundedScore >= 5.5) { scale4 = 2.0; letter = "C"; }
    else if (roundedScore >= 4.8) { scale4 = 1.5; letter = "D+"; }
    else if (roundedScore >= 4.0) { scale4 = 1.0; letter = "D"; }
    else if (roundedScore >= 3.0) { scale4 = 0.0; letter = "F+"; }
    else { scale4 = 0.0; letter = "F"; }

    // Mức qua môn chuẩn (>= 4.0 là D). Các môn ngoại lệ có thể yêu cầu >= 5.0
    let passed = false;
    if (type === 'chuyen_nganh') { 
        passed = roundedScore >= 5.5; 
    } else if (type === 'mon_chung') {
        passed = roundedScore >= 4.0; 
    } else if (type === 'ngoai_le') { 
        passed = roundedScore >= 5.0; 
    }

    return { scale4, letter, passed, roundedScore };
}

// 1. HÀM TÍNH TOÁN ĐIỂM SỐ ĐỘC LẬP
function computeStatsForDataset(dataset) {
    let totalAttemptedCredits = 0; 
    let totalAccumulatedCredits = 0; 
    let totalScore4 = 0;
    let totalScore10 = 0;

    dataset.forEach(course => {
        let bestAttempt = 1; 
        let maxScore4 = -1; 
        let maxScore10 = -1; 
        let bestConv = null;

        for(let i = 1; i <= 3; i++) {
            let hasAllScores = true; 
            let currentScore10 = 0;
            let hasAnyColumn = course.columns.length > 0;

            course.columns.forEach(col => {
                let val = parseFloat(col['score' + i]);
                if(isNaN(val) || col['score' + i] === '') { 
                    hasAllScores = false; 
                } else {
                    currentScore10 += (val * col.percent) / 100;
                }
            });

            if(hasAllScores && hasAnyColumn) {
                let conv = convertGradeToSystem(currentScore10, course.type);
                if(conv.scale4 > maxScore4 || (conv.scale4 === maxScore4 && conv.roundedScore > maxScore10)) {
                    maxScore4 = conv.scale4; 
                    maxScore10 = conv.roundedScore; 
                    bestConv = conv; 
                    bestAttempt = i;
                }
            }
        }

        // Gán trạng thái đậu rớt vào object môn học
        if (maxScore10 >= 0) {
            course.finalScore10 = maxScore10.toFixed(1);
            course.finalScore4 = bestConv.scale4.toFixed(1);
            course.letter = bestConv.letter;
            course.passed = bestConv.passed;
        } else {
            course.finalScore10 = "-";
            course.finalScore4 = "-";
            course.letter = "-";
            course.passed = false;
        }
        
        course.bestAttempt = maxScore10 >= 0 ? bestAttempt : 1;
        let creds = parseInt(course.credits) || 0;

        if (course.type !== 'ngoai_le') {
            if (maxScore10 >= 0) { 
                // Cộng dồn để chia trung bình GPA (Bao gồm cả môn Rớt)
                totalAttemptedCredits += creds; 
                totalScore4 += (maxScore4 * creds);
                totalScore10 += (maxScore10 * creds);
                
                // CHỈ TÍNH TÍN CHỈ TÍCH LŨY NẾU ĐÃ QUA MÔN (ĐẠT)
                if (course.passed) {
                    totalAccumulatedCredits += creds;
                }
            }
        }
    });

    let gpa4 = totalAttemptedCredits > 0 ? (totalScore4 / totalAttemptedCredits).toFixed(2) : "0.00";
    let gpa10 = totalAttemptedCredits > 0 ? (totalScore10 / totalAttemptedCredits).toFixed(2) : "0.00";

    return { gpa4, gpa10, credits: totalAccumulatedCredits };
}

// 2. HÀM HIỂN THỊ CÁC Ô CARD THỐNG KÊ LÊN GIAO DIỆN
// 2. HÀM HIỂN THỊ CÁC Ô CARD THỐNG KÊ LÊN GIAO DIỆN (ĐÃ FIX SONG NGÀNH)
function renderGPAStats() {
    let statsContainer = $('#gpaStatsArea');
    
    // NẾU BẬT SONG NGÀNH VÀ ĐANG XEM TAB "TẤT CẢ" -> HIỂN THỊ CHIA ĐÔI
    if (gpaConfig.isDoubleMajor && currentMajorFilter === 'all') {
        let ds1 = myGPADataset.filter(c => {
            let m = c.majors || ['1'];
            // FIX: Tự động gán môn chung và ngoại lệ cho cả 2 ngành để tính điểm
            if (c.type === 'mon_chung' || c.type === 'ngoai_le') {
                m = ['1', '2'];
            }
            return m.includes('1');
        });
        
        let ds2 = myGPADataset.filter(c => {
            let m = c.majors || ['1'];
            // FIX: Tự động gán môn chung và ngoại lệ cho cả 2 ngành để tính điểm
            if (c.type === 'mon_chung' || c.type === 'ngoai_le') {
                m = ['1', '2'];
            }
            return m.includes('2');
        });

        let s1 = computeStatsForDataset(ds1);
        let s2 = computeStatsForDataset(ds2);

        let n1 = gpaConfig.name1;
        let n2 = gpaConfig.name2;

        let html = `
            <div class="col-md-4">
                <div class="online-card text-center shadow-sm border px-2 py-3 h-100">
                    <h6 class="text-muted fw-bold mb-3">GPA (Hệ 4.0)</h6>
                    <div class="d-flex justify-content-center align-items-center">
                        <div class="w-50 text-center"><h3 class="text-danger fw-bold m-0">${s1.gpa4}</h3><small class="text-muted d-block text-truncate mt-1" style="font-size: 11px;">${n1}</small></div>
                        <div style="width: 1px; height: 35px; background-color: #e2e8f0; margin: 0 10px;"></div>
                        <div class="w-50 text-center"><h3 class="text-danger fw-bold m-0">${s2.gpa4}</h3><small class="text-muted d-block text-truncate mt-1" style="font-size: 11px;">${n2}</small></div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="online-card text-center shadow-sm border px-2 py-3 h-100">
                    <h6 class="text-muted fw-bold mb-3">Trung bình (Hệ 10)</h6>
                    <div class="d-flex justify-content-center align-items-center">
                        <div class="w-50 text-center"><h3 class="text-primary fw-bold m-0">${s1.gpa10}</h3><small class="text-muted d-block text-truncate mt-1" style="font-size: 11px;">${n1}</small></div>
                        <div style="width: 1px; height: 35px; background-color: #e2e8f0; margin: 0 10px;"></div>
                        <div class="w-50 text-center"><h3 class="text-primary fw-bold m-0">${s2.gpa10}</h3><small class="text-muted d-block text-truncate mt-1" style="font-size: 11px;">${n2}</small></div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="online-card text-center shadow-sm border px-2 py-3 h-100">
                    <h6 class="text-muted fw-bold mb-3">Tín chỉ (Đã qua)</h6>
                    <div class="d-flex justify-content-center align-items-center">
                        <div class="w-50 text-center"><h3 class="text-success fw-bold m-0">${s1.credits}</h3><small class="text-muted d-block text-truncate mt-1" style="font-size: 11px;">${n1}</small></div>
                        <div style="width: 1px; height: 35px; background-color: #e2e8f0; margin: 0 10px;"></div>
                        <div class="w-50 text-center"><h3 class="text-success fw-bold m-0">${s2.credits}</h3><small class="text-muted d-block text-truncate mt-1" style="font-size: 11px;">${n2}</small></div>
                    </div>
                </div>
            </div>
        `;
        statsContainer.html(html);
    } else {
        // HIỂN THỊ 1 GIÁ TRỊ (Khi không bật Song ngành hoặc đang click Lọc xem 1 ngành cụ thể)
        let displayDataset = myGPADataset.filter(c => {
            let cMajors = c.majors || ['1']; 
            
            // FIX: Tự động gán môn chung và ngoại lệ cho cả 2 ngành để tính điểm
            if (c.type === 'mon_chung' || c.type === 'ngoai_le') {
                cMajors = ['1', '2'];
            }

            if (currentMajorFilter === 'all') return true;
            if (currentMajorFilter === '1') return cMajors.includes('1');
            if (currentMajorFilter === '2') return cMajors.includes('2');
            return true;
        });
        
        let s = computeStatsForDataset(displayDataset);
        let labelSuffix = "";
        if (gpaConfig.isDoubleMajor && currentMajorFilter === '1') labelSuffix = `<br><span class="badge bg-primary mt-2" style="font-size:10px;">${gpaConfig.name1}</span>`;
        if (gpaConfig.isDoubleMajor && currentMajorFilter === '2') labelSuffix = `<br><span class="badge bg-success mt-2" style="font-size:10px;">${gpaConfig.name2}</span>`;

        let html = `
            <div class="col-md-4">
                <div class="online-card text-center shadow-sm border h-100">
                    <h6 class="text-muted fw-bold mb-2">GPA (Hệ 4.0)</h6>
                    <h2 class="text-danger fw-bold m-0">${s.gpa4}</h2>
                    ${labelSuffix}
                </div>
            </div>
            <div class="col-md-4">
                <div class="online-card text-center shadow-sm border h-100">
                    <h6 class="text-muted fw-bold mb-2">Trung bình (Hệ 10)</h6>
                    <h2 class="text-primary fw-bold m-0">${s.gpa10}</h2>
                    ${labelSuffix}
                </div>
            </div>
            <div class="col-md-4">
                <div class="online-card text-center shadow-sm border h-100">
                    <h6 class="text-muted fw-bold mb-2">Tín chỉ tích lũy (Đã qua)</h6>
                    <h2 class="text-success fw-bold m-0">${s.credits}</h2>
                    ${labelSuffix}
                </div>
            </div>
        `;
        statsContainer.html(html);
    }
}
// 3. HÀM RENDER TỔNG THỂ (ĐƯỢC GỌI KHI CẬP NHẬT GIAO DIỆN)
function renderGPAList(syncToServer = true) {
    applyGpaConfigUI();
    
    // Lọc danh sách học phần theo tab Ngành đang xem
    let displayDataset = myGPADataset.filter(c => {
        let cMajors = c.majors || ['1']; 
	if (c.type === 'mon_chung' || c.type === 'ngoai_le') {
        cMajors = ['1', '2'];
    }
        if (currentMajorFilter === 'all') return true;
        if (currentMajorFilter === '1') return cMajors.includes('1');
        if (currentMajorFilter === '2') return cMajors.includes('2');
        return true;
    });

    // Tính toán để gán điểm số vào object cho việc vẽ Bảng
    computeStatsForDataset(displayDataset);
    
    // Vẽ lại 3 khung thẻ điểm số trên cùng
    renderGPAStats();
    
    let storageKey = currentUser ? 'myGPADataset_' + currentUser.mssv : 'myGPADataset_guest';
    localStorage.setItem(storageKey, JSON.stringify(myGPADataset));
    
    if (syncToServer && currentUser) {
        postToGAS({ action: "saveGPAUser", mssv: currentUser.mssv, gpaData: JSON.stringify(myGPADataset) }, function(){}, function(){});
    }
    
    if (displayDataset.length === 0) {
        let msg = currentMajorFilter === 'all' 
            ? "Chưa có học phần nào được thêm." 
            : "Chưa có học phần nào thuộc ngành này.";
        $('#gpaCourseList').html(`<div class="text-center text-muted py-5"><i class="fa-solid fa-box-open fs-2 mb-2"></i><br>${msg}</div>`);
        return;
    }

    // (Phần vẽ bảng chi tiết ở dưới giữ nguyên như cũ của bạn)
    const groups = [
        { type: 'chuyen_nganh', title: 'Học phần Chuyên ngành', icon: 'fa-book-open', color: 'primary' },
        { type: 'mon_chung', title: 'Môn học Chung', icon: 'fa-layer-group', color: 'success' },
        { type: 'ngoai_le', title: 'GDTC & GDQP (Không tính GPA)', icon: 'fa-person-running', color: 'secondary' }
    ];

    let html = '<div class="table-responsive border-0"><table class="gpa-main-table w-100" style="border-collapse: collapse; background: #fff;">';
    let globalIndex = 1;
    
    groups.forEach(group => {
        let coursesInGroup = displayDataset.filter(c => c.type === group.type);
        
        if (coursesInGroup.length > 0) {
            html += `
                <thead>
                    <tr>
                        <th colspan="9" class="text-start fs-6 border-bottom-0 pb-2 pt-4" style="background-color: #f8fafc !important; color: var(--bs-${group.color}); font-weight: 800; text-transform: uppercase;">
                            <i class="fa-solid ${group.icon} me-2"></i>${group.title}
                        </th>
                    </tr>
                    <tr style="background: #0f4c81; color: white;">
                        <th class="text-center" style="padding: 16px 10px; width: 50px; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.1);">STT</th>
                        <th class="text-center" style="padding: 16px 10px; width: 110px; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.1);">Mã HP</th>
                        <th class="text-start" style="padding: 16px 10px; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.1);">Tên học phần</th>
                        <th class="text-center" style="padding: 16px 10px; width: 70px; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.1);">Tín chỉ</th>
                        <th class="text-center" style="padding: 16px 10px; width: 80px; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.1);">Hệ 10</th>
                        <th class="text-center" style="padding: 16px 10px; width: 80px; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.1);">Hệ 4.0</th>
                        <th class="text-center" style="padding: 16px 10px; width: 90px; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.1);">Điểm chữ</th>
                        <th class="text-center" style="padding: 16px 10px; width: 70px; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.1);">Đạt</th>
                        <th class="text-center" style="padding: 16px 10px; width: 130px; font-weight: 600;">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
            `;
            
            coursesInGroup.forEach((c) => {
                let statusIcon = c.finalScore10 === "-" 
                    ? '<i class="fa-solid fa-minus text-muted" title="Chưa đủ điểm"></i>' 
                    : (c.passed ? '<i class="fa-solid fa-circle-check text-success fs-5"></i>' : '<i class="fa-solid fa-circle-xmark text-danger fs-5"></i>');
                let letterColor = c.finalScore10 === "-" 
                    ? "text-muted" 
                    : (c.passed ? "text-dark" : "text-danger");
                
                let subRows = '';
                c.columns.forEach((col, i) => {
                    subRows += `
                    <tr style="border-bottom: 1px solid #e2e8f0; background: #fff; height: 60px;">
                        <td class="text-center" style="padding: 22px 16px; border-right: 1px solid #e2e8f0; color: #4b5563; font-size: 15px;">${i + 1}</td>
                        <td class="text-start" style="padding: 22px 16px; border-right: 1px solid #e2e8f0; color: #1e293b; font-weight: 600; font-size: 15px;">${col.name}</td>
                        <td class="text-center" style="padding: 22px 16px; border-right: 1px solid #e2e8f0; color: #4b5563; font-size: 15px;">${col.percent}%</td>
                        <td class="text-center" style="padding: 22px 16px; border-right: 1px solid #e2e8f0; font-weight: 600; color: #1e293b; font-size: 15px;">${col.score1 || ''}</td>
                        <td class="text-center" style="padding: 22px 16px; border-right: 1px solid #e2e8f0; font-weight: 600; color: #1e293b; font-size: 15px;">${col.score2 || ''}</td>
                        <td class="text-center" style="padding: 22px 16px; font-weight: 600; color: #1e293b; font-size: 15px;">${col.score3 || ''}</td>
                    </tr>`;
                });

                let courseCode = c.code || '-';
                let titleDetail = c.code ? `${c.code} - ${c.name}` : c.name;

                let badgeHtml = '';
                if (gpaConfig.isDoubleMajor && currentMajorFilter === 'all') {
                    let cMajors = c.majors || ['1'];
                                      if (cMajors.includes('1')) badgeHtml += `<span class="badge bg-primary ms-2 shadow-sm" style="font-size: 10px; opacity: 0.9;">${gpaConfig.name1}</span>`;
                    if (cMajors.includes('2')) badgeHtml += `<span class="badge bg-success ms-2 shadow-sm" style="font-size: 10px; opacity: 0.9;">${gpaConfig.name2}</span>`;
                }

                html += `
                    <tr class="main-row" data-bs-toggle="collapse" data-bs-target="#detail-${c.id}" onclick="$(this).find('.btn-expand').toggleClass('open')" style="border-bottom: 1px solid #e5e7eb; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                        <td class="text-center text-muted fw-bold" style="padding: 18px 10px;">${globalIndex++}</td>
                        <td class="text-center fw-bold text-secondary" style="padding: 18px 10px;">${courseCode}</td>
                        <td class="text-start fw-bold" style="padding: 18px 10px; color: #334155;">
                            ${c.name} ${badgeHtml}
                        </td>
                        <td class="text-center" style="padding: 18px 10px;">${c.credits}</td>
                        <td class="text-center text-dark fw-bold" style="padding: 18px 10px;">${c.finalScore10}</td>
                        <td class="text-center text-primary fw-bold" style="padding: 18px 10px;">${c.finalScore4}</td>
                        <td class="text-center ${letterColor} fw-bold fs-6" style="padding: 18px 10px;">${c.letter}</td>
                        <td class="text-center" style="padding: 18px 10px;">${statusIcon}</td>
                        <td class="text-center" style="padding: 18px 10px;">
                            <div class="d-flex align-items-center justify-content-center">
                                <button class="btn btn-sm btn-outline-warning py-1 px-2 border-0 shadow-sm" onclick="event.stopPropagation(); editGPACourse('${c.id}')" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                                <button class="btn btn-sm btn-outline-danger py-1 px-2 border-0 shadow-sm ms-1" onclick="event.stopPropagation(); deleteGPACourse('${c.id}')" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                                <button class="btn-expand ms-2" style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: 0.3s;"><i class="fa-solid fa-chevron-down text-secondary" style="font-size: 13px;"></i></button>
                            </div>
                        </td>
                    </tr>
                    
                    <tr class="gpa-detail-row">
                        <td colspan="9" class="p-0 border-0">
                            <div class="collapse" id="detail-${c.id}">
                                <div style="padding: 24px 28px 28px 28px; background: #ffffff; border-bottom: 1px solid #e2e8f0;">
                                    <div class="fw-bold mb-3" style="font-size: 15.5px; color: #1e293b; text-align: left;">
                                        Chi tiết học phần: ${titleDetail}
                                    </div>
                                    <div style="border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.04);">
                                        <table class="w-100" style="border-collapse: collapse; text-align: center; font-size: 14.5px; min-width: 750px;">
                                            <thead>
                                                <tr style="background: #194670; color: #ffffff; height: 62px;">
                                                    <th class="text-center" style="padding: 20px 16px; font-weight: 600; width: 70px; border-right: 1px solid rgba(255,255,255,0.15); font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">STT</th>
                                                    <th class="text-start" style="padding: 20px 16px; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.15); font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Tên thành phần</th>
                                                    <th class="text-center" style="padding: 20px 16px; font-weight: 600; width: 14%; border-right: 1px solid rgba(255,255,255,0.15); font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Trọng số</th>
                                                    <th class="text-center" style="padding: 20px 16px; font-weight: 600; width: 14%; border-right: 1px solid rgba(255,255,255,0.15); font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Điểm lần 1</th>
                                                    <th class="text-center" style="padding: 20px 16px; font-weight: 600; width: 14%; border-right: 1px solid rgba(255,255,255,0.15); font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Điểm lần 2</th>
                                                    <th class="text-center" style="padding: 20px 16px; font-weight: 600; width: 14%; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Điểm lần 3</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${subRows}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            });
            html += `</tbody>`;
        }
    });
    
    html += '</table></div>';
    $('#gpaCourseList').html(html);
}
function toggleGPARetakeCols() {
    let isRetake = $('#gpaIsRetake').is(':checked');
    if (isRetake) {
        $('.gpa-col-s2-wrapper, .gpa-col-s3-wrapper').removeClass('d-none');
        $('.gpa-col-s1-wrapper').removeClass('col-md-5').addClass('col-md-2');
    } else {
        $('.gpa-col-s2-wrapper, .gpa-col-s3-wrapper').addClass('d-none');
        $('.gpa-col-s1-wrapper').removeClass('col-md-2').addClass('col-md-5');
    }
}

function addGPAColumnInput(name = '', percent = '', s1 = '', s2 = '', s3 = '') {
    let colId = 'col_' + Math.random().toString(36).substr(2, 9);
    let isRetake = $('#gpaIsRetake').is(':checked');
    let s1Class = isRetake ? 'col-md-2' : 'col-md-5';
    let retakeClass = isRetake ? '' : 'd-none';

    let html = `
    <div class="col-grade-input row g-2 align-items-center mb-2" id="${colId}">
        <div class="col-md-3"><input type="text" class="form-control form-control-sm gpa-col-name fw-bold" placeholder="Tên (VD: Giữa kỳ)" value="${name}"></div>
        <div class="col-md-2">
            <div class="input-group input-group-sm">
                <input type="number" class="form-control gpa-col-percent fw-bold text-center" placeholder="Tỉ lệ" value="${percent}">
                <span class="input-group-text bg-light">%</span>
            </div>
        </div>
        <div class="${s1Class} gpa-col-s1-wrapper"><input type="number" step="0.1" class="form-control form-control-sm gpa-col-s1 fw-bold text-center text-primary" placeholder="Điểm L1" value="${s1}"></div>
        <div class="col-md-2 gpa-col-s2-wrapper ${retakeClass}"><input type="number" step="0.1" class="form-control form-control-sm gpa-col-s2 fw-bold text-center text-success" placeholder="Điểm L2" value="${s2}"></div>
        <div class="col-md-2 gpa-col-s3-wrapper ${retakeClass}"><input type="number" step="0.1" class="form-control form-control-sm gpa-col-s3 fw-bold text-center text-warning" placeholder="Điểm L3" value="${s3}"></div>
        <div class="col-md-1 text-end"><button class="btn btn-sm text-danger p-1" onclick="$('#${colId}').remove()"><i class="fa-solid fa-xmark"></i></button></div>
    </div>`;
    $('#gpaColumnsContainer').append(html);
}
function openAddCourseGPAModal() {
    $('#gpaEditId').val(''); $('#gpaCourseCode').val(''); $('#gpaCourseName').val('');
    $('#gpaCourseCredits').val(3); $('#gpaCourseType').val('chuyen_nganh');
    $('#gpaIsRetake').prop('checked', false);
    
    $('#gpaBelongsToMajor1').prop('checked', true).prop('disabled', false);
    $('#gpaBelongsToMajor2').prop('checked', false).prop('disabled', false);

    $('#gpaColumnsContainer').html(''); 
    addGPAColumnInput();
    $('#gpaPercentWarning').addClass('d-none'); 
    
    handleGpaCourseTypeChange(); // Thêm dòng này
    $('#gpaCourseModal').modal('show');
}

function editGPACourse(id) {
    let course = myGPADataset.find(c => c.id === id); if(!course) return;
    $('#gpaEditId').val(course.id); $('#gpaCourseCode').val(course.code || ''); $('#gpaCourseName').val(course.name);
    $('#gpaCourseCredits').val(course.credits); $('#gpaCourseType').val(course.type);
    
    let courseMajors = course.majors || ['1']; 
    $('#gpaBelongsToMajor1').prop('checked', courseMajors.includes('1')).prop('disabled', false);
    $('#gpaBelongsToMajor2').prop('checked', courseMajors.includes('2')).prop('disabled', false);

    let hasRetake = course.columns.some(col => (col.score2 && col.score2 !== '') || (col.score3 && col.score3 !== ''));
    $('#gpaIsRetake').prop('checked', hasRetake);
    
    $('#gpaColumnsContainer').html('');
    course.columns.forEach(col => { addGPAColumnInput(col.name, col.percent, col.score1 || '', col.score2 || '', col.score3 || ''); });
    $('#gpaPercentWarning').addClass('d-none'); 
    
    handleGpaCourseTypeChange(); // Thêm dòng này
    $('#gpaCourseModal').modal('show');
}
function saveGPACourse() {
    let id = $('#gpaEditId').val() || Date.now().toString();
    let code = $('#gpaCourseCode').val().trim();
    let name = $('#gpaCourseName').val().trim();
    let credits = $('#gpaCourseCredits').val();
    let type = $('#gpaCourseType').val();
    
    // Lấy danh sách ngành được chọn
    let selectedMajors = [];
    if (gpaConfig.isDoubleMajor) {
        // Chỉ lấy đúng theo trạng thái tick trên giao diện, bất kể loại môn gì
        if ($('#gpaBelongsToMajor1').is(':checked')) selectedMajors.push('1');
        if ($('#gpaBelongsToMajor2').is(':checked')) selectedMajors.push('2');
        if (selectedMajors.length === 0) { alert("Vui lòng chọn ít nhất 1 ngành học cho môn này!"); return; }
    } else {
        selectedMajors = ['1'];
    }

    if(!name || !credits) { alert("Vui lòng nhập Tên môn và Số tín chỉ!"); return; }
    
    let columns = [];
    let totalPercent = 0;

    $('.col-grade-input').each(function() {
        let cName = $(this).find('.gpa-col-name').val().trim();
        let cPercent = parseFloat($(this).find('.gpa-col-percent').val()) || 0;
        let cScore1 = $(this).find('.gpa-col-s1').val();
        let cScore2 = $(this).find('.gpa-col-s2').val();
        let cScore3 = $(this).find('.gpa-col-s3').val();

        if (!cName && cPercent === 0) return;

        totalPercent += cPercent;
        columns.push({
            name: cName || "Cột điểm",
            percent: cPercent,
            score1: cScore1,
            score2: cScore2,
            score3: cScore3
        });
    });

    if (columns.length > 0 && Math.abs(totalPercent - 100) > 0.1) {
        $('#gpaPercentWarning').removeClass('d-none');
        return; 
    } else {
        $('#gpaPercentWarning').addClass('d-none');
    }
    
    let courseObj = { id, code, name, credits, type, columns, majors: selectedMajors };
    
    let existingIndex = myGPADataset.findIndex(c => c.id === id);
    if(existingIndex >= 0) { 
        myGPADataset[existingIndex] = courseObj; 
    } else { 
        myGPADataset.push(courseObj); 
    }

    $('#gpaCourseModal').modal('hide'); 
    renderGPAList();
}

function handleGpaCourseTypeChange() {
    if (!gpaConfig.isDoubleMajor) return;
    let type = $('#gpaCourseType').val();
    let isEdit = $('#gpaEditId').val() !== ''; // Kiểm tra xem đang thêm mới hay sửa
    
    // Chỉ tự động tick gợi ý Ngành 2 khi THÊM MỚI môn chung/ngoại lệ
    if (!isEdit && (type === 'mon_chung' || type === 'ngoai_le')) {
        $('#gpaBelongsToMajor1').prop('checked', true);
        $('#gpaBelongsToMajor2').prop('checked', true);
    }
    
    // Đảm bảo luôn MỞ KHÓA để người dùng tự do thay đổi
    $('#gpaBelongsToMajor1').prop('disabled', false);
    $('#gpaBelongsToMajor2').prop('disabled', false);
}

// Lắng nghe sự kiện thay đổi phân loại ngay trên form
$(document).on('change', '#gpaCourseType', function() {
    handleGpaCourseTypeChange();
});

function deleteGPACourse(id) {
    if(confirm("Bạn có chắc muốn xóa học phần này khỏi bảng tính GPA?")) {
        myGPADataset = myGPADataset.filter(c => c.id !== id); renderGPAList();
    }
}

let currentMajorFilter = 'all'; 
let gpaConfig = JSON.parse(localStorage.getItem('gpaConfig')) || { isDoubleMajor: false, name1: "Ngành 1", name2: "Ngành 2" };

function openGpaConfigModal() {
    $('#enableDoubleMajor').prop('checked', gpaConfig.isDoubleMajor);
    $('#configMajor1Name').val(gpaConfig.name1);
    $('#configMajor2Name').val(gpaConfig.name2);
    toggleDoubleMajorConfig();
    $('#gpaConfigModal').modal('show');
}

function toggleDoubleMajorConfig() {
    if ($('#enableDoubleMajor').is(':checked')) {
        $('#doubleMajorConfigArea').removeClass('d-none');
    } else {
        $('#doubleMajorConfigArea').addClass('d-none');
    }
}

function saveGpaConfig() {
    gpaConfig.isDoubleMajor = $('#enableDoubleMajor').is(':checked');
    gpaConfig.name1 = $('#configMajor1Name').val().trim() || "Ngành 1";
    gpaConfig.name2 = $('#configMajor2Name').val().trim() || "Ngành 2";
    localStorage.setItem('gpaConfig', JSON.stringify(gpaConfig));

    if (currentUser) {
        postToGAS({ 
            action: "saveGPAConfig",
            mssv: currentUser.mssv, 
            config: JSON.stringify(gpaConfig) 
        }, function(res) {
            alert("Đã đồng bộ cấu hình Song ngành lên hệ thống!");
        });
    }
    
    $('#gpaConfigModal').modal('hide');
    applyGpaConfigUI();
    renderGPAList();
}
function applyGpaConfigUI() {
    if (gpaConfig.isDoubleMajor) {
        $('#gpaMajorFilters').removeClass('d-none');
        $('#gpaMajorSelectionGroup').show();
        $('#filterMajor1').text(gpaConfig.name1);
        $('#filterMajor2').text(gpaConfig.name2);
        $('#lblMajor1Name').text(gpaConfig.name1);
        $('#lblMajor2Name').text(gpaConfig.name2);
    } else {
        $('#gpaMajorFilters').addClass('d-none');
        $('#gpaMajorSelectionGroup').hide();
        currentMajorFilter = 'all'; // Reset filter nếu tắt song ngành
    }
}

function setGpaMajorFilter(filterType) {
    currentMajorFilter = filterType;
    $('.btn-major-filter').removeClass('active');
    
    // Đổi màu nút dựa trên trạng thái
    if(filterType === 'all') $('#filterMajorAll').addClass('active');
    if(filterType === '1') $('#filterMajor1').addClass('active');
    if(filterType === '2') $('#filterMajor2').addClass('active');
    
    renderGPAList();
}

// ==========================================
// TÍNH NĂNG: ĐẾM NGƯỢC THỜI GIAN THÔNG BÁO
// ==========================================

function extractDeadline(text) {
    if (!text) return null;
    // Tìm kiếm chuỗi "Hết hạn lúc HH:MM Ngày DD/MM/YYYY" (Có thể khuyết giờ)
    let match = text.match(/Hết hạn(?: lúc (\d{1,2}:\d{2}))? (?:Ngày )?(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (match) {
        let timeStr = match[1] || "23:59"; // Mặc định 23:59 nếu thầy cô không ghi giờ
        let dateStr = match[2];
        let [day, month, year] = dateStr.split('/');
        let [hour, minute] = timeStr.split(':');
        return new Date(year, month - 1, day, hour, minute, 0).getTime();
    }
    return null;
}

// Chạy vòng lặp mỗi 1 giây để cập nhật toàn bộ các đồng hồ đếm ngược trên giao diện
// Chạy vòng lặp mỗi 1 giây để cập nhật toàn bộ các đồng hồ đếm ngược trên giao diện
setInterval(function() {
    let now = new Date().getTime();
    $('.tb-countdown').each(function() {
        let deadline = parseInt($(this).attr('data-deadline'));
        if (!deadline) return;
        
        let distance = deadline - now;
        if (distance < 0) {
            // =====================================
            // ĐÃ QUA DEADLINE
            // =====================================
            if ($(this).hasClass('tb-countdown-list')) {
                // NẾU LÀ ĐỒNG HỒ Ở BÊN NGOÀI DANH SÁCH -> ẨN ĐI
                $(this).hide(); 
            } else {
                // NẾU LÀ ĐỒNG HỒ TRONG CHI TIẾT -> HIỂN THỊ CHỮ ĐÃ HẾT HẠN
                $(this).html('<i class="fa-solid fa-circle-exclamation me-1"></i> Đã hết hạn');
                $(this).removeClass('active-timer').addClass('expired-timer');
                $(this).show(); // Đảm bảo luôn hiển thị
            }
        } else {
            // =====================================
            // CHƯA HẾT HẠN (VẪN CÒN THỜI GIAN)
            // =====================================
            let days = Math.floor(distance / (1000 * 60 * 60 * 24));
            let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            let seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            let timeText = `Còn lại: `;
            if(days > 0) timeText += `${days} ngày `;
            timeText += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            $(this).html(`<i class="fa-solid fa-stopwatch fa-shake me-1"></i> ${timeText}`);
            $(this).addClass('active-timer').removeClass('expired-timer');
            $(this).show(); // Đảm bảo hiển thị nếu trước đó bị ẩn
        }
    });
}, 1000);
function startHorizontalLedClock() {
    function updateClock() {
        const now = new Date();
        
        // 1. Lấy ngày, tháng, năm
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        
        // 2. Định dạng 12 giờ (AM/PM)
        let hours = now.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Nếu là 0 giờ thì chuyển thành 12
        
        const hoursStr = String(hours).padStart(2, '0');
        const minutesStr = String(now.getMinutes()).padStart(2, '0');
        const secondsStr = String(now.getSeconds()).padStart(2, '0');
        
        // 3. Đổ văn bản trực tiếp vào giao diện
        const elDate = document.getElementById('ledDate');
        const elTimeMain = document.getElementById('ledTimeMain');
        const elSeconds = document.getElementById('ledSeconds');
        const elAmpm = document.getElementById('ledAmpm');
        
        if (elDate) elDate.textContent = `${day}/${month}/${year}`;
        if (elTimeMain) elTimeMain.textContent = `${hoursStr}:${minutesStr}`;
        if (elSeconds) elSeconds.textContent = secondsStr;
        if (elAmpm) elAmpm.textContent = ampm;
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

// Gọi chạy đồng hồ khi website sẵn sàng
$(document).ready(function() {
    startHorizontalLedClock();
});
function startAllHorizontalLedClocks() {
    function updateClocks() {
        const now = new Date();
        
        // 1. Lấy chuỗi Ngày/Tháng/Năm
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const dateStr = `${day}/${month}/${year}`;
        
        // 2. Chuyển đổi định dạng giờ AM/PM
        let hours = now.getHours();
        const ampmStr = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 giờ đổi sang 12 giờ
        
        const hoursStr = String(hours).padStart(2, '0');
        const minutesStr = String(now.getMinutes()).padStart(2, '0');
        const timeMainStr = `${hoursStr}:${minutesStr}`;
        const secondsStr = String(now.getSeconds()).padStart(2, '0');
        
        // 3. Quét và cập nhật đồng loạt lên tất cả các phân hệ trên màn hình
        $('.clock-led-container').each(function() {
            $(this).find('.led-date').text(dateStr);
            $(this).find('.led-time-main').text(timeMainStr);
            $(this).find('.led-seconds').text(secondsStr);
            $(this).find('.led-ampm').text(ampmStr);
        });
    }
    
    updateClocks();
    setInterval(updateClocks, 1000); // Cập nhật đồng bộ mỗi giây
}

// Gọi thực thi khi ứng dụng tải xong
$(document).ready(function() {
    startAllHorizontalLedClocks();
});

tinymce.init({
    selector: '#txtCol3, #insertCol3, #editCol3', // Gắn trình soạn thảo vào 3 ô nhập nội dung này
    plugins: 'table lists link textcolor colorpicker',
    toolbar: 'undo redo | formatselect fontfamily fontsize | bold italic underline | forecolor backcolor | alignleft aligncenter alignright alignjustify | table | bullist numlist',
    menubar: false,
    height: 300,
    branding: false,
    setup: function (editor) {
        editor.on('change', function () {
            editor.save(); // Tự động đồng bộ nội dung vào thẻ textarea gốc khi có thay đổi
        });
    }
});