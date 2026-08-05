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
// Biến lưu trạng thái toàn cục
window.isQAUnanswered = false;
window.isShareCodeNew = false;

// Hàm cập nhật Badge ngoài Sidebar
function updateSidebarThaoLuanBadge() {
    // Bật/tắt ngoài Sidebar
    if (window.isQAUnanswered || window.isShareCodeNew) {
        $('#shareCodeSidebarBadge').removeClass('d-none');
    } else {
        $('#shareCodeSidebarBadge').addClass('d-none');
    }

    // Bật/tắt riêng cho thẻ "Giải đáp thắc mắc" bên trong trang Thảo luận
    if (window.isQAUnanswered) {
        $('#qaInsideBadge').removeClass('d-none');
    } else {
        $('#qaInsideBadge').addClass('d-none');
    }
}
// 1. Kiểm tra Q&A có câu hỏi mới chưa trả lời
function checkNewQA() { 
    $.ajax({ 
        url: SCRIPT_URL + "?action=getQAData", 
        method: "GET", 
        dataType: "json", 
        success: function(data) { 
            if (!data || data.length === 0) {
                window.isQAUnanswered = false;
            } else {
                // Kiểm tra xem có câu hỏi nào mà ô trả lời (row[3]) còn trống không
                window.isQAUnanswered = data.some(row => {
                    let answer = row[3] ? String(row[3]).trim() : '';
                    return answer === '';
                });
            }
            // Cập nhật hiển thị ra Sidebar
            updateSidebarThaoLuanBadge();
        }
    }); 
}

// 2. Kiểm tra ShareCode có bài mới chưa bình luận
// 2. Kiểm tra ShareCode có bài mới chưa bình luận
function checkNewShareCodeGlobal() {
    $.ajax({
        url: SCRIPT_URL + "?action=getShareCodeData",
        method: "GET",
        dataType: "json",
        success: function(data) {
            if (!data || data.length === 0) {
                window.isShareCodeNew = false;
                updateSidebarThaoLuanBadge();
                return;
            }

            let nowTime = new Date().getTime();
            let oneDayMs = 24 * 60 * 60 * 1000; // 1 ngày
            let hasGlobalNew = false;
            let newCategories = {};

            data.forEach(row => {
                let time = row[0] || '';
                let questionRaw = row[2] || '';
                let answer = row[3] || '';

                let categoryMatch = questionRaw.match(/^\[SHARECODE\|(.*?)(?:\|(.*))?\]/);
                if (categoryMatch) {
                    let category = categoryMatch[1].trim();
                    // Thay đoạn cũ bằng:
let cleanCat = category.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

                    // Bóc tách ngày giờ thông minh, bao trọn mọi định dạng
                    let postDate = null;
                    let match2 = time.match(/(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/); // Dạng HH:MM DD/MM/YYYY
                    let match1 = time.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/); // Dạng DD/MM/YYYY HH:MM
                    
                    if (match2) {
                        postDate = new Date(parseInt(match2[5]), parseInt(match2[4]) - 1, parseInt(match2[3]), parseInt(match2[1]), parseInt(match2[2]), 0);
                    } else if (match1) {
                        let h = match1[4] ? parseInt(match1[4]) : 0;
                        let m = match1[5] ? parseInt(match1[5]) : 0;
                        postDate = new Date(parseInt(match1[3]), parseInt(match1[2]) - 1, parseInt(match1[1]), h, m, 0);
                    }

                    let isCommented = answer.trim() !== "";
                    let isWithinOneDay = true;

                    if (postDate && (nowTime - postDate.getTime() > oneDayMs)) {
                        isWithinOneDay = false; // Tắt chữ "Mới" nếu qua 24 giờ
                    }

                    if (!isCommented && isWithinOneDay) {
                        hasGlobalNew = true;
                        newCategories[cleanCat] = true;
                    }
                }
            });

            window.isShareCodeNew = hasGlobalNew;
            updateSidebarThaoLuanBadge();

            $('.badge-sharecode-cat').addClass('d-none');
            for (let cleanCat in newCategories) {
                $('#badge-share-' + cleanCat).removeClass('d-none');
            }
        }
    });
}
function openQASection() { 
    document.title = "Hỗ trợ & Giải đáp | Học nhóm APMA Khoa Toán";
    resetNavActive(); 
    $('#btnNavShareCode').addClass('active'); 
    $('#qaSection').removeClass('d-none'); 
    if (typeof window.setDetailedView === 'function') window.setDetailedView("Thảo luận - Giải đáp thắc mắc");
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
            
            let timeMatch = svTextRaw.match(/^\((.*?)\)\n/);
            if (timeMatch) {
                let timeStr = timeMatch[1];
                timeHtml = `<span class="text-muted ms-2" style="font-size: 12.5px; font-weight: normal;"><i class="fa-regular fa-clock"></i> ${timeStr}</span>`;
                svTextRaw = svTextRaw.replace(timeMatch[0], '').trim();
            }
            
            if (svTextRaw.includes(":::")) {
                let splitData = svTextRaw.split(":::");
                let rawMssv = splitData[0].trim().replace(/[-|]/g, '');
                let displayMssv = maskMSSV(rawMssv);
                
                // --- XỬ LÝ LẤY TÊN CHO ADMIN HOẶC TÁC GIẢ BÀI VIẾT (PHẦN PHẢN HỒI) ---
                let activeUser = JSON.parse(localStorage.getItem('currentUser')) || null;
                let isSystemAdmin = activeUser && (activeUser.mssv === "51.01.108.008" || activeUser.mssv === "5101108008");
                
                if (isSystemAdmin) {
                    let fullName = window.allUsersMap ? window.allUsersMap[rawMssv] : null;
                    if (fullName) {
                        let shortName = getNaturalShortName(fullName);
                        displayMssv = `${rawMssv} - ${shortName}`;
                    } else {
                        displayMssv = rawMssv; 
                    }
                } else if (activeUser && activeUser.mssv) {
                    let myCleanMssv = activeUser.mssv.replace(/\./g, "");
                    let authorCleanMssv = rawMssv.replace(/\./g, "");
                    
                    if (myCleanMssv === authorCleanMssv) {
                        let shortName = getNaturalShortName(activeUser.name);
                        displayMssv = `${rawMssv} - ${shortName} (Bạn)`;
                    }
                }
                // -----------------------------------------------------------------

                svName = "Sinh viên (" + displayMssv + ")";

                if (splitData.length >= 3) {
                    let timeStr = splitData[1].trim();
                    timeHtml = `<span class="text-muted ms-2" style="font-size: 12.5px; font-weight: normal;"><i class="fa-regular fa-clock"></i> ${timeStr}</span>`;
                    svMsg = splitData.slice(2).join(":::").trim();
                } else {
                    svMsg = splitData.slice(1).join(":::").trim();
                }
            }
            
            let formattedContent = formatCodeBlocks(svMsg);
            if (!/(<p>|<table>|<ul>|<li>|<div>|<br\s*\/?>)/i.test(formattedContent)) {
                formattedContent = formattedContent.replace(/\n/g, '<br>');
            }
            let svFormattedMsg = formattedContent;
            
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

// Hàm tự động tẩy rác HTML dán từ web khác về
function cleanExternalHTML(html) {
    if (!html) return "";
    return html
        // Xóa thuộc tính dir, role, align, style của editor khác
        .replace(/\s*(dir|role|align|aria-level|colgroup)="[^"]*"/gi, "")
        // Xóa thẻ colgroup rác
        .replace(/<colgroup>[\s\S]*?<\/colgroup>/gi, "")
        // Thay thế các khoảng trắng rác &nbsp; thành khoảng trắng thường
        .replace(/&nbsp;/g, " ")
        // Xóa các thẻ p nằm lồng vô lý bên trong li
        .replace(/<li[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/li>/gi, "<li>$1</li>")
        // Xóa các thẻ p nằm lồng bên trong td của bảng
        .replace(/<td[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/td>/gi, "<td>$1<\/td>");
}
      function loadQAData() {
    $('#qaListArea').html(''); 
    $('#qaLoadingStatus').removeClass('d-none');
    
    let activeUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let isSystemAdmin = activeUser && (activeUser.mssv === "51.01.108.008" || activeUser.mssv === "5101108008");

    // Khởi tạo Promise tải danh sách Tên sinh viên (Chỉ gọi 1 lần khi Admin tải)
    let userMapPromise = new Promise((resolve) => {
        if (isSystemAdmin && !window.allUsersMap) {
            $.ajax({
                url: SCRIPT_URL + "?action=getAllUsers",
                method: "GET",
                dataType: "json",
                success: function(users) {
                    window.allUsersMap = {};
                    users.forEach(u => { 
                        let cleanMssv = u.mssv.replace(/\./g, "");
                        window.allUsersMap[u.mssv] = u.name; 
                        window.allUsersMap[cleanMssv] = u.name;
                    });
                    resolve();
                },
                error: () => resolve()
            });
        } else {
            resolve();
        }
    });

    userMapPromise.then(() => {
        $.ajax({ 
            url: SCRIPT_URL + "?action=getQAData", 
            method: "GET", 
            dataType: "json", 
            success: function(data) {
                $('#qaLoadingStatus').addClass('d-none');
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
                    let rawMssv = String(row[1] || '').trim().replace(/[-|]/g, ''); 
                    let displayMssv = maskMSSV(rawMssv); 
                    
                    // ==========================================
                    // TRÍCH XUẤT TÊN CHO CÂU HỎI Q&A GỐC
                    // ==========================================
                    if (isSystemAdmin) {
                        let fullName = window.allUsersMap ? window.allUsersMap[rawMssv] : null;
                        if (fullName) {
                            let shortName = getNaturalShortName(fullName);
                            displayMssv = `${rawMssv} - ${shortName}`;
                        } else {
                            displayMssv = rawMssv; 
                        }
                    } else if (activeUser && activeUser.mssv) {
                        let myCleanMssv = activeUser.mssv.replace(/\./g, "");
                        let authorCleanMssv = rawMssv.replace(/\./g, "");
                        
                        if (myCleanMssv === authorCleanMssv) {
                            let shortName = getNaturalShortName(activeUser.name);
                            displayMssv = `${rawMssv} - ${shortName} (Bạn)`;
                        }
                    }
                    // ==========================================
                    
                    // --- XỬ LÝ LỌC THẺ TAG ---
                    let rawQuestion = row[2] || '';
                    let topicBadgeHtml = '';
                    let badgeRegex = /(<span class="badge[^>]*>.*?<\/span>)\s*/;
                    let match = rawQuestion.match(badgeRegex);
                    
                    if (match) {
                        topicBadgeHtml = match[1].replace('mb-2', 'ms-2'); 
                        rawQuestion = rawQuestion.replace(badgeRegex, ''); 
                    }
                    
                    let question = formatCodeBlocks(rawQuestion);

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
                        html += parseThread(answer, rowIndex);
                    } else { 
                        html += `<div class="qa-no-answer"><i class="fa-solid fa-hourglass-half me-2"></i> Đang chờ giải đáp...</div>`; 
                    }
                        
                    let uniqueId = "QA_" + time.replace(/\D/g, '') + "_" + rawMssv.replace(/\D/g, '');
                    let currentUserId = activeUser ? activeUser.mssv : (localStorage.getItem('user_uuid') || "guest");
                    let voteKey = `voted_qa_${uniqueId}_${currentUserId}`; 
                    let votedType = localStorage.getItem(voteKey);

                    let upClass = votedType === 'up' ? 'btn-vote up voted' : 'btn-vote up';
                    let downClass = votedType === 'down' ? 'btn-vote down voted' : 'btn-vote down';

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
                    html += `</div>`; 
                });
                
                $('#qaListArea').html(html); 
                
                if (hasUnanswered) {
                    $('#qaSidebarBadge').removeClass('d-none'); 
                } else {
                    $('#qaSidebarBadge').addClass('d-none');
                }
                
                if (window.Prism) Prism.highlightAllUnder(document.getElementById('qaListArea'));
                applyKaTeX('qaListArea');
            }
        });
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
    if (typeof window.setDetailedView === 'function') window.setDetailedView("Thảo luận");
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
    if (typeof window.setDetailedView === 'function') window.setDetailedView("Thảo luận");
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
    if (typeof window.setDetailedView === 'function') window.setDetailedView("Thảo luận - Không gian Code - " + categoryName);
    // Tạo link dạng ?view=sharecode&category=LapTrinhPython
   // Thay đoạn cũ bằng:
let cleanCategory = categoryName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").replace(/[^a-zA-Z0-9]/g, "");
    let cleanPath = window.location.pathname;
    let newUrl = cleanPath + `?view=sharecode&category=${cleanCategory}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    if(lang === 'python') shareCodeEditor.session.setMode("ace/mode/python");
    else shareCodeEditor.session.setMode("ace/mode/c_cpp");
    
    shareCodeEditor.resize(); 
    cancelEditShareCode(); 
    loadShareCodeData();
	// Thêm đoạn này vào cuối hàm openShareCodeSection() trong qa.js
let urlParams = new URLSearchParams(window.location.search);
let catParam = urlParams.get('category');
if (catParam === 'CauTrucDuLieu' || catParam === 'Cấu trúc dữ liệu') {
    openShareCategory('Cấu trúc dữ liệu', 'cpp');
}
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
// Cập nhật hàm loadShareCodeData() trong TRANGWEB/qa.js
// Thêm biến toàn cục để lưu từ điển tên sinh viên
// Thêm biến toàn cục để lưu từ điển tên sinh viên
window.allUsersMap = null;

function loadShareCodeData() {
    $('#shareCodeListArea').html(''); 
    $('#shareCodeLoadingStatus').removeClass('d-none');
    
    let activeUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let isSystemAdmin = activeUser && (activeUser.mssv === "51.01.108.008" || activeUser.mssv === "5101108008");

    // Tự động kéo danh sách sinh viên 1 lần duy nhất cho Admin
    let userMapPromise = new Promise((resolve) => {
        if (isSystemAdmin && !window.allUsersMap) {
            $.ajax({
                url: SCRIPT_URL + "?action=getAllUsers",
                method: "GET",
                dataType: "json",
                success: function(users) {
                    window.allUsersMap = {};
                    users.forEach(u => { 
                        // Lưu đồng thời định dạng có chấm và không chấm
                        let cleanMssv = u.mssv.replace(/\./g, "");
                        window.allUsersMap[u.mssv] = u.name; 
                        window.allUsersMap[cleanMssv] = u.name;
                    });
                    resolve();
                },
                error: () => resolve() // Lỗi mạng thì vẫn cho chạy tiếp
            });
        } else {
            resolve();
        }
    });

    userMapPromise.then(() => {
        $.ajax({ 
            url: SCRIPT_URL + "?action=getShareCodeData", 
            method: "GET", 
            dataType: "json", 
            success: function(data) {
                $('#shareCodeLoadingStatus').addClass('d-none');
                if (!data || data.length === 0) {
                    $('#shareCodeListArea').html(`<div class="text-center p-4 text-muted"><i class="fa-solid fa-laptop-code fs-2 mb-2"></i><br>Học phần <b>${currentShareCategory}</b> chưa có bài chia sẻ nào.</div>`);
                    return;
                }
                
                window.shareCodeList = []; 
                let rawList = [];
                let nowTime = new Date().getTime();
                let oneDayMs = 24 * 60 * 60 * 1000;

                data.forEach(row => {
                    let questionRaw = row[2] || '';
                    let targetTag = `[SHARECODE|${currentShareCategory}`;
                    if (!questionRaw.startsWith(targetTag)) return;
                    
                    let time = row[0] || ''; 
                    // Loại bỏ tất cả khoảng trắng, gạch ngang, v.v. để lấy mssv gốc
                    let rawAuthor = String(row[1] || '').trim().replace(/[-|]/g, '');
                    let displayMssv = maskMSSV(rawAuthor); 
                    
                    // ==========================================
                    // 1. NẾU LÀ ADMIN ĐANG XEM -> LẤY TÊN TỪ MAP
                    // ==========================================
                    if (isSystemAdmin) {
                        let fullName = window.allUsersMap ? window.allUsersMap[rawAuthor] : null;
                        if (fullName) {
                            let shortName = getNaturalShortName(fullName);
                            displayMssv = `${rawAuthor} - ${shortName}`;
                        } else {
                            displayMssv = rawAuthor; 
                        }
                    } 
                    // ==========================================
                    // 2. NẾU TÁC GIẢ BÀI VIẾT ĐANG TỰ XEM BÀI CỦA MÌNH
                    // ==========================================
                    else if (activeUser && activeUser.mssv) {
                        // So sánh chuẩn hóa (bỏ dấu chấm)
                        let myCleanMssv = activeUser.mssv.replace(/\./g, "");
                        let authorCleanMssv = rawAuthor.replace(/\./g, "");
                        
                        if (myCleanMssv === authorCleanMssv) {
                            let shortName = getNaturalShortName(activeUser.name);
                            displayMssv = `${rawAuthor} - ${shortName} (Bạn)`;
                        }
                    }
                    // ==========================================

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

                    let postDate = null;
                    let match2 = time.match(/(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                    let match1 = time.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
                    if (match2) {
                        postDate = new Date(parseInt(match2[5]), parseInt(match2[4]) - 1, parseInt(match2[3]), parseInt(match2[1]), parseInt(match2[2]), 0);
                    } else if (match1) {
                        let h = match1[4] ? parseInt(match1[4]) : 0;
                        let m = match1[5] ? parseInt(match1[5]) : 0;
                        postDate = new Date(parseInt(match1[3]), parseInt(match1[2]) - 1, parseInt(match1[1]), h, m, 0);
                    }

                    let isCommented = answer.trim() !== "";
                    let isWithinOneDay = true;
                    if (postDate && (nowTime - postDate.getTime() > oneDayMs)) {
                        isWithinOneDay = false;
                    }
                    let isNew = !isCommented && isWithinOneDay;

                    rawList.push({
                        time: time, author: displayMssv, rawAuthor: rawAuthor, // Giữ nguyên MSSV thuần
                        maBai: maBaiValue, codeContent: questionRaw, answer: answer, rowIndex: rowIndex, isNew: isNew
                    });
                });

                // Lọc trùng & Gộp chung trạng thái isNew
               window.shareCodeList = rawList;

                let gridHtml = '<div class="row g-3">'; 
                window.shareCodeList.forEach((item, arrayIndex) => {
                    let newBadgeHtml = item.isNew ? `<span class="badge-new-qa position-absolute shadow-sm" style="top: 12px; left: 12px; z-index: 10; font-size: 11px;">Mới</span>` : '';
                    
                    gridHtml += `
                    <div class="col-6 col-md-4 col-lg-2">
                        <div class="card-sharecode-box position-relative" onclick="openShareCodeDetail(${arrayIndex})">
                            ${newBadgeHtml}
                            <div class="card-sharecode-badge">
                                <i class="fa-solid fa-code"></i>
                            </div>
                            <div class="card-sharecode-icon">
                                <i class="fa-solid fa-file-code"></i>
                            </div>
                            <div class="card-sharecode-body">
                                <h6 class="card-sharecode-title" title="${item.maBai}">${item.maBai}</h6>
                                <div class="card-sharecode-meta">
                                    <span class="meta-author"><i class="fa-solid fa-user-circle me-1"></i>${item.author}</span>
                                    <span class="meta-time"><i class="fa-regular fa-clock me-1"></i>${item.time}</span>
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
                
                if (window.shareCodeList.length === 0) {
                    gridHtml = `<div class="text-center p-4 text-muted"><i class="fa-solid fa-laptop-code fs-2 mb-2"></i><br>Học phần <b>${currentShareCategory}</b> chưa có code nào. Hãy chia sẻ!</div>`;
                }
                
                let finalHtml = `
                    <div id="shareCodeListWrapper">${gridHtml}</div>
                    <div id="shareCodeDetailWrapper" class="d-none"></div>
                `;
                $('#shareCodeListArea').html(finalHtml); 
            }
        });
    });
}
function processFormattedText(text) {
    if (!text) return "";
    
    // Nếu trong văn bản đã chứa các thẻ HTML cấu trúc (p, table, div, br), giữ nguyên không chèn thêm <br>
    if (/(<p>|<table>|<div>|<br\s*\/?>)/i.test(text)) {
        return text;
    }
    
    // Nếu là văn bản thuần (plain text), chuyển \n thành <br>
    return text.replace(/\n/g, '<br>');
}

window.openShareCodeDetail = function(index) {
    let item = window.shareCodeList[index];
    if(!item) return;
	if (typeof window.setDetailedView === 'function') {
        window.setDetailedView(`Thảo luận - Không gian Code - ${currentShareCategory} - Mã bài: ${item.maBai}`);
    }
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
	if (typeof window.setDetailedView === 'function') window.setDetailedView("Thảo luận - Không gian Code - " + currentShareCategory);
};
// Hàm xử lý gửi bình luận / góp ý trong phần Share Code
window.sendShareCodeReply = function(rowIndex) { 
    let replyText = $(`#txtShareReply-${rowIndex}`).val().trim(); 
    if (!replyText) { alert("Vui lòng nhập nội dung bình luận hoặc góp ý!"); return; } 
    
    let studentMssv = currentUser ? currentUser.mssv : "Khách";
    
    let now = new Date();
    let timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    
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
                window.shareCodeList = []; 
                let activeUser = JSON.parse(localStorage.getItem('currentUser')) || null;
                let isSystemAdmin = activeUser && (activeUser.mssv === "51.01.108.008" || activeUser.mssv === "5101108008");

                data.forEach(row => {
                    let questionRaw = row[2] || '';
                    let targetTag = `[SHARECODE|${currentShareCategory}`;
                    if (!questionRaw.startsWith(targetTag)) return;
                    
                    let time = row[0] || ''; 
                    let rawAuthor = String(row[1] || '').trim().replace(/[-|]/g, '');
                    let displayMssv = maskMSSV(rawAuthor); 
                    
                    // ==========================================
                    // 1. NẾU LÀ ADMIN ĐANG XEM -> LẤY TÊN TỪ MAP
                    // ==========================================
                    if (isSystemAdmin) {
                        let fullName = window.allUsersMap ? window.allUsersMap[rawAuthor] : null;
                        if (fullName) {
                            let shortName = getNaturalShortName(fullName);
                            displayMssv = `${rawAuthor} - ${shortName}`;
                        } else {
                            displayMssv = rawAuthor;
                        }
                    } 
                    // ==========================================
                    // 2. NẾU TÁC GIẢ BÀI VIẾT ĐANG TỰ XEM BÀI CỦA MÌNH
                    // ==========================================
                    else if (activeUser && activeUser.mssv) {
                        let myCleanMssv = activeUser.mssv.replace(/\./g, "");
                        let authorCleanMssv = rawAuthor.replace(/\./g, "");
                        
                        if (myCleanMssv === authorCleanMssv) {
                            let shortName = getNaturalShortName(activeUser.name);
                            displayMssv = `${rawAuthor} - ${shortName} (Bạn)`;
                        }
                    }
                    // ==========================================
                    
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
                        time: time, author: displayMssv, rawAuthor: rawAuthor, // Giữ nguyên MSSV thuần
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
window.groupLinksData = [];

// 1. Mở màn hình danh sách nhóm
window.openGroupLinksSection = function() {
    $('#shareCategoryView').addClass('d-none');
    $('#groupLinksView').removeClass('d-none');
    if (typeof window.setDetailedView === 'function') window.setDetailedView("Thảo luận - Nhóm học tập");
    
    // Bật khung chỉ định nếu là Admin
    if (isAdmin) {
        $('#adminGroupAssignArea').removeClass('d-none');
    } else {
        $('#adminGroupAssignArea').addClass('d-none');
    }

    cancelEditGroupLink();
    loadGroupLinks();
};

// 2. Tải và lọc danh sách các nhóm
window.loadGroupLinks = function() {
    $('#groupLinksListArea').html('');
    $('#groupLinksLoading').removeClass('d-none');
    
    $.ajax({
        url: SCRIPT_URL + "?action=getGroupLinks",
        method: "GET",
        dataType: "json",
        success: function(data) {
            $('#groupLinksLoading').addClass('d-none');
            
            let html = '';
            window.groupLinksData = data; 
            
            if (data && data.length > 0) {
                data.forEach((row, index) => {
                    let time = row[0]; let mssv = row[1]; let author = row[2];
                    let title = row[3]; let platform = row[4]; let desc = row[5];
                    let url = row[6]; let assigned = row[7]; let rowIndex = row[8];
                    
                    // LỌC QUYỀN HIỂN THỊ (ADMIN CHỈ ĐỊNH)
                    let allowedToSee = true;
                    if (assigned && assigned.trim() !== "") {
                        let allowedMssvs = assigned.split(',').map(s => s.trim());
                        
                        // Admin hoặc chính người tạo ra luôn thấy
                        if (isAdmin || (currentUser && currentUser.mssv === mssv)) {
                            allowedToSee = true;
                        } 
                        // Nếu là sinh viên, phải có MSSV trong danh sách mới thấy
                        else if (currentUser && allowedMssvs.includes(currentUser.mssv)) {
                            allowedToSee = true;
                        } else {
                            allowedToSee = false; // Chặn không cho xem
                        }
                    }
                    
                    if (!allowedToSee) return; // Bỏ qua không vẽ ra giao diện
                    
                    // Cấp quyền sửa xóa cho Admin hoặc Chính chủ
                    let isOwnerOrAdmin = isAdmin || (currentUser && (currentUser.mssv === mssv || currentUser.mssv === "51.01.108.008"));
                    
                    let iconHtml = ''; let badgeBg = 'bg-light text-dark';
                    if (platform === 'Zalo') { iconHtml = '<i class="fa-solid fa-comment-dots text-primary"></i>'; }
                    else if (platform === 'Messenger') { iconHtml = '<i class="fa-brands fa-facebook-messenger text-primary"></i>'; }
                    else if (platform === 'Discord') { iconHtml = '<i class="fa-brands fa-discord" style="color: #5865F2;"></i>'; }
                    else if (platform === 'Telegram') { iconHtml = '<i class="fa-brands fa-telegram text-info"></i>'; }
                    else { iconHtml = '<i class="fa-solid fa-users text-success"></i>'; }
                    
                    let actionBtns = '';
                    if (isOwnerOrAdmin) {
                        actionBtns = `
                            <button class="btn btn-sm btn-outline-warning py-0 px-2 fw-bold me-1" title="Sửa" onclick="editGroupLinkDirect(${index})"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-sm btn-outline-danger py-0 px-2 fw-bold" title="Xóa" onclick="deleteGroupLinkDirect('${rowIndex}')"><i class="fa-solid fa-trash"></i></button>
                        `;
                    }
                    
                    // Thêm huy hiệu thông báo nhóm kín dành cho Admin nhìn thấy
                    let privateBadge = (assigned && assigned.trim() !== "") ? `<br><span class="badge bg-danger mt-1" title="Chỉ định: ${assigned}"><i class="fa-solid fa-lock"></i> Nhóm chỉ định</span>` : '';

                    html += `
                    <div class="col-md-6 col-lg-3">
                        <div class="card-sharecode-box shadow-sm" style="border-left: 4px solid #10b981; align-items: flex-start; min-height: 160px; cursor: default; justify-content: start; border-radius: 12px; padding: 18px;">
                            <div class="d-flex justify-content-between align-items-center w-100 mb-2">
                                <span class="badge ${badgeBg} border shadow-sm fs-6">${iconHtml} ${platform}</span>
                                <div class="d-flex gap-1">${actionBtns}</div>
                            </div>
                            <h6 class="fw-bold mb-1 mt-2" style="color: #1e293b; font-size: 16px;">${title} ${privateBadge}</h6>
                            <div class="text-muted small mb-2" style="font-size: 12px;">
                                <i class="fa-regular fa-clock me-1"></i>${time} <span class="mx-1">|</span> Đăng bởi: <span class="fw-bold text-secondary">${getNaturalShortName(author)}</span>
                            </div>
                            <p class="small text-secondary mb-3" style="line-height: 1.4;">${desc}</p>
                            <a href="${url}" target="_blank" class="btn btn-sm w-100 fw-bold text-white mt-auto shadow-sm" style="background: #10b981; border-radius: 8px;">Tham gia nhóm <i class="fa-solid fa-arrow-right ms-1"></i></a>
                        </div>
                    </div>`;
                });
            }

            if (html === '') {
                $('#groupLinksListArea').html('<div class="col-12 text-center text-muted p-5 bg-white rounded border shadow-sm"><i class="fa-solid fa-users-slash fs-1 mb-3"></i><br>Không có nhóm học tập nào được phép hiển thị cho bạn.</div>');
            } else {
                $('#groupLinksListArea').html(html);
            }
        }
    });
};

// 3. Đăng tải nhóm mới
window.saveGroupLink = function() {
    if (!currentUser || currentUser.isGuest) {
        alert("Vui lòng đăng nhập để chia sẻ nhóm học tập!");
        return;
    }
    
    let rowIndex = $('#glRowIndex').val();
    let title = $('#glTitle').val().trim();
    let platform = $('#glPlatform').val();
    let url = $('#glUrl').val().trim();
    let desc = $('#glDesc').val().trim();
    let assigned = isAdmin ? $('#glAssigned').val().trim() : "";
    
    if (!title || !url) {
        alert("Vui lòng nhập đầy đủ Môn học/Chủ đề nhóm và Link tham gia!");
        return;
    }
    if (!url.match(/^https?:\/\//i)) url = 'https://' + url;
    
    let isEdit = rowIndex !== "";
    let payload = {
        action: isEdit ? "editGroupLink" : "addGroupLink",
        mssv: currentUser.mssv,
        author: currentUser.name,
        title: title,
        platform: platform,
        desc: desc,
        url: url,
        assigned: assigned
    };
    if (isEdit) payload.rowIndex = rowIndex;
    
    let btn = $('#btnSaveGroupLink');
    let originText = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...').prop('disabled', true);
    
    postToGAS(payload, function(res) {
        alert(res);
        btn.html(originText).prop('disabled', false);
        cancelEditGroupLink();
        loadGroupLinks();
    }, function() {
        alert("Lỗi kết nối máy chủ!");
        btn.html(originText).prop('disabled', false);
    });
};

// 4. Đổ dữ liệu cũ vào Form Sửa
window.editGroupLinkDirect = function(index) {
    let item = window.groupLinksData[index];
    if (!item) return;
    
    $('#glRowIndex').val(item[8]);
    $('#glTitle').val(item[3]);
    $('#glPlatform').val(item[4]);
    $('#glDesc').val(item[5]);
    $('#glUrl').val(item[6]);
    if (isAdmin) {
        $('#glAssigned').val(item[7] || "");
    }
    
    $('#groupLinkFormTitle').html('<i class="fa-solid fa-pen-to-square me-2 text-warning"></i>Đang chỉnh sửa nhóm');
    $('#btnSaveGroupLink').html('<i class="fa-solid fa-floppy-disk me-2"></i> Lưu thay đổi');
    $('#btnCancelEditGroupLink').removeClass('d-none');
    
    $('html, body').animate({ scrollTop: $('#groupLinksView').offset().top - 100 }, 300);
};

// 5. Reset Form về trạng thái Đăng Nhóm Mới
window.cancelEditGroupLink = function() {
    $('#glRowIndex, #glTitle, #glDesc, #glUrl, #glAssigned').val('');
    $('#glPlatform').val('Zalo');
    
    $('#groupLinkFormTitle').html('<i class="fa-solid fa-plus-circle me-2"></i>Tạo / Chia sẻ nhóm mới');
    $('#btnSaveGroupLink').html('<i class="fa-solid fa-share-nodes me-2"></i> Đăng chia sẻ nhóm');
    $('#btnCancelEditGroupLink').addClass('d-none');
};

// 6. Xóa vĩnh viễn nhóm
window.deleteGroupLinkDirect = function(rowIndex) {
    if (!confirm("Bạn có chắc chắn muốn xóa nhóm học tập này khỏi hệ thống?")) return;
    
    postToGAS({
        action: "deleteGroupLink",
        rowIndex: rowIndex,
        mssv: currentUser.mssv
    }, function(res) {
        alert(res);
        loadGroupLinks();
    }, function() {
        alert("Lỗi kết nối máy chủ!");
    });
};