function getShortName(fullName) {
            if (!fullName) return "Khách";
            let parts = fullName.trim().split(/\s+/);
            if (parts.length <= 2) return fullName;
            return parts.slice(-2).join(" ");
        }

        function formatChatMessage(text) {
            let safeText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/\n/g, "<br>");
            safeText = safeText.replace(/\[IMG\](.*?)\[\/IMG\]/g, '<a href="$1" target="_blank"><img src="$1" style="max-width: 100%; border-radius: 8px; margin-top: 6px; border: 1px solid #e5e7eb;"></a>');
            return safeText;
        }

        function renderSingleMessage(data, isSelf) {
            let alignmentClass = isSelf ? "chat-msg-self" : "chat-msg-other";
            let shortName = getShortName(data.name); let displayName = isSelf ? "Bạn" : shortName;
            let actionBtns = ""; let formattedMsg = formatChatMessage(data.msg);
            let msgHtml = `<div class="chat-msg ${alignmentClass}"><span class="sender-name d-flex justify-content-between align-items-center"><span>${displayName}</span>${actionBtns}</span><div class="msg-content" data-raw-text="${data.msg.replace(/"/g, '&quot;')}">${formattedMsg}</div></div>`;
            $('#chatBody').append(msgHtml);
        }

        let isChatOpen = false; let chatInterval = null;

        $(document).ready(function() { if (currentUser) { $('#btnOpenChat').removeClass('d-none'); $('#chatWidget').addClass('minimized'); } });

        let originalLoginStudent = loginStudent;
        loginStudent = function() { originalLoginStudent(); setTimeout(() => { if(currentUser) $('#btnOpenChat').removeClass('d-none'); }, 2000); };

        function toggleChat() {
            if (!currentUser) { alert("Vui lòng đăng nhập để sử dụng tính năng chat!"); return; }
            isChatOpen = !isChatOpen;
            if (isChatOpen) {
                $('#chatWidget').removeClass('minimized').removeClass('d-none'); $('#btnOpenChat').addClass('d-none'); $('#chatUnreadBadge').hide();
                loadChatMessages(); chatInterval = setInterval(loadChatMessages, 10000); 
            } else {
                $('#chatWidget').addClass('minimized'); setTimeout(() => $('#chatWidget').addClass('d-none'), 300);
                $('#btnOpenChat').removeClass('d-none'); clearInterval(chatInterval);
            }
        }

        function sendChatMessage() {
            let input = $('#txtChatMessage'); let message = input.val().trim(); if (!message) return;
            renderSingleMessage({ mssv: currentUser.mssv, name: currentUser.name, msg: message }, true);
            input.val(''); scrollChatToBottom();
            let payload = { action: "sendChat", mssv: currentUser.mssv, name: currentUser.name, message: message };
            postToGAS(payload, function(res) { loadChatMessages(); }, function() { alert("Lỗi khi gửi tin nhắn!"); });
        }

        function loadChatMessages() {
            $.ajax({ url: SCRIPT_URL + "?action=getChatMessages", method: "GET", dataType: "json",
                success: function(data) {
                    let chatBody = $('#chatBody'); chatBody.html('');
                    if (!data || data.length === 0) { chatBody.html('<div class="text-center text-muted small my-3">Phòng chat trống. Hãy gửi lời chào!</div>'); return; }
                    data.forEach(item => { let isSelf = (item.mssv === currentUser.mssv); renderSingleMessage({ mssv: item.mssv, name: item.name, msg: item.message }, isSelf); });
                    scrollChatToBottom();
                }
            });
        }

        function scrollChatToBottom() { let body = document.getElementById("chatBody"); body.scrollTop = body.scrollHeight; }