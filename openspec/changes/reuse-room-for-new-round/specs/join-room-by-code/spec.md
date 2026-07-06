## ADDED Requirements

### Requirement: Player can enter a room code
The system SHALL provide a web entry point where a player can enter a room code and continue into the existing player-room flow.

#### Scenario: Player submits valid-looking room code
- **WHEN** a player enters a non-empty room code in the join-by-code entry point
- **THEN** the system MUST normalize the code by trimming whitespace and using the canonical casing before navigating the player to `/play/{roomCode}`

#### Scenario: Player submits empty room code
- **WHEN** a player submits an empty or whitespace-only room code
- **THEN** the system MUST keep the player on the entry point and show a validation message instead of navigating

### Requirement: Join-by-code reuses existing join and restore behavior
The system SHALL reuse the existing `/play/{roomCode}` page for player name entry, token restore, and join validation after code entry.

#### Scenario: Existing player opens room by code
- **WHEN** a player has a stored player token for the entered roomCode
- **THEN** the play page MUST attempt to restore that player's state using the existing player-state flow

#### Scenario: New player opens room by code
- **WHEN** a player has no stored player token for the entered roomCode
- **THEN** the play page MUST show the existing name-entry flow and join the room through the existing join endpoint

#### Scenario: Player enters unknown or closed room code
- **WHEN** the entered roomCode does not exist or the room cannot accept joins
- **THEN** the system MUST show the existing play/join error behavior for that room instead of creating a new room or bypassing room status rules

### Requirement: Landing page communicates both joining methods
The system SHALL make it clear that players can join either by host-shared link/QR or by entering a room code.

#### Scenario: Player views home page
- **WHEN** a player lands on the home page without a direct room link
- **THEN** the page MUST expose a clear “Tham gia phòng” path for room-code entry in addition to host create-room actions
