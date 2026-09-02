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
// Thêm biến theo dõi Đặt lịch hẹn
window.isQAUnanswered = false;
window.isShareCodeNew = false;
window.isDatLichNew = false; // THÊM MỚI

// Cập nhật hàm updateSidebarThaoLuanBadge
function updateSidebarThaoLuanBadge() {
    // Bật/tắt ngoài Sidebar (Thêm isDatLichNew)
    if (window.isQAUnanswered || window.isShareCodeNew || window.isDatLichNew) {
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
    
    // THÊM MỚI: Bật/tắt riêng cho thẻ "Đặt lịch hẹn"
    if (window.isDatLichNew) {
        $('#datLichInsideBadge').removeClass('d-none');
    } else {
        $('#datLichInsideBadge').addClass('d-none');
    }
}
// Hàm kiểm tra Đặt Lịch Hẹn có bài mới hay không
function checkNewDatLichGlobal() {
    $.ajax({
        url: SCRIPT_URL + "?action=getDatLichHenData",
        method: "GET",
        dataType: "json",
        success: function(data) {
            if (!data || data.length === 0) {
                window.isDatLichNew = false;
                updateSidebarThaoLuanBadge();
                return;
            }

            let nowTime = new Date().getTime();
            let oneDayMs = 24 * 60 * 60 * 1000; // 24 giờ
            let hasNew = false;

            data.forEach(item => {
                let time = item.updateTime || '';
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

                // Nếu bài đăng xuất hiện trong vòng 1 ngày -> Có bài mới
                if (postDate && (nowTime - postDate.getTime() <= oneDayMs)) {
                    hasNew = true;
                }
            });

            window.isDatLichNew = hasNew;
            updateSidebarThaoLuanBadge();
        }
    });
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
                // Thay thế đoạn window.isQAUnanswered cũ bằng khối này:
window.isQAUnanswered = data.some(row => { return (row[3] ? String(row[3]).trim() : '') === ''; });

if (currentUser && !currentUser.isGuest) {
    let myCleanMssv = currentUser.mssv.replace(/\./g, "").toLowerCase();
    window.personalUnreadQA = data.filter(row => {
        let authorCleanMssv = String(row[1] || '').trim().replace(/[-|.]/g, '').toLowerCase();
        return authorCleanMssv === myCleanMssv && row[7] === 'UNREAD';
    });
    updatePersonalNotificationBell();
}
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
if (currentUser && !currentUser.isGuest) {
    let myCleanMssv = currentUser.mssv.replace(/\./g, "").toLowerCase();
    window.personalUnreadShareCode = data.filter(row => {
        let authorCleanMssv = String(row[1] || '').trim().replace(/[-|.]/g, '').toLowerCase();
        return authorCleanMssv === myCleanMssv && row[7] === 'UNREAD';
    });
    updatePersonalNotificationBell();
}
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
     
            
// Hàm hỗ trợ format chữ và xuống dòng an toàn (bảo vệ khối Code)
window.safeFormatTextQA = function(rawText) {
    if (!rawText) return "";
    let textParts = rawText.split(/(```[a-zA-Z\+\#]*\n?[\s\S]*?\n?```)/g);
    for (let i = 0; i < textParts.length; i++) {
        if (!textParts[i].startsWith("```")) {
            // Đổi \n thành <br> ở các đoạn văn bản thường
            textParts[i] = textParts[i].replace(/\n/g, '<br>');
        }
    }
    // Sau khi đổi <br>, mới tiến hành format Code
    return formatCodeBlocks(textParts.join(''));
};

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
                
                let activeUser = JSON.parse(localStorage.getItem('currentUser')) || null;
                let isSystemAdmin = activeUser && (activeUser.mssv === "51.01.108.008" || activeUser.mssv === "5101108008");
                
                if (isSystemAdmin) {
                    let fullName = window.allUsersMap ? window.allUsersMap[rawMssv] : null;
                    displayMssv = fullName ? `${rawMssv} - ${getNaturalShortName(fullName)}` : rawMssv;
                } else if (activeUser && activeUser.mssv) {
                    let myCleanMssv = activeUser.mssv.replace(/\./g, "");
                    if (myCleanMssv === rawMssv.replace(/\./g, "")) {
                        displayMssv = `${rawMssv} - ${getNaturalShortName(activeUser.name)} (Bạn)`;
                    }
                }

                svName = "Sinh viên (" + displayMssv + ")";

                if (splitData.length >= 3) {
                    let timeStr = splitData[1].trim();
                    timeHtml = `<span class="text-muted ms-2" style="font-size: 12.5px; font-weight: normal;"><i class="fa-regular fa-clock"></i> ${timeStr}</span>`;
                    svMsg = splitData.slice(2).join(":::").trim();
                } else {
                    svMsg = splitData.slice(1).join(":::").trim();
                }
            }
            
            // SỬ DỤNG HÀM XUỐNG DÒNG AN TOÀN
            let svFormattedMsg = window.safeFormatTextQA(svMsg);
            
            html += `<div class="msg-sv"><i class="fa-solid fa-user-graduate me-2"></i><strong>${svName}</strong>${timeHtml}:<br><div class="mt-1" style="font-weight: normal;">${svFormattedMsg}</div>`; 
            
            if (isAdmin) { 
                html += `<div class="mt-2 text-end"><button class="btn btn-sm btn-outline-danger py-0" onclick="deleteThreadPart(${rowIndex}, ${index})" style="font-size: 12px;"><i class="fa-solid fa-trash"></i> Xóa phản hồi này</button></div>`; 
            } 
            html += `</div>`; 
        } else { 
            // SỬ DỤNG HÀM XUỐNG DÒNG AN TOÀN CHO ADMIN
            let adminText = window.safeFormatTextQA(content);
            html += `<div class="msg-admin"><i class="fa-solid fa-user-shield me-2"></i><strong>Admin:</strong><br><div class="mt-1" style="font-weight: normal;">${adminText}</div>`; 
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
                    
                  let question = window.safeFormatTextQA(rawQuestion);

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
$('#groupLinksView').addClass('d-none');
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

              // === BẮT ĐẦU ĐOẠN CODE THAY THẾ ===
                
// 1. Tách danh sách theo ưu tiên: Mới (Của tôi) -> Mới (Người khác) -> Cũ (Gần nhất)
let activeUserObj = JSON.parse(localStorage.getItem('currentUser')) || null;
let myCleanMssv = activeUserObj ? activeUserObj.mssv.replace(/\./g, "") : "";

let newMyCodes = [];
let newOtherCodes = [];
let oldCodes = [];

// Duyệt ngược mảng để đảm bảo các bài đăng gần nhất (nằm cuối) luôn được lên đầu
for (let i = 0; i <= rawList.length - 1; i++) {
    let item = rawList[i];
    let authorCleanMssv = item.rawAuthor.replace(/\./g, "");
    let isMyCode = (myCleanMssv !== "" && authorCleanMssv === myCleanMssv);
    
    if (item.isNew) {
        if (isMyCode) {
            newMyCodes.push(item);      // [Nhóm 1] Có chữ Mới + Code của Tác giả
        } else {
            newOtherCodes.push(item);   // [Nhóm 2] Có chữ Mới + Code của SV khác
        }
    } else {
        oldCodes.push(item);            // [Nhóm 3] Không có chữ Mới (Đã tự động xếp gần nhất do duyệt ngược)
    }
}

// Gộp lại: Đẩy toàn bộ vào danh sách hiển thị theo đúng thứ tự ưu tiên
window.shareCodeList = newMyCodes.concat(newOtherCodes, oldCodes);

                // 2. Render giao diện danh sách thẻ
                let gridHtml = '<div class="row g-3">'; 
                window.shareCodeList.forEach((item, arrayIndex) => {
                    
                    let authorCleanMssv = item.rawAuthor.replace(/\./g, "");
                    let isMyCode = (myCleanMssv !== "" && authorCleanMssv === myCleanMssv);
                    
                    let newBadgeHtml = item.isNew ? `<span class="badge-new-qa position-absolute shadow-sm" style="top: 12px; left: 12px; z-index: 10; font-size: 11px;">Mới</span>` : '';
                    
                    // Thêm nhãn "Của bạn" vào góc phải
                    let myBadgeHtml = isMyCode 
                        ? `<span class="badge bg-success position-absolute shadow-sm" style="top: 8px; right: 8px; z-index: 10; font-size: 10px;"><i class="fa-solid fa-user-check me-1"></i>Bạn</span>` 
                        : `<div class="card-sharecode-badge"><i class="fa-solid fa-code"></i></div>`;
                        
                    // Đổi màu icon trung tâm thành tông xanh lá nếu là bài của mình
                    let iconStyle = isMyCode ? 'background: linear-gradient(135deg, #dcfce7 0%, #86efac 100%); color: #166534;' : '';
                    
                    gridHtml += `
                    <div class="col-6 col-md-4 col-lg-2">
                        <div class="card-sharecode-box position-relative" onclick="openShareCodeDetail(${arrayIndex})">
                            ${newBadgeHtml}
                            ${myBadgeHtml}
                            <div class="card-sharecode-icon" style="${iconStyle}">
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
                
                // === KẾT THÚC ĐOẠN CODE THAY THẾ ===
                
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
// 1. Mở màn hình danh sách nhóm
window.openGroupLinksSection = function() {
    document.title = "Nhóm học tập | Học nhóm APMA Khoa Toán";
    
    resetNavActive(); // Reset các menu
    $('#btnNavShareCode').addClass('active'); // Giữ thanh sáng ở menu Thảo luận
    $('#shareCodeSection').removeClass('d-none'); // Hiện section Thảo luận chính
    
    $('#shareCategoryView').addClass('d-none'); // Ẩn màn hình chọn thẻ
    $('#shareContentView').addClass('d-none'); // Ẩn khung code (nếu có)
    $('#groupLinksView').removeClass('d-none'); // Hiện khu vực Nhóm học tập
    
    updateSystemUrl('view', 'grouplinks'); // Thay đổi URL thành ?view=grouplinks

    if (window.innerWidth < 992) { 
        sidebar.classList.remove('show'); 
        overlay.classList.remove('show'); 
    }

    if (typeof window.setDetailedView === 'function') window.setDetailedView("Thảo luận - Nhóm học tập");

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
                    // Thêm huy hiệu thông báo nhóm kín. Đặt điều kiện hiển thị Tooltip (title)
let hoverTitle = isAdmin ? `Chỉ định: ${assigned}` : `Chỉ những sinh viên được chỉ định mới có thể xem nhóm này`;
let privateBadge = (assigned && assigned.trim() !== "") ? `<br><span class="badge bg-danger mt-1" title="${hoverTitle}"><i class="fa-solid fa-lock"></i> Nhóm chỉ định</span>` : '';

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
    let assigned = $('#glAssigned').val().trim();
    
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

// Biến lưu trữ dữ liệu Tag Input
window.allUsersDataForSearch = [];
window.selectedGroupAssignees = [];

// 1. Hàm hiển thị form tạo nhóm (Đã gộp lấy danh sách sinh viên)
window.toggleGroupLinkForm = function() {
    if (!currentUser || currentUser.isGuest) {
        alert("Vui lòng đăng nhập để chia sẻ nhóm học tập!");
        return;
    }
    
    // Tải danh sách sinh viên một lần duy nhất nếu chưa có
    if (window.allUsersDataForSearch.length === 0) {
        $.ajax({
            url: SCRIPT_URL + "?action=getAllUsers",
            method: "GET",
            dataType: "json",
            success: function(users) {
                window.allUsersDataForSearch = users;
            }
        });
    }
    
    // Mở bảng lên và cuộn màn hình nhẹ xuống
    $('#groupLinkFormContainer').removeClass('d-none');
    $('html, body').animate({ scrollTop: $('#groupLinkFormContainer').offset().top - 100 }, 300);
};

// 2. Bắt sự kiện gõ phím để lọc và hiển thị danh sách gợi ý
// 2. Bắt sự kiện gõ phím để lọc và hiển thị danh sách gợi ý
function maskMSSVForGroupAssign(mssv) {
    let str = String(mssv).trim();
    // Kiểm tra xem có phải là Admin (dựa vào biến toàn cục isAdmin hoặc tài khoản chỉ định)
    let isUserAdmin = isAdmin || (currentUser && (currentUser.mssv === "51.01.108.008" || currentUser.mssv === "5101108008"));
    
    if (isUserAdmin) return str; // Nếu là Admin -> Hiện FULL
    
    // Nếu là Sinh viên bình thường -> Che
    if (str.length <= 6) return str;
    return str.substring(0, 2) + '***' + str.substring(str.length - 3); 
}

// 2. Bắt sự kiện gõ phím để lọc và hiển thị danh sách gợi ý
$(document).on('input', '#glAssignedSearch', function() {
    let keyword = $(this).val().toLowerCase().trim();
    let dropdown = $('#glAssignedDropdown');
    
    if (keyword.length === 0) {
        dropdown.hide();
        return;
    }

    // Lọc sinh viên khớp từ khóa VÀ chưa được chọn
    let matches = window.allUsersDataForSearch.filter(u => 
        (u.mssv.toLowerCase().includes(keyword) || u.name.toLowerCase().includes(keyword)) &&
        !window.selectedGroupAssignees.includes(u.mssv)
    );

    if (matches.length > 0) {
        let html = '';
        matches.slice(0, 10).forEach(u => {
            // SỬ DỤNG HÀM CHE DÀNH RIÊNG CHO FORM CHỈ ĐỊNH NHÓM
            let displayMssv = maskMSSVForGroupAssign(u.mssv);
            html += `<li><a class="dropdown-item py-2" href="javascript:void(0)" onclick="addAssignee('${u.mssv}', '${u.name}')"><strong class="text-primary">${displayMssv}</strong> - ${u.name}</a></li>`;
        });
        dropdown.html(html).show();
    } else {
        dropdown.html('<li><span class="dropdown-item text-muted py-2">Không tìm thấy sinh viên...</span></li>').show();
    }
});

// Ẩn bảng gợi ý khi click chuột ra ngoài
$(document).on('click', function(e) {
    if (!$(e.target).closest('#adminGroupAssignArea').length) {
        $('#glAssignedDropdown').hide();
    }
});

// 3. Hàm thêm/xóa/vẽ thẻ (Tags)
window.addAssignee = function(mssv, name) {
    if (!window.selectedGroupAssignees.includes(mssv)) {
        window.selectedGroupAssignees.push(mssv);
        renderAssigneeTags();
    }
    $('#glAssignedSearch').val('').focus();
    $('#glAssignedDropdown').hide();
};

window.removeAssignee = function(mssv) {
    window.selectedGroupAssignees = window.selectedGroupAssignees.filter(id => id !== mssv);
    renderAssigneeTags();
};

// 5. Hàm vẽ lại các thẻ Tag (Badge) và cập nhật dữ liệu ẩn
window.renderAssigneeTags = function() {
    let html = '';
    window.selectedGroupAssignees.forEach(mssv => {
        let user = window.allUsersDataForSearch.find(u => u.mssv === mssv);
        
        // SỬ DỤNG HÀM CHE DÀNH RIÊNG CHO FORM CHỈ ĐỊNH NHÓM
        let displayMssv = maskMSSVForGroupAssign(mssv);
        let displayName = user ? `${displayMssv} - ${getNaturalShortName(user.name)}` : displayMssv;
        
        html += `
        <span class="badge bg-primary d-flex align-items-center gap-2 shadow-sm" style="font-size: 13px; padding: 6px 10px; border-radius: 6px;">
            ${displayName}
            <i class="fa-solid fa-xmark" style="cursor: pointer; opacity: 0.8;" onclick="removeAssignee('${mssv}')" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'"></i>
        </span>`;
    });
    
    $('#glAssignedTags').html(html);
    $('#glAssigned').val(window.selectedGroupAssignees.join(',')); 
};
// 4. Đổ dữ liệu cũ vào Form khi ấn Sửa (Đã gộp Logic cũ và mới)
window.editGroupLinkDirect = function(index) {
    let item = window.groupLinksData[index];
    if (!item) return;
    
    // --- Logic gốc đổ dữ liệu ---
    $('#glRowIndex').val(item[8]);
    $('#glTitle').val(item[3]);
    $('#glPlatform').val(item[4]);
    $('#glDesc').val(item[5]);
    $('#glUrl').val(item[6]);
    $('#glAssigned').val(item[7] || ""); 
    
    $('#groupLinkFormTitle').html('<i class="fa-solid fa-pen-to-square me-2 text-warning"></i>Đang chỉnh sửa nhóm');
    $('#btnSaveGroupLink').html('<i class="fa-solid fa-floppy-disk me-2"></i> Lưu thay đổi');
    $('#btnCancelEditGroupLink').removeClass('d-none');
    
    $('#groupLinkFormContainer').removeClass('d-none');
    $('html, body').animate({ scrollTop: $('#groupLinkFormContainer').offset().top - 100 }, 300);

    // --- Logic mới xử lý vẽ thẻ Tags ---
    let assignedStr = item[7] || "";
    window.selectedGroupAssignees = assignedStr ? assignedStr.split(',').map(s => s.trim()).filter(s => s) : [];
    renderAssigneeTags();
    
    // Tải danh sách người dùng nếu chưa có để hiển thị tên đẹp hơn
    if (window.allUsersDataForSearch.length === 0) {
        $.ajax({
            url: SCRIPT_URL + "?action=getAllUsers",
            method: "GET",
            dataType: "json",
            success: function(users) {
                window.allUsersDataForSearch = users;
                renderAssigneeTags(); // Vẽ lại để cập nhật tên
            }
        });
    }
};

// 5. Reset Form về trạng thái Đăng Nhóm Mới
window.cancelEditGroupLink = function() {
    // --- Logic gốc ---
    $('#glRowIndex, #glTitle, #glDesc, #glUrl, #glAssigned').val('');
    $('#glPlatform').val('Zalo');
    
    $('#groupLinkFormTitle').html('<i class="fa-solid fa-plus-circle me-2"></i>Tạo / Chia sẻ nhóm mới');
    $('#btnSaveGroupLink').html('<i class="fa-solid fa-share-nodes me-2"></i> Đăng chia sẻ nhóm');
    $('#btnCancelEditGroupLink').addClass('d-none');
    
    $('#groupLinkFormContainer').addClass('d-none');

    // --- Logic mới ---
    window.selectedGroupAssignees = [];
    renderAssigneeTags();
    $('#glAssignedSearch').val('');
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
function loadDynamicHocPhanQA() {
    let filterTopic = $('#filterQATopic'); // Đổ cho bộ lọc tìm kiếm danh sách Q&A bên dưới
    let modalList = $('#qaCourseModalList');
    
    if (typeof SYSTEM_COURSE_DATABASE !== 'undefined') {
        let groupedCourses = {};
        
        // Gom nhóm theo Học kỳ
        SYSTEM_COURSE_DATABASE.forEach(course => {
            let groupKey = `${course.hocKy} (${course.namHoc})`;
            if (!groupedCourses[groupKey]) groupedCourses[groupKey] = [];
            if (!groupedCourses[groupKey].some(c => c.code === course.code)) {
                groupedCourses[groupKey].push(course);
            }
        });
        
        let modalHtml = '';
        let optionsHtml = '';
        
        // Vẽ giao diện bên trong Modal
        for (let group in groupedCourses) {
            optionsHtml += `<optgroup label="🎓 ${group}">`;
            
            // Header của từng Học kỳ
            modalHtml += `<div class="qa-course-group mb-4">`;
            modalHtml += `<h6 class="fw-bold text-primary border-bottom pb-2 mb-3" style="font-size: 15px; text-transform: uppercase;"><i class="fa-solid fa-caret-right me-2"></i>${group}</h6>`;
            modalHtml += `<div class="row g-3">`;
            
            groupedCourses[group].forEach(course => {
                let optionValue = `${course.code}-${course.name}`;
                optionsHtml += `<option value="${optionValue}">${optionValue}</option>`;
                
                // Thẻ Môn học tuyệt đẹp (Card UI)
                modalHtml += `
                <div class="col-md-6 qa-course-item">
                    <div class="p-3 border rounded shadow-sm d-flex align-items-center gap-3 h-100" 
                         style="cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); background: #ffffff;"
                         onclick="selectQaCourse('${optionValue}')"
                         onmouseover="this.style.background='#f0f7ff'; this.style.borderColor='#0f4c81'; this.style.transform='translateY(-2px)';"
                         onmouseout="this.style.background='#ffffff'; this.style.borderColor='#dee2e6'; this.style.transform='translateY(0)';">
                        <div class="bg-light text-primary rounded d-flex align-items-center justify-content-center fw-bold font-monospace shadow-sm" style="min-width: 85px; height: 40px; font-size: 13.5px; border: 1px dashed #cbd5e1;">
                            ${course.code}
                        </div>
                        <div class="fw-bold text-dark flex-grow-1" style="font-size: 14.5px; line-height: 1.4;">
                            ${course.name}
                        </div>
                    </div>
                </div>`;
            });
            
            modalHtml += `</div></div>`;
            optionsHtml += `</optgroup>`;
        }
        
        modalList.html(modalHtml);
        
        // Tạo Optgroup Lọc Q&A
        let supportHtml = `
            <optgroup label="📌 Hỗ trợ & Học vụ">
                <option value="Hệ thống">Hệ thống</option>
                <option value="Đăng ký học phần">Đăng ký học phần</option>
                <option value="Chương trình đào tạo">Chương trình đào tạo</option>
                <option value="Tốt nghiệp">Tốt nghiệp</option>
                <option value="Kết quả học tập">Kết quả học tập</option>
                <option value="Kết quả rèn luyện">Kết quả rèn luyện</option>
                <option value="Sự kiện">Sự kiện</option>
                <option value="Khác">Các chủ đề khác</option>
            </optgroup>`;
        filterTopic.html('<option value="">-- Tất cả chủ đề --</option>' + optionsHtml + supportHtml);
    }
}

// Hàm mở Modal Khung chọn môn
window.openQaCourseModal = function() {
    $('#qaSearchCourseInput').val(''); // Reset thanh tìm kiếm
    filterQaCourseModal(); // Reset bộ lọc hiện tất cả
    $('#qaCourseSelectModal').modal('show');
    setTimeout(() => $('#qaSearchCourseInput').focus(), 400);
};

// Hàm khi Sinh viên bấm chọn 1 môn học trong khung
window.selectQaCourse = function(courseValue) {
    // 1. Cập nhật chữ hiển thị
    $('#qaSelectedCourseText').html(`<i class="fa-solid fa-check-circle text-success me-2"></i><span class="text-primary">${courseValue}</span>`);
    // 2. Gán giá trị vào Input ẩn
    $('#qaTopicHocPhan').val(courseValue);
    
    // 3. Reset lại ô "Hỗ trợ & Học vụ" nếu nó đang được chọn
    $('#qaTopicHoTro').val(''); 
    $('#qaTopicOther').addClass('d-none').val('');
    
    // 4. Đóng khung
    $('#qaCourseSelectModal').modal('hide');
};

// Lọc môn học trực tiếp bằng gõ phím bên trong Khung (Cực mượt)
window.filterQaCourseModal = function() {
    let keyword = $('#qaSearchCourseInput').val().toLowerCase().trim();
    
    $('.qa-course-group').each(function() {
        let hasVisibleItem = false;
        
        $(this).find('.qa-course-item').each(function() {
            let text = $(this).text().toLowerCase();
            if (text.includes(keyword)) {
                $(this).removeClass('d-none');
                hasVisibleItem = true;
            } else {
                $(this).addClass('d-none');
            }
        });
        
        // Ẩn luôn Tiêu đề học kỳ nếu không có môn nào bên trong khớp với từ khóa
        if (hasVisibleItem) {
            $(this).removeClass('d-none');
        } else {
            $(this).addClass('d-none');
        }
    });
};

// Cập nhật lại logic chọn ô "Hỗ trợ" thì Reset ô "Học phần"
window.handleTopicSelection = function(type) {
    if (type === 'hotro') {
        // Đã xóa giá trị thật
        $('#qaTopicHocPhan').val(''); 
        // Đổi màu hiển thị của ô chọn giả lập về mặc định
        $('#qaSelectedCourseText').html('<i class="fa-solid fa-book-open text-primary me-2"></i>-- 📚 Chọn học phần chuyên môn --');
        
        let selected = $('#qaTopicHoTro').val();
        if (selected === 'Khác') {
            $('#qaTopicOther').removeClass('d-none').focus();
        } else {
            $('#qaTopicOther').addClass('d-none').val('');
        }
    }
};

$(document).ready(function() {
    loadDynamicHocPhanQA();
});
// --- BỘ CÔNG CỤ TIẾN ĐỘ & GHI CHÚ BÀI HỌC CÁ NHÂN ---

// 1. Hàm lấy màu nền theo trạng thái tiến độ
function getProgressColor(val) {
    if (val === 'yellow') return '#fef08a'; // Vàng nhạt (Còn học)
    if (val === 'green') return '#bbf7d0';  // Xanh lá (Hoàn thành)
    return '#ffffff';                       // Trắng (Chưa học)
}

// 2. Hàm lưu trạng thái tiến độ
function updateProgress(selectEl, sheetName, rowIndex) {
    let val = $(selectEl).val();
    $(selectEl).css('background-color', getProgressColor(val));
    let mssv = (currentUser && currentUser.mssv) ? currentUser.mssv : 'guest';
    localStorage.setItem(`prog_${mssv}_${sheetName}_${rowIndex}`, val);
    
    // Đẩy lên Server
    syncLearningDataToServer();
}
// --- BỘ SOẠN THẢO RICH TEXT CHO GHI CHÚ CÁ NHÂN ---
$(document).ready(function() {
    tinymce.init({
        selector: '#pnContentEditor',
        height: 300,
        menubar: false,
        plugins: 'lists link table textcolor colorpicker',
        toolbar: 'undo redo | fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist | table link | removeformat',
        toolbar_mode: 'wrap',
        branding: false,
        setup: function (editor) {
            editor.on('change', function () {
                editor.save(); 
            });
        }
    });
});

// --- CẬP NHẬT LOGIC LƯU/MỞ/XÓA BẰNG TINYMCE ---

// 1. Hàm mở Modal nhập Ghi chú cá nhân
window.openPersonalNoteModal = function(sheetName, rowIndex) {
    let mssv = (currentUser && currentUser.mssv) ? currentUser.mssv : 'guest';
    let noteData = JSON.parse(localStorage.getItem(`note_${mssv}_${sheetName}_${rowIndex}`)) || null;
    
    $('#pnSheetName').val(sheetName);
    $('#pnRowIndex').val(rowIndex);
    
    if (noteData && noteData.content) {
        // Nạp dữ liệu vào khung soạn thảo nâng cao
        if (tinymce.get('pnContentEditor')) {
            tinymce.get('pnContentEditor').setContent(noteData.content);
        } else {
            $('#pnContentEditor').val(noteData.content);
        }
        $('#pnLastUpdated span').text(noteData.updatedAt);
        $('#pnLastUpdated').removeClass('d-none');
    } else {
        if (tinymce.get('pnContentEditor')) {
            tinymce.get('pnContentEditor').setContent('');
        } else {
            $('#pnContentEditor').val('');
        }
        $('#pnLastUpdated').addClass('d-none');
    }
    $('#personalNoteModal').modal('show');
};

// 2. Hàm Lưu Ghi chú cá nhân
window.savePersonalNote = function() {
    let sheetName = $('#pnSheetName').val();
    let rowIndex = $('#pnRowIndex').val();
    
    // Lấy nội dung từ TinyMCE
    let content = "";
    if (tinymce.get('pnContentEditor')) {
        content = tinymce.get('pnContentEditor').getContent().trim();
    } else {
        content = $('#pnContentEditor').val().trim();
    }
    
    let mssv = (currentUser && currentUser.mssv) ? currentUser.mssv : 'guest';
    let now = new Date();
    let pad = (n) => String(n).padStart(2, '0');
    let timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    
    if (content && content !== "<p></p>") {
        let noteData = { content: content, updatedAt: timeStr };
        localStorage.setItem(`note_${mssv}_${sheetName}_${rowIndex}`, JSON.stringify(noteData));
        alert("Đã lưu ghi chú cá nhân thành công!");
        
       $(`#btnNote_${rowIndex}`)
    .removeClass('btn-outline-secondary')
    .addClass('btn-primary text-white')
    .html('<i class="fa-solid fa-clipboard-check fs-6"></i>')
    .attr('title', 'Xem ghi chú');
    } else {
        localStorage.removeItem(`note_${mssv}_${sheetName}_${rowIndex}`);
        $(`#btnNote_${rowIndex}`).removeClass('btn-primary').addClass('btn-outline-secondary').html('<i class="fa-solid fa-clipboard"></i> Ghi chú');
    }
    $('#personalNoteModal').modal('hide');
    
    if (typeof syncLearningDataToServer === 'function') syncLearningDataToServer();
};

// 3. Hàm Xóa Ghi chú cá nhân
window.deletePersonalNote = function() {
    let sheetName = $('#pnSheetName').val();
    let rowIndex = $('#pnRowIndex').val();
    let mssv = (currentUser && currentUser.mssv) ? currentUser.mssv : 'guest';
    
    if (confirm("Bạn có chắc chắn muốn xóa ghi chú này?")) {
        localStorage.removeItem(`note_${mssv}_${sheetName}_${rowIndex}`);
        
        if (tinymce.get('pnContentEditor')) {
            tinymce.get('pnContentEditor').setContent('');
        } else {
            $('#pnContentEditor').val('');
        }
        $('#pnLastUpdated').addClass('d-none');
       $(`#btnNote_${rowIndex}`)
    .removeClass('btn-primary text-white')
    .addClass('btn-outline-secondary')
    .html('<i class="fa-regular fa-clipboard fs-6"></i>')
    .attr('title', 'Thêm ghi chú');
        $('#personalNoteModal').modal('hide');
        
        if (typeof syncLearningDataToServer === 'function') syncLearningDataToServer();
    }
};


// 6. Hàm TẢI dữ liệu từ Google Sheets về máy khi sinh viên Đăng nhập
function fetchLearningDataFromServer() {
    if (!currentUser || currentUser.isGuest) return;

    $.ajax({
        url: SCRIPT_URL + "?action=getLearningData&mssv=" + currentUser.mssv,
        method: "GET",
        dataType: "json",
        success: function(res) {
            if (res && Object.keys(res).length > 0) {
                if (res.progress) {
                    for (let key in res.progress) {
                        localStorage.setItem(key, res.progress[key]);
                    }
                }
                if (res.notes) {
                    for (let key in res.notes) {
                        localStorage.setItem(key, JSON.stringify(res.notes[key]));
                    }
                }
                
                // THÊM ĐIỀU KIỆN KHÔNG RENDER LẠI NẾU ĐANG Ở TRANG THÔNG BÁO
                if (!$('#courseSection').hasClass('d-none') && typeof currentSheetName !== 'undefined' && currentSheetName.toLowerCase() !== 'thông báo') {
                    loadDataByHocPhan(currentSheetName);
                }
            }
        }
    });
}

// 7. Hàm GỬI dữ liệu từ máy lên Google Sheets (Chạy ngầm)
function syncLearningDataToServer() {
    if (!currentUser || currentUser.isGuest) return;
    
    let mssv = currentUser.mssv;
    let learningData = { progress: {}, notes: {} };
    
    // Gom tất cả các ghi chú và tiến độ của user này trên máy
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key && key.startsWith(`prog_${mssv}_`)) {
            learningData.progress[key] = localStorage.getItem(key);
        } else if (key && key.startsWith(`note_${mssv}_`)) {
            learningData.notes[key] = JSON.parse(localStorage.getItem(key));
        }
    }
    
    // Đẩy ngầm lên server (không làm phiền giao diện người dùng)
    postToGAS({
        action: "saveLearningData",
        mssv: mssv,
        dataStr: JSON.stringify(learningData)
    }, function(res) {
        console.log("Đã đồng bộ lên đám mây:", res);
    }, function(err) {
        console.error("Lỗi đồng bộ:", err);
    });
}

// ========================================================
// TÍNH NĂNG RÀNG BUỘC TOÀN MÀN HÌNH & CHẶN MỞ TAB MỚI (V5)
// ========================================================

let isEnforcedFullscreen = false;
let pendingUrlToOpen = "";
let allowLessonClose = false; // Biến cờ cho phép đóng bài học

// 1. Bảng 1: Cảnh báo khi bấm mở link ngoài (ChatGPT, Gemini...)
const linkWarningModalHtml = `
<div class="modal fade" id="linkWarningModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" style="z-index: 10600;">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
            <div class="modal-header text-white" style="background-color: #f59e0b;">
                <h6 class="modal-title fw-bold text-uppercase"><i class="fa-solid fa-triangle-exclamation fa-fade me-2"></i>Cảnh Báo Chuyển Tab</h6>
            </div>
            <div class="modal-body p-4 text-center">
                <div class="mb-3">
                    <div class="mx-auto d-flex align-items-center justify-content-center rounded-circle" style="width: 70px; height: 70px; background-color: #fef3c7; color: #f59e0b; font-size: 32px;">
                        <i class="fa-solid fa-up-right-from-square"></i>
                    </div>
                </div>
                <h5 class="fw-bold mb-2 text-warning-emphasis" style="font-size: 18px;">Bạn sắp mở một liên kết ngoài!</h5>
                <p class="text-secondary mb-3" style="font-size: 15px; line-height: 1.6;">
                    Việc mở ChatGPT, Gemini hoặc liên kết khác sẽ chuyển bạn sang Tab mới. Bạn có chắc chắn muốn mở không?
                </p>
            </div>
            <div class="modal-footer border-0 d-flex justify-content-center gap-2 pb-4 bg-light">
                <button type="button" class="btn btn-light fw-bold px-4 py-2" style="border-radius: 50px; border: 1.5px solid #cbd5e1;" data-bs-dismiss="modal">Hủy, ở lại học</button>
                <button type="button" class="btn text-white fw-bold px-4 py-2" id="btnConfirmOpenLink" style="background-color: #f59e0b; border-radius: 50px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);">
                    <i class="fa-solid fa-check me-1"></i> Đồng ý mở
                </button>
            </div>
        </div>
    </div>
</div>`;

// 2. Bảng 2: Cảnh báo khi bấm nút X đóng bài học
const closeWarningModalHtml = `
<div class="modal fade" id="closeWarningModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" style="z-index: 10600;">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
            <div class="modal-header text-white" style="background-color: #f59e0b;">
                <h6 class="modal-title fw-bold text-uppercase"><i class="fa-solid fa-triangle-exclamation fa-fade me-2"></i>Cảnh Báo Đóng Bài Học</h6>
            </div>
            <div class="modal-body p-4 text-center">
                <div class="mb-3">
                    <div class="mx-auto d-flex align-items-center justify-content-center rounded-circle" style="width: 70px; height: 70px; background-color: #fef3c7; color: #f59e0b; font-size: 32px;">
                        <i class="fa-solid fa-circle-xmark"></i>
                    </div>
                </div>
                <h5 class="fw-bold mb-2 text-warning-emphasis" style="font-size: 18px;">Bạn muốn kết thúc bài học?</h5>
                <p class="text-secondary mb-3" style="font-size: 15px; line-height: 1.6;">
                    Đồng hồ hẹn giờ vẫn đang chạy. Việc đóng tài liệu này sẽ làm gián đoạn quá trình học tập. Bạn có chắc chắn muốn đóng không?
                </p>
            </div>
            <div class="modal-footer border-0 d-flex justify-content-center gap-2 pb-4 bg-light">
                <button type="button" class="btn btn-light fw-bold px-4 py-2" style="border-radius: 50px; border: 1.5px solid #cbd5e1;" data-bs-dismiss="modal">Hủy, ở lại học</button>
                <button type="button" class="btn text-white fw-bold px-4 py-2" id="btnConfirmCloseLesson" style="background-color: #f59e0b; border-radius: 50px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);">
                    <i class="fa-solid fa-check me-1"></i> Đồng ý đóng
                </button>
            </div>
        </div>
    </div>
</div>`;

// 3. Bảng 3: Bắt quả tang khi lén sang tab khác và quay về
const returnStudyModalHtml = `
<div class="modal fade" id="returnStudyModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" style="z-index: 10605;">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
            <div class="modal-header text-white" style="background-color: #e61d4a;">
                <h6 class="modal-title fw-bold text-uppercase"><i class="fa-solid fa-bell fa-shake me-2"></i>Hệ thống ghi nhận</h6>
            </div>
            <div class="modal-body p-4 text-center">
                <div class="mb-3">
                    <div class="mx-auto d-flex align-items-center justify-content-center rounded-circle" style="width: 70px; height: 70px; background-color: #fff1f2; color: #e61d4a; font-size: 32px;">
                        <i class="fa-solid fa-person-walking-arrow-right"></i>
                    </div>
                </div>
                <h5 class="fw-bold mb-2 text-danger" style="font-size: 18px;">Bạn vừa rời khỏi bài học!</h5>
                <p class="text-secondary mb-3" style="font-size: 15px; line-height: 1.6;">
                    Hệ thống nhận thấy bạn đã bấm sang mục khác. Vui lòng nhấn xác nhận để bung toàn màn hình và tiếp tục học tập.
                </p>
            </div>
           <div class="modal-footer border-0 d-flex justify-content-center gap-2 pb-4 bg-light flex-wrap">
   <button type="button" class="btn btn-light fw-bold px-4 py-2" style="border-radius: 50px; border: 1.5px solid #cbd5e1;" id="btnCancelStudy">Kết thúc bài </button>
    <!-- Lựa chọn mới: Thoát tạm thời -->
    <button type="button" class="btn btn-warning fw-bold px-4 py-2 text-dark" id="btnTempExitFullscreen" style="border-radius: 50px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);">
        <i class="fa-solid fa-compress me-1"></i> Thoát tạm thời
    </button>

    <button type="button" class="btn text-white fw-bold px-4 py-2" id="btnResumeStudy" style="background-color: #0f4c81; border-radius: 50px; box-shadow: 0 4px 12px rgba(15, 76, 129, 0.25);">
        <i class="fa-solid fa-expand me-1"></i> Tiếp tục học
    </button>
</div>
        </div>
    </div>
</div>`;

$('body').append(linkWarningModalHtml).append(closeWarningModalHtml).append(returnStudyModalHtml);

// 4. Hàm tiện ích Toàn Màn Hình
function isTimerActive() {
    let targetStr = localStorage.getItem('user_countdown_target');
    return targetStr && parseInt(targetStr) > Date.now();
}

function enterFullScreen() {
    let elem = document.documentElement;
    if (elem.requestFullscreen) { elem.requestFullscreen().catch(e => {}); } 
    else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen().catch(e => {}); }
}

function exitFullScreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) { document.exitFullscreen().catch(e => {}); } 
        else if (document.webkitExitFullscreen) { document.webkitExitFullscreen().catch(e => {}); }
    }
}

// 5. KÍCH HOẠT FULL SCREEN TỰ ĐỘNG KHI MỞ BÀI HỌC
if (typeof window.openDocumentViewer !== 'undefined') {
    const originalOpenDocumentViewer = window.openDocumentViewer;
    window.openDocumentViewer = function(url, title) {
        originalOpenDocumentViewer(url, title);
        if (isTimerActive()) {
            isEnforcedFullscreen = true;
            allowLessonClose = false; // Reset cờ chặn đóng
            enterFullScreen();
        }
    };
}

$(document).ready(function() {
    // --- NÚT ĐỒNG Ý MỞ LINK CHATGPT/GEMINI ---
    $('#btnConfirmOpenLink').on('click', function() {
        $('#linkWarningModal').modal('hide');
        if (pendingUrlToOpen) {
            window.open(pendingUrlToOpen, '_blank');
            pendingUrlToOpen = "";
        }
    });

    // --- NÚT ĐỒNG Ý ĐÓNG BÀI HỌC (KHI BẤM NÚT X) ---
    $('#btnConfirmCloseLesson').on('click', function() {
        $('#closeWarningModal').modal('hide');
        allowLessonClose = true; // Mở khóa cho phép đóng Iframe
        $('#documentViewerModal').modal('hide'); // Đóng iframe bài học thành công
    });

    // --- NÚT QUAY LẠI HỌC (BUNG FULL MÀN HÌNH SAU KHI LÉN CHUYỂN TAB) ---
    $('#btnResumeStudy').on('click', function() {
        $('#returnStudyModal').modal('hide');
        enterFullScreen();
    });

    // --- NÚT KẾT THÚC BÀI HỌC (KHI BỊ BẮT QUẢ TANG MẤT TẬP TRUNG) ---
    $('#btnCancelStudy').on('click', function() {
        $('#returnStudyModal').modal('hide');
        isEnforcedFullscreen = false;
        exitFullScreen();
        
        allowLessonClose = true; // Cho phép đóng iframe
        $('#documentViewerModal').modal('hide'); 
    });
// --- NÚT THOÁT TẠM THỜI (VẪN HỌC Ở CHẾ ĐỘ CỬA SỔ) ---
    $('#btnTempExitFullscreen').on('click', function() {
        // Chỉ đóng bảng cảnh báo, không kích hoạt lại Fullscreen
        $('#returnStudyModal').modal('hide');
        
        // Tắt âm thanh cảnh báo (nếu có đang phát lỡ dở)
        if (typeof warningExitSound !== 'undefined') {
            warningExitSound.pause();
            warningExitSound.currentTime = 0;
        }

        // LƯU Ý BÍ QUYẾT: KHÔNG gán isEnforcedFullscreen = false
        // Nhờ vậy hệ thống vẫn giám sát, nếu sinh viên ấn chuyển sang Tab khác 
        // rồi quay lại Web, hệ thống vẫn sẽ hiện lại bảng cảnh báo này!
    });
    // ========================================================
    // ĐÁNH CHẶN NÚT ĐÓNG IFRAME (NÚT X HOẶC CLICK RA NGOÀI)
    // ========================================================
    $('#documentViewerModal').on('hide.bs.modal', function (e) {
        // Nếu hẹn giờ đang chạy và Cờ cho phép đóng chưa mở -> Chặn lệnh đóng!
        if (isEnforcedFullscreen && isTimerActive() && !allowLessonClose) {
            e.preventDefault(); // Lệnh này chặn Iframe không bị đóng
            $('#closeWarningModal').modal('show'); // Đẩy bảng cảnh báo Vàng lên
        }
    });

    // Khi iframe đã đóng thực sự thành công
    $('#documentViewerModal').on('hidden.bs.modal', function () {
        isEnforcedFullscreen = false;
        allowLessonClose = false; // Khóa lại cho lần sau
        exitFullScreen();
    });

    // 6. ĐÁNH CHẶN CLICK VÀO LINK CHATGPT, GEMINI
   $('#documentViewerModal').on('click', 'a[target="_blank"], button#btnOpenInNewTab', function(e) {
        if (isEnforcedFullscreen && isTimerActive()) {
            e.preventDefault(); // Chặn tức thì
            
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
    
    // 7. ĐÁNH CHẶN CLICK CHUYỂN MENU BÊN TRONG WEB
$(document).on('click', 'a, button, .btn-course', function(e) {
        if (isEnforcedFullscreen && isTimerActive()) {
            // FIX LỖI: Bổ sung "#sidebarCodeViewerModal" vào danh sách "Vùng an toàn" để không bị cảnh báo
            if ($(this).closest('#documentViewerModal, #linkWarningModal, #closeWarningModal, #returnStudyModal, #sidebarCodeViewerModal').length > 0) return; 

            e.preventDefault();
            e.stopImmediatePropagation();
            $('#returnStudyModal').modal('show'); // Hiện bảng bắt quay lại
            return false;
        }
    });
});

// 8. XỬ LÝ KHI SINH VIÊN LÉN SANG TAB TRÌNH DUYỆT KHÁC
document.addEventListener("visibilitychange", function() {
    if (!isEnforcedFullscreen || !isTimerActive()) return;

    if (document.hidden) {
        // Rời tab -> Trình duyệt tự tắt Full màn hình, ta cắm cờ
        exitFullScreen();
        localStorage.setItem('tab_switched_during_study', 'true');
        
        // Phát một tiếng "Bíp" duy nhất để nhắc nhở
        if (typeof warningExitSound !== 'undefined') {
            warningExitSound.currentTime = 0; // Trả nhạc về đầu
            warningExitSound.play().catch(err => console.log("Lỗi phát âm thanh:", err));
        }

    } else {
        // Quay lại tab -> Hiện bảng bắt nhấn nút để bung toàn màn hình
        if (localStorage.getItem('tab_switched_during_study') === 'true') {
            localStorage.removeItem('tab_switched_during_study');
            
            // Đảm bảo chắc chắn tắt mọi âm thanh đang phát lỡ dở
            if (typeof warningExitSound !== 'undefined') {
                warningExitSound.pause();
                warningExitSound.currentTime = 0;
            }

            setTimeout(() => {
                $('#returnStudyModal').modal('show');
            }, 300);
        }
    }
});

// 9. GỠ BỎ MỌI RÀNG BUỘC KHI TẮT HẸN GIỜ BẰNG TAY HOẶC HẾT GIỜ
if (typeof window.cancelUserCountdown !== 'undefined') {
    const originalCancelUserCountdown = window.cancelUserCountdown;
    window.cancelUserCountdown = function() {
        originalCancelUserCountdown();
        
        isEnforcedFullscreen = false;
        allowLessonClose = true; // Mở khóa
        
        exitFullScreen();
        $('#returnStudyModal').modal('hide');
        $('#linkWarningModal').modal('hide');
        $('#closeWarningModal').modal('hide');
    };
}
// Khai báo biến âm thanh (link âm thanh chuông báo chuẩn, nhẹ nhàng)
let alarmSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
alarmSound.loop = true; // Cho phép chuông reo liên tục đến khi sinh viên tắt

function triggerTimeUpAlert() {
    let timerModalElement = document.getElementById('timerExpiredModal');
    if (timerModalElement) {
        let timerModal = new bootstrap.Modal(timerModalElement);
        timerModal.show();
        
        // Bật chuông báo thức khi hiện bảng (có catch lỗi nếu trình duyệt chặn tự động phát âm)
        alarmSound.play().catch(function(e) {
            console.log("Trình duyệt chặn tự động phát âm thanh. Hãy tương tác với trang web trước.");
        });
    }
}

// Hàm được gọi khi nhấn nút "Đã rõ" để tắt nhạc báo thức
function stopAlarmSound() {
    alarmSound.pause();
    alarmSound.currentTime = 0; // Đưa bản nhạc về lại thời gian đầu
}

// ========================================================
// CÁC HÀM XỬ LÝ SIDEBAR CÔNG CỤ TRONG IFRAME
// ========================================================

window.toggleIframeSidebar = function() {
    let sidebar = $('#iframeSidebar');
    if (sidebar.hasClass('d-none')) {
        sidebar.removeClass('d-none').addClass('d-flex');
        
        // Khởi tạo TinyMCE tối giản
        if (!tinymce.get('sidebarNoteEditor')) {
            tinymce.init({
                selector: '#sidebarNoteEditor',
                height: 400, // <--- SỬA '100%' THÀNH 400 CỐ ĐỊNH Ở ĐÂY
                menubar: false,
                statusbar: false, 
                plugins: 'lists link textcolor colorpicker',
                toolbar: 'bold italic underline | forecolor backcolor | bullist numlist',
                branding: false,
                setup: function (editor) {
                    editor.on('change', function () {
                        editor.save();
                    });
                }
            });
        }
        
        if (typeof loadSidebarCodeSnippets === 'function') loadSidebarCodeSnippets();
        
    } else {
        sidebar.removeClass('d-flex').addClass('d-none');
    }
};

// 1. Cập nhật Tiến độ từ trong bảng Sidebar
window.updateSidebarProgress = function(selectEl) {
    let sheetName = $('#iframeSidebar').attr('data-sheet') || currentSheetName;
    let stableKey = $('#iframeSidebar').attr('data-key');
    
    if (!sheetName || !stableKey) {
        alert("Lỗi: Không xác định được bài học!"); return;
    }
    
    let val = $(selectEl).val();
    $(selectEl).css('background-color', getProgressColor(val));
    
    let mssv = (currentUser && currentUser.mssv) ? currentUser.mssv : 'guest';
    localStorage.setItem(`prog_${mssv}_${sheetName}_${stableKey}`, val);
    
    // Đồng bộ ngược ra thẻ Select ở Bảng bên ngoài trang chủ
    let outerSelect = $(`select[onchange*="'${stableKey}'"]`);
    if(outerSelect.length) {
        outerSelect.val(val).css('background-color', getProgressColor(val));
    }
    
    if (typeof syncLearningDataToServer === 'function') syncLearningDataToServer();
};

// 2. Lưu Ghi chú từ trong bảng Sidebar
window.saveSidebarNote = function() {
    let sheetName = $('#iframeSidebar').attr('data-sheet') || currentSheetName;
    let stableKey = $('#iframeSidebar').attr('data-key');
    
    if (!sheetName || !stableKey) {
        alert("Lỗi: Không xác định được bài học để lưu ghi chú!"); return;
    }
    
    let content = "";
    if (tinymce.get('sidebarNoteEditor')) {
        content = tinymce.get('sidebarNoteEditor').getContent().trim();
    } else {
        content = $('#sidebarNoteEditor').val().trim();
    }
    
    let mssv = (currentUser && currentUser.mssv) ? currentUser.mssv : 'guest';
    let now = new Date();
    let pad = (n) => String(n).padStart(2, '0');
    let timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    
    let btnNote = $(`#btnNote_${stableKey}`); // Nút note ở bảng bên ngoài
    
    if (content && content !== "<p></p>" && content !== "") {
        let noteData = { content: content, updatedAt: timeStr };
        localStorage.setItem(`note_${mssv}_${sheetName}_${stableKey}`, JSON.stringify(noteData));
        
        $('#sidebarNoteStatus').html(`<i class="fa-solid fa-check me-1"></i>Đã lưu`).removeClass('text-danger').addClass('text-success');
        
        // Đổi màu nút Note bên ngoài thành Xanh (Đã có note)
        if(btnNote.length) {
            btnNote.removeClass('btn-outline-secondary bg-white').addClass('btn-primary text-white').html('<i class="fa-solid fa-clipboard-check fs-6"></i>').attr('title', 'Xem ghi chú');
        }
    } else {
        // Nếu xóa hết chữ thì xóa luôn cache
        localStorage.removeItem(`note_${mssv}_${sheetName}_${stableKey}`);
        $('#sidebarNoteStatus').html(`<i class="fa-solid fa-trash me-1"></i>Đã xóa`).removeClass('text-success').addClass('text-danger');
        
        // Đổi màu nút Note bên ngoài thành Trắng (Chưa có note)
        if(btnNote.length) {
            btnNote.removeClass('btn-primary text-white').addClass('btn-outline-secondary bg-white').html('<i class="fa-regular fa-clipboard fs-6"></i>').attr('title', 'Thêm ghi chú');
        }
    }
    
    setTimeout(() => $('#sidebarNoteStatus').html(''), 3000);
    if (typeof syncLearningDataToServer === 'function') syncLearningDataToServer();
};

// 3. Hàm mở tài liệu (Sửa lại để truyền ĐÚNG data-sheet và data-key vào Sidebar)
window.openDocumentViewer = function(url, title, sheetName, stableKey) {
    if (url.includes('test.upcoder.xyz') || url.includes('upcoder.xyz')) {
        window.open(url, '_blank');
        return; 
    }

    let embedUrl = url;
    if (url.includes('drive.google.com/file/d/')) {
        embedUrl = url.replace(/\/view.*$/, '/preview');
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
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
            let currentOrigin = window.location.origin !== "null" ? window.location.origin : "";
            embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1${currentOrigin ? '&origin=' + encodeURIComponent(currentOrigin) : ''}`;
        }
    }
    
    let cleanTitle = $('<div>').html(title).text();
    $('#docViewerTitle').html(`<i class="fa-solid fa-file-lines me-2"></i> ${cleanTitle || 'Xem tài liệu'}`);
    
    if (currentUser && (currentUser.mssv === "51.01.108.008" || currentUser.mssv === "5101108008")) {
        $('#btnOpenInNewTab').removeClass('d-none').off('click').on('click', function() { window.open(url, '_blank'); });
    } else {
        $('#btnOpenInNewTab').addClass('d-none');
    }
    
    // --- GẮN DỮ LIỆU ĐỊNH DANH VÀO SIDEBAR ---
    // (Bắt buộc phải có đoạn này thì khi bấm "Lưu", hệ thống mới biết đang lưu cho bài nào)
    if (sheetName && stableKey) {
        $('#iframeSidebar').attr('data-sheet', sheetName).attr('data-key', stableKey);
        let mssv = (currentUser && currentUser.mssv) ? currentUser.mssv : 'guest';
        
        // 1. Nạp lại Tiến độ đã lưu từ máy
        let progVal = localStorage.getItem(`prog_${mssv}_${sheetName}_${stableKey}`) || 'white';
        $('#sidebarProgressSelect').val(progVal).css('background-color', getProgressColor(progVal));
        
        // 2. Nạp lại Ghi chú đã lưu từ máy
        let noteData = JSON.parse(localStorage.getItem(`note_${mssv}_${sheetName}_${stableKey}`));
        let content = noteData && noteData.content ? noteData.content : '';
        
        if (tinymce.get('sidebarNoteEditor')) {
            tinymce.get('sidebarNoteEditor').setContent(content);
        } else {
            $('#sidebarNoteEditor').val(content);
        }
    } else {
        // Rỗng nếu không truyền tham số
        $('#iframeSidebar').removeAttr('data-sheet').removeAttr('data-key');
    }

    $('#docLoading').show(); 
    $('#docViewerIframe').attr('src', embedUrl);
    $('#documentViewerModal').modal('show');
if (typeof isTimerActive === 'function' && isTimerActive()) {
        // Delay 150ms để né Event Bubbling gây lỗi hiện bảng đỏ tức thì
        setTimeout(() => {
            isEnforcedFullscreen = true;
            allowLessonClose = false; // Khóa chốt chặn đóng Iframe
        }, 150);
        if (typeof enterFullScreen === 'function') enterFullScreen();
    }
};

// Biến lưu trữ Toàn bộ mã nguồn trên RAM
window.allSidebarSnippets = [];
window.sidebarCodeCache = [];


// 2. LỌC SIÊU TỐC TRONG RAM: Không gọi AJAX nữa, gõ tới đâu là hiện tức thì tới đó
window.searchSidebarCode = function() {
    let maBaiSearch = $('#txtSidebarSearchCode').val().trim().toLowerCase();
    let container = $('#sidebarCodeList');

    if (!maBaiSearch) {
        container.html(`
            <div class="text-muted small text-center py-4">
                <i class="fa-solid fa-magnifying-glass fs-3 mb-2 d-block text-secondary" style="opacity: 0.5;"></i>
                Nhập từ khóa mã bài để tìm kiếm...
            </div>
        `);
        return;
    }

    // Bộ lọc siêu tốc .includes() tìm kiếm tương đối
    window.sidebarCodeCache = window.allSidebarSnippets.filter(item => item.maBai.toLowerCase().includes(maBaiSearch));

    let html = '';
    if (window.sidebarCodeCache.length > 0) {
        window.sidebarCodeCache.forEach((item, idx) => {
            let badgeHtml = item.isMine ? `<span class="badge bg-success shadow-sm ms-1" style="font-size: 10px;"><i class="fa-solid fa-user-check me-1"></i>Của bạn</span>` : ``;
            let borderLeftColor = item.isMine ? '#22c55e' : '#0ea5e9'; 

            html += `
            <div class="d-flex justify-content-between align-items-center p-2 mb-2 bg-white shadow-sm" style="border: 1px solid #cbd5e1; border-left: 3px solid ${borderLeftColor}; border-radius: 6px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#f1f5f9';" onmouseout="this.style.background='#ffffff';" onclick="openSidebarCodeViewer(${idx})">
                <div class="text-truncate" style="max-width: 80%;">
                    <strong style="font-size: 13px; color: #1e293b;">${item.maBai} ${badgeHtml}</strong><br>
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

// 1. TẢI NGẦM 1 LẦN (Đã cập nhật để lấy Bình luận)
window.loadSidebarCodeSnippets = function() {
    let courseName = $('#iframeSidebar').attr('data-sheet') || currentSheetName;
    if (!courseName) return;

    $('#txtSidebarSearchCode').val('');
    let container = $('#sidebarCodeList');
    container.html('<div class="text-center text-muted small py-4"><i class="fa-solid fa-spinner fa-spin fs-3 mb-2 d-block text-secondary"></i>Đang tải dữ liệu bộ nhớ...</div>');

    $.ajax({
        url: SCRIPT_URL + "?action=getShareCodeData",
        method: "GET",
        dataType: "json",
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
                        let theoryPart = "";
                        let codePart = "";
                        let langMatch = "cpp";

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

                        // LẤY NỘI DUNG BÌNH LUẬN VÀ ROW INDEX
                        let answerText = row[3] || ''; 
                        let rowIndex = row[6];

                        if (codePart || theoryPart) {
                            let codeObj = {
                                maBai: maBai,
                                theory: theoryPart,
                                code: codePart,
                                lang: langMatch,
                                author: authorName,
                                isMine: isMyCode,
                                answer: answerText, // Truyền bình luận vào
                                rowIndex: rowIndex  // Vị trí hàng để xuất giao diện
                            };
                            if (isMyCode) myCodes.push(codeObj);
                            else otherCodes.push(codeObj);
                        }
                    }
                });
            }

            window.allSidebarSnippets = myCodes.concat(otherCodes);
            
            container.html(`
                <div class="text-muted small text-center py-4">
                    <i class="fa-solid fa-magnifying-glass fs-3 mb-2 d-block text-secondary" style="opacity: 0.5;"></i>
                    Hệ thống đã sẵn sàng.<br>Nhập mã bài (VD: B01) để tìm kiếm...
                </div>
            `);
        },
        error: function() {
            container.html('<div class="text-danger small text-center py-2"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi kết nối máy chủ!</div>');
        }
    });
};

// 2. MỞ BẢNG HIỂN THỊ (Gộp Lý thuyết, Code & Bình luận)
window.openSidebarCodeViewer = function(index) {
    let item = window.sidebarCodeCache[index];
    if (!item) return;

    let badgeHtml = item.isMine ? `<span class="badge bg-success ms-2" style="font-size:11px; font-weight:normal;">Của bạn</span>` : `<span class="badge bg-secondary ms-2" style="font-size:11px; font-weight:normal;">${item.author}</span>`;
    $('#sidebarCodeViewerTitle').html(`<i class="fa-solid fa-file-code me-2"></i> ${item.maBai} ${badgeHtml}`);
    
    // Khung hiển thị Lý thuyết
    let theoryBox = $('#sidebarTheoryViewerContent');
    if (item.theory && item.theory.trim() !== "") {
        let formattedTheory = item.theory;
        if (!/(<p>|<table>|<ul>|<li>|<div>|<br\s*\/?>)/i.test(formattedTheory)) {
            formattedTheory = formattedTheory.replace(/\n/g, '<br>');
        } else {
            formattedTheory = formattedTheory.replace(/\n/g, ' '); 
        }
        formattedTheory = formattedTheory.replace(/(<p>&nbsp;<\/p>|<p><\/p>)/gi, '').trim();

        theoryBox.html(`<div class="fw-bold text-success mb-2"><i class="fa-solid fa-align-left me-1"></i> Lý thuyết / Phân tích:</div>${formattedTheory}`).removeClass('d-none');
    } else {
        theoryBox.addClass('d-none').html('');
    }

    // Khung hiển thị Code
    let codeWrapper = $('#sidebarCodeWrapper');
    let btnCopy = $('#btnSidebarCopyCode');
    
    if (item.code && item.code.trim() !== "") {
        let escapedCode = item.code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        let codeElem = $('#sidebarCodeViewerContent');
        codeElem.removeClass().addClass(`language-${item.lang}`);
        codeElem.html(escapedCode);
        
        codeWrapper.removeClass('d-none');
        btnCopy.removeClass('d-none'); 
        
        if (window.Prism) {
            Prism.highlightElement(document.getElementById('sidebarCodeViewerContent'));
        }
    } else {
        codeWrapper.addClass('d-none');
        btnCopy.addClass('d-none'); 
    }

    // XỬ LÝ HIỂN THỊ BÌNH LUẬN
    // XỬ LÝ HIỂN THỊ BÌNH LUẬN (Đã nâng cấp)
    let commentsWrapper = $('#sidebarCommentsWrapper');
    let commentsContent = $('#sidebarCommentsContent');

    if (item.answer && item.answer.trim() !== "") {
        // Dùng hàm parseThread có sẵn của hệ thống để vẽ các cuộc hội thoại
        let threadHtml = parseThread(item.answer, item.rowIndex);
        commentsContent.html(threadHtml);
    } else {
        commentsContent.html('<div class="text-muted small italic text-center py-2" id="emptySidebarComments"><i class="fa-regular fa-comment-slash fs-4 mb-2 d-block"></i> Chưa có bình luận / góp ý nào.</div>');
    }
    
    // Gán dữ liệu cho khung soạn thảo bình luận
    $('#sidebarReplyRowIndex').val(item.rowIndex);
    $('#txtSidebarReply').val(''); 
    commentsWrapper.removeClass('d-none'); // Luôn hiện khu vực bình luận để cho phép nhập mới

    $('#sidebarCodeViewerModal').modal('show');
    
    if (typeof applyKaTeX === 'function') {
        setTimeout(() => applyKaTeX('sidebarTheoryViewerContent'), 100);
    }
};
window.copySidebarCode = function(btnElement) {
    let codeText = $('#sidebarCodeViewerContent').text();
    navigator.clipboard.writeText(codeText).then(() => {
        let originalHtml = $(btnElement).html();
        $(btnElement).html('<i class="fa-solid fa-check"></i> Đã Copy').css({'background-color': '#10b981', 'color': '#ffffff', 'border-color': '#10b981'});
        setTimeout(() => {
            $(btnElement).html(originalHtml).css({'background-color': '#f8fafc', 'color': '#0f4c81', 'border-color': '#cbd5e1'});
        }, 2000);
    });
};
// Hàm Gửi Bình luận từ bảng Code Sidebar
window.sendSidebarCodeReply = function() {
    let rowIndex = $('#sidebarReplyRowIndex').val();
    let replyText = $('#txtSidebarReply').val().trim();
    
    if (!replyText) {
        alert("Vui lòng nhập nội dung bình luận / phản hồi!");
        $('#txtSidebarReply').focus();
        return;
    }

    // Xử lý lấy MSSV người dùng
    let studentMssv = "Khách";
    try {
        let currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser && currentUser.mssv) {
            studentMssv = currentUser.mssv;
        }
    } catch (e) {}

    if (!studentMssv || studentMssv === "Khách") {
        alert("Vui lòng đăng nhập để bình luận!");
        return;
    }

    // Khởi tạo thời gian hiện tại
    let now = new Date();
    let pad = (n) => String(n).padStart(2, '0');
    let timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    let formattedReply = `${studentMssv}:::${timeStr}:::${replyText}`;

    let btn = $('#btnSendSidebarReply');
    let originalHtml = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin me-1"></i>Đang gửi...').prop('disabled', true);

    postToGAS({
        action: "replyToShareCode",
        rowIndex: rowIndex,
        replyText: formattedReply
    }, function(response) {
        alert("Đã gửi bình luận thành công!");
        $('#txtSidebarReply').val('');
        btn.html(originalHtml).prop('disabled', false);

        // Bổ sung HTML giả lập vào giao diện để sinh viên thấy tin nhắn vừa gửi ngay lập tức
        let tempName = (typeof currentUser !== 'undefined' && currentUser) ? getNaturalShortName(currentUser.name) : "Sinh viên";
        let tempMssv = maskMSSV(studentMssv);
        
        // Hỗ trợ hiển thị Markdown/Code nếu sinh viên có gõ
        let formattedContent = formatCodeBlocks(replyText);
        if (!/(<p>|<table>|<ul>|<li>|<div>|<br\s*\/?>)/i.test(formattedContent)) {
            formattedContent = formattedContent.replace(/\n/g, '<br>');
        }

        let newCommentHtml = `<div class="msg-sv"><i class="fa-solid fa-user-graduate me-2"></i><strong>Sinh viên (${tempMssv} - ${tempName} (Bạn))</strong><span class="text-muted ms-2" style="font-size: 12.5px; font-weight: normal;"><i class="fa-regular fa-clock"></i> ${timeStr}</span>:<br>${formattedContent}</div>`;

        if ($('#emptySidebarComments').length) {
            $('#sidebarCommentsContent').html(newCommentHtml);
        } else {
            $('#sidebarCommentsContent').append(newCommentHtml);
        }

        // Đồng bộ cập nhật thẳng vào RAM để lần sau bấm mở lên vẫn thấy bình luận
        let item = window.sidebarCodeCache.find(i => i.rowIndex == rowIndex);
        if (item) {
            item.answer = item.answer ? item.answer + "\n\n[SV]" + formattedReply + "[/SV]" : "[SV]" + formattedReply + "[/SV]";
        }
        
    }, function() {
        alert("Có lỗi xảy ra khi kết nối máy chủ để gửi bình luận.");
        btn.html(originalHtml).prop('disabled', false);
    });
};

// Hàm chuyển đổi trạng thái Tạm ngưng / Tiếp tục
// Hàm chuyển đổi trạng thái Tạm ngưng / Tiếp tục
window.togglePauseUserCountdown = function() {
    let targetStr = localStorage.getItem('user_countdown_target');
    let pausedStr = localStorage.getItem('user_countdown_paused_remaining');
    
    if (pausedStr) {
        // ĐANG TẠM NGƯNG -> BẤM TIẾP TỤC ĐẾM
        let remaining = parseInt(pausedStr);
        localStorage.setItem('user_countdown_target', (Date.now() + remaining).toString());
        localStorage.removeItem('user_countdown_paused_remaining');
        updateCountdownUI();

        // [TÍNH NĂNG MỚI] Kiểm tra nếu đang mở iframe Tài liệu hoặc Latex thì tự động bung Full màn hình lại
        if ($('#documentViewerModal').is(':visible') || $('#latexViewerModal').is(':visible')) {
            isEnforcedFullscreen = true; // Bật cờ ép buộc toàn màn hình
            allowLessonClose = false;    // Khóa nút đóng bài
            if (typeof enterFullScreen === 'function') enterFullScreen();
        }

    } else if (targetStr) {
        // ĐANG CHẠY -> BẤM TẠM NGƯNG
        let targetTime = parseInt(targetStr);
        let remaining = targetTime - Date.now();
        
        if (remaining > 0) {
            localStorage.setItem('user_countdown_paused_remaining', remaining.toString());
            localStorage.removeItem('user_countdown_target');
            if (userCountdownInterval) clearInterval(userCountdownInterval);
            updatePausedUI(remaining);
            
            // [TÙY CHỌN THÊM] Khi tạm ngưng, cho phép thoát full màn hình để sinh viên nghỉ ngơi
            if (typeof exitFullScreen === 'function') {
                exitFullScreen();
            }
        }
    }
};
// Hàm cập nhật giao diện tĩnh khi đang bị tạm ngưng
function updatePausedUI(remaining) {
    $('.btn-countdown-pause i').removeClass('fa-pause').addClass('fa-play');
    $('.fa-stopwatch').removeClass('fa-spin-slow'); // Dừng xoay đồng hồ

    let distance = remaining;
    let hours = Math.floor(distance / (1000 * 60 * 60));
    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((distance % (1000 * 60)) / 1000);
    let pad = n => String(n).padStart(2, '0');
    let displayStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    
    // Cập nhật text cho cả 3 đồng hồ
    $('#lblCountdownClock, #lblViewerCountdownClock, #lblLatexCountdownClock').text(displayStr);
}

// Hàm mở file HTML trực tiếp thay vì Modal
window.openCustomHtml = function(fileUrl, title) {
    // 1. Giấu bảng bài học đi
    $('#courseSection').addClass('d-none');
    
    // 2. Hiện khung chứa HTML
    $('#customHtmlSection').removeClass('d-none');
    $('#customHtmlTitle').html(`<i class="fa-solid fa-file-code me-2"></i> ${title}`);
    
    // 3. Xử lý đường dẫn tiếng Việt an toàn cho GitHub
    let safeFileUrl = fileUrl.trim().split('/').map(part => encodeURIComponent(part)).join('/');
    
    // 4. Tạo Iframe (chiều cao động theo khung hình) và gắn sự kiện tải xong
    $('#customHtmlContent').html(`
        <iframe id="iframeCustomDoc" 
                src="${safeFileUrl}" 
                style="width: 100%; height: 75vh; border: none; border-radius: 8px;" 
                allowfullscreen>
        </iframe>
    `);
    
    // 5. Cấp cứu dữ liệu Đăng nhập (Truyền tài khoản từ web mẹ xuống web con)
    let iframeEl = document.getElementById('iframeCustomDoc');
    iframeEl.onload = function() {
        try {
            // Khi iframe tải xong, truyền biến currentUser (nếu có) xuống cho iframe
            if (typeof currentUser !== 'undefined' && currentUser) {
                // Set localStorage dùng chung cùng tên miền (phòng hờ)
                iframeEl.contentWindow.localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Cố gắng gọi hàm refresh hoặc login tự động bên trong iframe (nếu có)
                if (typeof iframeEl.contentWindow.autoLoginFromParent === 'function') {
                    iframeEl.contentWindow.autoLoginFromParent(currentUser);
                }
            }
        } catch(e) {
            console.log("Cảnh báo: Iframe chặn giao tiếp DOM chéo (do khác domain hoặc chạy local).", e);
        }
    };
};

window.openDirectWeb = function(safeFileUrl, title) {
    // --- FIX LỖI: Bắt quả tang Đồng hồ đang chạy thì ép dùng Iframe ---
    if (typeof isTimerActive === 'function' && isTimerActive()) {
        if(window.innerWidth < 992) { 
            $('#sidebarMenu').removeClass('show'); 
            $('#sidebarOverlay').removeClass('show'); 
        }
        if (typeof openDocumentViewer === 'function') {
            openDocumentViewer(safeFileUrl, title); 
            return; 
        }
    }

    // 1. Ẩn toàn bộ hệ thống gốc để dọn đường
    $('#sidebarMenu').addClass('d-none');
    $('#courseSection').addClass('d-none');
    
    let fullScreenContainer = $('#customHtmlSection');
    
    // 2. Ép khung bao phủ toàn màn hình, không trừa 1px nào
    fullScreenContainer.removeClass('d-none').css({
        'position': 'fixed',
        'top': '0',
        'left': '0',
        'width': '100vw',
        'height': '100vh',
        'z-index': '9999',
        'background': '#ffffff',
        'padding': '0',
        'margin': '0',
        'display': 'flex',
        'flex-direction': 'column' 
    });
    
    // 3. Thanh Header thu nhỏ tối đa, DÍNH CHẶT lên mép trên và XÓA LỀ DƯỚI
    let headerEl = fullScreenContainer.find('header.top-header');
    
    // Xóa class margin mặc định của Bootstrap
    headerEl.removeClass('d-none mb-4').css({
        'display': 'flex',
        'align-items': 'center',
        'justify-content': 'flex-start',
        'gap': '15px',
        'padding': '0 20px',
        'background-color': '#0f4c81', 
        'color': '#ffffff',
        'height': '46px',        
        'flex-shrink': '0',      
        'width': '100%',
        'border': 'none',        
        'border-radius': '0',
        'box-shadow': '0 2px 5px rgba(0,0,0,0.1)',
        'margin': '0' // Xóa mọi lề
    }).html(`
        <button onclick="backToCourseTable()" class="btn btn-light fw-bold shadow-sm d-flex align-items-center gap-2" style="border-radius: 50px; padding: 4px 14px; font-size: 13px; border: none; background: #ffffff; color: #0f4c81; cursor: pointer;">
            <i class="fa-solid fa-arrow-left"></i> Trở lại
        </button>
        <h6 class="m-0 fw-bold text-white text-truncate" style="font-size: 14px; letter-spacing: 0.5px;">
            <i class="fa-solid fa-globe me-2"></i>${title}
        </h6>
    `);

    $('#btnFloatingBack').remove();

    // 4. Khung Iframe hiển thị Web nương theo Flexbox, lấp đầy chỗ trống còn lại
    $('#customHtmlContent').removeClass('bg-white rounded border shadow-sm p-3 p-md-4').css({
        'flex-grow': '1',        
        'width': '100%',
        'max-width': 'none',
        'padding': '0',
        'margin': '0',
        'border': 'none',
        'border-radius': '0',
        'box-shadow': 'none',
        'background': '#ffffff',
        'box-sizing': 'border-box'
    }).html(`
        <iframe src="${safeFileUrl}" 
                style="width: 100%; height: 100%; border: none; display: block; margin: 0; padding: 0; background: #ffffff;" 
                allowfullscreen>
        </iframe>
    `);

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.backToCourseTable = function() {
    let fullScreenContainer = $('#customHtmlSection');
    fullScreenContainer.addClass('d-none').attr('style', '');
    
    // Trả lại class mb-4 cho trạng thái gốc
    fullScreenContainer.find('header.top-header').attr('style', '').html('').addClass('mb-4');
    
    $('#customHtmlContent').attr('style', '').addClass('bg-white rounded border shadow-sm p-3 p-md-4').html('');
    
    $('#sidebarMenu').removeClass('d-none');
    $('#courseSection').removeClass('d-none');
};
window.personalUnreadQA = [];
window.personalUnreadShareCode = [];

function updatePersonalNotificationBell() {
    let total = window.personalUnreadQA.length + window.personalUnreadShareCode.length;
    let badge = $('#personalNotificationBadge');
    let bell = $('#bellIconUI');
    
    if (total > 0) {
        badge.text(total).removeClass('d-none');
        bell.removeClass('text-secondary').addClass('text-danger fa-shake'); // Rung lác cảnh báo
    } else {
        badge.addClass('d-none');
        bell.removeClass('text-danger fa-shake').addClass('text-secondary');
    }
}
window.openPersonalNotifications = function() {
    if (!currentUser || currentUser.isGuest) {
        alert("Vui lòng đăng nhập để xem thông báo cá nhân!");
        return;
    }
    
    let html = '';
    if (window.personalUnreadQA.length === 0 && window.personalUnreadShareCode.length === 0) {
        html = '<div class="text-center text-muted p-5"><i class="fa-regular fa-bell-slash fs-1 mb-3"></i><br>Bạn không có thông báo mới nào.</div>';
    } else {
        window.personalUnreadQA.forEach(row => {
            let qPreview = String(row[2]).replace(/<[^>]*>?/gm, '').substring(0, 60) + '...';
            html += `
            <div class="p-3 border-bottom" style="cursor: pointer; background: #f8fafc; transition: 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'" onclick="handleNotificationClick('Q&A', ${row[6]})">
                <div class="d-flex align-items-start gap-3">
                    <!-- Chuyển sang xanh chủ đạo -->
                    <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 42px; height: 42px;"><i class="fa-solid fa-comments"></i></div>
                    <div>
                        <div class="fw-bold text-primary mb-1" style="font-size: 14.5px;">Phản hồi mới trong Giải đáp thắc mắc</div>
                        <div class="text-muted small fst-italic">"${qPreview}"</div>
                    </div>
                </div>
            </div>`;
        });

       window.personalUnreadShareCode.forEach(row => {
            let codePreview = String(row[2]).replace(/<[^>]*>?/gm, '');
            let maBaiMatch = codePreview.match(/^\[SHARECODE\|.*?\|(.*?)\]/);
            let maBai = maBaiMatch && maBaiMatch[1] ? maBaiMatch[1].trim() : "Mã code";
            let catMatch = codePreview.match(/^\[SHARECODE\|(.*?)(?:\||\])/);
            let catName = catMatch && catMatch[1] ? catMatch[1].trim() : "";

            html += `
            <div class="p-3 border-bottom" style="cursor: pointer; background: #f0fdf4; transition: 0.2s;" onmouseover="this.style.background='#dcfce7'" onmouseout="this.style.background='#f0fdf4'" onclick="handleNotificationClick('ShareCode', ${row[6]}, '${catName}')">
                <div class="d-flex align-items-start gap-3">
                    <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 42px; height: 42px;"><i class="fa-solid fa-code"></i></div>
                    <div>
                        <div class="fw-bold text-success mb-1" style="font-size: 14.5px;">Bình luận mới trong ShareCode</div>
                        <div class="text-muted small">Mã bài: <strong class="text-dark">${maBai}</strong></div>
                    </div>
                </div>
            </div>`;
        });
    }
    $('#personalNotificationList').html(html);
    $('#personalNotificationModal').modal('show');
};


 window.handleNotificationClick = function(type, rowIndex, catName) {
    $('#personalNotificationModal').modal('hide');

    postToGAS({
        action: "markAsRead",
        sheetName: type,
        rowIndex: rowIndex,
        mssv: currentUser.mssv
    }, function() {
        if (type === 'Q&A') window.personalUnreadQA = window.personalUnreadQA.filter(r => r[6] !== rowIndex);
        else window.personalUnreadShareCode = window.personalUnreadShareCode.filter(r => r[6] !== rowIndex);
        updatePersonalNotificationBell();
    }, function() {});

    if (type === 'Q&A') {
        openQASection();
        let retryCount = 0;
        let checkQaInterval = setInterval(() => {
            let targetBlock = $('#replyBox-' + rowIndex).closest('.qa-item');
            if (targetBlock.length > 0) {
                clearInterval(checkQaInterval);
                $('html, body').animate({ scrollTop: targetBlock.offset().top - 100 }, 600);
                // Đồng bộ hiệu ứng viền sang màu xanh thay vì đỏ
                targetBlock.css({'border-color': '#0f4c81', 'box-shadow': '0 0 20px rgba(15, 76, 129, 0.4)', 'transition': 'all 0.5s ease'});
                setTimeout(() => { targetBlock.css({'border-color': '', 'box-shadow': ''}); }, 4000);
            }
            retryCount++;
            if (retryCount > 30) clearInterval(checkQaInterval); 
        }, 200);
    }
    else if (type === 'ShareCode') {
        openShareCodeSection();
        if (catName) {
            let lang = catName.toLowerCase().includes('python') ? 'python' : 'cpp';
            
            setTimeout(() => {
                // FIX: Xóa sạch dữ liệu cũ để ép Interval chờ dữ liệu danh mục mới tải xong
                window.shareCodeList = null; 
                openShareCategory(catName, lang);
                
                let retryCount = 0;
                let checkDataInterval = setInterval(() => {
                    if (window.shareCodeList && window.shareCodeList.length > 0) {
                        clearInterval(checkDataInterval);
                        let itemIndex = window.shareCodeList.findIndex(i => i.rowIndex === rowIndex);
                        if (itemIndex !== -1) {
                            openShareCodeDetail(itemIndex);
                        }
                    }
                    retryCount++;
                    if (retryCount > 25) clearInterval(checkDataInterval);
                }, 200);
            }, 300);
        }
    }
};

window.toggleOneCompiler = function(btn, isShow) {
    let sidebar = $(btn).closest('#iframeSidebar, #latexSidebar'); 
    
    sidebar.css('transition', 'all 0.3s ease');
    
    if (isShow) {
        sidebar.find('.tools-area').removeClass('d-flex').addClass('d-none');
        sidebar.find('.compiler-area').removeClass('d-none').addClass('d-flex');
        
        let iframe = sidebar.find('iframe');
        if (!iframe.attr('src')) iframe.attr('src', 'https://test.upcoder.xyz/index.php/problems/mysubmit');
        
        sidebar.css({'width': '42.85%', 'max-width': 'none'});
    } else {
        // ĐOẠN THÊM MỚI: Kiểm tra nếu đang phóng to thì thu nhỏ lại trước khi đóng
        let compilerArea = sidebar.find('.compiler-area');
        if (compilerArea.hasClass('compiler-maximized')) {
            compilerArea.removeClass('compiler-maximized').css({'position':'', 'top':'', 'left':'', 'width':'', 'height':'', 'z-index':''});
            compilerArea.find('.btn-maximize-compiler').html('<i class="fa-solid fa-expand me-1"></i> Phóng to');
        }

        sidebar.find('.compiler-area').removeClass('d-flex').addClass('d-none');
        sidebar.find('.tools-area').removeClass('d-none').addClass('d-flex');
        
        sidebar.css({'width': '32%', 'max-width': '450px'});
    }
};

window.toggleCompilerSize = function(btn) {
    let compilerArea = $(btn).closest('.compiler-area');
    let isMaximized = compilerArea.hasClass('compiler-maximized');
    
    if (!isMaximized) {
        compilerArea.addClass('compiler-maximized');
        compilerArea.css({
            'position': 'fixed',
            'top': '0',
            'left': '0',
            'width': '100vw',
            'height': '100vh',
            'z-index': '10800'
        });
        $(btn).html('<i class="fa-solid fa-compress"></i>');
        $(btn).attr('title', 'Thu nhỏ khung');
    } else {
        compilerArea.removeClass('compiler-maximized');
        compilerArea.css({'position': '', 'top': '', 'left': '', 'width': '', 'height': '', 'z-index': ''});
        $(btn).html('<i class="fa-solid fa-expand"></i>');
        $(btn).attr('title', 'Toàn màn hình');
    }
};

window.zoomCompilerContent = function(btn, zoomChange) {
    // Tìm đúng iframe đang hiển thị
    let iframe = $(btn).closest('.compiler-area').find('iframe');
    
    // Lấy mức zoom hiện tại (Mặc định là 1.0 ~ 100%)
    let currentZoom = parseFloat(iframe.attr('data-zoom')) || 1.0;
    let newZoom = currentZoom + zoomChange;
    
    // Khóa giới hạn: Không cho thu nhỏ quá 50% hoặc phóng to quá 250%
    if (newZoom < 0.5) newZoom = 0.5;
    if (newZoom > 2.5) newZoom = 2.5;
    
    // Lưu lại trạng thái zoom
    iframe.attr('data-zoom', newZoom);
    
    // Áp dụng CSS zoom (Phóng to nét căng như dùng Ctrl + cuộn chuột)
    iframe.css({
        'zoom': newZoom,
        '-moz-transform': `scale(${newZoom})`,      // Dự phòng cho Firefox
        '-moz-transform-origin': 'top left',
        'width': navigator.userAgent.toLowerCase().includes('firefox') ? `${100 / newZoom}%` : '100%',
        'height': navigator.userAgent.toLowerCase().includes('firefox') ? `${100 / newZoom}%` : '100%'
    });
};

// Hàm gửi phản hồi tiếp (Dành cho Sinh viên trong phần Thông báo)
window.sendThongBaoReplyChain = function(rowIndex) {
    let replyText = $(`#tb-txtReply-${rowIndex}`).val().trim(); 
    if (!replyText) { alert("Vui lòng nhập nội dung phản hồi!"); return; } 
    
    let studentMssv = currentUser ? currentUser.mssv : "Ẩn danh";
    let now = new Date();
    let pad = (n) => String(n).padStart(2, '0');
    let timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    
    let formattedReply = studentMssv + ":::" + timeStr + ":::" + replyText;
    
    let btn = $(`#tb-btnSendReply-${rowIndex}`); 
    btn.html('<i class="fa-solid fa-spinner fa-spin"></i>').prop('disabled', true); 
    
    postToGAS({ action: "replyToAdmin", rowIndex: rowIndex, replyText: formattedReply }, function(response) { 
        alert(response); 
        
        // Tải lại khung bình luận thông báo để thấy ngay lập tức
        let tbCode = new URLSearchParams(window.location.search).get('tb');
        if (tbCode) loadThongBaoComments(tbCode);
        
        // Tải ngầm danh sách Q&A gốc để đồng bộ số lượng badge (nếu cần)
        if (typeof loadQAData === 'function') loadQAData(); 
        if (typeof checkNewQA === 'function') checkNewQA(); 
    }, function() { 
        alert("Lỗi khi gửi phản hồi."); btn.html('<i class="fa-solid fa-paper-plane me-1"></i> Gửi phản hồi').prop('disabled', false); 
    }); 
};

// Hàm gửi phản hồi tiếp (Dành cho Admin trong phần Thông báo)
window.sendThongBaoAdminReply = function(rowIndex) {
    let replyText = $(`#tb-txtAdminReply-${rowIndex}`).val().trim(); 
    if (!replyText) { alert("Vui lòng nhập nội dung trả lời!"); return; } 
    
    let btn = $(`#tb-btnAdminSubmit-${rowIndex}`); 
    btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...').prop('disabled', true); 
    
    postToGAS({ action: "adminReplyQuestion", rowIndex: rowIndex, replyText: replyText }, function(response) { 
        alert(response); 
        
        // Tải lại khung bình luận
        let tbCode = new URLSearchParams(window.location.search).get('tb');
        if (tbCode) loadThongBaoComments(tbCode);
        
        // Tải ngầm đồng bộ
        if (typeof loadQAData === 'function') loadQAData(); 
        if (typeof checkNewQA === 'function') checkNewQA();  
    }, function() { 
        alert("Lỗi khi gửi trả lời."); btn.html('<i class="fa-solid fa-reply me-1"></i> Đăng câu trả lời').prop('disabled', false); 
    }); 
};

// Tự động chèn Giao diện Modal Trao Đổi vào body khi tải trang
$(document).ready(function() {
    const courseQAModalHtml = `
    <div class="modal fade" id="courseQAModal" tabindex="-1" aria-hidden="true" style="z-index: 1060;">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 16px;">
                <div class="modal-header text-white" style="background-color: #0f4c81;">
                    <h6 class="modal-title fw-bold" id="courseQAModalTitle"><i class="fa-solid fa-comments me-2"></i> Trao đổi bài học</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4 bg-light">
                    
                    <div class="p-3 bg-white rounded border border-primary-subtle shadow-sm">
                        <h6 class="fw-bold text-primary mb-2"><i class="fa-solid fa-pen-nib me-2"></i>Đặt câu hỏi / Thảo luận mới</h6>
                        <textarea id="txtCourseNewQA" class="form-control mb-2 border-primary-subtle" rows="3" placeholder="Nhập thắc mắc hoặc nội dung trao đổi của bạn tại đây..."></textarea>
                        <div class="text-end">
                            <button class="btn text-white fw-bold px-4" style="background-color: #0f4c81; border-radius: 8px;" onclick="submitCourseNewQA()">
                                <i class="fa-solid fa-paper-plane me-1"></i> Gửi thảo luận
                            </button>
                        </div>
                    </div>
<br>
 <h6 class="fw-bold text-primary mb-2"><i class="fa-solid fa-pen-nib me-2"></i>Lịch sử trao đổi</h6> <br>
<div id="courseQAList" class="mb-4"></div>
                </div>
            </div>
        </div>
    </div>`;
    $('body').append(courseQAModalHtml);
});

window.currentCourseQaTopic = "";
window.currentCourseQaLesson = "";

window.openCourseQAModal = function(topic, lessonName) {
    window.currentCourseQaTopic = topic;
    window.currentCourseQaLesson = lessonName;
    $('#courseQAModalTitle').html(`<i class="fa-solid fa-comments me-2"></i> ${lessonName}`);
    $('#courseQAList').html('<div class="text-center py-4"><i class="fa-solid fa-spinner fa-spin fs-3 text-muted"></i><br>Đang tải dữ liệu trao đổi...</div>');
    $('#txtCourseNewQA').val('');
    $('#courseQAModal').modal('show');
    loadCourseQAList();
};

window.loadCourseQAList = function() {
    $.ajax({
        url: SCRIPT_URL + "?action=getQAData",
        method: "GET",
        dataType: "json",
        success: function(data) {
            let html = '';
            let count = 0;
            let activeUser = JSON.parse(localStorage.getItem('currentUser')) || null;
            let isSystemAdmin = activeUser && (activeUser.mssv === "51.01.108.008" || activeUser.mssv === "5101108008");

            if (data && data.length > 0) {
                data.forEach(row => {
                    let rawQuestion = row[2] || '';
                    
                    // Lọc những câu hỏi có gắn mác [LESSON: Tên bài học]
                    if (rawQuestion.includes(`[LESSON:${window.currentCourseQaLesson}]`)) {
                        count++;
                        let time = row[0];
                        let rawMssv = String(row[1]).replace(/[-|]/g, '');
                        let displayMssv = maskMSSV(rawMssv);
                        
                        if (isSystemAdmin) {
                            let fullName = window.allUsersMap ? window.allUsersMap[rawMssv] : null;
                            displayMssv = fullName ? `${rawMssv} - ${getNaturalShortName(fullName)}` : rawMssv;
                        } else if (activeUser && activeUser.mssv && activeUser.mssv.replace(/\./g, "") === rawMssv.replace(/\./g, "")) {
                            displayMssv = `${rawMssv} - ${getNaturalShortName(activeUser.name)} <span class="badge bg-success ms-1" style="font-size: 10px;">Bạn</span>`;
                        }

                        let answer = row[3] || '';
                        let rowIndex = row[6];

                        // Dọn dẹp thẻ Tag và Định danh Bài học để giao diện sạch sẽ
                        let cleanQuestion = rawQuestion.replace(/<span class="badge.*?>.*?<\/span>\s*/g, '')
                                                       .replace(`[LESSON:${window.currentCourseQaLesson}]`, '')
                                                       .replace(/<strong>Bài học:.*?<\/strong>\s*/i, '')
                                                       .trim();
                        let questionFormatted = window.safeFormatTextQA(cleanQuestion);

                        // --- BẮT ĐẦU XỬ LÝ AVATAR ---
                        let avatarHtml = `<div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2 shadow-sm flex-shrink-0" style="width: 32px; height: 32px; font-size: 14px;"><i class="fa-solid fa-user"></i></div>`;
                        
                        let userAvatar = "";
                        let cleanRawMssv = rawMssv.replace(/\./g, ""); 
                        
                        // Nếu là chính tài khoản đang đăng nhập
                        if (activeUser && activeUser.mssv && activeUser.mssv.replace(/\./g, "") === cleanRawMssv) {
                            userAvatar = activeUser.avatar || "";
                        } 
                        // Nếu là sinh viên khác (lấy từ dữ liệu map)
                        else if (window.allUsersMap && typeof window.allUsersMap[cleanRawMssv] === 'object' && window.allUsersMap[cleanRawMssv].avatar) {
                            userAvatar = window.allUsersMap[cleanRawMssv].avatar;
                        }
                        
                        if (userAvatar && userAvatar.trim() !== '') {
                            let cleanUrl = userAvatar.trim();
                            if (cleanUrl.includes("drive.google.com/file/d/")) {
                                let matchId = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                                if (matchId && matchId[1]) cleanUrl = `https://drive.google.com/thumbnail?id=${matchId[1]}&sz=w100`;
                            } else if (cleanUrl.includes("googleusercontent.com")) {
                                cleanUrl = cleanUrl.replace(/=w\d+|-h\d+|-p|-no|-k/g, '').replace(/=s\d+/g, '') + "=w100-h100-p";
                            }
                           avatarHtml = `<img src="${cleanUrl}" class="rounded-circle me-2 shadow-sm flex-shrink-0" style="width: 32px; height: 32px; object-fit: cover; border: 1.5px solid #0f4c81; user-select: none; -webkit-user-drag: none;" draggable="false" oncontextmenu="return false;">`;
                        }
                        // --- KẾT THÚC XỬ LÝ AVATAR ---

                        // Dựng giao diện Timeline tương tự mục Thông báo
                        html += `
                        <div class="mb-4" style="border-left: 3px solid #cbd5e1; padding-left: 15px; margin-left: 5px;">
                            <div class="d-flex align-items-center mb-2">
                                ${avatarHtml}
                                <div>
                                    <div class="fw-bold" style="color: #0f4c81; font-size: 14.5px;">SV: ${displayMssv}</div>
                                    <div class="text-muted" style="font-size: 12px;"><i class="fa-regular fa-clock me-1"></i>${time}</div>
                                </div>
                            </div>
                            
                            <div class="bg-white p-3 rounded shadow-sm border border-primary-subtle" style="font-size: 15px; color: #334155; border-radius: 0 12px 12px 12px;">
                                ${questionFormatted}
                            </div>`;
                                    
                        if (answer.trim() !== "") {
                            html += `<div class="mt-2 ms-4 ps-3" style="border-left: 2px dashed #93c5fd;">${parseThread(answer, rowIndex)}</div>`; 
                        } else {
                            html += `<div class="mt-2 ms-4 ps-3 text-muted small fst-italic"><i class="fa-solid fa-reply fa-rotate-180 me-2"></i>Đang chờ Admin phản hồi...</div>`;
                        }
                        
                        html += `
                            <div class="mt-2 ms-4 ps-3">
                                <button class="btn btn-sm btn-outline-primary fw-bold mt-2 shadow-sm" onclick="$('#course-replyBox-${rowIndex}').toggleClass('d-none')">
                                    <i class="fa-solid fa-comment-dots"></i> Phản hồi tiếp
                                </button>
                                
                                <div id="course-replyBox-${rowIndex}" class="d-none mt-3 p-3 bg-light rounded border border-primary-subtle shadow-sm">
                                    <textarea id="course-txtReply-${rowIndex}" class="form-control mb-2" rows="2" placeholder="Nhập bình luận của bạn..."></textarea>
                                    <div class="d-flex gap-2 justify-content-end">
                                        <button class="btn btn-sm btn-light border fw-bold" onclick="$('#course-replyBox-${rowIndex}').addClass('d-none')">Hủy</button>
                                        <button class="btn btn-sm text-white fw-bold" onclick="sendCourseQAReply(${rowIndex})" id="course-btnSendReply-${rowIndex}" style="background: #0f4c81; border:none;">
                                            <i class="fa-solid fa-paper-plane me-1"></i> Gửi phản hồi
                                        </button>
                                    </div>
                                </div>`;
                                
                        if (typeof isAdmin !== 'undefined' && isAdmin) { 
                            html += `
                                <div class="mt-3 p-3 rounded bg-white shadow-sm" style="border: 1px dashed var(--accent-red);">
                                    <h6 class="mb-2" style="color: var(--accent-red); font-size: 14px; font-weight: 700;"><i class="fa-solid fa-user-shield"></i> Trả lời vào chuỗi (Admin)</h6>
                                    <textarea id="course-txtAdminReply-${rowIndex}" class="form-control mb-2" rows="2" placeholder="Nhập trả lời dành cho sinh viên..."></textarea>
                                    <div class="text-end mt-2">
                                        <button class="btn btn-sm text-white fw-bold" style="background: var(--accent-red);" onclick="sendCourseQAAdminReply(${rowIndex})" id="course-btnAdminSubmit-${rowIndex}">
                                            <i class="fa-solid fa-reply me-1"></i> Đăng câu trả lời
                                        </button>
                                    </div>
                                </div>`; 
                        }
                        
                        html += `</div></div>`;
                    }
                });
            }

            if (count === 0) {
                html = '<div class="text-center text-muted py-4"><i class="fa-regular fa-comments fs-2 mb-2 opacity-50"></i><br>Chưa có thảo luận nào cho bài học này.<br>Bạn hãy là người đầu tiên nhé!</div>';
            }
            
            $('#courseQAList').html(html);
            if (window.Prism) Prism.highlightAllUnder(document.getElementById('courseQAList'));
            if (typeof applyKaTeX === 'function') applyKaTeX('courseQAList');
        }
    });
};

window.submitCourseNewQA = function() {
    let mssvValue = currentUser ? currentUser.mssv : "Khách";
    if (mssvValue === "Khách") { alert("Vui lòng đăng nhập Sinh viên để thảo luận!"); return; }

    let text = $('#txtCourseNewQA').val().trim();
    if (!text) { alert("Vui lòng nhập nội dung!"); return; }

    let topic = window.currentCourseQaTopic || currentSheetName;
    let lesson = window.currentCourseQaLesson;

    // Đóng gói 3 lớp: Thẻ Badge Topic + Mã Ẩn Định Danh Bài + Header in đậm
    let finalPayload = `<span class="badge mb-2 shadow-sm" style="background-color: #f1f5f9; color: #475569; font-size: 12.5px; border: 1px solid #e2e8f0;"><i class="fa-solid fa-tag me-1" style="color: #0f4c81;"></i> ${topic}</span>\n[LESSON:${lesson}]\n<strong>Bài học: ${lesson}</strong>\n\n${text}`;

    // Fix nút Load bằng ID chính xác
    let btn = $('#courseQAModal button').last(); 
    let originalHtml = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...').prop('disabled', true);

    postToGAS({ action: "submitQuestion", mssv: mssvValue, question: finalPayload }, function(res) {
        alert("Đã gửi nội dung trao đổi thành công!");
        $('#txtCourseNewQA').val('');
        btn.html(originalHtml).prop('disabled', false);
        loadCourseQAList();
        
        // Tải ngầm list QA tổng để cập nhật thông báo (nếu có)
        if (typeof checkNewQA === 'function') checkNewQA();
    }, function() {
        alert("Lỗi kết nối máy chủ!");
        btn.html(originalHtml).prop('disabled', false);
    });
};

window.sendCourseQAReply = function(rowIndex) {
    let replyText = $(`#course-txtReply-${rowIndex}`).val().trim();
    if (!replyText) { alert("Vui lòng nhập nội dung!"); return; }

    let studentMssv = currentUser ? currentUser.mssv : "Ẩn danh";
    let now = new Date();
    let pad = (n) => String(n).padStart(2, '0');
    let timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

    let formattedReply = studentMssv + ":::" + timeStr + ":::" + replyText;

    let btn = $(`#course-btnSendReply-${rowIndex}`);
    let originalBtnHtml = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin"></i>').prop('disabled', true);

    postToGAS({ action: "replyToAdmin", rowIndex: rowIndex, replyText: formattedReply }, function(response) {
        alert(response);
        loadCourseQAList();
    }, function() {
        alert("Lỗi khi gửi phản hồi.");
        btn.html(originalBtnHtml).prop('disabled', false);
    });
};

window.sendCourseQAAdminReply = function(rowIndex) {
    let replyText = $(`#course-txtAdminReply-${rowIndex}`).val().trim();
    if (!replyText) { alert("Vui lòng nhập trả lời!"); return; }

    let btn = $(`#course-btnAdminSubmit-${rowIndex}`);
    let originalBtnHtml = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin"></i>').prop('disabled', true);

    postToGAS({ action: "adminReplyQuestion", rowIndex: rowIndex, replyText: replyText }, function(response) {
        alert(response);
        loadCourseQAList();
    }, function() {
        alert("Lỗi khi gửi trả lời.");
        btn.html(originalBtnHtml).prop('disabled', false);
    });
};