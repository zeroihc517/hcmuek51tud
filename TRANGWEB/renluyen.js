// --- BỘ ĐỊNH TUYẾN VÀ RESET NAV ---
// Thêm '#btnNavRenLuyen' và '#renLuyenSection' vào hàm resetNavActive hiện có của bạn
const originalResetNavForRL = resetNavActive;
resetNavActive = function() {
    originalResetNavForRL();
    $('#btnNavRenLuyen').removeClass('active');
    $('#renLuyenSection').addClass('d-none');
};

function loadRenLuyenView() {
    document.title = "Điểm rèn luyện | Học nhóm APMA Khoa Toán";
    resetNavActive();
    $('#btnNavRenLuyen').addClass('active');
    $('#renLuyenSection').removeClass('d-none');
    updateSystemUrl('view', 'renluyen'); // Hỗ trợ định tuyến URL
    
    if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); }
    
    // Tải dữ liệu nếu đã đăng nhập
    if (currentUser && !currentUser.isGuest) {
        fetchRenLuyenData();
    }
}
function openActivityModal(parentSubcat, critId, stepScore) {
    $('#actTargetSubcat').val(critId);
    $('#txtActName').val('');
    $('#txtActUrl').val('');
    
    // Lấy điểm tối đa từ thuộc tính data-max của input ẩn (VD: 20 điểm)
    let maxScore = parseFloat($('#data_' + critId).attr('data-max')) || stepScore;
    
    $('#maxScoreHint').text(`Mỗi hoạt động ${stepScore} điểm (Tối đa ${maxScore} điểm)`);
    
    // Tạo danh sách dropdown theo cấp số cộng
    let optionsHtml = '';
    for (let i = 0; i <= maxScore; i += stepScore) {
        // Tự động chọn sẵn mức điểm cơ bản (stepScore) thay vì 0 điểm cho tiện thao tác
        let isSelected = (i === stepScore) ? 'selected' : '';
        optionsHtml += `<option value="${i}" ${isSelected}>${i} điểm</option>`;
    }
    
    // Đề phòng trường hợp maxScore không chia hết cho stepScore
    let lastValue = Math.floor(maxScore / stepScore) * stepScore;
    if (lastValue < maxScore) {
        optionsHtml += `<option value="${maxScore}">${maxScore} điểm (Tối đa)</option>`;
    }
    
    $('#txtActScore').html(optionsHtml);
    
    $('#addActivityModal').modal('show');
    setTimeout(() => $('#txtActName').focus(), 400);
}

// 2. Lưu hoạt động vào thẻ ẩn và xuất ra hàng màu trắng
function saveActivityItem() {
    let critId = $('#actTargetSubcat').val();
    let name = $('#txtActName').val().trim();
    let url = $('#txtActUrl').val().trim();
    let score = parseFloat($('#txtActScore').val());

    if (!name || isNaN(score) || score < 0) {
        alert("Vui lòng nhập Tên hoạt động và Số điểm hợp lệ!");
        return;
    }
    if (url && !url.match(/^https?:\/\//i)) url = 'https://' + url;

    let hiddenInput = $('#data_' + critId); 
    let activities = [];
    try { activities = JSON.parse(hiddenInput.val()); } catch(e) { activities = []; }

    activities.push({ name: name, url: url, score: score });
    hiddenInput.val(JSON.stringify(activities));

    $('#addActivityModal').modal('hide');
    renderActivityRows(critId);
    calcRenLuyen(); 
}

function renderActivityRows(critId) {
    let hiddenInput = $('#data_' + critId);
    let parentRow = $('#row_crit_' + critId); 
    
    $('.act-row-' + critId).remove();
    
    let activities = [];
    try { activities = JSON.parse(hiddenInput.val()); } catch(e) { activities = []; }
    
    if (activities.length === 0) return;

    let rowsHtml = '';
    activities.forEach((act, index) => {
        let safeUrl = act.url ? act.url.replace(/"/g, '&quot;').replace(/'/g, "\\'") : '#';
        let linkHtml = act.url 
            ? `<a href="${safeUrl}" target="_blank" class="btn btn-sm btn-light border text-primary py-0 px-2" title="Minh chứng"><i class="fa-brands fa-google-drive"></i> Link</a>` 
            : `<span class="badge bg-light text-muted border">Không</span>`;
        
        // Hàng hiển thị chi tiết (Nền xám nhạt để thụt lùi so với hàng trắng)
        rowsHtml += `
        <tr class="act-row-${critId}" style="background-color: #f8fafc;">
            <td></td>
            <td class="ps-5 text-muted small"><i class="fa-solid fa-arrow-turn-up fa-rotate-90 me-2"></i> ${act.name}</td>
            <td></td>
            <td class="text-center fw-bold text-dark">+ ${act.score}</td>
            <td class="text-center">
                <div class="d-flex justify-content-center align-items-center gap-1">
                    ${linkHtml}
                    <button class="btn btn-sm btn-outline-danger py-0 px-2 shadow-sm" onclick="deleteActivity('${critId}', ${index})" title="Xóa"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </td>
        </tr>`;
    });
    
    parentRow.after(rowsHtml);
}
// 3. Render các hàng màu trắng (Hoạt động)
// Hàm render các hàng màu trắng (Hoạt động chi tiết)
function renderWhiteRows(subcatId) {
    let hiddenInput = $('#data_' + subcatId);
    let parentRow = $('#row_subcat_' + subcatId); // Hàng màu hồng
    
    // Xóa các hàng trắng cũ của mục này đi để vẽ lại từ đầu
    $('.act-row-' + subcatId).remove();
    
    let activities = [];
    try { activities = JSON.parse(hiddenInput.val()); } catch(e) { activities = []; }
    
    if (activities.length === 0) return;

    let rowsHtml = '';
    activities.forEach((act, index) => {
        let safeUrl = act.url ? act.url.replace(/"/g, '&quot;').replace(/'/g, "\\'") : '#';
        
        // Link minh chứng hiển thị trực tiếp ở hàng trắng
        let linkHtml = act.url 
            ? `<a href="${safeUrl}" target="_blank" class="btn btn-sm btn-light border text-primary shadow-sm" title="Mở Minh Chứng"><i class="fa-brands fa-google-drive"></i> Link</a>` 
            : `<span class="badge bg-light text-muted border">Không có</span>`;
        
        // Thêm class rl-row-white để nhận CSS màu trắng
        rowsHtml += `
        <tr class="act-row-${subcatId} rl-row-white">
            <td></td>
            <td class="ps-4 text-dark"><i class="fa-solid fa-angle-right text-muted me-2"></i> ${act.name}</td>
            <td></td>
            <td class="text-center fw-bold text-success">+ ${act.score}</td>
            <td class="text-center">
                <div class="d-flex justify-content-center align-items-center gap-1">
                    ${linkHtml}
                    <button class="btn btn-sm btn-outline-danger py-0 px-2 shadow-sm" onclick="deleteActivity('${subcatId}', ${index})" title="Xóa HĐ này"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </td>
        </tr>`;
    });
    
    // Chèn nguyên cụm hàng trắng xuống ngay dưới hàng màu hồng
    parentRow.after(rowsHtml);
}

// 4. Xóa hoạt động
function deleteActivity(critId, index) {
    let hiddenInput = $('#data_' + critId);
    let activities = [];
    try { activities = JSON.parse(hiddenInput.val()); } catch(e) { activities = []; }
    
    activities.splice(index, 1);
    hiddenInput.val(JSON.stringify(activities));
    
    renderActivityRows(critId);
    calcRenLuyen();
}

// --- LOGIC TÍNH TOÁN VÀ GIỚI HẠN ĐIỂM ---
const RL_MAX_SCORES = { 1: 20, 2: 25, 3: 20, 4: 25, 5: 10 };
// THUẬT TOÁN TÍNH ĐIỂM BẬC THANG (TRẮNG -> HỒNG -> CAM -> TỔNG)
function calcRenLuyen() {
    let pinkSums = {};   // Nơi hứng điểm từ hàng Trắng
    let orangeSums = {}; // Nơi hứng điểm từ hàng Hồng
    let grandTotal = 0;  // Nơi hứng điểm từ hàng Cam

    // ==========================================
    // BƯỚC 1: QUÉT HÀNG TRẮNG GOM ĐIỂM CHO HÀNG HỒNG
    // ==========================================
    
    // 1.1 Hàng trắng có Minh chứng
    $('.rl-crit-data').each(function() {
        let parentSubcat = $(this).attr('data-parent-subcat');
        let critId = $(this).attr('id').replace('data_', '');
        let acts = [];
        try { acts = JSON.parse($(this).val()); } catch(e) {}
        
        let sum = 0;
        acts.forEach(act => { sum += parseFloat(act.score) || 0; });
        $('#crit_total_' + critId).text(sum); 
        pinkSums[parentSubcat] = (pinkSums[parentSubcat] || 0) + sum;
    });

    // 1.2 Hàng trắng Gõ trực tiếp
    $('.rl-direct-input').each(function() {
        let parentSubcat = $(this).attr('data-parent-subcat');
        let maxScore = parseFloat($(this).attr('data-max'));
        let sum = parseFloat($(this).val()) || 0;
        
        let cappedSum = sum > maxScore ? maxScore : sum;
        if(sum !== cappedSum) $(this).val(cappedSum); 
        
        pinkSums[parentSubcat] = (pinkSums[parentSubcat] || 0) + cappedSum;
    });

    // 1.3 Hàng trắng Tick chọn
    $('.rl-check-input').each(function() {
        let parentSubcat = $(this).attr('data-parent-subcat');
        let scoreIfChecked = parseFloat($(this).attr('data-score')) || 0;
        let sum = $(this).is(':checked') ? scoreIfChecked : 0;
        
        pinkSums[parentSubcat] = (pinkSums[parentSubcat] || 0) + sum;
    });

    // 1.4 Hàng trắng Dropdown
    $('.rl-select-input').each(function() {
        let parentSubcat = $(this).attr('data-parent-subcat');
        let sum = parseFloat($(this).val()) || 0;
        
        if(sum < 0) {
            $(this).removeClass('text-success').addClass('text-danger');
        } else {
            $(this).removeClass('text-danger').addClass('text-success');
        }
        pinkSums[parentSubcat] = (pinkSums[parentSubcat] || 0) + sum;
    });

    // ==========================================
    // BƯỚC 2: QUÉT HÀNG HỒNG GOM ĐIỂM CHO HÀNG CAM
    // ==========================================
    $('.rl-level-2').each(function() {
        let parentCat = $(this).attr('data-parent-cat');
        let maxScore = parseFloat($(this).attr('data-max'));
        let subcatId = $(this).attr('id').replace('row_subcat_', '');
        
        // Chỉ lấy điểm từ các hàng trắng thuộc về nó
        let sumWhite = pinkSums[subcatId] || 0; 
        
        // Ép giới hạn điểm của hàng Hồng
        let cappedPink = sumWhite > maxScore ? maxScore : sumWhite;
        $('#subcat_total_' + subcatId).text(cappedPink);
        
        // Đẩy điểm Hồng lên hàng Cam
        orangeSums[parentCat] = (orangeSums[parentCat] || 0) + cappedPink;
    });

    // ==========================================
    // BƯỚC 3: QUÉT HÀNG CAM ĐỂ RA TỔNG ĐIỂM TẤT CẢ
    // ==========================================
    $('.rl-level-1').each(function() {
        let catId = $(this).attr('data-cat');
        let maxScore = parseFloat($(this).attr('data-max'));
        
        // Chỉ lấy điểm từ các hàng Hồng thuộc về nó
        let sumPink = orangeSums[catId] || 0; 
        
        // Ép giới hạn điểm của hàng Cam
        let cappedOrange = sumPink > maxScore ? maxScore : sumPink;
        $('#cat_total_' + catId).text(cappedOrange);
        
        // Đẩy điểm Cam vào Tổng Tất Cả
        grandTotal += cappedOrange; 
    });

    // ==========================================
    // BƯỚC 4: CHỐT TỔNG VÀ XẾP LOẠI
    // ==========================================
    $('#rlGrandTotal').text(grandTotal);
    
    let rank = "Kém";
    if (grandTotal >= 90) rank = "Xuất sắc";
    else if (grandTotal >= 80) rank = "Giỏi";
    else if (grandTotal >= 65) rank = "Khá";
    else if (grandTotal >= 50) rank = "Trung bình";
    else if (grandTotal >= 35) rank = "Yếu";
    
    $('#rlRank').text(rank);
}

// ==========================================
// LOGIC QUẢN LÝ NHIỀU MINH CHỨNG
// ==========================================
function openProofModal(btnEl) {
    let td = $(btnEl).closest('td');
    let hiddenInput = td.find('.rl-proof-data');
    
    // Tạo ID ngẫu nhiên cho ô input ẩn nếu chưa có để định vị chính xác
    if (!hiddenInput.attr('id')) {
        hiddenInput.attr('id', 'proof_data_' + Math.random().toString(36).substr(2, 9));
    }
    
    $('#proofTargetRow').val(hiddenInput.attr('id'));
    $('#txtProofName').val('');
    $('#txtProofUrl').val('');
    $('#addProofModal').modal('show');
    
    setTimeout(() => $('#txtProofName').focus(), 400);
}

function saveProofItem() {
    let name = $('#txtProofName').val().trim();
    let url = $('#txtProofUrl').val().trim();
    let targetId = $('#proofTargetRow').val();
    
    if (!name || !url) {
        alert("Vui lòng nhập đầy đủ Tên hoạt động và Link Drive!");
        return;
    }
    if (!url.match(/^https?:\/\//i)) url = 'https://' + url;

    let hiddenInput = $('#' + targetId);
    let proofs = [];
    try { proofs = JSON.parse(hiddenInput.val()); } catch(e) { proofs = []; }
    
    proofs.push({ name: name, url: url });
    hiddenInput.val(JSON.stringify(proofs));
    
    // Vẽ lại danh sách thẻ minh chứng
    renderProofs(hiddenInput.closest('td'));
    $('#addProofModal').modal('hide');
}

function renderProofs(tdElement) {
    let hiddenInput = $(tdElement).find('.rl-proof-data');
    let listContainer = $(tdElement).find('.rl-proof-list');
    
    let proofs = [];
    try { proofs = JSON.parse(hiddenInput.val()); } catch(e) { proofs = []; }
    
    let html = '';
    proofs.forEach((p, index) => {
        let inputId = hiddenInput.attr('id');
        
        // Xử lý an toàn chuỗi URL và Tên để không bị lỗi dấu nháy
        let safeUrl = p.url ? p.url.replace(/"/g, '&quot;').replace(/'/g, "\\'") : '#';
        let safeName = p.name ? p.name.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Minh chứng';
        
        // Dùng div bình thường thay vì badge để không bị Bootstrap chặn Click
        html += `
        <div class="d-inline-flex align-items-center gap-2 bg-white border border-primary-subtle shadow-sm rounded px-2 py-1 mb-1 me-1" style="font-size: 13.5px;">
            <i class="fa-brands fa-google-drive text-primary" style="cursor: pointer;" onclick="window.open('${safeUrl}', '_blank'); event.stopPropagation();" title="Mở Drive"></i>
            
            <a href="${safeUrl}" target="_blank" onclick="event.stopPropagation();" class="text-decoration-none text-primary text-truncate fw-bold" style="max-width: 150px;" title="Link: ${safeUrl}">${safeName}</a>
            
            <span style="border-left: 1px solid #cbd5e1; height: 14px; margin: 0 4px;"></span>
            
            <i class="fa-solid fa-xmark text-danger" style="cursor: pointer;" onclick="deleteProofItem('${inputId}', ${index}); event.stopPropagation();" title="Xóa minh chứng này"></i>
        </div>`;
    });
    listContainer.html(html);
}
function deleteProofItem(targetId, index) {
    let hiddenInput = $('#' + targetId);
    let proofs = [];
    try { proofs = JSON.parse(hiddenInput.val()); } catch(e) { proofs = []; }
    
    proofs.splice(index, 1);
    hiddenInput.val(JSON.stringify(proofs));
    
    renderProofs(hiddenInput.closest('td'));
}

function submitRenLuyen() {
    if (!currentUser || currentUser.isGuest) {
        alert("Vui lòng đăng nhập để lưu phiếu đánh giá!");
        return;
    }

    let rlData = {};
    
    // Lưu Hoạt động Minh chứng
    $('.rl-crit-data').each(function() {
        let critId = $(this).attr('id').replace('data_', '');
        try { rlData[critId] = JSON.parse($(this).val()); } catch(e) { rlData[critId] = []; }
    });

    // Lưu Gõ trực tiếp
    $('.rl-direct-input').each(function() {
        let critId = $(this).attr('id').replace('direct_', '');
        rlData[critId] = parseFloat($(this).val()) || 0;
    });

    // Lưu Trạng thái Checkbox (1 = checked, 0 = unchecked)
    $('.rl-check-input').each(function() {
        let critId = $(this).attr('id').replace('check_', '');
        rlData[critId] = $(this).is(':checked') ? 1 : 0; 
    });

    // Lưu Giá trị Dropdown
    $('.rl-select-input').each(function() {
        let critId = $(this).attr('id').replace('select_', '');
        rlData[critId] = parseFloat($(this).val()) || 0;
    });

    let totalScore = $('#rlGrandTotal').text();
    let rank = $('#rlRank').text();
    
    let btn = $('#btnSaveRenLuyen');
    let originalHtml = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang lưu...').prop('disabled', true);

    postToGAS({
        action: "saveRenLuyen",
        mssv: currentUser.mssv,
        rlData: JSON.stringify(rlData),
        totalScore: totalScore,
        rank: rank
    }, function(res) {
        alert(res);
        btn.html(originalHtml).prop('disabled', false);
    }, function() {
        alert("Lỗi kết nối máy chủ! Không thể lưu.");
        btn.html(originalHtml).prop('disabled', false);
    });
}

function fetchRenLuyenData() {
    $.ajax({
        url: SCRIPT_URL + "?action=getRenLuyen&mssv=" + currentUser.mssv,
        method: "GET",
        dataType: "json",
        success: function(res) {
            if (res && Object.keys(res).length > 0) {
                let dataObj = typeof res === 'string' ? JSON.parse(res) : res;
                
                // Khôi phục Minh chứng
                $('.rl-crit-data').each(function() {
                    let critId = $(this).attr('id').replace('data_', '');
                    if (dataObj[critId]) {
                        $(this).val(JSON.stringify(dataObj[critId]));
                        renderActivityRows(critId);
                    }
                });

                // Khôi phục Nhập điểm
                $('.rl-direct-input').each(function() {
                    let critId = $(this).attr('id').replace('direct_', '');
                    if (dataObj[critId] !== undefined) $(this).val(dataObj[critId]);
                });

                // Khôi phục Checkbox
                $('.rl-check-input').each(function() {
                    let critId = $(this).attr('id').replace('check_', '');
                    if (dataObj[critId] !== undefined) $(this).prop('checked', dataObj[critId] == 1);
                });

                // Khôi phục Dropdown
                $('.rl-select-input').each(function() {
                    let critId = $(this).attr('id').replace('select_', '');
                    if (dataObj[critId] !== undefined) $(this).val(dataObj[critId]);
                });
                
                calcRenLuyen(); // Tính lại điểm
            }
        }
    });
}