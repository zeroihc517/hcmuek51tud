 const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFrdlU4Y-v7gdqmwrUK550KU-Dnn4_wArqSNxyxsZ5AGFvmWeC4id_YP8_Lfpo25Am/exec'; 

        let isAdmin = false;
        let currentSheetName = "";
        let currentSheetTotalRows = 0;
        window.qaThreadParts = {};
        let globalCategories = []; 
        let globalTkbData = [];
        let globalDeadlineData = []; 
        
        let currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;
        let pendingEventAction = {}; // Lưu trữ hành động cho Lịch (Edit/Delete Scope)

        function generateUUID() {
            return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        let sessionUUID = sessionStorage.getItem('user_uuid');
        if (!sessionUUID) { sessionUUID = generateUUID(); sessionStorage.setItem('user_uuid', sessionUUID); }

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
            let col1 = $('#txtCol1').val().trim(); let col2 = $('#txtCol2').val().trim(); let col3 = $('#txtCol3').val().trim(); let col4 = $('#txtCol4').val().trim();
            if (!col1 && !col2) { alert("Vui lòng nhập nội dung!"); return; }
            let btn = $('#btnSubmitRow'); btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang xử lý...').prop('disabled', true);
            postToGAS({ action: "insertSheetRowAfter", sheetName: currentSheetName, rowIndex: 1, col1: col1, col2: col2, col3: col3, col4: col4 }, function(response) {
                alert(response); $('#txtCol1').val(''); $('#txtCol2').val(''); $('#txtCol3').val(''); $('#txtCol4').val(''); btn.html('<i class="fa-solid fa-arrow-up-from-bracket me-2"></i> Chèn lên đầu bảng').prop('disabled', false); loadDataByHocPhan(currentSheetName);
            }, function() { alert("Lỗi kết nối!"); btn.html('<i class="fa-solid fa-arrow-up-from-bracket me-2"></i> Chèn lên đầu bảng').prop('disabled', false); });
        }
        function submitRowBottomData() {
            let col1 = $('#txtCol1').val().trim(); let col2 = $('#txtCol2').val().trim(); let col3 = $('#txtCol3').val().trim(); let col4 = $('#txtCol4').val().trim();
            if (!col1 && !col2) { alert("Vui lòng nhập nội dung!"); return; }
            let btn = $('#btnSubmitRowBottom'); btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang xử lý...').prop('disabled', true);
            postToGAS({ action: "insertSheetRowAfter", sheetName: currentSheetName, rowIndex: currentSheetTotalRows, col1: col1, col2: col2, col3: col3, col4: col4 }, function(response) {
                alert(response); $('#txtCol1').val(''); $('#txtCol2').val(''); $('#txtCol3').val(''); $('#txtCol4').val(''); btn.html('<i class="fa-solid fa-arrow-down-to-bracket me-2"></i> Chèn xuống cuối bảng').prop('disabled', false); loadDataByHocPhan(currentSheetName);
            }, function() { alert("Lỗi kết nối!"); btn.html('<i class="fa-solid fa-arrow-down-to-bracket me-2"></i> Chèn xuống cuối bảng').prop('disabled', false); });
        }
        let insertRowIndexVar = -1;
        function openInsertRowModal(sheetRowIndex) { insertRowIndexVar = sheetRowIndex; $('#insertCol1').val(''); $('#insertCol2').val(''); $('#insertCol3').val(''); $('#insertCol4').val(''); $('#insertRowModal').modal('show'); }
        function saveInsertRow() {
            let c1 = $('#insertCol1').val().trim(); let c2 = $('#insertCol2').val().trim(); let c3 = $('#insertCol3').val().trim(); let c4 = $('#insertCol4').val().trim();
            if (!c1 && !c2) { alert("Vui lòng nhập nội dung!"); return; }
            let btn = $('#btnSaveInsertRow'); btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...').prop('disabled', true);
            postToGAS({ action: "insertSheetRowAfter", sheetName: currentSheetName, rowIndex: insertRowIndexVar, col1: c1, col2: c2, col3: c3, col4: c4 }, res => { alert(res); btn.html('Chèn nội dung').prop('disabled', false); $('#insertRowModal').modal('hide'); loadDataByHocPhan(currentSheetName); });
        }
        let editRowIndexVar = -1;
        function openEditRowModal(sheetRowIndex, c1, c2, c3, c4) { editRowIndexVar = sheetRowIndex; $('#editCol1').val(c1); $('#editCol2').val(c2); $('#editCol3').val(c3); $('#editCol4').val(c4); $('#editRowModal').modal('show'); }
        function saveEditRow() {
            let c1 = $('#editCol1').val(); let c2 = $('#editCol2').val(); let c3 = $('#editCol3').val(); let c4 = $('#editCol4').val();
            let btn = $('#btnSaveEditRow'); btn.html('<i class="fa-solid fa-spinner fa-spin"></i>').prop('disabled', true);
            postToGAS({ action: "editSheetRow", sheetName: currentSheetName, rowIndex: editRowIndexVar, col1: c1, col2: c2, col3: c3, col4: c4 }, res => { alert(res); btn.html('Lưu thay đổi').prop('disabled', false); $('#editRowModal').modal('hide'); loadDataByHocPhan(currentSheetName); });
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
