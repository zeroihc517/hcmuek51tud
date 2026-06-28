
       const sidebar = document.getElementById('sidebarMenu');
        const overlay = document.getElementById('sidebarOverlay');
        const btnToggle = document.getElementById('btnToggleMenu');
        function toggleMenu() { sidebar.classList.toggle('show'); overlay.classList.toggle('show'); }
        btnToggle.addEventListener('click', toggleMenu); overlay.addEventListener('click', toggleMenu);

        function resetNavActive() {
            $('.btn-course').removeClass('active'); $('#btnNavQA').removeClass('active'); $('#btnNavTKB').removeClass('active');
            $('#tongHopSection').addClass('d-none'); $('#courseSection').addClass('d-none');
            $('#qaSection').addClass('d-none'); $('#tkbSection').addClass('d-none');
        }

        function loadTongHopView() {
            resetNavActive(); $('#btnNavTongHop').addClass('active'); $('#tongHopSection').removeClass('d-none');
            if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); }
        }
function pingOnlineStatus() {
            let savedUser = sessionStorage.getItem('currentUser');
            let mssvParam = "Khách"; 
            if (savedUser) {
                try {
                    let userObj = JSON.parse(savedUser);
                    mssvParam = userObj.mssv + "|" + userObj.name; 
                } catch(e) { mssvParam = "Khách"; }
            }
            if (mssvParam === "Khách" && currentUser && currentUser.mssv) { mssvParam = currentUser.mssv + "|" + currentUser.name; }

            $.ajax({ 
                url: SCRIPT_URL + "?action=pingPresence&uuid=" + sessionUUID + "&mssv=" + encodeURIComponent(mssvParam), 
                method: "GET", dataType: "json", cache: false,
                success: function(res) { 
                    if (res && res.list) { 
                        let currentIsAdmin = isAdmin || (currentUser && currentUser.mssv === "51.01.108.008");
                        let processedList = res.list.map(userStr => {
                            let str = String(userStr).trim();
                            if (str.toLowerCase() === "khách" || !str.includes("|")) return str;
                            let parts = str.split("|");
                            let userMssv = parts[0]; let userName = parts[1];
                            if (userMssv === "51.01.108.008") return '<span class="fw-bold" style="color: #facc15; text-transform: uppercase;"><i class="fa-solid fa-user-shield me-1"></i>Admin</span>';
                            if (currentIsAdmin) return userName + " (" + userMssv + ")";
                            return maskMSSV(userMssv);
                        });
                        let displayList = processedList.join(", ");
                        $('#footerOnlineStatus').html(`<i class="fa-solid fa-users me-2"></i> ${res.count} người: <strong>${displayList}</strong>`);
                    } 
                } 
            });
        }
function loadWebLinks() { $.ajax({ url: SCRIPT_URL + "?action=getWebLinks", method: "GET", dataType: "json", success: function(data) { renderWebLinks(data); } }); }
function renderWebLinks(data) { if (!data || data.length === 0) { $('#webLinksContainer').html('<div class="col-12 text-center text-muted py-5"><i class="fa-solid fa-link-slash fs-1 mb-3"></i><br>Chưa có đường link nào.</div>'); return; } let html = ''; data.forEach(row => { let title = row[0] || 'Liên kết'; let desc = row[1] || ''; let url = row[2] || '#'; let iconClass = row[3] || 'fa-solid fa-link'; html += `<div class="col-12 col-md-6"><a href="${url}" target="_blank" class="link-card"><div class="icon-box"><i class="${iconClass}"></i></div><div><h5>${title}</h5><p>${desc}</p></div></a></div>`; }); $('#webLinksContainer').html(html); }

        function renderSidebarCategories() {
            let optionsHtml = '';
            globalCategories.forEach((name) => {
                let lowerName = name.trim().toLowerCase();
                if (lowerName === 'deadlines_admin' || lowerName === 'tkb_admin' || lowerName === 'chathistory') return;
                if (lowerName === 'userregisteredcourses') return; 

                if(lowerName !== 'thông báo') {
                    if (lowerName === 'users' && !isAdmin) return;
                    if (lowerName === 'cauhinhhocky' && !isAdmin) return; 
                    if (lowerName === 'mastertkb' && !isAdmin) return; 

                    let icon = 'fa-folder-closed';
                    if (lowerName === 'users') icon = 'fa-users-gear';
                    if (lowerName === 'cauhinhhocky') icon = 'fa-calendar-check'; 
                    if (lowerName === 'mastertkb') icon = 'fa-table-list'; 
                    optionsHtml += `<button class="btn-course nav-hocphan" onclick="loadDataByHocPhan('${name}', this)"><i class="fa-solid ${icon}"></i> ${name}</button>`;
                }
            });
            $('#dynamicCourseList').html(optionsHtml);
        }

       

        function fetchAndRenderCategories() {
            $('#dynamicCourseList').html('<span class="text-muted small px-2">Đang tải danh sách...</span>');
            $.ajax({ url: SCRIPT_URL + "?action=getHocPhanList", method: "GET", dataType: "json",
                success: function(list) { globalCategories = list; renderSidebarCategories(); if ($('#manageCategoryModal').is(':visible')) { renderCategoryManager(); } }
            });
        }
 function loadDataByHocPhan(sheetName, element) {
            if(!sheetName) return; currentSheetName = sheetName; resetNavActive(); if(element) $(element).addClass('active');
            $('#courseSection').removeClass('d-none'); $('#tableWrapper').addClass('d-none'); $('#swipeHint').addClass('d-none');
            $('#instructorArea').addClass('d-none').html(''); $('#loadingStatus').removeClass('d-none');
            if (isAdmin) $('#adminAddRowArea').removeClass('d-none'); else $('#adminAddRowArea').addClass('d-none');
            if(window.innerWidth < 992) { sidebar.classList.remove('show'); overlay.classList.remove('show'); }
            $.ajax({ url: SCRIPT_URL + "?action=getHocPhanData&sheetName=" + encodeURIComponent(sheetName), method: "GET", dataType: "json",
                success: function(data) {
                    if (!data || data.length === 0) { currentSheetTotalRows = 1; $('#sheetTableBody').html('<tr><td colspan="5" class="text-center py-5 text-muted"><i class="fa-regular fa-folder-open fs-1 mb-3 d-block"></i>Chưa có dữ liệu.</td></tr>'); $('#loadingStatus').addClass('d-none'); $('#tableWrapper').removeClass('d-none'); $('#swipeHint').removeClass('d-none'); return; }
                    currentSheetTotalRows = data.length; let bodyHtml = ''; let headHtml = ''; let instructorInfos = [];
                    data.forEach((row, rowIndex) => {
                        let fullRowText = row.join(" ").toLowerCase().replace(/\s+/g, ''); let firstCellTextRaw = String(row[0]).trim(); let firstCellText = firstCellTextRaw.toLowerCase().replace(/\s+/g, '');
                        if (rowIndex === 0) { headHtml += `<th style="width: 3%; min-width: 120px;">${String(row[0] || 'STT')}</th><th style="min-width: 280px;">${String(row[1] || 'Nội dung')}</th><th style="width: 15%; min-width: 140px;">${String(row[2] || 'Hình thức')}</th><th style="width: 15%; min-width: 160px;">${String(row[4] || row[3] || 'Tài liệu học tập')}</th>`; if (isAdmin) headHtml += `<th style="width: 180px; min-width: 180px;">Thao tác</th>`; return; }
                        if (/mãhp|họcphần|gv\d|giảngviên|email|facebook|sốtínchỉ/.test(fullRowText)) { let info = row.filter(cell => String(cell).trim() !== "").join(" <span class='mx-2 text-black-50'>|</span> "); if(info) instructorInfos.push(info); return; }
                        let isNewRow = /^new$/i.test(firstCellTextRaw) || firstCellTextRaw.toLowerCase().includes('new'); let rowClass = 'grid-row'; let iconPrefix = '';
                        if (isNewRow) { rowClass += ' row-new'; } else if (/ngânhàng/.test(fullRowText)) { rowClass += ' row-white'; iconPrefix = '<i class="fa-solid fa-box-archive me-2 text-secondary"></i>'; } else if (/bàithi|kiểmtra|đềthi|lịchthi|phòngthi/.test(fullRowText) || row.join(" ").toLowerCase().includes(' thi ')) { rowClass += ' row-exam'; iconPrefix = '<i class="fa-solid fa-triangle-exclamation me-2 text-danger"></i>'; } else if (/chủđề|chương/.test(firstCellText)) { rowClass += ' row-topic'; } else if (/bài/.test(firstCellText)) { rowClass += ' row-lesson'; iconPrefix = '<i class="fa-solid fa-folder-open me-2 text-success"></i>'; }
                        bodyHtml += `<tr class="${rowClass}">`;
                        row.forEach((cell, cellIndex) => {
                            if (cellIndex > 3) return;  let cellText = String(cell).trim();
                            if (cellIndex === 0 && isNewRow) cellText = cellText.replace(/new/i, '<span class="badge-new">Mới</span>');
                            let _urlRegex = /(https?:\/\/[^\s]+)/g; let _match = cellText.match(_urlRegex); let extractedUrl = _match ? _match[0] : null;
                            if (extractedUrl) { let label = cellText.replace(extractedUrl, '').trim() || "Truy cập"; bodyHtml += `<td><a href="${extractedUrl}" target="_blank" class="btn-portal-action"><i class="fa-solid fa-cloud-arrow-down"></i> ${label}</a></td>`; } 
                            else { if (cellText === "") bodyHtml += `<td></td>`; else bodyHtml += `<td>${cellIndex === 0 && !isNewRow ? iconPrefix + cellText : cellText}</td>`; }
                        });
                        if (isAdmin) {
                            let sheetRowIndex = rowIndex + 1; let c1 = String(row[0]||'').replace(/'/g, "\\'"); let c2 = String(row[1]||'').replace(/'/g, "\\'"); let c3 = String(row[2]||'').replace(/'/g, "\\'"); let c4 = String(row[3]||'').replace(/'/g, "\\'");
                            bodyHtml += `<td><div class="d-flex flex-wrap gap-1"><button class="btn btn-sm btn-outline-secondary py-1 px-2" title="Chuyển lên" onclick="moveRowItem(${sheetRowIndex}, 'up')"><i class="fa-solid fa-arrow-up"></i></button><button class="btn btn-sm btn-outline-secondary py-1 px-2" title="Chuyển xuống" onclick="moveRowItem(${sheetRowIndex}, 'down')"><i class="fa-solid fa-arrow-down"></i></button><button class="btn btn-sm btn-outline-success py-1 px-2" title="Chèn vào dưới" onclick="openInsertRowModal(${sheetRowIndex})"><i class="fa-solid fa-plus"></i></button><button class="btn btn-sm btn-outline-warning py-1 px-2" title="Sửa dòng này" onclick="openEditRowModal(${sheetRowIndex}, '${c1}', '${c2}', '${c3}', '${c4}')"><i class="fa-solid fa-pen"></i></button><button class="btn btn-sm btn-outline-danger py-1 px-2" title="Xóa bỏ" onclick="deleteRowItem(${sheetRowIndex})"><i class="fa-solid fa-trash"></i></button></div></td>`;
                        } bodyHtml += '</tr>';
                    });
                    if (instructorInfos.length > 0) { let cardContent = `<div class="instructor-card"><h6 class="mb-4"><i class="fa-solid fa-chalkboard-user me-2"></i>Thông tin lớp học & Giảng viên phụ trách</h6><div class="row">`; instructorInfos.forEach(info => { cardContent += `<div class="col-12 col-md-6 instructor-item"><i class="fa-solid fa-check"></i> <span>${info}</span></div>`; }); cardContent += `</div></div>`; $('#instructorArea').html(cardContent).removeClass('d-none'); }
                    $('#sheetTableHead').html(headHtml); $('#sheetTableBody').html(bodyHtml); $('#loadingStatus').addClass('d-none'); $('#tableWrapper').removeClass('d-none'); $('#swipeHint').removeClass('d-none');
                },
                error: function() { $('#loadingStatus').html('<span class="text-danger fw-bold">Có lỗi xảy ra khi tải dữ liệu!</span>'); }
            });
        }
function initGlobalApp() {
            $('.app-container, .mobile-header').css('display', '');
            setTimeout(pingOnlineStatus, 1000); setInterval(pingOnlineStatus, 25000);
            fetchSemesterConfig(); 
            loadDataByHocPhan('Thông báo', document.getElementById('btnNavThongBao')); 
            loadWebLinks(); checkNewQA(); fetchAndRenderCategories();
        }

        $(document).ready(function() {
            if (!currentUser) {
                let authModal = new bootstrap.Modal(document.getElementById('userAuthModal'), { backdrop: 'static', keyboard: false });
                $('#userAuthModal .btn-close').hide(); 
                renderSavedAccounts(); 
                authModal.show();
            } else { initGlobalApp(); }
        });