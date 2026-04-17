PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS PositionCount (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lat Real NOT NULL,
  long Real NOT NULL,
  senderType nvarchar(10) NOT NULL,
  deviceCount int NOT NULL,
  measureTime datetime NOT NULL
);

CREATE TABLE IF NOT EXISTS SenderTypeRange (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  senderType nvarchar(10) NOT NULL,
  range int NOT NULL,
  foreign key (senderType) references PositionCount(senderType)
);