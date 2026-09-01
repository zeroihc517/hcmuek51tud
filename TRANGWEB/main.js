
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
    $('#btnNavDatLich').removeClass('active');
    $('#tongHopSection').addClass('d-none'); 
	$('#courseSection').addClass('d-none');
    $('#courseSection').addClass('d-none');
    $('#qaSection').addClass('d-none'); 
    $('#tkbSection').addClass('d-none');
    $('#shareCodeSection').addClass('d-none'); 
	$('#groupLinksView').addClass('d-none');
    $('#gpaSection').addClass('d-none');
    $('#profileSection').addClass('d-none'); // <--- Ẩn trang hồ sơ
	$('#datLichSection').addClass('d-none');
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
function renderOnlineFooterUI() {
    if (!cachedOnlineList || cachedOnlineList.length === 0) return;

    // Hệ thống nhận diện tài khoản Admin (kể cả khi chưa gạt nút bật quản trị)
    let currentIsAdmin = isAdmin || (currentUser && (currentUser.mssv === "51.01.108.008" || currentUser.mssv === "5101108008"));

    let guestCount = 0;
    let studentList = [];
    let processedMssv = new Set();
    
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
        let userIsAdminActive = parts[2] === "1";
        
        if (processedMssv.has(userMssv)) return;
        processedMssv.add(userMssv);

        // --- KIỂM TRA CÓ PHẢI CHÍNH TÀI KHOẢN CỦA BẢN THÂN KHÔNG ---
        let isCurrentUser = false;
        if (currentUser && currentUser.mssv) {
            let myCleanMssv = String(currentUser.mssv).replace(/\./g, "");
            let targetCleanMssv = String(userMssv).replace(/\./g, "");
            if (myCleanMssv === targetCleanMssv) {
                isCurrentUser = true;
            }
        }

        let isAdminAccount = (userMssv === "51.01.108.008" || userMssv === "5101108008");

        // --- Ưu tiên 1: TÀI KHOẢN ADMIN ĐANG TỰ XEM CHÍNH MÌNH ---
        if (isAdminAccount && isCurrentUser) {
            if (userIsAdminActive) {
                // Đã bật chế độ quản trị -> Hiện "Admin (Bạn)" màu vàng có icon
                studentList.push(`<span class="fw-bold" style="color: #facc15;"><i class="fa-solid fa-user-shield me-1"></i>ADMIN (Bạn)</span>`);
            } else {
                // Mặc định gốc (chưa bật) -> Hiện "Tên (Bạn)" (Ví dụ: Bảo Chí (Bạn)) màu xanh lá giống sinh viên
                let shortName = getNaturalShortName(userName);
                studentList.push(`<span class="fw-bold" style="color: #86efac;">${shortName} (Bạn)</span>`);
            }
            return;
        }

        // --- Ưu tiên 2: NGƯỜI KHÁC NHÌN THẤY ADMIN (Chỉ khi Admin bật chế độ quản trị) ---
        if (isAdminAccount && userIsAdminActive) {
            studentList.push(`<span class="fw-bold" style="color: #facc15;"><i class="fa-solid fa-user-shield me-1"></i>ADMIN</span>`);
            return;
        }

        // --- Ưu tiên 3: SINH VIÊN BÌNH THƯỜNG TỰ XEM CHÍNH MÌNH ---
        if (isCurrentUser) {
            studentList.push(`<span class="fw-bold" style="color: #86efac;">${userMssv} (Bạn)</span>`);
            return;
        }

        // --- Ưu tiên 4: XỬ LÝ CÁC NẤC HIỂN THỊ (Dành cho Admin xem sinh viên khác) ---
        // Do currentIsAdmin = true đối với tài khoản Admin, nên mặc định vòng lặp sẽ rớt vào đây
        if (currentIsAdmin) {
            if (adminDisplayMode === 0) {
                // Mặc định của Admin: Hiện Tên rút gọn (Lấy 2 chữ cuối) tự nhiên
                studentList.push(getNaturalShortName(userName));
                return;
            } else if (adminDisplayMode === 1) {
                // Nấc 1: Hiện MSSV đầy đủ
                studentList.push(userMssv);
                return;
            } else if (adminDisplayMode === 2) {
                // Nấc 2: Hiện Họ và Tên đầy đủ
                studentList.push(userName);
                return;
            } else if (adminDisplayMode === 3) {
                // Nấc 3: Hiện Họ Tên (MSSV)
                studentList.push(`${userName} (${userMssv})`);
                return;
            }
        }
        
        // Mặc định: Sinh viên thường xem người khác -> Che MSSV
        studentList.push(maskMSSV(userMssv));
    });
    
    let realTotalOnline = studentList.length + guestCount;
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

    let iconHtml = currentIsAdmin 
        ? `<i class="fa-solid fa-users me-2" onclick="toggleAdminNameDisplay()" style="cursor: pointer;" title="Bấm để xoay vòng chế độ hiển thị danh sách"></i>`
        : `<i class="fa-solid fa-users me-2"></i>`;

    // Đổ dữ liệu ra ngoài giao diện
    $('#footerOnlineStatus').html(`
        ${iconHtml} 
        ${realTotalOnline} người: <strong>${displayList}</strong>
    `);
}
window.userDetailedView = ""; 

// Hàm gán view chi tiết và đẩy lên server ngay lập tức
window.setDetailedView = function(viewString) {
    window.userDetailedView = viewString;
    pingOnlineStatus(); // Gọi hàm ping để cập nhật lên bảng Admin ngay lập tức
};
// 5. Hàm gửi request lấy dữ liệu mới từ Server (chạy ngầm định kỳ)
// 5. Hàm gửi request lấy dữ liệu mới từ Server (chạy ngầm định kỳ)
function pingOnlineStatus() {
    let mssvParam = "Khách"; 
    
    // NẾU ĐANG NHẬP VAI SINH VIÊN -> ÉP DÙNG LẠI DANH TÍNH ADMIN THẬT ĐỂ PING
    if (window.isImpersonating && window.realAdminMssv) {
        mssvParam = window.realAdminMssv + "|" + window.realAdminName + "|1";
        $('#gpaNavContainer').removeClass('d-none');
    } else {
        // NẾU LÀ NGƯỜI DÙNG BÌNH THƯỜNG -> DÙNG ORIGINAL GET ITEM ĐỂ VƯỢT RÀO ẢO HÓA
        let savedUser = (window.hookedLocalStorage && window.originalGetItem) 
            ? window.originalGetItem.call(localStorage, 'currentUser') 
            : localStorage.getItem('currentUser');
            
        if (savedUser) {
            try {
                let userObj = JSON.parse(savedUser);
                mssvParam = userObj.mssv + "|" + userObj.name + "|" + (isAdmin ? "1" : "0"); 
                const allowedGpaAccounts = ["51.01.108.008", "ihcspt517", "51.01.108.042"];
                if (allowedGpaAccounts.includes(userObj.mssv)) {
                    $('#gpaNavContainer').removeClass('d-none');
                } else {
                    $('#gpaNavContainer').addClass('d-none');
                }
            } catch(e) {
                mssvParam = "Khách"; 
                $('#gpaNavContainer').addClass('d-none');
            }
        } else {
            $('#gpaNavContainer').addClass('d-none');
        }
    }

    // --- LOGIC LẤY TÊN MỤC ĐANG XEM (CHUẨN XÁC THEO MENU) ---
    // (Phần logic phía dưới của bạn giữ nguyên, không thay đổi)
    let currentView = "Trang chủ"; 
    let activeMenuText = $('#sidebarMenu .active').text().trim();
    
    if (window.userDetailedView !== "") {
        currentView = window.userDetailedView;
    } else if (activeMenuText) {
        currentView = activeMenuText; 
    } else if (typeof currentSheetName !== 'undefined' && currentSheetName !== "") {
        currentView = currentSheetName; 
    } else {
        currentView = document.title.split('|')[0].trim(); 
    }

    $.ajax({ 
        url: SCRIPT_URL + "?action=pingPresence&uuid=" + sessionUUID + "&mssv=" + encodeURIComponent(mssvParam) + "&lastView=" + encodeURIComponent(currentView), 
        method: "GET", 
        dataType: "json", 
        cache: false,
        success: function(res) { 
            if (res && res.list) { 
                
                // BẮT ĐẦU THÊM MỚI: THÔNG BÁO VÀ ÂM THANH CHO ADMIN
                if (currentUser && currentUser.mssv === "51.01.108.008") {
                    if (typeof cachedOnlineList !== 'undefined' && cachedOnlineList.length > 0) {
                        let oldUsersMap = {};
                        let newUsersMap = {};
                        
                        // Ánh xạ danh sách cũ
                        cachedOnlineList.forEach(u => {
                            if (u !== "Khách" && u.includes("|")) {
                                let parts = u.split("|");
                                oldUsersMap[parts[0]] = parts[1];
                            }
                        });
                        
                        // Ánh xạ danh sách mới
                        res.list.forEach(u => {
                            if (u !== "Khách" && u.includes("|")) {
                                let parts = u.split("|");
                                newUsersMap[parts[0]] = parts[1];
                            }
                        });
                        
                        let hasJoin = false;
                        let hasLeave = false;
                        let joinMessage = "";
                        let leaveMessage = "";

                        // 1. Kiểm tra người mới vào
                        for (let mssv in newUsersMap) {
                            if (!oldUsersMap[mssv]) {
                                // Bỏ qua nếu là chính tài khoản Admin
                                if (mssv === "51.01.108.008" || mssv === "5101108008") continue;

                                let fullName = newUsersMap[mssv];
                                let shortName = fullName.trim().split(/\s+/).slice(-2).join(' ');
                                joinMessage = `${shortName} đã tham gia`;
                                hasJoin = true;
                            }
                        }

                        // 2. Kiểm tra người vừa rời đi
                        for (let mssv in oldUsersMap) {
                            if (!newUsersMap[mssv]) {
                                // Bỏ qua nếu là chính tài khoản Admin
                                if (mssv === "51.01.108.008" || mssv === "5101108008") continue;

                                let fullName = oldUsersMap[mssv];
                                let shortName = fullName.trim().split(/\s+/).slice(-2).join(' ');
                                leaveMessage = `${shortName} đã rời`;
                                hasLeave = true;
                            }
                        }

                        // PHÁT ÂM THANH VÀ THÔNG BÁO BẰNG WINDOW.ALERT ĐỂ NỔI LÊN TRÊN LOAD_WEB
                        if (hasJoin) {
                            let joinSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2866/2866-preview.mp3');
                            joinSound.play().catch(e => console.log("Trình duyệt chặn phát âm thanh:", e));
                            window.alert(joinMessage); 
                        } else if (hasLeave) {
                            let leaveSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3');
                            leaveSound.play().catch(e => console.log("Trình duyệt chặn phát âm thanh:", e));
                            window.alert(leaveMessage);
                        }
                    }
                }
                // KẾT THÚC THÊM MỚI

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
	'HK2 - Năm 2': ["Độ đo và tích phân", "Toán rời rạc", "Lập trình Python", "Phương trình vi phân và đạo hàm riêng", "Trí tuệ nhân tạo", "Lịch sử Đảng", "Quốc phòng An ninh"],
	'HK1 - Năm 2': ['Hình học vi phân', 'Cấu trúc đại số', 'Cấu trúc dữ liệu', 'Lập trình hướng đối tượng', 'Tư tưởng Hồ Chí Minh'], 
	'Năm 1': ["Năm 1"],
    'Khác': [],
    };

    // Tạo object lưu trữ HTML tạm cho từng nhóm
    let groupHtml = {};
    for (const key in categoryGroups) { groupHtml[key] = ''; }
    groupHtml['Khác'] = '';

    globalCategories.forEach((name) => {
        let lowerName = name.trim().toLowerCase();
        
        // Bỏ qua các sheet dữ liệu hệ thống ẩn
if (lowerName === 'deadlines_admin' || lowerName === 'deadlines_status' || lowerName === 'tkb_admin' || lowerName === 'khaosat' || lowerName === 'weblinks_personal' || lowerName === 'registrationhistory' || lowerName === 'userregisteredcourses' || lowerName === 'mastertkb' || lowerName === 'datlichhen' || lowerName === 'learningdata' || lowerName === 'groupstudybooking'  || lowerName === 'gpa_data' || lowerName === 'exercisequestions' || lowerName === 'sharecode' || lowerName === 'renLuyen_data' || lowerName === 'grouplinks') return;


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
    // 1. Danh sách gõ sẵn (Load tức thì)
    let hardcodedCategories = [ 
        'Hình học vi phân', 
        'Cấu trúc đại số', 
        'Cấu trúc dữ liệu', 
        'Lập trình hướng đối tượng', 
        'Tư tưởng Hồ Chí Minh',
        'Năm 1',
    ];

    // 2. Chỉ khi nào Admin bật "Dành cho bản quản trị" (isAdmin = true) mới load từ Sheet
    if (isAdmin) {
        $('#dynamicCourseList').html('<span class="text-muted small px-2">Đang tải toàn bộ dữ liệu...</span>');
        $.ajax({ 
            url: SCRIPT_URL + "?action=getHocPhanList", 
            method: "GET", 
            dataType: "json",
            success: function(list) { 
                globalCategories = list; // Cập nhật mảng thành danh sách đầy đủ
                renderSidebarCategories(); 
                if ($('#manageCategoryModal').is(':visible')) { renderCategoryManager(); } 
            },
            error: function() {
                globalCategories = hardcodedCategories;
                renderSidebarCategories();
            }
        });
    } else {
        // Trạng thái bình thường: Sinh viên, Khách, và Admin chưa bật chế độ quản trị
        globalCategories = hardcodedCategories;
        renderSidebarCategories(); 
        if ($('#manageCategoryModal').is(':visible')) { renderCategoryManager(); }
    }
}

function generateChessLoaderHTML() {
    let pieces = ['fa-chess-knight', 'fa-chess-pawn', 'fa-chess-rook', 'fa-chess-bishop', 'fa-chess-queen', 'fa-chess-king'];
    
    // Thuật toán xáo trộn [0,1,2,3,4,5] để đảm bảo mỗi cột có đúng 1 quân cờ chính, mỗi hàng 1 quân
    let cols = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);

    let html = '<div class="chess-loader-container">';
    for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
            let randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
            
            if (cols[r] === c) {
                // Quân cờ chính chắc chắn xuất hiện (để đảm bảo điều kiện mỗi hàng/cột có ít nhất 1 con)
                html += `<div class="chess-square"><i class="fa-solid ${randomPiece} chess-piece"></i></div>`;
            } else {
                // Xác suất 30% xuất hiện quân cờ phụ nhấp nháy nhanh hơn
                let extraPiece = (Math.random() > 0.7) ? `<i class="fa-solid ${randomPiece} chess-piece" style="animation-duration: 0.8s; opacity: 0.5;"></i>` : '';
                html += `<div class="chess-square">${extraPiece}</div>`;
            }
        }
    }
    html += '</div>';
    return html;
}

function loadDataByHocPhan(sheetName, element) {
    if(!sheetName) return; 
    document.title = sheetName + " | Học nhóm APMA Khoa Toán";
    currentSheetName = sheetName; 
    resetNavActive(); 
    if(element) $(element).addClass('active');
    $('#courseHeaderTitle').html(`<i class="fa-solid fa-book-open me-2"></i> ${sheetName}`);
    if (currentSheetName.toLowerCase() !== 'thông báo') {
    $('#groupLinkWrapper').removeClass('d-none');
} else {
    $('#groupLinkWrapper').addClass('d-none');
}
    // Reset giao diện trước khi tải
    $('#courseSection').removeClass('d-none'); 
    $('#tableWrapper').addClass('d-none'); 
    $('#swipeHint').addClass('d-none');
    $('#instructorWrapper').addClass('d-none'); 
    $('#instructorListContainer').html('');
    
    // ==========================================
    // LOGIC CHỌN LOADING: BẬC THANG HAY BÀN CỜ 
    // ==========================================
    let isEvenIndex = false;
    if (element) {
        // Lấy tất cả các nút danh mục đang hiển thị
        let allNavButtons = $('.nav-hocphan'); 
        let currentIndex = allNavButtons.index(element);
        
        // Trong lập trình, index 0 là vị trí lẻ thứ 1, index 1 là vị trí chẵn thứ 2
        isEvenIndex = (currentIndex % 2 !== 0); 
    }

    // HTML Loading Bậc thang (Mặc định)
   // HTML Loading Bậc thang (Đa sắc màu)
    let stairHtml = `
    <div class="stair-loader-container mx-auto mb-3">
        <div class="stair-col">
            <div class="stair-box" style="--i: 1; --c: #ef4444;"></div> <!-- Đỏ -->
            <div class="stair-box" style="--i: 2; --c: #f97316;"></div> <!-- Cam -->
            <div class="stair-box" style="--i: 3; --c: #f59e0b;"></div> <!-- Vàng cam -->
            <div class="stair-box" style="--i: 4; --c: #eab308;"></div> <!-- Vàng -->
            <div class="stair-box" style="--i: 5; --c: #84cc16;"></div> <!-- Xanh chanh -->
        </div>
        <div class="stair-col">
            <div class="stair-box" style="--i: 6; --c: #22c55e;"></div> <!-- Xanh lá -->
            <div class="stair-box" style="--i: 7; --c: #10b981;"></div> <!-- Xanh ngọc -->
            <div class="stair-box" style="--i: 8; --c: #14b8a6;"></div> <!-- Xanh mòng két -->
            <div class="stair-box" style="--i: 9; --c: #06b6d4;"></div> <!-- Xanh Cyan -->
        </div>
        <div class="stair-col">
            <div class="stair-box" style="--i: 10; --c: #0ea5e9;"></div> <!-- Xanh da trời -->
            <div class="stair-box" style="--i: 11; --c: #3b82f6;"></div> <!-- Xanh dương -->
            <div class="stair-box" style="--i: 12; --c: #6366f1;"></div> <!-- Xanh chàm -->
        </div>
        <div class="stair-col">
            <div class="stair-box" style="--i: 13; --c: #8b5cf6;"></div> <!-- Tím Violet -->
            <div class="stair-box" style="--i: 14; --c: #d946ef;"></div> <!-- Tím hồng -->
        </div>
        <div class="stair-col">
            <div class="stair-box" style="--i: 15; --c: #e61d4a;"></div> <!-- Đỏ hồng (Màu chủ đạo) -->
        </div>
    </div>`;

    // Quyết định dùng HTML nào
    let finalLoaderHtml = isEvenIndex ? generateChessLoaderHTML() : stairHtml;

    // Đổ vào khu vực Loading
    $('#loadingStatus').html(`
        ${finalLoaderHtml}
        <span class="text-muted fw-bold" style="font-size: 16px; color: #0f4c81 !important;">Đang tải dữ liệu...</span>
    `);
    $('#loadingStatus').removeClass('d-none');
    
    // (Phần code hiển thị Admin và gọi AJAX getHocPhanData của bạn giữ nguyên tiếp theo bên dưới...)
    if ($('#customViewWrapper').length > 0) $('#customViewWrapper').addClass('d-none');
    $('#minigameWrapper').addClass('d-none');
    $('#examCardsContainer').html('');

    // ... Toàn bộ đoạn code dưới giữ nguyên
    // ==========================================
    // BỔ SUNG CHẶN KHÁCH XEM TRANG TỔNG (ĐÃ ĐƯA RA NGOÀI VÀ LÊN ĐẦU)
    // ==========================================
 if (sheetName.toLowerCase() === 'thông báo') {
        let urlParams = new URLSearchParams(window.location.search);
        let tbParam = urlParams.get('tb');

        // Nếu người dùng là Khách VÀ KHÔNG CÓ mã thông báo cụ thể (?tb=...)
        if (currentUser && currentUser.isGuest && !tbParam) {
            // Lập tức chuyển hướng sang trang đăng nhập thay vì hiện khung khóa
            window.location.href = 'login.html';
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
  // Hiển thị form thêm dữ liệu nếu là Admin và Đổi nhãn thông minh
if (isAdmin) {
    $('#adminAddRowArea').removeClass('d-none');
    
    if (sheetName.toLowerCase() === 'thông báo') {
        $('#btnToggleHiddenPosts').removeClass('d-none'); // HIỆN NÚT CHUYỂN ĐỔI GÓC NHÌN
        
        // 1. HIỂN THỊ LẠI ĐẦY ĐỦ 7 CỘT
        $('#txtCol5, #txtCol6, #txtCol7').parent().show();
        $('#insertCol5, #insertCol6, #insertCol7').parent().show();
        $('#editCol5, #editCol6, #editCol7').parent().show();
        
        // 2. KHÔI PHỤC TÊN NHÃN VÀ THÊM NÚT "HẸN GIỜ" CHO THÔNG BÁO
        $('#txtCol1, #insertCol1, #editCol1').prev('label').html('STT (Cột 1)');
        $('#txtCol2, #insertCol2, #editCol2').prev('label').html('Tiêu đề (Cột 2)');
        $('#txtCol4, #insertCol4, #editCol4').prev('label').html('Ngày đăng (Cột 4)');
        $('#txtCol5, #insertCol5, #editCol5').prev('label').html('Ngày cập nhật (Cột 5)');
        $('#txtCol6, #insertCol6, #editCol6').prev('label').html('Đường link đính kèm (Cột 6)');
        $('#txtCol3, #insertCol3, #editCol3').prev('label').html('Nội dung chi tiết (Cột 3) <button type="button" class="btn btn-sm text-white py-0 px-2 ms-2 rounded-pill shadow-sm fw-bold" style="font-size: 11px; background-color: var(--accent-red);" onclick="insertDeadlineTag(\'c3\', this, event)"><i class="fa-solid fa-clock"></i> Hẹn giờ Đếm ngược</button>');
        $('#txtCol7, #insertCol7, #editCol7').prev('label').html('Ghi chú (Cột 7) <button type="button" class="btn btn-sm text-white py-0 px-2 ms-2 rounded-pill shadow-sm fw-bold" style="font-size: 11px; background-color: #6b7280;" onclick="insertDeadlineTag(\'c7\', this, event)"><i class="fa-solid fa-clock"></i> Hẹn giờ Ẩn bài</button>');

        // 3. SẮP XẾP LẠI VỊ TRÍ CÁC CỘT CHO THÔNG BÁO
        $('#txtCol1').parent().attr('class', 'col-md-2').css('order', '1');
        $('#txtCol4').parent().attr('class', 'col-md-3').css('order', '2');
        $('#txtCol5').parent().attr('class', 'col-md-3').css('order', '3');
        $('#txtCol6').parent().attr('class', 'col-md-4').css('order', '4');
        $('#txtCol7').parent().attr('class', 'col-md-3').css('order', '5');
        $('#txtCol2').parent().attr('class', 'col-md-9').css('order', '6');
        $('#txtCol3').parent().attr('class', 'col-12').css('order', '7');

    } else {
        // ==========================================
        // GIAO DIỆN CHỈNH SỬA DÀNH CHO "HỌC PHẦN"
        // ==========================================
        $('#btnToggleHiddenPosts').addClass('d-none');
        
        // 1. ẨN CÁC CỘT KHÔNG DÙNG ĐẾN (CỘT 5, 6, 7)
        $('#txtCol5, #txtCol6, #txtCol7').parent().hide();
        $('#insertCol5, #insertCol6, #insertCol7').parent().hide();
        $('#editCol5, #editCol6, #editCol7').parent().hide();
        
        // 2. ĐỔI TÊN NHÃN CHO 4 CỘT CÒN LẠI 
        // (Lưu ý: Input số 3 đang chứa TinyMCE nên sẽ đóng vai trò là "Nội dung chi tiết Cột 2")
        $('#txtCol1, #insertCol1, #editCol1').prev('label').text('STT (Cột 1)');
        $('#txtCol3, #insertCol3, #editCol3').prev('label').text('Nội dung chi tiết (Cột 2)'); // Khung TinyMCE
        $('#txtCol2, #insertCol2, #editCol2').prev('label').text('Đường link (Cột 3)');       // Ô text thường
        $('#txtCol4, #insertCol4, #editCol4').prev('label').text('Ghi chú (Cột 4)');
        
        // 3. SẮP XẾP LẠI GIAO DIỆN BẢNG THÊM MỚI BÊN DƯỚI (Dùng Flexbox Order)
        $('#txtCol1').parent().attr('class', 'col-md-2').css('order', '1');
        $('#txtCol3').parent().attr('class', 'col-md-10').css('order', '2'); // Khung nội dung rộng ra
        $('#txtCol2').parent().attr('class', 'col-md-6').css('order', '3');
        $('#txtCol4').parent().attr('class', 'col-md-6').css('order', '4');
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
            // 1. Bắt lỗi nếu Google Server bị nghẽn và trả về object báo lỗi
            if (data && data.error) {
                $('#loadingStatus').html('<span class="text-danger fw-bold"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi Google Server: ' + data.error + '</span>');
                return;
            }

            // 2. Chống sập vòng lặp nếu data không phải là Mảng hợp lệ
            if (!data || !Array.isArray(data) || data.length === 0) { 
                currentSheetTotalRows = 1; 
                $('#sheetTableBody').html('<tr><td colspan="5" class="text-center py-5 text-muted"><i class="fa-regular fa-folder-open fs-1 mb-3 d-block"></i>Chưa có dữ liệu.</td></tr>'); 
                $('#loadingStatus').addClass('d-none'); 
                $('#tableWrapper').removeClass('d-none'); 
                $('#swipeHint').removeClass('d-none'); 
                return; 
            }
            
            currentSheetTotalRows = data.length;
window.currentSubjectData = data;
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
const regexNgayDang = /ĐĂNG=((?:\d{2}:\d{2}\s)?\d{2}\/\d{2}\/\d{4})/i;
    const regexCapNhat = /UPDATE=((?:\d{2}:\d{2}\s)?\d{2}\/\d{2}\/\d{4})/i;
    const regexUrl = /(https?:\/\/[^\s<"]+)/g;
    const regexUrlNgoai = /(https?:\/\/[^\s]+)/g;
    const regexTheP = /<\/?(p|div)[^>]*>/gi;
    const regexNbsp = /&nbsp;/gi;
    const regexBr = /(<br\s*\/?>|\n)+/gi;
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
    // Sinh viên không được vẽ bài tương lai. Admin thì vẽ hết để dùng CSS ẩn/hiện tức thì
    if (publishDate && publishDate > now && (!isAdmin || adminShowHidden)) {
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
    let isFuturePost = (publishDate && publishDate > now);

    // Gán class nhận diện bài ẩn/hẹn giờ
    let hiddenClassAttr = (isHidden || isFuturePost) ? 'is-hidden-post' : '';

    let dlStrRegex = /(?:DEADLINE\s*=\s*|Hết hạn(?: lúc\s*)?)\d{1,2}:\d{2}\s*(?:Ngày\s*)?\d{1,2}\/\d{1,2}\/\d{2,4}/ig;
    c3 = c3.replace(dlStrRegex, '').replace(/<[^\/>][^>]*>\s*<\/[^>]+>/g, '').trim();

    c7 = c7_raw.replace(dlStrRegex, '').trim();
    if (isHeThong) c7 = c7.replace(/hệ thống/ig, '').trim();
    else if (isRenLuyen) c7 = c7.replace(/rèn luyện/ig, '').trim();
    c7 = c7.replace(/^[:\-,\s|]+/, '').replace(/[:\-,\s|]+$/, '').trim();

    let assignedTbCode = tbCodesMap[rowIndex] || "";
    
    // Ghi nhớ dữ liệu vào detailData KỂ CẢ KHI BÀI ĐÃ BỊ ẨN để dán link mở được
   detailData[rowIndex] = { c1, c2, c3, c4, c5, c6, c7, isNew, isHidden, tbCode: assignedTbCode, deadlineTime: deadlineTime };

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
<div class="mt-2 admin-action-col d-none" onclick="event.stopPropagation();">
    <button class="btn btn-sm btn-outline-secondary py-0 px-2" title="Lên" ...
            <button class="btn btn-sm btn-outline-secondary py-0 px-2" title="Xuống" onclick="moveRowItem(${sheetRowIndex}, 'down')"><i class="fa-solid fa-arrow-down"></i></button>
            <button class="btn btn-sm btn-outline-success py-0 px-2 fw-bold" onclick="openInsertRowModal(${sheetRowIndex})"><i class="fa-solid fa-plus"></i></button>
            <button class="btn btn-sm btn-outline-warning py-0 px-2 fw-bold" onclick="openEditRowModal(${sheetRowIndex}, '${ec1}', '${ec2}', '${ec3}', '${ec4}', '${ec5}', '${ec6}', '${ec7}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm btn-outline-danger py-0 px-2 fw-bold" onclick="deleteRowItem(${sheetRowIndex})"><i class="fa-solid fa-trash"></i></button>
        </div>`;
    }

// --- THÊM ĐOẠN NÀY ĐỂ TÍNH TOÁN KÉO THẢ CHO THÔNG BÁO ---
    let sheetRowIndexDrag = rowIndex + 1;
    let isDragEnabled = window.isAdminActionsEnabled ? 'true' : 'false';
    let dragStyleTb = window.isAdminActionsEnabled ? 'cursor: grab;' : 'cursor: pointer;';
    let dragAttrTb = (isAdmin && window.innerWidth >= 992) ? ` draggable="${isDragEnabled}" ondragstart="handleDragStart(event, ${sheetRowIndexDrag})" ondragover="handleDragOver(event)" ondragenter="handleDragEnter(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, ${sheetRowIndexDrag}, '${currentSheetName}')" style="${dragStyleTb}"` : 'style="cursor: pointer;"';

    if (isHeThong) {
        heThongItemsHtml += `
        <div class="border-animation mb-4 ${hiddenClassAttr} drag-handle-row" ${dragAttrTb}>
            <div class="alert shadow-sm border-0 position-relative" role="alert" style="background: linear-gradient(to right, #fff5f5, #ffffff);" onclick="viewThongBaoDetail(${rowIndex})">
                <div class="d-flex align-items-start gap-3">                <div class="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 48px; height: 48px;">
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
       <div class="tb-list-item ${hiddenClassAttr} drag-handle-row" onclick="viewThongBaoDetail(${rowIndex})" ${dragAttrTb}>
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
                        if (typeof window.setDetailedView === 'function') {
        window.setDetailedView("Thông báo - " + data.c2); // data.c2 là Tiêu đề
    }
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
                       let detailDeadlineTime = data.deadlineTime;
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
                      // Bổ sung xử lý nháy đơn/nháy kép cho tiêu đề để tránh lỗi JavaScript khi truyền vào onclick

// Thay các ký tự nháy để tránh lỗi chuỗi
let safeTbTitle = data.c2.replace(/'/g, "\\'").replace(/"/g, "&quot;");

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

<!-- BẮT ĐẦU: KHUNG BÌNH LUẬN VÀ LỊCH SỬ -->
<div class="mt-5 pt-4 border-top">
    

    <!-- Khung nhập bình luận mới -->
    <div class="bg-light p-3 rounded border border-primary-subtle">
        <textarea id="txtThongBaoComment" class="form-control mb-3 border-primary-subtle" rows="3" placeholder="Nhập câu hỏi hoặc bình luận của bạn về sự kiện/thông báo này..."></textarea>
        <div class="d-flex justify-content-end">
            <button class="btn text-white fw-bold px-4" onclick="submitThongBaoComment('${currentCode}', '${safeTbTitle}')" id="btnSubmitTBComment" style="background: #0f4c81; border:none; border-radius: 8px;">
                <i class="fa-solid fa-paper-plane me-2"></i>Gửi bình luận
            </button>
        </div>
    </div>
<br>
    <h6 class="fw-bold text-primary mb-3"><i class="fa-solid fa-comments me-2"></i>Bình luận & Thắc mắc về thông báo này</h6>
    
    <!-- Lịch sử bình luận -->
    <div id="tbCommentHistory" class="mb-4">
        <div class="text-center text-muted small py-3 bg-white rounded border"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải lịch sử bình luận...</div>
    </div>
</div>
<!-- KẾT THÚC: KHUNG BÌNH LUẬN VÀ LỊCH SỬ -->
`;

$('#tbDetailContent').html(html);
$('#tbMainView').addClass('d-none');
$('#tbDetailContainer').removeClass('d-none');
window.scrollTo({ top: 0, behavior: 'smooth' });
applyKaTeX('tbDetailContent');

// CHÈN DÒNG NÀY VÀO SAU KHI HTML ĐÃ RENDER ĐỂ LẤY LỊCH SỬ BÌNH LUẬN
loadThongBaoComments(currentCode);
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
			if (typeof window.setDetailedView === 'function') window.setDetailedView("Thông báo");
                        resetUrlToDefault();
                    };
// 1. Hàm Gửi bình luận
window.submitThongBaoComment = function(tbCode, tbTitle) {
    let mssvValue = currentUser ? currentUser.mssv : "Khách";
    if (mssvValue === "Khách") {
        alert("Vui lòng đăng nhập Sinh viên để có thể bình luận!");
        return;
    }

    let commentText = $('#txtThongBaoComment').val().trim();
    if (!commentText) {
        alert("Vui lòng nhập nội dung bình luận!");
        $('#txtThongBaoComment').focus();
        return;
    }

    // ĐỊNH DẠNG THEO Ý BẠN: Tên thông báo in đậm -> Xuống 2 dòng -> Nội dung sinh viên gõ
    let topic = "Sự kiện";
    let qText = `<strong>Thông báo [${tbCode}]: ${tbTitle}</strong>\n\n${commentText}`;
    
    let finalPayload = `<span class="badge mb-2 shadow-sm" style="background-color: #f1f5f9; color: #475569; font-size: 12.5px; border: 1px solid #e2e8f0;"><i class="fa-solid fa-tag me-1" style="color: #0f4c81;"></i> ${topic}</span>\n\n${qText}`;

    let btn = $('#btnSubmitTBComment');
    let originalHtml = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang gửi...').prop('disabled', true);

    postToGAS({ action: "submitQuestion", mssv: mssvValue, question: finalPayload }, function(response) {
        alert("Đã gửi bình luận thành công!");
        $('#txtThongBaoComment').val('');
        btn.html(originalHtml).prop('disabled', false);
        
        // Cập nhật lại lịch sử hiển thị
        loadThongBaoComments(tbCode);
        
        // Tải ngầm lại data Q&A để cập nhật thông báo badge nếu cần
        if (typeof loadQAData === 'function') loadQAData();
        if (typeof checkNewQA === 'function') checkNewQA();
    }, function() {
        alert("Lỗi kết nối máy chủ! Vui lòng thử lại sau.");
        btn.html(originalHtml).prop('disabled', false);
    });
};

// Hàm Tải lịch sử bình luận tương ứng với thông báo (Bản UI Đẹp)
window.loadThongBaoComments = function(tbCode) {
    let container = $('#tbCommentHistory');
    container.html('<div class="text-center text-muted small py-4 bg-white rounded border border-primary-subtle"><i class="fa-solid fa-spinner fa-spin fs-4 mb-2"></i><br>Đang tải bình luận...</div>');
    
    $.ajax({ 
        url: SCRIPT_URL + "?action=getQAData", 
        method: "GET", 
        dataType: "json", 
        success: function(data) {
            if (!data || data.length === 0) {
                container.html('<div class="text-center text-muted small py-4 bg-light rounded border border-primary-subtle" style="border-style: dashed !important;"><i class="fa-regular fa-comments fs-3 mb-2 opacity-50"></i><br>Chưa có bình luận nào cho thông báo này.<br>Bạn hãy là người đầu tiên nhé!</div>');
                return;
            }
            
            let html = '';
            let commentCount = 0;
            
            let activeUser = JSON.parse(localStorage.getItem('currentUser')) || null;
            let isSystemAdmin = activeUser && (activeUser.mssv === "51.01.108.008" || activeUser.mssv === "5101108008");
            
            data.forEach(row => {
                let rawQuestion = row[2] || '';
                if (rawQuestion.includes(`[${tbCode}]`)) {
                    commentCount++;
                    let time = row[0] || ''; 
                    let rawMssv = String(row[1] || '').trim().replace(/[-|]/g, ''); 
                    let displayMssv = maskMSSV(rawMssv); 
                    
                    if (isSystemAdmin) {
                        let fullName = window.allUsersMap ? window.allUsersMap[rawMssv] : null;
                        displayMssv = fullName ? `${rawMssv} - ${getNaturalShortName(fullName)}` : rawMssv;
                    } else if (activeUser && activeUser.mssv) {
                        let myCleanMssv = activeUser.mssv.replace(/\./g, "");
                        if (myCleanMssv === rawMssv.replace(/\./g, "")) {
                            displayMssv = `${rawMssv} - ${getNaturalShortName(activeUser.name)} <span class="badge bg-success ms-1" style="font-size: 10px;">Bạn</span>`;
                        }
                    }

                    // Dọn dẹp thẻ Tag dư thừa
                    let badgeRegex = /(<span class="badge[^>]*>.*?<\/span>)\s*/;
                    rawQuestion = rawQuestion.replace(badgeRegex, ''); 

                    // Cắt bỏ phần "Thông báo [Mã]: Tên thông báo" đi cho đỡ dài dòng trong lịch sử
                    rawQuestion = rawQuestion.replace(/<strong>Thông báo.*?<\/strong>\s*/i, '').trim();
                    
                    // Format chữ và xuống dòng bằng hàm xịn
                    let questionFormatted = window.safeFormatTextQA(rawQuestion);
                    
                    let answer = row[3] || ''; 
                    let rowIndex = row[6];
                    
                    // ============================================
                    // GIAO DIỆN TIMELINE CHAT HIỆN ĐẠI (ĐÃ BỔ SUNG PHẢN HỒI)
                    // ============================================
                    html += `
                    <div class="mb-4" style="border-left: 3px solid #cbd5e1; padding-left: 15px; margin-left: 5px;">
                        <div class="d-flex align-items-center mb-2">
                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2 shadow-sm" style="width: 32px; height: 32px; font-size: 14px;">
                                <i class="fa-solid fa-user"></i>
                            </div>
                            <div>
                                <div class="fw-bold" style="color: #0f4c81; font-size: 14.5px;">SV: ${displayMssv}</div>
                                <div class="text-muted" style="font-size: 12px;"><i class="fa-regular fa-clock me-1"></i>${time}</div>
                            </div>
                        </div>
                        
                        <div class="bg-white p-3 rounded shadow-sm border border-primary-subtle" style="font-size: 15px; color: #334155; border-radius: 0 12px 12px 12px; font-weight: normal;">
                            ${questionFormatted}
                        </div>`;
                                
                    if (answer.trim() !== "") {
                        html += `<div class="mt-2 ms-4 ps-3" style="border-left: 2px dashed #93c5fd;">${parseThread(answer, rowIndex)}</div>`; 
                    } else {
                        html += `<div class="mt-2 ms-4 ps-3 text-muted small fst-italic"><i class="fa-solid fa-reply fa-rotate-180 me-2"></i>Đang chờ Admin phản hồi...</div>`;
                    }
                    
                    // --- KHUNG NÚT BẤM VÀ BÌNH LUẬN NỐI TIẾP ---
                    html += `
                        <div class="mt-2 ms-4 ps-3">
                            <button class="btn btn-sm btn-outline-primary fw-bold mt-2 shadow-sm" onclick="$('#tb-replyBox-${rowIndex}').toggleClass('d-none')">
                                <i class="fa-solid fa-comment-dots"></i> Phản hồi tiếp
                            </button>
                            
                            <div id="tb-replyBox-${rowIndex}" class="d-none mt-3 p-3 bg-light rounded border border-primary-subtle shadow-sm">
                                <textarea id="tb-txtReply-${rowIndex}" class="form-control mb-2" rows="2" placeholder="Nhập bình luận hoặc ý kiến phản hồi của bạn..."></textarea>
                                <div class="d-flex gap-2 justify-content-end">
                                    <button class="btn btn-sm btn-light border fw-bold" onclick="$('#tb-replyBox-${rowIndex}').addClass('d-none')">Hủy</button>
                                    <button class="btn btn-sm text-white fw-bold" onclick="sendThongBaoReplyChain(${rowIndex})" id="tb-btnSendReply-${rowIndex}" style="background: #0f4c81; border:none;">
                                        <i class="fa-solid fa-paper-plane me-1"></i> Gửi phản hồi
                                    </button>
                                </div>
                            </div>`;
                            
                    // Nếu là Admin thì hiện thêm khung trả lời của Admin
                    if (typeof isAdmin !== 'undefined' && isAdmin) { 
                        html += `
                            <div class="mt-3 p-3 rounded bg-white shadow-sm" style="border: 1px dashed var(--accent-red);">
                                <h6 class="mb-2" style="color: var(--accent-red); font-size: 14px; font-weight: 700;"><i class="fa-solid fa-user-shield"></i> Trả lời vào chuỗi (Admin)</h6>
                                <textarea id="tb-txtAdminReply-${rowIndex}" class="form-control mb-2" rows="2" placeholder="Nhập trả lời dành cho sinh viên..."></textarea>
                                <div class="text-end mt-2">
                                    <button class="btn btn-sm text-white fw-bold" style="background: var(--accent-red);" onclick="sendThongBaoAdminReply(${rowIndex})" id="tb-btnAdminSubmit-${rowIndex}">
                                        <i class="fa-solid fa-reply me-1"></i> Đăng câu trả lời
                                    </button>
                                </div>
                            </div>`; 
                    }
                    
                    html += `</div>`; // Đóng div khung chứa phản hồi tiếp
                    html += `</div>`; // Đóng div khối comment tổng
                }
            });
            
            if (commentCount === 0) {
                html = '<div class="text-center text-muted small py-4 bg-light rounded border border-primary-subtle" style="border-style: dashed !important;"><i class="fa-regular fa-comments fs-3 mb-2 opacity-50"></i><br>Chưa có bình luận nào cho thông báo này.<br>Bạn hãy là người đầu tiên nhé!</div>';
            }
            container.html(html);
            
            // Render toán học & code nếu có
            if (window.Prism) Prism.highlightAllUnder(document.getElementById('tbCommentHistory'));
            if (typeof applyKaTeX === 'function') applyKaTeX('tbCommentHistory');
        },
        error: function() {
            container.html('<div class="text-danger small text-center py-3 bg-white rounded border"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi tải lịch sử bình luận!</div>');
        }
    });
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
        let activeChapterId = 0;
        
        // THÊM 3 DÒNG NÀY VÀO ĐÂY:
        let trackingPartName = "";
        let trackingChapterName = "";
        let trackingLessonName = "";
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
        // Lấy tiêu đề trực tiếp từ dữ liệu dòng đầu tiên trong Sheet (Cột 1, Cột 2, Cột 4)
        let h1 = String(row[0] || 'STT');
        let h2 = String(row[1] || 'Nội dung bài học');
        let h4 = String(row[3] || 'Ghi chú');
        
        headHtml += `<th style="width: 105px;">${h1}</th><th>${h2}</th><th style="width: 250px;">${h4}</th>`;
// THÊM 2 CỘT MỚI: TIẾN ĐỘ & GHI CHÚ
headHtml += `<th style="width: 130px;" class="text-center">Tiến độ</th><th style="width: 120px;" class="text-center">Note cá nhân</th>`;
    }
                    if (isAdmin) headHtml += `<th class="admin-action-col d-none" style="width: 180px; min-width: 180px;">Thao tác</th>`;
                    return; 
                }
                
                // 2. Trích xuất thông tin giảng viên
                if (/mãhọcphần|họcphần|giảngviênphụtrách|emailgiảngviên/.test(fullRowText.replace(/\s+/g, ''))) { 
                    let info = row.filter(cell => String(cell).trim() !== "").join(" <span class='mx-2 text-black-50'>|</span> "); 
                    if(info) instructorInfos.push(info); 
                    return; 
                }
// 3. Trích xuất thẻ bài kiểm tra/minigame
let isSpecialExam = /(đề thi thử|đề demo|minigame tuần|minigame hè|minigame số)/i.test(fullRowText);
if (isSpecialExam) {
    hasExamCards = true; 
    let titleText = String(row[1] || row[0]).trim(); 
    
    // Tách riêng Cột C (Link Game) và Cột D (Link Ảnh)
    let rawColC = String(row[2] || '').trim(); 
    let rawColD = String(row[3] || '').trim(); 
    
    // Tẩy sạch các thẻ hệ thống ở Cột C
    let cleanColC = rawColC.replace(/\[LOAD_WEB\]|\[LOAD_IFRAME\]|\[LOAD_MINIGAME\]|\[MINIGAME\]/gi, '').trim();
    
    // --- SỬA Ở ĐÂY: KHÔNG ÉP BUỘC HTTP/HTTPS NỮA ---
    // Lấy toàn bộ phần nội dung còn lại sau khi tẩy Tag làm đường dẫn
    let linkUrl = cleanColC !== '' ? cleanColC : '#';
    
    // Lấy Link Ảnh từ Cột D (Ưu tiên quét http/https, nếu không có thì lấy luôn text thô)
    let _extRegex = /(https?:\/\/[^\s"']+)/; 
    let imgMatch = rawColD.match(_extRegex);
    let imageUrl = imgMatch ? imgMatch[0] : rawColD;
    
    // Xử lý thumbnail nếu ảnh lấy từ Google Drive
    if (imageUrl.includes("drive.google.com/file/d/")) {
        let matchId = imageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (matchId && matchId[1]) imageUrl = `https://drive.google.com/thumbnail?id=${matchId[1]}&sz=w400`; 
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
                    let trackStr = `${currentSheetName} - Minigame/Đề thi: ${safeTitle}`;

                    let sheetRowIndexDrag = rowIndex + 1;
                    let isDragEnabled = window.isAdminActionsEnabled ? 'true' : 'false';
                    let dragStyleTb = window.isAdminActionsEnabled ? 'cursor: grab;' : '';
                    let dragAttrTb = (isAdmin && window.innerWidth >= 992) ? ` draggable="${isDragEnabled}" ondragstart="handleDragStart(event, ${sheetRowIndexDrag})" ondragover="handleDragOver(event)" ondragenter="handleDragEnter(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, ${sheetRowIndexDrag}, '${currentSheetName}')" style="${dragStyleTb}"` : '';

                    let adminMinigameBtns = '';
                    if (isAdmin) {
                        let escapedCells = row.map(c => String(c || '').replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, "\\n").replace(/\r/g, ""));
                        while(escapedCells.length < 7) escapedCells.push(''); 
                        
                        adminMinigameBtns = `
                        <div class="admin-action-col d-none position-absolute w-100 h-100" style="top: 0; left: 0; z-index: 10; pointer-events: none;">
                            <div class="d-flex flex-column justify-content-center align-items-center gap-2 w-100 h-100 p-2" style="background: rgba(255,255,255,0.85); border-radius: 12px; border: 2px dashed var(--accent-red); pointer-events: auto;" onclick="event.stopPropagation();">
                                <div class="d-flex w-100 justify-content-center gap-2">
                                    <button class="btn btn-sm btn-light border-secondary py-1 px-3 shadow-sm" title="Qua trái" onclick="moveRowItem(${sheetRowIndexDrag}, 'up')"><i class="fa-solid fa-arrow-left"></i></button>
                                    <button class="btn btn-sm btn-light border-secondary py-1 px-3 shadow-sm" title="Qua phải" onclick="moveRowItem(${sheetRowIndexDrag}, 'down')"><i class="fa-solid fa-arrow-right"></i></button>
                                </div>
                                <div class="d-flex w-100 justify-content-center gap-2">
                                    <button class="btn btn-sm btn-warning py-1 px-3 shadow-sm fw-bold text-dark" title="Sửa" onclick="openEditRowModal(${sheetRowIndexDrag}, '${escapedCells[0]}', '${escapedCells[1]}', '${escapedCells[2]}', '${escapedCells[3]}', '${escapedCells[4]}', '${escapedCells[5]}', '${escapedCells[6]}')"><i class="fa-solid fa-pen"></i></button>
                                    <button class="btn btn-sm btn-danger py-1 px-3 shadow-sm fw-bold text-white" title="Xóa" onclick="deleteRowItem(${sheetRowIndexDrag})"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                        </div>`;
                    }

                    // --- BẮT ĐẦU: XỬ LÝ TIẾN ĐỘ & NOTE CHO MINIGAME ---
                   // Tạo một khóa cố định (Stable Key) từ Tên bài học (bỏ hết ký tự đặc biệt)
let stableKey = titleText.replace(/<[^>]*>?/gm, '').replace(/[^a-zA-Z0-9_]/g, '');
if (!stableKey) stableKey = sheetRowIndexDrag; // Dự phòng nếu tên rỗng

// --- BẮT ĐẦU: XỬ LÝ TIẾN ĐỘ & NOTE CHO MINIGAME ---
let mssv = (currentUser && currentUser.mssv) ? currentUser.mssv : 'guest';
// Dùng stableKey thay cho sheetRowIndexDrag
let progVal = localStorage.getItem(`prog_${mssv}_${currentSheetName}_${stableKey}`) || 'white';
let bgProgColor = getProgressColor(progVal);

let noteData = JSON.parse(localStorage.getItem(`note_${mssv}_${currentSheetName}_${stableKey}`));
let hasNote = noteData && noteData.content && noteData.content.trim() !== '';

let noteBtnClass = hasNote ? 'btn-primary text-white' : 'btn-outline-secondary bg-white';
let noteBtnIcon = hasNote ? '<i class="fa-solid fa-clipboard-check fs-6"></i>' : '<i class="fa-regular fa-clipboard fs-6"></i>';

let extraControls = `
<div class="d-flex align-items-center justify-content-between mt-2 gap-2 w-100">
    <select class="form-select form-select-sm fw-bold border-secondary shadow-sm flex-grow-1" style="background-color: ${bgProgColor}; color: #334155; border-radius: 8px; font-size: 12px; cursor: pointer; padding: 2px 10px;" onchange="updateProgress(this, '${currentSheetName}', '${stableKey}')">
        <option value="white" ${progVal === 'white' ? 'selected' : ''}>Chưa làm</option>
        <option value="yellow" ${progVal === 'yellow' ? 'selected' : ''}>Đang làm</option>
        <option value="green" ${progVal === 'green' ? 'selected' : ''}>Đã xong</option>
    </select>
    <button id="btnNote_${stableKey}" class="btn btn-sm ${noteBtnClass} shadow-sm d-inline-flex align-items-center justify-content-center flex-shrink-0" style="border-radius: 8px; width: 30px; height: 26px; padding: 0;" onclick="openPersonalNoteModal('${currentSheetName}', '${stableKey}')" title="${hasNote ? 'Xem ghi chú' : 'Thêm ghi chú'}">
        ${noteBtnIcon}
    </button>
</div>`;
// --- KẾT THÚC ---

                    examCardsHtml += `
                    <div class="position-relative drag-handle-row d-flex flex-column h-100" ${dragAttrTb}>
                        ${adminMinigameBtns}
                        <a href="javascript:void(0)" onclick="setDetailedView('${trackStr}'); openDocumentViewer('${linkUrl}', '${safeTitle}', '${currentSheetName}', '${stableKey}')" class="card-minigame-box flex-grow-1" title="${titleText}" style="margin-bottom: 0;">
                            ${imgDisplayHtml}
                            <div class="card-minigame-title">${titleText}</div>
                        </a>
                        ${extraControls}
                    </div>`;
                    return; 
                }

                // 4. Nhận diện trạng thái "Mới" và Phân cấp Chương/Bài
               let isNewRow = false;
    let rowClass = 'grid-row'; let iconPrefix = '';
    
    let isChapter = false;
    let isLesson = false;
    let isPart = false;

   if (/phần/.test(firstCellText)) { 
        rowClass += ' row-part'; 
        isPart = true; 
        activeChapterId = 0; 
        currentLessonId = 0; 
        
        // Lưu tên Phần (Gộp Cột 1 và Cột 2)
        trackingPartName = `${String(row[0] || '').trim()} ${String(row[1] || '').trim()}`.trim();
        // Reset lại khi sang Phần mới
        trackingChapterName = ""; 
        trackingLessonName = ""; 
    } 
    else if (/chủđề|chương/.test(firstCellText)) { 
        rowClass += ' row-topic is-chapter'; 
        isChapter = true;
        currentChapterId = rowIndex; 
        activeChapterId = rowIndex; 
        currentLessonId = 0; 
        
        // Lưu tên Chủ đề/Chương
        trackingChapterName = `${String(row[0] || '').trim()} ${String(row[1] || '').trim()}`.trim();
        trackingLessonName = ""; // Reset Bài
    } 
    else if (/bài/.test(firstCellText)) { 
        rowClass += ' row-lesson is-lesson'; 
        iconPrefix = '<i class="fa-solid fa-folder-open me-2 text-success"></i>'; 
        isLesson = true;
        currentLessonId = rowIndex; 
        
        // Lưu tên Bài
        trackingLessonName = `${String(row[0] || '').trim()} ${String(row[1] || '').trim()}`.trim();
    }

   let sheetRowIndex = rowIndex + 1;
    let isDragEnabled = window.isAdminActionsEnabled ? 'true' : 'false';
    let dragStyle = window.isAdminActionsEnabled ? 'cursor: grab;' : '';
    let dragAttr = (isAdmin && window.innerWidth >= 992) ? ` draggable="${isDragEnabled}" ondragstart="handleDragStart(event, ${sheetRowIndex})" ondragover="handleDragOver(event)" ondragenter="handleDragEnter(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, ${sheetRowIndex}, '${currentSheetName}')" style="${dragStyle}"` : '';
    
    // LOGIC ĐÃ FIX: Xử lý hiển thị phân cấp (Không ẩn nhầm hàng độc lập)
    let childClass = '';
    let clickEvent = '';

    if (isChapter) {
        clickEvent = ` onclick="toggleChapter(${currentChapterId}, this)" style="cursor: pointer;" title="Bấm để mở rộng"`;
    } else if (isLesson) {
        clickEvent = ` onclick="toggleLesson(${activeChapterId}, ${currentLessonId}, this)" style="cursor: pointer;" title="Bấm để mở rộng"`;
        if (activeChapterId > 0) {
            // Nằm trong Chương -> Ẩn đi chờ mở
            childClass = ` child-of-chapter-${activeChapterId} is-lesson d-none`; 
        } else {
            // Nằm trực tiếp dưới Phần (Không có Chương) -> KHÔNG ẨN
            childClass = ` is-lesson`; 
        }
    } else if (isPart) {
        // Hàng Phần độc lập hoàn toàn, luôn hiện
        childClass = ''; 
    } else {
        // Hàng Nội dung chi tiết
        if (currentLessonId > 0 && activeChapterId > 0) {
            // Nằm trong Bài + Có Chương
            childClass = ` child-of-chapter-${activeChapterId} child-of-lesson-${activeChapterId}-${currentLessonId} d-none`; 
        } else if (currentLessonId > 0 && activeChapterId === 0) {
            // Nằm trong Bài + Không có Chương
            childClass = ` child-of-lesson-0-${currentLessonId} d-none`; 
        } else if (activeChapterId > 0) {
            // Nằm trực tiếp dưới Chương (Không có Bài)
            childClass = ` child-of-chapter-${activeChapterId} direct-chapter-child d-none`; 
        } else {
            // Nằm trực tiếp dưới Phần (Chỉ có nội dung) -> KHÔNG ẨN
            childClass = ''; 
        }
    }

              bodyHtml += `<tr class="${rowClass}${childClass} drag-handle-row"${clickEvent}${dragAttr}>`;
                
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
                    // Tạo Stable Key sớm để truyền vào Iframe
let rawLessonName = String(row[1] || row[0] || '').replace(/<[^>]*>?/gm, '').replace(/[^a-zA-Z0-9_]/g, '');
let stableKey = rawLessonName ? rawLessonName : sheetRowIndex;
                    // Thêm Logo tự động: CHỈ hiện logo file tài liệu cho các hàng nội dung nhỏ bên trong
                    let lessonIcon = ''; 
if (!isChapter && !isLesson && !rowClass.includes('row-part')) {
    lessonIcon = '<i class="fa-solid fa-file-lines me-2" style="color: #0ea5e9; font-size: 16px;"></i>';
}

     // --- LOGIC PHÂN LOẠI HIỂN THỊ: LINK HAY NỘI DUNG LATEX ---
let isLoadWeb = c3.trim().startsWith('[LOAD_WEB]');
let isLoadIframe = c3.trim().startsWith('[LOAD_IFRAME]');
let isLoadMinigame = c3.trim().startsWith('[LOAD_MINIGAME]') || c3.trim().startsWith('[MINIGAME]');
if (isLoadWeb && typeof isTimerActive === 'function' && isTimerActive()) {
    isLoadWeb = false; isLoadIframe = true;
    c3 = c3.replace('[LOAD_WEB]', '[LOAD_IFRAME]');
}

let webFileUrl = isLoadWeb ? c3.trim().replace('[LOAD_WEB]', '').trim() : '';
let iframeFileUrl = isLoadIframe ? c3.trim().replace('[LOAD_IFRAME]', '').trim() : '';
let isLinkOnly = extractedUrl && c3.replace(_urlRegex, '').trim() === '';

// FIX: Bổ sung replace dọn dẹp ký tự xuống dòng (\n, \r) để không làm gãy lệnh onclick
let safeTitle = col2Html.replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, " ").replace(/\r/g, ""); 
let safeUrl = extractedUrl ? extractedUrl.replace(/'/g, "\\'") : ''; 

// TẠO CHUỖI TRACKING ĐA CẤP (Lấy Tên bài thay vì STT)
let trackStr = `${currentSheetName}`; // Tên môn
if (trackingPartName) trackStr += ` - ${trackingPartName}`;       // Phần
if (trackingChapterName) trackStr += ` - ${trackingChapterName}`; // Chương
if (trackingLessonName) trackStr += ` - ${trackingLessonName}`;   // Bài

if (!isChapter && !isLesson && !isPart) {
    let cleanContentName = c2.replace(/<[^>]*>?/gm, '').trim();
    if (cleanContentName) trackStr += ` - ${cleanContentName}`;
}

// FIX: Tránh lỗi SyntaxError khi Tracking Name bị kẹt dấu Enter
let safeTrackStr = trackStr.replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, " ").replace(/\r/g, "");

// THÊM BIẾN NHẬN DIỆN TỪ KHÓA MINIGAME / LÀM ĐỀ THỰC CHIẾN
let isMinigamePrompt = col2Html.toLowerCase().includes('hãy làm đề') || col2Html.toLowerCase().includes('minigame') || col2Html.toLowerCase().includes('hãy tiến hành làm đề') ;

if (isUpdating && !isAdmin) {
    // Trường hợp đang cập nhật
    col2Html = `<span onclick="$('#updatingModal').modal('show'); event.stopPropagation();" style="cursor: pointer; color: #0f4c81; font-weight: 700; text-decoration: none;" title="Đang cập nhật">${lessonIcon}${col2Html || "Đang cập nhật"}</span>`;
} else if (isMinigamePrompt || isLoadMinigame) {
    // TRƯỜNG HỢP MỚI: Nếu chứa từ khóa "hãy làm đề", "minigame" HOẶC có tag [MINIGAME]
    col2Html = `<span onclick="window.scrollTo({ top: 0, behavior: 'smooth' }); $('#collapseMinigames').collapse('show'); event.stopPropagation();" style="cursor: pointer; color: #ef4444; font-weight: 700; text-decoration: none;" title="Nhấn để về đầu trang và mở khung Minigame"><i class="fa-solid fa-gamepad me-2" style="color: #ef4444; font-size: 16px;"></i>${col2Html}</span>`;
} else if (isLoadWeb) {
    // LOAD_WEB: Chèn trực tiếp và phóng to full màn hình ẩn sidebar
    col2Html = `<span onclick="openDirectWeb('${webFileUrl}', '${safeTitle}'); event.stopPropagation();" style="cursor: pointer; color: #0f4c81; font-weight: 700; text-decoration: none;" title="Xem trực tiếp full màn hình">${lessonIcon}${col2Html || "Xem trực tiếp"}</span>`;
} else if (isLoadIframe) {
    // LOAD_IFRAME: Mở bảng Modal Iframe chuẩn y như ảnh mẫu của bạn
    col2Html = `<span onclick="setDetailedView('${safeTrackStr}'); openDocumentViewer('${iframeFileUrl}', '${safeTitle}', '${currentSheetName}', '${stableKey}'); event.stopPropagation();" style="cursor: pointer; color: #0f4c81; font-weight: 700; text-decoration: none;" title="Xem bằng Iframe">${lessonIcon}${col2Html || "Xem Iframe"}</span>`;
} else if (isLinkOnly) {
    // CỘT 3 CHỈ CHỨA LINK -> Mở File Drive/PDF như cũ
  col2Html = `<span onclick="setDetailedView('${safeTrackStr}'); openDocumentViewer('${safeUrl}', '${safeTitle}', '${currentSheetName}', '${stableKey}'); event.stopPropagation();" style="cursor: pointer; color: #0f4c81; font-weight: 700; text-decoration: none;" title="Nhấn để xem tài liệu trực tiếp">${lessonIcon}${col2Html || "Xem tài liệu"}</span>`;
} else if (c3.trim() !== '') {
    // CỘT 3 CÓ CHỨA NỘI DUNG/LATEX -> Bật Modal Xem Chi Tiết
    col2Html = `<span onclick="setDetailedView('${safeTrackStr}'); openLatexContentViewer(${rowIndex}); event.stopPropagation();" style="cursor: pointer; color: #0f4c81; font-weight: 700; text-decoration: none;" title="Nhấn để xem nội dung chi tiết">${lessonIcon}${col2Html || "Xem chi tiết"}</span>`;
} else {
    // TRỐNG HOÀN TOÀN -> Chỉ hiện chữ bình thường không click được
    col2Html = `<span style="color: #0f4c81; font-weight: 700;">${lessonIcon}${col2Html}</span>`;
}
// --- KẾT THÚC CỘT 2 ---
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
                  // Khởi tạo các giá trị Tiến độ & Ghi chú từ localStorage
let mssv = (currentUser && currentUser.mssv) ? currentUser.mssv : 'guest';


let progKey = `prog_${mssv}_${currentSheetName}_${stableKey}`;
let progVal = localStorage.getItem(progKey) || 'white';
let bgProgColor = getProgressColor(progVal);

let noteKey = `note_${mssv}_${currentSheetName}_${stableKey}`;
let noteData = JSON.parse(localStorage.getItem(noteKey));
let hasNote = noteData && noteData.content && noteData.content.trim() !== '';

let noteBtnClass = hasNote ? 'btn-primary text-white' : 'btn-outline-secondary';
let noteBtnIcon = hasNote ? '<i class="fa-solid fa-clipboard-check fs-6"></i>' : '<i class="fa-regular fa-clipboard fs-6"></i>';

let tdProg = '';
let tdNote = '';

// Nhận diện hàng có chữ "Mục tiêu" ở cột STT
let isMucTieu = firstCellText.includes('mụctiêu');

if (isPart || isChapter || isLesson) {
    // 1. Hàng "PHẦN": Ẩn hoàn toàn cả Tiến độ và Ghi chú
    tdProg = '<td></td>';
    tdNote = '<td></td>';
    
} else if (isMucTieu) {
    // 2. Hàng "CHƯƠNG", "BÀI", "MỤC TIÊU": Ẩn Tiến độ, CHỈ HIỆN Ghi chú
    tdProg = '<td></td>';
    tdNote = `<td class="text-center align-middle" style="padding-top: 6px !important; padding-bottom: 6px !important;" onclick="event.stopPropagation();"><button id="btnNote_${stableKey}" class="btn btn-sm ${noteBtnClass} shadow-sm d-inline-flex align-items-center justify-content-center m-0" style="border-radius: 8px; width: 36px; height: 32px; padding: 0;" onclick="openPersonalNoteModal('${currentSheetName}', '${stableKey}')" title="${hasNote ? 'Xem ghi chú' : 'Thêm ghi chú'}">${noteBtnIcon}</button></td>`;
        
} else {
    // 3. Các hàng Nội dung bình thường: Hiển thị đầy đủ cả Tiến độ và Ghi chú
    tdProg = `<td class="text-center align-middle" style="padding-top: 6px !important; padding-bottom: 6px !important;" onclick="event.stopPropagation();"><select class="form-select form-select-sm fw-bold border-secondary shadow-sm m-0" style="background-color: ${bgProgColor}; color: #334155; border-radius: 8px; font-size: 13px; cursor: pointer; padding-top: 2px; padding-bottom: 2px; height: 32px; min-height: 32px;" onchange="updateProgress(this, '${currentSheetName}', '${stableKey}')"><option value="white" ${progVal === 'white' ? 'selected' : ''}>Chưa học</option><option value="yellow" ${progVal === 'yellow' ? 'selected' : ''}>Còn học</option><option value="green" ${progVal === 'green' ? 'selected' : ''}>Đã xong</option></select></td>`;
        
    tdNote = `<td class="text-center align-middle" style="padding-top: 6px !important; padding-bottom: 6px !important;" onclick="event.stopPropagation();"><button id="btnNote_${stableKey}" class="btn btn-sm ${noteBtnClass} shadow-sm d-inline-flex align-items-center justify-content-center m-0" style="border-radius: 8px; width: 36px; height: 32px; padding: 0;" onclick="openPersonalNoteModal('${currentSheetName}', '${stableKey}')" title="${hasNote ? 'Xem ghi chú' : 'Thêm ghi chú'}">${noteBtnIcon}</button></td>`;
}

// Ghép vào các ô TD hiển thị chính
bodyHtml += `<td style="font-weight: 600;">${iconPrefix}${c1}</td>`;
bodyHtml += `<td>${finalCol2}</td>`; 
bodyHtml += `<td>${col4Html}</td>`;
bodyHtml += tdProg;
bodyHtml += tdNote;               }

                // (Đoạn Render nút Admin giữ nguyên...)

                // Render nút Admin
                if (isAdmin) {
                    let escapedCells = row.map(c => String(c || '').replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/\n/g, "\\n").replace(/\r/g, ""));
                    while(escapedCells.length < 7) escapedCells.push(''); 
                    
                    bodyHtml += `<td class="admin-action-col d-none" onclick="event.stopPropagation();"><div class="d-flex flex-wrap gap-1">
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
           if (hasExamCards) {
    $('#examCardsContainer').html(examCardsHtml);
    $('#minigameWrapper').removeClass('d-none');
}
if (instructorInfos.length > 0) { 
    let listContent = ""; 
    instructorInfos.forEach(info => { 
        listContent += `<div class="col-12 col-md-6 mb-2 d-flex align-items-start"><i class="fa-solid fa-check text-primary mt-1 me-2"></i> <span style="font-size: 15px; font-weight: 500; color: var(--text-main);">${info}</span></div>`; 
    }); 
    $('#instructorListContainer').html(listContent);
    $('#instructorWrapper').removeClass('d-none'); 
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
checkNewDatLichGlobal();
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
	checkNewDatLichGlobal();
    fetchAndRenderCategories();
    renderUserInfo();
fetchLearningDataFromServer(); // Đồng bộ tiến độ bài học về máy
	if (currentUser && currentUser.mssv) {
        $.ajax({
            url: SCRIPT_URL + "?action=getUserProfile&mssv=" + currentUser.mssv,
            method: "GET",
            dataType: "json",
            success: function(res) {
                if (res && res.success) {
                    // --- BẮT ĐẦU KIỂM TRA ÉP BUỘC KHẢO SÁT ---
                    let isAdminAcc = (currentUser.mssv === "51.01.108.008" || currentUser.mssv === "5101108008");
                    
                    if (res.isSurveyDone === false && !isAdminAcc) {
                        // Nếu server báo chưa làm (do Admin xóa), thu hồi quyền và đẩy về trang khảo sát ngay lập tức
                        localStorage.removeItem('survey_done_' + currentUser.mssv);
                        window.location.href = "TUD_HK1_2627/khaosat01.html";
                        return; // Ngắt hàm, không render các giao diện khác nữa
                    } else if (res.isSurveyDone === true) {
                        // Khôi phục cờ nếu lỡ bị mất
                        localStorage.setItem('survey_done_' + currentUser.mssv, 'true');
                    }
                    // --- KẾT THÚC KIỂM TRA ---

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
    // Ràng buộc thêm: Phải đúng MSSV của Admin mới cấp quyền
    if (currentUser && (currentUser.mssv === "51.01.108.008" || currentUser.mssv === "5101108008")) {
        isAdmin = true;
        $('#btnAdminLoginToggle').html('<i class="fa-solid fa-unlock text-danger" style="font-size: 16px; width: 20px; text-align: center;"></i> Đăng xuất Admin').css('color', 'var(--accent-red)');
        $('#btnManageCategories').removeClass('d-none');
        renderSidebarCategories();
        $('#adminDatabaseLink').removeClass('d-none');
    } else {
        // Thu hồi quyền và xóa key giả mạo nếu sinh viên cố tình gõ lệnh F12
        isAdmin = false;
        localStorage.removeItem('isAdmin');
    }
}
$(document).ready(function() {
    // Lấy dữ liệu từ localStorage
    currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    
    if (currentUser && !currentUser.isGuest) {
        let isSurveyDone = localStorage.getItem('survey_done_' + currentUser.mssv);
        let isAdminAcc = (currentUser.mssv === "51.01.108.008" || currentUser.mssv === "5101108008");
        
        if (!isSurveyDone && !isAdminAcc) {
            // TẠO CHỐT CHẶN NGẦM: Tận dụng màn hình Loading gốc của web, không vẽ thêm gì cả
            $.ajax({
                url: SCRIPT_URL + "?action=getUserProfile&mssv=" + currentUser.mssv,
                method: "GET",
                dataType: "json",
                success: function(res) {
                    if (res && res.success && res.isSurveyDone) {
                        // Nếu Google Sheets xác nhận ĐÃ LÀM -> Lưu vào máy
                        localStorage.setItem('survey_done_' + currentUser.mssv, 'true');
                        // CHẠY THẲNG VÀO WEB, KHÔNG RELOAD TRANG NỮA ĐỂ TẠO CẢM GIÁC SIÊU MƯỢT
                        initGlobalApp(); 
                    } else {
                        // Nếu CHƯA LÀM -> Đá sang form khảo sát
                        window.location.href = "TUD_HK1_2627/khaosat01.html";
                    }
                },
                error: function() {
                    window.location.href = "TUD_HK1_2627/khaosat01.html";
                }
            });
            return; // Chặn đứng việc load trang chính để chờ kết quả
        }
    }
    
    if (currentUser && (currentUser.mssv === "51.01.108.008" || currentUser.mssv === "5101108008")) {
        isAdmin = false;
        localStorage.setItem('isAdmin', 'false');
        
        $('#btnAdminLoginToggle').html('<i class="fa-solid fa-unlock text-danger" style="font-size: 16px; width: 20px; text-align: center;"></i> Dành cho bản quản trị').css('color', 'var(--accent-red)');
        $('#btnManageCategories').removeClass('d-none');
        $('#adminDatabaseLink').removeClass('d-none');
        $('#btnAdminManageUsers').removeClass('d-none').addClass('d-flex');
        $('#btnAdminMasterTkb').removeClass('d-none').addClass('d-flex');
    }
    
    if (!currentUser) {
        currentUser = {
            mssv: "Khách",
            name: "Khách",
            isGuest: true
        };

        if (window.location.pathname.includes("webduphong")) {
            let modalEl = document.getElementById('userAuthModal');
            if (modalEl) {
                let authModal = new bootstrap.Modal(modalEl);
                authModal.show();
                if (typeof renderSavedAccounts === 'function') renderSavedAccounts();
            }
        } 
        
        initGlobalApp();
    } else { 
        initGlobalApp(); 
    }
});

renderUserInfo

// ==========================================
// TÍNH NĂNG TÍNH ĐIỂM GPA (BẢN CHUẨN CUỐI CÙNG)
// ==========================================
let myGPADataset = JSON.parse(localStorage.getItem('myGPADataset')) || [];
function loadGPAView() {
	/* if (!isAdmin) {
        // Cập nhật nội dung câu chữ vào Bảng Modal #updatingModal có sẵn trong HTML
       $('#updatingModal .modal-body').html(`
            <div class="mb-3">
                <i class="fa-solid fa-calculator" style="font-size: 50px; color: #0f4c81;"></i>
            </div>
            <h5 class="fw-bold mb-2" style="color: #0f4c81;">Tính năng đang được cập nhật!</h5>
            <p class="text-muted mb-4" style="font-size: 14.5px;">Dữ liệu bảng tính điểm <b>GPA Tích lũy</b> đang trong quá trình đồng bộ và hoàn thiện. Bạn vui lòng quay lại sau nhé!</p>
            <button type="button" class="btn fw-bold px-4 py-2 text-white" style="background-color: #0f4c81; border-radius: 50px; box-shadow: 0 4px 10px rgba(15, 76, 129, 0.2);" data-bs-dismiss="modal">Đã rõ</button>
        `);
        
        // Bật Bảng Cửa Sổ Modal nổi lên chính giữa màn hình
        $('#updatingModal').modal('show');
        
        // Trả URL về mặc định (không thêm ?view=gpa)
        if (typeof resetUrlToDefault === 'function') {
            resetUrlToDefault();
        }

        // Đóng Sidebar nếu đang dùng điện thoại
        if (window.innerWidth < 992 && typeof sidebar !== 'undefined' && sidebar) {
            sidebar.classList.remove('show');
            if (typeof overlay !== 'undefined' && overlay) overlay.classList.remove('show');
        }

        return; // DỪNG HOÀN TOÀN: Sinh viên ở nguyên trang hiện tại, không mở trang GPA
    } */  // (Vô hiệu hóa tính năng Đang cập nhật của Kết quả học tập
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
        window.isGpaDataLoaded = true; // MỞ KHÓA BẢO VỆ
        renderGPAList(false); 
        autoSyncTkbToGpa(); // GỌI ĐỒNG BỘ
    },
    error: function() {
        myGPADataset = JSON.parse(localStorage.getItem('myGPADataset_' + currentUser.mssv)) || [];
        window.isGpaDataLoaded = true; // MỞ KHÓA BẢO VỆ
        renderGPAList(false);
        autoSyncTkbToGpa(); // GỌI ĐỒNG BỘ
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
	window.userDetailedView = "";
    originalResetNav();
    $('#btnNavGPA').removeClass('active');
    $('#gpaSection').addClass('d-none');
};

function convertGradeToSystem(score10, type) {
    // Bước 1: Khử sai số dấu phẩy động của JS (VD: 5.449999999999999 -> 5.45)
    let cleanScore = Number(Math.round(score10 + 'e3') + 'e-3');
    
    // Bước 2: Làm tròn chuẩn xác đến 1 chữ số thập phân (VD: 5.45 -> 5.5, 5.44 -> 5.4)
    let roundedScore = Number(Math.round(cleanScore + 'e1') + 'e-1');
    
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

    let t = type || ''; 
    let passed = false;
    
    // Xét điều kiện qua môn
    if (t.startsWith('cn_') || t === 'chuyen_nganh') {
        passed = roundedScore >= 5.5; 
    } else if (t.startsWith('mc_') || t === 'mon_chung') {
        passed = roundedScore >= 4.0; 
    } else if (t.startsWith('gdtc_') || t === 'ngoai_le') {
        passed = roundedScore >= 5.0; 
    } else {
        passed = roundedScore >= 4.0; 
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
                let percentVal = parseFloat(col['percent' + i]);
                if (isNaN(percentVal)) {
                    percentVal = parseFloat(col.percent) || 0;
                }

                if(isNaN(val) || col['score' + i] === '') { 
                    hasAllScores = false; 
                } else {
                    // Nhân 10000 thay vì chia 100 để không sinh ra chuỗi float ảo
                    currentScore10 += (val * 10) * (percentVal * 10) / 10000;
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
                totalAttemptedCredits += creds; 
                
                // Khử sai số tích lũy bằng cách ép tròn 3 chữ số thập phân sau mỗi lần cộng
                totalScore4 = Number(Math.round((totalScore4 + (maxScore4 * creds)) + 'e3') + 'e-3');
                totalScore10 = Number(Math.round((totalScore10 + (maxScore10 * creds)) + 'e3') + 'e-3');
                
                if (course.passed) {
                    totalAccumulatedCredits += creds;
                }
            }
        }
    });

    // Làm tròn 2 chữ số thập phân chuẩn xác cho điểm tổng (VD: 3.145 -> 3.15)
    let gpa4 = "0.00";
    let gpa10 = "0.00";
    if (totalAttemptedCredits > 0) {
        gpa4 = Number(Math.round((totalScore4 / totalAttemptedCredits) + 'e2') + 'e-2').toFixed(2);
        gpa10 = Number(Math.round((totalScore10 / totalAttemptedCredits) + 'e2') + 'e-2').toFixed(2);
    }

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
// 2. HÀM HIỂN THỊ CÁC Ô CARD THỐNG KÊ LÊN GIAO DIỆN (ĐÃ FIX SONG NGÀNH VÀ THÊM XẾP LOẠI)
function renderGPAStats() {
    let statsContainer = $('#gpaStatsArea');
    
    // Hàm phụ trợ tính Xếp loại Tốt nghiệp
    function getRank(stats) {
        // Nếu chưa có điểm hoặc chưa có tín chỉ nào thì trả về "-" (Chưa xếp loại)
        if (stats.gpa4 === "0.00" && stats.gpa10 === "0.00" && stats.credits === 0) {
            return "-"; 
        }
        
        let score = parseFloat(stats.gpa4);
        if (isNaN(score)) return "-";
        if (score >= 3.6) return "Xuất sắc";
        if (score >= 3.2) return "Giỏi";
        if (score >= 2.5) return "Khá";
        if (score >= 2.0) return "Trung bình";
        if (score >= 1.0) return "Yếu";
        return "Kém";
    }

    // NẾU BẬT SONG NGÀNH VÀ ĐANG XEM TAB "TẤT CẢ" -> HIỂN THỊ CHIA ĐÔI
    if (gpaConfig.isDoubleMajor && currentMajorFilter === 'all') {
        let ds1 = myGPADataset.filter(c => {
            let m = c.majors || ['1'];
            if (c.type === 'mon_chung' || c.type === 'ngoai_le') m = ['1', '2'];
            return m.includes('1');
        });
        
        let ds2 = myGPADataset.filter(c => {
            let m = c.majors || ['1'];
            if (c.type === 'mon_chung' || c.type === 'ngoai_le') m = ['1', '2'];
            return m.includes('2');
        });

        let s1 = computeStatsForDataset(ds1);
        let s2 = computeStatsForDataset(ds2);

        let n1 = gpaConfig.name1;
        let n2 = gpaConfig.name2;

        // Truyền cả object điểm vào hàm getRank
        let rank1 = getRank(s1);
        let rank2 = getRank(s2);

        let html = `
            <div class="col-md-6 col-lg-3">
                <div class="online-card text-center shadow-sm border px-2 py-3 h-100">
                    <h6 class="text-muted fw-bold mb-3">GPA (Hệ 4.0)</h6>
                    <div class="d-flex justify-content-center align-items-center">
                        <div class="w-50 text-center"><h3 class="text-danger fw-bold m-0">${s1.gpa4}</h3><small class="text-muted d-block text-truncate mt-1" style="font-size: 11px;">${n1}</small></div>
                        <div style="width: 1px; height: 35px; background-color: #e2e8f0; margin: 0 10px;"></div>
                        <div class="w-50 text-center"><h3 class="text-danger fw-bold m-0">${s2.gpa4}</h3><small class="text-muted d-block text-truncate mt-1" style="font-size: 11px;">${n2}</small></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3">
                <div class="online-card text-center shadow-sm border px-2 py-3 h-100">
                    <h6 class="text-muted fw-bold mb-3">Trung bình (Hệ 10)</h6>
                    <div class="d-flex justify-content-center align-items-center">
                        <div class="w-50 text-center"><h3 class="text-primary fw-bold m-0">${s1.gpa10}</h3><small class="text-muted d-block text-truncate mt-1" style="font-size: 11px;">${n1}</small></div>
                        <div style="width: 1px; height: 35px; background-color: #e2e8f0; margin: 0 10px;"></div>
                        <div class="w-50 text-center"><h3 class="text-primary fw-bold m-0">${s2.gpa10}</h3><small class="text-muted d-block text-truncate mt-1" style="font-size: 11px;">${n2}</small></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3">
                <div class="online-card text-center shadow-sm border px-2 py-3 h-100">
                    <h6 class="text-muted fw-bold mb-3">Tín chỉ (Đã qua)</h6>
                    <div class="d-flex justify-content-center align-items-center">
                        <div class="w-50 text-center"><h3 class="text-success fw-bold m-0">${s1.credits}</h3><small class="text-muted d-block text-truncate mt-1" style="font-size: 11px;">${n1}</small></div>
                        <div style="width: 1px; height: 35px; background-color: #e2e8f0; margin: 0 10px;"></div>
                        <div class="w-50 text-center"><h3 class="text-success fw-bold m-0">${s2.credits}</h3><small class="text-muted d-block text-truncate mt-1" style="font-size: 11px;">${n2}</small></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3">
                <div class="online-card text-center shadow-sm border px-2 py-3 h-100">
                    <h6 class="text-muted fw-bold mb-3">Xếp loại Tốt nghiệp</h6>
                    <div class="d-flex justify-content-center align-items-center">
                        <div class="w-50 text-center"><h4 class="text-info fw-bold m-0" style="font-size: 20px;">${rank1}</h4><small class="text-muted d-block text-truncate mt-1" style="font-size: 11px;">${n1}</small></div>
                        <div style="width: 1px; height: 35px; background-color: #e2e8f0; margin: 0 10px;"></div>
                        <div class="w-50 text-center"><h4 class="text-info fw-bold m-0" style="font-size: 20px;">${rank2}</h4><small class="text-muted d-block text-truncate mt-1" style="font-size: 11px;">${n2}</small></div>
                    </div>
                </div>
            </div>
        `;
        statsContainer.html(html);
    } else {
        // HIỂN THỊ 1 GIÁ TRỊ (Khi không bật Song ngành hoặc đang click Lọc xem 1 ngành cụ thể)
        let displayDataset = myGPADataset.filter(c => {
            let cMajors = c.majors || ['1']; 
            if (c.type === 'mon_chung' || c.type === 'ngoai_le') cMajors = ['1', '2'];

            if (currentMajorFilter === 'all') return true;
            if (currentMajorFilter === '1') return cMajors.includes('1');
            if (currentMajorFilter === '2') return cMajors.includes('2');
            return true;
        });
        
        let s = computeStatsForDataset(displayDataset);
        let rank = getRank(s); // Truyền đối tượng s vào
        
        let labelSuffix = "";
        if (gpaConfig.isDoubleMajor && currentMajorFilter === '1') labelSuffix = `<br><span class="badge bg-primary mt-2" style="font-size:10px;">${gpaConfig.name1}</span>`;
        if (gpaConfig.isDoubleMajor && currentMajorFilter === '2') labelSuffix = `<br><span class="badge bg-success mt-2" style="font-size:10px;">${gpaConfig.name2}</span>`;

        let html = `
            <div class="col-md-6 col-lg-3">
                <div class="online-card text-center shadow-sm border h-100 d-flex flex-column justify-content-center">
                    <h6 class="text-muted fw-bold mb-2">GPA (Hệ 4.0)</h6>
                    <h2 class="text-danger fw-bold m-0">${s.gpa4}</h2>
                    ${labelSuffix}
                </div>
            </div>
            <div class="col-md-6 col-lg-3">
                <div class="online-card text-center shadow-sm border h-100 d-flex flex-column justify-content-center">
                    <h6 class="text-muted fw-bold mb-2">Trung bình (Hệ 10)</h6>
                    <h2 class="text-primary fw-bold m-0">${s.gpa10}</h2>
                    ${labelSuffix}
                </div>
            </div>
            <div class="col-md-6 col-lg-3">
                <div class="online-card text-center shadow-sm border h-100 d-flex flex-column justify-content-center">
                    <h6 class="text-muted fw-bold mb-2">Tín chỉ tích lũy (Đã qua)</h6>
                    <h2 class="text-success fw-bold m-0">${s.credits}</h2>
                    ${labelSuffix}
                </div>
            </div>
            <div class="col-md-6 col-lg-3">
                <div class="online-card text-center shadow-sm border h-100 d-flex flex-column justify-content-center">
                    <h6 class="text-muted fw-bold mb-2">Xếp loại Tốt nghiệp</h6>
                    <h2 class="text-info fw-bold m-0">${rank}</h2>
                    ${labelSuffix}
                </div>
            </div>
        `;
        statsContainer.html(html);
    }
}
// Cờ khóa bảo vệ dữ liệu (Ngăn ghi đè khi chưa tải xong)
window.isGpaDataLoaded = false;

// 1. Hàm trích xuất mã gốc (VD: "2611COMP101301" -> "COMP1013")
function extractBaseCourseCode(classId) {
    if (!classId) return null;
    let upperClassId = String(classId).toUpperCase();

    // ƯU TIÊN 1: Quét trực tiếp xem chuỗi nhập vào có chứa mã học phần nào trong kho CSDL không
    if (typeof SYSTEM_COURSE_DATABASE !== 'undefined') {
        for (let course of SYSTEM_COURSE_DATABASE) {
            if (course.code && upperClassId.includes(course.code.toUpperCase())) {
                // Chỉ cần trong chuỗi có chứa mã nguyên vẹn không bị tách rời là lấy luôn
                return course.code.toUpperCase();
            }
        }
    }

    // ƯU TIÊN 2: Dự phòng bằng Regex (Bắt 3-4 chữ cái đi liền 3-4 chữ số ở bất kỳ vị trí nào)
    let match = upperClassId.match(/[A-Z]{3,4}\d{3,4}/);
    return match ? match[0] : null;
}
// 2. Hàm Đồng bộ TKB sang Bảng điểm GPA (CHỈ THÊM MỚI, KHÔNG XÓA)
function autoSyncTkbToGpa() {
    // BẢO VỆ 1: Khóa an toàn - Tránh ghi đè khi GPA chưa tải xong từ Server
    if (typeof globalTkbData === 'undefined' || typeof myGPADataset === 'undefined') return;
    if (!window.isGpaDataLoaded) return; 

    let tkbCourseCounts = {};
    
    // Đếm số lần xuất hiện của các mã học phần trong Lịch học
    globalTkbData.forEach(course => {
        let baseCode = extractBaseCourseCode(course.classId);
        if (baseCode) {
            tkbCourseCounts[baseCode] = (tkbCourseCounts[baseCode] || 0) + 1;
        }
    });

    let isGpaChanged = false;

    // BẢO VỆ 2: CHỈ THÊM MỚI HOẶC CẬP NHẬT CỜ LẦN 2, TUYỆT ĐỐI KHÔNG XÓA DỮ LIỆU CŨ ("Tạo 1 lần")
    for (let code in tkbCourseCounts) {
        let count = tkbCourseCounts[code];
        let existingIndex = myGPADataset.findIndex(c => c.code === code);

        if (existingIndex === -1) {
            // Tình huống 1: Chưa có -> Tạo mới hoàn toàn với 2 cột mặc định
            let courseTemplate = SYSTEM_COURSE_DATABASE.find(c => c.code === code);
            if (courseTemplate) {
                let newCourse = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    code: courseTemplate.code,
                    name: courseTemplate.name,
                    credits: courseTemplate.credits,
                    type: courseTemplate.type,
                    note: courseTemplate.groupNote || "Đồng bộ từ Lịch học",
                    columns: [
                        { name: "Quá trình", percent1: "", score1: "", percent2: "", score2: "", percent3: "", score3: "" },
                        { name: "Cuối kỳ", percent1: "", score1: "", percent2: "", score2: "", percent3: "", score3: "" }
                    ],
                    majors: ['1'],
                    isAutoRetake: count >= 2 
                };
                myGPADataset.push(newCourse);
                isGpaChanged = true;
            }
        } else {
            // Tình huống 2: Đã có -> Tuyệt đối giữ nguyên Dữ liệu, chỉ cập nhật cờ Học cải thiện (nếu trùng TKB 2 lần)
            let currentRetakeStatus = myGPADataset[existingIndex].isAutoRetake;
            if (count >= 2 && !currentRetakeStatus) {
                myGPADataset[existingIndex].isAutoRetake = true;
                isGpaChanged = true;
            } else if (count < 2 && currentRetakeStatus) {
                myGPADataset[existingIndex].isAutoRetake = false;
                isGpaChanged = true;
            }
        }
    }

    // Nếu có môn mới được thêm vào, tự động lưu lên Server và vẽ lại bảng
    if (isGpaChanged) {
        renderGPAList(true); 
    }
}
// 2. Hàm kiểm tra xem sinh viên đã nhập điểm chưa
// 2. Hàm kiểm tra xem sinh viên đã can thiệp vào dữ liệu chưa (Bản nâng cấp)
function hasUserEnteredData(course) {
    if (!course || !course.columns) return false;
    
    // a. Nếu người dùng thêm hoặc xóa bớt cột -> Chắc chắn đã can thiệp
    if (course.columns.length !== 2) return true;

    // Danh sách các tên cột mặc định hệ thống tự tạo
    const defaultNames = ["Quá trình", "Cuối kỳ", "Cột 1", "Cột 2"];
    let isModified = false;

    course.columns.forEach(col => {
        // b. Kiểm tra Tên cột có bị thay đổi không
        if (col.name && !defaultNames.includes(col.name.trim())) {
            isModified = true;
        }

        // c. Kiểm tra đã nhập Tỷ lệ % chưa
        if (col.percent1 !== undefined && col.percent1.toString().trim() !== "") isModified = true;
        if (col.percent2 !== undefined && col.percent2.toString().trim() !== "") isModified = true;
        if (col.percent3 !== undefined && col.percent3.toString().trim() !== "") isModified = true;
        if (col.percent !== undefined && col.percent.toString().trim() !== "") isModified = true; // Dành cho dữ liệu cũ

        // d. Kiểm tra đã nhập Điểm số chưa
        if (col.score1 !== undefined && col.score1.toString().trim() !== "") isModified = true;
        if (col.score2 !== undefined && col.score2.toString().trim() !== "") isModified = true;
        if (col.score3 !== undefined && col.score3.toString().trim() !== "") isModified = true;
    });

    return isModified;
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

   // Tự động bật nếu có nhập điểm Lần 2, Lần 3 HOẶC được đánh dấu là Học cải thiện từ TKB
let hasRetake = course.isAutoRetake || course.columns.some(col => (col.score2 && col.score2 !== '') || (col.score3 && col.score3 !== ''));
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
    $('#btnNavDatLich').removeClass('active');
    $('#tongHopSection').addClass('d-none'); 
    $('#courseSection').addClass('d-none');
    $('#qaSection').addClass('d-none'); 
    $('#tkbSection').addClass('d-none');
    $('#shareCodeSection').addClass('d-none'); 
    $('#gpaSection').addClass('d-none');
    $('#profileSection').addClass('d-none');
	$('#datLichSection').addClass('d-none');
$('#customHtmlSection').addClass('d-none');
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

// Cập nhật lại các hàm handleDrag và handleDrop (Khoảng dòng 914)
window.handleDragStart = function(e, index) {
    if (!window.isAdminActionsEnabled) {
        e.preventDefault();
        return;
    }
    dragSourceIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
    
    setTimeout(() => {
        $(e.target).closest('.drag-handle-row').css('opacity', '0.4');
    }, 0);
};

window.handleDragOver = function(e) {
    if (!window.isAdminActionsEnabled) return true;
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
    return false;
};

window.handleDragEnter = function(e) {
    if (!window.isAdminActionsEnabled) return;
    e.preventDefault();
    let row = $(e.target).closest('.drag-handle-row');
    if (row.length) row.css('border-top', '3px solid var(--accent-red)');
};

window.handleDragLeave = function(e) {
    let row = $(e.target).closest('.drag-handle-row');
    if (row.length) row.css('border-top', '');
};

window.handleDrop = function(e, targetIndex, sheetName) {
    if (!window.isAdminActionsEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    let row = $(e.target).closest('.drag-handle-row');
    if (row.length) row.css('border-top', '');
    $('.drag-handle-row').css('opacity', '1');

    if (dragSourceIndex === -1 || dragSourceIndex === targetIndex) return;
    
    $('#loadingStatus').removeClass('d-none');
    $('#tableWrapper').addClass('d-none');

    postToGAS({
        action: "dragDropSheetRow",
        sheetName: sheetName,
        fromIndex: dragSourceIndex,
        toIndex: targetIndex
    }, function(res) {
        loadDataByHocPhan(sheetName);
    }, function() {
        alert("Lỗi khi kéo thả di chuyển!");
        loadDataByHocPhan(sheetName);
    });
};
// Khởi tạo âm thanh thông báo ngắn (Thay thế đoạn cũ)
const warningExitSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2866/2866-preview.mp3'); 
// Tuyệt đối không dùng warningExitSound.loop = true;

// Chặn phím F11 khi đang có hẹn giờ và ép toàn màn hình
document.addEventListener('keydown', function(e) {
    if (e.key === 'F11') {
        if (isEnforcedFullscreen && isTimerActive()) {
            e.preventDefault(); // Chặn thoát toàn màn hình mặc định
            
            // Phát chuông cảnh báo
            warningExitSound.play().catch(err => console.log("Trình duyệt chặn phát âm thanh:", err));
            
            // Hiện bảng cảnh báo màu vàng
            $('#closeWarningModal').modal('show'); 
        }
    }
});
document.addEventListener('fullscreenchange', function(e) {
    // Nếu màn hình không còn ở chế độ fullscreen, mà hẹn giờ vẫn chạy và chưa ấn Đồng ý thoát
    if (!document.fullscreenElement && isEnforcedFullscreen && isTimerActive() && !allowLessonClose) {
        // Phát chuông
        warningExitSound.play().catch(err => console.log("Trình duyệt chặn phát âm thanh:", err));
        
        // Hiện bảng ép quay lại học tập (đã có sẵn trong hệ thống của bạn)
        $('#returnStudyModal').modal('show'); 
    }
});
window.addEventListener('beforeunload', function (e) {
    if (isTimerActive()) {
        // Hủy thao tác đóng tab và hiển thị cảnh báo
        e.preventDefault();
        e.returnValue = 'Đồng hồ hẹn giờ đang chạy. Bạn có chắc chắn muốn rời khỏi trang và gián đoạn quá trình học?';
        return e.returnValue;
    }
});
// Cứu cánh hiệu ứng khi kéo thả thất bại
document.addEventListener("dragend", function(e) {
    $('.drag-handle-row').css('opacity', '1');
    $('.drag-handle-row').css('border-top', '');
});

// HÀM ĐIỀU KHIỂN THU GỌN / MỞ RỘNG (CHƯƠNG)
window.toggleChapter = function(chapterId, rowElement) {
    let chevronIcon = $(rowElement).find('.fa-chevron-down');
    let isExpanded = $(rowElement).hasClass('expanded');
    
    if (!isExpanded) {
        // Mở rộng Chương
        $(rowElement).addClass('expanded');
        chevronIcon.css('transform', 'rotate(0deg)');
        
        // Hiện các Bài thuộc chương này
        $(`.child-of-chapter-${chapterId}.is-lesson`).removeClass('d-none');
        $(`.child-of-chapter-${chapterId}.direct-chapter-child`).removeClass('d-none');
    } else {
        // Thu gọn Chương
        $(rowElement).removeClass('expanded');
        chevronIcon.css('transform', 'rotate(-90deg)');
        
        // Ẩn tất cả Bài và Nội dung bên trong Chương này
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
$('#latexViewerModal').on('hide.bs.modal', function (e) {
        if (isEnforcedFullscreen && isTimerActive() && !allowLessonClose) {
            e.preventDefault(); // Chặn Iframe không bị đóng
            $('#closeWarningModal').modal('show'); // Chỉ hiện bảng VÀNG cảnh báo đóng
        }
    });

    $('#latexViewerModal').on('hidden.bs.modal', function () {
        isEnforcedFullscreen = false;
        allowLessonClose = false; 
        exitFullScreen();
    });

    // ========================================================
    // 2. ĐÁNH CHẶN CLICK VÀO LINK CHATGPT, GEMINI TRONG BẢNG LATEX
    // ========================================================
    $('#latexViewerModal').on('click', 'a[target="_blank"]', function(e) {
        if (isEnforcedFullscreen && isTimerActive()) {
            e.preventDefault(); // Chặn mở tab ngay lập tức
            
            let url = $(this).attr('href');
            if (url && url !== '#') {
                pendingUrlToOpen = url;
                $('#linkWarningModal').modal('show'); // Chỉ hiện bảng VÀNG cảnh báo link
            }
        }
    });

    // ========================================================
    // 3. ĐÁNH CHẶN CLICK CHUYỂN MENU NHƯNG TRỪ NÚT CÔNG CỤ (Sửa lại danh sách)
    // ========================================================
    $(document).off('click', 'a, button, .btn-course'); // Xóa sự kiện cũ để tránh trùng lặp
    $(document).on('click', 'a, button, .btn-course', function(e) {
        if (isEnforcedFullscreen && isTimerActive()) {
            // BỔ SUNG #latexViewerModal VÀO VÙNG AN TOÀN ĐỂ KHÔNG HIỆN BẢNG ĐỎ KHI BẤM "CÔNG CỤ"
            if ($(this).closest('#documentViewerModal, #latexViewerModal, #linkWarningModal, #closeWarningModal, #returnStudyModal, #sidebarCodeViewerModal').length > 0) return; 

            e.preventDefault();
            e.stopImmediatePropagation();
            $('#returnStudyModal').modal('show'); // Hiện bảng ĐỎ
            return false;
        }
    });
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
    <span class="mini-dl-emoji align-self-start mt-1">${emoji}</span> <!-- Căn emoji lên trên cùng nếu chữ nhiều dòng -->
    <div class="text-wrap" style="word-break: break-word;"> <!-- Thay text-truncate bằng text-wrap -->
        <span class="fw-bold mini-dl-title">${cleanTitle}</span>
        <small class="mini-dl-time ms-2 d-inline-block mt-1 mb-1"><i class="fa-regular fa-clock me-1"></i>${d.duration || d.dateStart}</small>
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
// HÀM TẠO KHÓA CỐ ĐỊNH ĐỂ CHỐNG LỖI NHẢY DỮ LIỆU KHI XÓA DÒNG
function getDlKey(item) {
    // Nếu là dữ liệu hệ thống (có chữ SYS_) thì bản thân nó đã cố định
    if (item.isSystem || String(item.sheetRowIndex).startsWith('SYS_')) {
        return String(item.sheetRowIndex);
    }
    // Lấy tiêu đề và ngày (hỗ trợ cả format của TKB và Deadline)
    let rawTitle = item.title || item.mon || ""; 
    let rawDate = item.dateStart || item.ngayBatDau || "";
    let rawStr = rawTitle + "_" + rawDate;
    
    // Xóa bỏ mọi ký tự đặc biệt, chỉ giữ lại chữ và số
    let key = rawStr.replace(/[^a-zA-Z0-9]/g, '');
    return key ? "DL_" + key : String(item.sheetRowIndex);
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
    
    // --- BỔ SUNG: Ép hệ thống ghi nhận Lịch sử truy cập ---
    if (typeof window.setDetailedView === 'function') {
        window.setDetailedView("Hồ sơ cá nhân");
    } else {
        window.userDetailedView = "Hồ sơ cá nhân";
    }
    // -------------------------------------------------------
    
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
// Hàm làm mới dữ liệu cho Thông báo và các Danh mục học phần
function refreshCurrentCourseData() {
    if (!currentSheetName) {
        currentSheetName = 'Thông báo';
    }
    
    // Xóa cache cục bộ của sheet hiện tại trên cả RAM và SessionStorage
    if (window.boNhoDemHocPhan && window.boNhoDemHocPhan[currentSheetName]) {
        delete window.boNhoDemHocPhan[currentSheetName];
        sessionStorage.setItem('boNhoDemHocPhan_Cache', JSON.stringify(window.boNhoDemHocPhan));
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
// =========================================================================
// TÍNH NĂNG: ĐỒNG HỒ ĐẾM NGƯỢC ĐỒNG BỘ (FOOTER + IFRAME TÀI LIỆU + IFRAME LATEX)
// =========================================================================

let userCountdownInterval = null;

// 1. Kích hoạt bộ đếm ngược
function startUserCountdown() {
    let hrs = parseInt($('#txtCountHours').val()) || 0;
    let mins = parseInt($('#txtCountMinutes').val()) || 0;
    let secs = parseInt($('#txtCountSeconds').val()) || 0;
    let totalSeconds = (hrs * 3600) + (mins * 60) + secs;

    if (totalSeconds <= 0) {
        alert("Vui lòng chọn thời gian hẹn giờ (Giờ, Phút hoặc Giây lớn hơn 0)!");
        $('#txtCountMinutes').focus();
        return;
    }

    let targetTime = Date.now() + (totalSeconds * 1000);
    localStorage.setItem('user_countdown_target', targetTime.toString());
    localStorage.removeItem('user_countdown_triggered');
    updateCountdownUI();
}

// 2. Hủy bộ đếm ngược
function cancelUserCountdown() {
    localStorage.removeItem('user_countdown_target');
    localStorage.removeItem('user_countdown_triggered');
    localStorage.removeItem('user_countdown_paused_remaining'); // THÊM DÒNG NÀY

    if (userCountdownInterval) clearInterval(userCountdownInterval);
    
    // Ẩn Form ở Footer
    $('#countdownSetupArea').removeClass('d-none');
    $('#countdownDisplayArea').addClass('d-none');
    $('#txtCountHours, #txtCountMinutes, #txtCountSeconds').val('');
    
    // Ép ẩn đồng hồ trên 2 thanh IFRAME
    $('#viewerCountdownClock, #latexCountdownClock').removeClass('d-flex align-items-center').addClass('d-none');
}

// 3. Cập nhật giao diện đếm ngược mỗi giây
function updateCountdownUI() {
    let targetStr = localStorage.getItem('user_countdown_target');
    let pausedStr = localStorage.getItem('user_countdown_paused_remaining');

    if (!targetStr && !pausedStr) {
        $('#countdownSetupArea').removeClass('d-none');
        $('#countdownDisplayArea').addClass('d-none');
        $('#viewerCountdownClock, #latexCountdownClock').removeClass('d-flex align-items-center').addClass('d-none');
        if (userCountdownInterval) clearInterval(userCountdownInterval);
        return;
    }

    // Ép hiển thị đồng hồ trên Footer và 2 thanh IFRAME
    $('#countdownSetupArea').addClass('d-none');
    $('#countdownDisplayArea').removeClass('d-none');
    $('#viewerCountdownClock, #latexCountdownClock').removeClass('d-none').addClass('d-flex align-items-center');

    // Nếu đang trong trạng thái tạm ngưng thì gọi UI Tĩnh
    if (pausedStr) {
        updatePausedUI(parseInt(pausedStr));
        return;
    }

    // Nếu đang chạy
    $('.btn-countdown-pause i').removeClass('fa-play').addClass('fa-pause');
    $('.fa-stopwatch').addClass('fa-spin-slow');

    let targetTime = parseInt(targetStr);
    if (userCountdownInterval) clearInterval(userCountdownInterval);

    function tick() {
        let now = Date.now();
        let distance = targetTime - now;

        if (distance <= 0) {
            clearInterval(userCountdownInterval);
            $('#lblCountdownClock, #lblViewerCountdownClock, #lblLatexCountdownClock').text("00:00:00");
            
            if (!localStorage.getItem('user_countdown_triggered')) {
                localStorage.setItem('user_countdown_triggered', 'true');
                triggerTimeUpAlert();
            }
            setTimeout(() => { cancelUserCountdown(); }, 3000);
        } else {
            let hours = Math.floor(distance / (1000 * 60 * 60));
            let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            let seconds = Math.floor((distance % (1000 * 60)) / 1000);
            let pad = n => String(n).padStart(2, '0');
            let displayStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

            $('#lblCountdownClock, #lblViewerCountdownClock, #lblLatexCountdownClock').text(displayStr);
        }
    }
    tick();
    userCountdownInterval = setInterval(tick, 1000);
}

// 4. Lắng nghe đồng bộ Tab
window.addEventListener('storage', function(e) {
    if (e.key === 'user_countdown_target' || e.key === 'user_countdown_paused_remaining') {
        updateCountdownUI();
    }
    if (e.key === 'user_countdown_triggered' && e.newValue === 'true') {
        triggerTimeUpAlert();
    }
});

$(document).ready(function() { updateCountdownUI(); });


$(document).ready(function() {
    window.boNhoDemHocPhan = JSON.parse(sessionStorage.getItem('boNhoDemHocPhan_Cache')) || {};

    const originalAjax = $.ajax;
    $.ajax = function(settings) {
        if (settings && settings.url && settings.url.includes("action=getHocPhanData")) {
            let match = settings.url.match(/sheetName=([^&]+)/);
            let sheet = match ? decodeURIComponent(match[1]) : null;
            
            // BỘ LỌC 1: Chỉ nhả dữ liệu ra nếu nó thực sự là một Mảng (Array) hợp lệ
            if (sheet && window.boNhoDemHocPhan[sheet] && Array.isArray(window.boNhoDemHocPhan[sheet]) && typeof isAdmin !== 'undefined' && !isAdmin) {
                setTimeout(() => { if (settings.success) settings.success(window.boNhoDemHocPhan[sheet]); }, 10);
                // Trả về object giả lập để jQuery không bị sập
                return { done: function(cb){ cb(window.boNhoDemHocPhan[sheet]); return this; }, fail: function(){ return this; }, always: function(cb){ cb(); return this; } }; 
            }
            
            let oldSuccess = settings.success;
            settings.success = function(data) {
                // BỘ LỌC 2: Chỉ lưu vào bộ nhớ nếu Google trả về đúng danh sách (Không lưu rác/lỗi)
                if (sheet && Array.isArray(data)) {
                    window.boNhoDemHocPhan[sheet] = data;
                    try {
                        sessionStorage.setItem('boNhoDemHocPhan_Cache', JSON.stringify(window.boNhoDemHocPhan));
                    } catch(e) {}
                }
                if (oldSuccess) oldSuccess(data);
            };
        }
        return originalAjax.apply(this, arguments);
    };

    function batDauTaiNgam() {
        if (typeof globalCategories !== 'undefined' && globalCategories.length > 0 && typeof isAdmin !== 'undefined' && !isAdmin) {
            globalCategories.forEach((sheetName, index) => {
                let lower = sheetName.toLowerCase();
                if (['thông báo', 'users', 'cauhinhhocky', 'mastertkb'].includes(lower)) return;

                // Chỉ tải nếu chưa có hoặc dữ liệu bị lỗi
                if (window.boNhoDemHocPhan[sheetName] && Array.isArray(window.boNhoDemHocPhan[sheetName])) return;

                setTimeout(() => {
                    originalAjax({
                        url: SCRIPT_URL + "?action=getHocPhanData&sheetName=" + encodeURIComponent(sheetName),
                        method: "GET",
                        dataType: "json",
                        success: function(data) {
                            if(Array.isArray(data)) {
                                window.boNhoDemHocPhan[sheetName] = data; 
                                sessionStorage.setItem('boNhoDemHocPhan_Cache', JSON.stringify(window.boNhoDemHocPhan));
                            }
                        }
                    });
                }, index * 2500); 
            });
        } else {
            setTimeout(batDauTaiNgam, 2000);
        }
    }
    setTimeout(batDauTaiNgam, 3000);
});
window.datLichCache = [];

// 1. Hàm chuyển sang màn hình Giao diện Đặt lịch hẹn
window.loadDatLichHenView = function() {
    document.title = "Đặt lịch hẹn | Học nhóm APMA Khoa Toán";
    resetNavActive(); 
    $('#btnNavShareCode').addClass('active'); // Đổi từ btnNavDatLich sang btnNavShareCode
    $('#datLichSection').removeClass('d-none');
    
    // THÊM DÒNG NÀY ĐỂ GHI NHẬN ĐÚNG LỊCH SỬ TRUY CẬP:
    if (typeof window.setDetailedView === 'function') window.setDetailedView("Thảo luận - Đặt lịch hẹn");
    
    updateSystemUrl('view', 'datlich'); // Đổi URL thành ?view=datlich
    if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); }
    
    closeFormDatLich();
    loadDatLichData();
};

// 2. Tải dữ liệu từ Google Sheets
function loadDatLichData() {
    $('#datLichTableBody').html('<tr><td colspan="3" class="text-center py-5 text-muted"><i class="fa-solid fa-spinner fa-spin fs-2 mb-2"></i><br>Đang tải danh sách...</td></tr>');
    
    $.ajax({
        url: SCRIPT_URL + "?action=getDatLichHenData",
        method: "GET",
        dataType: "json",
        success: function(data) {
            window.datLichCache = data || [];
            renderDatLichTable();
        },
        error: function() {
            $('#datLichTableBody').html('<tr><td colspan="3" class="text-center text-danger py-5"><i class="fa-solid fa-triangle-exclamation fs-3 mb-2"></i><br>Không thể tải dữ liệu!</td></tr>');
        }
    });
}

// Thêm hàm bật/tắt ô nhập tay nội dung "Khác"
window.toggleDatLichKhac = function() {
    if ($('#selDatLichNoiDung').val() === 'Khác') {
        $('#txtDatLichNoiDungKhac').removeClass('d-none').focus();
    } else {
        $('#txtDatLichNoiDungKhac').addClass('d-none').val('');
    }
};

// Cập nhật hàm Render Bảng
function renderDatLichTable() {
    let tbody = $('#datLichTableBody');
    let data = window.datLichCache;

    if (!data || data.length === 0) {
        tbody.html('<tr><td colspan="4" class="text-center py-5 text-muted"><i class="fa-regular fa-calendar-xmark fs-2 mb-2"></i><br>Chưa có bài đăng nào.</td></tr>');
        return;
    }

    let html = '';
    data.forEach((item, index) => {
        let isOwnerOrAdmin = isAdmin || (currentUser && currentUser.mssv && (currentUser.mssv === item.mssv || currentUser.mssv === "51.01.108.008"));
        
        let actionButtons = '';
        if (isOwnerOrAdmin) {
            actionButtons = `
                <button class="btn btn-sm btn-outline-warning py-1 px-3 fw-bold me-1" onclick="editDatLichPost(${index})"><i class="fa-solid fa-pen me-1"></i>Sửa</button>
                <button class="btn btn-sm btn-outline-danger py-1 px-3 fw-bold" onclick="deleteDatLichPost('${item.rowIndex}')"><i class="fa-solid fa-trash me-1"></i>Xóa</button>
            `;
        } else {
            actionButtons = `<span class="badge bg-light text-muted border"><i class="fa-solid fa-lock me-1"></i>Khóa</span>`;
        }

        let shortAuthorName = getNaturalShortName(item.authorName);
        let timeHtml = item.updateTime ? `<div class="text-muted small mt-1"><i class="fa-solid fa-clock-rotate-left me-1"></i>Cập nhật: ${item.updateTime}</div>` : '';
        let noiDung = item.noiDung || "Đặt lịch hẹn";

        html += `
        <tr>
            <td style="padding-left: 20px;">
                <a href="${item.url}" target="_blank" class="fw-bold text-decoration-none fs-6" style="color: #0f4c81;" title="Bấm để mở đường link đặt lịch">
                    <i class="fa-solid fa-arrow-up-right-from-square me-2" style="font-size: 13px;"></i>${item.title}
                </a>
                ${timeHtml}
            </td>
            <td>
                <span class="badge bg-light text-dark border border-secondary" style="font-size: 12.5px;"><i class="fa-solid fa-tag me-1 text-primary"></i> ${noiDung}</span>
            </td>
            <td>
                <span class="fw-bold text-dark">${shortAuthorName}</span>
                <span class="text-muted small ms-1">(${maskMSSV(item.mssv)})</span>
            </td>
            <td class="text-center">${actionButtons}</td>
        </tr>`;
    });
    tbody.html(html);
}

// Cập nhật reset giá trị cho hàm Open/Close Form
function openFormDatLich() {
    if (!currentUser || currentUser.isGuest) {
        alert("Vui lòng đăng nhập để tạo bài đăng lịch hẹn!");
        return;
    }
    $('#datLichRowIndex, #txtDatLichTen, #txtDatLichUrl, #txtDatLichNoiDungKhac').val('');
    $('#selDatLichNoiDung').val('Đặt lịch hẹn');
    $('#txtDatLichNoiDungKhac').addClass('d-none');
    $('#formDatLichTitle').html('<i class="fa-solid fa-plus me-2"></i>Tạo bài đăng mới');
    $('#formDatLichArea').removeClass('d-none');
    $('html, body').animate({ scrollTop: $('#formDatLichArea').offset().top - 80 }, 300);
}

function closeFormDatLich() {
    $('#formDatLichArea').addClass('d-none');
    $('#datLichRowIndex, #txtDatLichTen, #txtDatLichUrl, #txtDatLichNoiDungKhac').val('');
}

// Cập nhật hàm Edit để load giá trị Nội dung cũ
function editDatLichPost(index) {
    let item = window.datLichCache[index];
    if (!item) return;

    $('#datLichRowIndex').val(item.rowIndex);
    $('#txtDatLichTen').val(item.title);
    $('#txtDatLichUrl').val(item.url);
    
    // Kiểm tra xem nội dung lưu trước đó có nằm trong option mặc định hay không
    let nd = item.noiDung || "Đặt lịch hẹn";
    let defaultOptions = ["Đặt lịch hẹn", "Chia sẻ Minh Chứng Rèn luyện", "Chia sẻ Hoạt động Rèn luyện"];
    
    if (defaultOptions.includes(nd)) {
        $('#selDatLichNoiDung').val(nd);
        $('#txtDatLichNoiDungKhac').addClass('d-none').val('');
    } else {
        $('#selDatLichNoiDung').val('Khác');
        $('#txtDatLichNoiDungKhac').removeClass('d-none').val(nd);
    }

    $('#formDatLichTitle').html('<i class="fa-solid fa-pen-to-square me-2"></i>Chỉnh sửa bài đăng');
    $('#formDatLichArea').removeClass('d-none');
    $('html, body').animate({ scrollTop: $('#formDatLichArea').offset().top - 80 }, 300);
}

// Cập nhật hàm Gửi dữ liệu về Server (đính kèm biến noiDung)
function saveDatLichPost() {
    let rowIndex = $('#datLichRowIndex').val().trim();
    let title = $('#txtDatLichTen').val().trim();
    let url = $('#txtDatLichUrl').val().trim();
    
    // Lấy biến nội dung
    let noiDung = $('#selDatLichNoiDung').val();
    if (noiDung === 'Khác') {
        noiDung = $('#txtDatLichNoiDungKhac').val().trim();
        if (!noiDung) {
            alert("Vui lòng ghi rõ nội dung khác!");
            $('#txtDatLichNoiDungKhac').focus();
            return;
        }
    }

    if (!title || !url) {
        alert("Vui lòng nhập đầy đủ Tên bài đăng và Đường link URL!");
        return;
    }

    if (!url.match(/^https?:\/\//i)) {
        url = 'https://' + url;
    }

    let btn = $('#btnSaveDatLich');
    let originalText = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin me-1"></i> Đang lưu...').prop('disabled', true);

    let isEdit = rowIndex !== "";
    let payload = {
        action: isEdit ? "editDatLichHen" : "addDatLichHen",
        rowIndex: rowIndex,
        mssv: currentUser.mssv,
        authorName: currentUser.name,
        title: title,
        url: url,
        noiDung: noiDung // << Đóng gói nội dung vào Payload gửi đi
    };

    postToGAS(payload, function(res) {
        alert(res);
        btn.html(originalText).prop('disabled', false);
        closeFormDatLich();
        loadDatLichData();
    }, function() {
        alert("Lỗi kết nối máy chủ!");
        btn.html(originalText).prop('disabled', false);
    });
}
// 6. Xóa bài đăng
function deleteDatLichPost(rowIndex) {
    if (!confirm("Bạn có chắc chắn muốn xóa bài đăng lịch hẹn này không?")) return;

    postToGAS({
        action: "deleteDatLichHen",
        rowIndex: rowIndex,
        mssv: currentUser.mssv
    }, function(res) {
        alert(res);
        loadDatLichData();
    }, function() {
        alert("Lỗi kết nối khi gửi yêu cầu xóa!");
    });
}

window.adminShowHidden = false; // Mặc định ban đầu CHỈ hiện bài công khai (Góc nhìn Sinh viên)

window.toggleAdminShowHidden = function() {
    window.adminShowHidden = !window.adminShowHidden;
    let btn = $('#btnToggleHiddenPosts');

    if (window.adminShowHidden) {
        // Đang BẬT xem tất cả -> Nút sẽ đề nghị chuyển về xem công khai
        $('body').removeClass('hide-hidden-posts');
        btn.html('<i class="fa-solid fa-eye-slash me-1"></i> Ẩn');
        btn.removeClass('btn-secondary text-white').addClass('btn-info text-dark');
    } else {
        // Đang TẮT (Chỉ xem công khai) -> Nút sẽ đề nghị xem tất cả
        $('body').addClass('hide-hidden-posts');
        btn.html('<i class="fa-solid fa-eye me-1"></i> Hiện');
        btn.removeClass('btn-info text-dark').addClass('btn-secondary text-white');
    }

    // Tự động ẩn/hiện tiêu đề khối nếu không còn bài viết nào bên trong
    ['HocThuat', 'RenLuyen'].forEach(type => {
        let visibleCount = $(`#tbItems${type} .tb-list-item:visible`).length;
        if (visibleCount === 0) {
            $(`#tbSection${type}`).addClass('d-none');
        } else {
            $(`#tbSection${type}`).removeClass('d-none');
        }
    });
};
// Thêm đoạn này vào dưới cùng của tệp Source 8
window.isAdminActionsEnabled = false;

window.toggleAdminActions = function() {
    window.isAdminActionsEnabled = !window.isAdminActionsEnabled;
    if (window.isAdminActionsEnabled) {
        $('.admin-action-col').removeClass('d-none');
        $('.drag-handle-row').attr('draggable', 'true').css('cursor', 'grab');
    } else {
        $('.admin-action-col').addClass('d-none');
        $('.drag-handle-row').attr('draggable', 'false').css('cursor', 'pointer');
    }
};
// Hàm Lọc và Tìm kiếm cho Bảng Đặt lịch hẹn
window.searchDatLich = function() {
    let keyword = $('#txtSearchDatLich').val().toLowerCase().trim();
    let selectedFilter = $('#filterDatLichNoiDung').val();

    $('#datLichTableBody tr').each(function() {
        // Bỏ qua dòng thông báo hệ thống (như dòng "Đang tải danh sách..." có colspan)
        if ($(this).find('td').length === 1 && $(this).find('td').attr('colspan')) return;

        // Tìm thông tin text trong toàn bộ hàng (bao gồm tiêu đề và tác giả)
        let rowText = $(this).text().toLowerCase();
        
        // Lấy Nội dung từ Cột 2 (Text bên trong thẻ hiển thị nhãn)
        let rowNoiDung = $(this).find('td:nth-child(2)').text().trim(); 

        // 1. Kiểm tra từ khóa tìm kiếm
        let matchKeyword = keyword === "" || rowText.includes(keyword);
        
        // 2. Kiểm tra bộ lọc
        let matchFilter = false;
        if (selectedFilter === "") {
            matchFilter = true;
        } else if (selectedFilter === "Khác") {
            let defaultOptions = ["Đặt lịch hẹn", "Chia sẻ Minh Chứng Rèn luyện", "Chia sẻ Hoạt động Rèn luyện"];
            // Nếu Nội dung của thẻ không nằm trong 3 mục mặc định, thì nó thuộc loại "Khác"
            matchFilter = !defaultOptions.some(opt => rowNoiDung.includes(opt));
        } else {
            matchFilter = rowNoiDung.includes(selectedFilter);
        }

        // Hiển thị nếu thỏa mãn CẢ 2 điều kiện
        if (matchKeyword && matchFilter) {
            $(this).removeClass('d-none');
        } else {
            $(this).addClass('d-none');
        }
    });
};

// --- BỘ XỬ LÝ XEM VÀ CHỈNH SỬA TIÊU ĐỀ + NỘI DUNG LATEX TRỰC TIẾP FULLSCREEN ---

window.currentLatexRowIndex = -1; 

// 1. HÀM MỞ BẢNG XEM CHI TIẾT
window.openLatexContentViewer = function(rowIndex) {
    if (!window.currentSubjectData || !window.currentSubjectData[rowIndex]) return;
    
    window.currentLatexRowIndex = rowIndex;
    let row = window.currentSubjectData[rowIndex];
    let title = String(row[1] || 'Chi tiết nội dung').trim();
    let contentRaw = String(row[2] || '').trim();

    let contentDisplay = contentRaw;
    if (!/(<p>|<table>|<br>|<br\s*\/?>|<div>)/i.test(contentDisplay)) {
        contentDisplay = contentDisplay.replace(/\n/g, '<br>');
    }

    $('#latexViewMode').removeClass('d-none').html(contentDisplay);
    $('#latexEditMode').removeClass('d-flex').addClass('d-none');
    $('#latexViewerTitle').html(`<i class="fa-solid fa-file-signature me-2"></i> ${title}`);
    $('#latexEditTitleInput').val(title); 
    $('#latexEditTextarea').val(contentRaw); 
    
    if (typeof isAdmin !== 'undefined' && isAdmin) {
        $('#btnEditLatexModal').removeClass('d-none').html('<i class="fa-solid fa-pen me-1"></i> Sửa Nội Dung').removeClass('btn-secondary').addClass('btn-warning');
    } else {
        $('#btnEditLatexModal').addClass('d-none');
    }

    // Nạp Định Danh để Sidebar có thể lưu Tiến Độ và Note
    let rawLessonName = String(row[1] || row[0] || '').replace(/<[^>]*>?/gm, '').replace(/[^a-zA-Z0-9_]/g, '');
    let stableKey = rawLessonName ? rawLessonName : (rowIndex + 1);

    $('#latexSidebar').attr('data-sheet', currentSheetName).attr('data-key', stableKey);
    let mssv = (currentUser && currentUser.mssv) ? currentUser.mssv : 'guest';
    
    // Khôi phục Tiến độ
    let progVal = localStorage.getItem(`prog_${mssv}_${currentSheetName}_${stableKey}`) || 'white';
    $('#latexProgressSelect').val(progVal).css('background-color', getProgressColor(progVal));
    
    // Khôi phục Ghi chú
    let noteData = JSON.parse(localStorage.getItem(`note_${mssv}_${currentSheetName}_${stableKey}`));
    let content = noteData && noteData.content ? noteData.content : '';
    if (tinymce.get('latexNoteEditor')) {
        tinymce.get('latexNoteEditor').setContent(content);
    } else {
        $('#latexNoteEditor').val(content);
    }

    $('#latexViewerModal').modal('show');
    setTimeout(() => { applyKaTeX('latexViewMode'); }, 100);

    // Kích hoạt chống mất tập trung nếu đang hẹn giờ
    if (typeof isTimerActive === 'function' && isTimerActive()) {
        isEnforcedFullscreen = true;
        allowLessonClose = false; 
        if (typeof enterFullScreen === 'function') enterFullScreen();
    }
};

// 2. HÀM BẬT/TẮT CHẾ ĐỘ SỬA
window.toggleLatexEditMode = function() {
    let viewMode = $('#latexViewMode');
    let editMode = $('#latexEditMode');
    let btnEdit = $('#btnEditLatexModal');
    
    if (viewMode.hasClass('d-none')) {
        // Đang từ Sửa -> Quay về Xem
        viewMode.removeClass('d-none');
        editMode.removeClass('d-flex').addClass('d-none');
        btnEdit.html('<i class="fa-solid fa-pen me-1"></i> Sửa Nội Dung').removeClass('btn-secondary text-white').addClass('btn-warning text-dark');
    } else {
        // Đang từ Xem -> Chuyển sang Sửa
        viewMode.addClass('d-none');
        editMode.removeClass('d-none').addClass('d-flex');
        btnEdit.html('<i class="fa-solid fa-eye me-1"></i> Trở về Xem trước').removeClass('btn-warning text-dark').addClass('btn-secondary text-white');
        
        // KÍCH HOẠT RENDER XEM TRƯỚC NGAY LẬP TỨC CHO NỘI DUNG CŨ
        $('#latexEditTextarea').trigger('input');
    }
};

// 3. HÀM LƯU DỮ LIỆU ĐÃ SỬA VỀ GOOGLE SHEETS
window.saveLatexContent = function() {
    if (window.currentLatexRowIndex === -1) return;
    
    let rowIndex = window.currentLatexRowIndex;
    let rowData = window.currentSubjectData[rowIndex];
    let sheetRowIndexVar = rowIndex + 1; 

    // Lấy giá trị mới từ ô nhập
    let newTitle = $('#latexEditTitleInput').val().trim();
    let newContent = $('#latexEditTextarea').val().trim();
    
    if (!newTitle) {
        alert("Tiêu đề bài học không được để trống!");
        $('#latexEditTitleInput').focus();
        return;
    }

    let c1 = String(rowData[0] || '');
    let c2 = newTitle;   
    let c3 = newContent; 
    
    // --- XỬ LÝ CỘT 4 (GHI CHÚ): GIỮ NGÀY ĐĂNG VÀ CẬP NHẬT NGÀY UPDATE ---
    let c4 = String(rowData[3] || ''); 
    
    let now = new Date();
    let pad = (n) => String(n).padStart(2, '0');
    let dateOnlyStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    let dateTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} ${dateOnlyStr}`;
    
    // Xóa chuỗi UPDATE cũ (nếu có) để thay bằng chuỗi mới
    c4 = c4.replace(/UPDATE=(?:\d{2}:\d{2}\s)?\d{2}\/\d{2}\/\d{4}/ig, '').trim();
    
    // Nối chuỗi UPDATE mới vào sau
    if (c4 !== '') {
        c4 = c4 + ` UPDATE=${dateTimeStr}`;
    } else {
        c4 = `UPDATE=${dateTimeStr}`;
    }
    
    // Phục hồi nguyên vẹn các cột dư còn lại
    let c5 = String(rowData[4] || '');
    let c6 = String(rowData[5] || '');
    let c7 = String(rowData[6] || '');

    let btnSave = $('#btnSaveLatexModal');
    let oldText = btnSave.html();
    btnSave.html('<i class="fa-solid fa-spinner fa-spin me-1"></i> Đang lưu...').prop('disabled', true);

    postToGAS({
        action: "editSheetRow",
        sheetName: currentSheetName,
        rowIndex: sheetRowIndexVar,
        col1: c1, col2: c2, col3: c3, col4: c4, col5: c5, col6: c6, col7: c7
    }, function(res) {
        alert("Lưu thay đổi thành công!");
        btnSave.html(oldText).prop('disabled', false);
        
        // 1. Cập nhật dữ liệu ngay vào RAM nội bộ
        window.currentSubjectData[rowIndex][1] = c2;
        window.currentSubjectData[rowIndex][2] = c3;
        window.currentSubjectData[rowIndex][3] = c4;
        
        // 2. Cập nhật giao diện Modal
        $('#latexViewerTitle').html(`<i class="fa-solid fa-file-signature me-2"></i> ${c2}`);
        
        let contentDisplay = c3;
        if (!/(<p>|<table>|<br>|<br\s*\/?>|<div>)/i.test(contentDisplay)) {
            contentDisplay = contentDisplay.replace(/\n/g, '<br>');
        }
        $('#latexViewMode').html(contentDisplay);
        applyKaTeX('latexViewMode');
        
        toggleLatexEditMode(); // Trở về chế độ xem
        
        // 3. Tải lại bảng bên dưới để giao diện bên ngoài nhận luôn ngày Update
        loadDataByHocPhan(currentSheetName);
        
    }, function() {
        alert("Lỗi kết nối máy chủ! Vui lòng thử lại.");
        btnSave.html(oldText).prop('disabled', false);
    });
};
// --- SỰ KIỆN: RENDER XEM TRƯỚC THỜI GIAN THỰC TRONG QUÁ TRÌNH GÕ ---
$(document).on('input', '#latexEditTextarea', function() {
    let rawContent = $(this).val();
    
    if (!rawContent.trim()) {
        $('#latexEditPreviewArea').html('<span class="text-muted">Nhập nội dung để xem trước...</span>');
        return;
    }

    let htmlContent = rawContent;
    
    // 1. Tự động làm sạch các dấu nháy và dấu gạch chéo dư thừa
    htmlContent = htmlContent.replace(/\\"/g, '"').replace(/\\'/g, "'");

    // 2. Chuyển đổi THẺ HÌNH ẢNH TRƯỚC (Bao trọn các dạng có và không có kích thước)
    // Dạng [IMG=50%]url[/IMG] hoặc [IMG=200px]url[/IMG]
    htmlContent = htmlContent.replace(/\[IMG=(.*?)\](.*?)\[\/IMG\]/gi, function(match, size, url) {
        return `<div class="text-center my-3"><a href="${url.trim()}" target="_blank"><img src="${url.trim()}" style="width: ${size}; max-width: 100%; border-radius: 8px;"></a></div>`;
    });
    
    // Dạng cơ bản [IMG]url[/IMG]
    htmlContent = htmlContent.replace(/\[IMG\](.*?)\[\/IMG\]/gi, function(match, url) {
        return `<div class="text-center my-3"><a href="${url.trim()}" target="_blank"><img src="${url.trim()}" style="max-width: 100%; border-radius: 8px;"></a></div>`;
    });

    // 3. Xuống dòng tự động nếu văn bản thuần (Không chứa thẻ HTML cấu trúc khối)
    if (!/(<p>|<table>|<br>|<br\s*\/?>|<div>)/i.test(htmlContent)) {
        htmlContent = htmlContent.replace(/\n/g, '<br>');
    }
    
    // 4. Đổ Text vào khung Preview
    $('#latexEditPreviewArea').html(htmlContent);

    // 5. Gọi bộ thư viện KaTeX để vẽ công thức Toán
    if (window.renderMathInElement) {
        renderMathInElement(document.getElementById('latexEditPreviewArea'), {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
            ],
            throwOnError: false,
            output: "html"
        });
    }
});
// --- FIX TRIỆT ĐỂ LỖI KHÓA Ô NHẬP LINK TINYMCE TRONG BOOTSTRAP 5 MODAL ---
document.addEventListener('focusin', function(e) {
    if (e.target.closest(".tox-tinymce, .tox-tinymce-aux, .moxman-window, .tam-assetmanager-root, #adminTableModal, #adminImageModal") !== null) {
        e.stopImmediatePropagation();
    }
}, true); // <-- Tham số 'true' (Capture) bắt sự kiện trước khi Bootstrap nhận được
// =======================================================
// TÍNH NĂNG CHÈN NHANH MẪU GIAO DIỆN (BẢNG BÀI TẬP, TIÊU ĐỀ, BẢNG DỮ LIỆU)
// Tương thích với Khung Sửa Nội dung LaTeX (latexEditTextarea)
// =======================================================

// Hàm thực hiện chèn nội dung vào đúng vị trí con trỏ
function doInsertAdminContent(contentToInsert) {
    let textarea = document.getElementById('latexEditTextarea');
    let startPos = textarea.selectionStart;
    let endPos = textarea.selectionEnd;
    let textBefore = textarea.value.substring(0, startPos);
    let textAfter = textarea.value.substring(endPos, textarea.value.length);
    
    textarea.value = textBefore + contentToInsert + textAfter;
    textarea.selectionStart = textarea.selectionEnd = startPos + contentToInsert.length;
    
    // Ép render lại khung Xem trước (Preview) ngay lập tức
    $('#latexEditTextarea').trigger('input');
    textarea.focus();
}

function insertAdminTemplate(type) {
    if (type === 'question') {
        let content = '<div style="border-left: 5px solid #0f4c81; background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);"><div style="background-color: #0f4c81; color: #ffffff; display: inline-block; padding: 6px 20px; border-radius: 20px; font-weight: bold; font-size: 0.95em; margin-bottom: 15px; letter-spacing: 0.5px;">Bài tập 1</div><div style="font-size: 1.05em; color: #334155; line-height: 1.7;">Trên mặt phẳng tọa độ, hãy chứng tỏ các đường bậc hai không suy biến quen thuộc là Elip, Parabol... (Gõ công thức LaTeX bình thường)</div></div>\n';
        doInsertAdminContent(content);
    } else if (type === 'title') {
        let content = '<div style="border: 2px solid #0f4c81; background-color: #f0f4f8; border-radius: 12px; padding: 12px 25px; text-align: center; color: #0f4c81; font-weight: bold; font-size: 1.2em; margin-bottom: 20px; box-shadow: 3px 3px 0px rgba(15, 76, 129, 0.15); display: flex; justify-content: center; align-items: center;">Bài 3: Tiếp tuyến, tính trơn và tính chính quy</div>\n';
        doInsertAdminContent(content);
    } else if (type === 'table') {
        showAdminTableModal();
    } else if (type === 'image') {
        // GỌI KHUNG POPUP CHÈN ẢNH CHUYÊN NGHIỆP
        showAdminImageModal();
    }
}

function showAdminImageModal() {
    if (document.getElementById('adminImageModal')) {
        document.getElementById('adminImageModal').remove();
    }

    let modalHtml = `
    <div id="adminImageModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1060; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px);">
        <div style="background: #ffffff; padding: 25px; border-radius: 12px; width: 450px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); transform: scale(1); animation: popIn 0.2s ease-out;">
            <h5 class="fw-bold mb-3" style="color: #0f4c81;">
                <i class="fa-solid fa-image me-2"></i>Chèn Ảnh Tự Động
            </h5>
            <div class="mb-3">
                <label class="fw-bold small text-muted mb-1">Đường dẫn ảnh (URL / Google Drive):</label>
                <input type="text" id="imgAdminUrl" class="form-control fw-bold" placeholder="https://...">
            </div>
            <div class="mb-4">
                <label class="fw-bold small text-muted mb-1">Kích thước hiển thị (%):</label>
                <select id="imgAdminSize" class="form-select fw-bold">
                    <option value="100%">100% (Mặc định)</option>
                    <option value="90%">90%</option>
                    <option value="80%">80%</option>
                    <option value="70%">70%</option>
                    <option value="60%">60%</option>
                    <option value="50%">50%</option>
                    <option value="40%">40%</option>
                    <option value="30%">30%</option>
                    <option value="20%">20%</option>
                </select>
            </div>
            <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light fw-bold px-4" onclick="document.getElementById('adminImageModal').remove()">Hủy</button>
                <button type="button" class="btn text-white fw-bold px-4" style="background-color: #0f4c81;" onclick="generateAdminImageFromModal()">Chèn Ảnh</button>
            </div>
        </div>
        <style>
            @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        </style>
    </div>`;

    $('body').append(modalHtml);
    // Tự động focus vào ô nhập link
    setTimeout(() => document.getElementById('imgAdminUrl').focus(), 100);
}
function generateAdminImageFromModal() {
    let imgUrl = $('#imgAdminUrl').val().trim();
    let imgSize = $('#imgAdminSize').val();
    
    if (!imgUrl) {
        alert("Vui lòng nhập đường dẫn ảnh!");
        $('#imgAdminUrl').focus();
        return;
    }

    // TỰ ĐỘNG BÓC TÁCH & CHUYỂN ĐỔI LINK GOOGLE DRIVE
    let cleanUrl = imgUrl;
    let driveMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
        let fileId = driveMatch[1];
        cleanUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }

    let formattedImg = '';
    // Nếu chọn 100% thì gán thẻ thường [IMG], nếu chọn kích thước khác thì gán [IMG=size]
    if (imgSize === '100%') {
        formattedImg = `[IMG]${cleanUrl}[/IMG]\n`;
    } else {
        formattedImg = `[IMG=${imgSize}]${cleanUrl}[/IMG]\n`;
    }

    // Tắt Popup và tiến hành chèn vào vị trí con trỏ
    document.getElementById('adminImageModal').remove();
    doInsertAdminContent(formattedImg);
}
// Hàm tạo và hiển thị Cửa sổ Popup (Modal) nhập Hàng/Cột (Có z-index: 1060 để đè lên Modal Sửa bài)
function showAdminTableModal() {
    if (document.getElementById('adminTableModal')) {
        document.getElementById('adminTableModal').remove();
    }

    let modalHtml = `
    <div id="adminTableModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1060; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px);">
        <div style="background: #ffffff; padding: 25px; border-radius: 12px; width: 380px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); transform: scale(1); animation: popIn 0.2s ease-out;">
            <h5 class="fw-bold mb-3" style="color: #0f4c81;">
                <i class="fa-solid fa-table me-2"></i>Tạo Bảng Nhanh
            </h5>
            <div class="row g-3 mb-4">
                <div class="col-6">
                    <label class="fw-bold small text-muted mb-1">Số Cột:</label>
                    <input type="number" id="tbAdminCols" class="form-control fw-bold" value="4" min="1">
                </div>
                <div class="col-6">
                    <label class="fw-bold small text-muted mb-1">Số Hàng:</label>
                    <input type="number" id="tbAdminRows" class="form-control fw-bold" value="3" min="1">
                </div>
            </div>
            <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light fw-bold px-4" onclick="document.getElementById('adminTableModal').remove()">Hủy</button>
                <button type="button" class="btn text-white fw-bold px-4" style="background-color: #0f4c81;" onclick="generateAdminTableFromModal()">Chèn Bảng</button>
            </div>
        </div>
        <style>
            @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        </style>
    </div>`;

    $('body').append(modalHtml);
    setTimeout(() => document.getElementById('tbAdminCols').focus(), 100);
}

// Hàm sinh code bảng sau khi bấm "Chèn Bảng" từ Popup
function generateAdminTableFromModal() {
    let numCols = parseInt($('#tbAdminCols').val()) || 3;
    let numRows = parseInt($('#tbAdminRows').val()) || 2;
    
    document.getElementById('adminTableModal').remove();

    let tableHtml = '<div style="overflow-x: auto; margin-bottom: 20px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"><table style="width: 100%; border-collapse: collapse; background-color: #ffffff; font-size: 0.95em; margin: 0;"><thead style="background-color: #f0f4f8; border-bottom: 2px solid #0f4c81;"><tr>';
    
    for (let c = 1; c <= numCols; c++) {
        let borderRight = (c === numCols) ? '' : ' border-right: 1px solid #e2e8f0;';
        tableHtml += `<th style="padding: 12px 15px; color: #0f4c81; font-weight: 600; text-align: left;${borderRight}">Tiêu đề ${c}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';

    for (let r = 1; r <= numRows; r++) {
        let bg = (r % 2 === 0) ? ' background-color: #f8fafc;' : '';
        let borderBottom = (r === numRows) ? '' : ' border-bottom: 1px solid #e2e8f0;';
        tableHtml += `<tr style="${bg}${borderBottom}">`;
        
        for (let c = 1; c <= numCols; c++) {
            let borderRight = (c === numCols) ? '' : ' border-right: 1px solid #e2e8f0;';
            tableHtml += `<td style="padding: 10px 15px; color: #334155;${borderRight}">Nội dung ${r}-${c}</td>`;
        }
        tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table></div>\n';

    doInsertAdminContent(tableHtml);
}
// =========================================================================
// TÍNH NĂNG ADMIN: CHUYỂN ĐỔI TOÀN BỘ WEBSITE SANG GÓC NHÌN SINH VIÊN (V5)
// =========================================================================
window.adminFetchUserData = function() {
    let targetMSSV = $('#adminSearchMSSV').val().trim();
    if (!targetMSSV) { alert("Vui lòng nhập MSSV!"); $('#adminSearchMSSV').focus(); return; }
    
    let area = $('#adminUserDetailArea');
    area.removeClass('d-none').html('<div class="text-center py-5 text-muted"><i class="fa-solid fa-spinner fa-spin fs-2 mb-2"></i><br>Đang lấy dữ liệu hệ thống của ' + targetMSSV + '...</div>');
    
    // 1. Lưu lại MSSV và TÊN thực sự của Admin
    if (!window.realAdminMssv) {
        window.realAdminMssv = currentUser.mssv;
        window.realAdminName = currentUser.name;
    }

    // 2. KÍCH HOẠT CHẾ ĐỘ NHẬP VAI
    currentUser.mssv = targetMSSV;
    window.isImpersonating = true;
    window.impersonatedMSSV = targetMSSV;
    window.impersonatedName = ""; 
    
    // 3. ẢO HÓA LOCALSTORAGE (Đã xóa bỏ đoạn code đánh chặn Ping thừa thãi)
    if (!window.hookedLocalStorage) {
        window.hookedLocalStorage = true;
        window.originalGetItem = localStorage.getItem; // LƯU BẢN GỐC ĐỂ DÙNG CHO PING
        const originalSetItem = localStorage.setItem;

        localStorage.getItem = function(key) {
            let val = window.originalGetItem.call(localStorage, key);
            if (key === 'currentUser' && window.isImpersonating && val) {
                try {
                    let userObj = JSON.parse(val);
                    userObj.mssv = window.impersonatedMSSV; 
                    if (window.impersonatedName) userObj.name = window.impersonatedName;
                    return JSON.stringify(userObj);
                } catch(e) {}
            }
            return val;
        };

        localStorage.setItem = function(key, value) {
            if (key === 'currentUser' && window.isImpersonating) return; 
            originalSetItem.call(localStorage, key, value);
        };
    }

    // Cập nhật giao diện Sidebar
    $('#sidebarUserName').text(getNaturalShortName(window.realAdminName)); 
    $('#sidebarUserMSSV').html(`<span class="badge bg-warning text-dark mt-1"><i class="fa-solid fa-eye me-1"></i>Đang xem: ${targetMSSV}</span>`);
    
    if ($('#btnExitImpersonate').length === 0) {
        $('#sidebarUserInfo .dropdown-menu').prepend(`
            <button id="btnExitImpersonate" class="dropdown-item py-2 mb-1 d-flex align-items-center gap-3 fw-bold" style="color: #e61d4a; border-radius: 8px; font-size: 14px; background: #fee2e2;" onclick="location.reload()">
                <i class="fa-solid fa-right-from-bracket text-danger" style="font-size: 16px; width: 20px; text-align: center;"></i> Thoát Góc nhìn Sinh viên
            </button>
        `);
    }

    $.ajax({
        url: SCRIPT_URL + "?action=adminGetUserData&targetMssv=" + targetMSSV + "&adminMssv=" + window.realAdminMssv,
        method: "GET",
        dataType: "json",
        success: function(data) {
            if (data.profile && data.profile.name) {
                window.impersonatedName = data.profile.name;
                currentUser.name = data.profile.name; 
            }

            renderAdminUserDetail(targetMSSV, data);
            
            fetchLearningDataFromServer(); 
            loadWebLinks();
            
            if (typeof loadShareCodeData === 'function') loadShareCodeData();
            if (typeof loadQAData === 'function') loadQAData();
            if (typeof loadGroupLinks === 'function') loadGroupLinks();
            
            if (data.tkb) processTKBData(data.tkb);
            if (data.deadlines) {
                globalDeadlineData = data.deadlines.map(function(row) {
                    return {
                        title: row[1], duration: row[2], tag: row[3], icon: row[4], emoji: row[5],
                        dateStart: row[6] || "", dateEnd: row[7] || "", 
                        sheetRowIndex: row[8], isSystem: String(row[8]).startsWith('SYS_')
                    };
                });
                renderDeadlines();
            }

            $.ajax({ url: SCRIPT_URL + "?action=getCompletedDeadlines&mssv=" + targetMSSV, method: "GET", dataType: "json", success: function(res) { if (res && !res.error) localStorage.setItem('completed_deadlines_' + targetMSSV, typeof res === 'string' ? res : JSON.stringify(res)); } });

            $.ajax({ 
                url: SCRIPT_URL + "?action=getGPAConfig&mssv=" + targetMSSV, method: "GET", dataType: "json", 
                success: function(configRes) { if (configRes) { try { gpaConfig = typeof configRes === 'string' ? JSON.parse(configRes) : configRes; localStorage.setItem('gpaConfig', JSON.stringify(gpaConfig)); } catch(e){} } },
                complete: function() {
                    $.ajax({ url: SCRIPT_URL + "?action=getGPAUser&mssv=" + targetMSSV, method: "GET", dataType: "json", success: function(res) { try { myGPADataset = typeof res === 'string' ? JSON.parse(res) : res; if(!Array.isArray(myGPADataset)) myGPADataset = []; } catch(e){ myGPADataset = []; } window.isGpaDataLoaded = true; autoSyncTkbToGpa(); } });
                }
            });

            alert(`✅ Đã tải dữ liệu của sinh viên: ${window.impersonatedName} (${targetMSSV}).`);
        },
        error: function() {
            area.html('<div class="alert alert-danger fw-bold shadow-sm"><i class="fa-solid fa-triangle-exclamation"></i> Không thể kết nối đến máy chủ.</div>');
        }
    });
};

$(document).ready(function() {
    $('#btnConfirmCloseLesson').off('click').on('click', function() {
        $('#closeWarningModal').modal('hide');
        allowLessonClose = true; 
        $('#documentViewerModal').modal('hide'); 
        $('#latexViewerModal').modal('hide'); // Bổ sung đóng LaTeX Viewer
    });

    $('#btnCancelStudy').off('click').on('click', function() {
        $('#returnStudyModal').modal('hide');
        isEnforcedFullscreen = false;
        exitFullScreen();
        allowLessonClose = true; 
        $('#documentViewerModal').modal('hide'); 
        $('#latexViewerModal').modal('hide'); // Bổ sung đóng LaTeX Viewer
    });

    // Ràng buộc khi bấm nút X hoặc Click ra ngoài
    $('#documentViewerModal, #latexViewerModal').on('hide.bs.modal', function (e) {
        if (isEnforcedFullscreen && isTimerActive() && !allowLessonClose) {
            e.preventDefault(); 
            $('#closeWarningModal').modal('show'); 
        }
    });

    $('#documentViewerModal, #latexViewerModal').on('hidden.bs.modal', function () {
        isEnforcedFullscreen = false;
        allowLessonClose = false; 
        exitFullScreen();
        if (typeof window.setDetailedView === 'function' && typeof currentSheetName !== 'undefined') {
            window.setDetailedView(currentSheetName);
        }

        // THÊM DÒNG NÀY: Tự động đóng và reset Thanh công cụ khi tắt bài học
        $('#iframeSidebar, #latexSidebar').removeClass('d-flex').addClass('d-none');
    });

    // Đánh chặn Click Link trên Sidebar của cả 2 Modal
    $('#documentViewerModal, #latexViewerModal').on('click', 'a[target="_blank"], button#btnOpenInNewTab', function(e) {
        if (isEnforcedFullscreen && isTimerActive()) {
            e.preventDefault(); 
            let url = $(this).attr('href');
            if ($(this).attr('id') === 'btnOpenInNewTab') {
                url = $('#docViewerIframe').attr('src');
            }
            if (url && url !== '#') {
                pendingUrlToOpen = url;
                $('#linkWarningModal').modal('show'); 
            }
        }
    });
});

window.toggleLatexSidebar = function() {
    let sidebar = $('#latexSidebar');
    if (sidebar.hasClass('d-none')) {
        sidebar.removeClass('d-none').addClass('d-flex');
        
        // Khởi tạo TinyMCE tối giản
        if (!tinymce.get('latexNoteEditor')) {
            tinymce.init({
                selector: '#latexNoteEditor',
                height: 400, // <--- SỬA '100%' THÀNH 400 CỐ ĐỊNH Ở ĐÂY
                menubar: false,
                statusbar: false,
                plugins: 'lists link textcolor colorpicker',
                toolbar: 'bold italic underline | forecolor backcolor | bullist numlist',
                branding: false,
                setup: function (editor) {
                    editor.on('change', function () { editor.save(); });
                }
            });
        }
        
        if (typeof loadSidebarCodeSnippets === 'function') loadSidebarCodeSnippets(true);
        
    } else {
        sidebar.removeClass('d-flex').addClass('d-none');
    }
};

window.updateSidebarProgress = function(selectEl, isLatex = false) {
    let sidebarId = isLatex ? '#latexSidebar' : '#iframeSidebar';
    let sheetName = $(sidebarId).attr('data-sheet') || currentSheetName;
    let stableKey = $(sidebarId).attr('data-key');
    
    if (!sheetName || !stableKey) { alert("Lỗi: Không xác định được bài học!"); return; }
    
    let val = $(selectEl).val();
    $(selectEl).css('background-color', getProgressColor(val));
    
    let mssv = (currentUser && currentUser.mssv) ? currentUser.mssv : 'guest';
    localStorage.setItem(`prog_${mssv}_${sheetName}_${stableKey}`, val);
    
    let outerSelect = $(`select[onchange*="'${stableKey}'"]`);
    if(outerSelect.length) {
        outerSelect.val(val).css('background-color', getProgressColor(val));
    }
    
    if (typeof syncLearningDataToServer === 'function') syncLearningDataToServer();
};

window.saveSidebarNote = function(isLatex = false) {
    let sidebarId = isLatex ? '#latexSidebar' : '#iframeSidebar';
    let editorId = isLatex ? 'latexNoteEditor' : 'sidebarNoteEditor';
    let statusId = isLatex ? '#latexNoteStatus' : '#sidebarNoteStatus';

    let sheetName = $(sidebarId).attr('data-sheet') || currentSheetName;
    let stableKey = $(sidebarId).attr('data-key');
    
    if (!sheetName || !stableKey) { alert("Lỗi bài học để lưu ghi chú!"); return; }
    
    let content = "";
    if (tinymce.get(editorId)) {
        content = tinymce.get(editorId).getContent().trim();
    } else {
        content = $(`#${editorId}`).val().trim();
    }
    
    let mssv = (currentUser && currentUser.mssv) ? currentUser.mssv : 'guest';
    let now = new Date();
    let pad = (n) => String(n).padStart(2, '0');
    let timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    
    let btnNote = $(`#btnNote_${stableKey}`); 
    
    if (content && content !== "<p></p>" && content !== "") {
        let noteData = { content: content, updatedAt: timeStr };
        localStorage.setItem(`note_${mssv}_${sheetName}_${stableKey}`, JSON.stringify(noteData));
        
        $(statusId).html(`<i class="fa-solid fa-check me-1"></i>Đã lưu`).removeClass('text-danger').addClass('text-success');
        if(btnNote.length) {
            btnNote.removeClass('btn-outline-secondary bg-white').addClass('btn-primary text-white').html('<i class="fa-solid fa-clipboard-check fs-6"></i>').attr('title', 'Xem ghi chú');
        }
    } else {
        localStorage.removeItem(`note_${mssv}_${sheetName}_${stableKey}`);
        $(statusId).html(`<i class="fa-solid fa-trash me-1"></i>Đã xóa`).removeClass('text-success').addClass('text-danger');
        if(btnNote.length) {
            btnNote.removeClass('btn-primary text-white').addClass('btn-outline-secondary bg-white').html('<i class="fa-regular fa-clipboard fs-6"></i>').attr('title', 'Thêm ghi chú');
        }
    }
    
    setTimeout(() => $(statusId).html(''), 3000);
    if (typeof syncLearningDataToServer === 'function') syncLearningDataToServer();
};

window.loadSidebarCodeSnippets = function(isLatex = false) {
    let sidebarId = isLatex ? '#latexSidebar' : '#iframeSidebar';
    let searchInputId = isLatex ? '#txtLatexSearchCode' : '#txtSidebarSearchCode';
    let listId = isLatex ? '#latexCodeList' : '#sidebarCodeList';

    let courseName = $(sidebarId).attr('data-sheet') || currentSheetName;
    if (!courseName) return;

    $(searchInputId).val('');
    let container = $(listId);
    container.html('<div class="text-center text-muted small py-4"><i class="fa-solid fa-spinner fa-spin fs-3 mb-2 d-block text-secondary"></i>Đang tải dữ liệu bộ nhớ...</div>');

    $.ajax({
        // THÊM ĐUÔI THỜI GIAN ĐỂ ÉP TẢI DỮ LIỆU MỚI TỪ GOOGLE SHEETS
        url: SCRIPT_URL + "?action=getShareCodeData&_=" + new Date().getTime(),
        method: "GET",
        dataType: "json",
        cache: false, // CHỐNG LƯU CACHE CỦA TRÌNH DUYỆT
        success: function(data) {
            window.allSidebarSnippets = [];
            let activeUserObj = JSON.parse(localStorage.getItem('currentUser')) || null;
            let myCleanMssv = activeUserObj ? activeUserObj.mssv.replace(/\./g, "") : "";

            let myCodes = [];
            let otherCodes = [];

            if (data && data.length > 0) {
                data.forEach(row => {
                    let contentRaw = row[2] || '';
                    let targetTag = `[SHARECODE|${courseName}`;
                    
                    if (contentRaw.startsWith(targetTag)) {
                        let maBaiMatch = contentRaw.match(/^\[SHARECODE\|.*?\|(.*?)\]/);
                        let maBai = maBaiMatch && maBaiMatch[1] ? maBaiMatch[1].trim() : "";
                        
                        let cleanContent = contentRaw.replace(/^\[SHARECODE\|.*?\]\s*/, '').trim();
                        let theoryPart = "", codePart = "", langMatch = "cpp";

                        let codeMatch = cleanContent.match(/```(cpp|python|c\+\+|c)?([\s\S]*?)```/i);
                        if (codeMatch) {
                            let rawLang = (codeMatch[1] || "cpp").toLowerCase();
                            langMatch = (rawLang === 'python' || rawLang === 'py') ? 'python' : 'cpp';
                            codePart = codeMatch[2].trim();
                            theoryPart = cleanContent.replace(codeMatch[0], '').trim();
                        } else {
                            theoryPart = cleanContent; 
                        }
                        
                        theoryPart = theoryPart.replace(/<div class="mb-3"><strong>Lời giải lý thuyết:<\/strong><br>/g, '').replace(/<\/div>$/g, '').replace(/<p><\/p>/g, '').trim();
                        
                        let rawAuthor = String(row[1] || '').trim().replace(/[-|]/g, '');
                        let authorCleanMssv = rawAuthor.replace(/\./g, "");
                        let authorName = maskMSSV(rawAuthor); 
                        let isMyCode = (myCleanMssv !== "" && authorCleanMssv === myCleanMssv);
                        if (isMyCode) authorName = "Bạn";

                        if (codePart || theoryPart) {
                            let codeObj = {
                                maBai: maBai, theory: theoryPart, code: codePart, lang: langMatch,
                                author: authorName, isMine: isMyCode, answer: row[3] || '', rowIndex: row[6] 
                            };
                            if (isMyCode) myCodes.push(codeObj);
                            else otherCodes.push(codeObj);
                        }
                    }
                });
            }

            window.allSidebarSnippets = myCodes.concat(otherCodes);
            container.html(`<div class="text-muted small text-center py-4"><i class="fa-solid fa-magnifying-glass fs-3 mb-2 d-block text-secondary" style="opacity: 0.5;"></i>Hệ thống đã sẵn sàng.<br>Nhập mã bài (VD: B01) để tìm kiếm...</div>`);
        },
        error: function() { container.html('<div class="text-danger small text-center py-2"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi kết nối máy chủ!</div>'); }
    });
};

window.searchSidebarCode = function(isLatex = false) {
    let searchInputId = isLatex ? '#txtLatexSearchCode' : '#txtSidebarSearchCode';
    let listId = isLatex ? '#latexCodeList' : '#sidebarCodeList';

    let maBaiSearch = $(searchInputId).val().trim();
    let container = $(listId);

    if (!maBaiSearch) {
        container.html(`<div class="text-muted small text-center py-4"><i class="fa-solid fa-magnifying-glass fs-3 mb-2 d-block text-secondary" style="opacity: 0.5;"></i>Nhập từ khóa mã bài để tìm kiếm...</div>`);
        return;
    }

    // Chuẩn hóa từ khóa: Đưa về chữ thường và loại bỏ toàn bộ dấu tiếng Việt
    let cleanSearch = maBaiSearch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    window.sidebarCodeCache = window.allSidebarSnippets.filter(item => {
        // Chuẩn hóa dữ liệu của từng bài để so sánh chuẩn xác, thêm phòng hờ lỗi undefined
        let safeMaBai = (item.maBai || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        let safeAuthor = (item.author || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        
        // Mở rộng bộ lọc: Tìm theo cả Mã bài HOẶC Tên sinh viên chia sẻ
        return safeMaBai.includes(cleanSearch) || safeAuthor.includes(cleanSearch);
    });

    let html = '';
    if (window.sidebarCodeCache.length > 0) {
        window.sidebarCodeCache.forEach((item, idx) => {
            let badgeHtml = item.isMine ? `<span class="badge bg-success shadow-sm ms-1" style="font-size: 10px;"><i class="fa-solid fa-user-check me-1"></i>Của bạn</span>` : ``;
            let borderLeftColor = item.isMine ? '#22c55e' : '#0ea5e9'; 

            html += `
            <div class="d-flex justify-content-between align-items-center p-2 mb-2 bg-white shadow-sm" style="border: 1px solid #cbd5e1; border-left: 3px solid ${borderLeftColor}; border-radius: 6px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#f1f5f9';" onmouseout="this.style.background='#ffffff';" onclick="openSidebarCodeViewer(${idx})">
                <div class="text-truncate" style="max-width: 80%;">
                    <strong style="font-size: 13px; color: #1e293b;">${item.maBai || "Mã code"} ${badgeHtml}</strong><br>
                    <small class="text-muted" style="font-size: 11px;"><i class="fa-solid fa-user me-1"></i>${item.author}</small>
                </div>
                <i class="fa-solid fa-up-right-from-square text-primary" style="font-size: 12px;"></i>
            </div>`;
        });
    } else {
        html = `<div class="text-muted small text-center py-4"><i class="fa-regular fa-folder-open fs-3 mb-2 d-block"></i>Không tìm thấy dữ liệu cho "${maBaiSearch}".</div>`;
    }
    container.html(html);
};

document.addEventListener('fullscreenchange', function() {
    // Nếu mất trạng thái Fullscreen mà không phải do ấn nút Thoát tạm thời
    if (isEnforcedFullscreen && isTimerActive() && !document.fullscreenElement) {
        // Tạm dừng nhạc nếu có và bật ngay bảng ĐỎ
        if (typeof warningExitSound !== 'undefined') {
            warningExitSound.pause();
            warningExitSound.currentTime = 0;
        }
        $('#returnStudyModal').modal('show');
    }
});
