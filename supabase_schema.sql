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

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.solar_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grid_predictions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for solar_predictions
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

-- 5. RLS Policies for grid_predictions
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
