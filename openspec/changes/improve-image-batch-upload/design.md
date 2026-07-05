## Context

Luồng tạo room hiện cho phép host thêm image item bằng cách chọn nhiều file trong `CreateRoomClient`, nhưng frontend lại upload từng file bằng request riêng tới `POST /uploads`. Backend route trong `apps/server/src/routes/uploads.ts` đang dùng `multer` với giới hạn 2MB mỗi ảnh và rate limit 20 request/phút/IP. Khi host chọn nhiều ảnh, hệ thống dễ gặp hai vấn đề: ảnh lớn hơn 2MB bị từ chối ngay, và batch lớn bị vấp rate limit vì số request tăng theo số file.

Ngoài ra, frontend chỉ append image items sau khi toàn bộ vòng lặp upload hoàn tất. Nếu một request ở giữa thất bại, các file đã ghi xuống disk trước đó có thể trở thành orphan uploads cho tới khi job cleanup dọn dẹp. Hệ thống cũng có giới hạn `MAX_ROOM_ITEMS = 250`, nhưng hiện tại lỗi vượt giới hạn này chỉ lộ ra muộn ở bước tạo room thay vì được chặn sớm trong trải nghiệm upload ảnh.

## Goals / Non-Goals

**Goals:**
- Hỗ trợ upload nhiều ảnh trong một request duy nhất cho flow tạo room.
- Tăng giới hạn kích thước lên 10MB cho mỗi ảnh.
- Giảm khả năng vấp rate limit khi host chọn nhiều ảnh.
- Đảm bảo batch upload có tính atomic: hoặc toàn bộ ảnh trong batch được chấp nhận, hoặc không ảnh nào được giữ lại.
- Cải thiện UX bằng validation sớm cho số ảnh trong batch và tổng số item còn có thể thêm vào room.
- Giữ nguyên các ràng buộc bảo mật hiện có: chỉ cho phép `image/jpeg`, `image/png`, `image/webp`, filename ngẫu nhiên, không tin client-side metadata.

**Non-Goals:**
- Không thêm image compression/resizing ở client hoặc server.
- Không thay đổi giới hạn tổng `MAX_ROOM_ITEMS` của room.
- Không chuyển sang object storage hay signed upload; vẫn lưu local uploads như hiện tại.
- Không thêm tính năng chỉnh label ảnh thủ công trong batch upload; tiếp tục suy ra label từ tên file ở frontend.

## Decisions

### 1. Giữ nguyên endpoint `POST /uploads` nhưng đổi contract sang batch upload
- **Decision:** Endpoint hiện tại sẽ tiếp tục được dùng, nhưng nhận nhiều file qua multipart field `files` và trả về danh sách kết quả `{ items: [...] }`.
- **Why:** Giữ nguyên path giúp thay đổi nhỏ ở router và tránh nhân đôi logic upload. Flow mới vẫn hỗ trợ trường hợp chỉ chọn 1 file bằng batch có 1 phần tử.
- **Alternative considered:** Tạo endpoint mới như `POST /uploads/batch`. Phương án này tường minh hơn nhưng làm tăng bề mặt API, cần giữ tương thích hoặc cleanup endpoint cũ sau đó.

### 2. Áp dụng giới hạn `10MB` mỗi ảnh và `10 ảnh` mỗi batch
- **Decision:** Server dùng `multer` limits cho `fileSize = 10 * 1024 * 1024` và `files = 10`. UI helper text và validation phía client phản ánh đúng hai giới hạn này.
- **Why:** 10MB đáp ứng nhu cầu ảnh lớn hơn 2MB nhưng vẫn hạn chế request quá nặng. Giới hạn 10 ảnh/batch cân bằng giữa trải nghiệm host và áp lực memory/disk/network trên server.
- **Alternative considered:** 20 ảnh/batch. Tiện hơn cho host nhưng worst-case request có thể lên tới ~200MB, không phù hợp bằng cho app MVP đang dùng local disk và Express.

### 3. Batch upload dùng mô hình all-or-nothing với cleanup file đã ghi
- **Decision:** Nếu bất kỳ file nào trong batch không hợp lệ hoặc nếu có lỗi xảy ra sau khi một số file đã được ghi xuống disk, server sẽ xóa tất cả file của batch đó trước khi trả lỗi.
- **Why:** Tránh orphan uploads và giúp frontend có semantics đơn giản: chỉ append image items sau một response thành công hoàn toàn.
- **Alternative considered:** Partial success, trả danh sách file thành công/thất bại. Cách này tăng độ phức tạp cho API, UI, retry logic, và vẫn cần giải quyết chuyện orphan files cho phần lỗi.

### 4. Rate limit chuyển từ request-count tối ưu cho single upload sang batch-aware limit
- **Decision:** Upload route sẽ được rate limit ở mức 10 batch/phút/IP.
- **Why:** Sau khi một request có thể mang nhiều file, giới hạn cũ 20 request/phút không còn là thước đo hợp lý. 10 batch/phút vẫn cho phép retry nhưng tránh abuse hơn với payload lớn hơn.
- **Alternative considered:** Giữ nguyên 20 request/phút. Dễ thực hiện nhưng cho phép lượng dữ liệu đẩy lên cao hơn nhiều sau khi mỗi request nặng hơn.

### 5. Frontend chặn sớm nếu batch vượt `MAX_ROOM_ITEMS`
- **Decision:** `CreateRoomClient` sẽ kiểm tra `parsedItems.length + selectedFiles.length <= MAX_ROOM_ITEMS` trước khi gửi upload request. Nếu vượt, hiển thị lỗi nêu rõ còn được thêm bao nhiêu ảnh.
- **Why:** Tránh để user đợi upload xong rồi mới nhận lỗi `Dữ liệu không hợp lệ` khi tạo room. Điều này cũng làm rõ mối liên hệ giữa image upload và giới hạn item toàn room.
- **Alternative considered:** Chỉ dựa vào validation ở bước `POST /rooms`. Phương án đó giữ backend là nguồn sự thật nhưng UX kém và lãng phí thời gian upload.

### 6. Response trả về danh sách upload items đã chuẩn hóa cho frontend
- **Decision:** Server trả về `items: Array<{ url: string; label: string | null }>` theo đúng thứ tự file đã nhận. Frontend chuyển danh sách này thành các dòng `image|absolute-url|label` và append một lần.
- **Why:** Batch upload cần response dạng collection thay vì object đơn. Việc trả dữ liệu đã chuẩn hóa giúp frontend không cần suy luận thêm từ từng request lẻ.
- **Alternative considered:** Trả raw filenames rồi để frontend tự dựng URL. Điều này tăng coupling với storage layout và làm frontend biết quá nhiều về backend.

## Risks / Trade-offs

- **[Batch request lớn hơn trước]** → Giảm số ảnh tối đa mỗi batch xuống 10 và giữ giới hạn 10MB/ảnh để worst-case request còn kiểm soát được.
- **[Atomic cleanup phức tạp hơn]** → Ghi nhận danh sách file đã tạo trong request và cleanup trong mọi nhánh lỗi sau `multer` hoàn tất.
- **[Client-side validation có thể lệch backend]** → Giữ backend là nguồn sự thật và cập nhật helper text/validation từ cùng các hằng số hoặc thông điệp thống nhất khi implement.
- **[Thay đổi contract của upload endpoint]** → Cập nhật frontend và backend trong cùng change; endpoint vẫn chỉ phục vụ flow create room nội bộ nên không có rủi ro public API compatibility lớn.
- **[Rate limit mới có thể vẫn quá chặt hoặc quá lỏng]** → Bắt đầu với 10 batch/phút/IP và điều chỉnh sau khi có usage thực tế; message `429` giữ nguyên để UX nhất quán.
