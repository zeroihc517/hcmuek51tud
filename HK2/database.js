// database.js
var DATA_COURSES = [
    {
        name: "Kinh tế chính trị học Mác-Lênin",
        location: "Cơ sở: Lê Văn Sỹ",
       room: "LVS.GD.A", link: "https://maps.app.goo.gl/7zCgiMmscdPFfCFv5",
        time: "9:10-11:30",
        day: 2, 
        start: 4,
        length: 3,
        color: "#ecfdf3",
        weeks: [1, 2, 5, 6]
    },
    {
        name: "Kinh tế chính trị học Mác-Lênin",
        location: "Học online",
       room: "MS Teams", link: "https://teams.microsoft.com/v2/",
        time: "9:10-11:30",
        day: 2, 
        start: 4,
        length: 3,
        color: "#f3e8ff",
        weeks: [3,4]
    },
    {
        name: "Chủ nghĩa xã hội khoa học",
        location: "Cơ sở: Lê Văn Sỹ",
       room: "LVS.GD.19", link: "https://maps.app.goo.gl/7zCgiMmscdPFfCFv5",
        time: "15:10 - 17:40",
        day: 3, 
        start: 10,
        length: 3,
        color: "#ecfdf3",
        weeks: [1, 2, 6]
    },
    {
        name: "Kiểm tra Giữa học phần Chủ nghĩa xã hội khoa học",
        location: "Cơ sở: Lê Văn Sỹ",
       room: "LVS.GD.19", link: "https://maps.app.goo.gl/7zCgiMmscdPFfCFv5",
        time: "15:10 - 17:40",
        day: 3, 
        start: 10,
        length: 3,
        color: "#ecfdf3",
        weeks: [5]
    },
    {
        name: "Chủ nghĩa xã hội khoa học",
        location: "Học online",
       room: "MS Teams", link: "https://teams.microsoft.com/v2/",
        time: "15:10 - 17:40",
        day: 3, 
        start: 10,
        length: 3,
        color: "#f3e8ff",
        weeks: [3,4]
    },
    {
        name: "Giải tích hàm nhiều biến",
        location: "Cơ sở: Lê Văn Sỹ",
       room: "LVS.D.106", link: "https://maps.app.goo.gl/7zCgiMmscdPFfCFv5",
        time: "13:00 - 16:00",
        day: 2, 
        start: 7,
        length: 4,
        color: "#ecfdf3",
        weeks: [1, 2, 7, 8, 9, 10, 11, 13, 14, 15]
    },
{
        name: "Kiểm tra Giữa học phần Giải tích hàm nhiều biến",
        location: "Cơ sở: Lê Văn Sỹ",
       room: "LVS.D.106", link: "https://maps.app.goo.gl/7zCgiMmscdPFfCFv5",
        time: "13:00 - 16:30",
        day: 2, 
        start: 7,
        length: 5,
        color: "#ecfdf3",
        weeks: [5]
    },
    {
        name: "Giải tích hàm nhiều biến",
        location: "Học online",
       room: "MS TEAMS", link: "https://teams.microsoft.com/meet/41233279344497?p=lp16UPNJUvuL2DzJas",
        time: "13:00 - 16:00",
        day: 2, 
        start: 7,
        length: 4,
        color: "#f3e8ff",
        weeks: [3,4,12]
    },
    {
        name: "Không gian tuyến tính",
        location: "Cơ sở: An Dương Vương", link: "https://maps.app.goo.gl/2a1zfaiuAVXXmHfS9",
        room: "B.213",
        time: "8:10 - 11:25",
        day: 3,
        start: 3,
        length: 4,
        color: "#e0f2fe",
        weeks: [1, 2, 5, 6, 7, 8]
    },
    {
        name: "Không gian tuyến tính (Thực hành)",
        location: "Cơ sở: An Dương Vương", link: "https://maps.app.goo.gl/2a1zfaiuAVXXmHfS9",
        room: "B.213",
        time: "8:10 - 11:25",
        day: 3,
        start: 3,
        length: 4,
        color: "#e0f2fe",
        weeks: [9]
    },
    {
        name: "Kiểm tra Giữa học phần Không gian tuyến tính (Thực hành)",
        location: "Cơ sở: An Dương Vương", link: "https://maps.app.goo.gl/2a1zfaiuAVXXmHfS9",
        room: "B.213",
        time: "8:10 - 9:10",
        day: 3,
        start: 3,
        length: 2,
        color: "#e0f2fe",
        weeks: [10]
    },
    {
        name: "Không gian tuyến tính",
        location: "Học online", link: "https://teams.microsoft.com/meet/42377682011947?p=ah80iBVjJGK3inEvdV",
        room: "MS TEAMS",
        time: "8:10 - 11:25",
        day: 3,
        start: 3,
        length: 4,
        color: "#f3e8ff",
        weeks: [3, 4]
    },
	{
        name: "Hình học cao cấp hai chiều và ba chiều",
        location: "Học online", link: "https://meet.google.com/fqx-muqh-ams",
        room: "Google Meet",
        time: "9:00 - 10:30",
        day: 4,
        start: 4,
        length: 2,
        color: "#f3e8ff",
        weeks: [1]
    },
{
        name: "Hình học cao cấp hai chiều và ba chiều",
        location: "Học online", link: "https://teams.microsoft.com/meet/46385152983395?p=htDoJWFlqgr7URxXtu",
        room: "MS Teams",
        time: "12:30 - 15:30",
        day: 4,
        start: 7,
        length: 4,
        color: "#f3e8ff",
        weeks: [3,4,7]
    },
	{
        name: "Hình học cao cấp hai chiều và ba chiều",
        location: "Cơ sở: Lạc Long Quân", link: "https://maps.app.goo.gl/oV1mXHYDuW44cGbN6",
        room: "LLQ.D.205",
        time: "12:30 - 15:30",
        day: 4,
        start: 7,
        length: 4,
        color: "#fff3e0",
        weeks: [2]
    },
	{
        name: "Hình học cao cấp hai chiều và ba chiều",
        location: "Cơ sở: An Dương Vương", link: "https://maps.app.goo.gl/2a1zfaiuAVXXmHfS9",
        room: "B.315",
        time: "12:30 - 16:00",
        day: 4,
        start: 7,
        length: 4,
        color: "#e0f2fe",
        weeks: [5, 6, 8, 9, 10, 11]
    },
	{
        name: "Phương pháp học tập hiệu quả",
        location: "Cơ sở: An Dương Vương", link: "https://maps.app.goo.gl/2a1zfaiuAVXXmHfS9",
        room: "B.117",
        time: "12:30 - 15:00",
        day: 6,
        start: 7,
        length: 3,
        color: "#e0f2fe",
        weeks: [1, 2, 5, 6, 7, 8, 13, 14]
    },
{
        name: "Phương pháp học tập hiệu quả",
        location: "Học online", link: "https://us02web.zoom.us/j/3241803562?pwd=R1lkanAzbzRGL2Q4ZFdwQUNNNHlGdz09&omn=89093111246",
        room: "Zoom",
        time: "12:30 - 15:00",
        day: 6,
        start: 7,
        length: 3,
        color: "#f3e8ff",
        weeks: [4]
    },
{
        name: "Giáo dục thể chất 2 (Cầu lông cơ bản)",
        location: "Công viên Lê Thị Riêng", link: "https://maps.app.goo.gl/K7GzwaEcJwSb9dwGA",
        room: "Cổng chính",
        time: "9:00 - 10:10",
        day: 5,
        start: 4,
        length: 2,
        color: "#fef9c3",
        weeks: [1, 2, 5, 7, 8, 9]
    },
{
        name: "Kiểm tra Giữa học phần Giáo dục thể chất 2 (Cầu lông cơ bản)",
        location: "Công viên Lê Thị Riêng", link: "https://maps.app.goo.gl/K7GzwaEcJwSb9dwGA",
        room: "Cổng chính",
        time: "9:00 - 10:10",
        day: 5,
        start: 4,
        length: 2,
        color: "#fef9c3",
        weeks: [6]
    },
{
        name: "Kiểm tra Kết thúc học phần Giáo dục thể chất 2 (Cầu lông cơ bản)",
        location: "Công viên Lê Thị Riêng", link: "https://maps.app.goo.gl/K7GzwaEcJwSb9dwGA",
        room: "Cổng chính",
        time: "9:00 - 10:10",
        day: 5,
        start: 4,
        length: 2,
        color: "#fef9c3",
        weeks: [10]
    },
{
        name: "Giáo dục thể chất 2 (Cầu lông cơ bản)",
        location: "Học online", link: "https://teams.microsoft.com/v2/",
        room: "MS Teams",
        time: "9:00 - 10:10",
        day: 5,
        start: 4,
        length: 2,
        color: "#f3e8ff",
        weeks: [3,4]
    },
    {
        name: "Lập trình nâng cao",
        location: "Cơ sở: An Dương Vương", link: "https://maps.app.goo.gl/c9JKtuZmpjoGx24M9",
        room: "I.102",
        time: "12:30 - 16:00",
        day: 5,
        start: 7,
        length: 4,
        color: "#e0f2fe",
        weeks: [1, 5, 6, 8, 10, 11, 13, 14, 15]
    },
    {
        name: "Kiểm tra Giữa học phần Lập trình nâng cao",
        location: "Cơ sở: An Dương Vương", link: "https://maps.app.goo.gl/2a1zfaiuAVXXmHfS9",
        room: "I.102",
        time: "12:30 - 15:30",
        day: 5,
        start: 7,
        length: 4,
        color: "#e0f2fe",
        weeks: [9]
    },
    {
        name: "Lập trình nâng cao",
        location: "Học online", link: "https://teams.microsoft.com/v2/",
        room: "MS TEAMS",
        time: "12:30 - 16:00",
        day: 5,
        start: 7,
        length: 4,
        color: "#f3e8ff",
        weeks: [2, 3, 4]
    },
    {
        name: "Lập trình nâng cao (Bủ 30/04)",
        location: "Học online", link: "https://teams.microsoft.com/v2/",
        room: "MS TEAMS",
        time: "17:50 - 21:05",
        day: 7,
        start: 13,
        length: 4,
        color: "#f3e8ff",
        weeks: [9]
    },
    {
        name: "Cuộc họp chấm điểm rèn luyện",
        location: "Họp online", link: "https://meet.google.com/jci-jjch-rus",
        room: "Google Meet",
        time: "12:00 - 13:00",
        day: 2,
        start: 7,
        length: 1,
        color: "#f3e8ff",
        weeks: [6]
    },
    {
        name: "Cuộc họp chi đoàn 51.01.TUD",
        location: "Họp online", link: "https://teams.microsoft.com/meet/48112967152477?p=gKizQbCobDS4IkVx2L",
        room: "Google Meet",
        time: "22:00 - 23:59",
        day: 6,
        start: 16,
        length: 1,
        color: "#f3e8ff",
        weeks: [6]
    },
    {
name: `
    <div style="text-align:center; line-height: 1.4; display: flex; flex-direction: column; gap: 8px;">
        <div>
            <a href="https://thisinh.thitotnghiepthpt.edu.vn/TrangChu" target="_blank" style="color:#2563eb; font-weight:700; text-decoration:none;">1. Web đăng ký THPTQG 2026</a>
            <div style="font-size: 1em; color: #374151;">Điền thông tin và in phiếu dự thi</div>
        </div>
        <div>
            <a href="https://maps.app.goo.gl/Gx95anspDSYyXC8o9" target="_blank" style="color:#2563eb; font-weight:700; text-decoration:none;">2. Công an phường Chợ Quán</a>
            <div style="font-size: 1em; color: #374151;">Giáp lai phiếu dự thi</div>
        </div>
        <div>
            <a href="https://maps.app.goo.gl/dte8fQVVhyc2bJbY7" target="_blank" style="color:#2563eb; font-weight:700; text-decoration:none;">3. TT GDNN-GDTX Quận 10</a>
            <div style="font-size: 1em; color: #374151;">Điểm tiếp nhận hồ sơ</div>
        </div>
        <style>
            /* Ép tất cả các thẻ sau phần name biến mất và không chiếm không gian */
            .td-subject[style*="#fbcfe8"] div:empty, 
            .td-subject[style*="#fbcfe8"] p:empty,
            .td-subject[style*="#fbcfe8"] br {
                display: none !important;
            }
            /* Nếu code của bạn dùng các thẻ cụ thể cho Địa điểm/Phòng */
            .td-subject[style*="#fbcfe8"] .location, 
            .td-subject[style*="#fbcfe8"] .room {
                margin: 0 !important;
                padding: 0 !important;
                height: 0 !important;
                overflow: hidden;
            }
        </style>
    </div>
`,
    location: "Nhiều địa điểm", 
    link: "#",
    room: "ghi danh",
    time: "7:00 - 15:00",
    day: 6,
    start: 1,
    length: 9,
    color: "#fbcfe8",
    weeks: [11]
}
];

var DATA_DEADLINES = [
    {
        title: "Kinh tế chính trị học Mác-Lênin",
        duration: "Từ 19/01/2026 đến 16/03/2026",
        tag: "VLE",
        icon: "success", // tương ứng class: success, fire, alert, soft-blue...
        emoji: "📖",
        weeks: [1, 2, 3, 4, 5, 6]
    },
    {
        title: "Chủ nghĩa xã hội khoa học",
        duration: "Từ 20/01/2026 đến 27/03/2026",
        tag: "VLE",
        icon: "fire",
        emoji: "📖",
        weeks: [1,2, 3, 4, 5, 6]
    },
    {
        title: "Chủ nghĩa xã hội khoa học",
        duration: "Từ 03/02/2026 đến 04/02/2026",
        tag: "Bài tập trên MS Teams",
        icon: "fire",
        emoji: "📣",
        weeks: [3]
    },
    {
        title: "Chủ nghĩa xã hội khoa học",
        duration: "Từ 03/03/2026 đến 08/03/2026",
        tag: "Bài tập trên MS Teams (Chương 5)",
        icon: "fire",
        emoji: "📣",
        weeks: [4]
    },
    {
        title: "Phương pháp học tập hiệu quả",
        duration: "Từ 23/01/2026 đến 15/05/2026",
        tag: "VLE",
        icon: "soft-blue",
        emoji: "📖",
        weeks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
    },
{
        title: "Phương pháp học tập hiệu quả",
        duration: "Từ 22/01/2026 đến 29/01/2026",
        tag: "Bài tập nhóm Tuần 01",
        icon: "soft-blue",
        emoji: "📣",
        weeks: [1, 2]
    },
{
        title: "Phương pháp học tập hiệu quả",
        duration: "Từ 20/04/2026 đến 03/05/2026",
        tag: "Bài Tiểu luận Giữa học phần",
        icon: "soft-blue",
        emoji: "📣",
        weeks: [11, 12]
    },
    {
        title: "Lập trình nâng cao (Giao 22/01)",
        duration: "Từ 22/01/2026 đến 25/01/2026",
        tag: "Bài tập trêm TEAMS",
        icon: "alert",
        emoji: "📣",
        weeks: [1]
    },
 {
        title: "Lập trình nâng cao (Giao 29/01)",
        duration: "Từ 29/01/2026 đến 01/02/2026",
        tag: "Bài tập trêm TEAMS",
        icon: "alert",
        emoji: "📣",
        weeks: [2]
    },
	{
        title: "Hình học cao cấp hai chiều và ba chiều",
        duration: "Từ 05/02/2026 đến 08/03/2026",
        tag: "Bài tập nhóm Đợt 01, 02",
        icon: "fire",
        emoji: "📣",
        weeks: [3, 4]
    },
{
        title: "Đánh giá điểm rèn luyện HK1",
        duration: "Từ 09/03/2026 đến 21/03/2026",
        tag: "drl.hcmue.edu.vn",
        icon: "fire",
        emoji: "📣",
        weeks: [5, 6]
    }, {
        title: "Sinh hoạt thời sự - Quý I - Năm 2026",
        duration: "Từ 08/04/2026 đến 09/04/2026",
        tag: "VLE",
        icon: "fire",
        emoji: "📣",
        weeks: [9]
    }
];
