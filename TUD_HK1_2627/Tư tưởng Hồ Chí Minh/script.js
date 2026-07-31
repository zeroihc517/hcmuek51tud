let examData = [];
const userAnswers = {};
const flaggedQuestions = new Set();
let currentZoom = 1.0;
let countdown;
let violationCount = 0;
let isExamActive = false;

// TỰ ĐỘNG LẤY TÊN ĐỢT THI TỪ FILE HTML
const currentExamName = window.FIXED_EXAM_NAME;

function convertDriveUrl(url) {
    if (!url) return "";
    const driveMatch = url.trim().match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]+)/i);
    if (driveMatch && driveMatch[1]) {
        return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    }
    return url.trim();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('init-loading').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
    initSystem();
    setupFullscreenAndAntiCheat();
    setupAntiCopyAndSecurity();
});

// TÍNH NĂNG CHẶN XEM NGUỒN TRANG (VIEW-SOURCE), DEVTOOLS, COPY & MỘT SỐ PHÍM TẮT BẢO MẬT
function setupAntiCopyAndSecurity() {
    // 1. Chận thao tác copy / cut / paste
    document.addEventListener('copy', (e) => {
        e.preventDefault();
        alert("⚠️ Bảo mật bài thi: Hệ thống đã chặn thao tác SAO CHÉP (COPY)!");
    });

    document.addEventListener('cut', (e) => {
        e.preventDefault();
    });

    // 2. Chặn chuột phải (Context Menu)
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        alert("⚠️ Bảo mật bài thi: Hệ thống đã chặn MENU CHUỘT PHẢI!");
    });

    // 3. Chặn các phím tắt mở Developer Tools (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C) 
    // và phím tắt xem nguồn trang (Ctrl+U), Lưu trang (Ctrl+S), In ấn (Ctrl+P)
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        
        // Chặn F12
        if (e.keyCode === 123 || key === 'f12') {
            e.preventDefault();
            e.stopPropagation();
            alert("⚠️ Bảo mật bài thi: Đã chặn phím F12 (Developer Tools)!");
            return false;
        }

        // Chặn Ctrl+U (Xem nguồn trang - View Page Source)
        if (e.ctrlKey && key === 'u') {
            e.preventDefault();
            e.stopPropagation();
            alert("⚠️ Bảo mật bài thi: Đã chặn xem NGUỒN TRANG (View Source)!");
            return false;
        }

        // Chặn Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (Mở F12 Console/Inspect Element)
        if (e.ctrlKey && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
            e.preventDefault();
            e.stopPropagation();
            alert("⚠️ Bảo mật bài thi: Đã chặn công cụ kiểm tra phần tử (Inspect Element)!");
            return false;
        }

        // Chặn Ctrl+S (Lưu trang), Ctrl+P (In trang), Ctrl+A (Chọn tất cả)
        if (e.ctrlKey && (key === 's' || key === 'p' || key === 'a')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });
}

function initSystem() {
    const savedUser = JSON.parse(localStorage.getItem('currentUser'));
    if (savedUser) {
        document.getElementById('login-fullname').value = savedUser.name || savedUser.fullName || '';
        document.getElementById('login-sbd').value = savedUser.mssv || savedUser.sbd || '';
    }

    const loginForm = document.getElementById('login-form');
    loginForm.onsubmit = (e) => {
        e.preventDefault();
        const fullName = document.getElementById('login-fullname').value.trim();
        const sbd = document.getElementById('login-sbd').value.trim();
        
        localStorage.setItem('currentUser', JSON.stringify({
            name: fullName, fullName: fullName, mssv: sbd, sbd: sbd, examName: currentExamName
        }));

        requestFullscreenMode();

        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('init-loading').classList.add('active');

        loadExamDataAndStart(currentExamName, fullName, sbd);
    };

    const container = document.getElementById('questions-container');
    
    container.addEventListener('change', (e) => {
        if (e.target.type === 'radio') {
            userAnswers[e.target.name] = e.target.value;
            localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
            const match = e.target.name.match(/\d+/);
            if (match) updateDotStatus(match[0]);
            updateAnswerCount();
        }
    });

    container.addEventListener('input', (e) => {
        if (e.target.type === 'text') {
            userAnswers[e.target.name] = e.target.value;
            localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
            const match = e.target.name.match(/\d+/);
            if (match) updateDotStatus(match[0]);
            updateAnswerCount();
        }
    });

    const savedAnswers = JSON.parse(localStorage.getItem('userAnswers'));
    const examTimeLeft = localStorage.getItem('examTimeLeft');
    
    if (savedUser && (examTimeLeft !== null || savedAnswers !== null)) {
        if (savedAnswers) Object.assign(userAnswers, savedAnswers);
        
        const userName = savedUser.name || savedUser.fullName;
        const userSbd = savedUser.mssv || savedUser.sbd;
        
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('init-loading').classList.add('active');
        
        loadExamDataAndStart(currentExamName, userName, userSbd);
    }
}

function loadExamDataAndStart(selectedExam, fullName, sbd) {
    fetch(`${GOOGLE_SCRIPT_URL}?examName=${encodeURIComponent(selectedExam)}`)
        .then(res => res.json())
        .then(data => {
            examData = data;
            document.getElementById('init-loading').classList.remove('active');
            showExamScreen(fullName, sbd);
            renderAllQuestions();
            buildNavDots();
            
            for (let i = 1; i <= examData.length; i++) {
                updateDotStatus(i);
            }
            updateAnswerCount();
            isExamActive = true;
        })
        .catch(err => {
            console.error("Lỗi tải đề thi:", err);
            alert("Lỗi tải đề thi. Vui lòng kiểm tra lại kết nối mạng!");
        });
}

function buildNavDots() {
    const navDots = document.getElementById('navDots');
    if (!navDots) return;
    navDots.innerHTML = '';
    
    for (let i = 1; i <= examData.length; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.id = `dot-${i}`;
        dot.innerText = i;
        dot.onclick = () => scrollToQuestion(i);
        navDots.appendChild(dot);
    }
}

function scrollToQuestion(index) {
    const targetEl = document.getElementById(`q-block-${index}`);
    if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function updateDotStatus(qIndex) {
    const dot = document.getElementById(`dot-${qIndex}`);
    if (!dot) return;

    let isDone = false;
    const qData = examData[qIndex - 1];
    
    if (qData) {
        if (qData.part === 1 || qData.part === 3) {
            if (userAnswers[`q${qIndex}`] && userAnswers[`q${qIndex}`].trim() !== '') isDone = true;
        } else if (qData.part === 2) {
            if (['a','b','c','d'].some(sub => userAnswers[`q${qIndex}${sub}`])) isDone = true;
        }
    }

    if (isDone) dot.classList.add('done');
    else dot.classList.remove('done');

    if (flaggedQuestions.has(parseInt(qIndex))) dot.classList.add('flagged');
    else dot.classList.remove('flagged');
}

function toggleFlag(qIndex) {
    let targetIndex = qIndex;
    if (!targetIndex) {
        let minDiff = Infinity;
        examData.forEach((_, idx) => {
            const el = document.getElementById(`q-block-${idx + 1}`);
            if (el) {
                const rect = el.getBoundingClientRect();
                const diff = Math.abs(rect.top - 150);
                if (diff < minDiff) {
                    minDiff = diff;
                    targetIndex = idx + 1;
                }
            }
        });
    }

    if (!targetIndex) targetIndex = 1;

    if (flaggedQuestions.has(targetIndex)) {
        flaggedQuestions.delete(targetIndex);
        document.getElementById(`q-block-${targetIndex}`)?.classList.remove('flagged');
    } else {
        flaggedQuestions.add(targetIndex);
        document.getElementById(`q-block-${targetIndex}`)?.classList.add('flagged');
    }
    updateDotStatus(targetIndex);
}

function requestFullscreenMode() {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) docEl.requestFullscreen().catch(err => console.log(err));
    else if (docEl.mozRequestFullScreen) docEl.mozRequestFullScreen();
    else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
    else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
}

function setupFullscreenAndAntiCheat() {
    const handleFs = () => {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        if (!isFullscreen && isExamActive) triggerViolationWarning();
    };
    document.addEventListener('fullscreenchange', handleFs);
    document.addEventListener('webkitfullscreenchange', handleFs);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && isExamActive) triggerViolationWarning();
    });
}

function triggerViolationWarning() {
    violationCount++;
    document.getElementById('violation-count').innerText = violationCount;
    document.getElementById('warning-modal').classList.add('active');
}

function forceFullscreenAndResume() {
    requestFullscreenMode();
    document.getElementById('warning-modal').classList.remove('active');
}

function showExamScreen(fullName, sbd) {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('exam-screen').classList.add('active');

    const now = new Date();
    document.getElementById('display-fullname').innerText = fullName;
    document.getElementById('display-sbd').innerText = sbd;
    document.getElementById('display-date').innerText = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    startTimer(60 * 60);
}

function startTimer(duration) {
    const savedTime = localStorage.getItem('examTimeLeft');
    let timeLeft = (savedTime !== null) ? parseInt(savedTime) : duration;
    const timerElement = document.getElementById('timer');
    
    if (countdown) clearInterval(countdown);
    
    countdown = setInterval(() => {
        let m = Math.floor(timeLeft / 60);
        let s = timeLeft % 60;
        timerElement.innerText = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        
        localStorage.setItem('examTimeLeft', timeLeft);

        if (timeLeft <= 0) { 
            clearInterval(countdown); 
            localStorage.removeItem('examTimeLeft');
            alert("Đã hết thời gian làm bài! Hệ thống tự động thu bài.");
            executeSubmission(); 
        }
        timeLeft--;
    }, 1000);
}

function renderAllQuestions() {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';

    examData.forEach((qData, index) => {
        const qIndex = index + 1;
        const imgUrl = convertDriveUrl(qData.image);
        const imgHtml = imgUrl ? `<img src="${imgUrl}" alt="Hình ảnh câu hỏi">` : '';
        const isFlagged = flaggedQuestions.has(qIndex) ? 'flagged' : '';
        
        const itemDiv = document.createElement('div');
        itemDiv.className = `question-item ${isFlagged}`;
        itemDiv.id = `q-block-${qIndex}`;

        let contentHtml = '';

        if (qData.part === 1) {
            contentHtml = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <p><strong>Câu ${qIndex}.</strong> ${qData.question}</p>
                    <button class="icon-btn" onclick="toggleFlag(${qIndex})" title="Đánh dấu cờ câu này">🚩</button>
                </div>
                ${imgHtml}
                <div class="options">
                    ${['A', 'B', 'C', 'D'].map((opt, i) => {
                        const isChecked = userAnswers[`q${qIndex}`] === opt ? 'checked' : '';
                        return `<label><input type="radio" name="q${qIndex}" value="${opt}" ${isChecked}> ${opt}. ${qData.options[i]}</label>`;
                    }).join('')}
                </div>`;
        } else if (qData.part === 2) {
            contentHtml = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <p><strong>Câu ${qIndex}.</strong> ${qData.question}</p>
                    <button class="icon-btn" onclick="toggleFlag(${qIndex})" title="Đánh dấu cờ câu này">🚩</button>
                </div>
                <div style="background:#f1f5f9; padding:12px; margin-bottom:12px; border-left:4px solid #1e3a8a; font-style:italic;">${qData.reading || ''}</div>
                ${imgHtml}
                <table class="tf-table">
                    <tr><th>Lệnh/Ý hỏi</th><th>Đúng</th><th>Sai</th></tr>
                    ${qData.subQuestions.map(sub => {
                        const val = userAnswers[`q${qIndex}${sub.id}`];
                        return `<tr>
                            <td>${sub.id}) ${sub.text}</td>
                            <td><input type="radio" name="q${qIndex}${sub.id}" value="D" ${val === 'D' ? 'checked' : ''}></td>
                            <td><input type="radio" name="q${qIndex}${sub.id}" value="S" ${val === 'S' ? 'checked' : ''}></td>
                        </tr>`;
                    }).join('')}
                </table>`;
        } else {
            const savedValue = userAnswers[`q${qIndex}`] || '';
            contentHtml = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <p><strong>Câu ${qIndex}.</strong> ${qData.question}</p>
                    <button class="icon-btn" onclick="toggleFlag(${qIndex})" title="Đánh dấu cờ câu này">🚩</button>
                </div>
                ${imgHtml} 
                <input type="text" class="short-answer-input" name="q${qIndex}" value="${savedValue}" placeholder="Nhập đáp án...">`;
        }

        itemDiv.innerHTML = contentHtml;
        container.appendChild(itemDiv);
    });

    if (window.MathJax) setTimeout(() => window.MathJax.typesetPromise(), 100);
}

function updateAnswerCount() {
    const answeredSet = new Set();
    Object.keys(userAnswers).forEach(key => {
        const match = key.match(/\d+/);
        if (match) answeredSet.add(match[0]);
    });
    document.getElementById('answered-count').innerText = `${answeredSet.size}/${examData.length}`;
}

function confirmSubmit() {
    const answeredSet = new Set();
    Object.keys(userAnswers).forEach(key => {
        const match = key.match(/\d+/);
        if (match) answeredSet.add(match[0]);
    });
    
    document.getElementById('confirm-answered-count').innerText = `${answeredSet.size}/${examData.length}`;
    document.getElementById('confirm-time-left').innerText = document.getElementById('timer').innerText;
    document.getElementById('confirm-modal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.remove('active');
}

function calculateScore() {
    let totalScore = 0;
    examData.forEach((q, idx) => {
        const qId = idx + 1;
        if (q.part === 1) {
            if (userAnswers[`q${qId}`] === q.correct) totalScore += 0.25;
        } else if (q.part === 2) {
            let correctSub = 0;
            q.subQuestions.forEach(sub => {
                if (userAnswers[`q${qId}${sub.id}`] === sub.correct) correctSub++;
            });
            if (correctSub === 4) totalScore += 1.0;
            else if (correctSub === 3) totalScore += 0.5;
            else if (correctSub === 2) totalScore += 0.25;
            else if (correctSub === 1) totalScore += 0.1;
        } else if (q.part === 3) {
            let userVal = (userAnswers[`q${qId}`] || "").toString().trim().toLowerCase();
            let correctVal = (q.correct || "").toString().trim().toLowerCase();

            let userNumStr = userVal.replace(/,/g, '.');
            let correctNumStr = correctVal.replace(/,/g, '.');

            if (!isNaN(userNumStr) && !isNaN(correctNumStr) && userNumStr !== "" && correctNumStr !== "") {
                if (parseFloat(userNumStr) === parseFloat(correctNumStr)) totalScore += 0.5;
            } else {
                if (userVal === correctVal) totalScore += 0.5;
            }
        }
    });
    return totalScore.toFixed(2);
}

function executeSubmission() {
    isExamActive = false;
    closeConfirmModal();
    if (countdown) clearInterval(countdown);
    
    const finalScore = calculateScore();
    const answeredSet = new Set();
    Object.keys(userAnswers).forEach(key => {
        const match = key.match(/\d+/);
        if (match) answeredSet.add(match[0]);
    });
    const soCauDaLam = `${answeredSet.size}/${examData.length}`;

    const savedUser = JSON.parse(localStorage.getItem('currentUser'));
    const studentName = savedUser ? (savedUser.name || savedUser.fullName) : "Ẩn danh";
    const studentMSSV = savedUser ? (savedUser.mssv || savedUser.sbd) : "000";

    if (document.exitFullscreen) document.exitFullscreen().catch(err => console.log(err));

    // Hiển thị màn hình kết quả
    document.getElementById('exam-screen').classList.remove('active');
    document.getElementById('result-screen').classList.add('active');
    document.getElementById('res-done').innerText = soCauDaLam;
    document.getElementById('res-score').innerText = `${finalScore}/10`;

    // Render xem lại câu hỏi chi tiết
    renderStudentReview();

    // Đồng bộ kết quả lên Google Sheets
    const payload = {
        username: studentMSSV,
        studentName: studentName,
        examName: currentExamName,
        score: `${finalScore}/10`,
        extraData: `${soCauDaLam} (Vi phạm: ${violationCount} lần)`,
        userAnswersText: JSON.stringify({ 
            answers: userAnswers, 
            questions: examData 
        })
    };

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "text/plain;charset=utf-8" } 
    }).catch(err => console.error("Lỗi đồng bộ bài làm:", err));

    localStorage.removeItem('userAnswers');
    localStorage.removeItem('examTimeLeft');
}

// HÀM RENDER ĐÁP ÁN ĐÚNG VÀ BÀI LÀM CỦA SINH VIÊN
function renderStudentReview() {
    const reviewContainer = document.getElementById('review-questions-container');
    if (!reviewContainer) return;
    reviewContainer.innerHTML = '';

    examData.forEach((qData, index) => {
        const qIndex = index + 1;
        const imgUrl = convertDriveUrl(qData.image);
        const imgHtml = imgUrl ? `<img src="${imgUrl}" alt="Hình ảnh câu hỏi" style="max-width:80%; border-radius:6px; margin:10px auto; display:block;">` : '';
        
        let isCorrect = false;
        let contentHtml = '';

        if (qData.part === 1) {
            const userVal = userAnswers[`q${qIndex}`] || "";
            isCorrect = (userVal === qData.correct);
            
            contentHtml = `
                <div class="review-item ${isCorrect ? 'correct-answer' : 'incorrect-answer'}">
                    <span class="review-badge ${isCorrect ? 'badge-success' : 'badge-danger'}">
                        ${isCorrect ? '✓ ĐÚNG (+0.25đ)' : '✗ SAI / CHƯA LÀM'}
                    </span>
                    <p><strong>Câu ${qIndex}.</strong> ${qData.question}</p>
                    ${imgHtml}
                    <div class="review-options">
                        ${['A', 'B', 'C', 'D'].map((opt, i) => {
                            let optionClass = '';
                            let tagHtml = '';

                            if (opt === qData.correct && opt === userVal) {
                                optionClass = 'correct-choice';
                                tagHtml = '<span class="choice-tag tag-correct">✓ Bạn chọn đúng</span>';
                            } else if (opt === qData.correct) {
                                optionClass = 'correct-choice';
                                tagHtml = '<span class="choice-tag tag-correct">★ Đáp án chuẩn</span>';
                            } else if (opt === userVal) {
                                optionClass = 'wrong-user-choice';
                                tagHtml = '<span class="choice-tag tag-wrong">✗ Bài làm của bạn</span>';
                            }

                            return `<label class="${optionClass}">${opt}. ${qData.options[i]} ${tagHtml}</label>`;
                        }).join('')}
                    </div>
                </div>`;
        } else if (qData.part === 2) {
            let correctSubCount = 0;
            qData.subQuestions.forEach(sub => {
                if (userAnswers[`q${qIndex}${sub.id}`] === sub.correct) correctSubCount++;
            });

            contentHtml = `
                <div class="review-item ${correctSubCount > 0 ? 'correct-answer' : 'incorrect-answer'}">
                    <span class="review-badge ${correctSubCount === 4 ? 'badge-success' : 'badge-danger'}">
                        Kết quả: Đã đúng ${correctSubCount}/4 ý
                    </span>
                    <p><strong>Câu ${qIndex}.</strong> ${qData.question}</p>
                    ${qData.reading ? `<div style="background:#f8fafc; padding:12px; margin-bottom:12px; border-left:4px solid #1e3a8a; font-style:italic;">${qData.reading}</div>` : ''}
                    ${imgHtml}
                    <table class="tf-table">
                        <tr>
                            <th>Ý hỏi</th>
                            <th>Bài làm của sinh viên</th>
                            <th>Đáp án chuẩn</th>
                        </tr>
                        ${qData.subQuestions.map(sub => {
                            const uVal = userAnswers[`q${qIndex}${sub.id}`] || "Chưa chọn";
                            const cVal = sub.correct;
                            const subMatch = (uVal === cVal);
                            return `<tr>
                                <td style="text-align:left;">${sub.id}) ${sub.text}</td>
                                <td style="color: ${subMatch ? '#16a34a' : '#dc2626'}; font-weight:bold;">
                                    ${uVal === 'D' ? 'Đúng' : (uVal === 'S' ? 'Sai' : 'Chưa chọn')}
                                    ${subMatch ? ' ✓' : ' ✗'}
                                </td>
                                <td style="font-weight:bold; color: #16a34a;">${cVal === 'D' ? 'Đúng' : 'Sai'}</td>
                            </tr>`;
                        }).join('')}
                    </table>
                </div>`;
        } else if (qData.part === 3) {
            const userVal = (userAnswers[`q${qIndex}`] || "").toString().trim();
            const correctVal = (qData.correct || "").toString().trim();
            
            let userNumStr = userVal.replace(/,/g, '.');
            let correctNumStr = correctVal.replace(/,/g, '.');

            if (!isNaN(userNumStr) && !isNaN(correctNumStr) && userNumStr !== "" && correctNumStr !== "") {
                isCorrect = (parseFloat(userNumStr) === parseFloat(correctNumStr));
            } else {
                isCorrect = (userVal.toLowerCase() === correctVal.toLowerCase());
            }

            contentHtml = `
                <div class="review-item ${isCorrect ? 'correct-answer' : 'incorrect-answer'}">
                    <span class="review-badge ${isCorrect ? 'badge-success' : 'badge-danger'}">
                        ${isCorrect ? '✓ ĐÚNG (+0.5đ)' : '✗ SAI / CHƯA LÀM'}
                    </span>
                    <p><strong>Câu ${qIndex}.</strong> ${qData.question}</p>
                    ${imgHtml}
                    <div style="background:#f8fafc; padding:12px; border-radius:6px; margin-top:10px;">
                        <p style="margin:5px 0;"><strong>Bài làm của bạn:</strong> <span style="color: ${isCorrect ? '#16a34a' : '#dc2626'}; font-weight:bold;">${userVal || '(Chưa trả lời)'}</span></p>
                        <p style="margin:5px 0;"><strong>Đáp án đúng:</strong> <span style="color: #16a34a; font-weight:bold;">${correctVal}</span></p>
                    </div>
                </div>`;
        }
        reviewContainer.innerHTML += contentHtml;
    });

    if (window.MathJax) {
        setTimeout(() => window.MathJax.typesetPromise(), 100);
    }
}

function finishExam() {
    localStorage.removeItem('userAnswers');
    localStorage.removeItem('examTimeLeft');
    
    for (let prop in userAnswers) delete userAnswers[prop];
    flaggedQuestions.clear();
    violationCount = 0;
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.reset();

    document.getElementById('result-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
    
    initSystem(); 
    window.scrollTo(0, 0);
}