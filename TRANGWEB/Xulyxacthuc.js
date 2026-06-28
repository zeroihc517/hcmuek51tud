 function loginStudent() {
            let mssv = $('#txtUserMSSV').val().trim(); let pass = $('#txtUserPass').val().trim();
            if (!mssv || !pass) { $('#userAuthError').removeClass('d-none').text("Vui lòng nhập đầy đủ thông tin!"); return; }

            let btn = $('#btnLoginStudent'); btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...').prop('disabled', true);
            postToGAS({ action: "login", mssv: mssv, password: pass }, function(res) {
                let response = typeof res === 'string' ? JSON.parse(res) : res;
                if (response.success) {
                    currentUser = { mssv: response.mssv, name: response.name };
                    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
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
                    
                    if (!$('#tkbSection').hasClass('d-none')) {
                        loadThoiGianBieu(); loadDeadlines();
                    }
                } else { $('#userAuthError').removeClass('d-none').text(response.message); }
                btn.html('Đăng nhập').prop('disabled', false);
            }, function() { $('#userAuthError').removeClass('d-none').text("Lỗi kết nối!"); btn.html('Đăng nhập').prop('disabled', false); });
        }

        function logoutStudent() {
            if(confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")) {
                sessionStorage.removeItem('currentUser'); 
                currentUser = null; 
                location.reload(); 
            }
        }

 function openChangePasswordModal() { $('#txtOldPass').val(''); $('#txtNewPass').val(''); $('#changePassError').addClass('d-none'); $('#changePasswordModal').modal('show'); }
        function submitChangePassword() {
            let oldPass = $('#txtOldPass').val().trim(); let newPass = $('#txtNewPass').val().trim();
            if(!oldPass || !newPass) { $('#changePassError').removeClass('d-none').text("Vui lòng điền đủ mật khẩu cũ và mới!"); return; }
            let btn = $('#btnConfirmChangePass'); btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...').prop('disabled', true);
            postToGAS({ action: "changePassword", mssv: currentUser.mssv, oldPassword: oldPass, newPassword: newPass }, function(res) {
                if(res.includes("thành công")) { alert(res); $('#changePasswordModal').modal('hide'); } else { $('#changePassError').removeClass('d-none').text(res); }
                btn.html('Xác nhận thay đổi').prop('disabled', false);
            }, function() { alert("Lỗi kết nối đến server!"); btn.html('Xác nhận thay đổi').prop('disabled', false); });
        }

 function verifyAdmin() {
            let pass = $('#txtAdminPass').val();
            if (pass === "#226244bc#TBC") {
                isAdmin = true; $('#adminLoginModal').modal('hide');
                $('#btnAdminLoginToggle').html('<i class="fa-solid fa-unlock"></i> Đăng xuất Admin').css('color', 'var(--accent-red)');
                $('#btnManageCategories').removeClass('d-none');
                renderSidebarCategories(); 
                if (!$('#qaSection').hasClass('d-none')) { loadQAData(); } 
                if (!$('#courseSection').hasClass('d-none')) { loadDataByHocPhan(currentSheetName); } 
                alert("Xác thực quyền Admin thành công!");
            } else { $('#adminLoginError').removeClass('d-none'); }
        }

        function openAdminModal() {
            if (isAdmin) {
                if (confirm("Bạn có muốn đăng xuất quyền Admin?")) {
                    isAdmin = false; $('#btnAdminLoginToggle').html('<i class="fa-solid fa-lock"></i> Dành cho Ban quản trị').css('color', 'var(--text-muted)');
                    $('#btnManageCategories').addClass('d-none');
                    renderSidebarCategories(); 
                    if (currentSheetName.toLowerCase() === 'users') { loadDataByHocPhan('Thông báo', document.getElementById('btnNavThongBao'));
                    } else if (!$('#courseSection').hasClass('d-none')) { loadDataByHocPhan(currentSheetName); }
                    if (!$('#qaSection').hasClass('d-none')) { loadQAData(); } 
                }
            } else { $('#adminLoginError').addClass('d-none'); $('#txtAdminPass').val(''); $('#adminLoginModal').modal('show'); }
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