-- ===============================================================
-- ESQUEMA MAESTRO DE SEGURIDAD EMPRESARIAL (SUPABASE)
-- ===============================================================
-- Este script configura la base de datos con seguridad RLS avanzada,
-- gestión de roles (Super Admin) y automatización de perfiles.

-- 1. EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE PERFILES (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_private BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TABLA DE MEDIOS (MEDIA)
CREATE TABLE IF NOT EXISTS public.media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('image', 'video')) NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. TABLA DE MENSAJES (MESSAGES)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. ACTIVAR SEGURIDAD DE NIVEL DE FILA (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. FUNCIONES DE AYUDA PARA RLS
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. POLÍTICAS DE SEGURIDAD: PERFILES
DROP POLICY IF EXISTS "Perfiles visibles por usuarios" ON public.profiles;
CREATE POLICY "Perfiles visibles por usuarios" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios editan su info básica" ON public.profiles;
CREATE POLICY "Usuarios editan su info básica" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    (CASE WHEN NOT public.is_super_admin() THEN
      role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
      is_verified = (SELECT is_verified FROM public.profiles WHERE id = auth.uid())
    ELSE TRUE END)
  );

DROP POLICY IF EXISTS "Super Admin gestiona perfiles" ON public.profiles;
CREATE POLICY "Super Admin gestiona perfiles" ON public.profiles
  FOR ALL USING (public.is_super_admin());

-- 8. POLÍTICAS DE SEGURIDAD: MEDIOS
DROP POLICY IF EXISTS "Medios visibles por usuarios" ON public.media;
CREATE POLICY "Medios visibles por usuarios" ON public.media
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Solo usuarios verificados suben medios" ON public.media;
DROP POLICY IF EXISTS "Cualquier usuario autenticado sube medios" ON public.media;
CREATE POLICY "Cualquier usuario autenticado sube medios" ON public.media
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Dueño o Admin eliminan medios" ON public.media;
CREATE POLICY "Dueño o Admin eliminan medios" ON public.media
  FOR DELETE USING (auth.uid() = user_id OR public.is_super_admin());

-- 9. POLÍTICAS DE SEGURIDAD: MENSAJES
DROP POLICY IF EXISTS "Participantes o Admin leen mensajes" ON public.messages;
CREATE POLICY "Participantes o Admin leen mensajes" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Solo verificados envían y reciben mensajes" ON public.messages;
DROP POLICY IF EXISTS "Cualquier usuario autenticado envía y recibe mensajes" ON public.messages;
CREATE POLICY "Cualquier usuario autenticado envía y recibe mensajes" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 10. TABLA DE NOTIFICACIONES
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('message', 'verification', 'system', 'like', 'follow_request', 'follow_accept')) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios ven sus propias notificaciones" ON public.notifications;
CREATE POLICY "Usuarios ven sus propias notificaciones" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios actualizan sus propias notificaciones" ON public.notifications;
CREATE POLICY "Usuarios actualizan sus propias notificaciones" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios eliminan sus propias notificaciones" ON public.notifications;
CREATE POLICY "Usuarios eliminan sus propias notificaciones" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios crean notificaciones para otros" ON public.notifications;
CREATE POLICY "Usuarios crean notificaciones para otros" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 11. TABLA DE LIKES
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  media_id UUID REFERENCES public.media(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, media_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes visibles por todos" ON public.likes;
CREATE POLICY "Likes visibles por todos" ON public.likes
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios gestionan sus propios likes" ON public.likes;
CREATE POLICY "Usuarios gestionan sus propios likes" ON public.likes
  FOR ALL USING (auth.uid() = user_id);

-- 12. TABLA DE SEGUIDORES (FOLLOWS)
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Follows visibles por involucrados" ON public.follows;
CREATE POLICY "Follows visibles por involucrados" ON public.follows
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

DROP POLICY IF EXISTS "Usuarios gestionan sus propios follows" ON public.follows;
CREATE POLICY "Usuarios gestionan sus propios follows" ON public.follows
  FOR ALL USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- 13. AUTOMATIZACIÓN: CREACIÓN DE PERFIL AL REGISTRO
DO $$
BEGIN
    -- Asegurar que la publicación existe (por si acaso)
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    -- Añadir tablas de forma segura (idempotente)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, cover_url, username, role, is_verified)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'cover_url',
    NULL, -- Username inicia vacío por seguridad y confidencialidad
    CASE WHEN new.email = 'noviovirtual.latino@gmail.com' THEN 'super_admin' ELSE 'user' END,
    CASE WHEN new.email = 'noviovirtual.latino@gmail.com' THEN true ELSE false END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 12. OPTIMIZACIONES DE RENDIMIENTO (ÍNDICES)
-- Índices compuestos para búsquedas rápidas de conversaciones
CREATE INDEX IF NOT EXISTS idx_messages_participants ON public.messages (sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, is_read) WHERE is_read = FALSE;

-- 13. POLÍTICAS DE ELIMINACIÓN DE MENSAJES (VACÍAR/ELIMINAR CHATS)
DROP POLICY IF EXISTS "Usuarios eliminan sus propios mensajes" ON public.messages;
CREATE POLICY "Usuarios eliminan sus propios mensajes" ON public.messages
  FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_super_admin());

-- 14. FUNCIÓN RPC PARA OBTENER CONVERSACIONES (MÁXIMA ESCALABILIDAD)
-- Esta función permite obtener la lista de chats con el último mensaje y conteo de no leídos de forma eficiente.
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id UUID)
RETURNS TABLE (
    other_user_id UUID,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT,
    profile JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_messages AS (
        SELECT DISTINCT ON (
            CASE WHEN sender_id < receiver_id THEN sender_id ELSE receiver_id END,
            CASE WHEN sender_id < receiver_id THEN receiver_id ELSE sender_id END
        )
        sender_id, receiver_id, content, created_at
        FROM public.messages
        WHERE sender_id = p_user_id OR receiver_id = p_user_id
        ORDER BY 
            CASE WHEN sender_id < receiver_id THEN sender_id ELSE receiver_id END,
            CASE WHEN sender_id < receiver_id THEN receiver_id ELSE sender_id END,
            created_at DESC
    )
    SELECT 
        (CASE WHEN lm.sender_id = p_user_id THEN lm.receiver_id ELSE lm.sender_id END) as other_user_id,
        lm.content as last_message,
        lm.created_at as last_message_at,
        (
            SELECT count(*) 
            FROM public.notifications n 
            WHERE n.user_id = p_user_id 
            AND n.sender_id = (CASE WHEN lm.sender_id = p_user_id THEN lm.receiver_id ELSE lm.sender_id END)
            AND n.is_read = FALSE
            AND n.type = 'message'
        ) as unread_count,
        to_jsonb(p) as profile
    FROM latest_messages lm
    JOIN public.profiles p ON p.id = (CASE WHEN lm.sender_id = p_user_id THEN lm.receiver_id ELSE lm.sender_id END)
    ORDER BY lm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. TABLA DE SUSCRIPCIONES PUSH
-- Almacena los endpoints y claves de los navegadores para enviar notificaciones push.
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios gestionan sus propias suscripciones" ON public.push_subscriptions;
CREATE POLICY "Usuarios gestionan sus propias suscripciones" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- 16. NOTA SOBRE STORAGE
-- Crea un bucket llamado 'media' en el Dashboard de Supabase y ponlo como público.
