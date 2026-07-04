
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
if (lowerName === 'deadlines_admin' || lowerName === 'tkb_admin' || lowerName === 'chathistory' || lowerName === 'userregisteredcourses' || lowerName === 'mastertkb' || lowerName === 'gpa_data') return;

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

                data.forEach((row, rowIndex) => {
                    if (rowIndex === 0) return; // Bỏ qua tiêu đề
                    
                    let c1 = String(row[0] || '').trim();
                    let c2 = String(row[1] || '').trim();
                    let c3 = String(row[2] || '').trim();
                    let c4 = String(row[3] || '').trim();
                    let c5 = String(row[4] || '').trim();
                    let c6 = String(row[5] || '').trim();
                    let c7 = String(row[6] || '').trim();
                    let c7_raw = c7; // THÊM DÒNG NÀY: Lưu lại dữ liệu gốc của cột 7

                    let isNew = /^new$/i.test(c1) || c1.toLowerCase().includes('new');
                    
                    // 1. Kiểm tra xem ghi chú có chứa chữ Rèn luyện không (Dựa vào dữ liệu gốc)
                    let isRenLuyen = c7_raw.toLowerCase().includes('rèn luyện');
                    
                    // 2. Nếu có, tiến hành xóa chữ "Rèn luyện" khỏi Ghi chú (Chỉ để hiển thị giao diện cho đẹp)
                    if (isRenLuyen) {
                        c7 = c7.replace(/rèn luyện/ig, '').replace(/^[:\-,\s]+/, '').trim();
                    }
                    
                    detailData[rowIndex] = { c1, c2, c3, c4, c5, c6, c7, isNew };

                    let dateDisplay = `<span class="tb-date-text">Ngày đăng tin ${c4 || 'Gần đây'}</span>`;
                    if (c5) dateDisplay += `<span class="tb-date-text ms-4">Ngày cập nhật ${c5}</span>`;

                    let badgeHtml = isNew ? `<div class="tb-badge-new">Mới</div>` : '';

                    let adminHtml = '';
                    if (isAdmin) {
                        let sheetRowIndex = rowIndex + 1;
                        let ec1 = c1.replace(/'/g, "\\'"); let ec2 = c2.replace(/'/g, "\\'"); let ec3 = c3.replace(/'/g, "\\'"); let ec4 = c4.replace(/'/g, "\\'");
                        let ec5 = c5.replace(/'/g, "\\'"); let ec6 = c6.replace(/'/g, "\\'"); 
                        
                        // QUAN TRỌNG: Truyền c7_raw vào nút Sửa thay vì c7 để không bị mất chữ "Rèn luyện"
                        let ec7 = c7_raw.replace(/'/g, "\\'");
                        
                        adminHtml = `
                        <div class="mt-2" onclick="event.stopPropagation();">
                            <button class="btn btn-sm btn-outline-secondary py-0 px-2" title="Lên" onclick="moveRowItem(${sheetRowIndex}, 'up')"><i class="fa-solid fa-arrow-up"></i></button>
                            <button class="btn btn-sm btn-outline-secondary py-0 px-2" title="Xuống" onclick="moveRowItem(${sheetRowIndex}, 'down')"><i class="fa-solid fa-arrow-down"></i></button>
                            <button class="btn btn-sm btn-outline-success py-0 px-2 fw-bold" onclick="openInsertRowModal(${sheetRowIndex})"><i class="fa-solid fa-plus"></i></button>
                            <button class="btn btn-sm btn-outline-warning py-0 px-2 fw-bold" onclick="openEditRowModal(${sheetRowIndex}, '${ec1}', '${ec2}', '${ec3}', '${ec4}', '${ec5}', '${ec6}', '${ec7}')"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-sm btn-outline-danger py-0 px-2 fw-bold" onclick="deleteRowItem(${sheetRowIndex})"><i class="fa-solid fa-trash"></i></button>
                        </div>`;
                    }

                    let itemHtml = `
                    <div class="tb-list-item" onclick="viewThongBaoDetail(${rowIndex})">
                        <div class="tb-icon-wrapper">
                            <i class="fa-solid fa-bell"></i>
                            ${badgeHtml}
                        </div>
                        <div class="tb-item-info">
                            <div class="tb-item-title" style="font-size: 17px; font-weight: 600;">${c2}</div> <!-- Chỉnh size ở đây -->
        <div class="tb-item-dates" style="font-size: 13px;">${dateDisplay}</div>
                            ${adminHtml}
                        </div>
                    </div>`;

                    if (isRenLuyen) {
                        renLuyenItemsHtml += itemHtml;
                    } else {
                        hocThuatItemsHtml += itemHtml;
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
    <div class="tb-detail-dates mb-4" style="font-size: 15px;">${dateDisplay}</div>
    <div class="tb-detail-main-content" style="font-size: 18px; line-height: 1.6;">
        ${processedContent}
    </div>
    ${noteHtml}
    ${linkHtml}
`;                        $('#tbDetailContent').html(html);
                        $('#tbMainView').addClass('d-none');
                        $('#tbDetailContainer').removeClass('d-none');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                
                $('#tbItemsHocThuat').html(hocThuatItemsHtml);
                $('#tbItemsRenLuyen').html(renLuyenItemsHtml);
                
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
                let isSpecialExam = /(đề thi thử|đề demo|minigame tuần|minigame hè|minigame số)/i.test(fullRowText);
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
                    let escapedCells = row.map(c => String(c || '').replace(/'/g, "\\'"));
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
        },
        error: function() { 
            $('#loadingStatus').html('<span class="text-danger fw-bold">Có lỗi xảy ra khi tải dữ liệu!</span>'); 
        }
    });
}


function initGlobalApp() {
            $('.app-container, .mobile-header').css('display', '');
            setTimeout(pingOnlineStatus, 1000); setInterval(pingOnlineStatus, 25000);
            fetchSemesterConfig(); 
            loadDataByHocPhan('Thông báo', document.getElementById('btnNavThongBao')); 
            loadWebLinks(); checkNewQA(); fetchAndRenderCategories();
       
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
        $('#gpaCourseList').html('<div class="text-center text-muted py-5"><i class="fa-solid fa-spinner fa-spin fs-2 mb-2"></i><br>Đang đồng bộ dữ liệu điểm...</div>');
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
    let roundedScore = Math.round(score10 * 10) / 10;
    
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
    if (type === 'chuyen_nganh' || type === 'mon_chung') { 
        passed = roundedScore >= 4.0; 
    } else if (type === 'ngoai_le') { 
        passed = roundedScore >= 5.0; 
    }

    return { scale4, letter, passed, roundedScore };
}

function calculateOverallGPA() {
    let totalAttemptedCredits = 0; 
    let totalAccumulatedCredits = 0; 
    let totalScore4 = 0;
    let totalScore10 = 0;

    myGPADataset.forEach(course => {
        let bestAttempt = 1; 
        let maxScore4 = -1; 
        let maxScore10 = -1; 
        let bestConv = null;

        for(let i = 1; i <= 3; i++) {
            let hasAllScores = true; // Cờ kiểm tra xem ĐÃ NHẬP ĐỦ điểm thành phần chưa
            let currentScore10 = 0;
            let hasAnyColumn = course.columns.length > 0;

            course.columns.forEach(col => {
                let val = parseFloat(col['score' + i]);
                // Nếu cột điểm trống hoặc không phải số -> đánh dấu là chưa hoàn thành
                if(isNaN(val) || col['score' + i] === '') { 
                    hasAllScores = false; 
                } else {
                    currentScore10 += (val * col.percent) / 100;
                }
            });

            // CHỈ TÍNH ĐIỂM khi tất cả các cột thành phần của lần thi này đều đã có điểm
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

        // Cập nhật trạng thái hiển thị của học phần
        if (maxScore10 >= 0) {
            course.finalScore10 = maxScore10.toFixed(1);
            course.finalScore4 = bestConv.scale4.toFixed(1);
            course.letter = bestConv.letter;
            course.passed = bestConv.passed;
        } else {
            // Nếu chưa nhập đủ điểm -> hiển thị "-"
            course.finalScore10 = "-";
            course.finalScore4 = "-";
            course.letter = "-";
            course.passed = false;
        }
        
        course.bestAttempt = maxScore10 >= 0 ? bestAttempt : 1;

        let creds = parseInt(course.credits) || 0;

        if (course.type !== 'ngoai_le') {
            if (maxScore10 >= 0) { 
                totalAttemptedCredits += creds;
                totalScore4 += (maxScore4 * creds);
                totalScore10 += (maxScore10 * creds);
            }
            if (course.passed) {
                totalAccumulatedCredits += creds;
            }
        }
    });

    let gpa4 = totalAttemptedCredits > 0 ? (totalScore4 / totalAttemptedCredits).toFixed(2) : "0.00";
    let gpa10 = totalAttemptedCredits > 0 ? (totalScore10 / totalAttemptedCredits).toFixed(2) : "0.00";

    $('#gpaTotal4').text(gpa4); 
    $('#gpaTotal10').text(gpa10); 
    $('#gpaTotalCredits').text(totalAccumulatedCredits);
}

function renderGPAList(syncToServer = true) {
    calculateOverallGPA();
    
    let storageKey = currentUser ? 'myGPADataset_' + currentUser.mssv : 'myGPADataset_guest';
    localStorage.setItem(storageKey, JSON.stringify(myGPADataset));
    
    if (syncToServer && currentUser) {
        postToGAS({ action: "saveGPAUser", mssv: currentUser.mssv, gpaData: JSON.stringify(myGPADataset) }, 
        function(){}, function(){});
    }
    
    if (myGPADataset.length === 0) {
        $('#gpaCourseList').html('<div class="text-center text-muted py-5"><i class="fa-solid fa-box-open fs-2 mb-2"></i><br>Chưa có học phần nào được thêm.</div>');
        return;
    }

    const groups = [
        { type: 'chuyen_nganh', title: 'Học phần Chuyên ngành', icon: 'fa-book-open', color: 'primary' },
        { type: 'mon_chung', title: 'Môn học Chung', icon: 'fa-layer-group', color: 'success' },
        { type: 'ngoai_le', title: 'GDTC & GDQP (Không tính GPA)', icon: 'fa-person-running', color: 'secondary' }
    ];

    let html = '<div class="table-responsive border-0"><table class="gpa-main-table">';
    let globalIndex = 1;
    
    groups.forEach(group => {
        let coursesInGroup = myGPADataset.filter(c => c.type === group.type);
        
        if (coursesInGroup.length > 0) {
            html += `
                <thead>
                    <tr>
                        <th colspan="9" class="text-start fs-6 border-bottom-0 pb-2 pt-4" style="background-color: #f8fafc !important; color: var(--bs-${group.color}); font-weight: 800; text-transform: uppercase;">
                            <i class="fa-solid ${group.icon} me-2"></i>${group.title}
                        </th>
                    </tr>
                    <tr>
                        <th style="width: 50px;">STT</th>
                        <th style="width: 110px;">Mã HP</th>
                        <th class="text-start">Tên học phần</th>
                        <th style="width: 70px;">Tín chỉ</th>
                        <th style="width: 80px;">Hệ 10</th>
                        <th style="width: 80px;">Hệ 4.0</th>
                        <th style="width: 90px;">Điểm chữ</th>
                        <th style="width: 70px;">Đạt</th>
                        <th style="width: 130px;">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
            `;
            
            coursesInGroup.forEach((c) => {
                // Xử lý icon Đạt/Chưa đạt khi chưa nhập đủ điểm
                let statusIcon = c.finalScore10 === "-" ? '<i class="fa-solid fa-minus text-muted" title="Chưa đủ điểm"></i>' : (c.passed ? '<i class="fa-solid fa-circle-check status-icon passed"></i>' : '<i class="fa-solid fa-circle-xmark status-icon failed"></i>');
                let letterColor = c.finalScore10 === "-" ? "text-muted" : (c.passed ? "text-dark" : "text-danger");
                
                let subRows = '';
                c.columns.forEach((col, i) => {
                    let h1 = (c.bestAttempt === 1 && col.score1 !== '' && c.finalScore10 !== "-") ? 'best-attempt-highlight' : '';
                    let h2 = (c.bestAttempt === 2 && col.score2 !== '' && c.finalScore10 !== "-") ? 'best-attempt-highlight' : '';
                    let h3 = (c.bestAttempt === 3 && col.score3 !== '' && c.finalScore10 !== "-") ? 'best-attempt-highlight' : '';

                    subRows += `
                    <tr>
                        <td class="text-center">${i + 1}</td>
                        <td class="text-start fw-bold" style="color: #334155;">${col.name}</td>
                        <td class="text-center fw-bold">${col.percent}%</td>
                        <td class="text-center ${h1} fw-bold">${col.score1 || ''}</td>
                        <td class="text-center ${h2} fw-bold">${col.score2 || ''}</td>
                        <td class="text-center ${h3} fw-bold">${col.score3 || ''}</td>
                    </tr>`;
                });

                let courseCode = c.code || '-';
                let titleDetail = c.code ? `${c.code} - ${c.name}` : c.name;
                
                let badgeBestAttempt = c.finalScore10 === "-" 
                    ? `<span class="badge bg-secondary ms-2 rounded-pill fw-normal" style="font-size: 11px;">Chưa hoàn thành</span>`
                    : `<span class="badge bg-success ms-2 rounded-pill fw-normal" style="font-size: 11px;">Tính điểm Lần ${c.bestAttempt}</span>`;

                html += `
                    <tr class="main-row" data-bs-toggle="collapse" data-bs-target="#detail-${c.id}" onclick="$(this).find('.btn-expand').toggleClass('open')">
                        <td class="text-muted fw-bold">${globalIndex++}</td>
                        <td class="fw-bold text-secondary">${courseCode}</td>
                        <td class="text-start fw-bold" style="color: #334155;">${c.name}</td>
                        <td>${c.credits}</td>
                        <td class="text-dark fw-bold">${c.finalScore10}</td>
                        <td class="text-primary fw-bold">${c.finalScore4}</td>
                        <td class="${letterColor} fw-bold fs-6">${c.letter}</td>
                        <td>${statusIcon}</td>
                        <td>
                            <div class="d-flex align-items-center justify-content-center">
                                <button class="btn btn-sm btn-outline-warning py-1 px-2 border-0 shadow-sm" onclick="event.stopPropagation(); editGPACourse('${c.id}')" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                                <button class="btn btn-sm btn-outline-danger py-1 px-2 border-0 shadow-sm ms-1" onclick="event.stopPropagation(); deleteGPACourse('${c.id}')" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                                <button class="btn-expand ms-2"><i class="fa-solid fa-chevron-down"></i></button>
                            </div>
                        </td>
                    </tr>
                    <tr class="gpa-detail-row">
                        <td colspan="9" class="p-0 border-0">
                            <div class="collapse" id="detail-${c.id}">
                                <div class="gpa-detail-container">
                                    <div class="gpa-detail-title">
                                        Chi tiết học phần: ${titleDetail}
                                        ${badgeBestAttempt}
                                    </div>
                                    <table class="gpa-sub-table">
                                        <thead>
                                            <tr>
                                                <th style="width: 60px;">STT</th>
                                                <th class="text-start">Tên thành phần</th>
                                                <th style="width: 120px;">Trọng số</th>
                                                <th style="width: 120px;">Điểm lần 1</th>
                                                <th style="width: 120px;">Điểm lần 2</th>
                                                <th style="width: 120px;">Điểm lần 3</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${subRows}
                                        </tbody>
                                    </table>
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
function openAddCourseGPAModal() {
    $('#gpaEditId').val(''); $('#gpaCourseCode').val(''); $('#gpaCourseName').val('');
    $('#gpaCourseCredits').val(3); $('#gpaCourseType').val('chuyen_nganh');
    $('#gpaColumnsContainer').html(''); addGPAColumnInput();
    $('#gpaPercentWarning').addClass('d-none'); $('#gpaCourseModal').modal('show');
}

function addGPAColumnInput(name = '', percent = '', s1 = '', s2 = '', s3 = '') {
    let colId = 'col_' + Math.random().toString(36).substr(2, 9);
    let html = `
    <div class="col-grade-input row g-2 align-items-center mb-2" id="${colId}">
        <div class="col-md-3"><input type="text" class="form-control form-control-sm gpa-col-name" placeholder="Tên (VD: Giữa kỳ)" value="${name}"></div>
        <div class="col-md-2">
            <div class="input-group input-group-sm">
                <input type="number" class="form-control gpa-col-percent" placeholder="Tỉ lệ" value="${percent}">
                <span class="input-group-text">%</span>
            </div>
        </div>
        <div class="col-md-2"><input type="number" step="0.1" class="form-control form-control-sm gpa-col-s1" placeholder="Lần 1" value="${s1}"></div>
        <div class="col-md-2"><input type="number" step="0.1" class="form-control form-control-sm gpa-col-s2" placeholder="Lần 2" value="${s2}"></div>
        <div class="col-md-2"><input type="number" step="0.1" class="form-control form-control-sm gpa-col-s3" placeholder="Lần 3" value="${s3}"></div>
        <div class="col-md-1 text-end"><button class="btn btn-sm text-danger p-1" onclick="$('#${colId}').remove()"><i class="fa-solid fa-xmark"></i></button></div>
    </div>`;
    $('#gpaColumnsContainer').append(html);
}

function saveGPACourse() {
    let id = $('#gpaEditId').val() || Date.now().toString();
    let code = $('#gpaCourseCode').val().trim();
    let name = $('#gpaCourseName').val().trim();
    let credits = $('#gpaCourseCredits').val();
    let type = $('#gpaCourseType').val();

    if(!name || !credits) { alert("Vui lòng nhập Tên môn và Số tín chỉ!"); return; }

    let columns = []; let totalPercent = 0;
    $('.col-grade-input').each(function() {
        let cName = $(this).find('.gpa-col-name').val() || 'Thành phần';
        let cPercent = parseFloat($(this).find('.gpa-col-percent').val()) || 0;
        let s1 = $(this).find('.gpa-col-s1').val(); let s2 = $(this).find('.gpa-col-s2').val(); let s3 = $(this).find('.gpa-col-s3').val();
        totalPercent += cPercent;
        columns.push({ name: cName, percent: cPercent, score1: s1, score2: s2, score3: s3 });
    });

    if (Math.abs(totalPercent - 100) > 0.01 && columns.length > 0) { $('#gpaPercentWarning').removeClass('d-none'); return; } 
    else { $('#gpaPercentWarning').addClass('d-none'); }

    let courseObj = { id, code, name, credits, type, columns };
    let existingIndex = myGPADataset.findIndex(c => c.id === id);
    if(existingIndex >= 0) { myGPADataset[existingIndex] = courseObj; } else { myGPADataset.push(courseObj); }

    $('#gpaCourseModal').modal('hide'); renderGPAList();
}

function editGPACourse(id) {
    let course = myGPADataset.find(c => c.id === id); if(!course) return;
    $('#gpaEditId').val(course.id); $('#gpaCourseCode').val(course.code || ''); $('#gpaCourseName').val(course.name);
    $('#gpaCourseCredits').val(course.credits); $('#gpaCourseType').val(course.type);
    $('#gpaColumnsContainer').html('');
    course.columns.forEach(col => { addGPAColumnInput(col.name, col.percent, col.score1 || '', col.score2 || '', col.score3 || ''); });
    $('#gpaPercentWarning').addClass('d-none'); $('#gpaCourseModal').modal('show');
}

function deleteGPACourse(id) {
    if(confirm("Bạn có chắc muốn xóa học phần này khỏi bảng tính GPA?")) {
        myGPADataset = myGPADataset.filter(c => c.id !== id); renderGPAList();
    }
}