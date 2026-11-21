-- ============================================================
-- Smart SolarNet — Migration 0007
-- Messagerie & Support : support_tickets, conversations, messages, notifications
-- ============================================================

-- ------------------------------------------------------------
-- conversations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    support_agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    subject TEXT,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_client ON public.conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent ON public.conversations(support_agent_id);

-- ------------------------------------------------------------
-- messages
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT,
    attachments TEXT[] NOT NULL DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_bot BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id) WHERE is_read = false;

-- ------------------------------------------------------------
-- support_tickets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'technique',
    subject TEXT NOT NULL,
    description TEXT,
    status public.ticket_status NOT NULL DEFAULT 'ouvert',
    priority public.ticket_priority NOT NULL DEFAULT 'normale',
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);

-- ------------------------------------------------------------
-- notifications
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'web',
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;

-- ------------------------------------------------------------
-- Triggers
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_tickets_updated_at 
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Met à jour last_message_at de la conversation à chaque nouveau message
CREATE OR REPLACE FUNCTION public.touch_conversation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_conversation ON public.messages;
CREATE TRIGGER trg_touch_conversation
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE PROCEDURE public.touch_conversation();