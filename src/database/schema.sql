-- Habilita extensões necessárias (PostGIS REMOVIDO)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    latitude FLOAT,
    longitude FLOAT,
    address TEXT,
    pix_key VARCHAR(100),
    rating_average DECIMAL(3, 2) DEFAULT 0,
    rating_count INT DEFAULT 0,
    rating_sum INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Carteiras (Saldo)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    balance DECIMAL(10, 2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Ofertas (Prestadores)
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    description TEXT NOT NULL,
    embedding vector(768), -- Gemini Embedding Dimension
    price_range VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Pedidos (Clientes)
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    description TEXT NOT NULL,
    embedding vector(768),
    budget DECIMAL(10, 2),
    latitude FLOAT,
    longitude FLOAT,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, MATCHED, PAID, COMPLETED, CANCELLED
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Matches
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES requests(id),
    offer_id UUID REFERENCES offers(id),
    score DECIMAL(5, 4), -- 0.0000 a 1.0000
    status VARCHAR(20) DEFAULT 'PROPOSED', -- PROPOSED, ACCEPTED, REJECTED, COMPLETED
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id),
    amount DECIMAL(10, 2) NOT NULL,
    fee DECIMAL(10, 2) NOT NULL, -- Nossa comissão
    provider_amount DECIMAL(10, 2) NOT NULL, -- Valor do prestador
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PAID, RELEASED, REFUNDED
    pix_code TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Avaliações (Reviews)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id),
    reviewer_id UUID REFERENCES users(id), -- Quem avaliou
    reviewed_id UUID REFERENCES users(id), -- Quem foi avaliado
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Alertas (Achados e Perdidos)
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(10) NOT NULL, -- LOST, FOUND
    description TEXT NOT NULL,
    embedding vector(768),
    reward DECIMAL(10, 2),
    latitude FLOAT,
    longitude FLOAT,
    radius_meters INT DEFAULT 1000,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX ON offers USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON requests USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON alerts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
