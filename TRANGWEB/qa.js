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
    // Bắt các đoạn code bọc trong 3 dấu ngoặc ngược (```) và loại bỏ chính nó
    return text.replace(/```(cpp|python|c\+\+|c)([\s\S]*?)```/gi, function(match, lang, code) {
        let escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
        let safeLang = (lang.toLowerCase() === 'c++' || lang.toLowerCase() === 'c') ? 'cpp' : lang.toLowerCase();
        
        // Trả về HTML chuẩn, không bao gồm ký tự ```
        return `<pre><code class="language-${safeLang}">${escapedCode}</code></pre>`;
    });
}
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
    document.title = "Hỗ trợ & Giải đáp | Học nhóm Năm 2 Khoa Toán";
    resetNavActive(); 
    
    // ĐỔI #btnNavQA THÀNH #btnNavShareCode TẠI ĐÂY
    $('#btnNavShareCode').addClass('active'); 
    
    $('#qaSection').removeClass('d-none'); 
    if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); } 
    if (currentUser) { $('#txtMSSV').val(currentUser.mssv).prop('readonly', true).css({ 'background-color': '#e9ecef', 'cursor': 'not-allowed' }); } 
    else { $('#txtMSSV').val('').prop('readonly', false).css({ 'background-color': '#ffffff', 'cursor': 'text' }); }
    loadQAData(); 
}
       function sendQuestion() {
    let mssvValue = currentUser ? currentUser.mssv : $('#txtMSSV').val().trim(); 
    let qText = "";
    
    // Kiểm tra xem đang ở chế độ nào
    let mode = $('input[name="inputType"]:checked').val();
    if (mode === 'code') {
        let rawCode = codeEditor.getValue().trim();
        let lang = $('#codeLanguage').val() === 'c_cpp' ? 'cpp' : 'python';
        if (rawCode !== "") {
            // Tự động bọc code Markdown
            qText = "```" + lang + "\n" + rawCode + "\n```"; 
        }
    } else {
        qText = $('#txtQuestion').val().trim();
    }

    if (!mssvValue) { alert("Vui lòng nhập mã số sinh viên hoặc email liên hệ!"); $('#txtMSSV').focus(); return; } 
    if (!qText) { alert("Vui lòng nhập nội dung câu hỏi!"); return; }
    
    let btn = $('#btnSubmitQ'); 
    btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang gửi...').prop('disabled', true);
    
    postToGAS({ action: "submitQuestion", mssv: mssvValue, question: qText }, function(response) { 
        alert(response); 
        $('#txtQuestion').val(''); 
        codeEditor.setValue(''); // Xóa trắng khung code sau khi gửi
        btn.html('<i class="fa-solid fa-paper-plane me-2"></i> Gửi câu hỏi').prop('disabled', false); 
        loadQAData(); 
        checkNewQA(); 
    }, function() { 
        alert("Lỗi kết nối máy chủ!"); 
        btn.html('<i class="fa-solid fa-paper-plane me-2"></i> Gửi câu hỏi').prop('disabled', false); 
    });
}

function maskMSSV(mssv) { let str = String(mssv).trim(); if (str.length <= 6) return str; return str.substring(0, 3) + '***' + str.substring(str.length - 3); }
        function parseThread(text, rowIndex) {
            let parts = text.split(/(\[SV\][\s\S]*?\[\/SV\])/g).filter(p => p.trim() !== ""); window.qaThreadParts[rowIndex] = parts; let html = '';
            parts.forEach((part, index) => { 
                let content = part.trim(); if(content === "") return;
                if (content.startsWith("[SV]") && content.endsWith("[/SV]")) { 
                    let svTextRaw = content.replace("[SV]", "").replace("[/SV]", "").trim(); let svName = "Sinh viên"; let svMsg = svTextRaw;
                    if (svTextRaw.includes(":::")) {
                        let splitData = svTextRaw.split(":::"); let rawMssv = splitData[0].trim(); let displayMssv = isAdmin ? rawMssv : maskMSSV(rawMssv);
                        svName = "Sinh viên (" + displayMssv + ")"; svMsg = splitData.slice(1).join(":::").trim();
                    }
                 let svFormattedMsg = formatCodeBlocks(svMsg).replace(/(?:\r\n|\r|\n)(?!(?:[^<]*<\/pre>))/g, '<br>'); html += `<div class="msg-sv"><i class="fa-solid fa-user-graduate me-2"></i><strong>${svName}:</strong><br>${svFormattedMsg}`; 
                    if (isAdmin) { html += `<div class="mt-2 text-end"><button class="btn btn-sm btn-outline-danger py-0" onclick="deleteThreadPart(${rowIndex}, ${index})" style="font-size: 12px;"><i class="fa-solid fa-trash"></i> Xóa phản hồi này</button></div>`; } html += `</div>`; 
                } else { 
                    let adminText = formatCodeBlocks(content).replace(/(?:\r\n|\r|\n)(?!(?:[^<]*<\/pre>))/g, '<br>'); html += `<div class="msg-admin"><i class="fa-solid fa-user-shield me-2"></i><strong>Admin:</strong><br>${adminText}`; 
                    if (isAdmin) { html += `<div class="mt-2 text-end"><button class="btn btn-sm btn-outline-warning py-0 me-2" onclick="openEditQAModal(${rowIndex}, ${index})" style="font-size: 12px;"><i class="fa-solid fa-pen"></i> Sửa</button><button class="btn btn-sm btn-outline-danger py-0" onclick="deleteThreadPart(${rowIndex}, ${index})" style="font-size: 12px;"><i class="fa-solid fa-trash"></i> Xóa</button></div>`; } html += `</div>`; 
                }
            }); return html;
        }
        function loadQAData() {
            $('#qaListArea').html(''); $('#qaLoadingStatus').removeClass('d-none');
            $.ajax({ url: SCRIPT_URL + "?action=getQAData", method: "GET", dataType: "json", success: function(data) {
                    $('#qaLoadingStatus').addClass('d-none');
                    if (!data || data.length === 0) { $('#qaListArea').html('<div class="text-center p-4 text-muted border rounded bg-white"><i class="fa-regular fa-comments fs-2 mb-2"></i><br>Chưa có câu hỏi nào. Bạn hãy là người đầu tiên đặt câu hỏi nhé!</div>'); $('#qaSidebarBadge').addClass('d-none'); return; }
                    let html = ''; let hasUnanswered = false;
                    data.forEach(row => {
                        let time = row[0] || ''; let rawMssv = row[1] || ''; let displayMssv = isAdmin ? rawMssv : maskMSSV(rawMssv); let question = formatCodeBlocks(row[2] || '');let answer = row[3] || ''; let upvotes = parseInt(row[4]) || 0; let downvotes = parseInt(row[5]) || 0; let rowIndex = row[6];       
                        let isNew = answer.trim() === ""; if (isNew) hasUnanswered = true; let itemClass = isNew ? 'qa-item unanswered-item' : 'qa-item';
                        html += `<div class="${itemClass}"><div class="d-flex justify-content-between align-items-start"><div class="qa-time"><i class="fa-regular fa-clock"></i> ${time} <span class="mx-2">|</span> <i class="fa-solid fa-id-card"></i> SV: <strong class="text-secondary">${displayMssv}</strong></div>`;
                        if (isAdmin) { html += `<button class="btn btn-sm btn-outline-danger fw-bold" onclick="deleteQA(${rowIndex})" id="btnDelQA-${rowIndex}"><i class="fa-solid fa-trash"></i> Xóa toàn bộ chuỗi này</button>`; }
                        html += `   </div><div class="qa-question">${question}</div>`;
                        if (!isNew) {
                            html += parseThread(answer, rowIndex);
                            html += `<div class="vote-action-bar"><div class="vote-group" id="voteArea-${rowIndex}"><button class="btn-vote up" onclick="castVote(${rowIndex}, 'up', this)"><i class="fa-solid fa-thumbs-up"></i> Hữu ích (${upvotes})</button><button class="btn-vote down" onclick="castVote(${rowIndex}, 'down', this)"><i class="fa-solid fa-thumbs-down"></i> Chưa rõ (${downvotes})</button></div><button class="btn-reply-toggle m-0" onclick="$('#replyBox-${rowIndex}').toggleClass('d-none')"><i class="fa-solid fa-comment-dots"></i> Phản hồi thêm</button></div><div id="replyBox-${rowIndex}" class="reply-box d-none mt-3"><textarea id="txtReply-${rowIndex}" class="form-control mb-2" rows="2" placeholder="Nhập thêm ý kiến/câu hỏi phản hồi..."></textarea><div class="d-flex gap-2"><button class="btn btn-sm btn-primary fw-bold" onclick="sendReply(${rowIndex})" id="btnSendReply-${rowIndex}" style="background: var(--primary-color); border:none;">Gửi phản hồi</button><button class="btn btn-sm btn-light border" onclick="$('#replyBox-${rowIndex}').addClass('d-none')">Hủy</button></div></div>`;
                        } else { html += `<div class="qa-no-answer"><i class="fa-solid fa-hourglass-half me-2"></i> Đang chờ admin giải đáp...</div>`; }
                        if (isAdmin) { html += `<div class="mt-3 p-3 rounded" style="background: #fff; border: 1px dashed var(--accent-red);"><h6 class="mb-2" style="color: var(--accent-red); font-size: 14px; font-weight: 700;"><i class="fa-solid fa-user-shield"></i> Trả lời vào chuỗi (Admin)</h6><textarea id="txtAdminReply-${rowIndex}" class="form-control mb-2" rows="2" placeholder="Nhập trả lời dành cho sinh viên..."></textarea><button class="btn btn-sm text-white fw-bold" style="background: var(--accent-red);" onclick="sendAdminReply(${rowIndex})" id="btnAdminSubmit-${rowIndex}"><i class="fa-solid fa-reply"></i> Đăng câu trả lời</button></div>`; } html += `</div>`;
                    });
                  $('#qaListArea').html(html); 
                    if (hasUnanswered) $('#qaSidebarBadge').removeClass('d-none'); else $('#qaSidebarBadge').addClass('d-none');
                    
                    // CHỈ GỌI LỆNH NÀY Ở ĐÂY THÔI
                    if (window.Prism) {
                        Prism.highlightAll();
                    }
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
        function castVote(rowIndex, type, btnElement) { $(`#voteArea-${rowIndex} .btn-vote`).prop('disabled', true); let originalText = $(btnElement).html(); $(btnElement).html('<i class="fa-solid fa-spinner fa-spin"></i>'); postToGAS({ action: "submitVote", rowIndex: rowIndex, type: type }, function(newData) { let data = typeof newData === 'string' ? JSON.parse(newData) : newData; $(`#voteArea-${rowIndex} .up`).html(`<i class="fa-solid fa-thumbs-up"></i> Hữu ích (${data.up})`); $(`#voteArea-${rowIndex} .down`).html(`<i class="fa-solid fa-thumbs-down"></i> Chưa rõ (${data.down})`); $(`#voteArea-${rowIndex} .btn-vote`).prop('disabled', false); }, function() { alert("Lỗi khi đánh giá."); $(btnElement).html(originalText); $(`#voteArea-${rowIndex} .btn-vote`).prop('disabled', false); }); }
        function sendReply(rowIndex) { 
            let replyText = $(`#txtReply-${rowIndex}`).val().trim(); 
            if (!replyText) { alert("Vui lòng nhập nội dung phản hồi!"); return; } 
            let studentMssv = currentUser ? currentUser.mssv : "Ẩn danh";
            let formattedReply = studentMssv + ":::" + replyText;
            let btn = $(`#btnSendReply-${rowIndex}`); btn.html('<i class="fa-solid fa-spinner fa-spin"></i>').prop('disabled', true); 
            postToGAS({ action: "replyToAdmin", rowIndex: rowIndex, replyText: formattedReply }, function(response) { alert(response); loadQAData(); checkNewQA(); }, function() { alert("Lỗi khi gửi phản hồi."); btn.html('Gửi phản hồi').prop('disabled', false); }); 
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

function openShareCodeSection() { 
    document.title = "Share Code | Học nhóm Năm 2 Khoa Toán";
    resetNavActive(); 
    $('#btnNavShareCode').addClass('active'); 
    $('#shareCodeSection').removeClass('d-none'); 
    
    backToShareCategories();
    
    if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); } 
    if (currentUser) { $('#txtMSSVShareCode').val(currentUser.mssv).prop('readonly', true).css({ 'background-color': '#e9ecef', 'cursor': 'not-allowed' }); } 
    else { $('#txtMSSVShareCode').val('').prop('readonly', false).css({ 'background-color': '#ffffff', 'cursor': 'text' }); }
}

function backToShareCategories() {
    $('#shareContentView').addClass('d-none');
    $('#shareCategoryView').removeClass('d-none');
}

function openShareCategory(categoryName, lang) {
    currentShareCategory = categoryName;
    currentShareLang = lang;
    
    $('#currentShareTitle').text(categoryName);
    $('#shareCategoryView').addClass('d-none');
    $('#shareContentView').removeClass('d-none');
    
    if(lang === 'python') shareCodeEditor.session.setMode("ace/mode/python");
    else shareCodeEditor.session.setMode("ace/mode/c_cpp");
    
    shareCodeEditor.resize(); 
    cancelEditShareCode(); // Reset form cho sạch sẽ
    loadShareCodeData();
}

function sendShareCode() {
    let mssvValue = currentUser ? currentUser.mssv : $('#txtMSSVShareCode').val().trim(); 
    let rawCode = shareCodeEditor.getValue().trim();
    let maBai = $('#txtMaBai').val().trim();
    
    if (!mssvValue) { alert("Vui lòng nhập MSSV!"); return; } 
    if (!rawCode) { alert("Bạn chưa nhập mã nguồn để chia sẻ!"); return; }
    
    let qText = `[SHARECODE|${currentShareCategory}|${maBai}] \n` + "```" + currentShareLang + "\n" + rawCode + "\n```";

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
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card-sharecode-box" onclick="openShareCodeDetail(${arrayIndex})">
                    <div class="card-sharecode-img">
                        <i class="fa-solid fa-file-code"></i>
                    </div>
                    <div class="card-sharecode-title">${maBaiValue}</div>
                    <div class="card-sharecode-info"><i class="fa-solid fa-user me-1"></i> ${displayMssv}</div>
                    <div class="card-sharecode-time"><i class="fa-regular fa-clock me-1"></i> ${time}</div>
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

// 2. Hàm chuyển đổi từ Danh sách sang Xem Chi Tiết
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

    // Nút Sửa Code chỉ được tạo ra nếu thoả mãn quyền
let editBtnHtml = '';
    if (canEdit) {
        editBtnHtml = `
        <button class="btn text-white fw-bold shadow-sm" style="background: var(--primary-color);" onclick="editShareCodeDirect(${index})">
            <i class="fa-solid fa-pen-to-square"></i> Sửa Code
        </button>`;
    }

    // Giao diện chi tiết thiết kế đồng bộ với trang "Thông báo"
   // Giao diện chi tiết thiết kế đồng bộ với trang "Thông báo"
    let html = `
        <div class="tb-detail-box shadow-sm mb-4" style="border: 1px solid var(--primary-color);">
            <div class="tb-header-blue" style="cursor: pointer; background: linear-gradient(135deg, #0f4c81, #1664a8);" onclick="backToShareCodeList()">
                <i class="fa-solid fa-arrow-left me-2"></i> Trở lại <span class="mx-2">|</span> <i class="fa-solid fa-laptop-code me-2"></i> Chi tiết Share Code
            </div>
            
            <div class="tb-detail-body p-4 p-md-5">
                <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <div>
                        <h4 class="text-primary fw-bold mb-2"><i class="fa-solid fa-hashtag me-2"></i>Mã bài: ${item.maBai}</h4>
                        <div class="qa-time m-0"><i class="fa-regular fa-clock"></i> ${item.time} <span class="mx-3">|</span> Tác giả: <strong class="text-secondary">${item.author}</strong></div>
                    </div>
                    ${editBtnHtml}
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
    
    // Ẩn lưới danh sách, hiện khung chi tiết
    $('#shareCodeListWrapper').addClass('d-none');
    $('#shareCodeDetailWrapper').removeClass('d-none');
    
    // Tự động cuộn trang lên đầu khung chi tiết
    window.scrollTo({ top: $('#shareCodeDetailWrapper').offset().top - 80, behavior: 'smooth' });
    
    // Highlight Code
    if (window.Prism) {
        setTimeout(() => { Prism.highlightAllUnder(document.getElementById('shareCodeDetailWrapper')); }, 50);
    }
};
// 3. Hàm xử lý nút "Trở lại"
window.backToShareCodeList = function() {
    $('#shareCodeDetailWrapper').addClass('d-none');
    $('#shareCodeListWrapper').removeClass('d-none');
};
// Hàm xử lý gửi bình luận / góp ý trong phần Share Code
window.sendShareCodeReply = function(rowIndex) { 
    // Lấy nội dung từ khung text
    let replyText = $(`#txtShareReply-${rowIndex}`).val().trim(); 
    
    if (!replyText) { 
        alert("Vui lòng nhập nội dung bình luận hoặc góp ý!"); 
        return; 
    } 
    
    // Gắn thông tin người gửi (Lấy MSSV nếu đã đăng nhập, ngược lại là Khách)
    let studentMssv = currentUser ? currentUser.mssv : "Khách";
    
    // Format chuỗi dữ liệu để hàm parseThread() có thể đọc được giống bên Q&A
    let formattedReply = studentMssv + ":::" + replyText;
    
    // Lấy phần tử nút bấm và thêm hiệu ứng loading
    let btn = $(`#shareReplyBox-${rowIndex} button`); 
    let originalText = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang gửi...').prop('disabled', true); 
    
    // Gửi yêu cầu lên Google Apps Script
 postToGAS({ 
        action: "replyToShareCode",
        rowIndex: rowIndex, 
        replyText: formattedReply 
    }, function(response) { 
        alert(response); 
        
        // Chỉ dọn dẹp form, KHÔNG gọi loadShareCodeData() để tránh bị văng ra ngoài
        $(`#txtShareReply-${rowIndex}`).val('');
        $(`#shareReplyBox-${rowIndex}`).addClass('d-none');
        btn.html('<i class="fa-solid fa-paper-plane me-2"></i>Gửi bình luận').prop('disabled', false); 

        // Tải ngầm dữ liệu mới và làm mới lại giao diện chi tiết (Ảnh 1)
        $.ajax({ 
            url: SCRIPT_URL + "?action=getShareCodeData", 
            method: "GET", 
            dataType: "json", 
            success: function(data) {
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
                
                // Mở lại chính bài code đó (Cập nhật giao diện Ảnh 1 với bình luận mới)
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
    let rawCode = item.codeContent.replace(/^```[a-zA-Z\+\#]*\n?/g, '').replace(/\n?```$/g, '');

    shareCodeEditor.setValue(rawCode);
    $('#txtMaBai').val(item.maBai);
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