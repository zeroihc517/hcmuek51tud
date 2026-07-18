 function loginStudent() {
            let mssv = $('#txtUserMSSV').val().trim(); let pass = $('#txtUserPass').val().trim();
            if (!mssv || !pass) { $('#userAuthError').removeClass('d-none').text("Vui lòng nhập đầy đủ thông tin!"); return; }

            let btn = $('#btnLoginStudent'); btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...').prop('disabled', true);
            postToGAS({ action: "login", mssv: mssv, password: pass }, function(res) {
                let response = typeof res === 'string' ? JSON.parse(res) : res;
                if (response.success) {
                   currentUser = { 
    mssv: response.mssv, 
    name: response.name,
    chuyenNganh: response.chuyenNganh,
    khoa: response.khoa,
    khoaHoc: response.khoaHoc,
    nhom: response.nhom
};
localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    let savedAccounts = JSON.parse(localStorage.getItem('savedAccounts')) || [];
                    savedAccounts = savedAccounts.filter(acc => acc.mssv !== response.mssv);
                    savedAccounts.unshift({ mssv: response.mssv, name: response.name });
                    if (savedAccounts.length > 3) savedAccounts.pop(); 
                    localStorage.setItem('savedAccounts', JSON.stringify(savedAccounts));

                    pingOnlineStatus();
                    let authModal = bootstrap.Modal.getInstance(document.getElementById('userAuthModal')) || new bootstrap.Modal(document.getElementById('userAuthModal'));
                    authModal.hide();
                    
                    alert("Xin chào, " + response.name + "!");
                    initGlobalApp();
                    renderUserInfo();
                    if (!$('#tkbSection').hasClass('d-none')) {
                        loadThoiGianBieu(); loadDeadlines();
                    }
                } else { $('#userAuthError').removeClass('d-none').text(response.message); }
                btn.html('Đăng nhập').prop('disabled', false);
            }, function() { $('#userAuthError').removeClass('d-none').text("Lỗi kết nối!"); btn.html('Đăng nhập').prop('disabled', false); });
        }

function logoutStudent() {
    // Xóa dữ liệu phiên đăng nhập sinh viên
    localStorage.removeItem('currentUser');
    currentUser = null; 
    
    // Bổ sung: Xóa luôn quyền Ban quản trị (Admin)
    localStorage.removeItem('isAdmin');
    isAdmin = false;
    
    // Tải lại trang
    location.reload(); 
}

function openChangePasswordModal() { 
            $('#txtOldPass').val(''); 
            $('#txtNewPass').val(''); 
            $('#txtConfirmPass').val(''); 
            $('#changePassError').addClass('d-none'); 
            // Reset các icon mắt về mặc định (che mật khẩu)
            $('.eye-icon').removeClass('fa-eye-slash').addClass('fa-eye');
            $('#txtOldPass, #txtNewPass, #txtConfirmPass').attr('type', 'password');
            $('#changePasswordModal').modal('show'); 
        }

        function submitChangePassword() {
            let oldPass = $('#txtOldPass').val().trim(); 
            let newPass = $('#txtNewPass').val().trim();
            let confirmPass = $('#txtConfirmPass').val().trim();
            
            if(!oldPass || !newPass || !confirmPass) { 
                $('#changePassError').removeClass('d-none').text("Vui lòng điền đầy đủ các trường!"); 
                return; 
            }
            if (newPass !== confirmPass) {
                $('#changePassError').removeClass('d-none').text("Mật khẩu mới và Nhập lại mật khẩu không khớp!"); 
                return;
            }

            let btn = $('#btnConfirmChangePass'); 
            btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...').prop('disabled', true);
            postToGAS({ action: "changePassword", mssv: currentUser.mssv, oldPassword: oldPass, newPassword: newPass }, function(res) {
                if(res.includes("thành công")) { alert(res); $('#changePasswordModal').modal('hide'); } else { $('#changePassError').removeClass('d-none').text(res); }
                btn.html('Đổi mật khẩu').prop('disabled', false);
            }, function() { alert("Lỗi kết nối đến server!"); btn.html('Đổi mật khẩu').prop('disabled', false); });
        }

        // Hàm xử lý khi nhấn vào icon con mắt bật/tắt mật khẩu
        window.togglePassword = function(inputId, iconEl) {
            let input = document.getElementById(inputId);
            if (input.type === "password") {
                input.type = "text";
                iconEl.classList.remove("fa-eye");
                iconEl.classList.add("fa-eye-slash");
            } else {
                input.type = "password";
                iconEl.classList.remove("fa-eye-slash");
                iconEl.classList.add("fa-eye");
            }
        };

 function verifyAdmin() {
            let pass = $('#txtAdminPass').val();
            if (pass === "#226244bc#TBC") {
                isAdmin = true; $('#adminLoginModal').modal('hide');
		localStorage.setItem('isAdmin', 'true');
               // Thay đổi thành đoạn này
$('#btnAdminLoginToggle').html('<i class="fa-solid fa-unlock text-danger" style="font-size: 16px; width: 20px; text-align: center;"></i> Đăng xuất Admin').css('color', 'var(--accent-red)');
                $('#btnManageCategories').removeClass('d-none');
                renderSidebarCategories(); 
		$('#adminDatabaseLink').removeClass('d-none');
                if (!$('#qaSection').hasClass('d-none')) { loadQAData(); } 
                if (!$('#courseSection').hasClass('d-none')) { loadDataByHocPhan(currentSheetName); } 
                alert("Xác thực quyền Admin thành công!");
            } else { $('#adminLoginError').removeClass('d-none'); }
        }

function openAdminModal() {
    if (isAdmin) {
        // Xóa hoàn toàn lệnh if(confirm(...)) và để code thực thi luôn
        isAdmin = false; 
        localStorage.removeItem('isAdmin'); // Xóa quyền Admin khỏi trình duyệt
        
        // Cập nhật lại giao diện nút đăng xuất/đăng nhập
        $('#btnAdminLoginToggle').html('<i class="fa-solid fa-user-shield text-secondary" style="font-size: 16px; width: 20px; text-align: center;"></i> Dành cho bản quản trị').css('color', '#e61d4a');
        $('#btnManageCategories').addClass('d-none');
        
        renderSidebarCategories(); 
        
        if (!currentUser || currentUser.mssv !== "51.01.108.008") {
            $('#adminDatabaseLink').addClass('d-none');
        }
        
        // Tự động chuyển về trang thông báo và reload lại dữ liệu để ẩn các nút Admin
        loadDataByHocPhan('Thông báo', document.getElementById('btnNavThongBao'));
        if (!$('#qaSection').hasClass('d-none')) { loadQAData(); }
        
        alert("Đã đăng xuất quyền Admin!"); // Bạn có thể bỏ dòng alert này luôn nếu muốn "âm thầm" đăng xuất
    } else { 
        $('#adminLoginError').addClass('d-none'); 
        $('#txtAdminPass').val(''); 
        $('#adminLoginModal').modal('show'); 
    }
}

 function renderSavedAccounts() {
            let savedAccounts = JSON.parse(localStorage.getItem('savedAccounts')) || []; let container = $('#savedAccountsContainer');
            if (savedAccounts.length === 0) { container.hide(); return; }
            container.show();
            let html = '<div class="text-muted small mb-2 fw-bold">Tài khoản đã đăng nhập:</div><div class="d-flex flex-column gap-2 mb-3">';
            savedAccounts.forEach(acc => {
                let avatarChar = acc.name.charAt(0).toUpperCase(); 
                html += `<div class="d-flex align-items-center justify-content-between p-2 border rounded" style="cursor:pointer; background:#f9fafb; transition: all 0.2s;" onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='#f9fafb'" onclick="selectSavedAccount('${acc.mssv}')"><div class="d-flex align-items-center gap-3"><div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width:35px; height:35px; font-weight:bold; font-size: 16px;">${avatarChar}</div><div style="line-height:1.2;"><div class="fw-bold text-dark" style="font-size:14.5px;">${acc.name}</div><div class="text-muted" style="font-size:12.5px;">${acc.mssv}</div></div></div><button class="btn btn-sm text-danger" onclick="removeSavedAccount('${acc.mssv}', event)" title="Xóa khỏi lịch sử"><i class="fa-solid fa-xmark"></i></button></div>`;
            });
            html += '</div><hr class="text-muted my-3">'; container.html(html);
        }

function selectSavedAccount(mssv) { $('#txtUserMSSV').val(mssv); $('#txtUserPass').val('').focus(); }
        function removeSavedAccount(mssv, event) { event.stopPropagation(); let savedAccounts = JSON.parse(localStorage.getItem('savedAccounts')) || []; savedAccounts = savedAccounts.filter(acc => acc.mssv !== mssv); localStorage.setItem('savedAccounts', JSON.stringify(savedAccounts)); renderSavedAccounts(); }
        function closeAndOpenEditDeadline(sheetRowIndex) { $('#manageTkbListModal').modal('hide'); setTimeout(() => { openEditDeadlineModal(sheetRowIndex); }, 400); }

// Thiết lập thời gian timeout: 1 tiếng = 60 phút * 60 giây * 1000 mili-giây
// Thiết lập thời gian timeout: 1 tiếng = 60 phút * 60 giây * 1000 mili-giây
const IDLE_TIMEOUT_MS = 3600000; 
let inactivityTimer;

// Hàm xử lý tự động đăng xuất
function autoLogoutStudent(isSilent = false) {
    if (localStorage.getItem('currentUser')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('lastActiveTime'); // Nhớ xóa luôn mốc thời gian
        currentUser = null;
        
        // Nếu isSilent = true (nghĩa là tự đăng xuất khi vừa load web do quá hạn lúc tắt tab), thì chỉ reload luôn
        if (isSilent) {
            location.reload();
            return;
        }

        // Nếu đang mở tab mà quá hạn thì hiện thông báo
        let toastEl = document.getElementById('autoToast'); 
        let toastBody = document.getElementById('autoToastMessage');
        if (toastEl && toastBody) {
            toastBody.innerText = "Phiên làm việc đã hết hạn do không hoạt động. Vui lòng đăng nhập lại!";
            toastEl.classList.remove('bg-success', 'bg-primary'); 
            toastEl.classList.add('bg-danger');
            let toast = new bootstrap.Toast(toastEl, { delay: 5000 }); 
            toast.show();
        } else {
            alert("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!");
        }
        
        setTimeout(() => { location.reload(); }, 2000);
    }
}

// Hàm khởi động/đặt lại bộ đếm thời gian
function resetInactivityTimer() {
    if (!currentUser) return;

    // Lưu lại thời điểm bạn vừa có tương tác với web (click, cuộn chuột...) vào localStorage
    localStorage.setItem('lastActiveTime', Date.now().toString());

    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => autoLogoutStudent(false), IDLE_TIMEOUT_MS);
}

// Kiểm tra hạn đăng nhập ngay khi vừa mở lại tab web
function checkSessionExpiryOnLoad() {
    if (!currentUser) return;
    
    let lastActive = localStorage.getItem('lastActiveTime');
    if (lastActive) {
        let timePassed = Date.now() - parseInt(lastActive);
        // Nếu đã hơn 1 tiếng kể từ lần cuối hoạt động (dù tab có bị đóng hay không)
        if (timePassed > IDLE_TIMEOUT_MS) {
            autoLogoutStudent(true); 
            return;
        }
    }
    // Nếu chưa hết hạn, cho phép chạy tiếp và bắt đầu tính giờ
    resetInactivityTimer();
}

function initInactivityTracker() {
    const userEvents = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll', 'wheel'];
    userEvents.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, { passive: true });
    });
}

$(document).ready(function() {
    // 1. Check hạn sử dụng của phiên đăng nhập ngay khi load trang
    checkSessionExpiryOnLoad();
    
    // 2. Kích hoạt theo dõi hoạt động
    initInactivityTracker();
});
function loadProfileView() {
    document.title = "Hồ sơ cá nhân | Học nhóm Năm 2 Khoa Toán";
    resetNavActive();
    
    // Đóng dropdown popover nếu đang mở
    let dropdownMenu = document.querySelector('#sidebarUserInfo .dropdown-menu');
    if(dropdownMenu) {
        dropdownMenu.classList.remove('show');
    }
    
    $('#profileSection').removeClass('d-none');
    
    // Đóng sidebar nếu đang trên điện thoại
    if(window.innerWidth < 992) { 
        sidebar.classList.remove('show'); 
        overlay.classList.remove('show'); 
    }
}