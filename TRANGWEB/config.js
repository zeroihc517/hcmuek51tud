 const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz7ioM0gSW7zue9BcDQbpy6t7moCYuXBadO9yGDfMgVGB0fSIp6NzbxLeydVd0bOQwb/exec'; 

     let isAdmin = localStorage.getItem('isAdmin') === 'true';
        let currentSheetName = "";
        let currentSheetTotalRows = 0;
        window.qaThreadParts = {};
        let globalCategories = []; 
        let globalTkbData = [];
        let globalDeadlineData = []; 
        
       let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        let pendingEventAction = {}; // Lưu trữ hành động cho Lịch (Edit/Delete Scope)

        function generateUUID() {
            return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        let sessionUUID = localStorage.getItem('user_uuid');
        if (!sessionUUID) { sessionUUID = generateUUID(); localStorage.setItem('user_uuid', sessionUUID); }

        function maskName(name) {
            if (!name || name.toLowerCase() === "khách") return name;
            let parts = name.trim().split(/\s+/);
            if (parts.length === 1) return parts[0].substring(0, 1) + "***";
            if (parts.length === 2) return parts[0].substring(0, 1) + "*** " + parts[1];
            return parts[0] + " *** " + parts[parts.length - 1];
        }      

        function postToGAS(payload, onSuccess, onError) {
            $.ajax({ url: SCRIPT_URL, method: "POST", data: JSON.stringify(payload), contentType: "text/plain;charset=utf-8", success: onSuccess, error: onError });
        }


        function clearCacheAndReload() { fetchAndRenderCategories(); }


  function submitRowData() {
    let col1 = $('#txtCol1').val().trim(); 
    let c2_val = $('#txtCol2').val().trim();
    let c3_val = tinymce.get('txtCol3').getContent().trim();
    
    // Tự động hứng dữ liệu dựa theo vị trí đã đổi
    let col2 = currentSheetName.toLowerCase() === 'thông báo' ? c2_val : c3_val;
    let col3 = currentSheetName.toLowerCase() === 'thông báo' ? c3_val : c2_val;
    
    let col4 = $('#txtCol4').val().trim(); let col5 = $('#txtCol5').val().trim(); let col6 = $('#txtCol6').val().trim(); let col7 = $('#txtCol7').val().trim();
    tinymce.get('txtCol3').setContent('');
    if (!col1 && !col2) { alert("Vui lòng nhập nội dung!"); return; }
    
    let btn = $('#btnSubmitRow'); btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang xử lý...').prop('disabled', true);
    postToGAS({ action: "insertSheetRowAfter", sheetName: currentSheetName, rowIndex: 1, col1: col1, col2: col2, col3: col3, col4: col4, col5: col5, col6: col6, col7: col7 }, function(response) {
        alert(response); $('#txtCol1, #txtCol2, #txtCol4, #txtCol5, #txtCol6, #txtCol7').val(''); btn.html('<i class="fa-solid fa-arrow-up-from-bracket me-2"></i> Chèn lên đầu bảng').prop('disabled', false); loadDataByHocPhan(currentSheetName);
    }, function() { alert("Lỗi kết nối!"); btn.html('<i class="fa-solid fa-arrow-up-from-bracket me-2"></i> Chèn lên đầu bảng').prop('disabled', false); });
}

function submitRowBottomData() {
    let col1 = $('#txtCol1').val().trim(); 
    let c2_val = $('#txtCol2').val().trim();
    let c3_val = tinymce.get('txtCol3').getContent().trim();
    
    let col2 = currentSheetName.toLowerCase() === 'thông báo' ? c2_val : c3_val;
    let col3 = currentSheetName.toLowerCase() === 'thông báo' ? c3_val : c2_val;
    
    let col4 = $('#txtCol4').val().trim(); let col5 = $('#txtCol5').val().trim(); let col6 = $('#txtCol6').val().trim(); let col7 = $('#txtCol7').val().trim();
    tinymce.get('txtCol3').setContent('');
    if (!col1 && !col2) { alert("Vui lòng nhập nội dung!"); return; }
    
    let btn = $('#btnSubmitRowBottom'); btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang xử lý...').prop('disabled', true);
    postToGAS({ action: "insertSheetRowAfter", sheetName: currentSheetName, rowIndex: currentSheetTotalRows, col1: col1, col2: col2, col3: col3, col4: col4, col5: col5, col6: col6, col7: col7 }, function(response) {
        alert(response); $('#txtCol1, #txtCol2, #txtCol4, #txtCol5, #txtCol6, #txtCol7').val(''); btn.html('<i class="fa-solid fa-arrow-down-to-bracket me-2"></i> Chèn xuống cuối bảng').prop('disabled', false); loadDataByHocPhan(currentSheetName);
    }, function() { alert("Lỗi kết nối!"); btn.html('<i class="fa-solid fa-arrow-down-to-bracket me-2"></i> Chèn xuống cuối bảng').prop('disabled', false); });
}

let insertRowIndexVar = -1;
function openInsertRowModal(sheetRowIndex) { 
    insertRowIndexVar = sheetRowIndex; 
    $('#insertCol1, #insertCol2, #insertCol4, #insertCol5, #insertCol6, #insertCol7').val(''); 
    if (tinymce.get('insertCol3')) tinymce.get('insertCol3').setContent(''); else $('#insertCol3').val('');
    
    if (currentSheetName.toLowerCase() !== 'thông báo') {
        $('#insertCol3').parent().css('order', '2');
        $('#insertCol2').parent().css('order', '3');
    } else {
        $('#insertCol2').parent().css('order', '2');
        $('#insertCol3').parent().css('order', '3');
    }
    $('#insertRowModal').modal('show'); 
}

function saveInsertRow() {
    let c1 = $('#insertCol1').val().trim(); 
    let c2_input = $('#insertCol2').val().trim();
    let c3_input = tinymce.get('insertCol3') ? tinymce.get('insertCol3').getContent().trim() : $('#insertCol3').val().trim();
    
    let c2 = currentSheetName.toLowerCase() === 'thông báo' ? c2_input : c3_input;
    let c3 = currentSheetName.toLowerCase() === 'thông báo' ? c3_input : c2_input;
    
    let c4 = $('#insertCol4').val().trim(); let c5 = $('#insertCol5').val().trim(); let c6 = $('#insertCol6').val().trim(); let c7 = $('#insertCol7').val().trim();
    if (!c1 && !c2) { alert("Vui lòng nhập nội dung!"); return; }
    
    let btn = $('#btnSaveInsertRow'); btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...').prop('disabled', true);
    postToGAS({ action: "insertSheetRowAfter", sheetName: currentSheetName, rowIndex: insertRowIndexVar, col1: c1, col2: c2, col3: c3, col4: c4, col5: c5, col6: c6, col7: c7 }, res => { alert(res); btn.html('Chèn nội dung').prop('disabled', false); $('#insertRowModal').modal('hide'); loadDataByHocPhan(currentSheetName); });
}

let editRowIndexVar = -1;
function openEditRowModal(sheetRowIndex, c1, c2, c3, c4, c5, c6, c7) { 
    editRowIndexVar = sheetRowIndex; 
    $('#editCol1').val(c1); 
    
    if (currentSheetName.toLowerCase() === 'thông báo') {
        $('#editCol2').val(c2); 
        if (tinymce.get('editCol3')) tinymce.get('editCol3').setContent(c3); else $('#editCol3').val(c3);
        $('#editCol2').parent().css('order', '2');
        $('#editCol3').parent().css('order', '3');
    } else {
        // Đảo ngược vị trí hiển thị Modal Edit
        $('#editCol2').val(c3); 
        if (tinymce.get('editCol3')) tinymce.get('editCol3').setContent(c2); else $('#editCol3').val(c2);
        $('#editCol3').parent().css('order', '2');
        $('#editCol2').parent().css('order', '3');
    }
    
    $('#editCol4').val(c4); $('#editCol5').val(c5); $('#editCol6').val(c6); $('#editCol7').val(c7); 
    $('#editRowModal').modal('show'); 
}

function saveEditRow() {
    let c1 = $('#editCol1').val(); 
    let c2_input = $('#editCol2').val(); 
    let c3_input = tinymce.get('editCol3') ? tinymce.get('editCol3').getContent().trim() : $('#editCol3').val().trim();
    
    let c2 = currentSheetName.toLowerCase() === 'thông báo' ? c2_input : c3_input;
    let c3 = currentSheetName.toLowerCase() === 'thông báo' ? c3_input : c2_input;
    
    let c4 = $('#editCol4').val(); let c5 = $('#editCol5').val(); let c6 = $('#editCol6').val(); let c7 = $('#editCol7').val();
    
    let btn = $('#btnSaveEditRow'); btn.html('<i class="fa-solid fa-spinner fa-spin"></i>').prop('disabled', true);
    postToGAS({ action: "editSheetRow", sheetName: currentSheetName, rowIndex: editRowIndexVar, col1: c1, col2: c2, col3: c3, col4: c4, col5: c5, col6: c6, col7: c7 }, res => { alert(res); btn.html('Lưu thay đổi').prop('disabled', false); $('#editRowModal').modal('hide'); loadDataByHocPhan(currentSheetName); });
}
        function deleteRowItem(sheetRowIndex) { if(!confirm("Bạn có chắc chắn muốn xóa dữ liệu này? Hành động này không thể hoàn tác.")) return; postToGAS({ action: "deleteSheetRow", sheetName: currentSheetName, rowIndex: sheetRowIndex }, res => { alert(res); loadDataByHocPhan(currentSheetName); }); }
        function moveRowItem(sheetRowIndex, direction) { postToGAS({ action: "moveSheetRow", sheetName: currentSheetName, rowIndex: sheetRowIndex, direction: direction }, function(res) { if(res.includes("Lỗi") || res.includes("Đã ở")) alert(res); else loadDataByHocPhan(currentSheetName); }, function() { alert("Lỗi khi di chuyển!"); }); }
        
       
        function addExamPrefix(prefix) {
            let inputEle = $('#pTkbMon'); let currentVal = inputEle.val().trim();
            currentVal = currentVal.replace(/^(Kiểm tra Quá trình|Kiểm tra Giữa học phần|Kiểm tra Kết thúc học phần)\s*[-:]?\s*/i, '');
            if (currentVal === "") { inputEle.val(prefix + " - "); } else { inputEle.val(`${prefix} - ${currentVal}`); }
            inputEle.focus(); 
        }
        
        
        
        
        
        let currentWeekOffset = 0;
        function parseDateString(dateStr) { if (!dateStr || dateStr.trim() === "") return null; let parts = dateStr.split('/'); if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]); return null; }
        function getDateOfSpecificWeekday(thu) { let today = new Date(); today.setHours(0, 0, 0, 0); today.setDate(today.getDate() + (currentWeekOffset * 7)); let currentDay = today.getDay(); let mappedCurrentDay = currentDay === 0 ? 8 : currentDay + 1; let diff = thu - mappedCurrentDay; let targetDate = new Date(today); targetDate.setDate(today.getDate() + diff); return targetDate; }
        function formatDateDDMMYYYY(dateObj) { return `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`; }
        function formatShort(dateObj) { return `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`; }

       

        document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'F12' || e.keyCode === 123) { e.preventDefault(); return false; }
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) { e.preventDefault(); return false; }
            if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) { e.preventDefault(); return false; }
            if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) { e.preventDefault(); return false; }
            if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) { e.preventDefault(); return false; }
            if (e.ctrlKey && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) { e.preventDefault(); return false; }
        });
        window.alert = function(message) {
            let toastEl = document.getElementById('autoToast'); let toastBody = document.getElementById('autoToastMessage');
            toastBody.innerText = message;
            if (message.toLowerCase().includes('lỗi') || message.toLowerCase().includes('không')) { toastEl.classList.remove('bg-success', 'bg-primary'); toastEl.classList.add('bg-danger'); } 
            else { toastEl.classList.remove('bg-danger', 'bg-primary'); toastEl.classList.add('bg-success'); }
            let toast = new bootstrap.Toast(toastEl, { delay: 2500 }); toast.show();
        };
function renderUserInfo() {
    let sidebarUserInfo = $('#sidebarUserInfo');
    if (currentUser) {
        // Gán Tên và MSSV vào thanh Sidebar
        $('#sidebarUserName').text(currentUser.name);
        $('#sidebarUserMSSV').text(currentUser.mssv);
        $('#popoverUserTitle').text(currentUser.name + " - " + currentUser.mssv);
        // Tìm bên trong hàm renderUserInfo() và thêm 4 dòng này vào khối if (currentUser)
$('#profChuyenNganh').val(currentUser.chuyenNganh || '');
$('#profKhoa').val(currentUser.khoa || '');
$('#profKhoaHoc').val(currentUser.khoaHoc || '');
$('#profNhom').val(currentUser.nhom || '');
        // Gán dữ liệu sang Trang Hồ Sơ
        $('#pageProfileName').text(currentUser.name);
        $('#pageProfileMSSV').text('MSSV: ' + currentUser.mssv);
        
        // Nhận diện Admin để đổi giao diện huy hiệu
// Sửa lại khối kiểm tra Admin trong hàm renderUserInfo()
if (currentUser.mssv === "51.01.108.008" || currentUser.mssv === "5101108008") {
    $('#btnAdminLoginToggle').removeClass('d-none').addClass('d-flex');
    $('#btnAdminManageUsers').removeClass('d-none').addClass('d-flex'); // Bật nút Quản lý TV
    $('#btnAdminMasterTkb').removeClass('d-none').addClass('d-flex');   // Bật nút MasterTKB
    $('#pageProfileRole').removeClass('bg-secondary').addClass('bg-danger').text('Quản trị viên (Admin)');
} else {
    $('#btnAdminLoginToggle').addClass('d-none').removeClass('d-flex');
    $('#btnAdminManageUsers').addClass('d-none').removeClass('d-flex'); // Ẩn nút Quản lý
    $('#pageProfileRole').removeClass('bg-danger').addClass('bg-secondary').text('Sinh viên');
}
        
        sidebarUserInfo.removeClass('d-none');
    } else {
        sidebarUserInfo.addClass('d-none');
    }
}
function saveUserProfile() {
    if (!currentUser) return;
    
    // Lấy dữ liệu người dùng gõ vào ô
    let cNganh = $('#profChuyenNganh').val().trim();
    let cKhoa = $('#profKhoa').val().trim();
    let cKhoaHoc = $('#profKhoaHoc').val().trim();
    let cNhom = $('#profNhom').val().trim();
    
    let btn = $('#btnSaveProfile'); 
    let originalHtml = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang lưu...').prop('disabled', true);
    
    // Đóng gói và Gửi dữ liệu về GAS
    postToGAS({ 
        action: "updateUserProfile", 
        mssv: currentUser.mssv, 
        chuyenNganh: cNganh, 
        khoa: cKhoa, 
        khoaHoc: cKhoaHoc, 
        nhom: cNhom 
    }, function(res) { 
        alert(res); 
        
        // Cập nhật lại bộ nhớ trình duyệt ngay lập tức
        currentUser.chuyenNganh = cNganh;
        currentUser.khoa = cKhoa;
        currentUser.khoaHoc = cKhoaHoc;
        currentUser.nhom = cNhom;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        btn.html(originalHtml).prop('disabled', false); 
    }, function() { 
        alert("Lỗi kết nối máy chủ! Không thể lưu hồ sơ."); 
        btn.html(originalHtml).prop('disabled', false); 
    });
}
// --- BẮT ĐẦU ĐOẠN CODE CẦN DÁN VÀO CUỐI FILE config.js ---

// 1. Đoạn này giúp sửa lỗi không bấm được vào menu xổ xuống khi dùng TinyMCE trong bảng nhỏ (Modal)
$(document).on('focusin', function(e) {
    if ($(e.target).closest(".tox-tinymce, .tox-tinymce-aux, .moxman-window, .tam-assetmanager-root").length) {
        e.stopImmediatePropagation();
    }
});

// 2. Đoạn cài đặt khung soạn thảo
$(document).ready(function() {
    tinymce.init({
        selector: '#txtCol3, #insertCol3, #editCol3', 
	entity_encoding: 'raw',
        plugins: 'table lists link advlist', 
        
        // NHÌN DÒNG NÀY NHÉ: Em đã thêm chữ "lineheight" vào cạnh chữ fontsize
        toolbar: 'undo redo | blocks fontfamily fontsize lineheight | bold italic underline | forecolor backcolor | alignleft aligncenter alignright alignjustify | table | bullist numlist | link',
        toolbar_mode: 'wrap', 
        // NHÌN DÒNG NÀY NHÉ: Đây là chỗ khai báo các mức khoảng cách dòng cho menu
        line_height_formats: '1 1.15 1.2 1.5 1.8 2.0 2.5 3.0',
        
        menubar: false,
        height: 350,
        branding: false,
        setup: function (editor) {
            editor.on('change', function () {
                editor.save(); 
            });
        }
    });
});

// --- KẾT THÚC ĐOẠN CODE ---
// HÀM MỞ TÀI LIỆU TRỰC TIẾP TRÊN WEB
window.openDocumentViewer = function(url, title) {
    // THÊM MỚI: Tự động nhảy tab mới và dừng lệnh ngay nếu là link Upcoder
    if (url.includes('test.upcoder.xyz') || url.includes('upcoder.xyz')) {
        window.open(url, '_blank');
        return; 
    }

    let embedUrl = url;
    
    // Tự động chuyển link Google Drive sang chế độ preview để xem trực tiếp
    if (url.includes('drive.google.com/file/d/')) {
        embedUrl = url.replace(/\/view.*$/, '/preview');
    }
    else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = "";
        
        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0].split('&')[0];
        } else if (url.includes('youtube.com/shorts/')) {
            videoId = url.split('youtube.com/shorts/')[1].split('?')[0].split('&')[0];
        } else if (url.includes('youtube.com/watch')) {
            try {
                let urlObj = new URL(url);
                videoId = urlObj.searchParams.get('v');
            } catch(e) {
                let match = url.match(/v=([^&]+)/);
                if (match) videoId = match[1];
            }
        }
        
        if (videoId) {
            // Thêm origin để xác thực tên miền tránh lỗi cấu hình Player 153
            let currentOrigin = window.location.origin !== "null" ? window.location.origin : "";
            embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1${currentOrigin ? '&origin=' + encodeURIComponent(currentOrigin) : ''}`;
        }
    }
    
    // Dọn dẹp HTML dư thừa nếu có trong tiêu đề
    let cleanTitle = $('<div>').html(title).text();
    $('#docViewerTitle').html(`<i class="fa-solid fa-file-lines me-2"></i> ${cleanTitle || 'Xem tài liệu'}`);
    
    // KIỂM TRA QUYỀN VÀ HIỂN THỊ NÚT "MỞ TAB MỚI" CHỈ CHO ADMIN (51.01.108.008)
    if (currentUser && (currentUser.mssv === "51.01.108.008" || currentUser.mssv === "5101108008")) {
        $('#btnOpenInNewTab')
            .removeClass('d-none')
            .off('click') // Xóa rác sự kiện cũ
            .on('click', function() { 
                window.open(url, '_blank'); 
            });
    } else {
        // Sinh viên thường sẽ bị ẩn đi
        $('#btnOpenInNewTab').addClass('d-none');
    }
    
    // Bật trạng thái Loading
    $('#docLoading').show(); 
    $('#docViewerIframe').attr('src', embedUrl);
    $('#documentViewerModal').modal('show');
};

// Dọn dẹp iframe khi đóng để tránh rò rỉ bộ nhớ
$(document).ready(function() {
    $('#documentViewerModal').on('hidden.bs.modal', function () {
        $('#docViewerIframe').attr('src', '');
    });
});
