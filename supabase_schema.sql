-- ============================================================
-- Supabase Schema & Row Level Security (RLS) Policies
-- Urban Solar Power Generation & Grid Load Forecasting
-- ============================================================

-- 1. Create solar_predictions table
CREATE TABLE IF NOT EXISTS public.solar_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    temperature NUMERIC NOT NULL,
    humidity NUMERIC NOT NULL,
    cloud_cover NUMERIC NOT NULL,
    shortwave_radiation NUMERIC NOT NULL,
    zenith NUMERIC NOT NULL,
    angle_of_incidence NUMERIC NOT NULL,
    predicted_power NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create grid_predictions table
CREATE TABLE IF NOT EXISTS public.grid_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    solar_power NUMERIC NOT NULL,
    consumption NUMERIC NOT NULL,
    forecast_period NUMERIC NOT NULL,
    power_balance NUMERIC NOT NULL,
    energy_balance NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create power_plants table
CREATE TABLE IF NOT EXISTS public.power_plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    city TEXT NOT NULL,
    area TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_city_area UNIQUE (city, area)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.solar_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grid_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_plants ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for solar_predictions
DROP POLICY IF EXISTS "Users can view their own solar predictions" ON public.solar_predictions;
CREATE POLICY "Users can view their own solar predictions"
    ON public.solar_predictions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own solar predictions" ON public.solar_predictions;
CREATE POLICY "Users can insert their own solar predictions"
    ON public.solar_predictions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own solar predictions" ON public.solar_predictions;
CREATE POLICY "Users can update their own solar predictions"
    ON public.solar_predictions FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own solar predictions" ON public.solar_predictions;
CREATE POLICY "Users can delete their own solar predictions"
    ON public.solar_predictions FOR DELETE
    USING (auth.uid() = user_id);

-- 6. RLS Policies for grid_predictions
DROP POLICY IF EXISTS "Users can view their own grid predictions" ON public.grid_predictions;
CREATE POLICY "Users can view their own grid predictions"
    ON public.grid_predictions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own grid predictions" ON public.grid_predictions;
CREATE POLICY "Users can insert their own grid predictions"
    ON public.grid_predictions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own grid predictions" ON public.grid_predictions;
CREATE POLICY "Users can update their own grid predictions"
    ON public.grid_predictions FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own grid predictions" ON public.grid_predictions;
CREATE POLICY "Users can delete their own grid predictions"
    ON public.grid_predictions FOR DELETE
    USING (auth.uid() = user_id);

-- 7. RLS Policies for power_plants
DROP POLICY IF EXISTS "Users can view their own power plants" ON public.power_plants;
CREATE POLICY "Users can view their own power plants"
    ON public.power_plants FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own power plants" ON public.power_plants;
CREATE POLICY "Users can insert their own power plants"
    ON public.power_plants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own power plants" ON public.power_plants;
CREATE POLICY "Users can update their own power plants"
    ON public.power_plants FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own power plants" ON public.power_plants;
CREATE POLICY "Users can delete their own power plants"
    ON public.power_plants FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- 8. Create energy_notifications table & RLS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.energy_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_plant_id UUID NOT NULL REFERENCES public.power_plants(id) ON DELETE CASCADE,
    target_plant_id UUID NOT NULL REFERENCES public.power_plants(id) ON DELETE CASCADE,
    surplus_energy_kw NUMERIC NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on energy_notifications
ALTER TABLE public.energy_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for energy_notifications
DROP POLICY IF EXISTS "Users can view notifications for their target plant" ON public.energy_notifications;
CREATE POLICY "Users can view notifications for their target plant"
    ON public.energy_notifications FOR SELECT
    USING (target_plant_id IN (SELECT id FROM public.power_plants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.energy_notifications;
CREATE POLICY "Authenticated users can insert notifications"
    ON public.energy_notifications FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update notifications for their target plant" ON public.energy_notifications;
CREATE POLICY "Users can update notifications for their target plant"
    ON public.energy_notifications FOR UPDATE
    USING (target_plant_id IN (SELECT id FROM public.power_plants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete notifications for their target plant" ON public.energy_notifications;
CREATE POLICY "Users can delete notifications for their target plant"
    ON public.energy_notifications FOR DELETE
    USING (target_plant_id IN (SELECT id FROM public.power_plants WHERE user_id = auth.uid()));

-- ============================================================
-- 9. Secure RPC Function for Account Deletion (Self-deletion)
-- ============================================================
-- Allows authenticated users to permanently delete their own account from auth.users.
-- All related rows in power_plants, solar_predictions, grid_predictions, and energy_notifications
-- are automatically removed via ON DELETE CASCADE.

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Ensure only the authenticated user can delete their own record
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Delete user from auth.users (cascades to all user-owned tables)
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;


