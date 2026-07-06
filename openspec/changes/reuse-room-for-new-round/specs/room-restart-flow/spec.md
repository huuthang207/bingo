## ADDED Requirements

### Requirement: Host can restart an ended room
The system SHALL allow an authenticated host to start a new Bingo round in the same room after the current room has ended.

#### Scenario: Host restarts ended room
- **WHEN** a host with a valid host token requests restart for a room whose status is `ended`
- **THEN** the system MUST transition that same room to `waiting` without changing its roomCode, host token, player URL, room items, board size, free-cell setting, or win rules

#### Scenario: Restart rejected before room ended
- **WHEN** a host requests restart for a room whose status is `waiting` or `playing`
- **THEN** the system MUST reject the restart and leave the room state unchanged

#### Scenario: Restart rejected for invalid host token
- **WHEN** a restart request uses a missing or invalid host token
- **THEN** the system MUST reject the restart and MUST NOT reset room or player state

### Requirement: Restart resets current-round state
The system SHALL clear state from the completed round when a host restarts the room.

#### Scenario: Current-round data is cleared
- **WHEN** a valid restart succeeds
- **THEN** the system MUST clear called items, player marked cells, player winner flags, room ended timestamp, and current claim records for that room

#### Scenario: Board regeneration allowance resets for new round
- **WHEN** a valid restart succeeds
- **THEN** each existing player MUST have board regeneration count reset so they receive the configured regeneration allowance for the new waiting round

#### Scenario: Player boards are not automatically regenerated
- **WHEN** a valid restart succeeds
- **THEN** the system MUST NOT automatically replace existing player boards, and players MAY use the existing regenerate-board action while the room is waiting

### Requirement: Restart notifies connected clients
The system SHALL notify connected host and player clients when a room is restarted.

#### Scenario: Connected host receives restart update
- **WHEN** a valid restart succeeds
- **THEN** connected host clients in that room MUST receive a realtime restart update and show the room as `waiting` with no called items, no current claims, and no winners

#### Scenario: Connected player receives restart update
- **WHEN** a valid restart succeeds
- **THEN** connected player clients in that room MUST receive a realtime restart update and show the room as `waiting` with no called items, no marked cells, no winner message, and refreshed board-regeneration allowance

#### Scenario: Offline player restores after restart
- **WHEN** a player who previously joined the room reloads or reconnects after a successful restart
- **THEN** the system MUST restore that player using their existing player token and return the current waiting-room state for the same roomCode

### Requirement: Host UI distinguishes replay from new room
The system SHALL present replaying the same room as a distinct host action from creating a brand-new room.

#### Scenario: Host chooses to replay same room
- **WHEN** the host dashboard shows an ended room
- **THEN** it MUST provide a clear action to play again in the same room, using the existing room link and player list

#### Scenario: Host chooses to create a new room
- **WHEN** the host wants to change room items, board configuration, or win rules
- **THEN** the UI MUST still provide a way to create a new room through the create-room flow

### Requirement: Existing join rules remain enforced
The system SHALL preserve current join and game-integrity rules during and after restart.

#### Scenario: New player joins restarted room while waiting
- **WHEN** a room has been restarted and is in `waiting` status
- **THEN** a new player with a valid name MUST be able to join through the existing player join flow

#### Scenario: Player cannot join while room is active or ended
- **WHEN** a room status is `playing` or `ended`
- **THEN** the system MUST reject new player join attempts according to the existing join restrictions
