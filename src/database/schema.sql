-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- Para busca semântica (IA)
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para geolocalização

-- Tabela de Usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    location GEOGRAPHY(POINT), -- PostGIS Point
    address TEXT,
    rating_sum DECIMAL(10, 2) DEFAULT 0, -- Soma das notas
    rating_count INT DEFAULT 0, -- Total de avaliações
    rating_average DECIMAL(3, 2) GENERATED ALWAYS AS (
        CASE WHEN rating_count = 0 THEN 0 ELSE rating_sum / rating_count END
    ) STORED,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Carteira Digital (Para o sistema de Escrow)
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    balance DECIMAL(10, 2) DEFAULT 0,
    frozen_balance DECIMAL(10, 2) DEFAULT 0, -- Valor retido durante o serviço
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ofertas (O que as pessoas têm para oferecer)
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    category VARCHAR(50), -- ex: 'servico', 'produto', 'aluguel'
    description TEXT NOT NULL,
    embedding vector(768), -- Embedding do Gemini (768 dimensões)
    price_range DECIMAL(10, 2),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Solicitações (O que as pessoas precisam)
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    description TEXT NOT NULL,
    embedding vector(768),
    budget DECIMAL(10, 2),
    location GEOGRAPHY(POINT), -- Local onde o serviço será prestado
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, MATCHED, PAID, COMPLETED, CANCELLED
    created_at TIMESTAMP DEFAULT NOW()
);

-- Matches (Conexões entre Oferta e Solicitação)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES requests(id),
    offer_id UUID REFERENCES offers(id),
    score DECIMAL(5, 4), -- 0.0000 a 1.0000
    status VARCHAR(20) DEFAULT 'PROPOSED', -- PROPOSED, ACCEPTED, REJECTED
    created_at TIMESTAMP DEFAULT NOW()
);

-- Transações Financeiras (PIX)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id),
    payer_id UUID REFERENCES users(id),
    payee_id UUID REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    fee DECIMAL(10, 2) NOT NULL, -- Taxa do Agente (10%)
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PAID, RELEASED, REFUNDED
    pix_code TEXT, -- Código Copia e Cola
    external_id VARCHAR(100), -- ID no Gateway de Pagamento
    created_at TIMESTAMP DEFAULT NOW()
);

-- Avaliações (Reviews)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id),
    reviewer_id UUID REFERENCES users(id), -- Quem avaliou
    reviewed_id UUID REFERENCES users(id), -- Quem foi avaliado
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX ON users USING GIST (location);
CREATE INDEX ON offers USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON requests USING ivfflat (embedding vector_cosine_ops);

-- Alertas (Achados e Perdidos)
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(20) NOT NULL, -- 'LOST' or 'FOUND'
    description TEXT NOT NULL,
    embedding vector(768),
    reward DECIMAL(10, 2),
    location GEOGRAPHY(POINT),
    radius_meters INT DEFAULT 1000, -- Raio de alcance do alerta
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON alerts USING GIST (location);
