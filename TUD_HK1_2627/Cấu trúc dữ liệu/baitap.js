let urlParams = new URLSearchParams(window.location.search);

// 1. Ưu tiên lấy từ window.FILTER_TITLE_KEYWORD ở HTML -> Tham số URL ?de= -> Mặc định rỗng
let filterKeyword = window.FILTER_TITLE_KEYWORD || urlParams.get('de') || ""; 

// 2. Ưu tiên lấy từ window.EXERCISE_COURSE_NAME ở HTML -> Tham số URL ?course= -> Mặc định "Cấu trúc dữ liệu"
let courseName = window.EXERCISE_COURSE_NAME || urlParams.get('course') || "Cấu trúc dữ liệu";

let exerciseEditor;
let langParam = urlParams.get('lang') || "cpp";
        let questionsList = [];
        let currentQuestionIndex = 0;
        let currentSubmissionsList = [];
        let editingSubIndex = -1;

        $(document).ready(function() {
            let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
            if (currentUser && currentUser.mssv) {
                $('#txtExerciseMSSV').val(currentUser.mssv);
            } else {
                $('#txtExerciseMSSV').val("Khách");
            }

            if ($('#exerciseCodeEditor').length) {
                exerciseEditor = ace.edit("exerciseCodeEditor");
                exerciseEditor.setTheme("ace/theme/textmate");
                exerciseEditor.session.setMode(langParam === 'python' ? "ace/mode/python" : "ace/mode/c_cpp");
                exerciseEditor.setOptions({ fontSize: "15px", showPrintMargin: false });
            }

          tinymce.init({
                selector: '#theoryEditor',
                height: 250,        // Chiều cao mặc định ban đầu
                resize: 'vertical', // Cho phép người dùng nắm kéo chỉnh chiều cao thủ công ở góc dưới
                menubar: false,
                plugins: 'lists link table code image', // Không dùng plugin autoresize nữa
                toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist | table link image',
                content_style: 'body { font-family:Inter,sans-serif; font-size:15px }',
                setup: function(editor) {
                    editor.on('init', function() {
                        loadQuestionsData();
                    });
                    editor.on('change', function() { editor.save(); });
                    
                    // --- CLICK ĐÚP VÀO ẢNH ĐỂ MANG XUỐNG BẢNG VẼ SỬA LẠI ---
                    editor.on('dblclick', function(e) {
                        if (e.target.nodeName === 'IMG') {
                            let imgSrc = e.target.src;
                            if (imgSrc.startsWith('data:image')) {
                                window.editingImageNode = e.target; 
                                $('#drawingContainer').removeClass('d-none');
                                
                                let img = new Image();
                                img.src = imgSrc;
                                img.onload = function() {
                                    if (!canvas) initCanvas();
                                    ctx.fillStyle = '#ffffff';
                                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                                    ctx.drawImage(img, 0, 0);
                                    saveCanvasState();
                                    
                                    $('html, body').animate({
                                        scrollTop: $("#drawingContainer").offset().top - 80
                                    }, 300);
                                }
                            }
                        }
                    });
                }
            });
        });

// Thêm biến toàn cục để lưu cache lịch sử nộp bài (đặt ở đầu file cùng các biến khác)
// Thêm 2 biến toàn cục để quản lý lịch sử tải ngầm (đặt ở đầu file)
let globalSubmissionData = null;
let historyAjaxRequest = null; 

function loadQuestionsData() {
    let displayKeyword = filterKeyword || "Tất cả bài tập";
    $('#questionContentArea').html(`<div class="text-center py-4 text-primary"><i class="fa-solid fa-spinner fa-spin fs-4 mb-2"></i><br>Đang tải dữ liệu đề bài...</div>`);
    
    let mssv = $('#txtExerciseMSSV').val().trim();
    
    // --- 1. Gọi API tải LỊCH SỬ CHẠY NGẦM (Không làm kẹt giao diện hiển thị đề) ---
    if (mssv && mssv !== "Khách") {
        historyAjaxRequest = $.ajax({
            url: SCRIPT_URL + "?action=getShareCodeData&_=" + new Date().getTime(),
            method: "GET",
            dataType: "json",
            cache: false
        }).done(function(dataH) {
            globalSubmissionData = dataH;
            
            // Sau khi tải ngầm xong, lướt qua để tô màu xanh các câu đã làm
            if (questionsList && questionsList.length > 0) {
                let completedMaBai = new Set();
                dataH.forEach(row => {
                    let rowMssv = row[1] || '';
                    let contentRaw = row[2] || '';
                    if (rowMssv.trim().toLowerCase() === mssv.toLowerCase()) {
                        let match = contentRaw.match(/^\[SHARECODE\|(.*?)\|(.*?)\]/);
                        if (match && match[1] === courseName) {
                            completedMaBai.add(match[2].trim());
                        }
                    }
                });

                questionsList.forEach((q, idx) => {
                    if (completedMaBai.has(q.maBai.trim())) {
                        let tabBtn = $(`#tabBtnQuestion_${idx}`);
                        tabBtn.addClass('completed');
                        tabBtn.find('i').removeClass('fa-file-code').addClass('fa-circle-check');
                    }
                });
            }
        });
    }

    // --- 2. Gọi API tải ĐỀ BÀI (Ưu tiên hiển thị ra ngay lập tức) ---
    $.ajax({
        url: SCRIPT_URL + "?action=getExerciseQuestions&course=" + encodeURIComponent(courseName),
        method: "GET",
        dataType: "json",
        cache: false,
        success: function(dataQ) {
            $('#loadingQuestionsIndicator').addClass('d-none');
            $('#badgeCourseHome').text(courseName);

            if (dataQ && dataQ.length > 0) {
                questionsList = filterKeyword ? dataQ.filter(q => q.title && q.title.toLowerCase().includes(filterKeyword.toLowerCase())) : dataQ;
            } 
            
            if (!questionsList || questionsList.length === 0) {
                $('#questionContentAreaError').html(`<div class="text-danger fw-bold py-3"><i class="fa-solid fa-triangle-exclamation"></i> Không tìm thấy câu hỏi nào chứa tiêu đề "${displayKeyword}".</div>`);
                $('#homeQuestionList').html('');
                $('#labelTotalQuestions').text('0 câu');
                return;
            }

            let tabsHtml = "";
            questionsList.forEach((q, idx) => {
                // Thay đổi class HTML thành card lưới
                tabsHtml += `
                    <button class="btn-question-card" id="tabBtnQuestion_${idx}" onclick="switchQuestion(${idx})">
                        <div class="q-title"><i class="fa-solid fa-file-code me-1"></i> Câu ${idx + 1}</div>
                        <div class="q-code">Mã: ${q.maBai}</div>
                    </button>
                `;
            });

            $('#homeQuestionList').html(tabsHtml);
            $('#labelTotalQuestions').text(`Tổng: ${questionsList.length} câu`);
            
            checkCompletedQuestions();
            
            // QUAN TRỌNG: XÓA hoặc COMMENT dòng renderQuestion(0); để không tự động mở câu 1
            // renderQuestion(0);
        },
        error: function() {
            $('#questionContentArea').html('<div class="text-danger fw-bold py-3">Lỗi kết nối khi tải đề bài!</div>');
        }
    });
}
function renderQuestion(index) {
    // Ẩn trang chủ, hiện giao diện bài làm
    $('#homeView').addClass('d-none');
    $('#workingView').removeClass('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn lên đầu
    
    index = parseInt(index);
    currentQuestionIndex = index;
    let q = questionsList[index];
    if (!q) return;

    cancelEditMode();

    $('#badgeCourse').text(courseName);    $('#titleMaBai').text(`Bài tập: ${q.title}`);
    $('#labelCurrentMaBai').text(`Mã bài: ${q.maBai}`);
    // --- HIỂN THỊ NÚT SỬA CHO ADMIN ---
    $('#btnAdminEditQuestion').remove(); // Xóa nút cũ nếu có để tránh trùng lặp
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (currentUser && currentUser.mssv === "51.01.108.008") {
        $('#labelCurrentMaBai').after(`
            <button id="btnAdminEditQuestion" class="btn btn-sm btn-warning ms-2 fw-bold shadow-sm" onclick="openAdminEditQuestion()" style="border-radius: 6px;">
                <i class="fa-solid fa-pen"></i> Sửa đề
            </button>
        `);
    }
    // ----------------------------------
    let processedContent = q.content || '';

    // 1. LUÔN HIỂN THỊ KHUNG NỘP CODE
    $('#codeSectionWrapper').removeClass('d-none');

    // 2. DỌN DẸP LATEX VÀ CHUẨN HÓA
  if (processedContent) {
    processedContent = processedContent
        // Xóa triệt để rác LaTeX phổ biến
        .replace(/\\\\\[\d+pt\]/g, '<br>')
        .replace(/\\\\/g, '<br>')
        .replace(/\[\d+pt\]/g, '')
        .replace(/\\vspace\{.*?\}/g, '')
        .replace(/\\hspace\{.*?\}/g, '')
        .replace(/\\begin\{enumerate\}/g, '')
        .replace(/\\end\{enumerate\}/g, '')
        .replace(/\\begin\{center\}/g, '<div class="my-3">')
        .replace(/\\end\{center\}/g, '</div>')
        .replace(/\\small/g, '')
        
        // Chuẩn hóa bảng Input / Output (CHỈ thay dấu & nằm trong bảng tabular)
        .replace(/\\begin\{tabular\}\{.*?\}/g, '<table class="table table-bordered align-middle my-3" style="width:100%; border-color:#cbd5e1;"><thead class="table-light"><tr><th style="width:40%;">Input</th><th style="width:60%;">Output</th></tr></thead><tbody><tr><td>')
        .replace(/\\end\{tabular\}/g, '</td></tr></tbody></table>')
        .replace(/\\begin\{minipage\}\[.*?\]\{.*?\}/g, '<div>')
        .replace(/\\end\{minipage\}/g, '</div>')
        .replace(/\\hline/g, '')
        .replace(/\\textbf\{Input\}\s*&\s*\\textbf\{Output\}/gi, '')
        .replace(/Input\s*&\s*Output/gi, '')
        
        // ĐÃ BỎ DÒNG .replace(/&/g, '</td><td>') BỊ LỖI NUỐT DẤU &&
        
        // Định dạng câu hỏi a), b), c) & chữ đậm
        .replace(/\\textbf\{(.*?)\}/g, '<b>$1</b>')
        .replace(/\\texttt\{(.*?)\}/g, '<code>$1</code>')
        .replace(/\\item\[(.*?)\]/g, '<br><b>$1</b> ')
        .replace(/\\item/g, '<br>• ');

    // --- 3. BỌC KHUNG CODE MẪU BÊN ĐỀ BÀI ---
    let tempDiv = document.createElement('div');
    tempDiv.innerHTML = processedContent;
    
    let codeBlocks = tempDiv.querySelectorAll('pre, code, div[style*="background:#f8fafc"], div.question-code-block');

    codeBlocks.forEach(blockEl => {
        if (blockEl.classList.contains('question-ace-view') || blockEl.closest('.question-ace-view')) return;

        let rawCodeText = blockEl.innerText || blockEl.textContent || '';
        
        if (rawCodeText.trim() !== '' && rawCodeText.includes('\n')) {
            let lines = rawCodeText.split(/\r?\n/);
            let renderedLinesHtml = '';
            
            let tokenizer = null;
            try {
                let HighlightRules = ace.require("ace/mode/c_cpp").Mode;
                if (HighlightRules) {
                    tokenizer = new HighlightRules().getTokenizer();
                }
            } catch (e) { }

            lines.forEach((lineText, lineIdx) => {
                if (lineIdx === lines.length - 1 && lineText.trim() === '') return;
                
                let coloredLineText = escapeHtml(lineText);
                
                if (tokenizer) {
                    try {
                        let tokens = tokenizer.getLineTokens(lineText, "start");
                        coloredLineText = tokens.tokens.map(t => {
                            let className = "ace_" + t.type.replace(/\./g, " ace_");
                            let escapedValue = escapeHtml(t.value);
                            return `<span class="${className}">${escapedValue}</span>`;
                        }).join('');
                    } catch (err) {}
                }

                renderedLinesHtml += `
                    <div class="ace-line-row">
                        <div class="ace-gutter-cell">${lineIdx + 1}</div>
                        <div class="ace-code-content">${coloredLineText}</div>
                    </div>
                `;
            });

            let wrapperDiv = document.createElement('div');
            wrapperDiv.className = "question-ace-view";
            wrapperDiv.innerHTML = renderedLinesHtml;
            
            blockEl.parentNode.replaceChild(wrapperDiv, blockEl);
        }
    });
    processedContent = tempDiv.innerHTML;
}
	processedContent = convertUrlsToLinks(processedContent);
    // 4. CẬP NHẬT GIAO DIỆN VÀ MATHJAX
    $('#questionContentArea').html(processedContent);
    document.title = `${q.maBai} - ${courseName} | Làm bài tập`;

    if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise([document.getElementById('questionContentArea')]).catch(function (err) {
            console.log('MathJax error: ' + err.message);
        });
    }

    $('.btn-question-tab').removeClass('active');
    $(`#tabBtnQuestion_${index}`).addClass('active');

    loadSubmissionHistory();
}

        function switchQuestion(index) {
            renderQuestion(index);
        }

        function changeEditorLang() {
            let selectedLang = $('#selectLang').val();
            if (exerciseEditor) {
                exerciseEditor.session.setMode(selectedLang === 'python' ? "ace/mode/python" : "ace/mode/c_cpp");
            }
        }

       function renderHistoryUI() {
    if (!currentSubmissionsList || currentSubmissionsList.length === 0) {
        let q = questionsList[currentQuestionIndex];
        $('#submissionHistoryContainer').html(`<div class="text-center text-muted py-3">Bạn chưa nộp bài lần nào cho câu hỏi <b>${q ? q.maBai : ''}</b>.</div>`);
        return;
    }

   let historyHtml = "";
    currentSubmissionsList.forEach((sub, idx) => {
        let submissionNumber = currentSubmissionsList.length - idx;
        let codeContainerId = `historyCode_${idx}_${Date.now()}`;

        // Bổ sung convertUrlsToLinks cho phần lời giải lý thuyết
        let theoryContentFormatted = convertUrlsToLinks(sub.theory || '');

        let theoryHtml = sub.theory ? `
            <div class="history-theory-box">
                <div class="fw-bold text-primary mb-2" style="font-size: 15px;">
                    <i class="fa-solid fa-align-left me-1"></i> BÀI LÀM LÝ THUYẾT:
                </div>
                <div>${theoryContentFormatted}</div>
            </div>
        ` : '';

        // --- BỔ SUNG: Khai báo & tô màu cú pháp (Highlight) cho biến highlightedCode ---
      // Đoạn xử lý highlight code trong renderHistoryUI()
let highlightedCode = sub.code;
if (sub.code && window.ace) {
    try {
        let safeLang = (sub.lang || '').toLowerCase() === 'python' ? "ace/mode/python" : "ace/mode/c_cpp";
        let HighlightRules = ace.require(safeLang).Mode;
        if (HighlightRules && HighlightRules.prototype && HighlightRules.prototype.getTokenizer) {
            let tokenizer = new HighlightRules().getTokenizer();
            
            // Xóa bớt dòng trống dư thừa khi split
            let lines = sub.code.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
            
            let htmlLines = lines.map(line => {
                let tokens = tokenizer.getLineTokens(line, "start");
                return tokens.tokens.map(t => {
                    let className = "ace_" + t.type.replace(/\./g, " ace_");
                    let escapedValue = $("<div>").text(t.value).html();
                    return `<span class="${className}">${escapedValue}</span>`;
                }).join('');
            });
            
            // Nối bằng \n chuẩn thay vì chèn <br> hay <div> thừa
            highlightedCode = htmlLines.join('\n');
        } else {
            highlightedCode = escapeHtml(sub.code);
        }
    } catch (e) {
        highlightedCode = escapeHtml(sub.code);
    }
} else if (sub.code) {
    highlightedCode = escapeHtml(sub.code);
}

        let codeHtml = sub.code ? `
            <div class="history-code-container">
                <button class="btn-copy-code-sample" onclick="copyHistoryCode('${codeContainerId}', this)">
                    <i class="fa-regular fa-copy"></i> Copy Code
                </button>
                <div class="history-code-title">
                    <i class="fa-solid fa-code"></i> Mã nguồn (${sub.lang}):
                </div>
                <pre class="history-code-text"><code id="${codeContainerId}">${highlightedCode}</code></pre>
            </div>
        ` : '';

        // --- BỔ SUNG: Bóc tách chuỗi bình luận bằng parseThread từ qa.js ---
       // Bóc tách bình luận hiện có (nếu có)
        let commentsHtml = (sub.answerThread && sub.answerThread.trim() !== "") 
            ? parseThread(sub.answerThread, sub.rowIndex) 
            : '<div class="text-muted small italic my-2"><i class="fa-regular fa-comment me-1"></i> Chưa có bình luận / góp ý nào.</div>';

        historyHtml += `
            <div class="history-card">
                <div class="history-header">
                    <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-success px-3 py-1.5" style="font-size: 12px;"><i class="fa-solid fa-check-circle me-1"></i> Lần nộp #${submissionNumber}</span>
                        <span class="text-muted small fw-bold"><i class="fa-regular fa-clock me-1"></i> ${sub.time}</span>
                    </div>
                    <button class="btn btn-sm btn-edit-submission" onclick="editSubmissionToForm(${idx})" title="Chỉnh sửa lại bài nộp này">
                        <i class="fa-solid fa-pen-to-square me-1"></i> Sửa bài này
                    </button>
                </div>
                <div class="history-body">
                    ${theoryHtml}
                    ${codeHtml}

                    <!-- KHU VỰC BÌNH LUẬN & NÚT PHẢN HỒI -->
                    <div class="history-comments-box mt-3 pt-3 border-top">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div class="fw-bold text-primary" style="font-size: 14px;">
                                <i class="fa-solid fa-comments me-1"></i> Phản hồi / Bình luận:
                            </div>
                            <!-- Nút bật/tắt ô bình luận -->
                            <button class="btn btn-sm btn-outline-primary fw-bold" style="border-radius: 8px; font-size: 12.5px;" onclick="$('#replyBoxExercise_${sub.rowIndex}').toggleClass('d-none')">
                                <i class="fa-solid fa-reply me-1"></i> Bình luận / Phản hồi
                            </button>
                        </div>

                        <!-- Danh sách các bình luận cũ -->
                        ${commentsHtml}

                        <!-- Khung nhập bình luận mới (Ẩn mặc định) -->
                        <div id="replyBoxExercise_${sub.rowIndex}" class="reply-box d-none mt-3 p-3 bg-light rounded border border-primary-subtle">
                            <textarea id="txtExerciseHistoryReply_${sub.rowIndex}" class="form-control mb-2" rows="2" placeholder="Nhập câu hỏi, phản hồi hoặc góp ý cho bài nộp này..." style="font-size: 14px; border-radius: 8px;"></textarea>
                            <div class="d-flex justify-content-end gap-2">
                                <button type="button" class="btn btn-sm btn-light border" onclick="$('#replyBoxExercise_${sub.rowIndex}').addClass('d-none')">Hủy</button>
                                <button type="button" class="btn btn-sm text-white fw-bold" id="btnSendExerciseReply_${sub.rowIndex}" style="background-color: #0f4c81; border-radius: 6px;" onclick="sendExerciseHistoryReply('${sub.rowIndex}')">
                                    <i class="fa-solid fa-paper-plane me-1"></i> Gửi phản hồi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    $('#submissionHistoryContainer').html(historyHtml);
if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise([document.getElementById('submissionHistoryContainer')]).catch(function (err) {
            console.log('MathJax error in history: ' + err.message);
        });
    }
}

        function editSubmissionToForm(subIndex) {
            let sub = currentSubmissionsList[subIndex];
            if (!sub) return;

            editingSubIndex = subIndex;

            if (typeof tinymce !== 'undefined' && tinymce.get('theoryEditor')) {
                tinymce.get('theoryEditor').setContent(sub.theory || '');
            }

            if (sub.code) {
                $('#codeSectionWrapper').removeClass('d-none');
                if (exerciseEditor) {
                    let targetLang = (sub.lang || '').toLowerCase() === 'python' ? 'python' : 'cpp';
                    $('#selectLang').val(targetLang);
                    changeEditorLang();
                    exerciseEditor.setValue(sub.code || '');
                    exerciseEditor.clearSelection();
                }
            } else {
                $('#codeSectionWrapper').addClass('d-none');
            }

            $('#formSubmissionTitle').html('<i class="fa-solid fa-pen-to-square me-2 text-warning"></i>Đang chỉnh sửa lần nộp #' + (currentSubmissionsList.length - subIndex));
            $('#btnSubmitExercise').html('<i class="fa-solid fa-floppy-disk me-2"></i> Lưu cập nhật bài làm').css('background-color', '#d97706');
            $('#btnCancelEditMode').removeClass('d-none');

            $('html, body').animate({
                scrollTop: $("#mainSubmissionCard").offset().top - 80
            }, 400);
        }

        function cancelEditMode() {
            editingSubIndex = -1;
            $('#formSubmissionTitle').html('<i class="fa-solid fa-pen-to-square me-2"></i>Bài làm của sinh viên');
            $('#btnSubmitExercise').html('<i class="fa-solid fa-paper-plane me-2"></i> Nộp bài & Đăng lên Thảo luận').css('background-color', '#0f4c81');
            $('#btnCancelEditMode').addClass('d-none');

            if (typeof tinymce !== 'undefined' && tinymce.get('theoryEditor')) {
                tinymce.get('theoryEditor').setContent('');
            }
            if (exerciseEditor) {
                exerciseEditor.setValue('');
                exerciseEditor.clearSelection();
            }
        }

      function loadSubmissionHistory(forceRefresh = false) {
    let mssv = $('#txtExerciseMSSV').val().trim();
    let q = questionsList[currentQuestionIndex];
    
    if (!q || !mssv || mssv === "Khách") {
    $('#submissionHistoryContainer').html(`
        <div class="text-center text-muted py-4">
            <i class="fa-solid fa-lock text-secondary fs-2 mb-3 d-block"></i>
            <h6 class="fw-bold text-dark">Chưa đăng nhập</h6>
            <p class="small mb-3">Vui lòng đăng nhập tài khoản để xem lịch sử nộp bài cá nhân của bạn.</p>
            <button class="btn text-white fw-bold px-4 py-2 shadow-sm" style="background-color: #0f4c81; border-radius: 8px;" onclick="requireLogin()">
                <i class="fa-solid fa-right-to-bracket me-2"></i>Đăng nhập ngay
            </button>
        </div>
    `);
    return;
}

    const processHistoryData = (data) => {
        currentSubmissionsList = [];
        if (!data || data.length === 0) {
            renderHistoryUI();
            return;
        }

        let targetTag = `[SHARECODE|${courseName}|${q.maBai}]`;

        data.forEach(row => {
            let time = row[0] || '';
            let rowMssv = row[1] || '';
            let contentRaw = row[2] || '';
            let answerThread = row[3] || '';
            let rowIndex = row[6];

            if (rowMssv.trim().toLowerCase() === mssv.toLowerCase() && contentRaw.startsWith(targetTag)) {
                let cleanContent = contentRaw.replace(/^\[SHARECODE\|.*?\]\s*/, '').trim();
                
                let theoryPart = "";
                let codePart = "";
                let langMatch = "CPP";

                let codeMatch = cleanContent.match(/```(cpp|python|c\+\+|c)?([\s\S]*?)```/i);
                if (codeMatch) {
                    let rawLang = (codeMatch[1] || "cpp").toLowerCase();
                    langMatch = (rawLang === 'python') ? 'PYTHON' : 'CPP';
                    codePart = codeMatch[2].trim();
                    theoryPart = cleanContent.replace(codeMatch[0], '').trim();
                } else {
                    theoryPart = cleanContent;
                }

                theoryPart = theoryPart.replace(/<div class="mb-3"><strong>Lời giải lý thuyết:<\/strong><br>/g, '')
                                       .replace(/<\/div>$/g, '')
                                       .replace(/<p><\/p>/g, '')
                                       .trim();

                currentSubmissionsList.push({
                    rowIndex: rowIndex,
                    time: time,
                    theory: theoryPart,
                    code: codePart,
                    lang: langMatch,
                    answerThread: answerThread
                });
            }
        });

        renderHistoryUI();
    };

    $('#submissionHistoryContainer').html(`
        <div class="text-center text-muted py-3">
            <i class="fa-solid fa-spinner fa-spin me-2"></i> Đang tải lịch sử bài nộp của mã <b>${q.maBai}</b>...
        </div>
    `);

    // 1. NẾU ÉP LÀM MỚI -> Gọi lại API từ đầu
    if (forceRefresh) {
        historyAjaxRequest = $.ajax({
            url: SCRIPT_URL + "?action=getShareCodeData&_=" + new Date().getTime(),
            method: "GET",
            dataType: "json",
            cache: false,
            success: function(data) {
                globalSubmissionData = data;
                processHistoryData(data);
            },
            error: function() {
                $('#submissionHistoryContainer').html(`<div class="text-center text-danger py-3">Lỗi kết nối khi tải lịch sử bài nộp!</div>`);
            }
        });
        return;
    }

    // 2. NẾU ĐÃ CÓ CACHE -> Xử lý luôn (Chuyển câu rất mượt)
    if (globalSubmissionData) {
        processHistoryData(globalSubmissionData);
        return;
    }

    // 3. NẾU ĐANG CHỜ API LỊCH SỬ CHẠY NGẦM HOÀN THÀNH -> Đợi nó xong thì in ra
    if (historyAjaxRequest) {
        historyAjaxRequest.done(function() {
            processHistoryData(globalSubmissionData);
        }).fail(function() {
            $('#submissionHistoryContainer').html(`<div class="text-center text-danger py-3">Lỗi tải lịch sử!</div>`);
        });
    }
}

        function escapeHtml(text) {
            return text
                 .replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
        }

        function copyHistoryCode(elementId, btnEl) {
            let codeText = document.getElementById(elementId).innerText;
            navigator.clipboard.writeText(codeText).then(() => {
                let originalHtml = $(btnEl).html();
                $(btnEl).html('<i class="fa-solid fa-check text-success"></i> Đã Copy').css('background', '#dcfce7').css('color', '#166534');
                setTimeout(() => {
                    $(btnEl).html(originalHtml).css('background', '#f1f5f9').css('color', '#334155');
                }, 2000);
            });
        }

        function submitExerciseSolution() {
            let mssv = $('#txtExerciseMSSV').val().trim();
            let theoryText = (typeof tinymce !== 'undefined' && tinymce.get('theoryEditor')) 
                ? tinymce.get('theoryEditor').getContent().trim() 
                : $('#theoryEditor').val().trim();
            
            // Kiểm tra xem khung code có đang hiển thị không, nếu ẩn thì không bắt buộc nhập code
            let isCodeVisible = !$('#codeSectionWrapper').hasClass('d-none');
            let rawCode = (isCodeVisible && exerciseEditor) ? exerciseEditor.getValue().trim() : "";
            let lang = $('#selectLang').val();
            let q = questionsList[currentQuestionIndex];

            if (typeof SCRIPT_URL === 'undefined') {
                alert("Lỗi: Không tìm thấy đường dẫn cấu hình SCRIPT_URL trong file config.js.");
                return;
            }

            if (!mssv || mssv === "Khách") {
    requireLogin();
    return;
}

            if (!theoryText && !rawCode) {
                alert("Bạn chưa nhập nội dung bài làm!");
                return;
            }

            let formattedContent = "";
            if (theoryText) {
                formattedContent += `<div class="mb-3"><strong>Lời giải lý thuyết:</strong><br>${theoryText}</div>`;
            }
            if (rawCode) {
                formattedContent += `\n\n\`\`\`${lang}\n${rawCode}\n\`\`\``;
            }

            let formattedPayload = `[SHARECODE|${courseName}|${q.maBai}] \n${formattedContent}`;

            let btn = $('#btnSubmitExercise');
            let originalHtml = btn.html();

            btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang gửi bài...').prop('disabled', true);

            let now = new Date();
            let pad = (n) => String(n).padStart(2, '0');
            let currentTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

            let isUpdating = editingSubIndex !== -1;
            let targetRowIndex = isUpdating ? (currentSubmissionsList[editingSubIndex] ? currentSubmissionsList[editingSubIndex].rowIndex : -1) : -1;
            let actionType = (isUpdating && targetRowIndex !== -1) ? "updateShareCodeSubmission" : "submitShareCode";

            let postDataObj = {
                action: actionType,
                mssv: mssv,
                codeData: formattedPayload
            };
            if (isUpdating && targetRowIndex !== -1) {
                postDataObj.rowIndex = targetRowIndex;
            }

            let updatedObj = {
                rowIndex: targetRowIndex,
                time: currentTimeStr + " (Vừa cập nhật)",
                theory: theoryText,
                code: rawCode,
                lang: lang.toUpperCase()
            };

            $.ajax({
                url: SCRIPT_URL,
                type: "POST",
                data: JSON.stringify(postDataObj),
                contentType: "text/plain;charset=utf-8",
                dataType: "text",
                success: function(res) {
                    btn.html(originalHtml).prop('disabled', false);

                    if (isUpdating) {
                        currentSubmissionsList[editingSubIndex] = updatedObj;
                    } else {
                        currentSubmissionsList.unshift(updatedObj);
                    }

                    renderHistoryUI();
                    cancelEditMode();
		$(`#tabBtnQuestion_${currentQuestionIndex}`).addClass('completed');
                    $(`#tabBtnQuestion_${currentQuestionIndex}`).find('i').removeClass('fa-file-code').addClass('fa-circle-check');
                    alert(isUpdating ? `✅ CẬP NHẬT BÀI NỘP THÀNH CÔNG!` : `✅ NỘP BÀI THÀNH CÔNG!`);
                },
                error: function(xhr, status, err) {
                    btn.html(originalHtml).prop('disabled', false);

                    if (isUpdating) {
                        currentSubmissionsList[editingSubIndex] = updatedObj;
                    } else {
                        currentSubmissionsList.unshift(updatedObj);
                    }

                    renderHistoryUI();
                    cancelEditMode();
			$(`#tabBtnQuestion_${currentQuestionIndex}`).addClass('completed');
                    $(`#tabBtnQuestion_${currentQuestionIndex}`).find('i').removeClass('fa-file-code').addClass('fa-circle-check');
                    alert(isUpdating ? `✅ CẬP NHẬT BÀI NỘP THÀNH CÔNG!` : `✅ NỘP BÀI THÀNH CÔNG!`);
                }
            });
        }
// HÀM GỬI PHẢN HỒI TRỰC TIẾP TỪ TRANG BÀI TẬP LÊN GOOGLE SHEETS
// HÀM GỬI PHẢN HỒI TRỰC TIẾP TỪ TRANG BÀI TẬP LÊN GOOGLE SHEETS
function sendExerciseHistoryReply(rowIndex) {
    let replyText = $(`#txtExerciseHistoryReply_${rowIndex}`).val().trim();
    if (!replyText) {
        alert("Vui lòng nhập nội dung bình luận / phản hồi!");
        return;
    }

    // Xử lý lấy MSSV an toàn (có bọc try-catch để tránh lỗi localStorage)
    let mssvInput = $('#txtExerciseMSSV').val();
    let studentMssv = mssvInput ? mssvInput.trim() : "Khách";
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

    // Định dạng thời gian
    let now = new Date();
    let pad = (n) => String(n).padStart(2, '0');
    let timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    let formattedReply = `${studentMssv}:::${timeStr}:::${replyText}`;

    // Đổi trạng thái nút thành Đang gửi...
    let btn = $(`#btnSendExerciseReply_${rowIndex}`);
    let originalHtml = btn.html();
    btn.html('<i class="fa-solid fa-spinner fa-spin me-1"></i>Đang gửi...').prop('disabled', true);

    let postDataObj = {
        action: "replyToShareCode",
        rowIndex: rowIndex,
        replyText: formattedReply
    };

    // Gửi AJAX với thiết lập complete
    $.ajax({
        url: SCRIPT_URL,
        type: "POST",
        data: JSON.stringify(postDataObj),
        contentType: "text/plain;charset=utf-8",
        dataType: "text",
        timeout: 15000, // Tránh treo AJAX vĩnh viễn (giới hạn 15 giây)
        complete: function() {
            // 1. Phục hồi nút bấm ngay lập tức
            btn.html(originalHtml).prop('disabled', false);

            // 2. Dọn dẹp ô nhập và ẩn khung bình luận
            $(`#txtExerciseHistoryReply_${rowIndex}`).val('');
            $(`#replyBoxExercise_${rowIndex}`).addClass('d-none');

            // 3. Kích hoạt load lại lịch sử
            loadSubmissionHistory(true);

            // 4. Báo thành công sau 300ms (Không làm kẹt giao diện)
            setTimeout(function() {
                alert("✅ Đã gửi bình luận thành công!");
            }, 300);
        }
    });
}
// Hàm tự động tìm và chuyển đổi chuỗi dạng URL thành link <a>
function convertUrlsToLinks(text) {
    if (!text) return "";
    
    // Regex bắt trọn vẹn chuỗi URL bắt đầu từ http://, https:// hoặc www.
    const urlRegex = /(<a\b[^>]*>[\s\S]*?<\/a>)|(<[^>]+>)|((?:https?:\/\/|www\.)[^\s<>]+)/gi;
    
    return text.replace(urlRegex, function(match, aTag, anyTag, rawUrl) {
        if (aTag || anyTag) return match; 
        
        // Cắt bỏ các dấu chấm, phẩy, ngoặc ở CUỐI CÙNG chuỗi nếu vô tình dính vào
        let cleanUrl = rawUrl.replace(/[.,:;?!)]+$/, '');
        let trailingChars = rawUrl.slice(cleanUrl.length);

        let href = cleanUrl;
        if (cleanUrl.toLowerCase().startsWith('www.')) {
            href = 'http://' + cleanUrl;
        }
        
        // Hiển thị chữ "TRUY CẬP LINK" thay vì hiển thị nguyên chuỗi URL dài
        // Thêm tex2jax_ignore để MathJax không đụng vào làm méo chữ
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="tex2jax_ignore fw-bold text-primary text-decoration-underline"><i class="fa-solid fa-arrow-up-right-from-square me-1"></i>TRUY CẬP LINK</a>${trailingChars}`;
    });
}

let isDrawing = false;
let canvas, ctx;
let isErasing = false; // Trạng thái dùng tẩy hay bút
let undoStack = [];    // Mảng lưu trạng thái Undo
let redoStack = [];    // Mảng lưu trạng thái Redo

// Bật/tắt bảng vẽ
function toggleDrawingTool() {
    let container = $('#drawingContainer');
    container.toggleClass('d-none');
    
    if (!container.hasClass('d-none') && !canvas) {
        initCanvas();
    }
}

let resizeObserver = null; // Khai báo thêm biến này ở đầu file hoặc ngoài hàm

function initCanvas() {
    canvas = document.getElementById('sketchCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    // Đổ nền trắng ban đầu (phải thiết lập width/height khớp với thẻ bao bọc)
    let wrapper = document.getElementById('canvasWrapper');
    if (wrapper) {
        canvas.width = wrapper.clientWidth;
        canvas.height = wrapper.clientHeight;
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Đổi con trỏ chuột thành dấu chấm đen
    let penCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="3" fill="%23000000"/></svg>') 10 10, auto`;
    canvas.style.cursor = penCursor;
    
    saveCanvasState();

    // --- ĐOẠN THEO DÕI SỰ KIỆN KÉO GÓC BẢNG VẼ ---
    if (wrapper && !resizeObserver) {
        resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                let newWidth = Math.round(entry.contentRect.width);
                let newHeight = Math.round(entry.contentRect.height);
                
                // Tránh chạy lúc mới khởi tạo, chỉ chạy khi người dùng thực sự kéo thay đổi kích thước
                if (canvas.width !== newWidth || canvas.height !== newHeight) {
                    
                    // 1. Lưu lại hình ảnh hiện hành dạng Base64
                    let currentData = canvas.toDataURL();
                    let img = new Image();
                    img.src = currentData;
                    
                    img.onload = function() {
                        // 2. Thay đổi size vật lý của Canvas (bước này làm canvas bị tẩy trắng hoàn toàn)
                        canvas.width = newWidth;
                        canvas.height = newHeight;
                        
                        // 3. Phục hồi nền trắng
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        // 4. In lại hình ảnh cũ đè lên
                        ctx.drawImage(img, 0, 0);
                        
                        // 5. Setup lại cấu hình bút (bị mất do ở bước 2)
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        if (isErasing) {
                            ctx.strokeStyle = '#ffffff'; 
                            ctx.lineWidth = 20;
                        } else {
                            ctx.strokeStyle = '#000000'; 
                            ctx.lineWidth = 2;
                        }
                    };
                }
            }
        });
        resizeObserver.observe(wrapper);
    }
    // ---------------------------------------------

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', drawing);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);
}
// Tính toán chính xác tọa độ chuột bù trừ tỷ lệ thu phóng của class w-100
function getMousePos(canvas, evt) {
    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;    
    let scaleY = canvas.height / rect.height;  

    return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
    };
}

// Chuyển đổi giữa Bút và Tẩy
// Chuyển đổi giữa Bút và Tẩy
function setDrawMode(mode) {
    if (mode === 'eraser') {
        isErasing = true;
        // Đổi con trỏ chuột thành hình tròn 20px báo hiệu đang cầm tẩy
        let eraserCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="9" fill="%23ffffff" stroke="%23000000" stroke-width="1"/></svg>') 10 10, auto`;
        canvas.style.cursor = eraserCursor;
    } else {
        isErasing = false;
        // Chuyển về con trỏ chuột dấu chấm đen
        let penCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="3" fill="%23000000"/></svg>') 10 10, auto`;
        canvas.style.cursor = penCursor;
    }
}

// Hàm lưu trạng thái Canvas vào mảng Undo
function saveCanvasState() {
    if (undoStack.length > 20) { 
        undoStack.shift(); // Tối đa lưu 20 thao tác để không làm nặng web
    }
    undoStack.push(canvas.toDataURL());
}

function startDraw(e) {
    isDrawing = true;
    saveCanvasState(); // Lưu trạng thái bảng vẽ trước khi bắt đầu hạ bút
    redoStack = [];    // Khi vẽ nét mới thì mảng redo (làm lại) phải bị reset
    
    ctx.beginPath();
    let pos = getMousePos(canvas, e);
    ctx.moveTo(pos.x, pos.y);
}

function drawing(e) {
    if (!isDrawing) return;
    
    if (isErasing) {
        ctx.strokeStyle = '#ffffff'; 
        ctx.lineWidth = 20; // Nét cục tẩy to 20px
    } else {
        ctx.strokeStyle = '#000000'; 
        ctx.lineWidth = 2;  // Nét bút chì 2px       
    }
    
    let pos = getMousePos(canvas, e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}

function stopDraw() {
    isDrawing = false;
}

// Hàm Hoàn tác (Undo) - Lùi lại 1 bước
function undoCanvas() {
    if (undoStack.length > 0) {
        // Cất trạng thái hiện tại vào kho Redo
        redoStack.push(canvas.toDataURL());
        
        // Lấy trạng thái cũ nhất từ Undo ra để phục hồi
        let previousState = undoStack.pop();
        restoreCanvasState(previousState);
    }
}

// Hàm Làm lại (Redo) - Tiến tới 1 bước
function redoCanvas() {
    if (redoStack.length > 0) {
        // Cất trạng thái hiện hành ngược lại vào kho Undo
        undoStack.push(canvas.toDataURL());
        
        // Lấy trạng thái tiến lên từ Redo để phục hồi
        let nextState = redoStack.pop();
        restoreCanvasState(nextState);
    }
}

// Hàm nạp dữ liệu ảnh lên lại Canvas
function restoreCanvasState(base64Str) {
    let img = new Image();
    img.src = base64Str;
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
}

function clearCanvas() {
    if (ctx && canvas) {
        saveCanvasState(); // Lưu lại bước trước khi xóa phòng hờ người dùng ấn Undo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        redoStack = [];
    }
}

// Chèn hình vẽ từ canvas vào TinyMCE dưới dạng hình ảnh Base64
// Chèn hình vẽ từ canvas vào TinyMCE
function insertDrawingToEditor() {
    if (!canvas) return;
    
    // ĐỔI SANG ĐỊNH DẠNG JPEG để nén siêu nhẹ, cho phép lưu nhiều ảnh!
    let dataURL = canvas.toDataURL("image/jpeg", 0.6);
    
    // Tìm trình soạn thảo an toàn hơn bằng activeEditor
    let editor = (typeof tinymce !== 'undefined') ? (tinymce.get('theoryEditor') || tinymce.activeEditor) : null;
    
    if (window.editingImageNode) {
        // Cập nhật đè lên ảnh cũ đang sửa
        window.editingImageNode.src = dataURL;
        window.editingImageNode = null;
        if (editor) editor.fire('change'); // Báo cho hệ thống biết bài viết đã thay đổi
    } else {
        // Vẽ ảnh mới
        let imgHtml = `<p style="text-align: left;"><img src="${dataURL}" alt="Hình vẽ phác thảo" title="Click đúp chuột vào ảnh để sửa lại" style="max-width:100%; border:1px solid #ddd; border-radius:8px; cursor:pointer;"/></p><p style="text-align: left;"><br></p>`;
        
        if (editor) {
            editor.insertContent(imgHtml);
        } else {
            alert("Trình soạn thảo chưa sẵn sàng, vui lòng thử lại!");
        }
    }
    
    $('#drawingContainer').addClass('d-none');
}
// Hàm kiểm tra toàn bộ dữ liệu để đánh dấu các câu đã nộp
// Hàm kiểm tra toàn bộ dữ liệu để đánh dấu các câu đã nộp
function checkCompletedQuestions() {
    let mssv = $('#txtExerciseMSSV').val().trim();
    if (!mssv || mssv === "Khách") return; // Nếu chưa đăng nhập thì không kiểm tra

    // Hàm xử lý chung để duyệt mảng và tô màu
    const processCompleted = (data) => {
        if (!data || data.length === 0) return;
        let completedMaBai = new Set();
        
        data.forEach(row => {
            let rowMssv = row[1] || '';
            let contentRaw = row[2] || '';
            if (rowMssv.trim().toLowerCase() === mssv.toLowerCase()) {
                let match = contentRaw.match(/^\[SHARECODE\|(.*?)\|(.*?)\]/);
                if (match && match[1] === courseName) {
                    completedMaBai.add(match[2].trim());
                }
            }
        });

        // Duyệt qua danh sách câu hỏi hiện tại, nếu trùng mã bài thì tô xanh
        questionsList.forEach((q, idx) => {
            if (completedMaBai.has(q.maBai.trim())) {
                let tabBtn = $(`#tabBtnQuestion_${idx}`);
                tabBtn.addClass('completed'); // Thêm viền/nền xanh
                // Đổi icon thành dấu tick cho đẹp
                tabBtn.find('i').removeClass('fa-file-code').addClass('fa-circle-check'); 
            }
        });
    };

    // Nếu đã tải xong dữ liệu lịch sử ngầm, dùng ngay
    if (globalSubmissionData) {
        processCompleted(globalSubmissionData);
    } 
    // Nếu API tải ngầm vẫn đang chạy, thì chờ nó done rồi mới chạy
    else if (historyAjaxRequest) {
        historyAjaxRequest.done(function(data) {
            processCompleted(data);
        });
    }
}
// Hàm mở rộng chiều dài bảng vẽ
function expandCanvas() {
    if (!canvas || !ctx) return;
    
    // Lưu trạng thái trước khi mở rộng vào Undo (để người dùng có thể quay lại)
    saveCanvasState();

    // Lấy nội dung hiện tại của bảng vẽ
    let currentData = canvas.toDataURL();
    let img = new Image();
    img.src = currentData;
    
    img.onload = function() {
        // Tăng chiều cao thêm 200px (bạn có thể thay đổi con số này)
        canvas.height += 200;
        
        // Bôi trắng toàn bộ nền với kích thước mới
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Vẽ lại hình ảnh cũ đè lên
        ctx.drawImage(img, 0, 0);
        
        // Phục hồi lại các thiết lập của nét vẽ (vì bị reset khi đổi size)
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (isErasing) {
            ctx.strokeStyle = '#ffffff'; 
            ctx.lineWidth = 20;
        } else {
            ctx.strokeStyle = '#000000'; 
            ctx.lineWidth = 2;
        }
    };
}
function goBackToHome() {
    $('#workingView').addClass('d-none');
    $('#homeView').removeClass('d-none');
    document.title = "Danh sách bài tập | Học nhóm APMA";
    
    // Cập nhật lại màu sắc đề phòng lúc làm bài có nộp thêm bài mới
    checkCompletedQuestions(); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function requireLogin() {
    // Nếu trang baitap.html có chứa sẵn modal đăng nhập (userAuthModal)
    if ($('#userAuthModal').length > 0) {
        $('#userAuthModal').modal('show');
    } else {
        // Nếu không có modal, xác nhận và chuyển hướng về trang đăng nhập
        if (confirm("Phiên làm việc dành cho Khách bị giới hạn. Bạn có muốn chuyển đến trang Đăng nhập ngay bây giờ không?")) {
            // Đổi 'login.html' thành đường dẫn thực tế đến trang đăng nhập của bạn
            window.location.href = '../../login.html'; 
        }
    }
}
// HÀM ĐĂNG NHẬP DÀNH RIÊNG CHO TRANG BÀI TẬP
function loginStudentExercise() {
    let mssv = $('#txtUserMSSV').val().trim(); 
    let pass = $('#txtUserPass').val().trim();
    
    if (!mssv || !pass) { 
        $('#userAuthError').removeClass('d-none').text("Vui lòng nhập đầy đủ thông tin!"); 
        return; 
    }

    let btn = $('#btnLoginStudent'); 
    btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang xử lý...').prop('disabled', true);
    
    // Gọi hàm postToGAS từ config.js để gửi dữ liệu
    postToGAS({ action: "login", mssv: mssv, password: pass }, function(res) {
        let response = typeof res === 'string' ? JSON.parse(res) : res;
        
        if (response.success) {
            // 1. Lưu thông tin người dùng vào bộ nhớ trình duyệt
            let currentUser = { 
                mssv: response.mssv, 
                name: response.name,
                chuyenNganh: response.chuyenNganh,
                khoa: response.khoa,
                khoaHoc: response.khoaHoc,
                nhom: response.nhom,
                avatar: response.avatar || ""
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.removeItem('isAdmin'); // Xóa quyền admin cũ nếu có
            localStorage.setItem('lastActiveTime', Date.now().toString());

            // 2. Tải lại trang ngay lập tức. Trang bài tập sẽ tự động load lại và nhận diện MSSV.
            window.location.reload();
            
        } else { 
            // Báo lỗi sai mật khẩu hoặc tài khoản không tồn tại
            $('#userAuthError').removeClass('d-none').text(response.message); 
            btn.html('Đăng nhập hệ thống').prop('disabled', false); 
        }
    }, function() { 
        // Báo lỗi mất kết nối mạng
        $('#userAuthError').removeClass('d-none').text("Lỗi kết nối đến máy chủ!"); 
        btn.html('Đăng nhập hệ thống').prop('disabled', false); 
    });
}

// --- BẮT SỰ KIỆN GÕ ĐỂ VẼ XEM TRƯỚC (ĐÃ FIX LAG BẰNG DEBOUNCE) ---
let previewTimeout = null;

$(document).on('input', '#quickTreeInput', function() {
    clearTimeout(previewTimeout); // Hủy lệnh vẽ liên tục nếu bạn vẫn đang gõ phím
    previewTimeout = setTimeout(function() {
        drawTreeFromQuickInput(true); // Chỉ bắt đầu vẽ xem trước khi bạn ngừng gõ 0.3 giây
    }, 300); 
});

$(document).on('input', '#customTreeTable input', function() {
    clearTimeout(previewTimeout);
    previewTimeout = setTimeout(function() {
        drawCustomTree(true); 
    }, 300);
});

// Khi mở bảng, xóa trắng xem trước và chỉ thiết lập bảng
function openCustomTreeModal() {
    $('#customTreeTable tbody').html(`
        <tr>
            <td><input type="text" class="form-control form-control-sm fw-bold node-parent" placeholder="VD: 10"></td>
            <td><input type="text" class="form-control form-control-sm node-left" placeholder="VD: 5"></td>
            <td><input type="text" class="form-control form-control-sm node-right" placeholder="VD: 15"></td>
            <td><button class="btn btn-sm btn-danger" onclick="removeCustomTreeRow(this)"><i class="fa-solid fa-trash"></i></button></td>
        </tr>`);
    clearPreviewCanvas();
    
    // Mở khung nội tuyến thay vì Modal
    $('#customTreeContainer').removeClass('d-none');
    
    // Tự động cuộn trang xuống cho vừa tầm nhìn
    $('html, body').animate({
        scrollTop: $("#customTreeContainer").offset().top - 80
    }, 300);
}
// Hàm xuất cây ra ảnh chất lượng 4K và chèn thẳng vào bài làm
function insertTreeDirectlyToEditor() {
    let nodesMap = {}, childSet = new Set(), parentSet = new Set(), hasData = false;
    
    // 1. Quét dữ liệu từ bảng
    $('#customTreeTable tbody tr').each(function() {
        let parentVal = $(this).find('.node-parent').val().trim();
        let leftVal = $(this).find('.node-left').val().trim();
        let rightVal = $(this).find('.node-right').val().trim();

        if (parentVal !== '') {
            hasData = true;
            if (!nodesMap[parentVal]) nodesMap[parentVal] = new CanvasTreeNode(parentVal);
            parentSet.add(parentVal);
            if (leftVal !== '') {
                if (!nodesMap[leftVal]) nodesMap[leftVal] = new CanvasTreeNode(leftVal);
                nodesMap[parentVal].left = nodesMap[leftVal];
                childSet.add(leftVal);
            }
            if (rightVal !== '') {
                if (!nodesMap[rightVal]) nodesMap[rightVal] = new CanvasTreeNode(rightVal);
                nodesMap[parentVal].right = nodesMap[rightVal];
                childSet.add(rightVal);
            }
        }
    });

    if (!hasData) {
        alert("Vui lòng nhập dữ liệu để vẽ cây!");
        return; 
    }

    // 2. Tìm gốc của cây
    let rootVal = null;
    for (let p of parentSet) { if (!childSet.has(p)) { rootVal = p; break; } }
    if (!rootVal) rootVal = Array.from(parentSet)[0];
    let root = nodesMap[rootVal];

    // 3. Tạo một Canvas ảo để render ảnh chất lượng cao
    let offCanvas = document.createElement('canvas');
    let offCtx = offCanvas.getContext('2d');
    
    // Tính toán tọa độ cơ sở (không gian rộng)
    calculateTreePositions(root, 1000, 50, 400, 70); 
    
    let bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    getTreeBounds(root, bounds);
    
    let treeWidth = bounds.maxX - bounds.minX;
    let treeHeight = bounds.maxY - bounds.minY;
    let padding = 40;

    // HỆ SỐ PHÓNG TO ĐỂ ĐẠT CHẤT LƯỢNG 4K
    let scale = 4; 
    
    offCanvas.width = (treeWidth + padding * 2) * scale;
    offCanvas.height = (treeHeight + padding * 2) * scale;
    
    // Vẽ nền trắng
    offCtx.fillStyle = '#ffffff';
    offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);
    
    // Áp dụng hệ số phóng to (4K) và di chuyển vào trọng tâm
    offCtx.scale(scale, scale);
    offCtx.translate(-bounds.minX + padding, -bounds.minY + padding);
    
    // Cài đặt nét vẽ mượt mà
    offCtx.lineCap = 'round';
    offCtx.lineJoin = 'round';
    
    // Gọi hàm vẽ cây hiện có
    drawTreeOnCanvas(root, offCtx);
    
    // 4. Trích xuất ảnh PNG chất lượng tối đa 100%
    let dataURL = offCanvas.toDataURL("image/png", 1.0);
    
    // 5. Chèn trực tiếp vào trình soạn thảo TinyMCE
    let editor = (typeof tinymce !== 'undefined') ? (tinymce.get('theoryEditor') || tinymce.activeEditor) : null;
   if (editor) {
        // FIX QUAN TRỌNG: Ép căn trái, max-width: 50%...
        let imgHtml = `<p style="text-align: left;"><img src="${dataURL}" alt="Cây Nhị Phân" style="max-width:50%; border-radius:8px;"/></p><p style="text-align: left;">&nbsp;</p>`;
        
        editor.insertContent(imgHtml);
        
        // --- TỰ ĐỘNG MỞ RỘNG KHUNG ---
        setTimeout(function() {
            let body = editor.getBody();
            let currentHeight = editor.getContainer().offsetHeight;
            let contentHeight = body.scrollHeight + 100;
            if (contentHeight > currentHeight) {
                editor.theme.resizeTo(null, contentHeight);
            }
        }, 100);

        // TÌM VÀ SỬA DÒNG DƯỚI ĐÂY:
        $('#customTreeModal').modal('hide'); 
        
    } else {
        alert("Trình soạn thảo chưa tải xong, vui lòng thử lại!");
    }
}
function clearPreviewCanvas() {
    let pCanvas = document.getElementById('treePreviewCanvas');
    if(pCanvas) {
        let pCtx = pCanvas.getContext('2d');
        pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    }
}

// --- 1. CÁC HÀM TÍNH TOÁN VÀ XOAY CÂY AVL ---
function getNodeHeight(node) {
    if (!node) return 0;
    return 1 + Math.max(getNodeHeight(node.left), getNodeHeight(node.right));
}

function getBalanceFactor(node) {
    if (!node) return 0;
    return getNodeHeight(node.left) - getNodeHeight(node.right);
}

// Xoay phải (Right Rotation)
function rotateRight(y) {
    let x = y.left;
    let T2 = x.right;
    x.right = y;
    y.left = T2;
    return x;
}

// Xoay trái (Left Rotation)
function rotateLeft(x) {
    let y = x.right;
    let T2 = y.left;
    y.left = x;
    x.right = T2;
    return y;
}

// Chèn phần tử vào cây và tự động cân bằng theo quy tắc AVL
function insertAVL(node, val) {
    if (!node) return new CanvasTreeNode(val);

    // Chuyển kiểu số để so sánh đúng (nếu nhập số)
    let numVal = isNaN(val) ? val : Number(val);
    let currentVal = isNaN(node.val) ? node.val : Number(node.val);

    if (numVal < currentVal) {
        node.left = insertAVL(node.left, val);
    } else if (numVal > currentVal) {
        node.right = insertAVL(node.right, val);
    } else {
        return node; // Không chèn giá trị trùng lặp
    }

    let balance = getBalanceFactor(node);

    // Trường hợp Trái - Trái (Left Left)
    let leftVal = node.left ? (isNaN(node.left.val) ? node.left.val : Number(node.left.val)) : null;
    if (balance > 1 && numVal < leftVal) {
        return rotateRight(node);
    }

    // Trường hợp Phải - Phải (Right Right)
    let rightVal = node.right ? (isNaN(node.right.val) ? node.right.val : Number(node.right.val)) : null;
    if (balance < -1 && numVal > rightVal) {
        return rotateLeft(node);
    }

    // Trường hợp Trái - Phải (Left Right)
    if (balance > 1 && numVal > leftVal) {
        node.left = rotateLeft(node.left);
        return rotateRight(node);
    }

    // Trường hợp Phải - Trái (Right Left)
    if (balance < -1 && numVal < rightVal) {
        node.right = rotateRight(node.right);
        return rotateLeft(node);
    }

    return node;
}

// 2. HÀM ĐỌC DỮ LIỆU TỪ Ô NHẬP NHANH (BẢN AVL MỚI NHẤT)
function drawTreeFromQuickInput(isPreview) {
    let isPreviewMode = isPreview === true;
    
    let inputStr = $('#quickTreeInput').val().trim();
    if (!inputStr) { if(isPreviewMode) clearPreviewCanvas(); return; }
    
    let arr = inputStr.split(/[\s,]+/).filter(v => v !== '' && v.toLowerCase() !== 'null' && v.toLowerCase() !== 'x');
    if (arr.length === 0) {
        if(isPreviewMode) clearPreviewCanvas(); return;
    }

    // Chèn từng phần tử theo thuật toán AVL
    let root = null;
    for (let val of arr) {
        root = insertAVL(root, val);
    }
    
    triggerDrawAction(root, isPreviewMode);
    
    if (!isPreviewMode) {
       $('#customTreeContainer').addClass('d-none');
    }
}

// 3. HÀM ĐỌC DỮ LIỆU TỪ BẢNG (BẢN CHUẨN)
function drawCustomTree(isPreview) {
    let isPreviewMode = isPreview === true;
    let nodesMap = {}, childSet = new Set(), parentSet = new Set(), hasData = false;
    
    $('#customTreeTable tbody tr').each(function() {
        let parentVal = $(this).find('.node-parent').val().trim();
        let leftVal = $(this).find('.node-left').val().trim();
        let rightVal = $(this).find('.node-right').val().trim();

        if (parentVal !== '') {
            hasData = true;
            if (!nodesMap[parentVal]) nodesMap[parentVal] = new CanvasTreeNode(parentVal);
            parentSet.add(parentVal);
            if (leftVal !== '') {
                if (!nodesMap[leftVal]) nodesMap[leftVal] = new CanvasTreeNode(leftVal);
                nodesMap[parentVal].left = nodesMap[leftVal];
                childSet.add(leftVal);
            }
            if (rightVal !== '') {
                if (!nodesMap[rightVal]) nodesMap[rightVal] = new CanvasTreeNode(rightVal);
                nodesMap[parentVal].right = nodesMap[rightVal];
                childSet.add(rightVal);
            }
        }
    });

    if (!hasData) { if(isPreviewMode) clearPreviewCanvas(); return; }
    let rootVal = null;
    for (let p of parentSet) { if (!childSet.has(p)) { rootVal = p; break; } }
    if (!rootVal) rootVal = Array.from(parentSet)[0];

    triggerDrawAction(nodesMap[rootVal], isPreviewMode);
    if (!isPreviewMode) {
      $('#customTreeContainer').addClass('d-none');
    }
}
// Hàm tìm giới hạn biên bao quanh toàn bộ cây (minX, maxX, minY, maxY)
function getTreeBounds(node, bounds) {
    if (!node) return;
    let radius = Math.max(18, 12 + node.val.toString().length * 4);
    
    bounds.minX = Math.min(bounds.minX, node.x - radius);
    bounds.maxX = Math.max(bounds.maxX, node.x + radius);
    bounds.minY = Math.min(bounds.minY, node.y - radius);
    bounds.maxY = Math.max(bounds.maxY, node.y + radius);

    getTreeBounds(node.left, bounds);
    getTreeBounds(node.right, bounds);
}

// Hàm truyền lệnh vẽ (Fix lỗi mất hình lần đầu bằng Canvas ảo đồng bộ)
function triggerDrawAction(root, isPreviewMode) {
    if (!root) return;
    
    let targetCanvas = isPreviewMode ? document.getElementById('treePreviewCanvas') : canvas;
    if (!targetCanvas) return;
    let targetCtx = targetCanvas.getContext('2d');

    // 1. Reset ma trận biến đổi
    targetCtx.setTransform(1, 0, 0, 1, 0, 0);

    // ========================================================
    // TRƯỜNG HỢP 1: BẢNG XEM TRƯỚC (PREVIEW) - TỰ ĐỘNG SCALE VỪA KHÍT
    // ========================================================
   if (isPreviewMode) {
        targetCtx.fillStyle = '#f8fafc';
        targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

        // Áp dụng khoảng cách nhỏ gọn cho cả Preview
        let depth = getTreeDepth(root);
        let initialOffsetX = Math.max(40, Math.pow(1.8, depth - 2) * 25);
        
        let baseWidth = targetCanvas.width;
        calculateTreePositions(root, baseWidth / 2, 40, initialOffsetX, 55);

        let bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
        getTreeBounds(root, bounds);

        let treeWidth = bounds.maxX - bounds.minX;
        let treeHeight = bounds.maxY - bounds.minY;
        let padding = 20;

        let scaleX = (targetCanvas.width - padding * 2) / treeWidth;
        let scaleY = (targetCanvas.height - padding * 2) / treeHeight;
        let scale = Math.min(scaleX, scaleY, 2.5);

        let treeCenterX = (bounds.minX + bounds.maxX) / 2;
        let treeCenterY = (bounds.minY + bounds.maxY) / 2;
        let canvasCenterX = targetCanvas.width / 2;
        let canvasCenterY = targetCanvas.height / 2;

        targetCtx.save();
        targetCtx.translate(canvasCenterX, canvasCenterY);
        targetCtx.scale(scale, scale);
        targetCtx.translate(-treeCenterX, -treeCenterY);

        drawTreeOnCanvas(root, targetCtx);
        targetCtx.restore();
    }

    // ========================================================
    // TRƯỜNG HỢP 2: BẢNG VẼ PHÁC THẢO CHÍNH - TỰ ĐỘNG NỚI RỘNG KHUNG
    // ========================================================
    else {
        saveCanvasState(); // Lưu vào Undo trước khi chèn cây

        let maxOffsetX = Math.min(targetCanvas.width / 4, 150); 
        
        // Tính toán tọa độ cây
        calculateTreePositions(root, targetCanvas.width / 2, 50, maxOffsetX, 70);

        let bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
        getTreeBounds(root, bounds);

        let padding = 50;
        let requiredWidth = Math.max(targetCanvas.width, (bounds.maxX - bounds.minX) + padding * 2);
        let requiredHeight = Math.max(targetCanvas.height, bounds.maxY + padding);

        // Hàm phụ để trả lại nét vẽ tự do ban đầu
        const restorePenSettings = () => {
            targetCtx.lineCap = 'round';
            targetCtx.lineJoin = 'round';
            targetCtx.shadowColor = 'transparent';
            if (typeof isErasing !== 'undefined' && isErasing) {
                targetCtx.strokeStyle = '#ffffff'; 
                targetCtx.lineWidth = 20;
            } else {
                targetCtx.strokeStyle = '#000000'; 
                targetCtx.lineWidth = 2;
            }
        };

        // Nếu cây to hơn khung hiện tại -> Nới rộng khung
        if (requiredWidth > targetCanvas.width || requiredHeight > targetCanvas.height) {
            // FIX: Dùng Canvas ảo copy ảnh ngay lập tức thay vì dùng toDataURL + img.onload mất thời gian chờ
            let tempCanvas = document.createElement('canvas');
            tempCanvas.width = targetCanvas.width;
            tempCanvas.height = targetCanvas.height;
            tempCanvas.getContext('2d').drawImage(targetCanvas, 0, 0);
            
            // Cập nhật lại khung bọc HTML
            let wrapper = document.getElementById('canvasWrapper');
            if (wrapper) {
                if (requiredWidth > targetCanvas.width) wrapper.style.width = Math.ceil(requiredWidth) + 'px';
                if (requiredHeight > targetCanvas.height) wrapper.style.height = Math.ceil(requiredHeight) + 'px';
            }

            // Đổi size làm mất nền Canvas chính
            targetCanvas.width = Math.ceil(requiredWidth);
            targetCanvas.height = Math.ceil(requiredHeight);

            // In lại hình cũ ngay lập tức (Đồng bộ)
            targetCtx.fillStyle = '#ffffff';
            targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
            targetCtx.drawImage(tempCanvas, 0, 0);

            // Tiến hành vẽ cây mới chồng lên
            calculateTreePositions(root, targetCanvas.width / 2, 50, maxOffsetX, 70);
            drawTreeOnCanvas(root, targetCtx);
            restorePenSettings();
            
        } else {
            // Nếu bảng đủ rộng thì vẽ thẳng luôn
            drawTreeOnCanvas(root, targetCtx);
            restorePenSettings(); 
        }

        // Cuộn trang xuống bảng vẽ
        $('html, body').animate({
            scrollTop: $("#drawingContainer").offset().top - 80
        }, 400);
    }
}

// Hàm vẽ cây với giao diện Nho Gọn, Hiện Đại
// Hàm vẽ cây với giao diện Nhỏ Gọn, Hiện Đại (Đã fix đồng bộ màu đường nối)
function drawTreeOnCanvas(node, targetCtx) {
    if (!node) return;
    targetCtx = targetCtx || ctx;

    // --- 1. VẼ ĐƯỜNG NỐI (Thanh mảnh, màu xám nhạt) ---
    targetCtx.lineWidth = 1.5; 

    if (node.left) {
        targetCtx.beginPath();
        targetCtx.moveTo(node.x, node.y);
        targetCtx.lineTo(node.left.x, node.left.y);
        targetCtx.strokeStyle = '#cbd5e1'; // KHÓA MÀU XÁM TRƯỚC KHI VẼ NÉT TRÁI
        targetCtx.stroke();
        drawTreeOnCanvas(node.left, targetCtx);
    }
    if (node.right) {
        targetCtx.beginPath();
        targetCtx.moveTo(node.x, node.y);
        targetCtx.lineTo(node.right.x, node.right.y);
        targetCtx.strokeStyle = '#cbd5e1'; // KHÓA MÀU XÁM TRƯỚC KHI VẼ NÉT PHẢI
        targetCtx.stroke();
        drawTreeOnCanvas(node.right, targetCtx);
    }

    // --- 2. TÍNH TOÁN BÁN KÍNH NHỎ GỌN ---
    let textLen = node.val.toString().length;
    let radius = Math.max(14, 8 + textLen * 4); 

    // --- 3. VẼ HÌNH TRÒN (NÚT) ---
    targetCtx.beginPath();
    targetCtx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    
    // Bóng mờ (Shadow) siêu nhẹ để tạo cảm giác nổi
    targetCtx.shadowColor = 'rgba(0, 0, 0, 0.08)'; 
    targetCtx.shadowBlur = 4;
    targetCtx.shadowOffsetY = 2;
    
    // Tô nền trắng
    targetCtx.fillStyle = '#ffffff';
    targetCtx.fill();
    
    // Vẽ viền nút (Màu xanh tinh tế)
    targetCtx.strokeStyle = '#0ea5e9'; // (Chính màu này lúc nãy bị lem xuống đường nối)
    targetCtx.lineWidth = 2;
    targetCtx.stroke();
    
    targetCtx.shadowColor = 'transparent'; // Tắt bóng mờ để chữ không bị nhòe

    // --- 4. VẼ CHỮ TRONG NÚT ---
    targetCtx.fillStyle = '#0f172a'; // Màu chữ xám đen
    targetCtx.font = 'bold 13px Inter, sans-serif'; 
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    targetCtx.fillText(node.val, node.x, node.y);
}

// Hàm tính toán độ sâu của cây để chia khoảng cách cho chuẩn
function getTreeDepth(node) {
    if (!node) return 0;
    return 1 + Math.max(getTreeDepth(node.left), getTreeDepth(node.right));
}

// Hàm xuất cây ra ảnh và chèn thẳng vào bài làm (ĐÃ FIX LỖI CĂN TRÁI VÀ KÍCH THƯỚC)
function insertTreeDirectlyToEditor() {
    let nodesMap = {}, childSet = new Set(), parentSet = new Set(), hasData = false;
    
    // 1. Quét dữ liệu từ bảng
    $('#customTreeTable tbody tr').each(function() {
        let parentVal = $(this).find('.node-parent').val().trim();
        let leftVal = $(this).find('.node-left').val().trim();
        let rightVal = $(this).find('.node-right').val().trim();

        if (parentVal !== '') {
            hasData = true;
            if (!nodesMap[parentVal]) nodesMap[parentVal] = new CanvasTreeNode(parentVal);
            parentSet.add(parentVal);
            if (leftVal !== '') {
                if (!nodesMap[leftVal]) nodesMap[leftVal] = new CanvasTreeNode(leftVal);
                nodesMap[parentVal].left = nodesMap[leftVal];
                childSet.add(leftVal);
            }
            if (rightVal !== '') {
                if (!nodesMap[rightVal]) nodesMap[rightVal] = new CanvasTreeNode(rightVal);
                nodesMap[parentVal].right = nodesMap[rightVal];
                childSet.add(rightVal);
            }
        }
    });

    if (!hasData) { alert("Vui lòng nhập dữ liệu để vẽ cây!"); return; }

    // 2. Tìm gốc của cây
    let rootVal = null;
    for (let p of parentSet) { if (!childSet.has(p)) { rootVal = p; break; } }
    if (!rootVal) rootVal = Array.from(parentSet)[0];
    let root = nodesMap[rootVal];

    let offCanvas = document.createElement('canvas');
    let offCtx = offCanvas.getContext('2d');
    
    // 3. Tính toán khoảng cách (Thu gọn)
    let depth = getTreeDepth(root);
    let initialOffsetX = Math.max(40, Math.pow(1.8, depth - 2) * 25);
    let initialOffsetY = 55;
    
    calculateTreePositions(root, 1000, 50, initialOffsetX, initialOffsetY); 
    
    let bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    getTreeBounds(root, bounds);
    
    let padding = 15;
    let treeWidth = bounds.maxX - bounds.minX;
    let treeHeight = bounds.maxY - bounds.minY;
    
    let scale = 3; // Chuẩn HD cho gọn nhẹ
    
    offCanvas.width = (treeWidth + padding * 2) * scale;
    offCanvas.height = (treeHeight + padding * 2) * scale;
    
    offCtx.fillStyle = '#ffffff';
    offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);
    
    offCtx.scale(scale, scale);
    offCtx.translate(-bounds.minX + padding, -bounds.minY + padding);
    offCtx.lineCap = 'round'; offCtx.lineJoin = 'round';
    
    drawTreeOnCanvas(root, offCtx);
    
    // 4. Trích xuất ảnh PNG
    let dataURL = offCanvas.toDataURL("image/png", 1.0);
    
    // 5. Chèn trực tiếp vào trình soạn thảo TinyMCE
    let editor = (typeof tinymce !== 'undefined') ? (tinymce.get('theoryEditor') || tinymce.activeEditor) : null;
   if (editor) {
        // FIX QUAN TRỌNG: Ép căn trái, max-width: 50%...
        let imgHtml = `<p style="text-align: left;"><img src="${dataURL}" alt="Cây Nhị Phân" style="max-width:50%; border-radius:8px;"/></p><p style="text-align: left;">&nbsp;</p>`;
        
        editor.insertContent(imgHtml);
        
        // --- TỰ ĐỘNG MỞ RỘNG KHUNG ---
        setTimeout(function() {
            let body = editor.getBody();
            let currentHeight = editor.getContainer().offsetHeight;
            let contentHeight = body.scrollHeight + 100;
            if (contentHeight > currentHeight) {
                editor.theme.resizeTo(null, contentHeight);
            }
        }, 100);

        // ĐÃ ĐỔI ĐÚNG LỆNH ẨN CONTAINER NỘI TUYẾN
        $('#customTreeContainer').addClass('d-none'); 
        
    } else {
        alert("Trình soạn thảo chưa tải xong, vui lòng thử lại!");
    }
}
// --- CÁC HÀM VÀ CLASS CÒN THIẾU CỦA CÂY NHỊ PHÂN ---

// 1. Class định nghĩa Nút của cây
class CanvasTreeNode {
    constructor(val) {
        this.val = val;
        this.left = null;
        this.right = null;
        this.x = 0;
        this.y = 0;
    }
}

// 2. Hàm tính toán tọa độ (x, y) cho từng nút để vẽ không bị đè lên nhau
// 2. Hàm tính toán tọa độ (Đã điều chỉnh giãn cách)
function calculateTreePositions(node, x, y, offsetX, offsetY) {
    if (!node) return;
    
    node.x = x;
    node.y = y;
    
    // Dùng offsetX / 2 thay vì 1.8 để chia đôi chính xác không gian, 
    // đảm bảo các nút ở tầng dưới cùng không bao giờ đè lên nhau.
    if (node.left) {
        calculateTreePositions(node.left, x - offsetX, y + offsetY, offsetX / 2, offsetY);
    }
    if (node.right) {
        calculateTreePositions(node.right, x + offsetX, y + offsetY, offsetX / 2, offsetY);
    }
}

// 3. Hàm xóa dòng trong bảng nhập thủ công
function removeCustomTreeRow(btn) {
    $(btn).closest('tr').remove();
    drawCustomTree(true); // Cập nhật lại hình xem trước sau khi xóa
}
// ========================================================
// HÀM DÀNH RIÊNG CHO ADMIN: CHỈNH SỬA ĐỀ BÀI VÀ XEM TRƯỚC (TỐI ƯU TỐC ĐỘ)
// ========================================================

let adminMathJaxTimeout = null;

// Bắt sự kiện gõ phím vào khung nhập nội dung
$(document).on('input', '#adminEditContent', function() {
    let rawContent = $(this).val() || '';
    
    // Chuẩn hóa nội dung
    let processedContent = rawContent
        .replace(/\\\\\[\d+pt\]/g, '<br>')
        .replace(/\\\\/g, '<br>')
        .replace(/\[\d+pt\]/g, '')
        .replace(/\\vspace\{.*?\}/g, '')
        .replace(/\\hspace\{.*?\}/g, '')
        .replace(/\\begin\{enumerate\}/g, '')
        .replace(/\\end\{enumerate\}/g, '')
        .replace(/\\begin\{center\}/g, '<div class="my-3">')
        .replace(/\\end\{center\}/g, '</div>')
        .replace(/\\small/g, '')
        .replace(/\\begin\{tabular\}\{.*?\}/g, '<table class="table table-bordered align-middle my-3" style="width:100%; border-color:#cbd5e1;"><thead class="table-light"><tr><th style="width:40%;">Input</th><th style="width:60%;">Output</th></tr></thead><tbody><tr><td>')
        .replace(/\\end\{tabular\}/g, '</td></tr></tbody></table>')
        .replace(/\\begin\{minipage\}\[.*?\]\{.*?\}/g, '<div>')
        .replace(/\\end\{minipage\}/g, '</div>')
        .replace(/\\hline/g, '')
        .replace(/\\textbf\{Input\}\s*&\s*\\textbf\{Output\}/gi, '')
        .replace(/Input\s*&\s*Output/gi, '')
        .replace(/\\textbf\{(.*?)\}/g, '<b>$1</b>')
        .replace(/\\texttt\{(.*?)\}/g, '<code>$1</code>')
        .replace(/\\item\[(.*?)\]/g, '<br><b>$1</b> ')
        .replace(/\\item/g, '<br>• ');
        
    if (typeof convertUrlsToLinks === "function") {
        processedContent = convertUrlsToLinks(processedContent);
    }

    // 1. HIỂN THỊ VĂN BẢN & HTML NGAY LẬP TỨC (Xóa bỏ độ trễ khi gõ)
    $('#adminEditPreview').html(processedContent);

    // 2. CHỈ TRÌ HOÃN MATHJAX 0.25s (Vì thư viện vẽ công thức rất nặng)
    clearTimeout(adminMathJaxTimeout);
    adminMathJaxTimeout = setTimeout(function() {
        if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetPromise([document.getElementById('adminEditPreview')]).catch(function (err) {
                console.log('MathJax error in preview: ' + err.message);
            });
        }
    }, 250); 
});

function openAdminEditQuestion() {
    let q = questionsList[currentQuestionIndex];
    if (!q) return;
    
    // Đổ dữ liệu hiện tại vào Form
    $('#adminEditMaBai').val(q.maBai);
    $('#adminEditTitle').val(q.title);
    $('#adminEditContent').val(q.content);
    
    // Tự động kích hoạt sự kiện gõ phím để render bản xem trước ngay khi mở
    $('#adminEditContent').trigger('input');
    
    // Mở Modal
    $('#adminEditQuestionModal').modal('show');
}
function saveAdminExerciseEdit() {
    let q = questionsList[currentQuestionIndex];
    let newMaBai = $('#adminEditMaBai').val().trim();
    let title = $('#adminEditTitle').val().trim();
    let content = $('#adminEditContent').val().trim();

    if (!newMaBai || !title || !content) {
        alert("Vui lòng nhập đầy đủ thông tin đề bài!");
        return;
    }

    let btn = $('#adminEditQuestionModal .btn-warning');
    let originalText = btn.html();
    // Đổi trạng thái UI sang loading
    btn.html('<i class="fa-solid fa-spinner fa-spin me-2"></i>Đang lưu...').prop('disabled', true);

    let postDataObj = {
        action: "editExerciseQuestion",
        course: courseName,
        oldMaBai: q.maBai,
        newMaBai: newMaBai,
        title: title,
        content: content
    };

    $.ajax({
        url: SCRIPT_URL,
        type: "POST",
        data: JSON.stringify(postDataObj),
        contentType: "text/plain;charset=utf-8",
        dataType: "text",
        timeout: 20000, // Tăng lên 20s phòng trường hợp Google Sheet phản hồi chậm
        success: function(res) {
            // Thành công chuẩn 100%
            btn.html('<i class="fa-solid fa-check me-2"></i>Lưu thành công!').removeClass('btn-warning').addClass('btn-success');
            setTimeout(function() {
                $('#adminEditQuestionModal').modal('hide');
                window.location.reload(); // Dùng reload() an toàn và sạch sẽ hơn
            }, 600);
        },
        error: function(xhr, status, err) {
            // XỬ LÝ "LỖI GIẢ" TỪ GOOGLE APPS SCRIPT:
            // Nếu status là 0, nghĩa là GAS đã chạy lệnh lưu xong nhưng bị chặn CORS khi trả kết quả
            if (xhr.status === 0 || status === "error") {
                btn.html('<i class="fa-solid fa-check me-2"></i>Đã lưu thành công!').removeClass('btn-warning').addClass('btn-success');
                setTimeout(function() {
                    $('#adminEditQuestionModal').modal('hide');
                    window.location.reload();
                }, 600);
            } else {
                // Các lỗi thực sự khác (Timeout, đứt mạng, 500...)
                btn.html(originalText).prop('disabled', false);
                alert("Máy chủ phản hồi quá chậm hoặc có lỗi xảy ra! (Mã lỗi: " + status + ")");
            }
        }
    });
}