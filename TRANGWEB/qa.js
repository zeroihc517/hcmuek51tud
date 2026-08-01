let codeEditor;

$(document).ready(function() {
    // Khởi tạo Ace Editor giao diện sáng (giống hình của bạn)
    codeEditor = ace.edit("codeEditorContainer");
    codeEditor.setTheme("ace/theme/textmate"); 
    codeEditor.session.setMode("ace/mode/c_cpp");
    codeEditor.setOptions({ 
        fontSize: "15px",
        showPrintMargin: false
    });
});

// Hàm ẩn/hiện giữa 2 chế độ
function toggleInputMode() {
    let mode = $('input[name="inputType"]:checked').val();
    if (mode === 'code') {
        $('#txtQuestion').addClass('d-none');
        $('#codeEditorContainer').removeClass('d-none');
        $('#codeLanguage').removeClass('d-none');
    } else {
        $('#txtQuestion').removeClass('d-none');
        $('#codeEditorContainer').addClass('d-none');
        $('#codeLanguage').addClass('d-none');
    }
}

// Đổi ngôn ngữ tô màu trong khung gõ
function changeCodeLang() {
    let lang = $('#codeLanguage').val();
    codeEditor.session.setMode("ace/mode/" + lang);
}
function formatCodeBlocks(text) {
    if (!text) return "";
    return text.replace(/```(cpp|python|c\+\+|c)([\s\S]*?)```/gi, function(match, lang, code) {
        let escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
        let safeLang = (lang.toLowerCase() === 'c++' || lang.toLowerCase() === 'c') ? 'cpp' : lang.toLowerCase();
        return `<pre><code class="language-${safeLang}">${escapedCode}</code></pre>`;
    });
}

window.copyShareCodeDirect = function(index, btnElement) {
    let item = window.shareCodeList[index];
    
    // Bóc tách Code thô từ Markdown (y hệt cách bóc tách của hàm Sửa Code)
    let rawCode = item.codeContent.replace(/^```[a-zA-Z\+\#]*\n?/g, '').replace(/\n?```$/g, '');
    
    navigator.clipboard.writeText(rawCode).then(() => {
        let originalHtml = btnElement.innerHTML;
        let originalBg = btnElement.style.background;
        let originalColor = btnElement.style.color;
        
        // Đổi giao diện sang trạng thái thành công (Nút xanh lá)
        btnElement.innerHTML = '<i class="fa-solid fa-check"></i> Đã Copy';
        btnElement.style.background = '#16a34a'; 
        btnElement.style.color = '#ffffff';
        
        // Trả lại trạng thái ban đầu sau 2 giây
        setTimeout(() => {
            btnElement.innerHTML = originalHtml;
            btnElement.style.background = originalBg;
            btnElement.style.color = originalColor;
        }, 2000);
    }).catch(err => {
        alert('Trình duyệt không hỗ trợ copy tự động!');
    });
};
function checkNewQA() { $.ajax({ url: SCRIPT_URL + "?action=getQAData", method: "GET", dataType: "json", success: function(data) { 
            if (!data || data.length === 0) return; 
            if (data.some(row => (row[3] || '').trim() === '')) {
                // Sửa ở đây: Hiển thị cả 2 badge
                $('#qaSidebarBadge, #shareCodeSidebarBadge').removeClass('d-none'); 
            } else { 
                // Sửa ở đây: Ẩn cả 2 badge
                $('#qaSidebarBadge, #shareCodeSidebarBadge').addClass('d-none'); 
            } 
        }}); }
function openQASection() { 
    document.title = "Hỗ trợ & Giải đáp | Học nhóm APMA Khoa Toán";
    resetNavActive(); 
    $('#btnNavShareCode').addClass('active'); 
    $('#qaSection').removeClass('d-none'); 
    
    updateSystemUrl('view', 'qa'); // Đổi URL thành ?view=qa
    if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); }
    if (currentUser) { $('#txtMSSV').val(currentUser.mssv).prop('readonly', true).css({ 'background-color': '#e9ecef', 'cursor': 'not-allowed' }); } 
    else { $('#txtMSSV').val('').prop('readonly', false).css({ 'background-color': '#ffffff', 'cursor': 'text' }); }
    loadQAData(); 
}
      function sendQuestion() {
    let mssvValue = currentUser ? currentUser.mssv : $('#txtMSSV').val().trim(); 
    
    // 1. XỬ LÝ LẤY CHỦ ĐỀ VÀ KIỂM TRA
   let topicVal = $('#qaTopicHocPhan').val() || $('#qaTopicHoTro').val();
    let topicOther = $('#qaTopicOther').val().trim();
    let finalTopic = "";
    
    if (!topicVal) { 
        alert("Vui lòng chọn chủ đề cho câu hỏi của bạn!"); 
        $('#qaTopic').focus(); 
        return; 
    }
    
    if (topicVal === 'Khác') {
        if (!topicOther) { 
            alert("Bạn đã chọn 'Khác', vui lòng ghi rõ chủ đề của bạn!"); 
            $('#qaTopicOther').focus(); 
            return; 
        }
        finalTopic = topicOther;
    } else {
        finalTopic = topicVal;
    }

    // 2. XỬ LÝ LẤY NỘI DUNG CODE HOẶC TEXT
    let qText = "";
    let mode = $('input[name="inputType"]:checked').val();
    if (mode === 'code') {
        let rawCode = codeEditor.getValue().trim();
        let lang = $('#codeLanguage').val() === 'c_cpp' ? 'cpp' : 'python';
        if (rawCode !== "") {
            qText = "```" + lang + "\n" + rawCode + "\n```"; 
        }
    } else {
        qText = $('#txtQuestion').val().trim();
    }

    if (!mssvValue) { alert("Vui lòng nhập mã số sinh viên hoặc email liên hệ!"); $('#txtMSSV').focus(); return; } 
    if (!qText) { alert("Vui lòng nhập nội dung câu hỏi!"); return; }
    
    // 3. ĐÓNG GÓI CHỦ ĐỀ VÀO TRONG CÂU HỎI (Áp dụng màu sắc chuẩn của web)
    let finalPayload = `<span class="badge mb-2 shadow-sm" style="background-color: #f1f5f9; color: #475569; font-size: 12.5px; border: 1px solid #e2e8f0;"><i class="fa-solid fa-tag me-1" style="color: #0f4c81;"></i> ${finalTopic}</span>\n\n${qText}`;
    
    let btn = $('#btnSubmitQ'); 
    btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang gửi...').prop('disabled', true);
    
    postToGAS({ action: "submitQuestion", mssv: mssvValue, question: finalPayload }, function(response) { 
        alert(response); 
        
        // Reset sạch sẽ form sau khi gửi thành công
        $('#txtQuestion').val(''); 
      $('#qaTopicHocPhan').val(''); 
$('#qaTopicHoTro').val('');
        if (typeof codeEditor !== 'undefined') codeEditor.setValue(''); 
        
        btn.html('<i class="fa-solid fa-paper-plane me-2"></i> Gửi câu hỏi').prop('disabled', false); 
        loadQAData(); 
        checkNewQA(); 
    }, function() { 
        alert("Lỗi kết nối máy chủ!"); 
        btn.html('<i class="fa-solid fa-paper-plane me-2"></i> Gửi câu hỏi').prop('disabled', false); 
    });
}

function maskMSSV(mssv) { 
    let str = String(mssv).trim(); 
    if (!str) return "";

    // Lấy thông tin người dùng đang đăng nhập trên trình duyệt
    let activeUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    
    // Nếu người xem là Admin (51.01.108.008) -> Giữ nguyên MSSV gốc, không che
    if (activeUser && (activeUser.mssv === "51.01.108.008" || activeUser.mssv === "5101108008")) {
        return str;
    }

    // Nếu người xem là sinh viên thường -> Tiến hành che MSSV
    if (str.length <= 6) return str; 
    return str.substring(0, 3) + '***' + str.substring(str.length - 3); 
}
     function parseThread(text, rowIndex) {
    let parts = text.split(/(\[SV\][\s\S]*?\[\/SV\])/g).filter(p => p.trim() !== ""); 
    window.qaThreadParts[rowIndex] = parts; 
    let html = '';
    
    parts.forEach((part, index) => { 
        let content = part.trim(); 
        if(content === "") return;
        
        if (content.startsWith("[SV]") && content.endsWith("[/SV]")) { 
            let svTextRaw = content.replace("[SV]", "").replace("[/SV]", "").trim(); 
            let svName = "Sinh viên"; 
            let svMsg = svTextRaw;
            let timeHtml = "";
            
            // Xử lý tách thời gian do backend tự động chèn thêm "(dd/mm/yyyy hh:mm)\n"
            let timeMatch = svTextRaw.match(/^\((.*?)\)\n/);
            if (timeMatch) {
                let timeStr = timeMatch[1]; // Lấy chuỗi thời gian
                timeHtml = `<span class="text-muted ms-2" style="font-size: 12.5px; font-weight: normal;"><i class="fa-regular fa-clock"></i> ${timeStr}</span>`;
svTextRaw = svTextRaw.replace(timeMatch[0], '').trim();
            }
            
if (svTextRaw.includes(":::")) {
    let splitData = svTextRaw.split(":::");
    let rawMssv = splitData[0].trim();
    let displayMssv = isAdmin ? rawMssv : maskMSSV(rawMssv);
    svName = "Sinh viên (" + displayMssv + ")";

    // Xử lý mới: Tách thời gian và nội dung ra riêng biệt
    if (splitData.length >= 3) {
        // Lấy chuỗi thời gian được kẹp ở giữa
        let timeStr = splitData[1].trim();
        // Gán thời gian vào UI để hiển thị gọn gàng cạnh tên người gửi
        timeHtml = `<span class="text-muted ms-2" style="font-size: 12.5px; font-weight: normal;"><i class="fa-regular fa-clock"></i> ${timeStr}</span>`;

        // Chỉ lấy nội dung tin nhắn (từ phần tử thứ 2 trở đi)
        svMsg = splitData.slice(2).join(":::").trim();
    } else {
        // Dành cho các tin nhắn phiên bản cũ chỉ có [MSSV:::Nội dung]
        svMsg = splitData.slice(1).join(":::").trim();
    }
}
            let svFormattedMsg = formatCodeBlocks(svMsg).replace(/(?:\r\n|\r|\n)(?!(?:[^<]*<\/pre>))/g, '<br>'); 
            
            html += `<div class="msg-sv"><i class="fa-solid fa-user-graduate me-2"></i><strong>${svName}</strong>${timeHtml}:<br>${svFormattedMsg}`; 
            
            if (isAdmin) { 
                html += `<div class="mt-2 text-end"><button class="btn btn-sm btn-outline-danger py-0" onclick="deleteThreadPart(${rowIndex}, ${index})" style="font-size: 12px;"><i class="fa-solid fa-trash"></i> Xóa phản hồi này</button></div>`; 
            } 
            html += `</div>`; 
        } else { 
            let adminText = formatCodeBlocks(content).replace(/(?:\r\n|\r|\n)(?!(?:[^<]*<\/pre>))/g, '<br>'); 
            html += `<div class="msg-admin"><i class="fa-solid fa-user-shield me-2"></i><strong>Admin:</strong><br>${adminText}`; 
            if (isAdmin) { 
                html += `<div class="mt-2 text-end"><button class="btn btn-sm btn-outline-warning py-0 me-2" onclick="openEditQAModal(${rowIndex}, ${index})" style="font-size: 12px;"><i class="fa-solid fa-pen"></i> Sửa</button><button class="btn btn-sm btn-outline-danger py-0" onclick="deleteThreadPart(${rowIndex}, ${index})" style="font-size: 12px;"><i class="fa-solid fa-trash"></i> Xóa</button></div>`; 
            } 
            html += `</div>`; 
        }
    }); 
    return html;
}
       function loadQAData() {
    $('#qaListArea').html(''); 
    $('#qaLoadingStatus').removeClass('d-none');
    
    $.ajax({ 
        url: SCRIPT_URL + "?action=getQAData", 
        method: "GET", 
        dataType: "json", 
        success: function(data) {
            $('#qaLoadingStatus').addClass('d-none');
            
            // Lưu lại chuỗi data ngay khi load thành công (dành cho tính năng tự động làm mới ngầm)
            window.lastQADataString = JSON.stringify(data); 

            if (!data || data.length === 0) { 
                $('#qaListArea').html('<div class="text-center p-4 text-muted border rounded bg-white"><i class="fa-regular fa-comments fs-2 mb-2"></i><br>Chưa có câu hỏi nào. Bạn hãy là người đầu tiên đặt câu hỏi nhé!</div>'); 
                $('#qaSidebarBadge').addClass('d-none'); 
                return; 
            }
            
            let html = ''; 
            let hasUnanswered = false;
            
data.forEach(row => {
    let time = row[0] || ''; 
    let rawMssv = row[1] || ''; 
    let displayMssv = isAdmin ? rawMssv : maskMSSV(rawMssv); 
    
    // --- XỬ LÝ LỌC THẺ TAG ---
    let rawQuestion = row[2] || '';
    let topicBadgeHtml = '';
    
    // Dùng Regex để bắt thẻ <span> chứa chủ đề đã được lưu
    let badgeRegex = /(<span class="badge[^>]*>.*?<\/span>)\s*/;
    let match = rawQuestion.match(badgeRegex);
    
    if (match) {
        // Dịch chuyển lớp css để margin cho đẹp khi đứng cạnh MSSV
        topicBadgeHtml = match[1].replace('mb-2', 'ms-2'); 
        rawQuestion = rawQuestion.replace(badgeRegex, ''); // Cắt bỏ tag khỏi nội dung chính
    }
    
    let question = formatCodeBlocks(rawQuestion);
    // -------------------------

    let answer = row[3] || ''; 
    let upvotes = parseInt(row[4]) || 0; 
    let downvotes = parseInt(row[5]) || 0; 
    let rowIndex = row[6];       
    
    let isNew = answer.trim() === ""; 
    if (isNew) hasUnanswered = true; 
    let itemClass = isNew ? 'qa-item unanswered-item' : 'qa-item';
               html += `<div class="${itemClass}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="qa-time"><i class="fa-regular fa-clock"></i> ${time} <span class="mx-2">|</span> <i class="fa-solid fa-id-card"></i> SV: <strong class="text-secondary">${displayMssv}</strong> ${topicBadgeHtml}</div>`;
                
                if (isAdmin) { 
                    html += `<button class="btn btn-sm btn-outline-danger fw-bold" onclick="deleteQA(${rowIndex})" id="btnDelQA-${rowIndex}"><i class="fa-solid fa-trash"></i> Xóa toàn bộ chuỗi này</button>`; 
                }
                
                html += `   </div>
                            <div class="qa-question">${question}</div>`;
             
                if (!isNew) {
                    // Nếu đã có luồng tin nhắn, in nội dung đó ra
                    html += parseThread(answer, rowIndex);
                } else { 
                    // Nếu trống, in dòng thông báo chờ admin
                    html += `<div class="qa-no-answer"><i class="fa-solid fa-hourglass-half me-2"></i> Đang chờ giải đáp...</div>`; 
                }
                
                // ============ TẠO ID & KIỂM TRA TRẠNG THÁI VOTE ============
                // Tạo ID cố định vĩnh viễn không bị ảnh hưởng khi xóa hàng
                let uniqueId = "QA_" + time.replace(/\D/g, '') + "_" + rawMssv.replace(/\D/g, '');

                let currentUserId = currentUser ? currentUser.mssv : (localStorage.getItem('user_uuid') || "guest");
                let voteKey = `voted_qa_${uniqueId}_${currentUserId}`; 
                let votedType = localStorage.getItem(voteKey);

                let upClass = votedType === 'up' ? 'btn-vote up voted' : 'btn-vote up';
                let downClass = votedType === 'down' ? 'btn-vote down voted' : 'btn-vote down';
                // ==========================================================

                // Gắn ID mới và Class mới vào thanh công cụ
                html += `<div class="vote-action-bar">
                            <div class="vote-group" id="voteArea-${rowIndex}">
                                <button class="${upClass}" onclick="castVote(${rowIndex}, 'up', this, '${uniqueId}')"><i class="fa-solid fa-thumbs-up"></i> Hữu ích (${upvotes})</button>
                                <button class="${downClass}" onclick="castVote(${rowIndex}, 'down', this, '${uniqueId}')"><i class="fa-solid fa-thumbs-down"></i> Chưa rõ (${downvotes})</button>
                            </div>
                            <button class="btn-reply-toggle m-0" onclick="$('#replyBox-${rowIndex}').toggleClass('d-none')">
                                <i class="fa-solid fa-comment-dots"></i> Bình luận / Phản hồi
                            </button>
                        </div>
                        
                        <div id="replyBox-${rowIndex}" class="reply-box d-none mt-3">
                            <textarea id="txtReply-${rowIndex}" class="form-control mb-2" rows="2" placeholder="Nhập bình luận hoặc ý kiến của bạn..."></textarea>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-primary fw-bold" onclick="sendReply(${rowIndex})" id="btnSendReply-${rowIndex}" style="background: var(--primary-color); border:none;">Gửi bình luận</button>
                                <button class="btn btn-sm btn-light border" onclick="$('#replyBox-${rowIndex}').addClass('d-none')">Hủy</button>
                            </div>
                        </div>`;
                        
                if (isAdmin) { 
                    html += `<div class="mt-3 p-3 rounded" style="background: #fff; border: 1px dashed var(--accent-red);">
                                <h6 class="mb-2" style="color: var(--accent-red); font-size: 14px; font-weight: 700;"><i class="fa-solid fa-user-shield"></i> Trả lời vào chuỗi (Admin)</h6>
                                <textarea id="txtAdminReply-${rowIndex}" class="form-control mb-2" rows="2" placeholder="Nhập trả lời dành cho sinh viên..."></textarea>
                                <button class="btn btn-sm text-white fw-bold" style="background: var(--accent-red);" onclick="sendAdminReply(${rowIndex})" id="btnAdminSubmit-${rowIndex}"><i class="fa-solid fa-reply"></i> Đăng câu trả lời</button>
                             </div>`; 
                } 
                
                html += `</div>`; // Đóng thẻ .qa-item
            });
            
            $('#qaListArea').html(html); 
            
            if (hasUnanswered) {
                $('#qaSidebarBadge').removeClass('d-none'); 
            } else {
                $('#qaSidebarBadge').addClass('d-none');
            }
            
            if (window.Prism) {
                Prism.highlightAllUnder(document.getElementById('qaListArea'));
            }
            applyKaTeX('qaListArea');
        }

    });
}
function deleteThreadPart(rowIndex, partIndex) { if(!confirm("Bạn có chắc chắn muốn xóa đoạn tin nhắn này?")) return; window.qaThreadParts[rowIndex].splice(partIndex, 1); postToGAS({ action: "updateQAThread", rowIndex: rowIndex, fullText: window.qaThreadParts[rowIndex].join("\n\n") }, function(res) { loadQAData(); }, function() { alert("Lỗi!"); }); }
        let editQARowIndex = -1; let editQAPartIndex = -1;
        function openEditQAModal(rowIndex, partIndex) { editQARowIndex = rowIndex; editQAPartIndex = partIndex; $('#editQAText').val(window.qaThreadParts[rowIndex][partIndex].trim()); $('#editQAModal').modal('show'); }
        function saveEditQA() { let newText = $('#editQAText').val().trim(); if (newText === "") { alert("Nội dung không được để trống!"); return; } let btn = $('#btnSaveEditQA'); btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...').prop('disabled', true); window.qaThreadParts[editQARowIndex][editQAPartIndex] = newText; postToGAS({ action: "updateQAThread", rowIndex: editQARowIndex, fullText: window.qaThreadParts[editQARowIndex].join("\n\n") }, function(res) { btn.html('Lưu thay đổi').prop('disabled', false); $('#editQAModal').modal('hide'); loadQAData(); }, function() { alert("Lỗi!"); btn.html('Lưu thay đổi').prop('disabled', false); }); }
        function deleteQA(rowIndex) { if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ Q&A này không?")) return; let btn = $(`#btnDelQA-${rowIndex}`); btn.html('<i class="fa-solid fa-spinner fa-spin"></i>').prop('disabled', true); postToGAS({ action: "deleteQA", rowIndex: rowIndex }, function(res) { alert(res); loadQAData(); checkNewQA(); }, function() { alert("Lỗi!"); btn.html('<i class="fa-solid fa-trash"></i> Xóa toàn bộ chuỗi này').prop('disabled', false); }); }
        function loadWebLinks() { $.ajax({ url: SCRIPT_URL + "?action=getWebLinks", method: "GET", dataType: "json", success: function(data) { renderWebLinks(data); } }); }
        function renderWebLinks(data) { if (!data || data.length === 0) { $('#webLinksContainer').html('<div class="col-12 text-center text-muted py-5"><i class="fa-solid fa-link-slash fs-1 mb-3"></i><br>Chưa có đường link nào.</div>'); return; } let html = ''; data.forEach(row => { let title = row[0] || 'Liên kết'; let desc = row[1] || ''; let url = row[2] || '#'; let iconClass = row[3] || 'fa-solid fa-link'; html += `<div class="col-12 col-md-6"><a href="${url}" target="_blank" class="link-card"><div class="icon-box"><i class="${iconClass}"></i></div><div><h5>${title}</h5><p>${desc}</p></div></a></div>`; }); $('#webLinksContainer').html(html); }
      function castVote(rowIndex, type, btnElement, uniqueId) { // Đã thêm uniqueId vào đây
    let userId = currentUser ? currentUser.mssv : (localStorage.getItem('user_uuid') || "guest");
    
    // Sử dụng uniqueId vĩnh viễn thay vì rowIndex dễ bị thay đổi
    let voteKey = `voted_qa_${uniqueId}_${userId}`;
    let currentVote = localStorage.getItem(voteKey);

    let isUndo = false;
    
    // Xử lý Hủy vote (Toggle)
    if (currentVote) {
        if (currentVote === type) {
            isUndo = true;
        } else {
            alert("Bạn hãy nhấn lại vào nút cũ để hủy đánh giá trước khi đổi sang lựa chọn khác nhé!");
            return;
        }
    }

    $(`#voteArea-${rowIndex} .btn-vote`).prop('disabled', true);
    let originalText = $(btnElement).html();
    $(btnElement).html('<i class="fa-solid fa-spinner fa-spin"></i>');

    postToGAS({ 
        action: isUndo ? "undoVote" : "submitVote", 
        rowIndex: rowIndex, 
        type: type, 
        user: userId 
    }, function(newData) {
        let data = typeof newData === 'string' ? JSON.parse(newData) : newData;
        
        let upBtn = $(`#voteArea-${rowIndex} .up`);
        let downBtn = $(`#voteArea-${rowIndex} .down`);
        
        upBtn.html(`<i class="fa-solid fa-thumbs-up"></i> Hữu ích (${data.up})`);
        downBtn.html(`<i class="fa-solid fa-thumbs-down"></i> Chưa rõ (${data.down})`);
        
        if (isUndo) {
            // Hủy vote -> Xóa khỏi LocalStorage
            localStorage.removeItem(voteKey);
            if (type === 'up') upBtn.removeClass('voted');
            if (type === 'down') downBtn.removeClass('voted');
        } else {
            // Vote mới -> Lưu uniqueId vào LocalStorage
            localStorage.setItem(voteKey, type);
            if (type === 'up') upBtn.addClass('voted');
            if (type === 'down') downBtn.addClass('voted');
        }
        
        $(`#voteArea-${rowIndex} .btn-vote`).prop('disabled', false);
    }, function() {
        alert("Lỗi kết nối. Vui lòng thử lại sau.");
        $(btnElement).html(originalText);
        $(`#voteArea-${rowIndex} .btn-vote`).prop('disabled', false);
    });
}
function sendReply(rowIndex) { 
    let replyText = $(`#txtReply-${rowIndex}`).val().trim(); 
    if (!replyText) { alert("Vui lòng nhập nội dung phản hồi!"); return; } 
    
    let studentMssv = currentUser ? currentUser.mssv : "Ẩn danh";
    
    // Lấy thời gian hiện tại
    let now = new Date();
    let timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    
    // Đóng gói cấu trúc mới: MSSV:::Thời gian:::Nội dung
    let formattedReply = studentMssv + ":::" + timeStr + ":::" + replyText;
    
    let btn = $(`#btnSendReply-${rowIndex}`); 
    btn.html('<i class="fa-solid fa-spinner fa-spin"></i>').prop('disabled', true); 
    
    postToGAS({ action: "replyToAdmin", rowIndex: rowIndex, replyText: formattedReply }, function(response) { 
        alert(response); loadQAData(); checkNewQA(); 
    }, function() { 
        alert("Lỗi khi gửi phản hồi."); btn.html('Gửi phản hồi').prop('disabled', false); 
    }); 
}
        function sendAdminReply(rowIndex) { let replyText = $(`#txtAdminReply-${rowIndex}`).val().trim(); if (!replyText) { alert("Vui lòng nhập nội dung trả lời!"); return; } let btn = $(`#btnAdminSubmit-${rowIndex}`); btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...').prop('disabled', true); postToGAS({ action: "adminReplyQuestion", rowIndex: rowIndex, replyText: replyText }, function(response) { alert(response); loadQAData(); checkNewQA();  }, function() { alert("Lỗi khi gửi trả lời."); btn.html('<i class="fa-solid fa-reply"></i> Đăng câu trả lời').prop('disabled', false); }); }

let shareCodeEditor;
let currentShareCategory = "";
let currentShareLang = "cpp";
let editingShareRowIndex = -1; // Biến theo dõi đang Sửa hay Đăng mới

$(document).ready(function() {
    if ($('#shareCodeEditorContainer').length) {
        shareCodeEditor = ace.edit("shareCodeEditorContainer");
        shareCodeEditor.setTheme("ace/theme/textmate"); 
        shareCodeEditor.session.setMode("ace/mode/c_cpp");
        shareCodeEditor.setOptions({ fontSize: "15px", showPrintMargin: false });
    }
});

// 1. Mở màn hình Thảo luận chung
function openShareCodeSection() { 
    document.title = "Thảo luận | Học nhóm APMA Khoa Toán";
    resetNavActive(); 
    $('#btnNavShareCode').addClass('active'); 
    $('#shareCodeSection').removeClass('d-none'); 
    
    // Nếu không có tham số category trên URL thì mới trở về danh mục Thảo luận tổng
    let urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('category')) {
        backToShareCategories();
    }
    
    if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); } 
    if (currentUser) { $('#txtMSSVShareCode').val(currentUser.mssv).prop('readonly', true).css({ 'background-color': '#e9ecef', 'cursor': 'not-allowed' }); } 
    else { $('#txtMSSVShareCode').val('').prop('readonly', false).css({ 'background-color': '#ffffff', 'cursor': 'text' }); }
}

// 2. Thoát khỏi môn Code -> Trở về danh mục Thảo luận tổng & Phục hồi URL về ?view=sharecode
function backToShareCategories() {
    $('#shareContentView').addClass('d-none');
    $('#shareCategoryView').removeClass('d-none');
    
    // Phục hồi lại đường link Thảo luận chung (?view=thaoluan)
    updateSystemUrl('view', 'thaoluan');
}

// 3. Mở môn Code cụ thể -> Đổi URL thành ?view=sharecode&category=...
function openShareCategory(categoryName, lang) {
    currentShareCategory = categoryName;
    currentShareLang = lang;
    
    $('#currentShareTitle').text(categoryName);
    $('#shareCategoryView').addClass('d-none');
    $('#shareContentView').removeClass('d-none');
    
    // Tạo link dạng ?view=sharecode&category=LapTrinhPython
    let cleanCategory = categoryName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "");
    let cleanPath = window.location.pathname;
    let newUrl = cleanPath + `?view=sharecode&category=${cleanCategory}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    if(lang === 'python') shareCodeEditor.session.setMode("ace/mode/python");
    else shareCodeEditor.session.setMode("ace/mode/c_cpp");
    
    shareCodeEditor.resize(); 
    cancelEditShareCode(); 
    loadShareCodeData();
}
function sendShareCode() {
    let mssvValue = currentUser ? currentUser.mssv : $('#txtMSSVShareCode').val().trim(); 
    let rawCode = shareCodeEditor.getValue().trim();
    let maBai = $('#txtMaBai').val().trim();
    let description = $('#txtShareCodeDescription').val().trim();
    if (!mssvValue) { alert("Vui lòng nhập MSSV!"); return; } 
    if (!rawCode) { alert("Bạn chưa nhập mã nguồn để chia sẻ!"); return; }
    
    let qText = `[SHARECODE|${currentShareCategory}|${maBai}] \n${description}\n\n` + "```" + currentShareLang + "\n" + rawCode + "\n```";

    let btn = $('#btnSubmitShareCode'); 
    let originalHtml = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang xử lý...').prop('disabled', true);
    
    let actionName = (editingShareRowIndex !== -1) ? "updateShareCode" : "submitShareCode";
    let payload = { action: actionName, mssv: mssvValue, codeData: qText };
    if (editingShareRowIndex !== -1) payload.rowIndex = editingShareRowIndex;
    
    postToGAS(payload, function(response) { 
        alert(response); 
        cancelEditShareCode();
        btn.html(originalHtml).prop('disabled', false); 
        loadShareCodeData(); 
    }, function() { 
        alert("Lỗi kết nối máy chủ!"); 
        btn.html(originalHtml).prop('disabled', false); 
    });
}

window.editShareCode = function(buttonElement, rowIndex, maBai) {
    let codeBlock = $(buttonElement).closest('.qa-item').find('code').first();
    if(codeBlock.length > 0) {
        let rawText = codeBlock.text();
        shareCodeEditor.setValue(rawText);
        $('#txtMaBai').val(maBai);
        editingShareRowIndex = rowIndex; 
        
$('#shareCodeFormTitle').html('<i class="fa-solid fa-pen-to-square me-2 text-primary"></i>Đang chỉnh sửa code trực tiếp');
    $('#btnSubmitShareCode').html('<i class="fa-solid fa-floppy-disk me-2"></i> Lưu chỉnh sửa').css('background', '#0f4c81');
        $('#btnCancelEditCode').removeClass('d-none');
        
        $('html, body').animate({ scrollTop: $('#shareCodeEditorContainer').offset().top - 100 }, 500);
    }
};

function cancelEditShareCode() {
    shareCodeEditor.setValue(''); 
    $('#txtMaBai').val('');
$('#txtShareCodeDescription').val('');
    editingShareRowIndex = -1;
    
    $('#shareCodeFormTitle').html('<i class="fa-solid fa-pen-nib me-2"></i>Soạn thảo Code mới');
    // Thay đổi màu nền ở đây thành #0f4c81
    $('#btnSubmitShareCode').html('<i class="fa-solid fa-share-nodes me-2"></i> Chia sẻ Code này').css('background', '#0f4c81');
    $('#btnCancelEditCode').addClass('d-none');
}

// 1. Hàm tải dữ liệu và tạo khung Danh sách + Khung Chi tiết ẩn
function loadShareCodeData() {
    $('#shareCodeListArea').html(''); 
    $('#shareCodeLoadingStatus').removeClass('d-none');
    
    $.ajax({ url: SCRIPT_URL + "?action=getShareCodeData", method: "GET", dataType: "json", success: function(data) {
        $('#shareCodeLoadingStatus').addClass('d-none');
        if (!data || data.length === 0) {
            $('#shareCodeListArea').html(`<div class="text-center p-4 text-muted"><i class="fa-solid fa-laptop-code fs-2 mb-2"></i><br>Học phần <b>${currentShareCategory}</b> chưa có bài chia sẻ nào.</div>`);
            return;
        }
        
        window.shareCodeList = []; 
        let gridHtml = '<div class="row g-3">'; 
        
        data.forEach(row => {
            let questionRaw = row[2] || '';
            let targetTag = `[SHARECODE|${currentShareCategory}`;
            if (!questionRaw.startsWith(targetTag)) return;
            
            let time = row[0] || ''; 
            let displayMssv = maskMSSV(row[1] || ''); 
            let answer = row[3] || ''; 
            let rowIndex = row[6];       
            
            let categoryMatch = questionRaw.match(/^\[SHARECODE\|(.*?)(?:\|(.*))?\]/);
            let maBaiValue = 'CODE KHÔNG TÊN';
            
            if (categoryMatch) {
                if (categoryMatch[2] && categoryMatch[2].trim() !== "undefined") {
                    maBaiValue = categoryMatch[2].trim();
                }
                questionRaw = questionRaw.replace(/^\[SHARECODE\|.*?\]\s*/, '');
            }

            // Ghi dữ liệu vào mảng
           let arrayIndex = window.shareCodeList.length;
window.shareCodeList.push({
    time: time,
    author: displayMssv,
    rawAuthor: row[1] || '', // Thêm dòng này để lưu trữ MSSV gốc của tác giả
    maBai: maBaiValue,
    codeContent: questionRaw,
    answer: answer,
    rowIndex: rowIndex
});

            // Vẽ thẻ Card ra giao diện lưới
gridHtml += `
<div class="col-6 col-md-4 col-lg-2">
    <div class="card-sharecode-box" onclick="openShareCodeDetail(${arrayIndex})">
        <div class="card-sharecode-badge">
            <i class="fa-solid fa-code"></i>
        </div>
        <div class="card-sharecode-icon">
            <i class="fa-solid fa-file-code"></i>
        </div>
        <div class="card-sharecode-body">
            <h6 class="card-sharecode-title" title="${maBaiValue}">${maBaiValue}</h6>
            <div class="card-sharecode-meta">
                <span class="meta-author"><i class="fa-solid fa-user-circle me-1"></i>${displayMssv}</span>
                <span class="meta-time"><i class="fa-regular fa-clock me-1"></i>${time}</span>
            </div>
        </div>
        <div class="card-sharecode-footer">
            <span>Xem chi tiết</span>
            <i class="fa-solid fa-arrow-right"></i>
        </div>
    </div>
</div>`;
        });
        
        gridHtml += '</div>';
        
        if(window.shareCodeList.length === 0) {
            gridHtml = `<div class="text-center p-4 text-muted"><i class="fa-solid fa-laptop-code fs-2 mb-2"></i><br>Học phần <b>${currentShareCategory}</b> chưa có code nào. Hãy chia sẻ!</div>`;
        }
        
        // Tạo cấu trúc: 1 khung chứa lưới danh sách, 1 khung chứa chi tiết (ẩn mặc định)
        let finalHtml = `
            <div id="shareCodeListWrapper">${gridHtml}</div>
            <div id="shareCodeDetailWrapper" class="d-none"></div>
        `;
        $('#shareCodeListArea').html(finalHtml); 
    }});
}

window.openShareCodeDetail = function(index) {
    let item = window.shareCodeList[index];
    if(!item) return;

    let questionFormatted = formatCodeBlocks(item.codeContent);
    let threadHtml = item.answer.trim() !== "" ? parseThread(item.answer, item.rowIndex) : '';

    // KIỂM TRA QUYỀN CHỈNH SỬA
    let canEdit = false;
    if (currentUser) {
        if (currentUser.mssv === "51.01.108.008" || currentUser.mssv === item.rawAuthor) {
            canEdit = true;
        }
    }

    // TẠO NHÓM NÚT THAO TÁC (COPY & SỬA CODE) Ở ĐÂY
    let actionBtnsHtml = `<div class="d-flex align-items-center gap-2">
        <button class="btn fw-bold shadow-sm" style="background: #e0f2fe; color: #0369a1; border-radius: 8px; transition: all 0.2s;" onclick="copyShareCodeDirect(${index}, this)">
            <i class="fa-regular fa-copy"></i> Copy Code
        </button>`;
    
    if (canEdit) {
        actionBtnsHtml += `
        <button class="btn text-white fw-bold shadow-sm" style="background: var(--primary-color); border-radius: 8px; transition: all 0.2s;" onclick="editShareCodeDirect(${index})">
            <i class="fa-solid fa-pen-to-square"></i> Sửa Code
        </button>`;
    }
    actionBtnsHtml += `</div>`;

    let html = `
        <div class="tb-detail-box shadow-sm mb-4" style="border: 1px solid var(--primary-color);">
            <div class="tb-header-blue" style="cursor: pointer; background: linear-gradient(135deg, #0f4c81, #1664a8);" onclick="backToShareCodeList()">
                <i class="fa-solid fa-arrow-left me-2"></i> Trở lại <span class="mx-2">|</span> <i class="fa-solid fa-laptop-code me-2"></i> Chi tiết Share Code
            </div>
            
            <div class="tb-detail-body p-4 p-md-5">
                <!-- Thêm flex-wrap và gap-3 để trên điện thoại các nút tự xuống dòng không bị đè chữ -->
                <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom flex-wrap gap-3">
                    <div>
                        <h4 class="text-primary fw-bold mb-2"><i class="fa-solid fa-hashtag me-2"></i>Mã bài: ${item.maBai}</h4>
                        <div class="qa-time m-0"><i class="fa-regular fa-clock"></i> ${item.time} <span class="mx-3">|</span> Tác giả: <strong class="text-secondary">${item.author}</strong></div>
                    </div>
                    ${actionBtnsHtml}
                </div>
                
                <div class="qa-question" style="font-size: 16px;">${questionFormatted}</div>
                ${threadHtml ? `<div class="mt-5">${threadHtml}</div>` : ''}
                
                <div class="vote-action-bar mt-5 pt-4 border-top">
                    <button class="btn btn-outline-primary fw-bold px-4" onclick="$('#shareReplyBox-${item.rowIndex}').toggleClass('d-none')">
                        <i class="fa-solid fa-comments"></i> Bình luận / Góp ý
                    </button>
                </div>
                
                <div id="shareReplyBox-${item.rowIndex}" class="reply-box d-none mt-3 p-4 bg-light rounded border-primary">
                    <textarea id="txtShareReply-${item.rowIndex}" class="form-control mb-3 border-primary" rows="3" placeholder="Góp ý hoặc chèn code vào đây..."></textarea>
                    <button class="btn btn-primary fw-bold px-4" onclick="sendShareCodeReply(${item.rowIndex})" style="background: var(--primary-color); border:none;"><i class="fa-solid fa-paper-plane me-2"></i>Gửi bình luận</button>
                </div>
            </div>
        </div>`;

    $('#shareCodeDetailWrapper').html(html);
    
    $('#shareCodeListWrapper').addClass('d-none');
    $('#shareCodeDetailWrapper').removeClass('d-none');
    
    window.scrollTo({ top: $('#shareCodeDetailWrapper').offset().top - 80, behavior: 'smooth' });
    
    if (window.Prism) {
        setTimeout(() => { 
            Prism.highlightAllUnder(document.getElementById('shareCodeDetailWrapper')); 
            applyKaTeX('shareCodeDetailWrapper');
        }, 50);
    }
};
// 3. Hàm xử lý nút "Trở lại"
window.backToShareCodeList = function() {
    $('#shareCodeDetailWrapper').addClass('d-none');
    $('#shareCodeListWrapper').removeClass('d-none');
};
// Hàm xử lý gửi bình luận / góp ý trong phần Share Code
window.sendShareCodeReply = function(rowIndex) { 
    let replyText = $(`#txtShareReply-${rowIndex}`).val().trim(); 
    if (!replyText) { alert("Vui lòng nhập nội dung bình luận hoặc góp ý!"); return; } 
    
    let studentMssv = currentUser ? currentUser.mssv : "Khách";
    
    // Lấy thời gian hiện tại
    let now = new Date();
    let timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    
    // Đóng gói cấu trúc mới: MSSV:::Thời gian:::Nội dung
    let formattedReply = studentMssv + ":::" + timeStr + ":::" + replyText;
    
    let btn = $(`#shareReplyBox-${rowIndex} button`); 
    let originalText = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang gửi...').prop('disabled', true); 
    
    postToGAS({ 
        action: "replyToShareCode",
        rowIndex: rowIndex, 
        replyText: formattedReply 
    }, function(response) { 
        alert(response); 
        $(`#txtShareReply-${rowIndex}`).val('');
        $(`#shareReplyBox-${rowIndex}`).addClass('d-none');
        btn.html('<i class="fa-solid fa-paper-plane me-2"></i>Gửi bình luận').prop('disabled', false); 

        $.ajax({ 
            url: SCRIPT_URL + "?action=getShareCodeData", 
            method: "GET", 
            dataType: "json", 
            success: function(data) {
                // (Giữ nguyên toàn bộ logic ajax success cũ tại đây)
                window.shareCodeList = []; 
                data.forEach(row => {
                    let questionRaw = row[2] || '';
                    let targetTag = `[SHARECODE|${currentShareCategory}`;
                    if (!questionRaw.startsWith(targetTag)) return;
                    
                    let time = row[0] || ''; 
                    let displayMssv = maskMSSV(row[1] || ''); 
                    let answer = row[3] || ''; 
                    let rIndex = row[6];       
                    
                    let categoryMatch = questionRaw.match(/^\[SHARECODE\|(.*?)(?:\|(.*))?\]/);
                    let maBaiValue = 'CODE KHÔNG TÊN';
                    
                    if (categoryMatch) {
                        if (categoryMatch[2] && categoryMatch[2].trim() !== "undefined") {
                            maBaiValue = categoryMatch[2].trim();
                        }
                        questionRaw = questionRaw.replace(/^\[SHARECODE\|.*?\]\s*/, '');
                    }

                    window.shareCodeList.push({
                        time: time, author: displayMssv, rawAuthor: row[1] || '', 
                        maBai: maBaiValue, codeContent: questionRaw, answer: answer, rowIndex: rIndex
                    });
                });
                
                let currentIndex = window.shareCodeList.findIndex(item => item.rowIndex == rowIndex);
                if(currentIndex !== -1) {
                    openShareCodeDetail(currentIndex); 
                }
            }
        });
    }, function() { 
        alert("Có lỗi xảy ra khi kết nối máy chủ để gửi bình luận."); 
        btn.html(originalText).prop('disabled', false); 
    }); 
};
// 4. Hàm xử lý khi nhấn "Sửa Code" ngay bên trong giao diện Chi tiết
window.editShareCodeDirect = function(index) {
    let item = window.shareCodeList[index];
    
    // BẢO MẬT: Kiểm tra lại quyền một lần nữa trước khi cho phép load form sửa
    if (!currentUser || (currentUser.mssv !== "51.01.108.008" && currentUser.mssv !== item.rawAuthor)) {
        alert("Thao tác bị từ chối: Bạn không có quyền chỉnh sửa mã nguồn của người khác!");
        return;
    }
    
    // Tự động quay về màn hình danh sách trước khi cuộn lên chỗ sửa code
    backToShareCodeList();

    // Bóc tách Code thô từ Markdown
    let rawCode = "";
    let codeMatch = item.codeContent.match(/```[a-zA-Z\+\#]*\n?([\s\S]*?)\n?```/);
    if (codeMatch) {
        rawCode = codeMatch[1];
    }

    // 2. Tách phần Nội dung mô tả (Cắt bỏ khối ```code```)
    let rawDesc = item.codeContent.replace(/```[a-zA-Z\+\#]*\n?[\s\S]*?\n?```/g, '').trim();
	let formattedDesc = rawDesc ? `<div class="mb-3 p-3 rounded" style="background: #f8fafc; border-left: 4px solid #0f4c81; font-size: 15px; line-height: 1.6;">${rawDesc.replace(/\n/g, '<br>')}</div>` : '';
let questionFormatted = formatCodeBlocks(item.codeContent);
    shareCodeEditor.setValue(rawCode);
    $('#txtMaBai').val(item.maBai);
$('#txtShareCodeDescription').val(rawDesc);
    editingShareRowIndex = item.rowIndex; 
    
$('#shareCodeFormTitle').html('<i class="fa-solid fa-pen-to-square me-2 text-primary"></i>Đang chỉnh sửa code trực tiếp');
        $('#btnSubmitShareCode').html('<i class="fa-solid fa-floppy-disk me-2"></i> Lưu chỉnh sửa').css('background', '#0f4c81');
    $('#btnCancelEditCode').removeClass('d-none');
    
    // Cuộn mượt mà lên vị trí khung soạn thảo
    $('html, body').animate({ scrollTop: $('#shareCodeEditorContainer').offset().top - 100 }, 500);
};
// Hàm tìm kiếm mã bài Share Code
window.searchShareCode = function() {
    let keyword = $('#txtSearchShareCode').val().toLowerCase().trim();
    $('#shareCodeListWrapper .col-6').each(function() {
        let maBai = $(this).find('.card-sharecode-title').text().toLowerCase();
        // Nếu mã bài chứa keyword thì hiện, ngược lại ẩn
        if (maBai.includes(keyword)) {
            $(this).removeClass('d-none');
        } else {
            $(this).addClass('d-none');
        }
    });
};
// Hàm áp dụng KaTeX cho một khu vực cụ thể
function applyKaTeX(elementId) {
    let el = document.getElementById(elementId);
    if (el && window.renderMathInElement) {
        renderMathInElement(el, {
            delimiters: [
                {left: '$$', right: '$$', display: true},  // Công thức đứng riêng một dòng
                {left: '$', right: '$', display: false},   // Công thức nằm cùng dòng (inline)
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
            ],
            throwOnError: false, // Bỏ qua lỗi cú pháp để không làm hỏng giao diện
            output: "html" // Ưu tiên render ra HTML để nhẹ và nhanh hơn
        });
    }
}
// Biến lưu trữ dữ liệu Q&A để so sánh
window.lastQADataString = ""; 
function silentCheckNewQA() {
    $.ajax({ 
        url: SCRIPT_URL + "?action=getQAData", 
        method: "GET", 
        dataType: "json", 
        success: function(data) {
            if (!data || data.length === 0) return;
            
            let newDataString = JSON.stringify(data);
            if (window.lastQADataString === newDataString) return; // Không có gì thay đổi

            // Nếu danh sách mới nhiều hơn danh sách cũ -> Có câu hỏi mới
            if (data.length > window.thongBaoDataLength) {
                // Chỉ append câu hỏi mới vào đầu danh sách thay vì xóa trắng
                loadQAData(); // Nếu có câu hỏi mới hoàn toàn, load lại vẫn ổn
            } else {
                // Nếu chỉ là update lượt vote hoặc trả lời: Cập nhật từng dòng
                data.forEach(row => {
                    let rowIndex = row[6];
                    let upvotes = row[4];
                    let downvotes = row[5];
                    let answer = row[3];

                    // Cập nhật số vote mà không load lại trang
                    $(`#voteArea-${rowIndex} .up`).html(`<i class="fa-solid fa-thumbs-up"></i> Hữu ích (${upvotes})`);
                    $(`#voteArea-${rowIndex} .down`).html(`<i class="fa-solid fa-thumbs-down"></i> Chưa rõ (${downvotes})`);
                    
                    // Nếu admin vừa trả lời, cập nhật phần nội dung trả lời
                    if (answer.trim() !== "") {
                        // Tìm div chứa câu trả lời và thay thế nội dung
                        // Logic này giúp giữ nguyên trạng thái các ô textarea đang mở
                    }
                });
            }
            window.lastQADataString = newDataString;
            window.thongBaoDataLength = data.length;
        }
    });
}
function toggleQaTopicOther() {
    let selected = $('#qaTopic').val();
    if (selected === 'Khác') {
        $('#qaTopicOther').removeClass('d-none').focus();
    } else {
        $('#qaTopicOther').addClass('d-none').val('');
    }
}
window.searchQA = function() {
    let keyword = $('#txtSearchQA').val().toLowerCase().trim();
    let selectedTopic = $('#filterQATopic').val().toLowerCase().trim();
    
// Khai báo danh sách các chủ đề mặc định hệ thống đang có (Phải ghi chữ thường hết nhé)
    const defaultTopics = [
        "hệ thống",
        "math1417-hình học vi phân", 
        "apma1803-cấu trúc đại số và ứng dụng", 
        "math1817-phương trình vi phân và đạo hàm riêng",
        "math1413-độ đo và tích phân",
        "apma1817-toán rời rạc",
        "đăng ký học phần",
        "chương trình đào tạo",
        "tốt nghiệp",
        "kết quả học tập",
        "kết quả rèn luyện",
        "sự kiện"
    ];
    
    $('#qaListArea .qa-item').each(function() {
        let fullText = $(this).text().toLowerCase();
        
        // Lấy chữ bên trong thẻ Tag, xóa khoảng trắng thừa ở 2 đầu
        let topicTag = $(this).find('.qa-time .badge').text().toLowerCase().trim();
        
        let matchKeyword = keyword === "" || fullText.includes(keyword);
        let matchTopic = false;
        
        if (selectedTopic === "") {
            // Nếu không chọn lọc chủ đề -> Cho qua hết
            matchTopic = true; 
        } else if (selectedTopic === "khác") {
            // ĐIỂM MẤU CHỐT: Nếu chọn lọc "Khác", nó sẽ kiểm tra xem cái tag hiện tại
            // có bị TRƯỢT KHỎI danh sách mặc định hay không. Nếu trượt, tức là "Khác".
            matchTopic = !defaultTopics.includes(topicTag);
        } else {
            // So sánh bình thường nếu chọn các chủ đề mặc định
            matchTopic = topicTag.includes(selectedTopic);
        }
        
        // Nếu khớp cả từ khóa và chủ đề thì hiện ra
        if (matchKeyword && matchTopic) {
            $(this).removeClass('d-none');
        } else {
            $(this).addClass('d-none');
        }
    });
};
window.handleTopicSelection = function(type) {
    if (type === 'hocphan') {
        // Nếu chọn ô Học phần -> Reset ô Hỗ trợ & ẩn khung Khác
        $('#qaTopicHoTro').val(''); 
        $('#qaTopicOther').addClass('d-none').val(''); 
    } else if (type === 'hotro') {
        // Nếu chọn ô Hỗ trợ -> Reset ô Học phần
        $('#qaTopicHocPhan').val(''); 
        
        // Kiểm tra xem có chọn "Khác" không
        let selected = $('#qaTopicHoTro').val();
        if (selected === 'Khác') {
            $('#qaTopicOther').removeClass('d-none').focus();
        } else {
            $('#qaTopicOther').addClass('d-none').val('');
        }
    }
};