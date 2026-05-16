// --- CẤU HÌNH NGÀY BẮT ĐẦU (Thứ 2 của tuần 01) ---
const START_DATES = {
    "Nam1HK1TUD": new Date(2025, 8, 8),  // 08/09/2025
    "Nam1HK2TUD": new Date(2026, 0, 19), // 19/01/2026
    "Nam1HK3TUD": new Date(2026, 5, 15)  // 15/06/2026
};

const dataConfig = {
    "2025-2026": {
        "Nam1HK1TUD": [],
        "Nam1HK2TUD": [],
        "Nam1HK3TUD": []
    }
};

function formatDate(date) {
    let d = date.getDate().toString().padStart(2, '0');
    let m = (date.getMonth() + 1).toString().padStart(2, '0');
    let y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

function generateWeeks(hkKey, folderName, totalWeeks, specialNames = {}) {
    const startDateHocKy = START_DATES[hkKey];
    
    for (let i = 0; i < totalWeeks; i++) {
        let weekNum = i + 1;
        let weekStr = weekNum < 10 ? "0" + weekNum : weekNum;
        
        // --- LOGIC XỬ LÝ NHẢY NGÀY (GAP) ---
        let offsetWeeks = i;
        
        if (hkKey === "Nam1HK1TUD" && weekNum >= 18) {
            offsetWeeks += 1; // Nhảy thêm 1 tuần trống để Tuần 18 bắt đầu đúng lịch
        }
        // HK2 có khoảng nghỉ 4 tuần từ sau Tuần 03 (Nghỉ Tết/Chuyên đề)
        if (hkKey === "Nam1HK2TUD" && weekNum >= 4) {
            offsetWeeks += 3; // Nhảy thêm 3 tuần trống để Tuần 04 bắt đầu đúng 02/03
        }
        
        let monday = new Date(startDateHocKy);
        monday.setDate(startDateHocKy.getDate() + (offsetWeeks * 7));
        let sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        let displayName = `Tuần ${weekStr}`;
        let fileName = `${weekStr}.TUẦN ${weekStr}.html`;

        if (specialNames[weekNum]) {
            displayName = specialNames[weekNum].name;
            if (specialNames[weekNum].file) fileName = specialNames[weekNum].file;
        }

        // Ghi chú đặc biệt cho HK2 tuần 3-4
        if (hkKey === "Nam1HK2TUD" && (weekNum === 3 || weekNum === 4)) {
            displayName += " online";
        }

        dataConfig["2025-2026"][hkKey].push({
            val: `${folderName}/${fileName}`,
            text: `${displayName} (${formatDate(monday)} - ${formatDate(sunday)})`
        });
    }
}

// HK1: 18 tuần
generateWeeks("Nam1HK1TUD", "TUD_HK1_2526", 18, {
    1: { name: "Tuần 01 Sinh hoạt" },
    16: { name: "Tuần thi số 01", file: "16.TUẦN THI SỐ 01.html" },
    17: { name: "Tuần thi số 02", file: "17.TUẦN THI SỐ 02.html" },
    18: { name: "Tuần thi số 03", file: "18.TUẦN THI SỐ 03.html" }
});

// HK2: 18 tuần (Đã xử lý nhảy ngày từ tuần 4)
generateWeeks("Nam1HK2TUD", "TUD_HK2_2526", 18, {
    16: { name: "Tuần thi số 01", file: "16.TUẦN THI SỐ 01.html" },
    17: { name: "Tuần thi số 02", file: "17.TUẦN THI SỐ 02.html" },
    18: { name: "Tuần thi số 03", file: "18.TUẦN THI SỐ 03.html" }
});

// HK3: 10 tuần
generateWeeks("Nam1HK3TUD", "TUD_HK3_2526", 10);

// --- TÍNH NĂNG XEM TKB TỔNG HỢP ---
// --- TÍNH NĂNG XEM TKB TỔNG HỢP ---
window.viewFullTKB = function() {
    const namHoc = document.getElementById('selectNamHoc').value;
    const hocKy = document.getElementById('selectHocKy').value;

    if (!namHoc || !hocKy) {
        alert("Vui lòng chọn Năm học và Học kỳ!");
        return;
    }

    // Chuyển "Nam1HK2TUD" thành "HK2"
    const hkChuan = hocKy.replace("Nam1", "").replace("TUD", "");
    
    // Chuyển "2025-2026" thành "2526"
    const namRutGon = namHoc.replace(/-/g, '').substring(2, 4) + namHoc.slice(-2);
    
    // Đường dẫn đúng: TUD_HK2_2526/tonghop.html
    const path = `TUD_${hkChuan}_${namRutGon}/tonghop.html`;

    const iframe = document.getElementById('iframeTongHop');
    const modal = document.getElementById('modalTongHop');
    
    if (iframe && modal) {
        iframe.src = path;
        modal.style.display = 'flex';
    }
};

// Thêm hàm đóng modal vào đây để đồng bộ
window.closeModal = function() {
    document.getElementById('modalTongHop').style.display = 'none';
    document.getElementById('iframeTongHop').src = ''; 
};
