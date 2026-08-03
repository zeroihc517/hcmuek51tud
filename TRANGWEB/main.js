
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

// Thay đổi hàm loadTongHopView để không gọi lại dữ liệu nếu đã có
function loadTongHopView() {
    document.title = "Tổng hợp Link | Học nhóm APMA Khoa Toán";
    resetNavActive(); 
    $('#btnNavTongHop').addClass('active'); 
    $('#tongHopSection').removeClass('d-none');
    
    updateSystemUrl('view', 'weblinks'); // Đổi URL thành ?view=weblinks
    if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); }
}
// 1. Biến lưu bộ nhớ đệm (Cache) và chế độ hiển thị
let adminDisplayMode = 0; // 0: Che, 1: MSSV, 2: Tên, 3: Full
let cachedOnlineList = []; // Lưu danh sách user từ server
let cachedOnlineCount = 0;

// 2. Hàm che chuỗi bắt buộc (Bất kể Admin hay Sinh viên)
// 2. Hàm che chuỗi bắt buộc (Trừ Admin và Chính chủ tài khoản)
function maskMSSV(mssv) { 
    let str = String(mssv).trim(); 
    if (!str) return "";

    let activeUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    
    // NẾU LÀ ADMIN HOẶC LÀ CHÍNH TÀI KHOẢN CỦA BẢN THÂN -> KHÔNG CHE
    if (activeUser) {
        // Chuẩn hóa chuỗi (xóa dấu chấm) để so sánh chính xác nhất
        let myCleanMssv = activeUser.mssv.replace(/\./g, "");
        let targetCleanMssv = str.replace(/\./g, "");
        
        if (myCleanMssv === targetCleanMssv ) {
            return str; // Trả về MSSV gốc đầy đủ
        }
    }

    if (str.length <= 6) return str; 
    // Che khuất theo định dạng 51***xxx
    return str.substring(0, 2) + '***' + str.substring(str.length - 3); 
}
// 3. Hàm kích hoạt chuyển chế độ (CHẠY SIÊU TỐC - KHÔNG GỌI LẠI AJAX)
function toggleAdminNameDisplay() {
    adminDisplayMode = (adminDisplayMode + 1) % 4; // Xoay vòng 0 -> 1 -> 2 -> 3 -> 0
    renderOnlineFooterUI(); // Render lại ngay từ RAM (0ms)
}

// 4. Hàm vẽ giao diện Footer từ dữ liệu trong RAM
// 4. Hàm vẽ giao diện Footer từ dữ liệu trong RAM
function renderOnlineFooterUI() {
    if (!cachedOnlineList || cachedOnlineList.length === 0) return;

    let currentIsAdmin = isAdmin || (currentUser && (currentUser.mssv === "51.01.108.008" || currentUser.mssv === "5101108008"));

    let guestCount = 0;
    let studentList = [];

    // Tách riêng Khách và Sinh viên đăng nhập để đếm
    cachedOnlineList.forEach(userStr => {
        let str = String(userStr).trim();
        
        // Nếu là Khách hoặc định dạng không có "|"
        if (str.toLowerCase() === "khách" || !str.includes("|")) {
            guestCount++;
            return;
        }
        
        let parts = str.split("|");
        let userMssv = parts[0]; 
        let userName = parts[1];

        // --- A. CỐ ĐỊNH CHỮ "ADMIN" CHO TÀI KHOẢN ADMIN (51.01.108.008) ---
        if (userMssv === "51.01.108.008" || userMssv === "5101108008") {
            studentList.push(`<span class="fw-bold" style="color: #facc15; text-transform: uppercase;"><i class="fa-solid fa-user-shield me-1"></i>ADMIN</span>`);
            return;
        }

        // --- B. XỬ LÝ 4 NẤC HIỂN THỊ CHO SINH VIÊN KHÁC ---
        if (currentIsAdmin) {
            if (adminDisplayMode === 1) {
                studentList.push(userMssv);
                return;
            } else if (adminDisplayMode === 2) {
                studentList.push(userName);
                return;
            } else if (adminDisplayMode === 3) {
                studentList.push(`${userName} (${userMssv})`);
                return;
            }
        }
        
        // Mặc định (mode = 0) hoặc không phải Admin: Che MSSV (Đồng bộ gọi đúng hàm maskMSSV)
        studentList.push(maskMSSV(userMssv));
    });

    // Ghép danh sách sinh viên đăng nhập
    let displayList = studentList.join(", ");

    // Nếu có Khách thì đính kèm số lượng vào cuối chuỗi
    if (guestCount > 0) {
        let guestText = `<span style="color: #bae6fd;">Khách: ${guestCount}</span>`;
        if (displayList !== "") {
            displayList += ` <span class="mx-2 text-muted">|</span> ${guestText}`;
        } else {
            displayList = guestText;
        }
    }

    // Đổ dữ liệu ra ngoài giao diện
    $('#footerOnlineStatus').html(`
        <i class="fa-solid fa-users me-2" onclick="toggleAdminNameDisplay()" style="cursor: pointer;" title="Bấm để xoay vòng chế độ hiển thị danh sách"></i> 
        ${cachedOnlineCount} người: <strong>${displayList}</strong>
    `);
}
// 5. Hàm gửi request lấy dữ liệu mới từ Server (chạy ngầm định kỳ)
// 5. Hàm gửi request lấy dữ liệu mới từ Server (chạy ngầm định kỳ)
function pingOnlineStatus() {
    let savedUser = localStorage.getItem('currentUser');
    let mssvParam = "Khách"; 
    
    if (savedUser) {
        try {
            let userObj = JSON.parse(savedUser);
            mssvParam = userObj.mssv + "|" + userObj.name; 
            $('#gpaNavContainer').removeClass('d-none');
        } catch(e) { 
            mssvParam = "Khách"; 
            $('#gpaNavContainer').addClass('d-none');
        }
    } else {
        $('#gpaNavContainer').addClass('d-none');
    }

    if (mssvParam === "Khách" && currentUser && currentUser.mssv) { 
        mssvParam = currentUser.mssv + "|" + currentUser.name; 
    }

    // --- LOGIC LẤY TÊN MỤC ĐANG XEM (CHUẨN XÁC THEO MENU) ---
    let currentView = "Trang chủ"; // Mặc định
    
    // Tìm text của nút đang được in đậm (có class 'active') trên thanh menu Sidebar
    let activeMenuText = $('#sidebarMenu .active').text().trim();
    
    if (activeMenuText) {
        currentView = activeMenuText; // Lấy đúng chữ "Lịch học", "Hình học vi phân"...
    } else if (typeof currentSheetName !== 'undefined' && currentSheetName !== "") {
        currentView = currentSheetName; // Dự phòng lấy tên môn học
    } else {
        currentView = document.title.split('|')[0].trim(); // Dự phòng lấy tiêu đề tab web
    }
    // -------------------------------------------------------------

    $.ajax({ 
        // ĐÃ BỔ SUNG &lastView VÀO URL GỬI LÊN MÁY CHỦ
        url: SCRIPT_URL + "?action=pingPresence&uuid=" + sessionUUID + "&mssv=" + encodeURIComponent(mssvParam) + "&lastView=" + encodeURIComponent(currentView), 
        method: "GET", 
        dataType: "json", 
        cache: false,
        success: function(res) { 
            if (res && res.list) { 
                // Cập nhật dữ liệu mới vào RAM
                cachedOnlineList = res.list;
                cachedOnlineCount = res.count;
                
                // Vẽ lại UI
                renderOnlineFooterUI();
            } 
        } 
    });
}
function loadWebLinks() { 
    $('#webLinksContainer').html(`
        <div class="col-12 w-100">
            <div class="pulse-loader py-5">
                <div class="spinner-modern"></div>
                <span class="text-muted fw-bold" style="font-size: 15px;">Đang tải danh sách liên kết...</span>
            </div>
        </div>
    `);
    $('#personalLinksContainer').html('');
    $('#titleGlobalLinks, #titlePersonalLinks').hide();

    let mssvParam = currentUser ? currentUser.mssv : "";
    if (currentUser) {
        $('#btnAddPersonalLink').removeClass('d-none'); 
    } else {
        $('#btnAddPersonalLink').addClass('d-none');
    }

    $.ajax({ 
        url: SCRIPT_URL + "?action=getWebLinks&mssv=" + encodeURIComponent(mssvParam), 
        method: "GET", 
        dataType: "json", 
        success: function(data) { 
            renderWebLinks(data); 
        },
        error: function() {
            $('#webLinksContainer').html('<div class="col-12 text-center text-danger py-5"><i class="fa-solid fa-triangle-exclamation fs-2 mb-3"></i><br><span class="fw-bold">Lỗi kết nối máy chủ!</span></div>');
        }
    }); 
}
function renderSidebarCategories() {
    let optionsHtml = '';
    if (currentUser && currentUser.isGuest) {
        $('#dynamicCourseList').html(`
            <div class="text-center p-3 text-muted mt-2" style="background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; font-size: 13.5px;">
                <i class="fa-solid fa-lock mb-2" style="font-size: 24px; color: #94a3b8;"></i><br>
                <strong>Nội dung bị khóa</strong><br>Vui lòng đăng nhập để truy cập tài liệu môn học.
            </div>
        `);
        return; // Dừng hàm ngay lập tức
    }
    // 1. Cấu hình phân nhóm danh mục (Bạn tự thêm tên Sheet thực tế vào mảng tương ứng)
    const categoryGroups = {
	'HK1 - Năm 2': ['Hình học vi phân', 'Cấu trúc đại số', 'Cấu trúc dữ liệu', 'Lập trình hướng đối tượng', 'Tư tưởng Hồ Chí Minh'], 
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
if (lowerName === 'deadlines_admin' || lowerName === 'deadlines_status' || lowerName === 'tkb_admin' || lowerName === 'khaosat' || lowerName === 'weblinks_personal' || lowerName === 'registrationhistory' || lowerName === 'userregisteredcourses' || lowerName === 'mastertkb' || lowerName === 'gpa_data' || lowerName === 'exercisequestions' || lowerName === 'sharecode') return;
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
    document.title = sheetName + " | Học nhóm APMA Khoa Toán";
    currentSheetName = sheetName; 
    resetNavActive(); 
    if(element) $(element).addClass('active');
    $('#courseHeaderTitle').html(`<i class="fa-solid fa-book-open me-2"></i> ${sheetName}`);
    // Reset giao diện trước khi tải
    $('#courseSection').removeClass('d-none'); 
    $('#tableWrapper').addClass('d-none'); 
    $('#swipeHint').addClass('d-none');
    $('#instructorArea').addClass('d-none').html(''); 
    $('#loadingStatus').removeClass('d-none');
    
    if ($('#customViewWrapper').length > 0) $('#customViewWrapper').addClass('d-none');
    $('#examCardsContainer').addClass('d-none').html(''); 

    // ==========================================
    // BỔ SUNG CHẶN KHÁCH XEM TRANG TỔNG (ĐÃ ĐƯA RA NGOÀI VÀ LÊN ĐẦU)
    // ==========================================
    if (sheetName.toLowerCase() === 'thông báo') {
        let urlParams = new URLSearchParams(window.location.search);
        let tbParam = urlParams.get('tb');

        // Nếu người dùng là Khách VÀ KHÔNG CÓ mã thông báo cụ thể (?tb=...)
        if (currentUser && currentUser.isGuest && !tbParam) {
            $('#loadingStatus').addClass('d-none');
            $('#tableWrapper').addClass('d-none');
            
            let guestLockHtml = `
                <div class="data-card p-5 text-center my-4 border-0 shadow-sm" style="border-radius: 16px; background: #ffffff;">
                    <div class="mb-3">
                        <div class="mx-auto d-flex align-items-center justify-content-center rounded-circle" style="width: 80px; height: 80px; background-color: #f1f5f9; color: #0f4c81; font-size: 36px;">
                            <i class="fa-solid fa-lock"></i>
                        </div>
                    </div>
                    <h4 class="fw-bold mb-2" style="color: #0f4c81;">Giao diện bị khóa đối với Khách</h4>
                    <p class="text-muted mb-4 mx-auto" style="max-width: 500px; font-size: 15px; line-height: 1.6;">
                        Bạn đang ở chế độ Khách nên không thể xem danh sách Thông báo tổng. Chế độ Khách chỉ hỗ trợ xem nội dung khi được chia sẻ liên kết trực tiếp.
                    </p>
                    <button class="btn text-white fw-bold px-4 py-2" style="background-color: #0f4c81; border-radius: 50px; font-size: 15px;" onclick="window.location.href='login.html'">
                        <i class="fa-solid fa-right-to-bracket me-2"></i>Đăng nhập Cổng Sinh Viên
                    </button>
                </div>
            `;

            if ($('#customViewWrapper').length === 0) $('#tableWrapper').before('<div id="customViewWrapper" class="w-100"></div>');
            $('#customViewWrapper').html(guestLockHtml).removeClass('d-none');
            return; // Dừng hàm ngay lập tức, không cho tải bảng phía dưới nữa!
        }
    }
    // ==========================================

    if (sheetName.toLowerCase() !== 'thông báo') {
        updateSystemUrl('course', sheetName); 
    } else {
        // Chỉ reset URL về mặc định nếu người dùng thực sự click bấm chọn vào nút "Thông báo" trên Sidebar
        if (element) {
            resetUrlToDefault();
        }
    }

    // Hiển thị form thêm dữ liệu nếu là Admin và Đổi nhãn thông minh
    // Hiển thị form thêm dữ liệu nếu là Admin và Đổi nhãn thông minh
    if (isAdmin) {
        $('#adminAddRowArea').removeClass('d-none');
        if (sheetName.toLowerCase() === 'thông báo') {
            // 1. HIỂN THỊ LẠI ĐẦY ĐỦ CÁC CỘT (Hủy lệnh hide cũ)
            $('#txtCol5, #txtCol6, #txtCol7').parent().show();
            $('#insertCol5, #insertCol6, #insertCol7').parent().show();
            $('#editCol5, #editCol6, #editCol7').parent().show();
            
            // 2. KHÔI PHỤC TÊN NHÃN VÀ THÊM NÚT "HẸN GIỜ" ĐÚNG NHƯ ẢNH
            $('#txtCol1, #insertCol1, #editCol1').prev('label').html('STT (Cột 1)');
            $('#txtCol2, #insertCol2, #editCol2').prev('label').html('Tiêu đề (Cột 2)');
            $('#txtCol4, #insertCol4, #editCol4').prev('label').html('Ngày đăng (Cột 4)');
            $('#txtCol5, #insertCol5, #editCol5').prev('label').html('Ngày cập nhật (Cột 5)');
            $('#txtCol6, #insertCol6, #editCol6').prev('label').html('Đường link đính kèm (Cột 6)');
            
            // Chèn nút Hẹn giờ Đếm ngược vào Cột 3
            $('#txtCol3, #insertCol3, #editCol3').prev('label').html('Nội dung chi tiết (Cột 3) <button type="button" class="btn btn-sm text-white py-0 px-2 ms-2 rounded-pill shadow-sm fw-bold" style="font-size: 11px; background-color: var(--accent-red);" onclick="insertDeadlineTag(\'c3\', this, event)"><i class="fa-solid fa-clock"></i> Hẹn giờ Đếm ngược</button>');
            
            // Chèn nút Hẹn giờ Ẩn bài vào Cột 7
            $('#txtCol7, #insertCol7, #editCol7').prev('label').html('Ghi chú (Cột 7) <button type="button" class="btn btn-sm text-white py-0 px-2 ms-2 rounded-pill shadow-sm fw-bold" style="font-size: 11px; background-color: #6b7280;" onclick="insertDeadlineTag(\'c7\', this, event)"><i class="fa-solid fa-clock"></i> Hẹn giờ Ẩn bài</button>');

            // 3. SẮP XẾP LẠI VỊ TRÍ (ORDER) VÀ ĐỘ RỘNG CÁC CỘT CHO KHUNG THÊM MỚI GIỐNG 100% ẢNH
            // Hàng 1
            $('#txtCol1').parent().attr('class', 'col-md-2').css('order', '1');
            $('#txtCol4').parent().attr('class', 'col-md-3').css('order', '2');
            $('#txtCol5').parent().attr('class', 'col-md-3').css('order', '3');
            $('#txtCol6').parent().attr('class', 'col-md-4').css('order', '4');
            // Hàng 2
            $('#txtCol7').parent().attr('class', 'col-md-3').css('order', '5');
            $('#txtCol2').parent().attr('class', 'col-md-9').css('order', '6');
            // Hàng 3
            $('#txtCol3').parent().attr('class', 'col-12').css('order', '7');

        } else {
            // PHỤC HỒI GIAO DIỆN MẶC ĐỊNH KHI MỞ CÁC MÔN HỌC KHÁC
            $('#txtCol5, #txtCol6, #txtCol7').parent().show();
            $('#insertCol5, #insertCol6, #insertCol7').parent().show();
            $('#editCol5, #editCol6, #editCol7').parent().show();
            
            $('#txtCol1, #insertCol1, #editCol1').prev('label').text('STT / Trạng thái (Cột 1)');
            $('#txtCol2, #insertCol2, #editCol2').prev('label').text('Tiêu đề (Cột 2)');
            $('#txtCol3, #insertCol3, #editCol3').prev('label').text('Nội dung chi tiết (Cột 3)');
            $('#txtCol4, #insertCol4, #editCol4').prev('label').text('Ngày đăng (Cột 4)');
            $('#txtCol5, #insertCol5, #editCol5').prev('label').text('Ngày cập nhật (Cột 5)');
            $('#txtCol6, #insertCol6, #editCol6').prev('label').text('Đường link đính kèm (Cột 6)');
            $('#txtCol7, #insertCol7, #editCol7').prev('label').text('Ghi chú (Cột 7)');
            
            // Trả lại cấu trúc layout mặc định của HTML gốc
            $('#txtCol1').parent().attr('class', 'col-md-2').css('order', '1');
            $('#txtCol2').parent().attr('class', 'col-md-4').css('order', '2');
            $('#txtCol3').parent().attr('class', 'col-md-6').css('order', '3');
            $('#txtCol4').parent().attr('class', 'col-md-3').css('order', '4');
            $('#txtCol5').parent().attr('class', 'col-md-3').css('order', '5');
            $('#txtCol6').parent().attr('class', 'col-md-3').css('order', '6');
            $('#txtCol7').parent().attr('class', 'col-md-3').css('order', '7');
        }
    } else {
        $('#adminAddRowArea').addClass('d-none');
    }
    
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
// ... (Phần code bên dưới giữ nguyên) ...

               let detailData = [];
               let hocThuatItemsHtml = '';
               let renLuyenItemsHtml = '';
               let heThongItemsHtml = '';

               // --- TÍNH MÃ ĐỊNH DANH ĐỘC LẬP TỪ DƯỚI LÊN (CŨ NHẤT BẮT ĐẦU TỪ 0001) ---
               let yearPrefix = new Date().getFullYear().toString().slice(-2); // "26" cho năm 2026
               let htCounter = 0;
               let rlCounter = 0;
               let adCounter = 0; // Bộ đếm riêng cho HỆ THỐNG (Admin)
               let tbCodesMap = {};

               // Duyệt từ dưới lên trên bảng dữ liệu Google Sheets để đếm số thứ tự tăng dần từ 0001
               for (let i = data.length - 1; i >= 1; i--) {
                   let rowC7 = String(data[i][6] || '').toLowerCase();
                   let isHeThong = rowC7.includes('hệ thống');
                   let isRenLuyen = rowC7.includes('rèn luyện');
                   let code = "";
                   
                   if (isHeThong) {
                       adCounter++;
                       code = `${yearPrefix}AD${String(adCounter).padStart(4, '0')}`; // Mã AD260001 cho Hệ thống
                   } else if (isRenLuyen) {
                       rlCounter++;
                       code = `${yearPrefix}RL${String(rlCounter).padStart(4, '0')}`; // Mã RL260001 cho Rèn luyện
                   } else {
                       htCounter++;
                       code = `${yearPrefix}HT${String(htCounter).padStart(4, '0')}`; // Mã HT260001 cho Học thuật
                   }
                   tbCodesMap[i] = code;
               }

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
    
    let isHeThong = c7_raw.toLowerCase().includes('hệ thống');
    let isRenLuyen = c7_raw.toLowerCase().includes('rèn luyện');
    
    let deadlineTime = extractDeadline(c3);

    if (isNew) {
        if (deadlineTime) {
            if (now.getTime() > deadlineTime) isNew = false;
        } else {
            if (publishDate) {
                let diffDays = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
                if (diffDays > 15) isNew = false;
            }
        }
    }

    // Kiểm tra trạng thái ẩn bài
    let hideTime = extractDeadline(c7_raw);
    let isHidden = (hideTime && now.getTime() > hideTime);

    let dlStrRegex = /(?:DEADLINE\s*=\s*|Hết hạn(?: lúc\s*)?)\d{1,2}:\d{2}\s*(?:Ngày\s*)?\d{1,2}\/\d{1,2}\/\d{2,4}/ig;
    c3 = c3.replace(dlStrRegex, '').replace(/<[^\/>][^>]*>\s*<\/[^>]+>/g, '').trim();

    c7 = c7_raw.replace(dlStrRegex, '').trim();
    if (isHeThong) c7 = c7.replace(/hệ thống/ig, '').trim();
    else if (isRenLuyen) c7 = c7.replace(/rèn luyện/ig, '').trim();
    c7 = c7.replace(/^[:\-,\s|]+/, '').replace(/[:\-,\s|]+$/, '').trim();

    let assignedTbCode = tbCodesMap[rowIndex] || "";
    
    // Ghi nhớ dữ liệu vào detailData KỂ CẢ KHI BÀI ĐÃ BỊ ẨN để dán link mở được
    detailData[rowIndex] = { c1, c2, c3, c4, c5, c6, c7, isNew, isHidden, tbCode: assignedTbCode };

    // Bỏ qua không vẽ ra danh sách bên ngoài nếu bài bị ẩn và không phải Admin
    if (isHidden && !isAdmin) {
        return; 
    }

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

if (isHeThong) {
    heThongItemsHtml += `
    <div class="border-animation mb-4">
        <div class="alert shadow-sm border-0 position-relative" role="alert" style="background: linear-gradient(to right, #fff5f5, #ffffff);" onclick="viewThongBaoDetail(${rowIndex})">
            <div class="d-flex align-items-start gap-3">
                <div class="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 48px; height: 48px;">
                    <i class="fa-solid fa-triangle-exclamation fs-4 fa-fade"></i>
                </div>
                <div class="flex-grow-1 mt-1">
                    <div class="fw-bold text-danger mb-1" style="font-size: 18px; text-transform: uppercase;">[QUAN TRỌNG] ${c2} ${badgeHtml}</div>
                    <div class="tb-item-dates" style="font-size: 13.5px; color: #64748b;">
                        ${dateDisplay} ${countdownHtml}
                    </div>
                </div>
            </div>
            ${isAdmin ? `<div class="mt-3 text-end pt-2 border-top">${adminHtml}</div>` : ''}
        </div>
    </div>`;
}
else {
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
                        
                        // Cập nhật đường dẫn thanh địa chỉ tự động mà KHÔNG làm tải lại trang
                        let currentCode = data.tbCode || "";
                        if (currentCode) {
                            let newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?tb=' + currentCode;
                            window.history.pushState({ path: newUrl }, '', newUrl);
                        }

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

                        let processedContent = data.c3;
                        if (!/(<p>|<table>|<br>|<br\s*\/?>)/i.test(processedContent)) {
                            processedContent = processedContent.replace(/\n/g, '<br>');
                        }

                        processedContent = processedContent.replace(/(\[IMG(?:=.*?)?\].*?\[\/IMG\])|(https?:\/\/[^\s<]+)/gi, function(match, isImg, isUrl) {
                            if (isImg) return isImg;
                            if (isUrl) {
                                let cleanUrl = isUrl.replace(/[.,;!?]+$/, ''); 
                                let trailing = isUrl.slice(cleanUrl.length);
                                return `<a href="${cleanUrl}" target="_blank" style="color: #0284c7; text-decoration: underline; font-weight: 600;">${cleanUrl}</a>${trailing}`;
                            }
                            return match;
                        });

                        processedContent = processedContent.replace(/\[IMG=(.*?)\](.*?)\[\/IMG\]/gi, '<div class="text-center my-3"><a href="$2" target="_blank" title="Bấm để xem ảnh gốc"><img src="$2" style="width: $1; max-width: 100%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); object-fit: contain;"></a></div>');
                        processedContent = processedContent.replace(/\[IMG\](.*?)\[\/IMG\]/gi, '<div class="text-center my-3"><a href="$1" target="_blank" title="Bấm để xem ảnh gốc"><img src="$1" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);"></a></div>');

                        let fullShareUrl = window.location.href;

                        let hiddenNoticeBadge = data.isHidden ? `<span class="badge bg-secondary ms-2" style="font-size: 12px;"></span>` : '';
// XỬ LÝ NÚT TRỞ LẠI: NẾU LÀ KHÁCH THÌ ẨN LUÔN NÚT TRỞ LẠI VÀ CHỈ HIỂN THỊ TIÊU ĐỀ
    // XỬ LÝ NÚT TÊN THANH HEADER CHO KHÁCH VÀ SINH VIÊN
   // XỬ LÝ NÚT TRỞ LẠI CHO KHÁCH VÀ SINH VIÊN
let backButtonHtml = '';
if (!currentUser || currentUser.isGuest) {
    // Khách: Chỉ hiện thanh tiêu đề + nút Đăng nhập (KHÔNG CÓ nút Trở lại)
    backButtonHtml = `
        <div class="tb-header-blue d-flex justify-content-between align-items-center" style="cursor: default;">
            <span><i class="fa-solid fa-globe me-2"></i> Thông báo hệ thống</span>
            <button class="btn btn-sm btn-light text-primary fw-bold px-3" style="border-radius: 20px;" onclick="window.location.href='login.html'">
                <i class="fa-solid fa-right-to-bracket me-1"></i> Đăng nhập
            </button>
        </div>
    `;
} else {
    // Sinh viên / Admin: Hiển thị nút Trở lại như cũ
    backButtonHtml = `
        <div class="tb-header-blue" style="cursor: pointer;" onclick="backToThongBaoList()">
            <i class="fa-solid fa-arrow-left me-2"></i> Trở lại <span class="mx-2">|</span> <i class="fa-solid fa-globe me-2"></i> Tin tức - Thông báo chi tiết
        </div>
    `;
}
                      let html = `
                        <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                            <div class="tb-detail-title-small" style="font-size: 22px; font-weight: bold;">
                                [${currentCode}] ${data.c2} ${hiddenNoticeBadge}
                            </div>
                        
                        </div>
                        <div class="tb-detail-dates mb-2 d-flex align-items-center flex-wrap gap-3" style="font-size: 15px; padding-bottom: 8px; border-bottom: none;">
                            ${dateDisplay}
                            ${detailCountdownHtml}
                        </div>
                        <div class="tb-detail-main-content" style="font-size: 16px; font-weight: normal; line-height: 1.6; border-top: 2px solid #f3f4f6; padding-top: 16px;">
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

                    // HÀM TRỞ LẠI -> TỰ ĐỘNG XOÁ BỎ THAM SỐ ?tb= TRÊN BIA ĐỊA CHỈ
                  // HÀM TRỞ LẠI -> TỰ ĐỘNG XOÁ BỎ THAM SỐ ?tb= TRÊN BIA ĐỊA CHỈ
                   window.backToThongBaoList = function() {
                        // Bảo mật: Khách bấm lệnh này sẽ báo lỗi ngay
                        if (currentUser && currentUser.isGuest) {
                            alert("Chế độ Khách không thể xem danh sách Thông báo tổng. Vui lòng đăng nhập!");
                            return; 
                        }

                        $('#tbDetailContainer').addClass('d-none');
                        $('#tbMainView').removeClass('d-none').attr('style', ''); // Xóa lệnh ẩn ép buộc để hiện lại bảng
                        resetUrlToDefault();
                    };

                    window.copyTBLink = function(url) {
                        navigator.clipboard.writeText(url).then(() => {
                            alert("Đã sao chép liên kết thông báo thành công!");
                        });
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

               // Tự động kiểm tra trên URL xem có đang mở link chia sẻ không
                let urlParamsTemp = new URLSearchParams(window.location.search);
                // Nếu là Khách HOẶC đang mở link trực tiếp -> Giấu ngay bảng danh sách
                let hideMainClass = ((currentUser && currentUser.isGuest) || urlParamsTemp.get('tb')) ? 'd-none' : '';

                let customViewHtml = `
                <div class="row g-4 mt-2 mb-4">
                    <div class="col-12 ${hideMainClass}" id="tbMainView" ${hideMainClass ? 'style="display: none !important;"' : ''}>
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
renderDeadlinesOnNoticePage();
applyKaTeX('customViewWrapper');
$('#loadingStatus').addClass('d-none');
                return;
            }

        // ==========================================
            // XỬ LÝ CHO CÁC HỌC PHẦN BÌNH THƯỜNG (BẢNG 7 CỘT)
            // ==========================================
            let bodyHtml = ''; let headHtml = ''; let instructorInfos = [];
            let examCardsHtml = ''; let hasExamCards = false; 
            
         // THÊM MỚI: Biến quản lý ID nhóm cho tính năng Thu gọn/Thả xuống đa cấp
            let currentChapterId = 0;
            let currentLessonId = 0;

            data.forEach((row, rowIndex) => {
		if (!row || row.length === 0 || row.filter(cell => String(cell).trim() !== "").length === 0) return;
                let fullRowText = row.join(" ").toLowerCase().replace(/\s+/g, ' '); 
                let firstCellTextRaw = String(row[0]).trim(); 
                let firstCellText = firstCellTextRaw.toLowerCase().replace(/\s+/g, '');
                
                // 1. Xử lý tiêu đề cột
                if (rowIndex === 0) { 
                    if (sheetName.toLowerCase() === 'thông báo') {
                        row.forEach((cell) => { headHtml += `<th>${String(cell || '')}</th>`; });
                    } else {
                        // Tùy chỉnh tiêu đề cột cho Danh mục Học phần
                        headHtml += `<th style="width: 105px;">STT</th><th>Nội dung bài học</th><th style="width: 250px;">Ghi chú</th>`;
                    }
                    if (isAdmin) headHtml += `<th style="width: 180px; min-width: 180px;">Thao tác</th>`; 
                    return; 
                }
                
                // 2. Trích xuất thông tin giảng viên
                if (/mãhp|họcphần|gv\d|giảngviên|email|thôngbáo|sốtínchỉ/.test(fullRowText.replace(/\s+/g, ''))) { 
                    let info = row.filter(cell => String(cell).trim() !== "").join(" <span class='mx-2 text-black-50'>|</span> "); 
                    if(info) instructorInfos.push(info); 
                    return; 
                }

                // 3. Trích xuất thẻ bài kiểm tra/minigame (ĐOẠN NÀY LÀ CÁI BẠN BỊ MẤT)
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
                                if (matchId && matchId[1]) imageUrl = `https://drive.google.com/thumbnail?id=${matchId[1]}&sz=w400`; 
                            }
                        }
                    }
                    
                    let imgDisplayHtml = '';
                    if (imageUrl) {
                        imgDisplayHtml = `<div class="card-minigame-img"><img src="${imageUrl}"></div>`;
                    } else {
                        let iconClass = fullRowText.includes("minigame") ? "fa-gamepad" : "fa-file-lines";
                        imgDisplayHtml = `<div class="card-minigame-img default-icon"><i class="fa-solid ${iconClass}"></i></div>`;
                    }

                   // Dọn dẹp dấu nháy để không làm gãy sự kiện onclick
                    let safeTitle = titleText.replace(/'/g, "\\'").replace(/"/g, "&quot;");
                    
                    examCardsHtml += `
                        <a href="javascript:void(0)" onclick="openDocumentViewer('${linkUrl}', '${safeTitle}')" class="card-minigame-box" title="${titleText}">
                            ${imgDisplayHtml}
                            <div class="card-minigame-title">${titleText}</div>
                        </a>`;
                    return; 
                }

                // 4. Nhận diện trạng thái "Mới" và Phân cấp Chương/Bài
                let isNewRow = false;
                let rowClass = 'grid-row'; let iconPrefix = '';
                
                let isChapter = false;
                let isLesson = false;

                if (isNewRow) { rowClass += ' row-new'; }
                else if (/ngânhàng/.test(fullRowText.replace(/\s+/g, ''))) { rowClass += ' row-white'; iconPrefix = '<i class="fa-solid fa-box-archive me-2 text-secondary"></i>'; } 
                else if (/bàithi|kiểmtra|đềthi|lịchthi|phòngthi/.test(fullRowText.replace(/\s+/g, '')) || row.join(" ").toLowerCase().includes(' thi ')) { rowClass += ' row-exam'; iconPrefix = '<i class="fa-solid fa-triangle-exclamation me-2 text-danger"></i>'; } 
                else if (/chủđề|chương/.test(firstCellText)) { 
                    rowClass += ' row-topic is-chapter'; 
                    isChapter = true;
                    currentChapterId++; 
                    currentLessonId = 0; // Reset bài khi sang chương mới
                } 
                else if (/bài/.test(firstCellText)) { 
                    rowClass += ' row-lesson is-lesson'; 
                    iconPrefix = '<i class="fa-solid fa-folder-open me-2 text-success"></i>'; 
                    isLesson = true;
                    currentLessonId++; 
                }
                else if (/phần/.test(firstCellText)) { 
    rowClass += ' row-part'; 
    isPart = true; // Đánh dấu dòng này là PHẦN
}
                let sheetRowIndex = rowIndex + 1;
                // Bổ sung thêm điều kiện window.innerWidth >= 992 để chỉ bật Kéo-Thả trên PC
let dragAttr = (isAdmin && window.innerWidth >= 992) ? ` draggable="true" ondragstart="handleDragStart(event, ${sheetRowIndex})" ondragover="handleDragOver(event)" ondragenter="handleDragEnter(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, ${sheetRowIndex}, '${currentSheetName}')" style="cursor: grab;"` : '';
                
                // Gắn Class child cho các dòng dữ liệu con, và gán sự kiện Click
                let childClass = '';
                let clickEvent = '';

                // Phân cấp và Thu gọn mặc định bằng class d-none
                if (isChapter) {
                    clickEvent = ` onclick="toggleChapter(${currentChapterId}, this)" style="cursor: pointer;" title="Bấm để mở rộng"`;
                } else if (isLesson) {
                    clickEvent = ` onclick="toggleLesson(${currentChapterId}, ${currentLessonId}, this)" style="cursor: pointer;" title="Bấm để mở rộng"`;
                    childClass = ` child-of-chapter-${currentChapterId} d-none`; // Bài thuộc Chương (ẩn lúc đầu)
                } else {
                    if (currentLessonId > 0) {
                        childClass = ` child-of-chapter-${currentChapterId} child-of-lesson-${currentChapterId}-${currentLessonId} d-none`; // Nội dung thuộc Bài (ẩn lúc đầu)
                    } else if (currentChapterId > 0) {
                        childClass = ` child-of-chapter-${currentChapterId} direct-chapter-child d-none`; // Nội dung trực tiếp của Chương (ẩn lúc đầu)
                    }
                }

               bodyHtml += `<tr class="${rowClass}${childClass}"${clickEvent}${dragAttr}>`;
                
                if (sheetName.toLowerCase() === 'thông báo') {
                    // GIỮ NGUYÊN LOGIC CŨ CHO BẢNG THÔNG BÁO
                    row.forEach((cell, cellIndex) => {
                        let cellText = String(cell).trim();
                        if (cellIndex === 0 && isNewRow) cellText = cellText.replace(/new/i, '<span class="badge-new">Mới</span>');
                        
                        let chevronHtml = '';
                        if ((isChapter || isLesson) && cellIndex === 1) {
                            chevronHtml = `<button class="btn-expand ms-2" style="background: transparent; border: none; padding: 0; width: 24px; height: 24px; color: inherit; pointer-events: none;"><i class="fa-solid fa-chevron-down" style="transition: transform 0.3s ease; transform: rotate(-90deg);"></i></button>`;
                        }

                        let _urlRegex = /(https?:\/\/[^\s]+)/g; let _match = cellText.match(_urlRegex); let extractedUrl = _match ? _match[0] : null;
                        if (extractedUrl) { 
                            let label = cellText.replace(extractedUrl, '').trim() || "Truy cập tài liệu"; 
                            bodyHtml += `<td onclick="window.open('${extractedUrl}', '_blank'); event.stopPropagation();" style="cursor: pointer; color: #0284c7; font-weight: 600; text-decoration: underline;" title="Nhấn để truy cập tài liệu">${label}</td>`; 
                        } else { 
                            if (cellText.toLowerCase().includes('đang cập nhật')) {
                                let contentHtml = cellIndex === 0 && !isNewRow ? iconPrefix + cellText : cellText;
                                bodyHtml += `<td onclick="alert('Chưa tới ngày phát hành'); event.stopPropagation();" style="cursor: pointer; color: #d97706; font-style: italic;">${contentHtml} ${chevronHtml}</td>`;
                            }
                            else if (cellText === "") { 
                                bodyHtml += `<td></td>`; 
                            } else { 
                                bodyHtml += `<td>${cellIndex === 0 && !isNewRow ? iconPrefix + cellText : cellText} ${chevronHtml}</td>`; 
                            }
                        }
                    });
                } else {
// LOGIC MỚI CHO DANH MỤC HỌC PHẦN
                    let c1 = String(row[0] || '').trim(); // Cột 1: STT
                    let c2 = String(row[1] || '').trim(); // Cột 2: Hình thức / Tên bài học
                    let c3 = String(row[2] || '').trim(); // Cột 3: Link
                    let c4 = String(row[3] || '').trim(); // Cột 4: Ghi chú
                    
                    // --- BẮT ĐẦU: Xử lý tách Ngày đăng và Ngày cập nhật ---
                    let dangMatch = c4.match(/ĐĂNG=((?:\d{2}:\d{2}\s)?\d{2}\/\d{2}\/\d{4})/i);
                    let updateMatch = c4.match(/UPDATE=((?:\d{2}:\d{2}\s)?\d{2}\/\d{2}\/\d{4})/i);

                    let dateInfoHtml = '';
                    if (dangMatch) {
                        // Áp dụng class tb-date-text chuẩn của mục Thông báo để đóng khung chuyên nghiệp
                        dateInfoHtml += `<span class="tb-date-text" style="font-size: 12px; font-weight: 600; padding: 2px 8px;"><i class="fa-regular fa-calendar text-primary"></i> Ngày đăng: ${dangMatch[1]}</span>`;
                        c4 = c4.replace(dangMatch[0], '').trim();
                    }
                    if (updateMatch) {
                        dateInfoHtml += `<span class="tb-date-text text-success" style="font-size: 12px; font-weight: 600; padding: 2px 8px;"><i class="fa-solid fa-clock-rotate-left"></i> Ngày cập nhật: ${updateMatch[1]}</span>`;
                        c4 = c4.replace(updateMatch[0], '').trim();
                    }
                    c4 = c4.replace(/^[\s,\-]+|[\s,\-]+$/g, '');
                    // --- KẾT THÚC XỬ LÝ ---

                    if (isNewRow) c1 = c1.replace(/new/i, '<span class="badge-new">Mới</span>');
                    
                    let chevronHtml = '';
                    if ((isChapter || isLesson)) {
                        chevronHtml = `<button class="btn-expand ms-2" style="background: transparent; border: none; padding: 0; width: 24px; height: 24px; color: inherit; pointer-events: none;"><i class="fa-solid fa-chevron-down" style="transition: transform 0.3s ease; transform: rotate(-90deg);"></i></button>`;
                    }

                    // Trích xuất link từ cột 3
                    let _urlRegex = /(https?:\/\/[^\s<"]+)/g; 
                    let extractedUrl = c3.match(_urlRegex) ? c3.match(_urlRegex)[0] : null;

                    // Cột 4: Ghi chú (Kiểm tra chữ "Đang cập nhật")
                   // Cột 4: Ghi chú (Kiểm tra chữ "Đang cập nhật")
let col4Html = c4.replace(/<\/?p[^>]*>/gi, '').replace(/&nbsp;/gi, ' ').replace(/(<br\s*\/?>|\n)+/gi, ' ').trim();
let isUpdating = col4Html.toLowerCase().includes('đang cập nhật');

// --- BẮT ĐẦU CỘT 2: TÊN BÀI HỌC VÀ LOGO ---
let col2Html = c2.replace(/<\/?(p|div)[^>]*>/gi, '').replace(/&nbsp;/gi, ' ').replace(/(<br\s*\/?>|\n)+/gi, ' ').trim();
                    
                    // Thêm Logo tự động: CHỈ hiện logo file tài liệu cho các hàng nội dung nhỏ bên trong
                    let lessonIcon = ''; 
if (!isChapter && !isLesson && !rowClass.includes('row-part')) {
    lessonIcon = '<i class="fa-solid fa-file-lines me-2" style="color: #0ea5e9; font-size: 16px;"></i>';
}

if (extractedUrl) {
    if (isUpdating && !isAdmin) {
        col2Html = `<span onclick="$('#updatingModal').modal('show'); event.stopPropagation();" style="cursor: pointer; color: #0f4c81; font-weight: 700; text-decoration: none;" title="Đang cập nhật">${lessonIcon}${col2Html || "Đang cập nhật"}</span>`;
    } else {
        // Dùng Regex để loại bỏ các dấu nháy gây gãy chuỗi HTML cho Tiêu đề và Link
        let safeTitle = col2Html.replace(/'/g, "\\'").replace(/"/g, "&quot;"); 
        let safeUrl = extractedUrl.replace(/'/g, "\\'"); // <-- Khử dấu nháy đơn trong link Upcoder

        // Thay extractedUrl bằng safeUrl bên dưới
        col2Html = `<span onclick="openDocumentViewer('${safeUrl}', '${safeTitle}'); event.stopPropagation();" style="cursor: pointer; color: #0f4c81; font-weight: 700; text-decoration: none;" title="Nhấn để xem bài học trực tiếp">${lessonIcon}${col2Html || "Xem tài liệu"}</span>`;
    }
} else {
                        col2Html = `<span style="color: #0f4c81; font-weight: 700;">${lessonIcon}${col2Html}</span>`;
                    }

                    // Gói Tên bài học và Ngày tháng vào chung 1 khối (Hiển thị dọc)
                    // margin-left: 24px để hàng ngày tháng dịch vào chuẩn tỉ lệ thẳng hàng chữ tiêu đề bài học
                   let finalCol2 = dateInfoHtml 
    ? `<div class="d-flex flex-column align-items-start" style="gap:0;margin:0;padding:0;">
         <div class="d-flex align-items-center">${col2Html} ${chevronHtml}</div>
         <div class="d-flex flex-wrap gap-2 mt-1" style="margin-left:24px;">${dateInfoHtml}</div>
       </div>`
    : `<div class="d-flex align-items-center" style="margin:0;padding:0;">${col2Html} ${chevronHtml}</div>`;
                    // --- KẾT THÚC CỘT 2 ---

                    if (isUpdating) {
                        if (!isAdmin) {
                            col4Html = `<span onclick="$('#updatingModal').modal('show'); event.stopPropagation();" style="cursor: pointer; color: #d97706; font-style: italic; font-weight: 600;"><i class="fa-solid fa-clock-rotate-left me-1"></i>${col4Html}</span>`;
                        } else {
                            col4Html = `<span style="color: #d97706; font-style: italic; font-weight: 600;"><i class="fa-solid fa-clock-rotate-left me-1"></i>${col4Html}</span>`;
                        }
                    } else if (col4Html !== '') {
                        col4Html = `<span style="color: #64748b; font-size: 14px;">${col4Html}</span>`;
                    }

                    // Ghép vào 3 ô TD hiển thị
                    bodyHtml += `<td style="font-weight: 600;">${iconPrefix}${c1}</td>`;
                    bodyHtml += `<td>${finalCol2}</td>`; 
                    bodyHtml += `<td>${col4Html}</td>`;                }

                // (Đoạn Render nút Admin giữ nguyên...)

                // Render nút Admin
                if (isAdmin) {
                    let escapedCells = row.map(c => String(c || '').replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, "\\n").replace(/\r/g, ""));
                    while(escapedCells.length < 7) escapedCells.push(''); 
                    
                    bodyHtml += `<td onclick="event.stopPropagation();"><div class="d-flex flex-wrap gap-1">
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
$('#tbMainView').addClass('d-none');
    $('#tbDetailContainer').removeClass('d-none');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    // --- BẮT ĐẦU ĐOẠN CẦN CẬP NHẬT/THÊM MỚI ---
    
    // 1. Gọi ngầm kiểm tra dữ liệu Q&A mỗi 5 giây
// Thay thế vòng lặp setInterval cũ bằng khối này
// 1. Gọi ngầm kiểm tra dữ liệu Q&A và ShareCode mỗi 5 giây
    setInterval(function() {
        if (!$('#qaSection').hasClass('d-none')) {
            silentCheckNewQA();
        } else {
            checkNewQA(); 
        }
        
        // Cập nhật huy hiệu cho ShareCode cực mượt
        checkNewShareCodeGlobal(); 
    }, 5000);

    // 2. ĐỒNG BỘ TRẠNG THÁI DEADLINE TỪ SERVER VỀ MÁY KHI KHỞI ĐỘNG
    if (currentUser && currentUser.mssv) {
        $.ajax({ 
            url: SCRIPT_URL + "?action=getCompletedDeadlines&mssv=" + currentUser.mssv, 
            method: "GET", 
            dataType: "json", 
            success: function(res) {
                if (res && !res.error) {
                    let dataToSave = typeof res === 'string' ? res : JSON.stringify(res);
                    localStorage.setItem('completed_deadlines_' + currentUser.mssv, dataToSave);
                    
                    // Cập nhật lại UI lập tức nếu người dùng đang mở sẵn tab Lịch học
                    if (!$('#tkbSection').hasClass('d-none')) {
                        renderDeadlines();
                    }
                }
            }
        });
    }
    // --- KẾT THÚC ĐOẠN CẦN CẬP NHẬT/THÊM MỚI ---

    fetchSemesterConfig(); 
    
    // FIX LỖI: Chỉ tự động nạp trang "Thông báo" NẾU trên URL không có link chuyển hướng
    let urlParamsCheck = new URLSearchParams(window.location.search);
    if (!urlParamsCheck.get('view') && !urlParamsCheck.get('course') && !urlParamsCheck.get('tb')) {
        loadDataByHocPhan('Thông báo', document.getElementById('btnNavThongBao')); 
    }

    loadWebLinks();
    checkNewQA(); 
    checkNewShareCodeGlobal();
    fetchAndRenderCategories();
    renderUserInfo();
	if (currentUser && currentUser.mssv) {
        $.ajax({
            url: SCRIPT_URL + "?action=getUserProfile&mssv=" + currentUser.mssv,
            method: "GET",
            dataType: "json",
            success: function(res) {
                if (res && res.success) {
		if (res.name) {
        currentUser.name = res.name;
    }
                    // Cập nhật lại bộ nhớ đệm nội bộ với dữ liệu mới nhất
                    currentUser.chuyenNganh = res.chuyenNganh;
                    currentUser.khoa = res.khoa;
                    currentUser.khoaHoc = res.khoaHoc;
                    currentUser.nhom = res.nhom;
                    currentUser.avatar = res.avatar;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    // Cập nhật lại giao diện (Ảnh, tên, v.v.)
                    renderUserInfo();
                    if (typeof updateAvatarDisplay === 'function') {
                        updateAvatarDisplay(currentUser.avatar);
                    }
                }
            }
        });
    }
    fetchAndRenderDeadlinesForNotice();
    if (currentUser && currentUser.mssv === "51.01.108.008") {
        $('#adminDatabaseLink').removeClass('d-none');
    } else {
        $('#adminDatabaseLink').addClass('d-none');
    }
}
if (localStorage.getItem('isAdmin') === 'true') {
        isAdmin = true;
        $('#btnAdminLoginToggle').html('<i class="fa-solid fa-unlock text-danger" style="font-size: 16px; width: 20px; text-align: center;"></i> Đăng xuất Admin').css('color', 'var(--accent-red)');
        $('#btnManageCategories').removeClass('d-none');
        renderSidebarCategories();
        $('#adminDatabaseLink').removeClass('d-none');
    }
$(document).ready(function() {
    // Lấy dữ liệu từ localStorage (lưu ý không dùng 'let' để ghi đè thẳng vào biến toàn cục)
    currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    
    if (!currentUser) {
        // 1. Tạo tài khoản Khách ảo để web có thể chạy được các tính năng xem
        currentUser = {
            mssv: "Khách",
            name: "Khách",
            isGuest: true
        };

        // 2. Vẫn giữ nguyên logic của Web dự phòng: Mở Modal đăng nhập
        if (window.location.pathname.includes("webduphong")) {
            let modalEl = document.getElementById('userAuthModal');
            if (modalEl) {
                let authModal = new bootstrap.Modal(modalEl);
                authModal.show();
                if (typeof renderSavedAccounts === 'function') renderSavedAccounts();
            }
        } 
        
        // Bỏ lệnh window.location.href = "login.html"; ở đây để Khách không bị văng
        // 3. Khởi chạy app với tư cách Khách
        initGlobalApp();
        
    } else { 
        // Nếu đã đăng nhập thì khởi chạy bình thường
        initGlobalApp(); 
    }
});renderUserInfo

// ==========================================
// TÍNH NĂNG TÍNH ĐIỂM GPA (BẢN CHUẨN CUỐI CÙNG)
// ==========================================
let myGPADataset = JSON.parse(localStorage.getItem('myGPADataset')) || [];
function loadGPAView() {
    document.title = "Tính điểm GPA | Học nhóm APMA Khoa Toán";
    resetNavActive(); 
    $('#btnNavGPA').addClass('active'); 
    $('#gpaSection').removeClass('d-none');
    
    updateSystemUrl('view', 'gpa'); // Đổi URL thành ?view=gpa
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
    // Làm tròn chính xác đến 1 chữ số thập phân trước khi đối chiếu
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

    // SỬA LỖI: Đồng bộ hóa biến type và t
    let t = type || ''; 
    let passed = false;
    
    // Mức qua môn chuẩn
    if (t.startsWith('cn_') || t === 'chuyen_nganh') {
        passed = roundedScore >= 5.5; 
    } else if (t.startsWith('mc_') || t === 'mon_chung') {
        passed = roundedScore >= 4.0; 
    } else if (t.startsWith('gdtc_') || t === 'ngoai_le') {
        passed = roundedScore >= 5.0; 
    } else {
        passed = roundedScore >= 4.0; // Mặc định nếu không thuộc các loại trên
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
    
    // Tương thích ngược: Ưu tiên đọc % của lần thi hiện tại (percent1, percent2...), 
    // nếu không có thì lấy % dùng chung (percent) của cấu trúc cũ.
    let percentVal = parseFloat(col['percent' + i]);
    if (isNaN(percentVal)) {
        percentVal = parseFloat(col.percent) || 0;
    }

   if(isNaN(val) || col['score' + i] === '') { 
        hasAllScores = false; // Chỉ cần 1 ô điểm trống là bỏ qua không tính môn này
    } else {
        currentScore10 += (val * percentVal) / 100;
    }
});

           if(hasAllScores && hasAnyColumn) {
                // Sửa chữ 't' thành 'type' để tránh lỗi ReferenceError
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

       if (course.type !== 'ngoai_le' && !(course.type || '').startsWith('gdtc_')) {
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
(function() {
    let oldRenderDetail = renderAdminUserDetail;
    window.renderAdminUserDetail = function(mssv, data) {
        // 1. Gọi hàm render cũ để vẽ xong HTML ra màn hình
        oldRenderDetail(mssv, data);

        // 2. Chờ DOM vẽ xong HTML mới chèn các Option Năm học / Học kỳ vào
        setTimeout(() => {
            if (typeof globalConfigHK !== 'undefined' && globalConfigHK.length > 0) {
                let nHocs = [...new Set(globalConfigHK.map(item => item[0]))];
                let hKys = [...new Set(globalConfigHK.map(item => item[1]))];
                
                let nhHtml = '<option value="">-- Tất cả Năm học --</option>'; 
                nHocs.forEach(nh => nhHtml += `<option value="${nh}">${nh}</option>`); 
                $('#adminUserTkbNamHoc').html(nhHtml);
                
                let hkHtml = '<option value="">-- Tất cả Học kỳ --</option>'; 
                hKys.forEach(hk => hkHtml += `<option value="${hk}">${hk}</option>`); 
                $('#adminUserTkbHocKy').html(hkHtml);
            }
        }, 100);
    };
})();

// Hàm thực thi ẩn/hiện các dòng TKB của Sinh viên dựa trên Học kỳ được chọn
window.filterAdminUserTkb = function() {
    let selectedNH = $('#adminUserTkbNamHoc').val();
    let selectedHK = $('#adminUserTkbHocKy').val();
    let startMonTime = null;
    let endSunTime = null;

    // Quy chiếu tìm Ngày Bắt đầu - Kết thúc của Học kỳ Admin đang lọc
    if (selectedNH && selectedHK && typeof globalConfigHK !== 'undefined') {
        let config = globalConfigHK.find(item => item[0] === selectedNH && item[1] === selectedHK);
        if (config) {
            let sDate = parseDateString(config[2]);
            let numWeeks = parseInt(config[3]);
            let breakWeeks = (config[4] || "").split(',').map(w => parseInt(w.trim())).filter(w => !isNaN(w));
            
            if (sDate && numWeeks) {
                let startMon = getMondayOfDate(sDate);
                startMonTime = startMon.getTime();
                let acadWk = 1, calWk = 1;
                while (acadWk <= numWeeks && calWk <= 52) {
                    if (!breakWeeks.includes(calWk)) acadWk++;
                    calWk++;
                }
                let endSun = new Date(startMon);
                endSun.setDate(endSun.getDate() + ((calWk - 1) * 7) - 1);
                endSun.setHours(23, 59, 59, 999);
                endSunTime = endSun.getTime();
            }
        }
    }

    const getTimeFast = (dateStr) => { let d = parseDateString(dateStr); return d ? d.getTime() : null; };

    // Duyệt qua và ẩn/hiện các hàng trong Bảng 1: Thời khóa biểu cá nhân
    $('.user-tkb-row').each(function() {
        let ngayBd = $(this).attr('data-start');
        let ngayKt = $(this).attr('data-end');

        // Nếu Admin chọn "-- Tất cả --", hiện toàn bộ
        if (!selectedNH && !selectedHK) {
            $(this).removeClass('d-none');
            return;
        }

        // Nếu môn học không có thông tin ngày bắt đầu/kết thúc, giữ nguyên không ẩn
        if (!ngayBd && !ngayKt) {
            $(this).removeClass('d-none');
            return;
        }

        let cStartTime = getTimeFast(ngayBd);
        let cEndTime = getTimeFast(ngayKt);
        let isVisible = true;

        if (startMonTime && endSunTime) {
            if (cStartTime && cEndTime) isVisible = (cStartTime <= endSunTime && cEndTime >= startMonTime);
            else if (cStartTime) isVisible = (cStartTime <= endSunTime);
            else if (cEndTime) isVisible = (cEndTime >= startMonTime);
        }

        if (isVisible) { $(this).removeClass('d-none'); } 
        else { $(this).addClass('d-none'); }
    });
};
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
        { type: 'cn_bb', title: 'Chuyên ngành - Bắt buộc', icon: 'fa-book-open', color: 'primary' },
        { type: 'cn_tc', title: 'Chuyên ngành - Tự chọn', icon: 'fa-book-open', color: 'info' },
        { type: 'mc_bb', title: 'Môn chung - Bắt buộc', icon: 'fa-layer-group', color: 'success' },
        { type: 'mc_tc', title: 'Môn chung - Tự chọn', icon: 'fa-layer-group', color: 'warning' },
        
        // GỘP CHUNG TOÀN BỘ GDTC & GDQP VÀO NĂM MỘT NHÓM
        { 
            type: 'gdtc_group', 
            title: 'Giáo dục Thể chất & Giáo dục Quốc phòng-côAn ninh', 
            icon: 'fa-person-running', 
            color: 'secondary',
            match: (t) => t.startsWith('gdtc_') || t === 'ngoai_le'
        },
        
        // Các mục cũ hệ thống
        { type: 'chuyen_nganh', title: 'Chuyên ngành (Hệ thống cũ)', icon: 'fa-book-open', color: 'primary' },
        { type: 'mon_chung', title: 'Môn chung (Hệ thống cũ)', icon: 'fa-layer-group', color: 'success' }
    ];

let html = '<div class="table-responsive border-0"><table class="gpa-main-table w-100" style="border-collapse: collapse; background: #fff;">';
    let globalIndex = 1;
    
    groups.forEach(group => {
        // Kiểm tra môn thuộc nhóm (hỗ trợ hàm match gộp GDTC)
        let coursesInGroup = displayDataset.filter(c => {
            if (typeof group.match === 'function') {
                return group.match(c.type || '');
            }
            return c.type === group.type;
        });
        
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
    let p1 = col.percent1 !== undefined ? col.percent1 : (col.percent || 0);
    let p2 = col.percent2 !== undefined ? col.percent2 : (col.percent || 0);
    let p3 = col.percent3 !== undefined ? col.percent3 : (col.percent || 0);

    subRows += `
    <tr style="border-bottom: 1px solid #e2e8f0; background: #fff; height: 60px;">
        <td class="text-center" style="padding: 16px; border-right: 1px solid #e2e8f0; color: #4b5563; font-size: 15px;">${i + 1}</td>
        <td class="text-start" style="padding: 16px; border-right: 1px solid #e2e8f0; color: #1e293b; font-weight: 600; font-size: 15px;">${col.name}</td>
        
        <!-- Cột 3: Trọng số Lần 1 -->
        <td class="text-center" style="padding: 16px; border-right: 1px solid #e2e8f0; color: #4b5563; font-size: 15px;">${p1 > 0 ? p1 + '%' : '-'}</td>
        
        <!-- Cột 4: Điểm Lần 1 -->
        <td class="text-center" style="padding: 16px; border-right: 1px solid #e2e8f0; font-weight: 600; color: #1e293b; font-size: 15px;">${col.score1 || ''}</td>
        
        <!-- Cột 5: Trọng số Lần 2 -->
        <td class="text-center" style="padding: 16px; border-right: 1px solid #e2e8f0; color: #4b5563; font-size: 15px;">${p2 > 0 ? p2 + '%' : '-'}</td>
        
        <!-- Cột 6: Điểm Lần 2 -->
        <td class="text-center" style="padding: 16px; border-right: 1px solid #e2e8f0; font-weight: 600; color: #166534; font-size: 15px;">${col.score2 || ''}</td>
        
        <!-- Cột 7: Trọng số Lần 3 -->
        <td class="text-center" style="padding: 16px; border-right: 1px solid #e2e8f0; color: #4b5563; font-size: 15px;">${p3 > 0 ? p3 + '%' : '-'}</td>
        
        <!-- Cột 8: Điểm Lần 3 -->
        <td class="text-center" style="padding: 16px; font-weight: 600; color: #d97706; font-size: 15px;">${col.score3 || ''}</td>
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

               let electiveBadge = ((c.type || '').endsWith('_tc') && c.note) ? `<br><span class="badge bg-info text-dark mt-2 shadow-sm border border-info" style="font-size: 11px;"><i class="fa-solid fa-tag me-1"></i> Nhóm: ${c.note}</span>` : '';

html += `
    <tr class="main-row" data-bs-toggle="collapse" data-bs-target="#detail-${c.id}" onclick="$(this).find('.btn-expand').toggleClass('open')" style="border-bottom: 1px solid #e5e7eb; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
        <td class="text-center text-muted fw-bold" style="padding: 18px 10px;">${globalIndex++}</td>
        <td class="text-center fw-bold text-secondary" style="padding: 18px 10px;">${courseCode}</td>
        <td class="text-start fw-bold" style="padding: 18px 10px; color: #334155;">
            ${c.name} ${badgeHtml}
            ${electiveBadge} <!-- Chèn huy hiệu ghi chú vào dưới tên môn -->
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
                                                    <th class="text-center" style="padding: 20px 16px; font-weight: 600; width: 14%; border-right: 1px solid rgba(255,255,255,0.15); font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Trọng số</th>
                                                    <th class="text-center" style="padding: 20px 16px; font-weight: 600; width: 14%; border-right: 1px solid rgba(255,255,255,0.15); font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Điểm lần 2</th>
                                                    <th class="text-center" style="padding: 20px 16px; font-weight: 600; width: 14%; border-right: 1px solid rgba(255,255,255,0.15); font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Trọng số</th>
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
        $('.gpa-col-s1-wrapper').removeClass('col-md-5').addClass('col-md-3');
    } else {
        $('.gpa-col-s2-wrapper, .gpa-col-s3-wrapper').addClass('d-none');
        $('.gpa-col-s1-wrapper').removeClass('col-md-3').addClass('col-md-5');
    }
}

// Bổ sung thêm p1, p2, p3 vào tham số
function addGPAColumnInput(name = '', p1 = '', p2 = '', p3 = '', s1 = '', s2 = '', s3 = '') {
    let colId = 'col_' + Math.random().toString(36).substr(2, 9);
    let isRetake = $('#gpaIsRetake').is(':checked');
    
    // Điều chỉnh độ rộng Lần 1 khi tắt/mở chế độ học lại
    let s1Class = isRetake ? 'col-md-3' : 'col-md-5'; 
    let retakeClass = isRetake ? '' : 'd-none';

    let html = `
    <div class="col-grade-input row g-2 align-items-center mb-2" id="${colId}">
        <div class="col-md-2">
            <input type="text" class="form-control form-control-sm gpa-col-name fw-bold" placeholder="Tên cột" value="${name}">
        </div>
        
        <!-- Nhóm Lần 1 -->
        <div class="${s1Class} gpa-col-s1-wrapper d-flex gap-1">
            <input type="number" class="form-control form-control-sm gpa-col-p1 text-center" placeholder="% L1" value="${p1}">
            <input type="number" step="0.1" class="form-control form-control-sm gpa-col-s1 fw-bold text-center text-primary" placeholder="Điểm L1" value="${s1}">
        </div>

        <!-- Nhóm Lần 2 -->
        <div class="col-md-3 gpa-col-s2-wrapper ${retakeClass} d-flex gap-1">
            <input type="number" class="form-control form-control-sm gpa-col-p2 text-center" placeholder="% L2" value="${p2}">
            <input type="number" step="0.1" class="form-control form-control-sm gpa-col-s2 fw-bold text-center text-success" placeholder="Điểm L2" value="${s2}">
        </div>

        <!-- Nhóm Lần 3 -->
        <div class="col-md-3 gpa-col-s3-wrapper ${retakeClass} d-flex gap-1">
            <input type="number" class="form-control form-control-sm gpa-col-p3 text-center" placeholder="% L3" value="${p3}">
            <input type="number" step="0.1" class="form-control form-control-sm gpa-col-s3 fw-bold text-center text-warning" placeholder="Điểm L3" value="${s3}">
        </div>

        <div class="col-md-1 text-end">
            <button class="btn btn-sm text-danger p-1" onclick="$('#${colId}').remove()"><i class="fa-solid fa-xmark"></i></button>
        </div>
    </div>`;
    $('#gpaColumnsContainer').append(html);
}
function toggleElectiveNote() {
    let type = $('#gpaCourseType').val() || '';
    // Bất kỳ môn nào có hậu tố _tc (tự chọn) thì mở ô ghi chú
    if (type.endsWith('_tc')) {
        $('#gpaElectiveNoteGroup').removeClass('d-none');
    } else {
        $('#gpaElectiveNoteGroup').addClass('d-none');
    }
}

// 1. Cập nhật hàm mở Modal thêm mới
function openAddCourseGPAModal() {
    $('#gpaEditId').val(''); $('#gpaCourseCode').val(''); $('#gpaCourseName').val('');
    $('#gpaCourseCredits').val(3); $('#gpaCourseType').val('bat_buoc');
    $('#gpaCourseNote').val(''); // Reset ghi chú
    $('#gpaIsRetake').prop('checked', false);
    
    $('#gpaBelongsToMajor1').prop('checked', true).prop('disabled', false);
    $('#gpaBelongsToMajor2').prop('checked', false).prop('disabled', false);

    $('#gpaColumnsContainer').html(''); 
    addGPAColumnInput();
    $('#gpaPercentWarning').addClass('d-none'); 
    
    handleGpaCourseTypeChange();
    toggleElectiveNote(); // Chạy kiểm tra ẩn/hiện
    $('#gpaCourseModal').modal('show');
}

function editGPACourse(id) {
    let course = myGPADataset.find(c => c.id === id); if(!course) return;
    $('#gpaEditId').val(course.id); $('#gpaCourseCode').val(course.code || ''); $('#gpaCourseName').val(course.name);
    $('#gpaCourseCredits').val(course.credits); $('#gpaCourseType').val(course.type);
    $('#gpaCourseNote').val(course.note || ''); // Đổ dữ liệu ghi chú cũ vào form
    
    let courseMajors = course.majors || ['1']; 
    $('#gpaBelongsToMajor1').prop('checked', courseMajors.includes('1')).prop('disabled', false);
    $('#gpaBelongsToMajor2').prop('checked', courseMajors.includes('2')).prop('disabled', false);

    let hasRetake = course.columns.some(col => (col.score2 && col.score2 !== '') || (col.score3 && col.score3 !== ''));
    $('#gpaIsRetake').prop('checked', hasRetake);
    
    $('#gpaColumnsContainer').html('');
    course.columns.forEach(col => { 
        let p1 = col.percent1 !== undefined ? col.percent1 : (col.percent || '');
        let p2 = col.percent2 !== undefined ? col.percent2 : (col.percent || '');
        let p3 = col.percent3 !== undefined ? col.percent3 : (col.percent || '');
        addGPAColumnInput(col.name, p1, p2, p3, col.score1 || '', col.score2 || '', col.score3 || ''); 
    });
    $('#gpaPercentWarning').addClass('d-none'); 
    
    handleGpaCourseTypeChange();
    toggleElectiveNote(); // Chạy kiểm tra ẩn/hiện
    $('#gpaCourseModal').modal('show');
}
function saveGPACourse() {
    let id = $('#gpaEditId').val() || Date.now().toString();
    let code = $('#gpaCourseCode').val().trim();
    let name = $('#gpaCourseName').val().trim();
    let credits = $('#gpaCourseCredits').val();
    let type = $('#gpaCourseType').val();
    let note = $('#gpaCourseNote').val().trim();
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
    let totalPercent1 = 0;
    let totalPercent2 = 0;
    let totalPercent3 = 0;
    let hasL2 = false;
    let hasL3 = false;

    $('.col-grade-input').each(function() {
        let cName = $(this).find('.gpa-col-name').val().trim();
        
        // Lấy % của từng lần thi dựa theo class mới
        let p1 = parseFloat($(this).find('.gpa-col-p1').val()) || 0;
        let p2 = parseFloat($(this).find('.gpa-col-p2').val()) || 0;
        let p3 = parseFloat($(this).find('.gpa-col-p3').val()) || 0;
        
        let s1 = $(this).find('.gpa-col-s1').val();
        let s2 = $(this).find('.gpa-col-s2').val();
        let s3 = $(this).find('.gpa-col-s3').val();

        if (!cName && p1 === 0 && p2 === 0) return;

        totalPercent1 += p1;
        totalPercent2 += p2;
        totalPercent3 += p3;
        
        // Đánh dấu nếu người dùng có nhập điểm cho L2 hoặc L3
        // Đánh dấu nếu có nhập điểm cho L2 hoặc L3 (Chặn triệt để lỗi undefined)
if (s2 !== undefined && s2 !== '') hasL2 = true;
if (s3 !== undefined && s3 !== '') hasL3 = true;

        columns.push({
            name: cName || "Cột điểm",
            percent1: p1,
            score1: s1,
            percent2: p2,
            score2: s2,
            percent3: p3,
            score3: s3
        });
    });

    // Kiểm tra tổng % cho từng lần thi (chỉ kiểm tra L2, L3 nếu có bật Học cải thiện và có nhập điểm)
    let isRetake = $('#gpaIsRetake').is(':checked');
    let isError = false;

    if (columns.length > 0) {
        if (Math.abs(totalPercent1 - 100) > 0.1) isError = true;
        if (isRetake && hasL2 && Math.abs(totalPercent2 - 100) > 0.1) isError = true;
        if (isRetake && hasL3 && Math.abs(totalPercent3 - 100) > 0.1) isError = true;
    }

    if (isError) {
        $('#gpaPercentWarning').removeClass('d-none');
        return; 
    } else {
        $('#gpaPercentWarning').addClass('d-none');
    }
    
    let courseObj = { id, code, name, credits, type, columns, majors: selectedMajors, note };
    
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
let match = text.match(/(?:Hết hạn|DEADLINE\s*=\s*)(?:lúc\s*)?(\d{1,2}:\d{2})?\s*(?:Ng(?:à|&agrave;)y\s*)?(\d{1,2}\/\d{1,2}\/(\d{2,4}))/i);
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
    selector: '#txtCol3, #insertCol3, #editCol3',
    entity_encoding: 'raw',
    
    // 1. Thêm nhiều plugin nâng cao: hình ảnh, media, xem toàn màn hình, code, tìm kiếm...
    plugins: 'table lists link advlist image media fullscreen code wordcount searchreplace visualblocks preview',
    
    // 2. Mở rộng thanh công cụ (Toolbar) với các nút mới
    toolbar: 'undo redo | blocks fontfamily fontsize lineheight | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | table | removeformat | preview fullscreen code',
    
    toolbar_mode: 'wrap', 
    line_height_formats: '1 1.15 1.2 1.5 1.8 2.0 2.5 3.0',
    
    // 3. BẬT LẠI thanh menu trên cùng
    menubar: true, 
    
    height: 400, // Tăng nhẹ chiều cao để không gian soạn thảo rộng rãi hơn
    branding: false,
    paste_as_text: false,
    paste_remove_styles_if_resembling_styles: true,
    
    setup: function (editor) {
        editor.on('change', function () {
            editor.save(); 
        });
    }
});// 1. Hàm hiển thị View Quản lý
function loadAdminUserManageView() {
    document.title = "Quản lý Thành viên | Admin";
    
    // Gọi hàm reset gốc để ẩn các trang khác
    resetNavActive();
    
    // Đóng dropdown popover nếu đang mở
    let dropdownMenu = document.querySelector('#sidebarUserInfo .dropdown-menu');
    if(dropdownMenu) dropdownMenu.classList.remove('show');
    
    // Hiển thị section Quản lý
    $('#adminUserManageSection').removeClass('d-none');
    
    // Đóng sidebar trên mobile
    if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); }
}

// 2. Chèn logic ẩn Admin Section vào hàm resetNavActive hiện có
const originalResetNavForAdmin = resetNavActive;
resetNavActive = function() {
    originalResetNavForAdmin(); // Gọi lại hàm cũ
    $('#adminUserManageSection').addClass('d-none'); // Ẩn giao diện quản lý
};

// 3. Hàm gọi dữ liệu của sinh viên từ Backend
function adminFetchUserData() {
    let targetMSSV = $('#adminSearchMSSV').val().trim();
    if (!targetMSSV) { alert("Vui lòng nhập MSSV!"); $('#adminSearchMSSV').focus(); return; }
    
    let area = $('#adminUserDetailArea');
    area.removeClass('d-none').html('<div class="text-center py-5 text-muted"><i class="fa-solid fa-spinner fa-spin fs-2 mb-2"></i><br>Đang lấy dữ liệu hệ thống của ' + targetMSSV + '...</div>');
    
    /* 
       GHI CHÚ BACKEND:
       Bạn cần tạo endpoint `adminGetUserData` trong Google Apps Script.
       Nó cần trả về JSON gồm: { tkb: [...], deadlines: [...], registeredCourses: [...] }
    */
    
    $.ajax({
        url: SCRIPT_URL + "?action=adminGetUserData&targetMssv=" + targetMSSV + "&adminMssv=" + currentUser.mssv,
        method: "GET",
        dataType: "json",
        success: function(data) {
			
            renderAdminUserDetail(targetMSSV, data);
        },
        error: function() {
            // MOCK DATA: Hiển thị giao diện giả lập nếu server chưa có hàm này
            area.html(`
                <div class="alert alert-warning fw-bold">
                    <i class="fa-solid fa-triangle-exclamation"></i> Không thể kết nối hoặc Backend chưa tích hợp hàm <code>adminGetUserData</code>.
                    Dưới đây là giao diện mẫu (Mock UI):
                </div>
                ${generateAdminTablesMockHTML(targetMSSV)}
            `);
        }
    });
}

// 4. Hàm Render HTML Bảng điều khiển can thiệp
function generateAdminTablesMockHTML(mssv) {
    return `
        <h5 class="text-danger border-bottom border-danger-subtle pb-2 mb-4">
            <i class="fa-solid fa-user-graduate me-2"></i>Hồ sơ dữ liệu: <span class="fw-bold">${mssv}</span>
        </h5>
        
        <!-- BẢNG 1: THỜI KHÓA BIỂU -->
        <div class="d-flex justify-content-between align-items-center mb-2 mt-4">
            <h6 class="fw-bold text-primary m-0"><i class="fa-solid fa-calendar-days me-2"></i>Thời khóa biểu cá nhân</h6>
            <button class="btn btn-sm btn-outline-primary fw-bold"><i class="fa-solid fa-plus"></i> Thêm lịch</button>
        </div>
        <div class="table-responsive bg-white rounded border shadow-sm mb-4">
            <table class="table table-bordered table-hover m-0 align-middle text-center">
                <thead style="background: #0f4c81; color: white;">
                    <tr><th>Môn học</th><th>Thứ & Tiết</th><th>Phòng</th><th>Thao tác (Admin)</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="text-start fw-bold text-primary">Toán rời rạc</td>
                        <td>Thứ 3 (1-3)</td>
                        <td>B.112</td>
                        <td>
                            <button class="btn btn-sm btn-warning py-1 px-2"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-sm btn-danger py-1 px-2"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                    <!-- Data dòng chảy vào đây -->
                </tbody>
            </table>
        </div>

        <!-- BẢNG 2: DEADLINES -->
        <div class="d-flex justify-content-between align-items-center mb-2 mt-4">
            <h6 class="fw-bold text-danger m-0"><i class="fa-solid fa-thumbtack me-2"></i>Deadlines & Sự kiện</h6>
            <button class="btn btn-sm btn-outline-danger fw-bold"><i class="fa-solid fa-plus"></i> Thêm DL</button>
        </div>
        <div class="table-responsive bg-white rounded border shadow-sm mb-4">
            <table class="table table-bordered table-hover m-0 align-middle text-center">
                <thead class="bg-danger text-white">
                    <tr><th>Tiêu đề</th><th>Thời gian</th><th>Thao tác (Admin)</th></tr>
                </thead>
                <tbody>
                    <tr><td colspan="3" class="text-muted py-3">Chưa có dữ liệu...</td></tr>
                </tbody>
            </table>
        </div>
    `;
}

// 5. Hàm Render thực tế khi có Data từ Backend (Hoàn thiện chức năng can thiệp Thêm/Sửa/Xóa)
function renderAdminUserDetail(mssv, data) {
    let area = $('#adminUserDetailArea');

    if (!data || data.error) {
        area.html(
            '<div class="alert alert-danger fw-bold shadow-sm">' +
                '<i class="fa-solid fa-triangle-exclamation me-2"></i> Lỗi: ' + (data.error || 'Không thể lấy dữ liệu từ máy chủ.') +
            '</div>'
        );
        return;
    }
// ========================================================
    // BƯỚC 1: Đồng bộ dữ liệu của Sinh viên vào biến toàn cục 
    // để các Form Sửa gốc của hệ thống có thể hiển thị đúng dữ liệu
    // ========================================================
    if (data.tkb) {
        // Đã xóa chữ "window." ở đây
        globalTkbData = data.tkb.map(function(row) {
            return {
                thu: parseInt(row[0]) || 0, tietBd: parseInt(row[1]) || 0, soTiet: parseInt(row[2]) || 1,
                thoiGian: row[3] || "", hinhThuc: row[4] || "", mon: row[5] || "", phong: row[6] || "",
                gv: row[7] || "", color: row[8] || "#e0f2fe", ngayBatDau: row[9] || "", ngayKetThuc: row[10] || "",
                ngayNgoaiLe: row[11] || "", sheetRowIndex: row[12], isSystem: String(row[12]).startsWith('SYS_')
            };
        });
    }

    if (data.deadlines) {
        // Đã xóa chữ "window." ở đây
        globalDeadlineData = data.deadlines.map(function(row) {
            return {
                title: row[1], duration: row[2], tag: row[3], icon: row[4], emoji: row[5],
                dateStart: row[6] || "", dateEnd: row[7] || "", 
                sheetRowIndex: row[8], isSystem: String(row[8]).startsWith('SYS_')
            };
        });
    }
    
    // ========================================================
    // BƯỚC 2: CÁC HÀM XỬ LÝ SỰ KIỆN CHO ADMIN 
    // (Mượn danh MSSV của sinh viên để gửi lệnh lưu/xóa)
    // ========================================================
    window.adminOriginalMssv = currentUser.mssv; // Lưu lại MSSV gốc của Admin để dự phòng

    window.adminAddTkb = function(targetMssv) {
        currentUser.mssv = targetMssv; 
        openAddTkbModal(false);
        $('#tkbPersonalModal').one('hidden.bs.modal', function() {
            currentUser.mssv = window.adminOriginalMssv; // Trả lại MSSV cũ
            adminFetchUserData(); // Tải lại bảng dữ liệu mới
        });
    };

    window.adminEditTkb = function(rowIndex, targetMssv) {
        currentUser.mssv = targetMssv;
        openEditTkbModal(rowIndex);
        $('#tkbPersonalModal').one('hidden.bs.modal', function() {
            currentUser.mssv = window.adminOriginalMssv;
            adminFetchUserData();
        });
    };

    window.adminDeleteTkb = function(rowIndex, targetMssv) {
        if(!confirm("Bạn có chắc muốn xóa lịch học này của sinh viên " + targetMssv + "?")) return;
        postToGAS({ action: "deleteTKBUser", rowIndex: rowIndex, mssv: targetMssv, deleteScope: "all", targetDate: "" }, function(res) {
            alert(res); adminFetchUserData();
        }, function() { alert("Lỗi kết nối khi xóa lịch học."); });
    };

    window.adminAddDeadline = function(targetMssv) {
        currentUser.mssv = targetMssv;
        openAddDeadlineModal();
        $('#deadlinePersonalModal').one('hidden.bs.modal', function() {
            currentUser.mssv = window.adminOriginalMssv;
            adminFetchUserData();
        });
    };

    window.adminEditDeadline = function(rowIndex, targetMssv) {
        currentUser.mssv = targetMssv;
        openEditDeadlineModal(rowIndex);
        $('#deadlinePersonalModal').one('hidden.bs.modal', function() {
            currentUser.mssv = window.adminOriginalMssv;
            adminFetchUserData();
        });
    };

    window.adminDeleteDeadline = function(rowIndex, targetMssv) {
        if(!confirm("Bạn có chắc muốn xóa deadline này của sinh viên " + targetMssv + "?")) return;
        postToGAS({ action: "deleteDeadlineUser", rowIndex: rowIndex, mssv: targetMssv }, function(res) {
            alert(res); adminFetchUserData();
        }, function() { alert("Lỗi kết nối khi xóa deadline."); });
    };

    // ========================================================
    // BƯỚC 3: TẠO GIAO DIỆN HIỂN THỊ
    // ========================================================
    let html = '';
    html += '<h5 class="text-danger border-bottom border-danger-subtle pb-2 mb-4">';
    html += '    <i class="fa-solid fa-user-graduate me-2"></i>Hồ sơ dữ liệu: <span class="fw-bold">' + mssv + '</span>';
    html += '</h5>';
    
html += '<!-- BẢNG 1: THỜI KHÓA BIỂU -->';
    html += '<div class="d-flex justify-content-between align-items-center mb-2 mt-4">';
    html += '    <h6 class="fw-bold text-primary m-0"><i class="fa-solid fa-calendar-days me-2"></i>Thời khóa biểu cá nhân</h6>';
    html += '    <button class="btn btn-sm btn-outline-primary fw-bold" onclick="adminAddTkb(\'' + mssv + '\')"><i class="fa-solid fa-plus"></i> Thêm lịch</button>';
    html += '</div>';
// (BẮT ĐẦU CHÈN HTML BỘ LỌC)
    html += '<div class="row g-3 mb-3 mt-1">';
    html += '    <div class="col-md-6">';
    html += '        <select class="form-select border-primary-subtle fw-bold" id="adminUserTkbNamHoc" onchange="filterAdminUserTkb()">';
    html += '            <option value="">-- Tất cả Năm học --</option>';
    html += '        </select>';
    html += '    </div>';
    html += '    <div class="col-md-6">';
    html += '        <select class="form-select border-primary-subtle fw-bold" id="adminUserTkbHocKy" onchange="filterAdminUserTkb()">';
    html += '            <option value="">-- Tất cả Học kỳ --</option>';
    html += '        </select>';
    html += '    </div>';
    html += '</div>';
    // (KẾT THÚC CHÈN HTML)

    html += '<div class="table-responsive bg-white rounded border shadow-sm mb-4">';
    html += '    <table id="adminUserTkbTable" class="table table-bordered table-hover m-0 align-middle text-center">';
    html += '<div class="table-responsive bg-white rounded border shadow-sm mb-4">';
    html += '    <table class="table table-bordered table-hover m-0 align-middle text-center">';
    html += '        <thead style="background: #0f4c81; color: white;">';
    html += '            <tr>';
    html += '                <th style="width: 30%;">Môn học</th>';
    html += '                <th style="width: 25%;">Thứ & Tiết</th>';
    html += '                <th style="width: 25%;">Phòng / Hình thức</th>';
    html += '                <th style="width: 20%;">Thao tác</th>';
    html += '            </tr>';
    html += '        </thead>';
    html += '        <tbody>';

   if (data.tkb && data.tkb.length > 0) {
        data.tkb.forEach(function(row) {
            let monHoc = row[5] || "Không rõ";
            let thu = row[0] ? (row[0] == 8 ? "Chủ nhật" : "Thứ " + row[0]) : "-";
            let tietBd = parseInt(row[1]);
            let soTiet = parseInt(row[2] || 1);
            let tietHienThi = !isNaN(tietBd) ? ("(Tiết " + tietBd + " - " + (tietBd + soTiet - 1) + ")") : "";
            let phongHienThi = row[6] ? row[6] : (row[4] || "-");
            let sheetRowIndex = row[12] || ""; 
            let isSystem = String(sheetRowIndex).startsWith('SYS_');
            
            let ngayBatDau = row[9] || "";
            let ngayKetThuc = row[10] || "";

            // Gắn data-start và data-end vào từng tr
            html += `<tr class="user-tkb-row" data-start="${ngayBatDau}" data-end="${ngayKetThuc}">`;
            html += '    <td class="text-start fw-bold text-primary">' + monHoc + '</td>';
            html += '    <td>' + thu + ' <br><small class="text-muted">' + tietHienThi + '</small></td>';
            html += '    <td class="fw-bold">' + phongHienThi + '</td>';
            html += '    <td>';
            
            // Ẩn nút sửa/xóa đối với các học phần hệ thống
            if (isSystem) {
                html += '        <span class="badge bg-secondary" style="font-size: 11px;"><i class="fa-solid fa-lock"></i> Hệ thống (Khóa)</span>';
            } else {
                html += '        <button class="btn btn-sm btn-warning py-1 px-2" title="Sửa" onclick="adminEditTkb(\'' + sheetRowIndex + '\', \'' + mssv + '\')"><i class="fa-solid fa-pen"></i> Sửa</button>';
               // Thay phần xóa Deadline của Admin thành:
html += '        <button class="btn btn-sm btn-danger py-1 px-2 ms-1" title="Xóa" onclick="adminDeleteDeadline(\'' + sheetRowIndex + '\', \'' + mssv + '\')"><i class="fa-solid fa-trash"></i> Xóa</button>';
            }
            
            html += '    </td>';
            html += '</tr>';
        });
    } else {
        html += '<tr><td colspan="4" class="text-muted py-4"><i class="fa-regular fa-folder-open fs-3 mb-2"></i><br>Sinh viên chưa có lịch học nào.</td></tr>';
    }

    html += '        </tbody>';
    html += '    </table>';
    html += '</div>';

    html += '<!-- BẢNG 2: DEADLINES -->';
    html += '<div class="d-flex justify-content-between align-items-center mb-2 mt-4">';
    html += '    <h6 class="fw-bold text-danger m-0"><i class="fa-solid fa-thumbtack me-2"></i>Deadlines & Sự kiện</h6>';
    html += '    <button class="btn btn-sm btn-outline-danger fw-bold" onclick="adminAddDeadline(\'' + mssv + '\')"><i class="fa-solid fa-plus"></i> Thêm DL</button>';
    html += '</div>';
    html += '<div class="table-responsive bg-white rounded border shadow-sm mb-4">';
    html += '    <table class="table table-bordered table-hover m-0 align-middle text-center">';
    html += '        <thead class="bg-danger text-white">';
    html += '            <tr>';
    html += '                <th style="width: 35%;">Tiêu đề</th>';
    html += '                <th style="width: 25%;">Thời gian</th>';
    html += '                <th style="width: 20%;">Phân loại</th>';
    html += '                <th style="width: 20%;">Thao tác</th>';
    html += '            </tr>';
    html += '        </thead>';
    html += '        <tbody>';

    if (data.deadlines && data.deadlines.length > 0) {
        data.deadlines.forEach(function(row) {
            let tieuDe = row[1] || "Không rõ";
            let thoiGian = row[2] || "-";
            let tag = row[3] || "-";
            let sheetRowIndex = row[8] || ""; 
            let isSystem = String(sheetRowIndex).startsWith('SYS_');

            html += '<tr>';
            html += '    <td class="text-start fw-bold">' + tieuDe + '</td>';
            html += '    <td><span class="text-danger fw-bold">' + thoiGian + '</span></td>';
            html += '    <td><span class="badge bg-secondary">' + tag + '</span></td>';
            html += '    <td>';
            
            // Ẩn nút sửa/xóa đối với các Deadline hệ thống đồng bộ
            if (isSystem) {
                html += '        <span class="badge bg-secondary" style="font-size: 11px;"><i class="fa-solid fa-lock"></i> Hệ thống (Khóa)</span>';
            } else {
                html += '        <button class="btn btn-sm btn-warning py-1 px-2" title="Sửa" onclick="adminEditTkb(\'' + sheetRowIndex + '\', \'' + mssv + '\')"><i class="fa-solid fa-pen"></i></button>';
    html += '        <button class="btn btn-sm btn-danger py-1 px-2 ms-1" title="Xóa" onclick="adminDeleteTkb(\'' + sheetRowIndex + '\', \'' + mssv + '\')"><i class="fa-solid fa-trash"></i></button>';
            }
            
            html += '    </td>';
            html += '</tr>';
        });
    } else {
        html += '<tr><td colspan="4" class="text-muted py-4"><i class="fa-solid fa-mug-hot fs-3 mb-2"></i><br>Không có deadline nào được ghi nhận.</td></tr>';
    }

    html += '        </tbody>';
    html += '    </table>';
    html += '</div>';

    area.html(html);
}
// 1. Tải danh sách sinh viên vào Dropdown khi mở trang Quản lý
const originalLoadAdminManage = loadAdminUserManageView;
loadAdminUserManageView = function() {
    originalLoadAdminManage(); // Gọi lại UI
    
    // Tải danh sách sinh viên vào dropdown
    $.ajax({
        url: SCRIPT_URL + "?action=getAllUsers",
        method: "GET",
        dataType: "json",
        success: function(users) {
            let options = '<option value="">-- Chọn sinh viên để tra cứu --</option>';
            users.forEach(u => options += `<option value="${u.mssv}">${u.mssv} - ${u.name}</option>`);
            $('#adminSearchMSSV').html(options);
        }
    });
};

// 2. Render Dữ liệu Hồ Sơ (Profile) & Sửa lỗi nút Sửa[cite: 2]
const originalRenderAdminUserDetail = renderAdminUserDetail;
renderAdminUserDetail = function(mssv, data) {
    if (!data || data.error) {
        $('#adminUserDetailArea').html(`<div class="alert alert-danger shadow-sm"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi: ${data.error}</div>`);
        return;
    }
    
    // TIÊM HTML HỒ SƠ LÊN TRÊN CÙNG
    let profileHtml = '';
    if (data.profile && data.profile.name) {
        profileHtml = `
        <div class="mb-4 bg-light p-3 rounded border border-danger-subtle shadow-sm">
            <h6 class="fw-bold text-danger mb-3"><i class="fa-solid fa-address-card"></i> Hồ sơ sinh viên</h6>
            <div class="row g-3" style="font-size: 14.5px;">
                <div class="col-md-6"><b>Họ và tên:</b> <span class="text-primary">${data.profile.name}</span></div>
                <div class="col-md-6"><b>Mã số sinh viên:</b> <span class="text-primary">${mssv}</span></div>
                <div class="col-md-6"><b>Khoa:</b> <span class="text-primary">${data.profile.khoa}</span></div>
                <div class="col-md-6"><b>Chuyên ngành:</b> <span class="text-primary">${data.profile.chuyenNganh}</span></div>
                <div class="col-md-6"><b>Email/Khóa học:</b> <span class="text-primary">${data.profile.email}</span></div>
                <div class="col-md-6"><b>Song ngành:</b> <span class="text-primary">${data.profile.songNganh}</span></div>
            </div>
        </div>`;
    }

    // Chạy render cũ (để tạo bảng TKB và Deadlines)
    originalRenderAdminUserDetail(mssv, data);

    // CHÈN PROFILE VÀ FIX LỖI NÚT SỬA DEADLINE
    let finalHtml = $('#adminUserDetailArea').html();
    finalHtml = profileHtml + finalHtml;
    
    // FIX BUG: Trong bảng Deadlines cũ, nó đang gọi adminEditTkb thay vì adminEditDeadline[cite: 2].
    // Ta replace để sửa nhanh gọn mà không cần viết lại toàn bộ vòng lặp render
    finalHtml = finalHtml.replace(/adminEditTkb\('SYS_/g, 'adminEditDeadline(\'SYS_'); // Fix nhầm hàm ở Deadlines
    
    $('#adminUserDetailArea').html(finalHtml);
    
    // Fix cụ thể onclick của các thẻ Deadline thủ công (không phải SYS)
    $('#adminUserDetailArea .bg-danger').closest('table').find('tbody tr').each(function() {
        let btnSua = $(this).find('button.btn-warning');
        let currentOnclick = btnSua.attr('onclick');
        if (currentOnclick && currentOnclick.includes('adminEditTkb')) {
            btnSua.attr('onclick', currentOnclick.replace('adminEditTkb', 'adminEditDeadline'));
        }
    });
};

// 3. Logic Quản lý tính năng Gán Sinh Viên vào MasterTKB
window.openAssignStudentModal = function(courseId) {
    $('#assignCourseId').val(courseId);
    $('#assignStudentList').html('<div class="text-muted"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu sinh viên...</div>');
    $('#assignStudentModal').modal('show');
    
    // Gọi API lấy toàn bộ Users và danh sách đã được tích gán
    $.ajax({
        url: SCRIPT_URL + "?action=getCourseAssignees&courseId=" + encodeURIComponent(courseId),
        method: "GET",
        dataType: "json",
        success: function(res) {
            let users = res.users;
            let assigned = res.assigned;
            let html = '';
            
            users.forEach(u => {
                // Tích ô checked sẵn cho sinh viên đã có trong lớp
                let isChecked = assigned.includes(u.mssv) ? 'checked' : '';
                html += `
                <div class="col-md-6">
                    <div class="form-check p-2 border rounded bg-light">
                        <input class="form-check-input ms-1 cb-assign-student" type="checkbox" value="${u.mssv}" id="cb_${u.mssv}" ${isChecked}>
                        <label class="form-check-label fw-bold ms-2" style="font-size: 14px;" for="cb_${u.mssv}">
                            ${u.mssv} - ${u.name}
                        </label>
                    </div>
                </div>`;
            });
            $('#assignStudentList').html(html);
        },
        error: function() {
            $('#assignStudentList').html('<div class="text-danger">Lỗi kết nối khi tải danh sách!</div>');
        }
    });
};

window.saveAssignedStudents = function() {
    let courseId = $('#assignCourseId').val();
    let selectedMssv = [];
    $('.cb-assign-student:checked').each(function() { selectedMssv.push($(this).val()); });
    
    postToGAS({ 
        action: "assignStudentsToCourse", 
        courseId: courseId, 
        assignedMssvList: selectedMssv.join(',') 
    }, function(res) {
        alert(res); 
        $('#assignStudentModal').modal('hide');
    }, function() { 
        alert("Lỗi kết nối máy chủ!"); 
    });
};
// 1. Hiển thị trang MasterTKB và ẩn các phân hệ khác
function loadAdminMasterTkbView() {
    document.title = "Quản lý MasterTKB | Admin";
    resetNavActive();
    
    let dropdownMenu = document.querySelector('#sidebarUserInfo .dropdown-menu');
    if(dropdownMenu) dropdownMenu.classList.remove('show');
    
    $('#adminMasterTkbSection').removeClass('d-none');
    if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); }
    
    fetchAdminMasterTkb();
}
function resetNavActive() {
    // Tự động khôi phục URL về mặc định khi chuyển sang danh mục khác


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
    $('#profileSection').addClass('d-none');
}

// Chèn lệnh ẩn vào hàm reset mặc định
const originalResetNavMaster = resetNavActive;
resetNavActive = function() {
    originalResetNavMaster();
    $('#adminMasterTkbSection').addClass('d-none');
};

// Hiện nút bấm điều hướng khi xác thực Admin thành công[cite: 1]
const originalVerifyAdmin = verifyAdmin;
verifyAdmin = function() {
    originalVerifyAdmin();
    if(isAdmin) {
        $('#btnAdminMasterTkb').removeClass('d-none').addClass('d-flex');
    }
};

// Hiện nút bấm điều hướng khi tải lại trang nếu phiên đăng nhập Admin còn giữ
if (localStorage.getItem('isAdmin') === 'true') {
    $('#btnAdminMasterTkb').removeClass('d-none').addClass('d-flex');
}

let currentEditMasterRowIndex = -1; // Biến toàn cục để theo dõi đang sửa hàng nào

function fetchAdminMasterTkb() {
    $('#adminMasterTkbBody').html('<tr><td colspan="7" class="text-center text-muted py-4"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu học phần...</td></tr>');
    $.ajax({
        url: SCRIPT_URL + "?action=getAdminMasterTkb",
        method: "GET",
        dataType: "json",
        success: function(data) {
            window.cachedMasterTkb = data; 
            
            // Tự động nhận diện và trích xuất Năm học, Học kỳ từ dữ liệu gốc
            let namHocs = [...new Set(data.map(item => item.namHoc).filter(Boolean))].sort().reverse();
            let hocKys = [...new Set(data.map(item => item.hocKy).filter(Boolean))].sort();

            let nhHtml = '<option value="">-- Tất cả Năm học --</option>';
            namHocs.forEach(nh => nhHtml += `<option value="${nh}">${nh}</option>`);
            $('#adminMasterTkbNamHoc').html(nhHtml);

            let hkHtml = '<option value="">-- Tất cả Học kỳ --</option>';
            hocKys.forEach(hk => hkHtml += `<option value="${hk}">${hk}</option>`);
            $('#adminMasterTkbHocKy').html(hkHtml);

            // Bắt đầu vẽ bảng sau khi tải xong Select Box
            renderAdminMasterTkbTable();
        }
    });
}
window.renderAdminMasterTkbTable = function() {
    let data = window.cachedMasterTkb || [];
    let filterNH = $('#adminMasterTkbNamHoc').val();
    let filterHK = $('#adminMasterTkbHocKy').val();

    // Tiến hành lọc dữ liệu
    let filteredData = data.filter(c => {
        let matchNH = filterNH === "" || c.namHoc === filterNH;
        let matchHK = filterHK === "" || c.hocKy === filterHK;
        return matchNH && matchHK;
    });

    let html = '';
    if(filteredData.length === 0) {
        html = '<tr><td colspan="7" class="text-center text-muted py-4">Chưa có học phần nào phù hợp điều kiện lọc.</td></tr>';
    } else {
        let groupedCourses = {};
        
        // Gom nhóm các lịch học theo Mã HP
        filteredData.forEach(course => {
            if (!groupedCourses[course.id]) {
                groupedCourses[course.id] = { id: course.id, mon: course.mon, namHoc: course.namHoc, hocKy: course.hocKy, items: [] };
            }
            groupedCourses[course.id].items.push(course);
        });

        // Vẽ giao diện
        for (let id in groupedCourses) {
            let c = groupedCourses[id];
            let rowSpan = c.items.length; 
            
            c.items.forEach((item, index) => {
                let soTiet = parseInt(item.soTiet) || 1;
                let tietBd = parseInt(item.tietBd) || 1;
                let tietKt = tietBd + soTiet - 1;

                html += `<tr>`;
                if (index === 0) {
                    html += `
                    <td rowspan="${rowSpan}" class="text-center align-middle fw-bold text-secondary border-end">${c.id}</td>
                    <td rowspan="${rowSpan}" class="align-middle fw-bold text-primary border-end">
                        ${c.mon} <br>
                        <small class="text-muted font-monospace fw-normal">${c.namHoc || ''} - ${c.hocKy || ''}</small>
                    </td>`;
                }
                
                html += `
                <td class="text-center align-middle font-monospace bg-light">
                    Thứ ${item.thu} <br><small class="text-muted">(Tiết ${tietBd} - ${tietKt})</small>
                </td>
                <td class="text-center align-middle bg-light">
                    <b>${item.phong}</b> ${item.hinhThuc ? `<br><small class="text-muted">${item.hinhThuc}</small>` : ''}
                </td>
                <td class="text-center align-middle text-muted fw-bold bg-light">${item.gv || 'Đang cập nhật'}</td>`;
                
                if (index === 0) {
                    html += `
                    <td rowspan="${rowSpan}" class="text-center align-middle border-start border-end">
                        <button class="btn btn-sm btn-outline-success fw-bold py-1 px-2" onclick="openAssignStudentModal('${c.id}')">
                            <i class="fa-solid fa-user-plus"></i> Chỉ định
                        </button>
                    </td>`;
                }
                
                html += `
                <td class="text-center align-middle border-start">
                    <div class="d-flex justify-content-center gap-1">
                        <button class="btn btn-sm btn-warning" onclick="openEditMasterTkbModal(${item.rowIndex})" title="Sửa lịch này"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteMasterTkbRow(${item.rowIndex})" title="Xóa lịch này"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
                </tr>`;
            });
        }
    }
    $('#adminMasterTkbBody').html(html);
};

function openAddMasterTkbModal() {
    currentEditMasterRowIndex = -1;
    $('#masterTkbFormModal input:not([type="color"])').val('');
    $('#mId').prop('readonly', false);
    $('#masterTkbModalTitle').text('Thêm Học phần MasterTKB mới');
    $('#masterTkbFormModal').modal('show');
}

function openEditMasterTkbModal(rowIndex) {
    // Sửa trực tiếp dòng dựa trên rowIndex
    let c = window.cachedMasterTkb.find(item => item.rowIndex === rowIndex);
    if(!c) return;
    
    currentEditMasterRowIndex = rowIndex;
    $('#mId').val(c.id).prop('readonly', true); // Khóa Mã HP không cho sửa để tránh mất liên kết
    $('#mMon').val(c.mon); $('#mThu').val(c.thu); $('#mTietBd').val(c.tietBd); $('#mSoTiet').val(c.soTiet);
    $('#mPhong').val(c.phong); $('#mThoiGian').val(c.thoiGian); $('#mHinhThuc').val(c.hinhThuc); $('#mGv').val(c.gv);
    $('#mNamHoc').val(c.namHoc); $('#mHocKy').val(c.hocKy); $('#mNgayBD').val(c.ngayBatDau); $('#mNgayKT').val(c.ngayKetThuc);
    $('#mNgoaiLe').val(c.ngayNgoaiLe); $('#mColor').val(c.color || '#e0f2fe');
    
    $('#masterTkbModalTitle').text('Chỉnh sửa Lịch MasterTKB');
    $('#masterTkbFormModal').modal('show');
}

function saveMasterTkbForm() {
    let isEdit = currentEditMasterRowIndex !== -1;
    let payload = {
        action: isEdit ? "editMasterTkb" : "addMasterTkb",
        rowIndex: currentEditMasterRowIndex,
        id: $('#mId').val().trim(), mon: $('#mMon').val().trim(), thu: $('#mThu').val(),
        tietBd: $('#mTietBd').val(), soTiet: $('#mSoTiet').val(), phong: $('#mPhong').val().trim(),
        thoiGian: $('#mThoiGian').val().trim(), hinhThuc: $('#mHinhThuc').val().trim(), gv: $('#mGv').val().trim(),
        namHoc: $('#mNamHoc').val().trim(), hocKy: $('#mHocKy').val().trim(), ngayBatDau: $('#mNgayBD').val().trim(),
        ngayKetThuc: $('#mNgayKT').val().trim(), ngayNgoaiLe: $('#mNgoaiLe').val().trim(), color: $('#mColor').val()
    };
    if(!payload.id || !payload.mon) { alert("Vui lòng nhập Mã và Tên môn!"); return; }
    
    postToGAS(payload, function(res) {
        alert(res);
        $('#masterTkbFormModal').modal('hide');
        fetchAdminMasterTkb();
    });
}

function deleteMasterTkbRow(rowIndex) {
    if(!confirm(`Bạn có chắc chắn muốn xóa lịch học này khỏi hệ thống? (Thao tác này chỉ xóa phiên lịch học hiện tại, không xóa toàn bộ lớp)`)) return;
    postToGAS({ action: "deleteMasterTkb", rowIndex: rowIndex }, function(res) {
        alert(res);
        fetchAdminMasterTkb();
    });
}
// Bật cấu hình chống lưu Cache cục bộ. Điều này đảm bảo sau khi bạn thả chuột,
// dữ liệu bảng sẽ được tải lại mới hoàn toàn từ Google Sheets, không bị "kẹt" lại giao diện cũ.
$.ajaxSetup({ cache: false });

let dragSourceIndex = -1;

window.handleDragStart = function(e, index) {
    dragSourceIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    
    // Lệnh BẮT BUỘC: Khai báo dữ liệu để trình duyệt kích hoạt chế độ Kéo-Thả (Drag & Drop)
    e.dataTransfer.setData('text/plain', index);
    
    // Dùng setTimeout để tránh lỗi giật hình (flicker) trên UI khi vừa click chuột
    setTimeout(() => {
        $(e.target).closest('tr').css('opacity', '0.4');
    }, 0);
};

window.handleDragOver = function(e) {
    // Lệnh BẮT BUỘC: Hủy hành vi mặc định để hệ thống cho phép "Thả" (Drop) vào khu vực này
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
    return false;
};

window.handleDragEnter = function(e) {
    e.preventDefault();
    let tr = $(e.target).closest('tr');
    tr.css('border-top', '3px solid var(--accent-red)'); // Vạch đỏ báo hiệu vị trí sẽ chèn vào
};

window.handleDragLeave = function(e) {
    let tr = $(e.target).closest('tr');
    tr.css('border-top', ''); // Gỡ vạch đỏ khi kéo chuột rời đi
};

window.handleDrop = function(e, targetIndex, sheetName) {
    e.preventDefault();
    e.stopPropagation();
    
    let tr = $(e.target).closest('tr');
    tr.css('border-top', '');
    $('.grid-row').css('opacity', '1');

    // Bỏ qua nếu thả lại đúng vị trí ban đầu
    if (dragSourceIndex === -1 || dragSourceIndex === targetIndex) return;
    
    $('#loadingStatus').removeClass('d-none');
    $('#tableWrapper').addClass('d-none');

    // Gọi API xử lý trên Google Apps Script
    postToGAS({
        action: "dragDropSheetRow",
        sheetName: sheetName,
        fromIndex: dragSourceIndex,
        toIndex: targetIndex
    }, function(res) {
        // Tải lại bảng ngay sau khi có phản hồi
        loadDataByHocPhan(sheetName);
    }, function() {
        alert("Lỗi khi kéo thả di chuyển!");
        loadDataByHocPhan(sheetName);
    });
};

// Sự kiện phòng hờ: Khôi phục mọi hiệu ứng UI nếu người dùng kéo ra ngoài web rồi nhả chuột
document.addEventListener("dragend", function(e) {
    $('.grid-row').css('opacity', '1');
    $('.grid-row').css('border-top', '');
});
// HÀM ĐIỀU KHIỂN THU GỌN / MỞ RỘNG (CHƯƠNG)
window.toggleChapter = function(chapterId, rowElement) {
    let chevronIcon = $(rowElement).find('.fa-chevron-down');
    let isExpanded = $(rowElement).hasClass('expanded');
    
    if (!isExpanded) {
        // Mở rộng Chương
        $(rowElement).addClass('expanded');
        chevronIcon.css('transform', 'rotate(0deg)');
        
        // Hiện các Bài (nhưng bài vẫn đang thu gọn), và Hiện các nội dung trực tiếp của Chương
        $(`.child-of-chapter-${chapterId}.is-lesson`).removeClass('d-none');
        $(`.child-of-chapter-${chapterId}.direct-chapter-child`).removeClass('d-none');
    } else {
        // Thu gọn Chương
        $(rowElement).removeClass('expanded');
        chevronIcon.css('transform', 'rotate(-90deg)');
        
        // Ẩn tất cả Bài và Nội dung bên trong Chương
        $(`.child-of-chapter-${chapterId}`).addClass('d-none');
        
        // Trả các thẻ Bài về trạng thái thu gọn
        $(`.child-of-chapter-${chapterId}.is-lesson`).removeClass('expanded');
        $(`.child-of-chapter-${chapterId}.is-lesson .fa-chevron-down`).css('transform', 'rotate(-90deg)');
    }
};

// HÀM ĐIỀU KHIỂN THU GỌN / MỞ RỘNG (BÀI)
window.toggleLesson = function(chapterId, lessonId, rowElement) {
    let chevronIcon = $(rowElement).find('.fa-chevron-down');
    let isExpanded = $(rowElement).hasClass('expanded');
    
    // Chặn sự kiện click để không lan ngược ra ngoài
    if (event) event.stopPropagation();

    if (!isExpanded) {
        // Mở rộng Bài
        $(rowElement).addClass('expanded');
        chevronIcon.css('transform', 'rotate(0deg)');
        
        // Hiển thị nội dung của Bài này
        $(`.child-of-lesson-${chapterId}-${lessonId}`).removeClass('d-none');
    } else {
        // Thu gọn Bài
        $(rowElement).removeClass('expanded');
        chevronIcon.css('transform', 'rotate(-90deg)');
        
        // Ẩn nội dung của Bài này
        $(`.child-of-lesson-${chapterId}-${lessonId}`).addClass('d-none');
    }
};
// QUẢN LÝ BẬT / TẮT NHẠC NỀN
let isMusicPlaying = false;

// ID Video YouTube: "Những Ngày Trời Bao La - 1 Hour"
const youtubeVideoId = "wdvrz3LBpOY"; 

// URL Embed tối ưu: autoplay + loop 1 hour
const youtubeMusicUrl = `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&loop=1&playlist=${youtubeVideoId}&enablejsapi=1`;

// Các danh mục được phép phát nhạc
const allowedMusicSections = ['Thông báo', 'Lịch học', 'Tổng hợp link'];

function checkAndPlayMusic(sectionName) {
    let currentSection = sectionName || currentSheetName;
    if (allowedMusicSections.includes(currentSection)) {
        if (!isMusicPlaying) startMusic();
    } else {
        stopMusic();
    }
}

function startMusic() {
    let player = document.getElementById('bgMusicPlayer');
    let icon = document.getElementById('musicIcon');
    if (player) {
        if (!player.src || player.src.includes("about:blank")) {
            player.src = youtubeMusicUrl;
        }
        if (icon) icon.classList.remove('music-paused');
        isMusicPlaying = true;
    }
}

function stopMusic() {
    let player = document.getElementById('bgMusicPlayer');
    let icon = document.getElementById('musicIcon');
    if (player) {
        player.src = "about:blank";
        if (icon) icon.classList.add('music-paused');
        isMusicPlaying = false;
    }
}

function toggleBgMusic() {
    if (!isMusicPlaying) {
        startMusic();
    } else {
        stopMusic();
    }
}

$(document).ready(function() {

});
// HÀM TẢI VÀ RENDER DEADLINE TẠI TRANG THÔNG BÁO
function fetchAndRenderDeadlinesForNotice() {
    if (!currentUser || !currentUser.mssv) return;

    $.ajax({
        url: SCRIPT_URL + "?action=getDeadlinesUser&mssv=" + currentUser.mssv + "&_=" + new Date().getTime(),
        method: "GET",
        dataType: "json",
        cache: false,
        success: function(data) {
            globalDeadlineData = data.map(r => ({
                title: r[1], duration: r[2], tag: r[3], icon: r[4], emoji: r[5],
                dateStart: r[6] || "", dateEnd: r[7] || "", 
                sheetRowIndex: r[8]
            }));

            // >>> CHÈN THÊM DÒNG NÀY: Cập nhật ngay thẻ xinh xinh vào giao diện khi tải xong
            renderDeadlinesOnNoticePage();
        }
    });
}
function renderDeadlinesOnNoticePage() {
    if (typeof globalDeadlineData === 'undefined' || globalDeadlineData.length === 0) return;

    let completedList = [];
    if (currentUser && currentUser.mssv) {
        completedList = JSON.parse(localStorage.getItem('completed_deadlines_' + currentUser.mssv)) || [];
    }

    let nowTime = new Date().setHours(0, 0, 0, 0);
    const getTimeFast = (dateStr) => { 
        if (!dateStr || dateStr.trim() === "") return null; 
        let parts = dateStr.split('/'); 
        if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]).getTime(); 
        return null; 
    };

    let deadlineHtml = '';

    globalDeadlineData.forEach(d => {
        // 1. Nếu đã hoàn thành -> Bỏ qua
        let isDone = completedList.includes(String(d.sheetRowIndex));
        if (isDone) return; 

        // 2. Kiểm tra sự kiện đang diễn ra hôm nay
        let startT = getTimeFast(d.dateStart) || 0;
        let endT = getTimeFast(d.dateEnd) || startT;
        let isHappeningNow = (nowTime >= startT && nowTime <= endT);

        if (isHappeningNow) {
            let urlRegex = /(https?:\/\/[^\s]+)/g;
            let cleanTitle = d.title ? d.title.replace(urlRegex, '').trim() : 'Nhiệm vụ';
            let emoji = d.emoji || '📌';

            // Khung Deadline nhỏ xinh
            deadlineHtml += `
            <div class="mini-dl-capsule mb-2" onclick="jumpToTKBFromNotice('${d.dateStart}')" title="Nhấn để xem Lịch học tuần này">
                <div class="d-flex align-items-center justify-content-between gap-2 px-3 py-2">
                    <div class="d-flex align-items-center gap-2 overflow-hidden">
                        <span class="mini-dl-emoji">${emoji}</span>
                        <div class="text-truncate">
                            <span class="fw-bold mini-dl-title">${cleanTitle}</span>
                            <small class="mini-dl-time ms-2"><i class="fa-regular fa-clock me-1"></i>${d.duration || d.dateStart}</small>
                        </div>
                    </div>
                    
                    <button class="btn btn-sm btn-mini-done flex-shrink-0" onclick="quickMarkDone('${d.sheetRowIndex}', event)" title="Đánh dấu đã hoàn thành">
                        <i class="fa-solid fa-check me-1"></i>Xong
                    </button>
                </div>
            </div>`;
        }
    });

    if (deadlineHtml !== '') {
        // Xóa các capsule cũ (nếu có) để tránh bị lặp lại khi render lại
        $('#tbItemsHeThong .mini-dl-capsule').remove();
        
        // Dùng .prepend() để chèn Deadline LÊN ĐẦU, giữ nguyên Thông báo hệ thống bên dưới!
        $('#tbItemsHeThong').removeClass('d-none').prepend(deadlineHtml);
    }
}

// HÀM CHUYỂN SANG TAB LỊCH HỌC VÀ TỰ DẪN TỚI TUẦN ĐÓ
function jumpToTKBFromNotice(dateStartStr) {
    // 1. Chuyển giao diện sang tab Lịch học
    loadTKBView();

    // 2. Tính toán để nhảy tới tuần chứa Deadline đó
    if (dateStartStr) {
        let targetDate = parseDateString(dateStartStr);
        if (targetDate && typeof globalConfigHK !== 'undefined') {
            let targetTime = targetDate.getTime();
            let foundWeekTime = null;

            // Tìm tuần phù hợp trong cấu hình Học kỳ
            for (let conf of globalConfigHK) {
                let sDate = parseDateString(conf[2]); 
                let numWeeks = parseInt(conf[3]); 
                let breakWeeks = (conf[4] || "").split(',').map(w => parseInt(w.trim())).filter(w => !isNaN(w));
                
                if (sDate && numWeeks) {
                    let startMon = getMondayOfDate(sDate);
                    let acadWk = 1, calWk = 1;
                    while (acadWk <= numWeeks && calWk <= 52) {
                        let m = new Date(startMon); m.setDate(m.getDate() + ((calWk - 1) * 7));
                        let nextM = new Date(m); nextM.setDate(nextM.getDate() + 7);
                        
                        if (targetTime >= m.getTime() && targetTime < nextM.getTime()) {
                            $('#namHocSelect').val(conf[0]); 
                            onNamHocChange(); 
                            $('#hocKySelect').val(conf[1]); 
                            onHocKyChange(); 
                            $('#weekSelect').val(m.getTime().toString()); 
                            onWeekChange();
                            foundWeekTime = true;
                            break;
                        }
                        if (!breakWeeks.includes(calWk)) acadWk++;
                        calWk++;
                    }
                    if (foundWeekTime) break;
                }
            }
        }
    }
}

// HÀM ĐÁNH DẤU XONG NHANH NGAY TẠI TRANG THÔNG BÁO
function quickMarkDone(sheetRowIndex, event) {
    event.stopPropagation();
    
    // 1. Lưu trạng thái hoàn thành vào hệ thống
    toggleDeadlineComplete(sheetRowIndex, event);
    
    // 2. Tìm đúng thẻ capsule chứa nút bấm này và làm hiệu ứng ẩn liền lập tức
    let capsule = $(event.target).closest('.mini-dl-capsule');
    if (capsule.length) {
        capsule.fadeOut(300, function() {
            $(this).remove(); // Xóa khỏi DOM sau khi ẩn
            
            // Nếu không còn deadline nào thì ẩn luôn khung chứa hệ thống (nếu trống)
            if ($('#tbItemsHeThong .mini-dl-capsule').length === 0 && $('#tbItemsHeThong').children(':visible').length === 0) {
                $('#tbItemsHeThong').addClass('d-none');
            }
        });
    } else {
        renderDeadlinesOnNoticePage();
    }
}
// Ghi đè hàm tải dữ liệu Link
function loadWebLinks() { 
    $('#webLinksContainer').html(`
        <div class="col-12 w-100">
            <div class="pulse-loader py-5">
                <div class="spinner-modern"></div>
                <span class="text-muted fw-bold" style="font-size: 15px;">Đang tải danh sách liên kết...</span>
            </div>
        </div>
    `);
    $('#personalLinksContainer').html('');
    $('#titleGlobalLinks, #titlePersonalLinks').hide();

    let mssvParam = currentUser ? currentUser.mssv : "";
    if (currentUser) {
        $('#btnAddPersonalLink').removeClass('d-none'); // Bật nút "Thêm Link Của Tôi" nếu đã đăng nhập
    } else {
        $('#btnAddPersonalLink').addClass('d-none');
    }

    $.ajax({ 
        url: SCRIPT_URL + "?action=getWebLinks&mssv=" + encodeURIComponent(mssvParam), 
        method: "GET", 
        dataType: "json", 
        success: function(data) { 
            renderWebLinks(data); 
        },
        error: function() {
            $('#webLinksContainer').html('<div class="col-12 text-center text-danger py-5"><i class="fa-solid fa-triangle-exclamation fs-2 mb-3"></i><br><span class="fw-bold">Lỗi kết nối máy chủ!</span></div>');
        }
    }); 
}

window.personalLinksCache = [];

// 1. CẬP NHẬT HÀM RENDER LINK (Lưu data vào Cache để gọi an toàn)
function renderWebLinks(data) { 
    let globalData = data?.global || (Array.isArray(data) ? data : []);
    let personalData = data?.personal || [];

    // Lưu vào bộ nhớ tạm
    window.personalLinksCache = personalData;

    let isSystemAdmin = currentUser && (String(currentUser.mssv).trim() === "51.01.108.008" || String(currentUser.mssv).trim() === "5101108008");

    if (!globalData.length && !personalData.length && !isSystemAdmin) { 
        $('#webLinksContainer').html('<div class="col-12 text-center text-muted py-5"><i class="fa-solid fa-link-slash fs-1 mb-3"></i><br>Chưa có đường link nào.</div>'); 
        return; 
    } 

    $('#titleGlobalLinks').show();
    let globalHtml = ''; 

    // Admin Card Special
    if (isSystemAdmin) {
        globalHtml += `
        <div class="col mb-3">
            <a href="https://docs.google.com/spreadsheets/d/13bQ6y0fn8n9Ah4OKQeQ9xOVJxXXnXRLjaIxTQPx-eGo/edit?usp=sharing" target="_blank" class="link-card-modern" style="border-bottom: 4px solid #0f4c81; background: #f8fafc;">
                <div class="link-card-badge bg-danger shadow-sm">ADMIN ONLY</div>
                <div class="icon-box"><i class="fa-solid fa-database" style="color: #0f4c81;"></i></div>
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

    // Link Hệ Thống
    if (globalData && globalData.length > 0) {
        globalData.forEach(row => { 
            let title = row.title || row[0] || 'Liên kết';
            let desc = row.desc || row[1] || '';
            let url = row.url || row[2] || '#';
            let iconClass = row.icon || row[3] || 'fa-solid fa-link';
            let descHtml = desc ? `<p class="card-desc">${desc}</p>` : '';

            globalHtml += `
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
    $('#webLinksContainer').html(globalHtml); 

    // Link Cá Nhân (Đã đồng bộ màu viền, icon và chữ sang #0f4c81)
    if (currentUser) {
        $('#titlePersonalLinks').show();
        let personalHtml = '';
        
        if (personalData && personalData.length > 0) {
            personalData.forEach((row, index) => {
                let title = row.title || 'Liên kết';
                let desc = row.desc || '';
                let descHtml = desc ? `<p class="card-desc">${desc}</p>` : '';
                let url = row.url || '#'; 
                let iconClass = row.icon || 'fa-solid fa-link';

                personalHtml += `
                <div class="col mb-3 position-relative"> 
                    <div class="position-absolute d-flex gap-1" style="top: 8px; right: 12px; z-index: 20;">
                        <button type="button" class="btn btn-sm btn-warning text-white shadow-sm" style="border-radius: 50%; width: 28px; height: 28px; padding: 0;" onclick="openEditPersonalLinkByIndex(${index}, event)" title="Chỉnh sửa liên kết">
                            <i class="fa-solid fa-pen" style="font-size: 11px;"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-danger shadow-sm" style="border-radius: 50%; width: 28px; height: 28px; padding: 0;" onclick="deletePersonalLink('${row.rowIndex}', event)" title="Xóa liên kết này">
                            <i class="fa-solid fa-trash" style="font-size: 11px;"></i>
                        </button>
                    </div>
                    
                    <a href="${url}" target="_blank" class="link-card-modern" style="border-bottom: 4px solid #0f4c81;">
                        <div class="icon-box"><i class="${iconClass}" style="color: #0f4c81;"></i></div>
                        <div class="card-text-wrapper">
                            <h5 style="color: #0f4c81;">${title}</h5>
                            ${descHtml} 
                        </div>
                    </a>
                </div>`;
            });
        } else {
            personalHtml = `<div class="col-12 text-center text-muted small py-3 w-100"><i class="fa-solid fa-inbox me-2"></i>Bạn chưa thêm liên kết cá nhân nào.</div>`;
        }
        $('#personalLinksContainer').html(personalHtml);
    } else {
        $('#titlePersonalLinks').hide();
        $('#personalLinksContainer').html('');
    }
}
// 2. HÀM MỞ MODAL SỬA VÀ ĐỔ DỮ LIỆU CŨ VÀO FORM
function openEditPersonalLink(rowIndex, title, desc, url, icon) {
    $('#editPWebLinkRowIndex').val(rowIndex);
    $('#editPWebLinkTitle').val(title);
    $('#editPWebLinkDesc').val(desc);
    $('#editPWebLinkUrl').val(url);
    $('#editPWebLinkIcon').val(icon || 'fa-solid fa-link');
    
    $('#editWebLinkModal').modal('show');
}

// 3. HÀM LƯU DỮ LIỆU SỬA VỀ GOOGLE APPS SCRIPT
function saveEditPersonalWebLink() {
    if (!currentUser) return;

    let rowIndex = $('#editPWebLinkRowIndex').val();
    let title = $('#editPWebLinkTitle').val().trim();
    let url = $('#editPWebLinkUrl').val().trim();
    let desc = $('#editPWebLinkDesc').val().trim();
    let icon = $('#editPWebLinkIcon').val() || 'fa-solid fa-link';

    if (!title || !url) {
        alert("Vui lòng nhập đầy đủ Tên liên kết và Đường dẫn URL!");
        return;
    }

    if (!url.match(/^https?:\/\//i)) {
        url = 'https://' + url;
    }

    let btn = $('#btnSaveEditWebLink');
    let originalHtml = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang lưu...').prop('disabled', true);

    postToGAS({
        action: "editPersonalWebLink",
        rowIndex: rowIndex,
        mssv: currentUser.mssv,
        title: title,
        desc: desc,
        url: url,
        icon: icon
    }, function(res) {
        alert(res);
        $('#editWebLinkModal').modal('hide');
        btn.html(originalHtml).prop('disabled', false);
        loadWebLinks(); // Tải lại giao diện ngay
    }, function() {
        alert("Lỗi kết nối máy chủ! Không thể cập nhật liên kết.");
        btn.html(originalHtml).prop('disabled', false);
    });
}
// 3. MỞ MODAL THÊM LINK
window.openAddWebLinkModal = function() {
    $('#pWebLinkTitle, #pWebLinkUrl, #pWebLinkDesc').val('');
    if ($('#pWebLinkIcon').length) $('#pWebLinkIcon').val('fa-solid fa-link');
    $('#addWebLinkModal').modal('show');
};

// 4. LƯU LINK THÊM MỚI
window.savePersonalWebLink = function() {
    if (!currentUser) { alert("Vui lòng đăng nhập!"); return; }

    let title = $('#pWebLinkTitle').val().trim();
    let url = $('#pWebLinkUrl').val().trim();
    let desc = $('#pWebLinkDesc').val().trim();
    let icon = $('#pWebLinkIcon').val() || 'fa-solid fa-link';

    if (!title || !url) { alert("Vui lòng nhập Tên và URL!"); return; }
    if (!url.match(/^https?:\/\//i)) url = 'https://' + url;

    let btn = $('#btnSaveWebLink');
    let originalHtml = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang lưu...').prop('disabled', true);

    postToGAS({
        action: "addPersonalWebLink",
        mssv: currentUser.mssv,
        title: title, desc: desc, url: url, icon: icon
    }, function(res) {
        alert(res);
        $('#addWebLinkModal').modal('hide');
        btn.html(originalHtml).prop('disabled', false);
        loadWebLinks();
    }, function() {
        alert("Lỗi máy chủ!");
        btn.html(originalHtml).prop('disabled', false);
    });
};

// 5. MỞ MODAL SỬA LINK
window.openEditPersonalLink = function(rowIndex, title, desc, url, icon, event) {
    if (event) event.stopPropagation(); // Chặn chuyển trang
    $('#editPWebLinkRowIndex').val(rowIndex);
    $('#editPWebLinkTitle').val(title);
    $('#editPWebLinkDesc').val(desc);
    $('#editPWebLinkUrl').val(url);
    $('#editPWebLinkIcon').val(icon || 'fa-solid fa-link');
    
    $('#editWebLinkModal').modal('show');
};

// 6. LƯU THÔNG TIN SỬA LINK
window.saveEditPersonalWebLink = function() {
    if (!currentUser) return;

    let rowIndex = $('#editPWebLinkRowIndex').val();
    let title = $('#editPWebLinkTitle').val().trim();
    let url = $('#editPWebLinkUrl').val().trim();
    let desc = $('#editPWebLinkDesc').val().trim();
    let icon = $('#editPWebLinkIcon').val() || 'fa-solid fa-link';

    if (!title || !url) { alert("Vui lòng nhập Tên và URL!"); return; }
    if (!url.match(/^https?:\/\//i)) url = 'https://' + url;

    let btn = $('#btnSaveEditWebLink');
    let originalHtml = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang lưu...').prop('disabled', true);

    postToGAS({
        action: "editPersonalWebLink",
        rowIndex: rowIndex,
        mssv: currentUser.mssv,
        title: title, desc: desc, url: url, icon: icon
    }, function(res) {
        alert(res);
        $('#editWebLinkModal').modal('hide');
        btn.html(originalHtml).prop('disabled', false);
        loadWebLinks();
    }, function() {
        alert("Lỗi kết nối máy chủ!");
        btn.html(originalHtml).prop('disabled', false);
    });
};

// 7. XÓA LINK CÁ NHÂN
window.deletePersonalLink = function(rowIndex, event) {
    if (event) event.stopPropagation(); // Chặn chuyển trang
    if (!currentUser) return;
    if (!confirm("Bạn có chắc chắn muốn xóa liên kết này?")) return;
    
    postToGAS({
        action: "deletePersonalWebLink",
        rowIndex: rowIndex,
        mssv: currentUser.mssv
    }, function(res) {
        alert(res);
        loadWebLinks();
    }, function() {
        alert("Lỗi kết nối khi gửi yêu cầu xóa!");
    });
};
window.openEditPersonalLinkByIndex = function(index, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    let item = window.personalLinksCache[index];
    if (!item) return;

    $('#editPWebLinkRowIndex').val(item.rowIndex);
    $('#editPWebLinkTitle').val(item.title || '');
    $('#editPWebLinkDesc').val(item.desc || '');
    $('#editPWebLinkUrl').val(item.url || '');
    $('#editPWebLinkIcon').val(item.icon || 'fa-solid fa-link');
    
    $('#editWebLinkModal').modal('show');
};
// --- CHIẾN DỊCH TẢI NGẦM TOÀN BỘ DANH MỤC (PRE-FETCHING) ---
$(document).ready(function() {
    window.boNhoDemHocPhan = {};

    // 1. CHẶN KẾT NỐI MẠNG: Ép web dùng dữ liệu tải sẵn nếu có
    const originalAjax = $.ajax;
    $.ajax = function(settings) {
        if (settings.url && settings.url.includes("action=getHocPhanData")) {
            let match = settings.url.match(/sheetName=([^&]+)/);
            let sheet = match ? decodeURIComponent(match[1]) : null;
            
            // Nếu sinh viên click và dữ liệu đã có sẵn trong kho -> Hiện ngay lập tức
            if (sheet && window.boNhoDemHocPhan[sheet] && typeof isAdmin !== 'undefined' && !isAdmin) {
                // Nhả dữ liệu ra lập tức với độ trễ 10ms để giao diện không bị giật
                setTimeout(() => { if (settings.success) settings.success(window.boNhoDemHocPhan[sheet]); }, 10);
                return; // Cắt đứt kết nối mạng, không chờ Google nữa
            }
            
            // Lần đầu tải (chưa có sẵn) -> Lưu lại vào kho sau khi tải xong
            let oldSuccess = settings.success;
            settings.success = function(data) {
                if (sheet) window.boNhoDemHocPhan[sheet] = data;
                if (oldSuccess) oldSuccess(data);
            };
        }
        return originalAjax.apply(this, arguments);
    };

    // 2. TỰ ĐỘNG KÉO NGẦM TẤT CẢ DỮ LIỆU VỀ MÁY
    function batDauTaiNgam() {
        // Chỉ chạy cho Sinh viên (Admin luôn cần dữ liệu thực tế) và danh mục đã load xong
        if (typeof globalCategories !== 'undefined' && globalCategories.length > 0 && typeof isAdmin !== 'undefined' && !isAdmin) {
            globalCategories.forEach((sheetName, index) => {
                let lower = sheetName.toLowerCase();
                // Bỏ qua các sheet không phải môn học
                if (lower === 'thông báo' || lower === 'users' || lower === 'cauhinhhocky' || lower === 'mastertkb') return;

                // Xếp hàng tải ngầm từng môn, cách nhau 0.8 giây để không làm quá tải máy chủ Google
                setTimeout(() => {
                    if (!window.boNhoDemHocPhan[sheetName]) {
                        originalAjax({
                            url: SCRIPT_URL + "?action=getHocPhanData&sheetName=" + encodeURIComponent(sheetName),
                            method: "GET",
                            dataType: "json",
                            success: function(data) {
                                window.boNhoDemHocPhan[sheetName] = data; // Tải xong giấu vào kho
                            }
                        });
                    }
                }, index * 800); 
            });
        } else {
            // Nếu danh sách môn chưa tải xong, đợi 2 giây rồi thử lại
            setTimeout(batDauTaiNgam, 2000);
        }
    }

    // Khởi động chiến dịch tải ngầm sau khi trang hiện lên 3 giây (để máy tập trung load mượt giao diện chính trước)
    setTimeout(batDauTaiNgam, 3000);
});
function loadProfileView() {
    document.title = "Hồ sơ cá nhân | Học nhóm APMA Khoa Toán";
    resetNavActive(); 
    $('#profileSection').removeClass('d-none');
    
    updateSystemUrl('view', 'profile'); // Đổi URL thành ?view=profile
    
    // Đóng Menu Popover/Dropdown
    let dropdownMenu = document.querySelector('#sidebarUserInfo .dropdown-menu');
    if (dropdownMenu) dropdownMenu.classList.remove('show');
    
    // Đóng Sidebar trên điện thoại
    if (window.innerWidth < 992) { 
        if (typeof sidebar !== 'undefined') sidebar.classList.remove('show'); 
        if (typeof overlay !== 'undefined') overlay.classList.remove('show'); 
    }
}
// Hàm hiển thị Avatar ở Sidebar & Trang Hồ Sơ
function updateAvatarDisplay(avatarUrl) {
    if (avatarUrl && avatarUrl.trim() !== '') {
        let cleanUrl = avatarUrl.trim();
        
        // Tự động xử lý đường dẫn Google Drive thành Thumbnail
        if (cleanUrl.includes("drive.google.com/file/d/")) {
            let matchId = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (matchId && matchId[1]) {
                cleanUrl = `https://drive.google.com/thumbnail?id=${matchId[1]}&sz=w400`;
            }
        }
	// 2. Xử lý link Google Photos thô (lh3.googleusercontent.com)
        else if (cleanUrl.includes("googleusercontent.com")) {
            cleanUrl = cleanUrl.replace(/=w\d+|-h\d+|-p|-no|-k/g, '').replace(/=s\d+/g, '');
            cleanUrl = cleanUrl + "=w400-h400-p";
        }

        // 3. TỰ ĐỘNG BẮT LINK CHIA SẺ GOOGLE PHOTOS (photos.google.com / photos.app.goo.gl)
        else if (cleanUrl.includes("photos.google.com") || cleanUrl.includes("photos.app.goo.gl")) {
            // Dùng Image Proxy wsrv.nl để bóc tách lấy ảnh thô trực tiếp từ trang chia sẻ
            cleanUrl = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&w=400&h=400&fit=cover`;
        }
        // Cập nhật Sidebar
        $('#sidebarAvatarIcon').addClass('d-none');
        $('#sidebarAvatarImg').attr('src', cleanUrl).removeClass('d-none');

        // Cập nhật Profile Page
        $('#profileAvatarIcon').addClass('d-none');
        $('#profileAvatarImg').attr('src', cleanUrl).removeClass('d-none');
    } else {
        // Nếu chưa có ảnh, trả về Icon mặc định
        $('#sidebarAvatarIcon').removeClass('d-none');
        $('#sidebarAvatarImg').addClass('d-none');

        $('#profileAvatarIcon').removeClass('d-none');
        $('#profileAvatarImg').addClass('d-none');
    }
}

// Mở Modal đổi Avatar
function openChangeAvatarModal() {
    $('#txtAvatarUrl').val(currentUser ? (currentUser.avatar || '') : '');
    $('#changeAvatarModal').modal('show');
}

// Lưu Avatar về Google Apps Script & LocalStorage
function saveAvatar() {
    if (!currentUser) return;
    
    let fileInput = document.getElementById('fileAvatarInput');
    let file = fileInput ? fileInput.files[0] : null;
    let urlInput = $('#txtAvatarUrl').val().trim();
    let btn = $('#btnSaveAvatar');
    let originalHtml = btn.html();

    if (file) {
        btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang nén & tải ảnh...').prop('disabled', true);

        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(e) {
            let img = new Image();
            img.src = e.target.result;
            
            img.onload = function() {
                // Tạo Canvas nén độ phân giải ảnh về tối đa 600x600px
                let canvas = document.createElement("canvas");
                let MAX_SIZE = 600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                let ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                // Nén chất lượng ảnh xuống 70%
                let compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
                let rawBase64 = compressedDataUrl.split(',')[1];
                
                postToGAS({
                    action: "uploadAvatarFile",
                    mssv: currentUser.mssv,
                    base64Data: rawBase64,
                    mimeType: "image/jpeg",
                    fileName: "avatar_" + currentUser.mssv + ".jpg"
                }, function(res) {
                    let response = typeof res === 'string' ? JSON.parse(res) : res;
                    if (response.success) {
                        alert("Đã cập nhật ảnh đại diện thành công!");
                        currentUser.avatar = response.avatarUrl;
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                        
                        updateAvatarDisplay(response.avatarUrl);
                        $('#changeAvatarModal').modal('hide');
                        $('#fileAvatarInput').val(''); 
                    } else {
                        alert("Lỗi từ máy chủ: " + response.message);
                    }
                    btn.html(originalHtml).prop('disabled', false);
                }, function() {
                    alert("Lỗi kết nối máy chủ khi upload ảnh!");
                    btn.html(originalHtml).prop('disabled', false);
                });
            };
        };
    } else if (urlInput !== "") {
        btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang lưu...').prop('disabled', true);

        postToGAS({
            action: "updateUserProfile",
            mssv: currentUser.mssv,
            chuyenNganh: $('#profChuyenNganh').val() || currentUser.chuyenNganh || '',
            khoa: $('#profKhoa').val() || currentUser.khoa || '',
            khoaHoc: $('#profKhoaHoc').val() || currentUser.khoaHoc || '',
            nhom: $('#profNhom').val() || currentUser.nhom || '',
            avatar: urlInput
        }, function(res) {
            alert("Đã cập nhật ảnh đại diện!");
            currentUser.avatar = urlInput;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateAvatarDisplay(urlInput);
            $('#changeAvatarModal').modal('hide');
            btn.html(originalHtml).prop('disabled', false);
        }, function() {
            alert("Lỗi kết nối máy chủ!");
            btn.html(originalHtml).prop('disabled', false);
        });
    } else {
        alert("Vui lòng chọn 1 tệp ảnh từ máy HOẶC dán đường dẫn URL!");
    }
}
// Hàm làm mới dữ liệu cho Thông báo và các Danh mục học phần
function refreshCurrentCourseData() {
    if (!currentSheetName) {
        currentSheetName = 'Thông báo';
    }
    
    // Xóa cache cục bộ của sheet hiện tại (nếu có) để bắt buộc gọi dữ liệu mới từ Apps Script
    if (window.boNhoDemHocPhan && window.boNhoDemHocPhan[currentSheetName]) {
        delete window.boNhoDemHocPhan[currentSheetName];
    }
    
    // Gọi tải lại dữ liệu học phần/thông báo hiện tại
    loadDataByHocPhan(currentSheetName);
}
// 1. CƠ SỞ DỮ LIỆU CÁC MÔN HỌC MẪU (ĐÃ PHÂN CHIA NĂM HỌC VÀ HỌC KỲ)
const SYSTEM_COURSE_DATABASE = [
    { code: 'APMA1801', name: 'Đại số tuyến tính', credits: 2, type: 'cn_bb', namHoc: '2025-2026', hocKy: 'Học kì 1' },
    { code: 'APMA1804', name: 'Giải tích hàm một biến', credits: 3, type: 'cn_bb', namHoc: '2025-2026', hocKy: 'Học kì 1' },
    { code: 'APMA1806', name: 'Giải tích vector', credits: 2, type: 'cn_bb', namHoc: '2025-2026', hocKy: 'Học kì 1' },
    { code: 'COMP1010', name: 'Lập trình cơ bản', credits: 3, type: 'cn_bb', namHoc: '2025-2026', hocKy: 'Học kì 1' },
    { code: 'POLI1903', name: 'Pháp luật đại cương', credits: 2, type: 'mc_bb', namHoc: '2025-2026', hocKy: 'Học kì 1' },
    { code: 'POLI2001', name: 'Triết học Mác – Lênin', credits: 3, type: 'mc_bb', namHoc: '2025-2026', hocKy: 'Học kì 1' },
    { code: 'PSYC1001', name: 'Tâm lý học đại cương', credits: 2, type: 'mc_bb', namHoc: '2025-2026', hocKy: 'Học kì 1' },
    { code: 'PHYL2401', name: 'Giáo dục thể chất 1 (Thể dục - Điền kinh)', credits: 1, type: 'gdtc_bb', namHoc: '2025-2026', hocKy: 'Học kì 1' },
    { code: 'APMA1802', name: 'Không gian tuyến tính', credits: 2, type: 'cn_bb', namHoc: '2025-2026', hocKy: 'Học kì 2' },
    { code: 'APMA1805', name: '	Giải tích hàm nhiều biến', credits: 3, type: 'cn_bb', namHoc: '2025-2026', hocKy: 'Học kì 2' },
    { code: 'APMA1807', name: 'Hình học cao cấp hai chiều và ba chiều', credits: 2, type: 'cn_bb', namHoc: '2025-2026', hocKy: 'Học kì 2' },
    { code: 'COMP1013', name: 'Lập trình nâng cao', credits: 3, type: 'cn_bb', namHoc: '2025-2026', hocKy: 'Học kì 2' },
    { code: 'POLI2002', name: '	Kinh tế chính trị học Mác - Lênin', credits: 2, type: 'mc_bb', namHoc: '2025-2026', hocKy: 'Học kì 2' },
    { code: 'POLI2003', name: 'Chủ nghĩa xã hội khoa học', credits: 2, type: 'mc_bb', namHoc: '2025-2026', hocKy: 'Học kì 2' },
    { code: 'EDUC2801', name: 'Phương pháp học tập hiệu quả', credits: 2, type: 'mc_tc', namHoc: '2025-2026', hocKy: 'Học kì 2' },
    { code: 'PSYC1493', name: 'Kỹ năng thích ứng và giải quyết vấn đề', credits: 2, type: 'mc_tc', namHoc: '2025-2026', hocKy: 'Học kì 2' },
    { code: 'PHYL2402', name: 'Giáo dục Thể chất 2 - Bóng chuyền cơ bản', credits: 1, type: 'gdtc_tc', namHoc: '2025-2026', hocKy: 'Học kì 2', groupNote: 'Giáo dục Thể chất 2' },
    { code: 'PHYL2403', name: 'Giáo dục Thể chất 2 - Cầu lông cơ bản', credits: 1, type: 'gdtc_tc', namHoc: '2025-2026', hocKy: 'Học kì 2', groupNote: 'Giáo dục Thể chất 2' },
    { code: 'PHYL2404', name: 'Giáo dục Thể chất 2 - Đá cầu cơ bản', credits: 1, type: 'gdtc_tc', namHoc: '2025-2026', hocKy: 'Học kì 2', groupNote: 'Giáo dục Thể chất 2' },
    { code: 'PHYL2405', name: 'Giáo dục Thể chất 2 - Aerobic cơ bản', credits: 1, type: 'gdtc_tc', namHoc: '2025-2026', hocKy: 'Học kì 2', groupNote: 'Giáo dục Thể chất 2' },
    { code: 'PHYL2406', name: 'Giáo dục Thể chất 2 - Bơi lội cơ bản', credits: 1, type: 'gdtc_tc', namHoc: '2025-2026', hocKy: 'Học kì 2', groupNote: 'Giáo dục Thể chất 2' },
    { code: 'PHYL2407', name: 'Giáo dục Thể chất 2 - Bóng rổ cơ bản', credits: 1, type: 'gdtc_tc', namHoc: '2025-2026', hocKy: 'Học kì 2', groupNote: 'Giáo dục Thể chất 2' },
    { code: 'PHYL2408', name: 'Giáo dục Thể chất 2 - Bóng đá cơ bản', credits: 1, type: 'gdtc_tc', namHoc: '2025-2026', hocKy: 'Học kì 2', groupNote: 'Giáo dục Thể chất 2' },
    { code: 'PHYL2409', name: 'Giáo dục Thể chất 2 - Teakwondo cơ bản', credits: 1, type: 'gdtc_tc', namHoc: '2025-2026', hocKy: 'Học kì 2', groupNote: 'Giáo dục Thể chất 2' },
    { code: 'PHYL2410', name: 'Giáo dục Thể chất 2 - Khiêu vũ thể thao cơ bản', credits: 1, type: 'gdtc_tc', namHoc: '2025-2026', hocKy: 'Học kì 2', groupNote: 'Giáo dục Thể chất 2' },
    { code: 'APMA1803', name: 'Cấu trúc đại số và ứng dụng', credits: 2, type: 'cn_bb', namHoc: '2026-2027', hocKy: 'Học kì 1' },
    { code: 'COMP1016', name: 'Cấu trúc dữ liệu', credits: 3, type: 'cn_bb', namHoc: '2026-2027', hocKy: 'Học kì 1' },
    { code: 'COMP1017', name: 'Lập trình hướng đối tượng', credits: 3, type: 'cn_bb', namHoc: '2026-2027', hocKy: 'Học kì 1' },
    { code: 'MATH1417', name: 'Hình học vi phân', credits: 3, type: 'cn_bb', namHoc: '2026-2027', hocKy: 'Học kì 1' },
    { code: 'POLI2005', name: 'Tư tưởng Hồ Chí Minh', credits: 2, type: 'mc_bb', namHoc: '2026-2027', hocKy: 'Học kì 1' },
    { code: 'PSYC2801', name: 'Kỹ năng làm việc nhóm và tư duy sáng tạo', credits: 2, type: 'mc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1' },
    { code: 'EDUC1410', name: 'Giáo dục vì sự phát triển bền vững', credits: 2, type: 'mc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1' },
    { code: 'DOMS2801', name: 'Kỹ thuật chế biến món ăn đãi tiệc', credits: 2, type: 'mc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục đời sống' },
    { code: 'DOMS2802', name: 'Kỹ thuật làm bánh Âu', credits: 2, type: 'mc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục đời sống' },
    { code: 'DOMS2803', name: 'Kỹ thuật làm hoa giấy nhún', credits: 2, type: 'mc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục đời sống' },
    { code: 'DOMS2804', name: 'Kỹ thuật làm hoa giấy nhún 2', credits: 2, type: 'mc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục đời sống' },
    { code: 'DOMS2805', name: 'Kỹ thuật cắt may trang phục nữ thường ngày', credits: 2, type: 'mc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục đời sống' },
    { code: 'DOMS2806', name: 'Kỹ thuật cắt may đầm nữ căn bản', credits: 2, type: 'mc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục đời sống' },
    { code: 'DOMS2807', name: 'Kỹ thuật trang điểm ứng dụng', credits: 2, type: 'mc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục đời sống' },
    { code: 'DOMS2808', name: 'Kỹ thuật cắt tỉa rau củ trang trí món ăn', credits: 2, type: 'mc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục đời sống' },
    { code: 'DOMS2809', name: 'Kỹ thuật làm hoa từ vải voan', credits: 2, type: 'mc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục đời sống' },
    { code: 'DOMS2810', name: 'Kỹ thuật pha chế thức uống không cồn', credits: 2, type: 'mc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục đời sống' },
    { code: 'PHYL2411', name: 'Giáo dục Thể chất 3 - Bóng chuyền nâng cao', credits: 1, type: 'gdtc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục Thể chất 3' },
    { code: 'PHYL2412', name: 'Giáo dục Thể chất 3 - Cầu lông nâng cao', credits: 1, type: 'gdtc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục Thể chất 3' },
    { code: 'PHYL2413', name: 'Giáo dục Thể chất 3 - Aerobic nâng cao', credits: 1, type: 'gdtc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục Thể chất 3' },
    { code: 'PHYL2414', name: 'Giáo dục Thể chất 3 - Bóng rổ nâng cao', credits: 1, type: 'gdtc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục Thể chất 3' },
    { code: 'PHYL2415', name: 'Giáo dục Thể chất 3 - Bơi lội nâng cao', credits: 1, type: 'gdtc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục Thể chất 3' },
    { code: 'PHYL2416', name: 'Giáo dục Thể chất 3 - Đá cầu nâng cao', credits: 1, type: 'gdtc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục Thể chất 3' },
    { code: 'PHYL2417', name: 'Giáo dục Thể chất 3 - Bóng đá nâng cao', credits: 1, type: 'gdtc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục Thể chất 3' },
    { code: 'PHYL2418', name: 'Giáo dục Thể chất 3 - Teakwondo nâng cao', credits: 1, type: 'gdtc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục Thể chất 3' },
    { code: 'PHYL2419', name: 'Giáo dục Thể chất 3 - Khiêu vũ thể thao nâng cao', credits: 1, type: 'gdtc_tc', namHoc: '2026-2027', hocKy: 'Học kì 1', groupNote: 'Giáo dục Thể chất 3' },
    { code: 'APMA1817', name: 'Toán rời rạc', credits: 2, type: 'cn_bb', namHoc: '2026-2027', hocKy: 'Học kì 2' },
    { code: 'COMP1314', name: 'Trí tuệ nhân tạo', credits: 3, type: 'cn_bb', namHoc: '2026-2027', hocKy: 'Học kì 2' },
    { code: 'COMP1804', name: 'Lập trình Python', credits: 3, type: 'cn_bb', namHoc: '2026-2027', hocKy: 'Học kì 2' },
    { code: 'MATH1413', name: 'Độ đo và tích phân', credits: 3, type: 'cn_bb', namHoc: '2026-2027', hocKy: 'Học kì 2' },
    { code: 'MATH1817', name: 'Phương trình vi phân và đạo hàm riêng', credits: 3, type: 'cn_bb', namHoc: '2026-2027', hocKy: 'Học kì 2' },
    { code: 'POLI2004', name: 'Lịch sử Đảng cộng sản Việt Nam', credits: 3, type: 'mc_bb', namHoc: '2026-2027', hocKy: 'Học kì 2' },
    { code: 'MILI2701', name: 'Đường lối quốc phòng và an ninh của Đảng Cộng sản Việt Nam', credits: 3, type: 'ngoai_le', namHoc: '2026-2027', hocKy: 'Học kì 2' },
    { code: 'MILI2702', name: 'Công tác quốc phòng và an ninh', credits: 2, type: 'ngoai_le', namHoc: '2026-2027', hocKy: 'Học kì 2' },
    { code: 'MILI2703', name: 'Quân sự chung', credits: 2, type: 'ngoai_le', namHoc: '2026-2027', hocKy: 'Học kì 2' },
    { code: 'MILI2704', name: 'Kỹ thuật chiến đấu bộ binh và chiến thuật', credits: 4, type: 'ngoai_le', namHoc: '2026-2027', hocKy: 'Học kì 2' },
    { code: 'APMA1818', name: 'Lý thuyết đồ thị', credits: 3, type: 'chuyen_nganh', namHoc: '2027-2028', hocKy: 'Học kì 1' },
    { code: 'COMP1018', name: 'Cơ sở dữ liệu', credits: 3, type: 'chuyen_nganh', namHoc: '2027-2028', hocKy: 'Học kì 1' },
    { code: 'COMP1712', name: 'Học máy', credits: 3, type: 'chuyen_nganh', namHoc: '2027-2028', hocKy: 'Học kì 1' },
    { code: 'MATH1408', name: 'Lý thuyết tối ưu tuyến tính', credits: 3, type: 'chuyen_nganh', namHoc: '2027-2028', hocKy: 'Học kì 1' },
    { code: 'MATH1703', name: 'Xác suất thống kê', credits: 2, type: 'chuyen_nganh', namHoc: '2027-2028', hocKy: 'Học kì 1' },
    { code: 'MATH1816', name: 'Giải tích hàm', credits: 2, type: 'chuyen_nganh', namHoc: '2027-2028', hocKy: 'Học kì 1' },
    { code: 'APMA1810', name: 'Mô hình thống kê', credits: 2, type: 'chuyen_nganh', namHoc: '2027-2028', hocKy: 'Học kì 2' },
    { code: 'APMA1811', name: 'Thực hành nghề nghiệp', credits: 2, type: 'chuyen_nganh', namHoc: '2027-2028', hocKy: 'Học kì 2' },
    { code: 'COMP1015', name: 'Nhập môn mạng máy tính', credits: 3, type: 'chuyen_nganh', namHoc: '2027-2028', hocKy: 'Học kì 2' },
    { code: 'COMP1829', name: 'Quản lý công việc hiệu quả theo Agile', credits: 2, type: 'chuyen_nganh', namHoc: '2027-2028', hocKy: 'Học kì 2' },
    { code: 'MATH1421', name: 'Đại cương về phương pháp tính', credits: 2, type: 'chuyen_nganh', namHoc: '2027-2028', hocKy: 'Học kì 2' },
    { code: 'MATH1804', name: 'Lý thuyết tối ưu phi tuyến', credits: 2, type: 'chuyen_nganh', namHoc: '2027-2028', hocKy: 'Học kì 2' },
    { code: 'PSYC2804', name: 'Phương pháp nghiên cứu khoa học', credits: 2, type: 'chuyen_nganh', namHoc: '2027-2028', hocKy: 'Học kì 2' },
    { code: 'APMA1812', name: 'Thực hành nghề nghiệp 1', credits: 2, type: 'chuyen_nganh', namHoc: '2028-2029', hocKy: 'Học kì 1' },
    { code: 'COMP1313', name: 'Điện toán đám mây', credits: 3, type: 'chuyen_nganh', namHoc: '2028-2029', hocKy: 'Học kì 1' },
    { code: 'MATH1825', name: 'Nhập môn phân tích dữ liệu tôpô', credits: 2, type: 'chuyen_nganh', namHoc: '2028-2029', hocKy: 'Học kì 1' },
    { code: 'PSYC2803', name: '	Khởi nghiệp', credits: 2, type: 'mon_chung', namHoc: '2028-2029', hocKy: 'Học kì 1' },
    { code: 'APMA1808', name: 'Lý thuyết tối ưu đa mục tiêu', credits: 2, type: 'cn_tc', namHoc: '2028-2029', hocKy: 'Học kì 1' },
    { code: 'APMA1809', name: 'Lý thuyết hồi quy và ứng dụng', credits: 2, type: 'cn_tc', namHoc: '2028-2029', hocKy: 'Học kì 1' },
    { code: 'MATH1707', name: 'Xác suất thống kê nâng cao', credits: 2, type: 'cn_tc', namHoc: '2028-2029', hocKy: 'Học kì 1' },
    { code: 'COMP1315', name: 'Khai thác dữ liệu và ứng dụng', credits: 3, type: 'cn_tc', namHoc: '2028-2029', hocKy: 'Học kì 1' },
    { code: 'COMP1504', name: 'Thị giác máy tính và ứng dụng', credits: 3, type: 'cn_tc', namHoc: '2028-2029', hocKy: 'Học kì 1' },
    { code: 'COMP1715', name: 'Xử lý ngôn ngữ tự nhiên', credits: 3, type: 'cn_tc', namHoc: '2028-2029', hocKy: 'Học kì 1' },
    { code: 'APMA1813', name: 'Thực tập nghề nghiệp 2', credits: 6, type: 'chuyen_nganh', namHoc: '2028-2029', hocKy: 'Học kì 2' },
    { code: 'APMA1814', name: 'Khóa luận tốt nghiệp', credits: 6, type: 'cn_tc', namHoc: '2028-2029', hocKy: 'Học kì 2' },
    { code: 'APMA1815', name: 'Hồ sơ tốt nghiệp', credits: 3, type: 'cn_tc', namHoc: '2028-2029', hocKy: 'Học kì 2' },
    { code: 'APMA1816', name: 'Sản phẩm nghiên cứu', credits: 3, type: 'cn_tc', namHoc: '2028-2029', hocKy: 'Học kì 2' },
];

let currentFilteredSysCourses = [];

// 2. XÂY DỰNG BỘ LỌC NĂM HỌC / HỌC KỲ CHO MODAL GPA
function buildGpaSystemFilters() {
    let nHocs = [...new Set(SYSTEM_COURSE_DATABASE.map(item => item.namHoc).filter(Boolean))].sort().reverse();
    let hKys = [...new Set(SYSTEM_COURSE_DATABASE.map(item => item.hocKy).filter(Boolean))].sort();
    
    let nhHtml = '<option value="">-- Tất cả năm học --</option>'; 
    nHocs.forEach(nh => nhHtml += `<option value="${nh}">${nh}</option>`); 
    $('#gpaSysNamHocFilter').html(nhHtml);
    
    let hkHtml = '<option value="">-- Tất cả học kỳ --</option>'; 
    hKys.forEach(hk => hkHtml += `<option value="${hk}">${hk}</option>`); 
    $('#gpaSysHocKyFilter').html(hkHtml);
}

// 3. MỞ MODAL BẢNG TRA CỨU & RESET TRẠNG THÁI CHECKBOX
function openGpaSystemSelectModal() {
    buildGpaSystemFilters();
    $('#txtSearchGpaSysCourse').val('');
    $('#selectGpaSysCategory').val('all');
    $('#gpaSysNamHocFilter').val('');
    $('#gpaSysHocKyFilter').val('');
    $('#cbGpaSysSelectAll').prop('checked', false);
    
    currentFilteredSysCourses = [...SYSTEM_COURSE_DATABASE];
    renderGpaSystemCoursesTable(currentFilteredSysCourses);
    updateGpaSelectedCount();
    $('#gpaSystemSelectModal').modal('show');
}

// RENDER BẢNG MÔN HỌC GOM NHÓM THEO HỌC KỲ VÀ PHÂN LOẠI (BẮT BUỘC/TỰ CHỌN)
// RENDER BẢNG MÔN HỌC GOM NHÓM THEO HỌC KỲ VÀ PHÂN LOẠI (BẮT BUỘC/TỰ CHỌN)
function renderGpaSystemCoursesTable(dataset) {
    let tbody = $('#gpaSystemCoursesTableBody');
    if (!dataset || dataset.length === 0) {
        tbody.html('<tr><td colspan="5" class="text-center text-muted py-5"><i class="fa-solid fa-box-open fs-3 mb-2"></i><br>Không tìm thấy môn học phù hợp với điều kiện lọc!</td></tr>');
        return;
    }

    let groupedData = {};
    dataset.forEach((course) => {
        let groupKey = `${course.namHoc} - ${course.hocKy}`; 
        
        if (!groupedData[groupKey]) {
            groupedData[groupKey] = { bat_buoc: [], tu_chon: [], khac: [] };
        }

        let t = course.type || '';
        if (t.endsWith('_tc') || t === 'tu_chon') {
            groupedData[groupKey].tu_chon.push(course);
        } else if (t.endsWith('_bb') || t === 'bat_buoc' || t === 'chuyen_nganh' || t === 'mon_chung' || t === 'ngoai_le') {
            groupedData[groupKey].bat_buoc.push(course);
        } else {
            groupedData[groupKey].khac.push(course);
        }
    });

    let html = '';
    
    for (let groupKey in groupedData) {
        let safeGroupId = groupKey.replace(/[^a-zA-Z0-9]/g, '_');

        // --- DÒNG CẤP 1: HỌC KỲ ---
        html += `
        <tr style="background-color: #aebfd1; border-bottom: 1px solid #154c79;">
            <td colspan="5" class="py-2 px-3">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <span class="fw-bold text-dark" style="font-size: 15px;">${groupKey}</span>
                    <button type="button" class="btn btn-sm fw-bold px-3 py-1 shadow-sm" style="font-size: 12px; border-radius: 50px; background-color: rgba(255,255,255,0.6); color: #154c79; border: 1px solid #154c79;" onclick="toggleSelectSemesterGroup('${safeGroupId}')">
                        <i class="fa-solid fa-check-double me-1"></i> Chọn tất cả
                    </button>
                </div>
            </td>
        </tr>`;

        // Hàm vẽ từng nhóm Bắt buộc / Tự chọn
        const renderSubGroup = (coursesArr, titleText, bgColor) => {
            if (!coursesArr || coursesArr.length === 0) return; 

            // --- DÒNG CẤP 2: BẮT BUỘC / TỰ CHỌN ---
            html += `
            <tr style="background-color: ${bgColor}; border-bottom: 1px solid #154c79;">
                <td colspan="5" class="py-2 px-3 fw-bold text-dark" style="font-size: 14.5px;">${titleText}</td>
            </tr>`;

            coursesArr.forEach((course) => {
                let typeBadge = '';
                let t = course.type || '';
                
                if (t.startsWith('cn_') || t === 'chuyen_nganh') typeBadge = '<span class="badge bg-primary">Chuyên ngành</span>';
                else if (t.startsWith('mc_') || t === 'mon_chung') typeBadge = '<span class="badge bg-success">Môn chung</span>';
                else if (t.startsWith('gdtc_') || t === 'ngoai_le') typeBadge = '<span class="badge bg-secondary">GDTC & GDQP</span>';
                else typeBadge = '<span class="badge bg-dark">Khác</span>';

                // Kiểm tra xem môn đã được thêm vào GPA hay chưa
                let isAlreadyAdded = myGPADataset.some(c => c.code === course.code || c.name.toLowerCase() === course.name.toLowerCase());
                
                // Hiển thị ô Checkbox hoặc Dấu tít xanh ở CỘT ĐẦU TIÊN
                let firstColHtml = '';
                if (isAlreadyAdded) {
                    firstColHtml = `<i class="fa-solid fa-circle-check text-success fs-5" title="Môn này đã có trong bảng điểm GPA"></i>`;
                } else {
                    firstColHtml = `<input type="checkbox" class="form-check-input cb-gpa-sys-item" value="${course.code}" onchange="updateGpaSelectedCount()" onclick="event.stopPropagation();">`;
                }

                let rowStyle = isAlreadyAdded ? 'background-color: #f1f5f9; opacity: 0.65;' : 'cursor: pointer;';
                let groupBadge = course.groupNote ? `<br><small class="text-info fw-bold" style="font-size: 11.5px;"><i class="fa-solid fa-layer-group me-1"></i>Nhóm: ${course.groupNote}</small>` : '';

                html += `
                <tr class="semester-row-${safeGroupId}" style="${rowStyle}" onclick="toggleGpaSysRowCheckbox(this, event, ${isAlreadyAdded})">
                    <!-- CỘT ĐẦU TIÊN: HIỂN THỊ CHECKBOX HOẶC DẤU TÍT XANH -->
                    <td class="text-center align-middle" style="width: 60px;">
                        ${firstColHtml}
                    </td>
                    <td class="text-center font-monospace fw-bold text-secondary align-middle" style="width: 15%;">${course.code}</td>
                    <td class="fw-bold text-dark align-middle">
                        ${course.name}
                        ${groupBadge}
                    </td>
                    <td class="text-center fw-bold text-primary align-middle" style="width: 12%;">${course.credits}</td>
                    <td class="text-center align-middle" style="width: 20%;">${typeBadge}</td>
                </tr>`;
            });
        };

        renderSubGroup(groupedData[groupKey].bat_buoc, 'Bắt buộc', '#fca5a5');
        renderSubGroup(groupedData[groupKey].tu_chon, 'Tự chọn', '#fca5a5');
        renderSubGroup(groupedData[groupKey].khac, 'Các môn khác', '#e2e8f0');
    }

    tbody.html(html);
}
// 5. CÁC HÀM TƯƠNG TÁC CHECKBOX & LỌC DỮ LIỆU
function toggleGpaSysRowCheckbox(rowElem, event, isAlreadyAdded) {
    if (isAlreadyAdded) return;
    let cb = $(rowElem).find('.cb-gpa-sys-item');
    if (cb.length && !cb.is(':disabled')) {
        cb.prop('checked', !cb.is(':checked'));
        updateGpaSelectedCount();
    }
}

// Chỉ chọn tất cả các môn ĐANG HIỂN THỊ trên bảng
function toggleSelectAllGpaSysCourses(masterCb) {
    let isChecked = $(masterCb).is(':checked');
    
    // Chỉ chọn các ô checkbox thuộc các dòng hiện đang hiển thị trên bảng (không bị ẩn bởi bộ lọc)
    $('#gpaSystemCoursesTableBody tr:not([style*="display: none"]) .cb-gpa-sys-item:not(:disabled)').prop('checked', isChecked);
    
    updateGpaSelectedCount();
}

// Chọn nhanh tất cả các môn trong một học kỳ cụ thể
function toggleSelectSemesterGroup(safeGroupId) {
    let rows = $(`.semester-row-${safeGroupId}`);
    let checkboxes = rows.find('.cb-gpa-sys-item:not(:disabled)');
    
    let allChecked = true;
    checkboxes.each(function() {
        if (!$(this).is(':checked')) {
            allChecked = false;
            return false;
        }
    });

    checkboxes.prop('checked', !allChecked);
    updateGpaSelectedCount();
}

function updateGpaSelectedCount() {
    let count = $('.cb-gpa-sys-item:checked').length;
    $('#gpaSelectedCountText').text(`Đã chọn: ${count} môn`);
}

function filterGpaSystemCourses() {
    let filterNH = $('#gpaSysNamHocFilter').val();
    let filterHK = $('#gpaSysHocKyFilter').val();
    let selectedType = $('#selectGpaSysCategory').val();
    let keyword = $('#txtSearchGpaSysCourse').val().toLowerCase().trim();

    currentFilteredSysCourses = SYSTEM_COURSE_DATABASE.filter(c => {
        let matchNH = filterNH === "" || c.namHoc === filterNH;
        let matchHK = filterHK === "" || c.hocKy === filterHK;
        let matchType = selectedType === 'all' || c.type === selectedType;
        let matchKeyword = keyword === '' || c.code.toLowerCase().includes(keyword) || c.name.toLowerCase().includes(keyword);
        
        return matchNH && matchHK && matchType && matchKeyword;
    });

    $('#cbGpaSysSelectAll').prop('checked', false);
    renderGpaSystemCoursesTable(currentFilteredSysCourses);
    updateGpaSelectedCount();
}

// 7. THÊM NHIỀU MÔN VÀO GPA CÙNG LÚC
function addSelectedGpaCoursesToDataset() {
    let selectedCodes = [];
    $('.cb-gpa-sys-item:checked').each(function() {
        selectedCodes.push($(this).val());
    });

    if (selectedCodes.length === 0) {
        alert("Vui lòng tích chọn ít nhất 1 môn học!");
        return;
    }

    let addedCount = 0;
    selectedCodes.forEach(code => {
        let courseTemplate = SYSTEM_COURSE_DATABASE.find(c => c.code === code);
        if (courseTemplate) {
            let newCourse = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                code: courseTemplate.code,
                name: courseTemplate.name,
                credits: courseTemplate.credits,
                type: courseTemplate.type,
                note: courseTemplate.groupNote || "", // TỰ ĐỘNG GÁN GHI CHÚ NHÓM
                columns: [
                    { name: "Cột 1", percent1: "", score1: "", percent2: "", score2: "", percent3: "", score3: "" },
                    { name: "Cột 2", percent1: "", score1: "", percent2: "", score2: "", percent3: "", score3: "" }
                ],
                majors: ['1']
            };

            myGPADataset.push(newCourse);
            addedCount++;
        }
    });

    $('#gpaSystemSelectModal').modal('hide');
    renderGPAList(true);
    alert(`Đã thêm thành công ${addedCount} môn học vào Bảng tính GPA của bạn!`);
}
// --- BỘ CÔNG CỤ HỖ TRỢ ADMIN TẠO DEADLINE (CÓ NHẬP TAY + CHỌN LỊCH) ---
window.insertDeadlineTag = function(targetCol, btnEl, event) {
    if (event) event.preventDefault();
    
    // Xóa popup cũ nếu nhấn lại nút
    let existingPicker = $(btnEl).next('.quick-dl-picker');
    if (existingPicker.length) {
        existingPicker.remove();
        return;
    }
    
    $('.quick-dl-picker').remove(); // Đóng các popup ở ô khác (nếu có)
    
    // Render khung Popup thông minh (Có 2 tùy chọn nhập)
    let pickerHtml = `
        <div class="quick-dl-picker mt-2 p-3 border rounded bg-white shadow-lg" style="position: absolute; z-index: 9999; border: 2px solid var(--primary-color) !important; width: 300px;">
            <label class="small fw-bold text-muted mb-1"><i class="fa-solid fa-keyboard me-1"></i> Nhập thủ công:</label>
            <input type="text" class="form-control form-control-sm mb-3 manual-dl" placeholder="VD: 23:59 01/01/2026">
            
            <label class="small fw-bold text-muted mb-1"><i class="fa-regular fa-calendar-days me-1"></i> Hoặc chọn từ lịch:</label>
            <input type="datetime-local" class="form-control form-control-sm mb-3 picker-dl" style="cursor: pointer;">
            
            <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-sm btn-light border fw-bold" onclick="$(this).closest('.quick-dl-picker').remove()">Hủy</button>
                <button type="button" class="btn btn-sm text-white fw-bold" style="background: var(--primary-color);" onclick="applyQuickDeadline('${targetCol}', this, event)">Chèn ngay</button>
            </div>
        </div>
    `;
    $(btnEl).after(pickerHtml);
};

window.applyQuickDeadline = function(targetCol, applyBtn, event) {
    if (event) event.preventDefault();
    let pickerDiv = $(applyBtn).closest('.quick-dl-picker');
    
    let manualVal = pickerDiv.find('.manual-dl').val().trim();
    let dtVal = pickerDiv.find('.picker-dl').val();
    
    let str = "";
    
    // Ưu tiên lấy ô Nhập tay nếu có dữ liệu, không thì lấy ô Chọn lịch
    if (manualVal) {
        str = `DEADLINE = ${manualVal}`;
    } else if (dtVal) {
        let d = new Date(dtVal);
        let pad = n => String(n).padStart(2, '0');
        str = `DEADLINE = ${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
    } else {
        alert("Vui lòng nhập tay hoặc chọn ngày giờ từ lịch!");
        return;
    }
    
    // Tìm ô Input/Textarea gốc nằm dưới cái Label
    let actualInput = pickerDiv.closest('label').nextAll('textarea, input').first();
    let inputId = actualInput.attr('id');
    
    if (targetCol === 'c3') {
        // Cột Nội dung (Xử lý chèn vào khung soạn thảo nâng cao TinyMCE)
        if (tinymce.get(inputId)) {
            let currentContent = tinymce.get(inputId).getContent();
            tinymce.get(inputId).setContent(currentContent + `<p><strong>${str}</strong></p>`);
        } else {
            let currentVal = actualInput.val();
            actualInput.val(currentVal + (currentVal ? "\n" : "") + str);
        }
    } else {
        // Cột Ghi chú (Ô input bình thường)
        let currentVal = actualInput.val();
        actualInput.val(currentVal + (currentVal ? " | " : "") + str);
    }
    
    pickerDiv.remove(); // Chèn xong tự động tắt popup
};
window.copyTBLink = function(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert("Đã sao chép đường link thông báo thành công!");
    });
};
$(document).ready(function() {
    setTimeout(checkUrlAndOpenThongBao, 1000);
});

function generateThongBaoID(rowIndex, totalRows, isRenLuyen) {
    let yearPrefix = new Date().getFullYear().toString().slice(-2); // Lấy "26" cho năm 2026
    let typePrefix = isRenLuyen ? "RL" : "HT"; // Rèn luyện = RL, Học thuật/Hệ thống = HT
    
    // Tính số thứ tự đếm từ dưới lên: Hàng dưới cùng (rowIndex lớn nhất) sẽ mang số 1
    let orderNumber = totalRows - rowIndex; 
    let numberFormatted = String(orderNumber).padStart(4, '0');
    
    return `${yearPrefix}${typePrefix}${numberFormatted}`; // VD: 26HT0001, 26RL0001
}
// Hàm trả đường dẫn URL trên thanh địa chỉ về trạng thái mặc định (xoá ?tb=...)
function resetUrlToDefault() {
    let cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.pushState({ path: cleanUrl }, '', cleanUrl);
}
// Bắt sự kiện click vào các nút trên menu Sidebar và các nút chuyển hướng
$(document).on('click', '.btn-course, .dropdown-item', function() {
    // Trì hoãn 300 mili-giây để giao diện web kịp cập nhật xong class 'active' cho nút mới
    setTimeout(function() {
        pingOnlineStatus(); // Gọi hàm gửi tín hiệu lên máy chủ ngay lập tức
    }, 300);
});