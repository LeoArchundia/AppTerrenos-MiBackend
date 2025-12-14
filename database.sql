-- TABLA DE USUARIOS (Para el Admin)
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL, 
    Role NVARCHAR(20) DEFAULT 'cliente' -- 'admin' o 'cliente'
);

-- TABLA DE TERRENOS (Aquí guardaremos el mapa)
CREATE TABLE Lands (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(50) NOT NULL,
    Status NVARCHAR(20) DEFAULT 'disponible', -- disponible, apartado, vendido
    Price DECIMAL(18, 2) NOT NULL,
    LocationData NVARCHAR(MAX) -- ¡Aquí cabe todo tu GeoJSON!
);

-- TABLA DE RESERVAS (Para saber quién apartó y cuándo)
CREATE TABLE Reservations (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    LandId INT FOREIGN KEY REFERENCES Lands(Id),
    BuyerName NVARCHAR(100),
    ReservationDate DATETIME DEFAULT GETDATE(),
    ExpiryDate DATETIME -- Para la regla de los 10 minutos
);

-- USUARIO DE PRUEBA
INSERT INTO Users (Username, Password, Role) VALUES ('admin', '1234', 'admin');