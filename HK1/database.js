// database.js
var DATA_COURSES = [
    {
        name: "Sinh hoạt công dân",
        location: "Cơ sở: An Dương Vương",
       room: "Hội trường B, Tầng 5, Dãy nhà B", link: "",
	teacher: "",
        time: "7:30-11:30",
        day: 5, 
        start: 2,
        length: 5,
        weeks: [1]
    },
	{
        name: "Sinh hoạt công dân",
        location: "Cơ sở: An Dương Vương",
       room: "Hội trường B, Tầng 5, Dãy nhà B", link: "",
	teacher: "",
        time: "13:00 - 17:00",
        day: 5, 
        start: 7,
        length: 5,
        weeks: [1]
    },
	{
        name: "Sinh hoạt với cố vấn lãnh đạo, học tập",
        location: "Cơ sở: An Dương Vương",
       room: "A.313", link: "",
	teacher: "Khoa Toán-Tin học",
        time: "6:30 - 12:00",
        day: 7, 
        start: 1,
        length: 6,
        weeks: [1]
    },
	{
        name: "Trạm kết nối - LIMITLESS (Khoa Toán-Tin học)",
        location: "Cơ sở: An Dương Vương",
       room: "Sân M", link: "",
	teacher: "Khoa Toán-Tin học",
        time: "13:30 - 17:00",
        day: 7, 
        start: 8,
        length: 4,
        weeks: [1]
    },
	{
        name: "Lập trình cơ bản",
        location: "Cơ sở: An Dương Vương",
       room: "C.201", link: "",
	teacher: "Võ Lê Phúc Hậu",
        time: "12:30 - 16:00",
        day: 2, 
        start: 7,
        length: 4,
        weeks: [2]
    },
	{
        name: "Lập trình cơ bản",
        location: "Cơ sở: An Dương Vương",
       room: "C.301", link: "",
	teacher: "Võ Lê Phúc Hậu",
        time: "12:30 - 16:00",
        day: 2, 
        start: 7,
        length: 4,
        weeks: [3, 4, 5, 6, 7, 8, 9, 10]
    },
	{
        name: "Lập trình cơ bản",
        location: "Cơ sở: An Dương Vương",
       room: "C.201", link: "",
	teacher: "Võ Lê Phúc Hậu",
        time: "8:10 - 11:40",
        day: 6, 
        start: 3,
        length: 4,
        weeks: [2]
    },
	{
        name: "Lập trình cơ bản",
        location: "Cơ sở: An Dương Vương",
       room: "I.102", link: "",
	teacher: "Võ Lê Phúc Hậu",
        time: "9:10 - 11:40",
        day: 6, 
        start: 4,
        length: 3,
        weeks: [3,7,8]
    },
	{
        name: "<b>Kiểm tra Quá trình</b><br> Lập trình cơ bản",
        location: "Cơ sở: An Dương Vương",
       room: "I.102", link: "",
	teacher: "Võ Lê Phúc Hậu",
        time: "9:10 - 11:40",
        day: 6, 
        start: 4,
        length: 3,
        weeks: [4, 6, 9]
    },
{
        name: "<b>Kiểm tra Quá trình</b><br> Lập trình cơ bản (Bù 20/10)",
        location: "Học online",
       room: "MS TEAMS+GoUpCoder", link: "https://teams.microsoft.com/v2/",
	teacher: "Võ Lê Phúc Hậu",
        time: "9:30 - 11:30",
        day: 6, 
        start: 4,
        length: 3,
        weeks: [10]
    },
	{
        name: "Giải tích hàm một biến",
        location: "Cơ sở: An Dương Vương",
       room: "B.210", link: "",
	teacher: "Huỳnh Cao Trường",
        time: "9:10 - 11:40",
        day: 3, 
        start: 4,
        length: 3,
        weeks: [2, 3, 4, 5, 6, 7, 9, 10]
    },
	{
        name: "<b>Kiểm tra Giữa học phần</b><br>Giải tích hàm một biến",
        location: "Cơ sở: An Dương Vương",
       room: "B.210", link: "",
	teacher: "Huỳnh Cao Trường",
        time: "9:10 - 11:40",
        day: 3, 
        start: 4,
        length: 3,
        weeks: [8]
    },
	{
        name: "Giải tích hàm một biến",
        location: "Cơ sở: An Dương Vương",
       room: "B.218", link: "",
	teacher: "Huỳnh Cao Trường",
        time: "9:10 - 11:40",
        day: 5, 
        start: 4,
        length: 3,
        weeks: [2, 3, 4, 5, 6, 7, 8, 9, 10]
    },
	{
        name: "Giải tích hàm một biến",
        location: "Học online",
       room: "Google Meet", link: "https://l.facebook.com/l.php?u=https%3A%2F%2Fmeet.google.com%2Fcet-tccj-jmx&h=AT0m73i94tYDIpLPCkD_ZN3i4xBK27ptAjgJ80pW8S6Qy3KO7x12V4ARf8NIgdIdwZ7lcWXdVX2xk3NGiL1cer-1j6_V0KIuMMNIDAXuZC-T0Q05PT3WLA5iagp8Y1iGXRvhYuKWq3ELacg&s=1",
	teacher: "Huỳnh Cao Trường",
        time: "9:10 - 11:40",
        day: 5, 
        start: 4,
        length: 3,
        weeks: [11]
    },
	{
        name: "Giải tích hàm một biến (Bủ 18/11)",
        location: "Cơ sở: An Dương Vương",
       room: "B.211", link: "",
	teacher: "Huỳnh Cao Trường",
        time: "8:10 - 11:40",
        day: 5, 
        start: 3,
        length: 4,
        weeks: [12]
    },
	{
        name: "Đại số tuyến tính",
        location: "Cơ sở: An Dương Vương",
       room: "B.116", link: "",
	teacher: "Mỵ Vinh Quang",
        time: "6:30 - 10:00",
        day: 2, 
        start: 1,
        length: 4,
        weeks: [6, 7, 8, 10, 11, 12]
    },
	{
        name: "Đại số tuyến tính",
        location: "Cơ sở: An Dương Vương",
       room: "B.116", link: "",
	teacher: "Mỵ Vinh Quang",
        time: "6:30 - 10:00",
        day: 2, 
        start: 1,
        length: 4,
        weeks: [6, 7, 8, 10, 11, 12, 13]
    },
	{
        name: "Đại số tuyến tính (Bủ 03/11)",
        location: "Cơ sở: An Dương Vương",
       room: "I.203", link: "",
	teacher: "Mỵ Vinh Quang",
        time: "8:00 - 11:00",
        day: 5, 
        start: 3,
        length: 4,
        weeks: [13]
    },
	{
        name: "Đại số tuyến tính (Thực hành)",
        location: "Cơ sở: An Dương Vương",
       room: "B.116", link: "",
	teacher: "Lê Quang Trường",
        time: "6:30 - 10:00",
        day: 2, 
        start: 1,
        length: 4,
        weeks: [14]
    },
	{
        name: "<b>Kiểm tra Giữa học phần</b><br>Đại số tuyến tính (Thực hành)",
        location: "Cơ sở: An Dương Vương",
       room: "B.116", link: "",
	teacher: "Lê Quang Trường",
        time: "6:30 - 10:00",
        day: 2, 
        start: 1,
        length: 4,
        weeks: [15]
    },
	{
        name: "Giải tích vectơ",
        location: "Cơ sở: Lạc Long Quân",
       room: "LLQ.D.003", link: "",
	teacher: "Cao Trần Tứ Hải",
        time: "12:30 - 16:00",
        day: 4, 
        start: 7,
        length: 4,
        weeks: [2, 3, 4, 5, 6, 7, 8, 11]
    },
	{
        name: "<b>Kiểm tra Giữa học phần</b><br>Giải tích vectơ",
        location: "Cơ sở: Lạc Long Quân",
       room: "LLQ.D.003", link: "",
	teacher: "Cao Trần Tứ Hải",
        time: "12:30 - 16:00",
        day: 4, 
        start: 7,
        length: 4,
        weeks: [10]
    },
	{
        name: "Giải tích vectơ",
	subLocations: [
        { label: "Học online 1", link: "https://azota.vn/de-thi/jtgkxu" },
        { label: "Học online 2", link: "https://azota.vn/de-thi/8mq6gn" }
    ],
        location: "Học online",
       room: "Azota",
	teacher: "Cao Trần Tứ Hải",
        time: "12:30 - 16:00",
        day: 4, 
        start: 7,
        length: 4,
        weeks: [9]
    },
	{
        name: "Triết học Mác-Lênin",
        location: "Cơ sở: An Dương Vương",
       room: "A.303", link: "",
	teacher: "Đỗ Thị Thúy Yến",
        time: "15:10 - 17:40",
        day: 5, 
        start: 10,
        length: 3,
        weeks: [2, 4]
    },
	{
        name: "Triết học Mác-Lênin",
        location: "Cơ sở: An Dương Vương",
       room: "A.303", link: "",
	teacher: "Đỗ Thị Thúy Yến",
        time: "15:10 - 17:40",
        day: 7, 
        start: 10,
        length: 3,
        weeks: [2, 4]
    },
	{
        name: "Triết học Mác-Lênin",
        location: "Cơ sở: An Dương Vương",
       room: "A.303", link: "",
	teacher: "Nguyễn Trần Minh Hải",
        time: "15:10 - 17:40",
        day: 5, 
        start: 10,
        length: 3,
        weeks: [5, 6]
    },
	{
        name: "Triết học Mác-Lênin",
        location: "Cơ sở: An Dương Vương",
       room: "A.303", link: "",
	teacher: "Nguyễn Trần Minh Hải",
        time: "15:10 - 17:40",
        day: 7, 
        start: 10,
        length: 3,
        weeks: [5]
    },
	{
        name: "Triết học Mác-Lênin (Bù 25/09)",
        location: "Học online",
       room: "MS TEAMS", link: "https://teams.microsoft.com/v2/",
	teacher: "Nguyễn Trần Minh Hải",
        time: "15:30 - 17:00",
        day: 5, 
        start: 10,
        length: 3,
        weeks: [7]
    },
	{
        name: "Triết học Mác-Lênin (Bù 27/09)",
        location: "Học online",
       room: "MS TEAMS", link: "https://teams.microsoft.com/v2/",
	teacher: "Nguyễn Trần Minh Hải",
        time: "16:00 - 18:00",
        day: 7, 
        start: 10,
        length: 3,
        weeks: [7]
    },
	{
        name: "Triết học Mác-Lênin (Bù 18/10)",
        location: "Học online",
       room: "MS TEAMS", link: "https://teams.microsoft.com/v2/",
	teacher: "Nguyễn Trần Minh Hải",
        time: "19:00 - 20:30",
        day: 6, 
        start: 14,
        length: 2,
        weeks: [15]
    },
	{
        name: "Giáo dục thể chất 1 (Điền kinh+Bài tập thể dục)",
        location: "Công viên Lê Thị Riêng",
       room: "Cổng 2", link: "",
	teacher: "Đoàn Kim Bình",
        time: "9:10 - 10:10",
        day: 4, 
        start: 4,
        length: 2,
        weeks: [2, 4]
    },
	{
        name: "Giáo dục thể chất 1 (Điền kinh+Bài tập thể dục)",
        location: "Công viên Lê Thị Riêng",
       room: "Cổng 2", link: "",
	teacher: "Đoàn Kim Bình",
        time: "8:30 - 10:00",
        day: 4, 
        start: 3,
        length: 2,
        weeks: [5, 6, 8, 9]
    },
	{
        name: "<b>Kiểm tra Giữa học phần</b><br>Giáo dục thể chất 1 (Điền kinh+Bài tập thể dục)",
        location: "Công viên Lê Thị Riêng",
       room: "Cổng 2", link: "",
	teacher: "Đoàn Kim Bình",
        time: "8:30 - 10:00",
        day: 4, 
        start: 3,
        length: 2,
        weeks: [7]
    },
	{
        name: "<b>Kiểm tra Kết thúc học phần</b><br>Giáo dục thể chất 1 (Điền kinh+Bài tập thể dục)",
        location: "Công viên Lê Thị Riêng",
       room: "Cổng 2", link: "",
	teacher: "Đoàn Kim Bình",
        time: "8:30 - 10:00",
        day: 4, 
        start: 3,
        length: 2,
        weeks: [11]
    },
	{
        name: "Tham quan thư viện",
        location: "Cơ sở: An Dương Vương",
       room: "6.8 Lầu 6 Thư viện", link: "",
	teacher: "",
        time: "13:30 - 16:00",
        day: 3, 
        start: 8,
        length: 3,
        weeks: [5]
    },
	{
        name: "Lễ chào đón Tân sinh viên HCMUE",
        location: "Cơ sở: An Dương Vương",
       room: "Dãy A, B, C, D, Nhà thi đáu", link: "",
	teacher: "",
        time: "7:30 - 22:00",
        day: 6, 
        start: 2,
        length: 15,
        weeks: [5]
    },
	{
        name: "Đại hội chi Đoàn",
        location: "Cơ sở: Lê Văn Sỹ",
       room: "A.401", link: "",
	teacher: "Khoa Toán-Tin học",
        time: "13:00 - 14:45",
        day: 3, 
        start: 8,
        length: 2,
        weeks: [12]
    },
	{
        name: "Đại hội chi Hội",
        location: "Cơ sở: Lê Văn Sỹ",
       room: "A.401", link: "",
	teacher: "Khoa Toán-Tin học",
        time: "14:45 - 15:30",
        day: 3, 
        start: 10,
        length: 2,
        weeks: [12]
    },
	{
        name: "Lễ kết nạp Hội viên",
        location: "Cơ sở: An Dương Vương",
       room: "A.313", link: "",
	teacher: "",
        time: "17:30 - 19:45",
        day: 3, 
        start: 13,
        length: 2,
        weeks: [15]
    },
	{
        name: "<b>Kiểm tra kết thúc học phần</b><br>Lập trình cơ bản",
        location: "Cơ sở: An Dương Vương",
       room: "I.202", link: "",
	teacher: "",
        time: "10:00 - 12:30",
        day: 7, 
        start: 4,
        length: 3,
        weeks: [15]
    },
	{
        name: "<b>Kiểm tra Kết thúc học phần</b><br>Triết học Mác-Lênin",
        location: "Cơ sở: An Dương Vương",
       room: "B.115", link: "",
	teacher: "",
        time: "9:30 - 11:00",
        day: 2, 
        start: 2,
        length: 1,
        weeks: [16]
    },
	{
        name: "<b>Kiểm tra Kết thúc học phần</b><br>Tâm lý học đại cương",
        location: "Cơ sở: An Dương Vương",
       room: "C.301", link: "",
	teacher: "",
        time: "9:30 - 10:30",
        day: 5, 
        start: 2,
        length: 1,
        weeks: [16]
    },
	{
        name: "<b>Kiểm tra Kết thúc học phần</b><br>Đại số tuyến tính",
        location: "Cơ sở: An Dương Vương",
       room: "B.209", link: "",
	teacher: "",
        time: "9:30 - 11:00",
        day: 2, 
        start: 2,
        length: 1,
        weeks: [17]
    },
	{
        name: "<b>Kiểm tra Kết thúc học phần</b><br>Giải tích hàm một biến",
        location: "Cơ sở: An Dương Vương",
       room: "B.117", link: "",
	teacher: "",
        time: "9:30 - 11:00",
        day: 3, 
        start: 2,
        length: 1,
        weeks: [17]
    },
	{
        name: "<b>Kiểm tra Kết thúc học phần</b><br>Pháp luật đại cương",
        location: "Cơ sở: An Dương Vương",
       room: "C.204", link: "",
	teacher: "",
        time: "9:30 - 10:30",
        day: 4, 
        start: 2,
        length: 1,
        weeks: [18]
    },
];

var DATA_DEADLINES = [
    {
        title: "Pháp luật đại cương",
        duration: "Từ 15/09/2025 đến 05/11/2025",
        tag: "VLE",
        icon: "success", // tương ứng class: success, fire, alert, soft-blue...
        emoji: "📖",
        weeks: [2, 3, 4, 5, 6, 7, 8, 9]
    },
    {
        title: "Tâm lý học đại cương",
        duration: "Từ 08/10/2025 đến 19/11/2025",
        tag: "VLE",
        icon: "fire",
        emoji: "📖",
        weeks: [5, 6, 7, 8, 9, 10, 11]
    },
{
        title: "Sinh hoạt công dân",
        duration: "Từ 22/09/2025 đến 24/09/2025",
        tag: "VLE",
        icon: "soft-blue",
        emoji: "📣",
        weeks: [3]
    },
 {
        title: "Sinh hoạt thời sự Quý III Năm 2025",
        duration: "Từ 29/09/2025 đến 30/09/2025",
        tag: "VLE",
        icon: "alert",
        emoji: "📣",
        weeks: [3,4]
    },
	{
        title: "Triết học Mác-Lênin",
        duration: "Từ 07/10/2025 đến 17/11/2025",
        tag: "VLE",
        icon: "alert",
        emoji: "📖",
        weeks: [5, 6, 7, 8, 9, 10, 11]
    },
	{
        title: "Hỗ trợ ôn tập: GIải tích hàm một biến",
        duration: "26/12/2026",
        tag: "ADV.A.113 (17:50 - 20:00)",
        icon: "soft-blue",
        emoji: "📖",
        weeks: [16]
    },
 {
        title: "Sinh hoạt thời sự Quý IV Năm 2025",
        duration: "Từ 26/12/2025 đến 27/12/2025",
        tag: "VLE",
        icon: "alert",
        emoji: "📣",
        weeks: [16]
    },


];
var DATA_LOCATIONS = [
    { name: "Cơ sở 1: An Dương Vương (280 An Dương Vương, phường Chợ Quán, TP.HCM)", color: "#e0f2fe", link: "https://maps.app.goo.gl/Q8dRKtTZcqGeuEmy5" },
    { name: "Cơ sở 2: Lê Văn Sỹ (222 Lê Văn Sỹ, phường Nhiêu Lộc, TP.HCM)", color: "#e6f9ef", link: "https://maps.app.goo.gl/7zCgiMmscdPFfCFv5" },
    { name: "Cơ sở KTX: Lạc Long Quân (351A Lạc Long Quân, phường Hòa Bình, TP.HCM)", color: "#fff3e0", link: "https://maps.app.goo.gl/oV1mXHYDuW44cGbN6" },
    { name: "Công viên Lê Thị Riêng (875 Cách Mạng Tháng Tám, phường Hòa Hưng, TP.HCM)", color: "#fef9c3", link: "https://maps.app.goo.gl/K7GzwaEcJwSb9dwGA" },
    { name: "Học online (Hệ thống VLE; Phòng học ảo TEAM, Google Meet, Zoom)", color: "#f3e8ff", link: "#" }
];
