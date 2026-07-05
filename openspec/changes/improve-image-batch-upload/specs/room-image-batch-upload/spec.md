## ADDED Requirements

### Requirement: Host can upload image items as a batch during room creation
The system SHALL allow the room creation flow to upload one or more image files in a single multipart request and return the uploaded image items as a list that can be appended to the room item set.

#### Scenario: Successful batch upload
- **WHEN** the host submits a batch of valid JPG, PNG, or WEBP files during room creation
- **THEN** the system returns a success response containing one uploaded item entry for each file in the same order

#### Scenario: Single file upload through batch contract
- **WHEN** the host submits exactly one valid image file through the batch upload flow
- **THEN** the system accepts it as a batch of one file and returns a list containing one uploaded item entry

### Requirement: System enforces image batch validation limits
The system SHALL accept only `image/jpeg`, `image/png`, and `image/webp` files, SHALL reject any file larger than 10MB, and SHALL reject any batch containing more than 10 files.

#### Scenario: File exceeds 10MB
- **WHEN** any uploaded file in the batch is larger than 10MB
- **THEN** the system rejects the batch with an error explaining that each image must not exceed 10MB

#### Scenario: Too many files in one batch
- **WHEN** the host submits more than 10 files in one batch request
- **THEN** the system rejects the batch with an error explaining the maximum number of images allowed per upload

#### Scenario: Unsupported file type
- **WHEN** the host includes a file whose MIME type is not JPG, PNG, or WEBP
- **THEN** the system rejects the batch with an error explaining the supported image formats

### Requirement: Batch upload is atomic and does not leave orphan files
The system MUST treat each upload request as atomic: if the batch fails validation or encounters an error during processing, no uploaded file from that batch SHALL remain available for later use.

#### Scenario: Failure after partial disk writes
- **WHEN** an error occurs after one or more files from the batch have already been written to disk
- **THEN** the system removes every file written for that batch before returning an error response

#### Scenario: Validation failure in the batch
- **WHEN** the batch is rejected due to size, file count, or MIME validation
- **THEN** the system does not keep any file from that rejected batch

### Requirement: Room creation UI prevents uploads that would exceed room item capacity
The room creation UI SHALL prevent a batch upload from starting when the selected file count would cause the total number of room items to exceed `MAX_ROOM_ITEMS`, and SHALL explain how many additional image items can still be added.

#### Scenario: Selected files exceed remaining room item capacity
- **WHEN** the host has existing room items and selects more image files than the remaining item capacity allows
- **THEN** the UI blocks the upload request and displays a message stating the remaining number of images that can be added

#### Scenario: Selected files fit within remaining room item capacity
- **WHEN** the selected image files keep the total room item count within `MAX_ROOM_ITEMS`
- **THEN** the UI allows the batch upload request to proceed

### Requirement: Upload flow reduces request-based rate limit failures for multi-image selection
The upload flow SHALL send a single request per selected batch so that selecting multiple images no longer requires one HTTP request per file.

#### Scenario: Multiple selected images use one request
- **WHEN** the host selects several valid images and starts upload
- **THEN** the client sends one multipart upload request containing the full batch instead of sending one request per file
