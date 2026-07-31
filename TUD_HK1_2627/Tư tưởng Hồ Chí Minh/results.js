let rawResultsData = [];
let rawBankData = [];
let filteredData = [];

document.addEventListener('DOMContentLoaded', () => {
    loadResultsData();
});

function loadResultsData() {
    const loading = document.getElementById('loading-indicator');
    const table = document.getElementById('results-table');
    
    if (loading) loading.style.display = 'block';
    if (table) table.style.display = 'none';

    fetch(`${GOOGLE_SCRIPT_URL}?action=getResults`)
        .then(response => response.json())
        .then(data => {
            rawResultsData = data.results || [];
            rawBankData = data.bank || [];
            filteredData = [...rawResultsData];
            
            populateExamFilter();
            renderTable();
            updateStats();
        })
        .catch(error => {
            console.error("Lỗi tải bài làm:", error);
            alert("Không thể tải danh sách kết quả!");
        })
        .finally(() => {
            if (loading) loading.style.display = 'none';
            if (table) table.style.display = 'table';
        });
}

function renderTable() {
    const tbody = document.getElementById('results-tbody');
    tbody.innerHTML = '';

    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px;">Không tìm thấy dữ liệu phù hợp!</td></tr>`;
        return;
    }

    filteredData.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.timestamp}</td>
            <td><strong>${item.studentName}</strong></td>
            <td><code>${item.username}</code></td>
            <td>${item.examName}</td>
            <td>${item.extraData}</td>
            <td><span class="score-badge">${item.score}</span></td>
            <td>
                <button class="btn-detail" onclick="viewDetail(${item.id - 1})">👁️ Xem bài làm</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function populateExamFilter() {
    const filter = document.getElementById('exam-filter');
    const exams = [...new Set(rawResultsData.map(item => item.examName))];
    filter.innerHTML = `<option value="">-- Tất cả đợt thi --</option>`;
    exams.forEach(exam => {
        if(exam) filter.innerHTML += `<option value="${exam}">${exam}</option>`;
    });
}

function filterResults() {
    const keyword = document.getElementById('search-input').value.toLowerCase().trim();
    const selectedExam = document.getElementById('exam-filter').value;

    filteredData = rawResultsData.filter(item => {
        const matchName = item.studentName.toLowerCase().includes(keyword) || item.username.toLowerCase().includes(keyword);
        const matchExam = selectedExam === "" || item.examName === selectedExam;
        return matchName && matchExam;
    });

    renderTable();
    updateStats();
}

function updateStats() {
    document.getElementById('stat-total').innerText = filteredData.length;
    let scores = filteredData.map(item => parseFloat((item.score || "0").split('/')[0]) || 0);

    if (scores.length > 0) {
        let sum = scores.reduce((a, b) => a + b, 0);
        document.getElementById('stat-avg').innerText = `${(sum / scores.length).toFixed(2)}/10`;
        document.getElementById('stat-max').innerText = `${Math.max(...scores).toFixed(2)}/10`;
    } else {
        document.getElementById('stat-avg').innerText = "0.0";
        document.getElementById('stat-max').innerText = "0.0";
    }
}

function extractImage(text) {
    let imgUrl = "";
    let cleanText = text || "";
    const imgRegex = /\[img\](.*?)\[\/img\]/i;
    const match = cleanText.toString().match(imgRegex);
    if (match) {
        imgUrl = match[1];
        cleanText = cleanText.toString().replace(imgRegex, '').trim();
    }
    return { cleanText, imgUrl };
}
function viewDetail(index) {
    const item = rawResultsData[index];
    if (!item) return;

    document.getElementById('modal-title').innerText = `📄 XEM BÀI LÀM CHI TIẾT: ${item.studentName.toUpperCase()} (${item.username})`;

    // Đọc dữ liệu mới lưu (có chứa cả answers và questions)
    let savedData = {};
    try { savedData = JSON.parse(item.userAnswersText); } catch (e) { savedData = {}; }
    let userAns = savedData.answers || savedData; 
    let examQuestions = savedData.questions || [];

    let modalHtml = `
        <div class="exam-review-container">
            <div class="modal-info">
                <p><strong>Họ và tên:</strong> ${item.studentName} | <strong>MSSV/SBD:</strong> ${item.username}</p>
                <p><strong>Đợt thi:</strong> ${item.examName} | <strong>Thời gian nộp:</strong> ${item.timestamp}</p>
                <p><strong>Kết quả đạt được:</strong> <span class="highlight-score">${item.score}</span> (Đã làm: ${item.extraData})</p>
            </div>
            <hr style="margin: 20px 0; border:0; border-top: 1px solid #cbd5e1;">
    `;

    let qIndex = 1;

    // HÀM HỖ TRỢ 1: Tìm đúng câu hỏi thí sinh đã làm
    function getQBank(part, setNum) {
        let qFromExam = examQuestions.find(q => q.id === qIndex);
        if (qFromExam) {
            // Chuyển đổi định dạng câu hỏi từ bài thi sang định dạng ngân hàng
            if (part === 1) return { content: qFromExam.question, imageUrl: qFromExam.image, optA: qFromExam.options[0], optB: qFromExam.options[1], optC: qFromExam.options[2], optD: qFromExam.options[3], correct: qFromExam.correct };
            if (part === 2) return { content: qFromExam.reading, imageUrl: qFromExam.image, optA: qFromExam.subQuestions[0].text, optB: qFromExam.subQuestions[1].text, optC: qFromExam.subQuestions[2].text, optD: qFromExam.subQuestions[3].text, correct: qFromExam.subQuestions.map(s => s.correct).join(',') };
            if (part === 3) return { content: qFromExam.question, imageUrl: qFromExam.image, correct: qFromExam.correct };
        }
        // Fallback: Nếu là dữ liệu cũ chưa có questions, tìm trong ngân hàng
        return rawBankData.find(q => q.part == part && q.setNum == setNum && q.examName === item.examName);
    }

    // HÀM HỖ TRỢ 2: Lấy link ảnh chuẩn xác
    function getFinalImage(qBank) {
        let parsed = extractImage(qBank.content);
        // Ưu tiên ảnh từ đề thi thực tế (qBank.imageUrl), nếu không có mới dùng ảnh parse từ ngân hàng cũ
        let finalImg = qBank.imageUrl || parsed.imgUrl;
        // Tự động convert link Drive nếu hàm convertDriveUrl tồn tại
        if (finalImg && typeof convertDriveUrl === "function") {
            finalImg = convertDriveUrl(finalImg);
        }
        return { text: parsed.cleanText, img: finalImg };
    }

    // PHẦN I: 12 câu ABCD
    modalHtml += `<h3 class="part-title">PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn</h3>`;
    for (let i = 1; i <= 12; i++) {
        let qBank = getQBank(1, i);
        if (qBank) {
            let parsedInfo = getFinalImage(qBank);
            let uVal = userAns[`q${qIndex}`] || "Chưa chọn";
            let correctVal = (qBank.correct || "").toUpperCase();
            let isCorrect = uVal === correctVal;

            modalHtml += `
                <div class="review-q-item ${isCorrect ? 'correct-border' : 'wrong-border'}">
                    <p><strong>Câu ${qIndex}.</strong> ${parsedInfo.text}</p>
                    ${parsedInfo.img ? `<img src="${parsedInfo.img}" class="review-img">` : ''}
                    <div class="review-options">
                        ${['A', 'B', 'C', 'D'].map((opt) => {
                            let optText = qBank[`opt${opt}`] || '';
                            let cls = '';
                            if (opt === correctVal) cls = 'correct-opt';
                            if (opt === uVal && !isCorrect) cls = 'wrong-opt';
                            return `<div class="opt-line ${cls}">${opt}. ${optText} ${opt === uVal ? '👈 <i>(Thí sinh chọn)</i>' : ''}</div>`;
                        }).join('')}
                    </div>
                    <div class="review-status">
                        <span>Bài làm: <b>${uVal}</b> | Đáp án đúng: <b class="text-success">${correctVal}</b></span>
                        <span class="status-icon">${isCorrect ? '✅ Đúng (+0.25đ)' : '❌ Sai'}</span>
                    </div>
                </div>
            `;
        }
        qIndex++;
    }

    // PHẦN II: 6 câu Đúng/Sai
    modalHtml += `<h3 class="part-title">PHẦN II. Câu trắc nghiệm đúng sai</h3>`;
    for (let i = 1; i <= 6; i++) {
        let qBank = getQBank(2, i);
        if (qBank) {
            let parsedInfo = getFinalImage(qBank);
            let correctArr = (qBank.correct || "").replace(/\s/g, '').toUpperCase().split(',');

            modalHtml += `
                <div class="review-q-item">
                    <p><strong>Câu ${qIndex}.</strong> Đọc thông tin và cho biết các ý hỏi sau Đúng hay Sai.</p>
                    <p class="reading-quote">${parsedInfo.text}</p>
                    ${parsedInfo.img ? `<img src="${parsedInfo.img}" class="review-img">` : ''}
                    
                    <table class="tf-review-table">
                        <tr><th>Ý hỏi</th><th>Thí sinh chọn</th><th>Đáp án đúng</th><th>Kết quả</th></tr>
                        ${['a', 'b', 'c', 'd'].map((sub, idx) => {
                            let subText = qBank[`opt${sub.toUpperCase()}`] || '';
                            let uVal = userAns[`q${qIndex}${sub}`] || "---";
                            let cVal = correctArr[idx] || "";
                            let isSubCorrect = uVal === cVal;
                            return `
                                <tr>
                                    <td>${sub}) ${subText}</td>
                                    <td><b class="${uVal === 'D' ? 'text-blue' : 'text-red'}">${uVal === 'D' ? 'Đúng' : (uVal === 'S' ? 'Sai' : 'Chưa làm')}</b></td>
                                    <td><b class="text-success">${cVal === 'D' ? 'Đúng' : 'Sai'}</b></td>
                                    <td>${isSubCorrect ? '✅' : '❌'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </table>
                </div>
            `;
        }
        qIndex++;
    }

    // PHẦN III: 6 câu Trả lời ngắn
    modalHtml += `<h3 class="part-title">PHẦN III. Câu trắc nghiệm trả lời ngắn</h3>`;
    for (let i = 1; i <= 6; i++) {
        let qBank = getQBank(3, i);
        if (qBank) {
            let parsedInfo = getFinalImage(qBank);
            let uVal = (userAns[`q${qIndex}`] || "").toString().trim();
            let cVal = (qBank.correct || "").toString().trim();

            let uNum = uVal.replace(/,/g, '.');
            let cNum = cVal.replace(/,/g, '.');
            let isCorrect = (!isNaN(uNum) && !isNaN(cNum) && uNum !== "" && parseFloat(uNum) === parseFloat(cNum)) || (uVal.toLowerCase() === cVal.toLowerCase());

            modalHtml += `
                <div class="review-q-item ${isCorrect ? 'correct-border' : 'wrong-border'}">
                    <p><strong>Câu ${qIndex}.</strong> ${parsedInfo.text}</p>
                    ${parsedInfo.img ? `<img src="${parsedInfo.img}" class="review-img">` : ''}
                    <div class="review-status">
                        <span>Thí sinh nhập: <b>${uVal || '<i>Chưa nhập</i>'}</b> | Đáp án chuẩn: <b class="text-success">${cVal}</b></span>
                        <span class="status-icon">${isCorrect ? '✅ Đúng (+0.5đ)' : '❌ Sai'}</span>
                    </div>
                </div>
            `;
        }
        qIndex++;
    }

    modalHtml += '</div>';
    
    document.getElementById('modal-body').innerHTML = modalHtml;
    
    const modalHeader = document.querySelector('.modal-header');
    if (modalHeader) {
        modalHeader.innerHTML = `
            <h3 id="modal-title">${document.getElementById('modal-title').innerText}</h3>
            <button class="close-btn" onclick="closeModal()">✕ Thoát xem bài làm</button>
        `;
    }

    document.getElementById('detail-modal').classList.add('active');

    if (window.MathJax) {
        window.MathJax.typesetPromise([document.getElementById('modal-body')]).catch(err => console.log(err));
    }
}
function closeModal() {
    document.getElementById('detail-modal').classList.remove('active');
}

function exportToExcel() {
    if (filteredData.length === 0) return alert("Không có dữ liệu!");
    let exportList = filteredData.map((item, idx) => ({
        "STT": idx + 1, "Thời Gian Nộp": item.timestamp, "Họ Và Tên": item.studentName,
        "SBD / MSSV": item.username, "Đợt Thi": item.examName, "Số Câu Đã Làm": item.extraData,
        "Điểm Số": item.score, "Chi Tiết Đáp Án JSON": item.userAnswersText
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportList);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "KetQuaThi");
    XLSX.writeFile(workbook, `Ket_Qua_Thi_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function exportToCSV() {
    if (filteredData.length === 0) return alert("Không có dữ liệu!");
    let csvContent = "\uFEFFSTT,Thời Gian Nộp,Họ Và Tên,SBD/MSSV,Đợt Thi,Số Câu Đã Làm,Điểm Số,Chi Tiết Đáp Án\n";
    filteredData.forEach((item, idx) => {
        csvContent += `${idx + 1},"${item.timestamp}","${item.studentName}","${item.username}","${item.examName}","${item.extraData}","${item.score}","${(item.userAnswersText || '').replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Ket_Qua_Thi_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
}
function extractImage(text) {
    let imgUrl = "";
    let cleanText = text || "";
    const imgRegex = /\[img\](.*?)\[\/img\]/i;
    const match = cleanText.toString().match(imgRegex);
    if (match) {
        imgUrl = convertDriveUrl(match[1]); // Tự động convert link Drive
        cleanText = cleanText.toString().replace(imgRegex, '').trim();
    }
    return { cleanText, imgUrl };
}