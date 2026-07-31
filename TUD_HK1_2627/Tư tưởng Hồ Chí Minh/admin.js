let allBankQuestions = [];

document.addEventListener('DOMContentLoaded', () => {
    handlePartChange();
    loadExamSuggestions();
    loadBankList();
    
    document.getElementById('question-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveQuestion();
    });
});

// HÀM TỰ ĐỘNG PHÂN TÍCH VÀ TÁCH KHỐI VĂN BẢN (SMART PASTE)
function parseSmartPaste() {
    const rawText = document.getElementById('smart-paste-input').value;
    if (!rawText.trim()) return;

    const partSelect = document.getElementById('part-select');
    if (partSelect.value !== '1') {
        partSelect.value = '1';
        handlePartChange();
    }

    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line !== '');

    let questionLines = [];
    let optA = '', optB = '', optC = '', optD = '';

    lines.forEach(line => {
        if (/^[A[a]\s*[\.\:\)\/]/i.test(line)) {
            optA = line.replace(/^[A[a]\s*[\.\:\)\/]\s*/i, '');
        } else if (/^[B[b]\s*[\.\:\)\/]/i.test(line)) {
            optB = line.replace(/^[B[b]\s*[\.\:\)\/]\s*/i, '');
        } else if (/^[C[c]\s*[\.\:\)\/]/i.test(line)) {
            optC = line.replace(/^[C[c]\s*[\.\:\)\/]\s*/i, '');
        } else if (/^[D[d]\s*[\.\:\)\/]/i.test(line)) {
            optD = line.replace(/^[D[d]\s*[\.\:\)\/]\s*/i, '');
        } else {
            questionLines.push(line);
        }
    });

    let fullQuestion = questionLines.join('\n').replace(/^Câu\s*\d+[\.\:\s]*/i, '').trim();

    if (fullQuestion) document.getElementById('q-content').value = fullQuestion;
    if (optA) document.getElementById('opt-a').value = optA;
    if (optB) document.getElementById('opt-b').value = optB;
    if (optC) document.getElementById('opt-c').value = optC;
    if (optD) document.getElementById('opt-d').value = optD;

    renderPreview();
}

function handlePartChange() {
    const part = document.getElementById('part-select').value;
    document.querySelectorAll('.part-fields').forEach(el => el.style.display = 'none');
    document.getElementById(`inputs-part-${part}`).style.display = 'block';
    renderPreview();
}

function addNewExamPrompt() {
    const newExam = prompt("Nhập tên Đợt Thi / Kỳ Thi mới:");
    if (newExam && newExam.trim() !== "") {
        const input = document.getElementById('q-exam-name');
        input.value = newExam.trim();
        const datalist = document.getElementById('exam-suggestions');
        datalist.innerHTML += `<option value="${newExam.trim()}">`;
    }
}

function loadExamSuggestions() {
    fetch(`${GOOGLE_SCRIPT_URL}?action=getExamList`)
        .then(res => res.json())
        .then(exams => {
            const datalist = document.getElementById('exam-suggestions');
            const filterSelect = document.getElementById('filter-admin-exam');
            datalist.innerHTML = '';
            filterSelect.innerHTML = '<option value="">-- Tất cả đợt thi --</option>';
            
            exams.forEach(ex => {
                if (ex) {
                    datalist.innerHTML += `<option value="${ex}">`;
                    filterSelect.innerHTML += `<option value="${ex}">${ex}</option>`;
                }
            });
        })
        .catch(err => console.error("Lỗi lấy danh sách đợt thi:", err));
}

function renderPreview() {
    const part = document.getElementById('part-select').value;
    const content = document.getElementById('q-content').value || "Nội dung câu hỏi sẽ hiển thị ở đây...";
    const rawImgUrl = document.getElementById('q-image').value;
    const imgUrl = convertDriveUrl(rawImgUrl);
    const previewBox = document.getElementById('preview-box');

    let imgHtml = imgUrl ? `<img src="${imgUrl}" alt="Ảnh xem trước" style="max-width:100%; margin:10px 0;">` : '';

    if (part === '1') {
        const optA = document.getElementById('opt-a').value || "Lựa chọn A";
        const optB = document.getElementById('opt-b').value || "Lựa chọn B";
        const optC = document.getElementById('opt-c').value || "Lựa chọn C";
        const optD = document.getElementById('opt-d').value || "Lựa chọn D";

        previewBox.innerHTML = `
            <p><strong>Câu hỏi mẫu:</strong> ${content}</p>
            ${imgHtml}
            <div class="options">
                <label><input type="radio" disabled> A. ${optA}</label>
                <label><input type="radio" disabled> B. ${optB}</label>
                <label><input type="radio" disabled> C. ${optC}</label>
                <label><input type="radio" disabled> D. ${optD}</label>
            </div>
        `;
    } else if (part === '2') {
        const textA = document.getElementById('tf-a').value || "Ý khẳng định a";
        const textB = document.getElementById('tf-b').value || "Ý khẳng định b";
        const textC = document.getElementById('tf-c').value || "Ý khẳng định c";
        const textD = document.getElementById('tf-d').value || "Ý khẳng định d";

        previewBox.innerHTML = `
            <p><strong>Đề bài/Ngữ liệu:</strong> ${content}</p>
            ${imgHtml}
            <table class="tf-table">
                <tr><th>Lệnh/Ý hỏi</th><th>Đúng</th><th>Sai</th></tr>
                <tr><td>a) ${textA}</td><td><input type="radio" disabled></td><td><input type="radio" disabled></td></tr>
                <tr><td>b) ${textB}</td><td><input type="radio" disabled></td><td><input type="radio" disabled></td></tr>
                <tr><td>c) ${textC}</td><td><input type="radio" disabled></td><td><input type="radio" disabled></td></tr>
                <tr><td>d) ${textD}</td><td><input type="radio" disabled></td><td><input type="radio" disabled></td></tr>
            </table>
        `;
    } else if (part === '3') {
        previewBox.innerHTML = `
            <p><strong>Câu hỏi:</strong> ${content}</p>
            ${imgHtml}
            <input type="text" class="short-answer-input" placeholder="Nhập đáp án..." disabled>
        `;
    }

    if (window.MathJax) {
        window.MathJax.typesetPromise([previewBox]).catch((err) => console.log(err));
    }
}

function loadBankList() {
    const loading = document.getElementById('bank-list-loading');
    const container = document.getElementById('bank-list-container');
    const filterSelect = document.getElementById('filter-admin-exam');
    const filterExam = filterSelect ? filterSelect.value : "";

    if (loading) loading.style.display = 'block';
    if (container) container.innerHTML = '';

    fetch(`${GOOGLE_SCRIPT_URL}?action=getAllBank&examName=${encodeURIComponent(filterExam)}`)
        .then(res => res.json())
        .then(data => {
            allBankQuestions = data;
            filterAndRenderBank();
        })
        .catch(err => console.error("Lỗi lấy danh sách bank:", err))
        .finally(() => {
            if (loading) loading.style.display = 'none';
        });
}

function filterAndRenderBank() {
    const searchKeyword = document.getElementById('search-bank-input')?.value.toLowerCase().trim() || "";
    const container = document.getElementById('bank-list-container');
    const countBadge = document.getElementById('bank-count-badge');
    
    if (!container) return;
    container.innerHTML = '';

    const filteredQuestions = allBankQuestions.filter(q => {
        return (q.content || "").toLowerCase().includes(searchKeyword);
    });

    if (countBadge) {
        countBadge.innerText = `${filteredQuestions.length} câu`;
    }

    if (filteredQuestions.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; color:#94a3b8; font-size:0.88rem; padding:20px 0;">
                ${searchKeyword ? '❌ Không tìm thấy câu hỏi phù hợp.' : '📭 Chưa có câu hỏi nào trong đợt thi này.'}
            </div>`;
        return;
    }

    filteredQuestions.forEach((q) => {
        const originalIndex = allBankQuestions.findIndex(item => item.rowIndex === q.rowIndex);

        const item = document.createElement('div');
        item.className = 'bank-item';
        
        item.innerHTML = `
            <div class="bank-item-info">
                <div class="bank-badges">
                    <span class="badge badge-exam">${q.examName ? q.examName : 'Chung'}</span>
                    <span class="badge badge-part">Phần ${q.part}</span>
                    <span class="badge badge-set">Bộ ${q.setNum}</span>
                </div>
                <div class="bank-item-content" title="${escapeHtml(q.content)}">
                    ${q.content}
                </div>
            </div>
            <div class="bank-item-actions">
                <button type="button" class="btn-print-q" onclick="printSingleQuestionAsExam(${originalIndex})">🖨️ In đề câu này</button>
                <button type="button" class="btn-edit-q" onclick="prepareEditQuestion(${originalIndex})">✏️ Sửa</button>
            </div>
        `;
        container.appendChild(item);
    });
    
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([container]).catch(err => console.log(err));
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function prepareEditQuestion(index) {
    const q = allBankQuestions[index];
    if (!q) return;

    document.getElementById('edit-row-index').value = q.rowIndex;
    document.getElementById('q-exam-name').value = q.examName || '';
    document.getElementById('part-select').value = q.part;
    document.getElementById('set-num').value = q.setNum;
    document.getElementById('q-content').value = q.content;
    document.getElementById('q-image').value = q.imageUrl || '';

    document.getElementById('form-title').innerText = `✏️ Cập Nhật Câu Hỏi (Dòng ${q.rowIndex})`;
    document.getElementById('btn-cancel-edit').style.display = 'inline-block';
    document.getElementById('btn-submit').innerText = "🔄 Cập Nhật Câu Hỏi";
    document.getElementById('btn-submit').style.background = '#3b82f6';

    handlePartChange();

    if (q.part == 1) {
        document.getElementById('opt-a').value = q.optA;
        document.getElementById('opt-b').value = q.optB;
        document.getElementById('opt-c').value = q.optC;
        document.getElementById('opt-d').value = q.optD;
        document.getElementById('correct-p1').value = q.correct || 'A';
    } else if (q.part == 2) {
        document.getElementById('tf-a').value = q.optA;
        document.getElementById('tf-b').value = q.optB;
        document.getElementById('tf-c').value = q.optC;
        document.getElementById('tf-d').value = q.optD;

        let tfAns = (q.correct || "D,D,D,D").split(',');
        document.getElementById('tf-ans-a').value = tfAns[0] || 'D';
        document.getElementById('tf-ans-b').value = tfAns[1] || 'D';
        document.getElementById('tf-ans-c').value = tfAns[2] || 'D';
        document.getElementById('tf-ans-d').value = tfAns[3] || 'D';
    } else if (q.part == 3) {
        document.getElementById('correct-p3').value = q.correct;
    }

    renderPreview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFormToCreate() {
    document.getElementById('edit-row-index').value = '';
    document.getElementById('form-title').innerText = "✏️ Thêm Câu Hỏi Mới";
    document.getElementById('btn-cancel-edit').style.display = 'none';
    document.getElementById('btn-submit').innerText = "💾 Lưu Vào Ngân Hàng Câu Hỏi";
    document.getElementById('btn-submit').style.background = '#10b981';

    document.getElementById('question-form').reset();
    const smartInput = document.getElementById('smart-paste-input');
    if (smartInput) smartInput.value = '';
    
    handlePartChange();
    renderPreview();
}

function saveQuestion() {
    const btnSubmit = document.getElementById('btn-submit');
    const rowIndex = document.getElementById('edit-row-index').value;
    const isEditing = rowIndex !== "";

    const part = document.getElementById('part-select').value;
    const setNum = document.getElementById('set-num').value;
    const content = document.getElementById('q-content').value;
    const imageUrl = document.getElementById('q-image').value;

    let payload = {
        action: isEditing ? "updateQuestion" : "addQuestion",
        rowIndex: isEditing ? parseInt(rowIndex) : null,
        examName: document.getElementById('q-exam-name').value.trim(),
        part: parseInt(part),
        setNum: parseInt(setNum),
        content: content,
        imageUrl: imageUrl
    };

    if (part === '1') {
        payload.optA = document.getElementById('opt-a').value;
        payload.optB = document.getElementById('opt-b').value;
        payload.optC = document.getElementById('opt-c').value;
        payload.optD = document.getElementById('opt-d').value;
        payload.correct = document.getElementById('correct-p1').value;
    } else if (part === '2') {
        payload.optA = document.getElementById('tf-a').value;
        payload.optB = document.getElementById('tf-b').value;
        payload.optC = document.getElementById('tf-c').value;
        payload.optD = document.getElementById('tf-d').value;
        
        const ansA = document.getElementById('tf-ans-a').value;
        const ansB = document.getElementById('tf-ans-b').value;
        const ansC = document.getElementById('tf-ans-c').value;
        const ansD = document.getElementById('tf-ans-d').value;
        payload.correct = `${ansA},${ansB},${ansC},${ansD}`;
    } else if (part === '3') {
        payload.correct = document.getElementById('correct-p3').value;
    }

    btnSubmit.disabled = true;
    btnSubmit.innerText = isEditing ? "⏳ Đang cập nhật câu hỏi..." : "⏳ Đang lưu câu hỏi...";

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
    })
    .then(res => res.json())
    .then(data => {
        alert(isEditing ? "🎉 Đã cập nhật câu hỏi thành công!" : "🎉 Đã lưu câu hỏi thành công vào Ngân hàng!");
        resetFormToCreate();
        loadExamSuggestions();
        loadBankList();
    })
    .catch(err => {
        console.error(err);
        alert("❌ Lỗi khi gửi dữ liệu. Vui lòng kiểm tra lại đường truyền!");
    })
    .finally(() => {
        btnSubmit.disabled = false;
    });
}

function generateAndExportRandomExamPDF() {
    const selectedExam = document.getElementById('filter-admin-exam').value;
    
    const countInput = prompt("Bạn muốn xuất bao nhiêu đề thi?", "1");
    if (countInput === null) return;
    
    const numberOfExams = parseInt(countInput);
    if (isNaN(numberOfExams) || numberOfExams < 1) {
        alert("Số lượng đề thi không hợp lệ!");
        return;
    }

    if (numberOfExams > 30) {
        if (!confirm(`Bạn đang chọn xuất ${numberOfExams} đề thi (dung lượng rất lớn). Quá trình render có thể mất vài giây, bạn có muốn tiếp tục?`)) {
            return;
        }
    }

    let examQuestions = [];
    if (!selectedExam || selectedExam.trim() === "") {
        examQuestions = [...allBankQuestions];
    } else {
        examQuestions = allBankQuestions.filter(q => q.examName === selectedExam);
    }

    if (examQuestions.length === 0) {
        alert("Chưa có câu hỏi nào trong ngân hàng!");
        return;
    }

    let grouped = { 1: {}, 2: {}, 3: {} };
    examQuestions.forEach(q => {
        let part = q.part, set = q.setNum;
        if (grouped[part]) {
            if (!grouped[part][set]) grouped[part][set] = [];
            grouped[part][set].push(q);
        }
    });

    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const examDisplayTitle = selectedExam ? selectedExam : "TỔNG HỢP NGÂN HÀNG CÂU HỎI";

    let answerKeysList = [];

    let printWindow = window.open('', '_blank');
    let html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <title>Xuất ${numberOfExams} Đề Thi + Bảng Đáp Án</title>
        <style>
            @page { size: A4; margin: 12mm 15mm; }
            body { font-family: 'Times New Roman', serif; font-size: 10.5pt; line-height: 1.35; color: #000; margin: 0; padding: 0; }
            * { box-sizing: border-box; }
            
            .single-exam-page { page-break-after: always; }
            .header { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1.5px solid #000; padding-bottom: 6px; }
            .header-left, .header-right { width: 48%; text-align: center; }
            .header-title { font-size: 10pt; font-weight: bold; text-transform: uppercase; margin: 0; }
            .header-exam { font-size: 11pt; font-weight: bold; margin-top: 3px; }
            .exam-code { font-weight: bold; border: 1px solid #000; display: inline-block; padding: 1px 6px; margin-top: 3px; font-size: 9.5pt; }
            .student-info { margin-bottom: 12px; font-size: 10pt; }
            .part-title { font-weight: bold; margin-top: 10px; margin-bottom: 6px; font-size: 10.5pt; text-transform: uppercase; background: #eafeea; padding: 3px 6px; border-left: 3px solid #10b981; }
            .q-block { margin-top: 10px; page-break-inside: avoid; }
            .q-img-center { text-align: center; margin: 4px 0; }
            .q-img-center img { max-width: 60%; max-height: 140px; object-fit: contain; }
            .opt-table { width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 6px; }
            .opt-table td { padding: 3px 6px 3px 0; vertical-align: middle; font-size: 10.5pt; }
            .tf-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
            .tf-table th, .tf-table td { border: 1px solid #000; padding: 4px; text-align: left; font-size: 10pt; }
            .tf-table th { background: #f8fafc; text-align: center; }
            .short-ans { display: inline-block; width: 100%; border-bottom: 1px dotted #000; margin-top: 10px; height: 18px; }
            .key-title { font-size: 14pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 8px; }
            .key-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .key-table th, .key-table td { border: 1px solid #000; padding: 5px; text-align: center; font-size: 10pt; }
            .key-table th { background: #f1f5f9; font-weight: bold; }
            .key-exam-badge { background: #1e1b4b; color: white; padding: 3px 8px; font-weight: bold; border-radius: 4px; display: inline-block; margin-bottom: 6px; }
            #print-loading-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(255, 255, 255, 0.95); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 99999; font-family: sans-serif; }
            .spinner-loader { border: 5px solid #f3f3f3; border-top: 5px solid #4f46e5; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 15px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @media print { #print-loading-overlay { display: none !important; } }
        </style>
        <script>
            window.MathJax = {
                tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']], displayMath: [['\\\\[', '\\\\]']] },
                startup: { typeset: false }
            };
        </script>
        <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" defer></script>
    </head>
    <body>
        <div id="print-loading-overlay">
            <div class="spinner-loader"></div>
            <h2 style="color: #1e1b4b; margin: 0;">⏳ Đang khởi tạo ${numberOfExams} đề thi...</h2>
            <p style="color: #64748b; margin-top: 8px;">Hệ thống đang xử lý công thức toán, vui lòng chờ trong giây lát!</p>
        </div>`;

    for (let examIndex = 0; examIndex < numberOfExams; examIndex++) {
        let selectedSet = [];

        for (let i = 1; i <= 12; i++) {
            if (grouped[1][i] && grouped[1][i].length > 0) selectedSet.push(pickRandom(grouped[1][i]));
        }
        for (let i = 1; i <= 4; i++) {
            if (grouped[2][i] && grouped[2][i].length > 0) selectedSet.push(pickRandom(grouped[2][i]));
        }
        for (let i = 1; i <= 6; i++) {
            if (grouped[3][i] && grouped[3][i].length > 0) selectedSet.push(pickRandom(grouped[3][i]));
        }

        if (selectedSet.length === 0) {
            alert("Không đủ câu hỏi trong hệ thống để trộn đề!");
            return;
        }

        const examCode = Math.floor(1000 + Math.random() * 9000);
        let currentExamKey = { code: examCode, answers: {} };

        html += `<div class="single-exam-page">
            <div class="header">
                <div class="header-left">
                    <div class="header-title">Môn: Toán</div>
                    <div><i>Thời gian làm bài: 90 phút</i></div>
                </div>
                <div class="header-right">
                    <div class="header-title">ĐỀ THI KẾT THÚC HỌC PHẦN</div>
                    <div class="header-exam">${examDisplayTitle}</div>
                    <div class="exam-code">MÃ ĐỀ: ${examCode}</div>
                </div>
            </div>
            
            <div class="student-info">
                Họ và tên thí sinh: ..................................................................................... 
                Số báo danh: ............................................
            </div>`;

        let qIndex = 1;

        const p1 = selectedSet.filter(q => q.part == 1);
        if (p1.length > 0) {
            html += `<div class="part-title">PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (12 câu)</div>`;
            p1.forEach((q) => {
                currentExamKey.answers[`Câu ${qIndex}`] = q.correct || '-';

                let optA = q.optA || '', optB = q.optB || '', optC = q.optC || '', optD = q.optD || '';

                function getCleanLength(text) {
                    if (!text) return 0;
                    return text.replace(/\\begin\{[a-zA-Z0-9\*]+\}[\s\S]*?\\end\{[a-zA-Z0-9\*]+\}/g, 'X')
                               .replace(/\\[a-zA-Z]+/g, '')
                               .replace(/[\$\{\}\^_\(\)\[\]\\\|]/g, '')
                               .trim().length;
                }

                let maxLen = Math.max(getCleanLength(optA), getCleanLength(optB), getCleanLength(optC), getCleanLength(optD));

                let optionsTableHtml = '';
                if (maxLen > 45) {
                    optionsTableHtml = `
                    <table class="opt-table">
                        <tr><td><b>A.</b> ${optA}</td></tr>
                        <tr><td><b>B.</b> ${optB}</td></tr>
                        <tr><td><b>C.</b> ${optC}</td></tr>
                        <tr><td><b>D.</b> ${optD}</td></tr>
                    </table>`;
                } else if (maxLen > 18) {
                    optionsTableHtml = `
                    <table class="opt-table">
                        <tr>
                            <td style="width: 50%;"><b>A.</b> ${optA}</td>
                            <td style="width: 50%;"><b>B.</b> ${optB}</td>
                        </tr>
                        <tr>
                            <td style="width: 50%;"><b>C.</b> ${optC}</td>
                            <td style="width: 50%;"><b>D.</b> ${optD}</td>
                        </tr>
                    </table>`;
                } else {
                    optionsTableHtml = `
                    <table class="opt-table">
                        <tr>
                            <td style="width: 25%;"><b>A.</b> ${optA}</td>
                            <td style="width: 25%;"><b>B.</b> ${optB}</td>
                            <td style="width: 25%;"><b>C.</b> ${optC}</td>
                            <td style="width: 25%;"><b>D.</b> ${optD}</td>
                        </tr>
                    </table>`;
                }

                let imgHtml = q.imageUrl ? `<div class="q-img-center"><img src="${convertDriveUrl(q.imageUrl)}"></div>` : '';

                html += `
                <div class="q-block">
                    <b>Câu ${qIndex++}.</b> ${q.content}
                    ${imgHtml}
                    ${optionsTableHtml}
                </div>`;
            });
        }

        const p2 = selectedSet.filter(q => q.part == 2);
        if (p2.length > 0) {
            html += `<div class="part-title">PHẦN II. Câu trắc nghiệm đúng sai (4 câu)</div>`;
            p2.forEach((q) => {
                let tfArr = (q.correct || 'D,D,D,D').split(',');
                let formattedTf = `a-${tfArr[0] || 'D'}, b-${tfArr[1] || 'D'}, c-${tfArr[2] || 'D'}, d-${tfArr[3] || 'D'}`;
                currentExamKey.answers[`Câu ${qIndex}`] = formattedTf;

                let imgHtml = q.imageUrl ? `<div class="q-img-center"><img src="${convertDriveUrl(q.imageUrl)}"></div>` : '';
                html += `
                <div class="q-block">
                    <b>Câu ${qIndex++}.</b> Đọc thông tin và cho biết các ý hỏi sau Đúng hay Sai.
                    <p><i>${q.content}</i></p>
                    ${imgHtml}
                    <table class="tf-table">
                        <tr>
                            <th style="width: 70%;">Ý hỏi / Lệnh</th>
                            <th style="width: 15%;">Đúng</th>
                            <th style="width: 15%;">Sai</th>
                        </tr>
                        <tr><td>a) ${q.optA || ''}</td><td></td><td></td></tr>
                        <tr><td>b) ${q.optB || ''}</td><td></td><td></td></tr>
                        <tr><td>c) ${q.optC || ''}</td><td></td><td></td></tr>
                        <tr><td>d) ${q.optD || ''}</td><td></td><td></td></tr>
                    </table>
                </div>`;
            });
        }

        const p3 = selectedSet.filter(q => q.part == 3);
        if (p3.length > 0) {
            html += `<div class="part-title">PHẦN III. Câu trắc nghiệm trả lời ngắn (6 câu)</div>`;
            p3.forEach((q) => {
                currentExamKey.answers[`Câu ${qIndex}`] = q.correct || '-';

                let imgHtml = q.imageUrl ? `<div class="q-img-center"><img src="${convertDriveUrl(q.imageUrl)}"></div>` : '';
                html += `
                <div class="q-block">
                    <b>Câu ${qIndex++}.</b> ${q.content} ${imgHtml}
                    <div class="short-ans"></div>
                </div>`;
            });
        }

        html += `
            <div style="text-align: center; margin-top: 30px; font-weight: bold;">--- HẾT ---</div>
        </div>`;

        answerKeysList.push(currentExamKey);
    }

    html += `
    <div style="page-break-before: always; padding-top: 10px;">
        <div class="key-title">🔑 BẢNG ĐÁP ÁN TỔNG HỢP (DÀNH CHO GIÁO VIÊN)</div>
        <p style="text-align:center; font-style:italic; margin-bottom: 20px;">Kỳ thi / Đợt thi: ${examDisplayTitle}</p>
    `;

    answerKeysList.forEach(item => {
        html += `
        <div style="margin-bottom: 20px;">
            <div class="key-exam-badge">MÃ ĐỀ: ${item.code}</div>
            
            <table class="key-table">
                <tr><th colspan="12" style="background:#e0e7ff; text-align:left;">PHẦN I (12 câu ABCD)</th></tr>
                <tr>
                    ${[1,2,3,4,5,6,7,8,9,10,11,12].map(num => `<th>C${num}</th>`).join('')}
                </tr>
                <tr>
                    ${[1,2,3,4,5,6,7,8,9,10,11,12].map(num => `<td><b>${item.answers[`Câu ${num}`] || '-'}</b></td>`).join('')}
                </tr>
            </table>

            <table class="key-table">
                <tr><th colspan="4" style="background:#fef3c7; text-align:left;">PHẦN II (4 câu Đúng/Sai)</th></tr>
                <tr>
                    ${[13,14,15,16].map(num => `<th>Câu ${num}</th>`).join('')}
                </tr>
                <tr>
                    ${[13,14,15,16].map(num => `<td style="font-size:8.5pt;">${item.answers[`Câu ${num}`] || '-'}</td>`).join('')}
                </tr>
            </table>

            <table class="key-table">
                <tr><th colspan="6" style="background:#f1f5f9; text-align:left;">PHẦN III (6 câu Trả lời ngắn)</th></tr>
                <tr>
                    ${[17,18,19,20,21,22].map(num => `<th>Câu ${num}</th>`).join('')}
                </tr>
                <tr>
                    ${[17,18,19,20,21,22].map(num => `<td><b>${item.answers[`Câu ${num}`] || '-'}</b></td>`).join('')}
                </tr>
            </table>
        </div>`;
    });

    html += `
    </div>
    <script>
        window.addEventListener('load', function() {
            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise().then(() => {
                    const overlay = document.getElementById('print-loading-overlay');
                    if (overlay) overlay.style.display = 'none';
                    setTimeout(() => { window.print(); }, 800);
                }).catch(err => {
                    console.error(err);
                    const overlay = document.getElementById('print-loading-overlay');
                    if (overlay) overlay.style.display = 'none';
                    window.print();
                });
            } else {
                setTimeout(() => { window.print(); }, 2000);
            }
        });
    </script>
    </body>
    </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
}