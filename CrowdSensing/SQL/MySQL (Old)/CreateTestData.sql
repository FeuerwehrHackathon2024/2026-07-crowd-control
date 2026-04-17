use FWAS;

-- Testdaten für Department
INSERT INTO Department (name) VALUES ('FFW-Leeder'), ('FFW-Asch'), ('FFW-Denklingen');

-- Testdaten für User
INSERT INTO User (name, username, mail, pw, Department) VALUES
('Max Mustermann', 'mmustermann', 'max@beispiel.de', 'pass123', 1),
('Erika Musterfrau', 'emusterfrau', 'erika@beispiel.de', 'pass456', 2);

-- Testdaten für Operator
INSERT INTO Operator (Vorname, Nachname, Department) VALUES
('Hans', 'Meier', 1),
('Julia', 'Schmidt', 2);

-- Testdaten für Operation
INSERT INTO Operation (Name, Location, DateTimeStart, DateTimeEnd, Department, pw, createdBy, isRunning) VALUES
('Brand in Lagerhalle', 'Industriestraße 5', '2024-06-01 14:00:00', '2024-06-01 18:00:00', 1, 'op123', 1, 0),
('Verkehrsunfall', 'Hauptstraße 10', '2024-06-02 09:30:00', NULL, 2, NULL, 2, 1);

-- Testdaten für OperationDepartment
INSERT INTO OperationDepartment (operation, Department, isMain) VALUES
(1, 1, 1),
(1, 2, 0),
(2, 2, 1);

-- Testdaten für EventTypes
INSERT INTO EventTypes (name, DataType) VALUES
('Pressure', 'int'),
('Comment', 'string'),
('In', 'bool'),
('Out', 'bool'),
('Ready', 'Bool');

-- Testdaten für OperationEvent
INSERT INTO OperationEvent (OperationId, OperatorId, Type, Data, DateTime) VALUES
(1, 1, 1, NULL, '2024-06-01 14:10:00'),
(1, 1, 3, 'Bereit', '2024-06-01 14:15:00'),
(2, 2, 1, NULL, '2024-06-02 09:40:00');