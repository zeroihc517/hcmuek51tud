function loginStudent() {
    let mssv = $('#txtUserMSSV').val().trim(); 
    let pass = $('#txtUserPass').val().trim();
    
    if (!mssv || !pass) { 
        $('#userAuthError').removeClass('d-none').text("Vui lòng nhập đầy đủ thông tin!"); 
        return; 
    }

    let btn = $('#btnLoginStudent'); 
    btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang xử lý...').prop('disabled', true);
    
    postToGAS({ action: "login", mssv: mssv, password: pass }, function(res) {
        let response = typeof res === 'string' ? JSON.parse(res) : res;
        if (response.success) {
            // 1. Lưu thông tin người dùng vào bộ nhớ
            currentUser = { 
                mssv: response.mssv, 
                name: response.name,
                chuyenNganh: response.chuyenNganh,
                khoa: response.khoa,
                khoaHoc: response.khoaHoc,
                nhom: response.nhom,
		avatar: response.avatar || ""
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
		isAdmin = false;
localStorage.removeItem('isAdmin');
            localStorage.setItem('lastActiveTime', Date.now().toString());
let isSurveyDone = localStorage.getItem('survey_done_' + response.mssv);
let isAdminAcc = (response.mssv === "51.01.108.008" || response.mssv === "5101108008");

// Nếu chưa làm khảo sát VÀ KHÔNG PHẢI là Admin thì bắt buộc chuyển hướng
if (!isSurveyDone && !isAdminAcc) {
    btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang chuyển đến bài khảo sát...');
    window.location.href = "TUD_HK1_2627/khaosat01.html";
    return; // Ngắt hàm, không load trang chính nữa
}
            let savedAccounts = JSON.parse(localStorage.getItem('savedAccounts')) || [];
            savedAccounts = savedAccounts.filter(acc => acc.mssv !== response.mssv);
            savedAccounts.unshift({ mssv: response.mssv, name: response.name });
            if (savedAccounts.length > 3) savedAccounts.pop(); 
            localStorage.setItem('savedAccounts', JSON.stringify(savedAccounts));

            // 2. Đổi trạng thái UI nút bấm
            btn.html('<i class="fa-solid fa-cloud-arrow-down fa-bounce me-2"></i>Đang tải toàn bộ dữ liệu hệ thống...');
            
            // 3. KÍCH HOẠT TẢI NGẦM TẤT CẢ CÁC PHÂN HỆ CÙNG MỘT LÚC (PARALLEL LOADING)
            pingOnlineStatus();
            renderUserInfo();

		if (typeof updateAvatarDisplay === 'function') {
                updateAvatarDisplay(response.avatar);
            }
            initGlobalApp();
            
            // Xóa bỏ lệnh loadDataByHocPhan('Thông báo') vô điều kiện ở đây
            // vì hàm initGlobalApp() ở trên đã tự động phân luồng URL thông minh rồi!
            fetchAndRenderCategories();
            loadWebLinks();

            // Tải ngầm Lịch học TKB & Deadlines
           $.ajax({ url: SCRIPT_URL + "?action=getTKBUser&mssv=" + currentUser.mssv, method: "GET", dataType: "json", success: function(data) { processTKBData(data); } });
            $.ajax({ url: SCRIPT_URL + "?action=getDeadlinesUser&mssv=" + currentUser.mssv, method: "GET", dataType: "json", success: function(data) { globalDeadlineData = data.map(r => ({ title: r[1], duration: r[2], tag: r[3], icon: r[4], emoji: r[5], dateStart: r[6] || "", dateEnd: r[7] || "", sheetRowIndex: r[8] })); } });
$.ajax({ 
                url: SCRIPT_URL + "?action=getCompletedDeadlines&mssv=" + currentUser.mssv, 
                method: "GET", 
                dataType: "json", // Bắt buộc phải có dòng này để nó hiểu dữ liệu
                success: function(res) {
                    // Kiểm tra đảm bảo không lưu cục báo lỗi vào máy
                    if (res && !res.error) {
                        // Nếu là mảng thì stringify, nếu đã là chuỗi thì giữ nguyên
                        let dataToSave = typeof res === 'string' ? res : JSON.stringify(res);
                        localStorage.setItem('completed_deadlines_' + currentUser.mssv, dataToSave);
                        renderDeadlines(); // Cập nhật màu trên trang chủ
                    }
                },
                error: function(err) {
                    console.error("Lỗi kéo dữ liệu Deadline:", err);
                }
            });
            // Tải ngầm Bảng điểm GPA (và cấu hình song ngành)
            $.ajax({ url: SCRIPT_URL + "?action=getGPAConfig&mssv=" + currentUser.mssv, method: "GET", dataType: "json", success: function(configRes) { if (configRes) { try { gpaConfig = typeof configRes === 'string' ? JSON.parse(configRes) : configRes; localStorage.setItem('gpaConfig', JSON.stringify(gpaConfig)); } catch(e){} } } });
            $.ajax({ url: SCRIPT_URL + "?action=getGPAUser&mssv=" + currentUser.mssv, method: "GET", dataType: "json", success: function(res) { try { myGPADataset = typeof res === 'string' ? JSON.parse(res) : res; if(!Array.isArray(myGPADataset)) myGPADataset = []; } catch(e){ myGPADataset = []; } } });

            // 4. KIỂM TRA ĐIỀU KIỆN HOÀN TẤT ĐỂ ĐÓNG MODAL
            let checkLoaded = setInterval(function() {
                // Kiểm tra xem các bảng nội dung chính đã hết hiệu ứng loading chưa
                let isTableLoaded = $('#loadingStatus').hasClass('d-none');
                let isLinksLoaded = $('#webLinksContainer .pulse-loader').length === 0;
                let isCategoriesLoaded = $('#dynamicCourseList').text() !== 'Đang tải danh sách...';

                if (isTableLoaded && isLinksLoaded && isCategoriesLoaded) {
                    clearInterval(checkLoaded);
                    
                    let authModal = bootstrap.Modal.getInstance(document.getElementById('userAuthModal'));
                    if(authModal) authModal.hide();
                    
                    alert("Xin chào, " + response.name + "! Dữ liệu đã sẵn sàng.");
                    btn.html('Đăng nhập ngay').prop('disabled', false);
                }
            }, 200);

            // 5. Dự phòng an toàn sau 8 giây nếu mạng chậm
            setTimeout(function() {
                clearInterval(checkLoaded);
                let authModal = bootstrap.Modal.getInstance(document.getElementById('userAuthModal'));
                if (authModal && $('#userAuthModal').is(':visible')) {
                    authModal.hide();
                    btn.html('Đăng nhập ngay').prop('disabled', false);
                }
            }, 8000);

        } else { 
            $('#userAuthError').removeClass('d-none').text(response.message); 
            btn.html('Đăng nhập ngay').prop('disabled', false); 
        }
    }, function() { 
        $('#userAuthError').removeClass('d-none').text("Lỗi kết nối!"); 
        btn.html('Đăng nhập ngay').prop('disabled', false); 
    });
}
function logoutStudent() {
    // 1. Xóa thông tin đăng nhập và quyền Admin khỏi LocalStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAdmin');
    currentUser = null; 
    isAdmin = false;
    
    // 2. Chuyển hướng về trang đăng nhập
    window.location.href = "login.html";
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
        $('#btnAdminLoginToggle').html('<i class="fa-solid fa-unlock text-danger" style="font-size: 16px; width: 20px; text-align: center;"></i> Đăng xuất Admin').css('color', 'var(--accent-red)');
        $('#btnManageCategories').removeClass('d-none');
        $('#adminDatabaseLink').removeClass('d-none');
        
        // Hiện cả hai menu
        $('#btnAdminManageUsers').removeClass('d-none').addClass('d-flex');
        $('#btnAdminMasterTkb').removeClass('d-none').addClass('d-flex');
        
        fetchAndRenderCategories();
        if (!$('#qaSection').hasClass('d-none')) { loadQAData(); } 
        if (!$('#courseSection').hasClass('d-none')) { loadDataByHocPhan(currentSheetName); } 
	pingOnlineStatus();
        alert("Xác thực quyền Admin thành công!");
    } else { $('#adminLoginError').removeClass('d-none'); }
}
function openAdminModal() {
    if (isAdmin) {
        // --- XỬ LÝ ĐĂNG XUẤT ADMIN ---
        isAdmin = false; 
        localStorage.removeItem('isAdmin'); // Xóa quyền Admin khỏi trình duyệt
        
        // Cập nhật lại giao diện nút đăng xuất/đăng nhập
        $('#btnAdminLoginToggle').html('<i class="fa-solid fa-user-shield text-secondary" style="font-size: 16px; width: 20px; text-align: center;"></i> Dành cho bản quản trị').css('color', '#e61d4a');
        $('#btnManageCategories').addClass('d-none');
        
        fetchAndRenderCategories();
        
        if (!currentUser || (currentUser.mssv !== "51.01.108.008" && currentUser.mssv !== "5101108008")) {
            $('#adminDatabaseLink').addClass('d-none');
        }
        
        // Tự động chuyển về trang thông báo và reload lại dữ liệu để ẩn các nút Admin
        loadDataByHocPhan('Thông báo', document.getElementById('btnNavThongBao'));
        if (!$('#qaSection').hasClass('d-none')) { loadQAData(); }
        pingOnlineStatus();
        alert("Đã đăng xuất quyền Admin!");
    } else { 
        // --- XỬ LÝ ĐĂNG NHẬP ADMIN ---
        // Tự động cấp quyền nếu là tài khoản Admin
        if (currentUser && (currentUser.mssv === "51.01.108.008" || currentUser.mssv === "5101108008")) {
            isAdmin = true;
            localStorage.setItem('isAdmin', 'true');
            
            // Cập nhật giao diện sang chế độ Admin
            $('#btnAdminLoginToggle').html('<i class="fa-solid fa-unlock text-danger" style="font-size: 16px; width: 20px; text-align: center;"></i> Đăng xuất Admin').css('color', 'var(--accent-red)');
            $('#btnManageCategories').removeClass('d-none');
            $('#adminDatabaseLink').removeClass('d-none');
            
            // Hiện cả hai menu quản lý
            $('#btnAdminManageUsers').removeClass('d-none').addClass('d-flex');
            $('#btnAdminMasterTkb').removeClass('d-none').addClass('d-flex');
            
            fetchAndRenderCategories();
            if (!$('#qaSection').hasClass('d-none')) { loadQAData(); } 
            if (!$('#courseSection').hasClass('d-none')) { loadDataByHocPhan(currentSheetName); } 
            pingOnlineStatus();
            alert("Tự động xác thực quyền Admin thành công!");
        } else {
            // Nếu là tài khoản thường thì vẫn mở Modal yêu cầu nhập mật khẩu bình thường
            $('#adminLoginError').addClass('d-none'); 
            $('#txtAdminPass').val(''); 
            $('#adminLoginModal').modal('show'); 
        }
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
const IDLE_TIMEOUT_MS = 14400000; 
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
    // Nếu có màn hình loading toàn trang thì bắt đầu kiểm tra
    if ($('#globalScreenLoader').length) {
        
        // TĂNG TỐC QUÉT KIỂM TRA: Giảm từ 300ms xuống 100ms để bắt sự kiện tải xong tức thì
        let checkInitialLoad = setInterval(function() {
            let isTableLoaded = $('#loadingStatus').hasClass('d-none');
            let isCategoriesLoaded = $('#dynamicCourseList').text().indexOf('Đang tải') === -1;
            
            // Nếu các điều kiện tải trang hoàn tất
            if (isTableLoaded && isCategoriesLoaded) {
                clearInterval(checkInitialLoad); 
                
                // TĂNG TỐC HIỆU ỨNG TẮT: Giảm từ fadeOut(600) xuống fadeOut(250) để vào web nhanh hơn
                $('#globalScreenLoader').fadeOut(250, function() {
                    $(this).remove();
                });
            }
        }, 100); 

        // Đề phòng trường hợp lỗi mạng bị kẹt loading mãi mãi, tự động đóng sau 8 giây (Gốc là 10 giây)
        setTimeout(function() {
            clearInterval(checkInitialLoad);
            if ($('#globalScreenLoader').length) {
                $('#globalScreenLoader').fadeOut(250, function() {
                    $(this).remove();
                });
            }
        }, 8000); 
    }
});
function generateThongBaoID(index) {
    let yearPrefix = new Date().getFullYear().toString().slice(-2); // Lấy "26" cho năm 2026
    let numberFormatted = String(index).padStart(4, '0'); // Đảm bảo đủ 4 chữ số (0001, 0002...)
    return `TB${yearPrefix}${numberFormatted}`; // Kết quả: TB260001
}

