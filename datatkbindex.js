// --- CẤU HÌNH NGÀY BẮT ĐẦU CHÍNH XÁC CHO TỪNG NĂM HỌC & HỌC KỲ ---
// Bạn có thể tự do chỉnh sửa ngày bắt đầu (Năm, Tháng - 1, Ngày) cho đúng thực tế từng năm
const START_DATES = {
    // Năm học 2025 - 2026
    "2025-2026_Nam1HK1TUD": new Date(2025, 8, 8),   // 08/09/2025
    "2025-2026_Nam1HK2TUD": new Date(2026, 0, 19),  // 19/01/2026
    "2025-2026_Nam1HK3TUD": new Date(2026, 5, 15),  // 15/06/2026

    // Năm học 2026 - 2027 (Ví dụ - Bạn tự sửa lại ngày ở đây theo lịch trường)
    "2026-2027_Nam1HK1TUD": new Date(2026, 8, 7),   // 07/09/2026
    "2026-2027_Nam1HK2TUD": new Date(2027, 0, 18),  // 18/01/2027
    "2026-2027_Nam1HK3TUD": new Date(2027, 5, 14),  // 14/06/2027

    // Năm học 2027 - 2028
    "2027-2028_Nam1HK1TUD": new Date(2027, 8, 6),
    "2027-2028_Nam1HK2TUD": new Date(2028, 0, 17),
    "2027-2028_Nam1HK3TUD": new Date(2028, 5, 12),

    // Năm học 2028 - 2029
    "2028-2029_Nam1HK1TUD": new Date(2028, 8, 4),
    "2028-2029_Nam1HK2TUD": new Date(2029, 0, 22),
    "2028-2029_Nam1HK3TUD": new Date(2029, 5, 11),

    // Năm học 2029 - 2030
    "2029-2030_Nam1HK1TUD": new Date(2029, 8, 3),
    "2029-2030_Nam1HK2TUD": new Date(2030, 0, 21),
    "2029-2030_Nam1HK3TUD": new Date(2030, 5, 10),

    // Năm học 2030 - 2031
    "2030-2031_Nam1HK1TUD": new Date(2030, 8, 2),
    "2030-2031_Nam1HK2TUD": new Date(2031, 0, 20),
    "2030-2031_Nam1HK3TUD": new Date(2031, 5, 16)
};

// Khởi tạo cấu trúc dữ liệu trống chứa kết quả
const dataConfig = {
    "2025-2026": { "Nam1HK1TUD": [], "Nam1HK2TUD": [], "Nam1HK3TUD": [] },
    "2026-2027": { "Nam1HK1TUD": [], "Nam1HK2TUD": [], "Nam1HK3TUD": [] },
    "2027-2028": { "Nam1HK1TUD": [], "Nam1HK2TUD": [], "Nam1HK3TUD": [] },
    "2028-2029": { "Nam1HK1TUD": [], "Nam1HK2TUD": [], "Nam1HK3TUD": [] },
    "2029-2030": { "Nam1HK1TUD": [], "Nam1HK2TUD": [], "Nam1HK3TUD": [] },
    "2030-2031": { "Nam1HK1TUD": [], "Nam1HK2TUD": [], "Nam1HK3TUD": [] }
};

function formatDate(date) {
    let d = date.getDate().toString().padStart(2, '0');
    let m = (date.getMonth() + 1).toString().padStart(2, '0');
    let y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

// Hàm sinh tuần xử lý trực tiếp theo cấu hình ngày bạn đã nhập
function generateWeeksDynamic(yearStr, hkKey, folderPrefix, totalWeeks, special = {}) {
    const configKey = `${yearStr}_${hkKey}`;
    const startDateHocKy = START_DATES[configKey];
    
    // Nếu bạn quên chưa cấu hình ngày cho năm/học kỳ đó, bỏ qua không chạy để tránh lỗi
    if (!startDateHocKy) return;

    // Định dạng tên thư mục rút gọn (VD: "2025-2026" -> "2526")
    const namRutGon = yearStr.replace(/-/g, '').substring(2, 4) + yearStr.slice(-2); 
    
    // Làm sạch mảng trước khi đẩy dữ liệu vào
    dataConfig[yearStr][hkKey] = [];

    for (let i = 0; i < totalWeeks; i++) {
        let weekNum = i + 1;
        let weekStr = weekNum < 10 ? "0" + weekNum : weekNum;
        
        let offsetWeeks = i;
        
        // Giữ nguyên logic nhảy tuần (Gap) cố định của chương trình đào tạo
        if (hkKey === "Nam1HK1TUD" && weekNum >= 18) {
            offsetWeeks += 1; 
        }
        if (hkKey === "Nam1HK2TUD" && weekNum >= 4) {
            offsetWeeks += 3; // Khoảng trống nghỉ Tết/chuyên đề
        }
        
        let monday = new Date(startDateHocKy);
        monday.setDate(startDateHocKy.getDate() + (offsetWeeks * 7));
        let sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        let displayName = `Tuần ${weekStr}`;
        let fileName = `${weekStr}.TUẦN ${weekStr}.html`;

        if (special[weekNum]) {
            displayName = special[weekNum].name;
            if (special[weekNum].file) fileName = special[weekNum].file;
        }

        if (hkKey === "Nam1HK2TUD" && (weekNum === 3 || weekNum === 4)) {
            displayName += " online";
        }

        dataConfig[yearStr][hkKey].push({
            val: `${folderPrefix}_${namRutGon}/${fileName}`,
            text: `${displayName} (${formatDate(monday)} - ${formatDate(sunday)})`
        });
    }
}

// --- DUYỆT QUA TẤT CẢ CÁC NĂM ĐỂ SINH DỮ LIỆU TỰ ĐỘNG VỚI NGÀY BẠN NHẬP ---
for (const year in dataConfig) {
    // Học kỳ 1 (18 tuần)
    generateWeeksDynamic(year, "Nam1HK1TUD", "TUD_HK1", 18, {
        1: { name: "Tuần 01" },
        16: { name: "Tuần thi số 01", file: "16.TUẦN THI SỐ 01.html" },
        17: { name: "Tuần thi số 02", file: "17.TUẦN THI SỐ 02.html" },
        18: { name: "Tuần thi số 03", file: "18.TUẦN THI SỐ 03.html" },
	19: { name: "Tuần thi số 04", file: "19.TUẦN THI SỐ 04.html" }
    });

    // Học kỳ 2 (18 tuần)
    generateWeeksDynamic(year, "Nam1HK2TUD", "TUD_HK2", 18, {
        16: { name: "Tuần thi số 01", file: "16.TUẦN THI SỐ 01.html" },
        17: { name: "Tuần thi số 02", file: "17.TUẦN THI SỐ 02.html" },
        18: { name: "Tuần thi số 03", file: "18.TUẦN THI SỐ 03.html" },
	19: { name: "Tuần thi số 04", file: "19.TUẦN THI SỐ 04.html" }
    });

    // Học kỳ 3 (10 tuần)
    generateWeeksDynamic(year, "Nam1HK3TUD", "TUD_HK3", 10);
}

// --- TÍNH NĂNG XEM TKB TỔNG HỢP ---
window.viewFullTKB = function() {
    const namHoc = document.getElementById('selectNamHoc').value;
    const hocKy = document.getElementById('selectHocKy').value;

    if (!namHoc || !hocKy) {
        alert("Vui lòng chọn Năm học và Học kỳ!");
        return;
    }

    const hkChuan = hocKy.replace("Nam1", "").replace("TUD", "");
    const namRutGon = namHoc.replace(/-/g, '').substring(2, 4) + namHoc.slice(-2);
    const path = `TUD_${hkChuan}_${namRutGon}/tonghop.html`;

    const iframe = document.getElementById('iframeTongHop');
    const modal = document.getElementById('modalTongHop');
    
    if (iframe && modal) {
        iframe.src = path;
        modal.style.display = 'flex';
    }
};

window.closeModal = function() {
    document.getElementById('modalTongHop').style.display = 'none';
    document.getElementById('iframeTongHop').src = ''; 
};
