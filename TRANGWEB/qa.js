function checkNewQA() { $.ajax({ url: SCRIPT_URL + "?action=getQAData", method: "GET", dataType: "json", success: function(data) { if (!data || data.length === 0) return; if (data.some(row => (row[3] || '').trim() === '')) $('#qaSidebarBadge').removeClass('d-none'); else $('#qaSidebarBadge').addClass('d-none'); }}); }
        function openQASection() { 
			document.title = "Hỗ trợ & Giải đáp | Học nhóm Năm 2 Khoa Toán";
            resetNavActive(); $('#btnNavQA').addClass('active'); $('#qaSection').removeClass('d-none'); 
            if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); } 
            if (currentUser) { $('#txtMSSV').val(currentUser.mssv).prop('readonly', true).css({ 'background-color': '#e9ecef', 'cursor': 'not-allowed' }); } 
            else { $('#txtMSSV').val('').prop('readonly', false).css({ 'background-color': '#ffffff', 'cursor': 'text' }); }
            loadQAData(); 
        }
        function sendQuestion() {
            let mssvValue = currentUser ? currentUser.mssv : $('#txtMSSV').val().trim(); 
            let qText = $('#txtQuestion').val().trim();
            if (!mssvValue) { alert("Vui lòng nhập mã số sinh viên hoặc email liên hệ!"); $('#txtMSSV').focus(); return; } 
            if (!qText) { alert("Vui lòng nhập nội dung câu hỏi!"); $('#txtQuestion').focus(); return; }
            let btn = $('#btnSubmitQ'); btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Đang gửi...').prop('disabled', true);
            postToGAS({ action: "submitQuestion", mssv: mssvValue, question: qText }, function(response) { 
                alert(response); $('#txtQuestion').val(''); btn.html('<i class="fa-solid fa-paper-plane me-2"></i> Gửi câu hỏi').prop('disabled', false); loadQAData(); checkNewQA(); 
            }, function() { alert("Lỗi kết nối máy chủ!"); btn.html('<i class="fa-solid fa-paper-plane me-2"></i> Gửi câu hỏi').prop('disabled', false); });
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
                    let svFormattedMsg = svMsg.replace(/\n/g, '<br>'); html += `<div class="msg-sv"><i class="fa-solid fa-user-graduate me-2"></i><strong>${svName}:</strong><br>${svFormattedMsg}`; 
                    if (isAdmin) { html += `<div class="mt-2 text-end"><button class="btn btn-sm btn-outline-danger py-0" onclick="deleteThreadPart(${rowIndex}, ${index})" style="font-size: 12px;"><i class="fa-solid fa-trash"></i> Xóa phản hồi này</button></div>`; } html += `</div>`; 
                } else { 
                    let adminText = content.replace(/\n/g, '<br>'); html += `<div class="msg-admin"><i class="fa-solid fa-user-shield me-2"></i><strong>Admin:</strong><br>${adminText}`; 
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
                        let time = row[0] || ''; let rawMssv = row[1] || ''; let displayMssv = isAdmin ? rawMssv : maskMSSV(rawMssv); let question = row[2] || ''; let answer = row[3] || ''; let upvotes = parseInt(row[4]) || 0; let downvotes = parseInt(row[5]) || 0; let rowIndex = row[6];       
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
                    $('#qaListArea').html(html); if (hasUnanswered) $('#qaSidebarBadge').removeClass('d-none'); else $('#qaSidebarBadge').addClass('d-none');
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